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
     * Base controller, use on every page request.
     * The controller queries the number of data are required for both pages (home page)
     * 1. Get user data
     * 2. Remember the current url for the possibility of return if the user decided to enter or leave
     * 3. Fill res.locals basic helper methods that are used in templates
     * @param {Object} req
     * @param {Object} res
     * @param {Object} next
     * @returns {*}
     */
    _baseActions: function (req, res, next) {
        var cookie = this.getCookie(req);

        return this._model
            .getAuthUser(req, cookie.token, cookie.name)
            .then(function (data) {
                // set previous url for correct login redirect
                this.setPreviousUrl(req);

                // collect user data
                return res.locals = _.extend(res.locals, {
                    user: data
                }, this.getTmplHelpers(req));

            }, this)
            .fail(function (err) {
                return next(err);
            }, this);
    },

    /**
     * The controller of the index page
     * 1. Receives from the model list of posts and labels
     * 2. Called next() after all the necessary steps and data made
     * IMPORTANT! All the necessary data for templating are in res.locals
     * @param req {Object}
     * @param res {Object}
     * @param next {Function}
     * @returns {*}
     */
    index: function (req, res, next) {
        var _this = this,
            token = this.getCookie(req).token,
            isArchive = this.isArchive(req, req.query.page || 1);

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

    /**
     * Handler for successful reception of data from the model for the index page
     * 1. Fills res.locals with the necessary data
     * 2. Checks whether the requested page to the archive section
     * and whether it is the last page and expresses it in the templates.
     * 3. If it's the last page and not an archive,
     * checking to see if the archive posts on current criteria
     * and pass this knowledge to the template
     * @param req {Object}
     * @param res {Object}
     * @param next {Function}
     * @param data {Object} - retrieved date from the model (posts and labels)
     * @returns {*}
     * @private
     */
    _afterGetIndexData: function (req, res, next, data) {
        var issues = data.issues,
            labels = data.labels;

        var isLastPage = this.isLastPage(issues),
            isArchive = this.isArchive(req, req.query.page || 1);

        if (!isArchive && isLastPage) {
            var archiveInfo = this.validateArchive(req);

            res.locals = _.extend(res.locals, {
                isMatchArchive: archiveInfo.isMatchArchive,
                archiveUrl: archiveInfo.archiveUrl
            });
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
     * The controller of the issue page
     * 1. Receives from the model issue data and it`s list of comments
     * 2. Checks whether this post to the archive section on
     * and pass this knowledge to the template
     * 3. Fills res.locals with the necessary data
     * @param req {Object}
     * @param res {Object}
     * @param next {Function}
     * @returns {*}
     */
    issue: function (req, res, next) {
        var token = this.getCookie(req).token,
            params = req.params,
            id = params && params.issue_id,
            isArchive = this.isArchive(req, id);

        this._baseActions(req, res, next)
            .then(function () {
                return vow.all({
                    issue: this._model.getIssue(req, token, isArchive),
                    comments: this._model.getComments(req, token, isArchive)
                });
            }, this)
            .then(function (data) {
                var issue = data.issue,
                    comments = data.comments;

                res.locals = _.extend(res.locals, {
                    title: issue.title + ' / ' + this._getPageTitle(req),
                    issue: issue,
                    comments: comments,
                    view: 'issue',
                    isArchive: isArchive
                });

                return next();
            }, this)
            .fail(function (err) {
                return next(err);
            });
    },

    /**
     * Getter to retrieve the page titl
     * If not req.the title uses the title from config
     * @param req {Object}
     * @returns {*}
     * @private
     */
    _getPageTitle: function (req) {
        var config = this._config;
        return req.title ? req.title : config.title && config.title[req.lang];
    }
});
