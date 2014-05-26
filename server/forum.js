var url = require('url'),
    querystring = require("querystring"),

    _ = require('lodash'),
    vow = require('vow'),
    OAuth2 = require("oauth").OAuth2,

    github = require('./github'),
    config = require('./config'),
    template = require('./template'),

    urlPattern = /^\/forum\/?/,
    blockHash = {
        getIssues: { block: 'issues' },
        getIssue: { block: 'issue', mods: { view: 'list' }}
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
    urlPattern = pattern || urlPattern;

    return function(req, res, next) {
        var _url = url.parse(req.url),
            _oauth = oauth[req.host] || oauth,
            _config = config.get('github:oauth')[req.host] || config.get('github:oauth'),

            path = _url.pathname || '',
            query = querystring.parse(_url.query),
            redirectUrl = _config.redirectUrl;

        if(!path.match(urlPattern)) {
            next();
            return;
        }

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

        github.addUserAPI(req.cookies['forum_token']);

        var method = path.replace(urlPattern, '');

        if(!github[method]) {
            next();
            return;
        }

        return github[method]
            .call(github, req.cookies['forum_token'], query || {})
            .then(function(data) {
                if('json' === query.__mode) {
                    res.json(data);
                    return;
                }

                return template.run(_.extend(blockHash[method] || {}, { data: data }), query.__mode)
                    .then(function(html) {
                        res.end(html);
                    })
                    .fail(function(err) {
                        res.end(err);
                    });

            })
            .fail(function(err) { res.end(err); });
    };
};
