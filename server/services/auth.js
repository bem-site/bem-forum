/**
 * Module for oAuth2 authorization using Github
 *
 * Authorization takes place in 2 stages:
 *
 * Step 1 - redirect the client on Github, where, after entry and confirmation of the user,
 * Github returns the user to the address of the application's callback {forum-url}/login_callback
 * with the special query value(time code)
 *
 * Step 2 - new send the request on Github with the received code,
 * if the code is verified, receives a response from Github,
 * together with the token issued to the user that will be used to work with the Github API
 * on behalf of the user.
 */
var inherit = require('inherit'),
    OAuth2 = require('oauth').OAuth2,
    Logger = require('bem-site-logger'),
    Auth;

module.exports = Auth = inherit({
    _oAuth2: [],

    __constructor: function (config) {
        this._config = config;
        this._logger = Logger.setOptions(this._config.logger).createLogger(module);
        this._initOauth();
    },

    /**
     * Sending user on Github to confirm authorization
     * and received the time code to get the user token
     * @param req {Object}
     * @param res {Object}
     */
    sendAuthRequest: function (req, res) {
        res.writeHead(303, {
            Location: this._oAuth2.getAuthorizeUrl({
                redirect_uri: this._config.auth.redirectUrl,
                scope: 'public_repo'
            })
        });

        res.end();
    },

    /**
     * Send request for get user access token from Github
     * @param req {Object}
     * @param res {Object}
     * @param code {String} secret code as param for token retrieving
     * @param cb {Function} callback
     */
    getAccessToken: function (req, res, code, cb) {
        return this._oAuth2.getOAuthAccessToken(code, {}, cb);
    },

    /**
     * Initialization of a class oAuth2
     * IMPORTANT! Exit the application if the module was created,
     * but the config is not specified the settings for oAuth authorization
     * @private
     */
    _initOauth: function () {
        var auth = this._config.auth;

        if (!auth) {
            this._logger.error('Invalid oauth configuration');
            process.exit(1);
        }

        this._oAuth2 = new OAuth2(auth.clientId, auth.clientSecret,
            'https://github.com/',
            'login/oauth/authorize',
            'login/oauth/access_token');
    }
}, {
    getInstance: function (config) {
        if (!this._instance) {
            this._instance = new Auth(config);
        }

        return this._instance;
    }
});
