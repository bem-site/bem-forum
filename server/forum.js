var _ = require('lodash'),
    vow = require('vow'),
    mime = require('mime-types'),

    github = require('./github'),
    auth = require('./auth'),
    template = require('./template'),
    routes = require('./routes'),

    baseUrl = '/forum';

module.exports = function(pattern, options) {

    baseUrl = pattern || baseUrl;

    routes.init(baseUrl);
    auth.init(options);

    github.init(options).addDefaultAPI();

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

        // get access token after redirect from github.com
        if('index' === action && query.code) {
            return auth.getAccessToken(req, res, query.code);
        }

        // for all non get requests and when forum token cookie is not exists
        // send request for user authorization
        if((!isGetRequest || 'auth' === action) && !req.cookies['forum_token']) {
            return auth.sendAuthRequest(req, res);
        }

        token = req.cookies['forum_token'];
        token && github.addUserAPI(token);

        if(!action) {
            res.writeHead(500);
            res.end('Action was not found');
            return;
        }

        options = (isGetRequest || isDeleteRequest ? query : req.body) || {};

        var templateCtx = {
            getIssues:     { block: 'issues' },
            getIssue:      { block: 'issue', mods: { view: 'full' } },
            createIssue:   { block: 'issue' },
            editIssue:     { block: 'issue' },
            getComments:   { block: 'comments', mods: { view: 'close' }, issueNumber: options.number },
            createComment: { block: 'comment', issueNumber: options.number },
            editComment:   { block: 'comment', issueNumber: options.number },
            getAuthUser:   { block: 'user', mods: { view: 'header' } },
            getLabels:     { block: 'forum-labels', mods: { view: options.view }}
        };

        // for access in templates
        req.baseUrl = baseUrl;

        if(!req.xhr) {
            // collect all required data for templates
            var promises = {
                repo: github.getRepoInfo.call(github, token, options),
                user: github.getAuthUser.call(github, token, options),
                labels: github.getLabels.call(github, token, options)
            };

            if(options.number) {
                // get issue data, that have a number option
                _.extend(promises, {
                    issue: github.getIssue.call(github, token, options),
                    comments: github.getComments.call(github, token, options),
                    view: 'issue'
                });
            } else {
                _.extend(promises, {
                    issues: github.getIssues.call(github, token, options),
                    view: 'issues'
                });
            }

            return vow.all(promises).then(function(values) {
                req.__data = req.__data || {};
                req.__data.forum = values;

                return next();
            });
        } else {
            // ajax get data
            return github[action].call(github, token, options)
                .then(function(data) {
                    if('json' === query.__mode) {
                        res.json(data);
                        return;
                    }

                    return template.run(_.extend(templateCtx[action] || {}, { data: data }), req);
                })
                .then(function(html) {
                    res.end(html);
                })
                .fail(function(err) {
                    res.end(err);
                });
        }
    };
};
