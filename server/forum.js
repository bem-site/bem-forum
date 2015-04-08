var _ = require('lodash'),
    vow = require('vow'),
    express = require('express'),
    auth = require('./auth'),
    model = require('./model'),
    template = require('./template'),
    util = require('./util');

module.exports = function (app, config) {

    var url = config.url,
        router = express.Router(),
        apiRouter = require('./routes/api.js')(),

        Controller = require('server/controller.js');

    /**
     * INIT SECTION
     */
    var controller = new Controller(config);

    /**
     * Handler for every request match on this router
     * Collect baseData (Labels)
     */
    router.get('*', controller.base);

    /**
     * INDEX PAGE ROUTE
     */
    router.get('/', controller.index);

    /**
     * ISSUE`s page
     */
    router.get('/issues/:issue_id', controller.issue);

    /**
     * Routers use
     */
    app.use(url, router);
    app.use(url, apiRouter);































    //auth.init(config);
    //template.init(config);
    //model.init(config);

    // jscs:disable requireCamelCaseOrUpperCaseIdentifiers
    //var ownerToken = config.owner_token,
    // jscs:enable requireCamelCaseOrUpperCaseIdentifiers

        // for check, if user checked at least one label
        // for create/edit issue forms - knowledge is taken
        // from common config website
        //labelsRequired = config.labelsRequired,
        //forumDebug = config.debug;

    return function (req, res, next) {
        return next();

        var route = routes.getRoute(req.url, req.method),
            query,
            action,
            method,
            token,
            config,
            isGetRequest,
            isDeleteRequest;

        query = route[1]; // params hash
        route = route[0]; // route object

        // get action that should be called
        action = route.getName();
        method = route.getData().method;

        isGetRequest = method === 'GET';
        isDeleteRequest = method === 'DELETE';

        // get access token after redirect
        if (action === 'index' && query.code) {
            return auth.getAccessToken(req, res, query.code);
        }

        // for all non get requests and when forum token cookie is not exists
        // send request for user authorization
        if ((!isGetRequest || action === 'auth') && (!req.cookies || !req.cookies['forum_token'])) {
            return auth.sendAuthRequest(req, res);
        }

        token = req.cookies['forum_token'];
        token && model.addUserAPI(token);

        if (!action) {
            res.writeHead(500);
            res.end('Action was not found');
            return;
        }

        config = (isGetRequest || isDeleteRequest ? query : req.body) || {};

        // set forum lang
        config.lang = req.lang;

        // for access in templates
        req = _.extend(req, {
            forumUrl: forumPath,
            labelsRequired: labelsRequired,
            util: util,
            csrf: req.csrfToken()
        });

        var templateCtx = {
            getIssues:     { block: 'forum-issues' },
            getIssue:      { block: 'issue' },
            createIssue:   { block: 'issue', forumUrl: req.forumUrl, labelsRequired: req.labelsRequired, csrf: req.csrf },
            editIssue:     { block: 'issue', forumUrl: req.forumUrl, labelsRequired: req.labelsRequired, csrf: req.csrf },
            getComments:   { block: 'comments', mods: { view: 'close' }, issueNumber: config.number, forumUrl: req.forumUrl },
            createComment: { block: 'comment', issueNumber: config.number, forumUrl: req.forumUrl, csrf: req.csrf },
            editComment:   { block: 'comment', issueNumber: config.number, forumUrl: req.forumUrl, csrf: req.csrf },
            getLabels:     { block: 'forum-labels', mods: { view: config.view } }
        };

        // get full page from server on first enter
        if (!req.xhr) {
            // collect all required data for templates
            var promises = {
                user: model.getAuthUser(token, config),
                labels: model.getLabels(token, config)
            };

            if (config.number) {
                // get issue data, that have a number option
                _.extend(promises, {
                    issue: model.getIssue(token, config),
                    comments: model.getComments(token, config),
                    view: 'issue'
                });
            } else {
                _.extend(promises, {
                    issues: model.getIssues(token, config),
                    view: 'issues'
                });
            }

            return vow.all(promises)
                .then(function (values) {
                    req.__data = req.__data || {};
                    req.__data.forum = values;
                    req.__data.forum.labelsRequired = labelsRequired;
                    req.__data.forum.postPerPage = 10;

                    setPageTitle(req);

                    // set global params window.forum.{params}
                    req.__data.forum.global = {
                        debug: (forumDebug && config.debug === 'true')
                    };

                    return next();
                })
                .fail(function (err) {
                    console.error(err);
                });
        } else {
            // ajax requests
            var result = {};

            // do something with owner right,
            // e.g. add labels when user create/edit issue
            if (query.__access === 'owner' && ownerToken) {
                token = ownerToken;
                model.addUserAPI(token);
            }

            // create issue without checked labels - default behaviors
            var isIssueAction = (action === 'createIssue' || action === 'editIssue');

            if ((isIssueAction && !config.labels) || (isIssueAction && !ownerToken)) {
                config.labels = [];
            }

            // get data by ajax
            return model[action](token, config)
                .then(function (data) {
                    if (query.__mode === 'json') {
                        res.json(data);
                        return;
                    }

                    // check if current page is last for paginator
                    if (action === 'getIssues') {
                        result.isLastPage = (!data.length || data.length < 10)
                    }

                    return template.run(_.extend(templateCtx[action] || {}, { data: data }), req);
                })
                .then(function (html) {
                    if (action === 'getIssues') {
                        result.html = html;
                        res.json(result);
                    } else {
                        res.end(html);
                    }
                })
                .fail(function (err) {
                    res.end(err);
                });
        }
    };
};

function setPageTitle(req) {
    // i18 object for page title
    var i18n = {
            ru: {
                title: 'Форум / БЭМ. Блок, Элемент, Модификатор'
            },
            en: {
                title: 'Forum / BEM. Block, Element, Modifier'
            }
        },
        lang = req.lang,
        isLangSupport = lang ? ['ru', 'en'].some(function (supportLang) {
            return supportLang === lang;
        }) : false,
        baseTitle = isLangSupport ? i18n[lang].title : '',
        data = req.__data,
        forum = data.forum,
        issue = forum.issue;

    data.title = (forum.view === 'issue' ? '#' + issue.number + ' ' + issue.title + ' / ' : '') + baseTitle;
}
