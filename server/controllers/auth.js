var _ = require('lodash'),
    vow = require('vow'),
    inherit = require('inherit'),
    Logger = require('bem-site-logger'),
    BaseController = require('./base.js'),
    util = require('../util.js');

module.exports = inherit(BaseController, {

    __constructor: function (config) {
        this.__base(config);
        this._logger = Logger.setOptions(this._config['logger']).createLogger(module);
    },

    login: function (req, res) {
        var token = this.getCookie(req).token;

        if (token) {
            return this._doRedirect(req, res, 303, 'login');
        }

        return this._auth.sendAuthRequest(req, res);
    },

    loginCallback: function (req, res) {
        var code = req.query && req.query.code,
            strUrl = 'login_callback';

        if (!code || code && this._auth.getUserCookie(req, 'forum_user')) {
            return this._doRedirect(req, res, 303, strUrl);
        }

        function onSuccess (req, res, token) {
            // get user login
            return this._model.getAuthUser(req, token)
                .then(function (result) {
                    if (!result) {
                        this._logger.error('Can`t get user info after login, result is empty');
                        return this._doRedirect(req, res, 500, strUrl);
                    }
                    this._auth.setUserCookie(res, 'forum_user', token, result.login);

                    return this._doRedirect(req, res, 303, strUrl);
                }, this)
                .fail(function (err) {
                    this._logger.error('Can`t get user info after login %s', err);
                    return this._doRedirect(req, res, 500, strUrl);
                }, this);
        }

        function onError (req, res, err) {
            this._logger.error('Can`t get access token %s', err);
            return this._doRedirect(req, res, 500, strUrl);
        }

        return this._auth.getAccessToken(req, res, code, function (err, token) {
            if (err) {
                return onError.call(this, req, res, err);
            }

            return onSuccess.call(this, req, res, token);
        }.bind(this));
    },

    logout: function (req, res) {
        var token = this._auth.getUserCookie(req, 'forum_user');

        if (token) {
            this._auth.delUserCookie(res, 'forum_user', '/');
        }

        return this._doRedirect(req, res, 303, 'logout');
    },

    _doRedirect: function (req, res, statusCode, urlPart) {
        var previousUrl = this.getPreviousUrl(req);

        res.location(previousUrl ? previousUrl : req.url.replace(urlPart, ''));
        return res.status(statusCode).end();
    }
});
