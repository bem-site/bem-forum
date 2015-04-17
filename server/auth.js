var _ = require('lodash'),
    OAuth2 = require("oauth").OAuth2,
    Logger = require('bem-site-logger');

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

    /**
     * Send auth request
     * @param req - {Object} request object
     * @param res - {Object} response object
     */
    sendAuthRequest: function (req, res) {
        res.writeHead(303, {
            Location: this._getOauth().getAuthorizeUrl({
                redirect_uri: this._config.auth.redirectUrl,
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
    getAccessToken: function (req, res, code, cb) {
        this._getOauth().getOAuthAccessToken(code, {}, cb);
    },

    getUserCookie: function (req, name, onlyToken) {
        var userCookie = req.cookies && req.cookies[name];

        if (!userCookie) return '';

        userCookie = userCookie.split(';;');

        if (onlyToken) {
            return userCookie[0];
        }

        return userCookie;
    },

    setUserCookie: function (res, cookieName, access_token, username) {
        var expires = new Date(Date.now() + (86400000 * 5)),
            value = [access_token, username].join(';;'); // 5 days

        res.cookie(cookieName, value, { expires: expires, httpOnly: true });
    },

    delUserCookie: function (res, cookieName, path) {
        res.clearCookie(cookieName, { path: path });
    },

    _createOauth: function () {
        var oAuth = this._config.auth;

        if (!oAuth) {
            this._logger.error('Invalid oauth configuration');
            process.exit(1);
        }

        this._oAuth2 = new OAuth2(oAuth.clientId, oAuth.secret,
            "https://github.com/",
            "login/oauth/authorize",
            "login/oauth/access_token");
    },

    _getOauth: function () {
        return this._oAuth2;
    }
};

module.exports = Auth;
