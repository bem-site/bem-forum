var _ = require('lodash'),
    github = require('./github'),
    OAuth2 = require("oauth").OAuth2,
    Logger = require('bem-site-logger'),

    oauth,
    options,
    getOauth = function (req) {
        return oauth[req.host] || oauth;
    },
    getRedirectUrl = function (req) {
        var c = options.oauth[req.host] || options.oauth;

        return c.redirectUrl;
    };

function Auth(config) {
    this._init(config);
}

Auth.prototype = {

    _oAuth2: [],

    _init: function (config) {
        this._config = config;
        this._logger = Logger.setOptions(this._config['logger']).createLogger(module);
        this._createOauth();
    },

    sendAuthRequest: function (site, req, res) {
        res.writeHead(303, {
            Location: this._getOauth().getAuthorizeUrl({
                redirect_uri: getRedirectUrl(req),
                scope: 'public_repo',
                state: 'bem-info-forum-platform-authorization'
            })
        });

        res.end();
    },

    _createOauth: function () {
        var oAuth = this._config.oauth;

        if (!oAuth) {
            this._logger.error('Invalid oauth configuration');
            process.exit();
        }

        this._oAuth2 = new OAuth2(oAuth.clientId, clientId.secret,
            "https://github.com/",
            "login/oauth/authorize",
            "login/oauth/access_token");
    },

    _getAccessToken: function (req, res, code) {

    },

    _getOauth: function () {
        return this._oAuth2;
    },

    _getRedirectUrl: function (req) {

    }
};

module.exports = Auth;

module.exports = {

    init: function (opts) {

        options = opts || {};
        oauth = (function () {
            var config = options.oauth;


            if (!config || !_.isObject(config) || _.isEmpty(config)) {
                throw new Error('Invalid oauth configuration');
            }

            if (config['clientId'] && config['secret']) {
                return createOauth(config['clientId'], config['secret']);
            }

            return Object.keys(config).reduce(function (prev, key) {
                prev[key] = createOauth(config[key]['clientId'], config[key]['secret']);
                return prev;
            }, {});
        })();
    },

    /**
     * Send auth request
     * @param req - {Object} request object
     * @param res - {Object} response object
     */
    sendAuthRequest: function (req, res) {

        res.writeHead(303, {
            Location: getOauth(req).getAuthorizeUrl({
                redirect_uri: getRedirectUrl(req),
                scope: 'public_repo'
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
    getAccessToken: function (req, res, code) {
        getOauth(req).getOAuthAccessToken(code, {}, function (err, access_token) {
            if (err) {
                res.writeHead(500);
                res.end(err);
                return;
            }

            github
                .addUserAPI(access_token)
                .getAuthUser(access_token, {})
                .then(function (data) {
                    var expires = new Date(Date.now() + (86400000 * 5)); // 5 days

                    res.cookie('forum_token', access_token, { expires: expires });
                    res.cookie('forum_username', data.login, { expires: expires });

                    res.writeHead(303, { Location: getRedirectUrl(req) });
                    res.end();
                });
        });
    }
}
