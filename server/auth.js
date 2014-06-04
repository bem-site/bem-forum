var _ = require('lodash'),

    OAuth2 = require("oauth").OAuth2,
    config = require('./config'),

    oauth,
    getOauth = function(req) {
        return oauth[req.host] || oauth;
    },
    getRedirectUrl = function(req) {
        var _config = config.get('forum:oauth')[req.host] || config.get('forum:oauth');
        return _config.redirectUrl;
    };

module.exports = {

    init: function() {
        oauth = (function() {
            var _config = config.get('forum:oauth'),
                createOauth = function(id, secret) {
                    return new OAuth2(id, secret,
                        "https://github.com/",
                        "login/oauth/authorize",
                        "login/oauth/access_token");
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
    },

    /**
     * Send auth request
     * @param req - {Object} request object
     * @param res - {Object} response object
     */
    sendAuthRequest: function(req, res) {
        res.writeHead(303, {
            Location: getOauth(req).getAuthorizeUrl({
                redirect_uri: getRedirectUrl(req),
                scope: "user,repo,gist"
            })
        });
        res.end();
    },

    /**
     * Send request for retrieve access token
     * @param req - {Object} request object
     * @param res - {Object} response object
     * @param code - {String} secret code as param for token retrieving
     */
    getAccessToken: function(req, res, code) {
        getOauth(req).getOAuthAccessToken(code, {}, function (err, access_token) {
            if (err) {
                res.writeHead(500);
                res.end(err);
                return;
            }

            res.cookie('forum_token', access_token, { expires: new Date(Date.now() + 86400000) });
            res.writeHead(303, { Location: getRedirectUrl(req) });
            res.end();
        });
    }
}
