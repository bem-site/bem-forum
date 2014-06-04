var url = require('url'),
    querystring = require("querystring"),

    _ = require('lodash'),
    vow = require('vow'),
    OAuth2 = require("oauth").OAuth2,

    github = require('./github'),
    config = require('./config'),
    template = require('./template'),
    routes = require('./routes'),

    baseUrl = '/forum',
    blockHash = {
        getIssues: { block: 'forum', mods: { view: 'issues' }},
        getIssue:  { block: 'forum', mods: { view: 'issue' }},
        getComments: { block: 'comments' },
        createComment: { block: 'comment' }
    },
    oauth = (function() {
        var _config = config.get('github:oauth'),
            createOauth = function(id, secret) {
                return new OAuth2(id, secret,
                    "https://github.com/", "login/oauth/authorize", "login/oauth/access_token");
            };

        if(!_config || !_.isObject(_config) || _.isEmpty(_config)) {
            throw new Error('Invalid oauth configuration');
        }

        if(_config['clientId'] && _config['secret']) {
            return createOauth(_config['clientId'], _config['secret']);
        }

        return Object.keys(_config).reduce(function(prev, key) {
            prev[key] = createOauth(_config[key]['clientId'], _config[key]['secret']);
            return prev;
        }, {});
    })();

module.exports = function(pattern) {
    baseUrl = pattern || baseUrl;
    routes.init(baseUrl);

    return function(req, res, next) {
        var _oauth = oauth[req.host] || oauth,
            _config = config.get('github:oauth')[req.host] || config.get('github:oauth'),

            redirectUrl = _config.redirectUrl,
            route = routes.getRoute(req.url, req.method),
            query,
            action;

        //if request is not forum request then call nex middleware in stack
        if(!route) {
            next();
            return;
        }

        query = route[1]; //params hash
        route = route[0]; //route object

        //check for cookie and non-callback
        //send request for user authorization
        if(!req.cookies['forum_token'] && !query.code) {
            res.writeHead(303, {
                Location: _oauth.getAuthorizeUrl({
                    redirect_uri: redirectUrl,
                    scope: "user,repo,gist"
                })
            });
            res.end();
            return;
        }

        //send request for retrieve access token by code
        if(query.code) {
            _oauth.getOAuthAccessToken(query.code, {}, function (err, access_token) {
                if (err) {
                    res.writeHead(500);
                    res.end(err);
                    return;
                }

                res.cookie('forum_token', access_token, { expires: new Date(Date.now() + 86400000) });
                res.writeHead(303, { Location: redirectUrl });
                res.end();
            });
            return;
        }

        //authorize user and set his api to hash by his cookie token
        github.addUserAPI(req.cookies['forum_token']);

        //get action that should be called
        action = route.getName();

        if(!action || !github[action]) {
            //res.writeHead(500);
            //res.end('Action was not found');
            next();
            return;
        }

        var options = 'GET' !== route.getData().method ? req.body : query;
        options = options || {};


        return github[action]
            .call(github, req.cookies['forum_token'], options)
            .then(function(data) {

                console.log('NEW comment', data);

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
