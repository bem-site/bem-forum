var url = require('url'),
    querystring = require("querystring"),

    _ = require('lodash'),
    vow = require('vow'),
    OAuth2 = require("oauth").OAuth2,

    github = require('./github'),
    auth = require('./auth'),
    config = require('./config'),
    template = require('./template'),
    routes = require('./routes'),

    baseUrl = '/forum',
    blockHash = {
        getIssues: { block: 'forum', mods: { view: 'issues' }},
        getIssue:  { block: 'forum', mods: { view: 'issue' }},
        getComments: { block: 'comments' },
        createComment: { block: 'comment' }
    };

module.exports = function(pattern) {

    baseUrl = pattern || baseUrl;

    routes.init(baseUrl);
    auth.init();

    github.addDefaultAPI();

    return function(req, res, next) {
        var route = routes.getRoute(req.url, req.method),
            query,
            action,
            token,
            isGetRequest;

        //if request is not forum request then call nex middleware in stack
        if(!route) {
            next();
            return;
        }

        query = route[1]; //params hash
        route = route[0]; //route object

        //get action that should be called
        action = route.getName();
        isGetRequest = 'GET' === route.getData().method;

        console.log('action: %s method %s', action, route.getData().method);

        if('index' === action) {
            next();
            return;
        }

        //send request for retrieve access token by code
        if(query.code) {
           return auth.getAccessToken(req, res, query);
        }

        // for all non get requests and when forum token cookie is not exists
        // send request for user authorization
        if(!isGetRequest && !req.cookies['forum_token']) {
            return auth.sendAuthRequest(req, res);
        }

        token = req.cookies['forum_token'] || 'default';
        github.addUserAPI(token);

        if(!action || !github[action]) {
            res.writeHead(500);
            res.end('Action was not found');
            return;
        }

        var options = (isGetRequest ? query : req.body) || {};

        return github[action]
            .call(github, token, options)
            .then(function(data) {

                if('json' === query.__mode) {
                    res.json(data);
                    return;
                }
                return data;
            })
            .then(function(data) {
                return template.run(_.extend(blockHash[action] || {}, { data: data }), query.__mode);
            })
            .then(function(html) {
                res.end(html);
            })
            .fail(function(err) {
                res.end(err);
            });
    };
};
