var _ = require('lodash'),
    vow = require('vow'),
    mime = require('mime-types'),

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
        labelsRequired = options.labelsRequired;

    return function(req, res, next) {
        var route = routes.getRoute(req.url, req.method),
            query,
            action,
            method,
            token,
            options,
            isGetRequest,
            isDeleteRequest;

        // fix mime type for block images
        if(!route) {
            res
                .type(mime.lookup(req.url))
                .end();
            return;
        }

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
            util: util
        });

        var templateCtx = {
            getIssues:     { block: 'forum-issues' },
            getIssue:      { block: 'issue' },
            createIssue:   { block: 'issue', forumUrl: req.forumUrl, labelsRequired: req.labelsRequired },
            editIssue:     { block: 'issue', forumUrl: req.forumUrl, labelsRequired: req.labelsRequired },
            getComments:   { block: 'comments', mods: { view: 'close' }, issueNumber: options.number, forumUrl: req.forumUrl },
            createComment: { block: 'comment', issueNumber: options.number, forumUrl: req.forumUrl },
            editComment:   { block: 'comment', issueNumber: options.number, forumUrl: req.forumUrl },
            getLabels:     { block: 'forum-labels', mods: { view: options.view } }
        };

        // get full page from server on first enter
        if(!req.xhr) {
            // collect all required data for templates
            var promises = {
                repo: model.getRepoInfo(token, {}),
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
            }else {
                _.extend(promises, {
                    issues: model.getIssues(token, options),
                    view: 'issues'
                });
            }

            return vow.all(promises)
                .then(function(values) {
                    req.__data = req.__data || {};
                    req.__data.forum = values;

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
                        result.isLastPage = (!data.length || data.length < 30)
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
