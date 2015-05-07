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
     * Base controller, use on every request,
     * that match default`s forum router.
     * 1. Get from model labels by lang and user info by token from req.cookies
     * 2. Extend req.locals.forum with labels and users data
     * @param {Object} req - express js request
     * @param {Object} res - express js response
     * @returns {*}
     */
    _getCommon: function (req, res, next) {
        var _this = this,
            userCookie = this._auth.getUserCookie(req, 'forum_user'),
            token = this.getCookie(req, 'token'),
            name = this.getCookie(req, 'name');

        return vow.all({
            user: this._model.getAuthUser(req, token, name)
        }).then(function (data) {

            // set previous url for correct login redirect
            _this.setPreviousUrl(req);

            // collect user data
            return res.locals = _.extend(res.locals, {
                user: data.user
            }, _this.getTmplHelpers(req));

        }).fail(function (err) {
            return next(err);
        });
    },

    getCommonTitle: function (lang) {
        return this._config.title && this._config.title[lang];
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
        var _this = this,
            token = this.getCookie(req, 'token');

        this._getCommon(req, res, next)
            .then(function () {
                return vow.all({
                    issues: _this._model.getIssues(req, token),
                    labels: _this._model.getLabels(req, token)
                });
            })
            .then(function (data) {
                // collect user data
                res.locals = _.extend(res.locals, {
                    title: req.title || _this.getCommonTitle(req.lang),
                    issues: data.issues,
                    labels: data.labels,
                    view: 'issues',
                    isHidePagination: data.issues.length < _this._config.perPage
                });

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
        var _this = this,
            token = this.getCookie(req, 'token');

        this._getCommon(req, res, next)
            .then(function () {
                return vow.all({
                    // title: this._model.getTitle(lang, id),
                    issue: _this._model.getIssue(req, token),
                    comments: _this._model.getComments(req, token)
                });
            })
            .then(function (data) {
                var issue = data.issue;

                res.locals = _.extend(res.locals, {
                    title: req.title || issue.title + ' / ' + _this.getCommonTitle(req.lang),
                    issue: issue,
                    comments: data.comments,
                    view: 'issue'
                });

                return next();
            })
            .fail(function (err) {
                return next(err);
            });
    }
});
