var _ = require('lodash'),
    vow = require('vow'),

    auth = require('./auth'),
    model = require('./model'),
    template = require('./template'),
    routes = require('./routes'),
    util = require('./util'),

    baseUrl = '/forum/';

module.exports = function(pattern, options) {

    baseUrl = pattern || baseUrl;

    routes.init(baseUrl);
    auth.init(options);
    template.init(options);
    model.init(options);

    var ownerToken = options.owner_token,
        // for check, if user checked at least one label
        // for create/edit issue forms - knowledge is taken
        // from common config website
        labelsRequired = options.labelsRequired,
        forumDebug = options.debug;

    return function(req, res, next) {
        var route = routes.getRoute(req.url, req.method),
            query,
            action,
            method,
            token,
            options,
            isGetRequest,
            isDeleteRequest;

        query = route[1]; //params hash
        route = route[0]; //route object

        //get action that should be called
        action = route.getName();
        method = route.getData().method;

        isGetRequest = 'GET' === method;
        isDeleteRequest = 'DELETE' === method;

        // get access token after redirect
        if('index' === action && query.code) {
            return auth.getAccessToken(req, res, query.code);
        }

        // for all non get requests and when forum token cookie is not exists
        // send request for user authorization
        if((!isGetRequest || 'auth' === action) && (!req.cookies || !req.cookies['forum_token'])) {
            return auth.sendAuthRequest(req, res);
        }

        token = req.cookies['forum_token'];
        token && model.addUserAPI(token);

        if(!action) {
            res.writeHead(500);
            res.end('Action was not found');
            return;
        }

        options = (isGetRequest || isDeleteRequest ? query : req.body) || {};

        // for access in templates
        req = _.extend(req, {
            forumUrl: baseUrl,
            labelsRequired: labelsRequired,
            util: util,
            csrf: 'csrf'
        });

        var templateCtx = {
            getIssues:     { block: 'forum-issues' },
            getIssue:      { block: 'issue' },
            createIssue:   { block: 'issue', forumUrl: req.forumUrl, labelsRequired: req.labelsRequired, csrf: req.csrf },
            editIssue:     { block: 'issue', forumUrl: req.forumUrl, labelsRequired: req.labelsRequired, csrf: req.csrf },
            getComments:   { block: 'comments', mods: { view: 'close' }, issueNumber: options.number, forumUrl: req.forumUrl },
            createComment: { block: 'comment', issueNumber: options.number, forumUrl: req.forumUrl, csrf: req.csrf },
            editComment:   { block: 'comment', issueNumber: options.number, forumUrl: req.forumUrl, csrf: req.csrf },
            getLabels:     { block: 'forum-labels', mods: { view: options.view } }
        };

        // get full page from server on first enter
        if(!req.xhr) {
            // collect all required data for templates
            var promises = {
                user: model.getAuthUser(token, {}),
                labels: model.getLabels (token, {})
            };

            if(options.number) {
                // get issue data, that have a number option
                _.extend(promises, {
                    issue: model.getIssue(token, options),
                    comments: model.getComments(token, options),
                    view: 'issue'
                });
            } else {
                _.extend(promises, {
                    issues: model.getIssues(token, options),
                    view: 'issues'
                });
            }

            return vow.all(promises)
                .then(function(values) {

                    req.__data = req.__data || {};
                    req.__data.forum = values;

                    // i18 object for page title
                    var i18n = {
                            ru: {
                                title: 'Форум / БЭМ. Блок, Элемент, Модификатор'
                            },
                            en: {
                                title: 'Forum / BEM. Block, Element, Modifier'
                            }
                        },
                        lang = req.headers['accept-language'].substr(0,2),
                        data = req.__data,
                        forum = data.forum,
                        issue = forum.issue;

                    data.title = (forum.view === 'issue' ? '#' + issue.number + ' ' + issue.title + ' / ' : '' ) + i18n[lang].title;

                    // set global params window.forum.{params}
                    req.__data.forum.global = {
                        debug: (forumDebug && options.debug === 'true')
                    };

                    return next();
                })
                .fail(function(err) {
                    console.err(err);
                });
        } else {
            // ajax requests
            var result = {};

            // do something with owner right,
            // e.g. add labels when user create/edit issue
            if(query.__access === 'owner' && ownerToken) {
                token = ownerToken;
                model.addUserAPI(token);
            }

            // create issue without checked labels - default behaviors
            var isIssueAction = (action === 'createIssue' || action === 'editIssue');

            if((isIssueAction && !options.labels) || (isIssueAction && !ownerToken)) {
                options.labels = [];
            }

            // get data by ajax
            return model[action](token, options)
                .then(function(data) {
                    if('json' === query.__mode) {
                        res.json(data);
                        return;
                    }

                    // check if current page is last for paginator
                    if('getIssues' === action) {
                        result.isLastPage = (!data.length || data.length < 10)
                    }

                    return template.run(_.extend(templateCtx[action] || {}, { data: data }), req);
                })
                .then(function(html) {
                    if(action === 'getIssues') {
                        result.html = html;
                        res.json(result);
                    } else {
                        res.end(html);
                    }
                })
                .fail(function(err) {
                    res.end(err);
                });
        }
    };
};
