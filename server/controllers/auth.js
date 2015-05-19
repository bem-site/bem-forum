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

    /**
     * The controller log on to the forum
     * 1. If the user has already been authenticated,
     * redirect to the previous page to avoid re-authorization
     * 2. Send user on github for authorization оAuth
     * @param req
     * @param res
     * @returns {*}
     */
    login: function (req, res) {
        var token = this.getCookie(req).token;

        if (token) {
            return this._doRedirect(req, res, 303, 'login');
        }

        return this._auth.sendAuthRequest(req, res);
    },

    /**
     * A controller for processing redirects to github
     * 1. After the user has successfully logged in,
     * github redirected us to this url with a query parameter code.
     * If there is no code or the user has already been authenticated
     * and tried to open this url - redirect it to a previous page
     * 2.The second step send the request to github for oAuth authorization with the received code
     * 3. If all goes well and we got the token,
     * save it and the user name with special cookies and redirect the user to page which he logged
     * @param req
     * @param res
     * @returns {*}
     */
    loginCallback: function (req, res) {
        var code = req.query && req.query.code,
            urlPart = 'login_callback';

        if (!code || code && this.getUserCookie(req, 'forum_user')) {
            return this._doRedirect(req, res, 303, urlPart);
        }

        return this._auth.getAccessToken(req, res, code, function (err, token) {
            if (err) {
                return this._onErrorGetToken(req, res, urlPart, err);
            }

            return this._onSuccessGetToken(req, res, urlPart, token);

        }.bind(this));
    },

    /**
     * Controller for logout
     * 1. If the user was not authorized and tried to open /logout- redirect him
     * to the previous page
     * 2. Remove the cookie of the user and redirect him to the previous page
     * @param req
     * @param res
     * @returns {*}
     */
    logout: function (req, res) {
        var token = this.getUserCookie(req, 'forum_user');

        if (token) {
            this.delUserCookie(res, 'forum_user', '/');
        }

        return this._doRedirect(req, res, 303, 'logout');
    },

    /**
     * Redirect user
     * 1. The address code and the answer depends on the validity of the authorization
     * and the presence in the session of the user knowledge about the page
     * with which he began the entrance/exit from the forum
     * 2. If session is nothing from url cut off the part
     * that the passed parameter urlPart and redirecting.
     * For example it was '/login' became '/'
     * @param req {Object}
     * @param res {Object}
     * @param statusCode {Number} - 303, 500, etc
     * @param urlPart {String} - Part of the url that needs to be cut
     * if the session user does not have knowledge about the previous visited page
     * @returns {*}
     * @private
     */
    _doRedirect: function (req, res, statusCode, urlPart) {
        var previousUrl = this.getPreviousUrl(req);

        res.location(previousUrl ? previousUrl : req.url.replace(urlPart, ''));
        return res.status(statusCode).end();
    },

    /**
     * The handler success attempts got a user token base on code received from github
     * 1. Get user data by using the obtained in the previous step token,
     * 2. if all is well, we write the token and the user name in a special cookie
     * @param req {Object}
     * @param res {Object}
     * @param urlPart {String} - Part of the url that needs to be cut
     * @param token {Number} - user token
     * @returns {*}
     * @private
     */
    _onSuccessGetToken: function (req, res, urlPart, token) {
        return this._model.getAuthUser(req, token)
            .then(function (result) {

                if (!result) {
                    this._logger.error('Can`t get user info after login, result is empty');
                    return this._doRedirect(req, res, 500, urlPart);
                }

                this.setUserCookie(res, 'forum_user', token, result.login);
                return this._doRedirect(req, res, 303, urlPart);

            }, this)
            .fail(function (err) {
                this._logger.error('Can`t get user info after login %s', err);
                return this._doRedirect(req, res, 500, urlPart);
            }, this);
    },

    /**
     * The handler failed attempts got a user token base on code received from github
     * @param req {Object}
     * @param res {Object}
     * @param urlPart {String}
     * @param err
     * @returns {*}
     * @private
     */
    _onErrorGetToken: function (req, res, urlPart, err) {
        this._logger.error('Can`t get access token %s', err);
        return this._doRedirect(req, res, 500, urlPart);
    }
});
