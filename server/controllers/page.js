var _ = require('lodash'),
    vow = require('vow'),
    inherit = require('inherit'),
    Logger = require('bem-site-logger'),
    BaseController = require('./base.js');

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
     * @param {Object} req
     * @param {Object} res
     * @param {Object} next
     * @returns {*}
     */
    _baseActions: function (req, res, next) {
        var _this = this;

        return this._model
            .getAuthUser(req, this.getCookie(req, 'token'), this.getCookie(req, 'name'))
            .then(function (data) {
                // set previous url for correct login redirect
                _this.setPreviousUrl(req);

                // collect user data
                return res.locals = _.extend(res.locals, {
                    user: data
                }, _this.getTmplHelpers(req));

            }).fail(function (err) {
                return next(err);
            });
    },

    _getPageTitle: function (req) {
        var config = this._config;

        return req.title ? req.title : config.title && config.title[req.lang];
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
            token = this.getCookie(req, 'token'),
            isArchive = this.isArchive(req, req.query.page || 1);

        // Prepare data
        this._baseActions(req, res, next)
            .then(function () {
                return vow.all({
                    issues: _this._model.getIssues(req, token, isArchive),
                    labels: _this._model.getLabels(req, token)
                });
            })
            .then(this._afterGetIndexData.bind(this, req, res, next))
            .fail(function (err) {
                return next(err);
            });
    },

    _afterGetIndexData: function (req, res, next, data) {
        var issues = data.issues,
            labels = data.labels,
            isLastPage = this.isLastPage(issues),
            isArchive = this.isArchive(req, req.query.page || 1);

        if (!isArchive && isLastPage) {
            var archiveInfo = this.validateArchive(req);

            res.locals = _.extend(res.locals, {
                isMatchArchive: archiveInfo.isMatchArchive,
                archiveUrl: archiveInfo.archiveUrl
            })
        }

        // collect user data
        res.locals = _.extend(res.locals, {
            title: this._getPageTitle(req),
            issues: issues,
            labels: labels,
            view: 'issues',
            isLastPage: isLastPage,
            isArchive: isArchive
        });

        return next();
    },

    /**
     * Issue page controller
     * 1. Get from model page title, issue, issue`s comments to show on load
     * 2. Require data:
     * - user
     * - title
     * - view
     * - issue
     * - comments
     * - isArchive
     * @param {Object} req - express js request
     * @param {Object} res - express js response
     * @param {Function} next - express js call next middleware
     * @returns {*}
     */
    issue: function (req, res, next) {
        var _this = this,
            token = this.getCookie(req, 'token'),
            params = req.params,
            id = params && params.issue_id,
            isArchive = this.isArchive(req, id);

        this._baseActions(req, res, next)
            .then(function () {
                return vow.all({
                    issue: _this._model.getIssue(req, token, isArchive),
                    comments: _this._model.getComments(req, token, isArchive)
                });
            })
            .then(function (data) {
                var issue = data.issue,
                    comments = data.comments;

                res.locals = _.extend(res.locals, {
                    title: issue.title + ' / ' + _this._getPageTitle(req),
                    issue: issue,
                    comments: comments,
                    view: 'issue',
                    isArchive: isArchive
                });

                return next();
            })
            .fail(function (err) {
                return next(err);
            });
    }
});
