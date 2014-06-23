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

        //if request is not forum request then call nex middleware in stack
        if(!route) {
            // fix mime type for block images
            res.type(mime.lookup(req.url));

            next();
            return;
        }

        query = route[1]; //params hash
        route = route[0]; //route object

        //get action that should be called
        action = route.getName();
        method = route.getData().method;

        isGetRequest = 'GET' === method;
        isDeleteRequest = 'DELETE' === method;

        if('index' === action) {
            //send request for retrieve access token by code
            if(query.code) {
                return auth.getAccessToken(req, res, query.code);
            } else {
                next();
                return;
            }
        }

        // for all non get requests and when forum token cookie is not exists
        // send request for user authorization
        if((!isGetRequest || 'auth' === action) && !req.cookies['forum_token']) {
            return auth.sendAuthRequest(req, res);
        }

        token = req.cookies['forum_token'];
        token && github.addUserAPI(token);

        if(!action || !github[action]) {
            res.writeHead(500);
            res.end('Action was not found');
            return;
        }

        options = (isGetRequest || isDeleteRequest ? query : req.body) || {};

        var templateCtx = {
            getIssues: { block: 'issues' },
            getIssue:  { block: 'issue', mods: { view: 'full' } },
            createIssue:  { block: 'issue' },
            editIssue:  { block: 'issue' },
            getComments: { block: 'comments', issueNumber: options.number },
            createComment: { block: 'comment', issueNumber: options.number },
            editComment: { block: 'comment', issueNumber: options.number },
            getAuthUser: { block: 'user', mods: { view: 'header' } },
            getLabels: { block: 'forum-labels', mods: { view: options.view }}
        };

//        var start,
//            end;

        return github[action]
            .call(github, token, options)
            .then(function(data) {

                if('json' === query.__mode) {
                    res.json(data);
                    return;
                }

//                if(action === 'getIssues') {
//                    start = new Date();
//                }

                return template.run(_.extend(templateCtx[action] || {}, { data: data }), req);
            })
            .then(function(html) {
//                if(action === 'getIssues') {
//                    end = new Date();
//
//                    console.log('Время компляции: %s секунд', (end - start) / 1000 );
//                }

                res.end(html);
            })
            .fail(function(err) {
                res.end(err);
            });
    };
};
