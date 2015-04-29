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
    _getCommon: function (req, res) {
        var _this = this,
            def = vow.defer(),
            userCookie = this._auth.getUserCookie(req, 'forum_user'),
            token = userCookie ? userCookie[0] : null,
            name = userCookie ? userCookie[1] : null;

        vow.all({
            user: this._model.getAuthUser(req, token, name)
        }).then(function (data) {

            // set previous url for correct login redirect
            _this.setPreviousUrl(req);

            // collect user data
            res.locals.forum = _.extend(_this.getLocalData(res), data, _this.getTmplHelpers(req));

            return def.resolve();

        }).fail(function (err) {
            return def.reject(err);
        });

        return def.promise();
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
            userCookie = this._auth.getUserCookie(req, 'forum_user'),
            token = userCookie ? userCookie[0] : null;

        return this._getCommon(req, res)
            .then(function () {
                return vow.all({
                    issues: _this._model.getIssues(req, token),
                    labels: _this._model.getLabels(token, req.lang)
                });
            })
            .then(function (data) {

                // collect user data
                res.locals.forum = _.extend(_this.getLocalData(res), {
                    issues: data.issues,
                    labels: data.labels,
                    view: 'issues',
                    isHidePagination: data.hidePagination
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
            token = req.cookies && req.cookies['forum_token'],
            lang = req.lang,
            id = req.params.issue_id;

        return this._getCommon(req, res)
            .then(function () {
                return vow.all({
                    title: this._model.getTitle(lang, id),
                    issue: this._model.getIssue(token, id, lang),
                    comments: this._model.getComments(token, id)

                });
            })
            .then(function () {
                req.locals.forum = _.extend(_this.getLocalData(req), data, { view: 'issue' });

                return next();
            })
            .fail(function (err) {
                return next(err);
            });
    }
});