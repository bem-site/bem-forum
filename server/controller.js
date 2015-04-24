var _ = require('lodash'),
    Model = require('./models/model.js'),
    Auth = require('./auth.js'),
    Logger = require('bem-site-logger'),
    vow = require('vow');

function Controller(config) {
    this._init(config);
}

Controller.prototype = {

    _init: function (config) {
        this._model = new Model(config);
        this._auth = new Auth(config);
        this._config = config;
        this._logger = Logger.setOptions(this._config['logger']).createLogger(module);
    },

    /**
     * Base controller, use on every request,
     * that match default`s forum router.
     * 1. Get from model labels by lang and user info by token from req.cookies
     * 2. Extend req.locals.forum with labels and users data
     * @param {Object} req - express js request
     * @param {Object} res - express js response
     * @returns {*}
     */
    _base: function (req, res) {
        var _this = this,
            def = vow.defer(),
            lang = req.lang,
            userCookie = this._auth.getUserCookie(req, 'forum_user'),
            token = userCookie ? userCookie[0] : null,
            name = userCookie ? userCookie[1] : null;

        vow.all({
            labels: this._model.getLabels(token, lang),
            user: this._model.getAuthUser(req, token, name)
        }).then(function (data) {

            // set previous url for correct login redirect
            _this._setPreviousUrl(req);

            // collect user data
            res.locals.forum = _.extend(_this._getLocalData(res), data);

            return def.resolve();

        }).fail(function (err) {
            return def.reject(err);
        });

        return def.promise();
    },

    login: function (req, res) {
        var token = this._auth.getUserCookie(req, 'forum_user');

        if (token) {
            return this._redirectAfter(req, res, 303, 'login');
        }

        this._auth.sendAuthRequest(req, res);
    },

    loginCallback: function (req, res) {
        var _this = this,
            code = req.query && req.query.code,
            strUrl = 'login_callback';

        if (!code || code && this._auth.getUserCookie(req, 'forum_user')) {
            return this._redirectAfter(req, res, 303, strUrl);
        }

        this._auth.getAccessToken(req, res, code, function (err, token) {

            if (err) {
                _this._logger.error('Can`t get access token %s', err);
                return _this._redirectAfter(req, res, 500, strUrl);
            }

            // get user login
            _this._model.getAuthUser(req, token)
                .then(function (result) {

                    if (!result) {
                        _this._logger.error('Can`t get user info after login, result is empty');
                        _this._redirectAfter(req, res, 500, strUrl);
                        return;
                    }

                    _this._auth.setUserCookie(res, 'forum_user', token, result.login);
                    _this._redirectAfter(req, res, 303, strUrl);
                })
                .fail(function (err) {
                    _this._logger.error('Can`t get user info after login %s', err);
                    _this._redirectAfter(req, res, 500, strUrl);
                });
        });
    },

    logout: function (req, res) {
        var token = this._auth.getUserCookie(req, 'forum_user');

        if (!token) {
            return this._redirectAfter(req, res, 303, 'logout');
        }

        this._auth.delUserCookie(res, 'forum_user', '/');
        this._redirectAfter(req, res, 303, 'logout');
    },

    /**
     * Index page controller
     * 1. Get from model page title and issues list
     * 2. Extend req.locals.forum with data got in 1 item
     * 3. Set for template view type -> 'issues'
     * @param {Object} req - express js request
     * @param {Object} res - express js response
     * @param {Function} next - express js call next middleware
     * @returns {*}
     */
    index: function (req, res, next) {
        var _this = this;
        var userCookie = this._auth.getUserCookie(req, 'forum_user');
        var token = userCookie ? userCookie[0] : null;

        return this._base(req, res)
            .then(function () {
                return _this._model.getIssues(req, token);
            })
            .then(function (data) {
                // collect user data
                res.locals.forum = _.extend(_this._getLocalData(res), { issues: data });

                return next();
            })
            .fail(function (err) {
                return next(err);
            });
    },

    /**
     * Issue page controller
     * 1. Get from model page title, issue, issue`s comments to show on load
     * 2. Extend req.locals with data got in 1 item
     * 3. Set for template view type -> 'issue'
     * @param {Object} req - express js request
     * @param {Object} res - express js response
     * @param {Function} next - express js call next middleware
     * @returns {*}
     */
    issue: function (req, res, next) {
        var token = req.cookies && req.cookies['forum_token'],
            lang = req.lang,
            id = req.params.issue_id;

        return vow.all({
            title: this._model.getTitle(lang, id),
            issue: this._model.getIssue(token, id, lang),
            comments: this._model.getComments(token, id)

        }).then(function (data) {

            req.locals.forum = _.extend(this._getLocalData(req), data, { view: 'issue' });

            return next();
        });
    },

    /**
     * Get forum data from req.locals.forum.
     * p.s. When the forum is used as a separate middleware
     * this method needed for extend data that collect earlier
     * with forum`s data
     * @param {Object} res - express js response
     * @returns {Object} res.local.forum
     * @private
     */
    _getLocalData: function (res) {
        var locals = res.locals;

        return locals.forum ? locals.forum : (locals.forum = {});
    },

    _redirectAfter: function (req, res, statusCode, urlPart) {
        var previousUrl = this._getPreviousUrl(req);

        res.location(previousUrl ? previousUrl : req.url.replace(urlPart, ''));
        return res.status(statusCode).end();
    },

    _getPreviousUrl: function (req) {
        var session = req.session;

        return session && session.previousUrl;
    },

    _setPreviousUrl: function (req) {
        var session = req.session;

        if (session) {
            session.previousUrl = req.url;
        } else {
            this._logger.warn('Add session middleware for correct auth work');
        }
    }
};

module.exports = Controller;
