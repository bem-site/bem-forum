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
        var token = this.getCookie(req, 'token');

        if (token) {
            return this._doRedirect(req, res, 303, 'login');
        }

        this._auth.sendAuthRequest(req, res);
    },

    loginCallback: function (req, res) {
        var _this = this,
            code = req.query && req.query.code,
            strUrl = 'login_callback';

        if (!code || code && this._auth.getUserCookie(req, 'forum_user')) {
            return this._doRedirect(req, res, 303, strUrl);
        }

        this._auth.getAccessToken(req, res, code, function (err, token) {

            if (err) {
                _this._logger.error('Can`t get access token %s', err);
                return _this._doRedirect(req, res, 500, strUrl);
            }

            // get user login
            _this._model.getAuthUser(req, token)
                .then(function (result) {

                    if (!result) {
                        _this._logger.error('Can`t get user info after login, result is empty');
                        _this._doRedirect(req, res, 500, strUrl);
                        return;
                    }

                    _this._auth.setUserCookie(res, 'forum_user', token, result.login);
                    _this._doRedirect(req, res, 303, strUrl);
                })
                .fail(function (err) {
                    _this._logger.error('Can`t get user info after login %s', err);
                    _this._doRedirect(req, res, 500, strUrl);
                });
        });
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
