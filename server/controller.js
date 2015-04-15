var _ = require('lodash'),
    Model = require('./models/model.js'),
    vow = require('vow');

function Controller(config) {
    this._init(config);
}

Controller.prototype = {

    _init: function (config) {
        this.model = new Model(config);
        this.config = config;
    },

    /**
     * Base controller, use on every request,
     * that match default`s forum router.
     * 1. Get from model labels by lang and user info by token from req.cookies
     * 2. Extend req.locals.forum with labels and users data
     * @param {Object} site - current site config
     * @param {Object} req - express js request
     * @returns {*}
     */
    _base: function (site, req) {
        var _this = this,
            def = vow.defer(),
            lang = req.lang;

        vow.all({
            labels: this.model.getLabels(null, site, lang)
            //user: this.model.getAuthUser(req.cookies['forum_token'], {})
        }).then(function (data) {

            // collect user data
            if (!req.locals) req.locals = {};
            req.locals.forum = _.extend(_this._getData(req), data);

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
     * @param {Object} site - current site config
     * @param {Object} req - express js request
     * @param {Object} res - express js response
     * @param {Function} next - express js call next middleware
     * @returns {*}
     */
    index: function (site, req, res, next) {
        var token = req.cookies && req.cookies['forum_token'],
            lang = req.lang;

        return this._base(site, req)
            .then(function () {
                return next();
            })
            .fail(function (err) {
                return next(err);
            });

        //return vow.all({
        //    //title: this.model.getTitle(lang),
        //    issues: this.model.getIssues(token, this.config, lang)
        //
        //}).then(function (data) {
        //
        //    // collect final data
        //    _.extend(this._getData(req), data, { view: 'issues' });
        //
        //    return next();
        //});
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
            title: this.model.getTitle(lang, id),
            issue: this.model.getIssue(token, id, lang),
            comments: this.model.getComments(token, id)

        }).then(function (data) {

            req.locals.forum = _.extend(this._getData(req), data, { view: 'issue' });

            return next();
        });
    },

    /**
     * Get forum data from req.locals.forum.
     * p.s. When the forum is used as a separate middleware
     * this method needed for extend data that collect earlier
     * with forum`s data
     * @param {Object} req - express js request
     * @returns {Object} req.local.forum
     * @private
     */
    _getData: function (req) {
        var data = {},
            locals = req.locals;

        if (locals) {
            data = locals.forum ? locals.forum : (locals.forum = {});
        }

        return data;
    }
};

module.exports = Controller;
