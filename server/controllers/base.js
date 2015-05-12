var _ = require('lodash'),
    Model = require('../models/main.js'),
    Auth = require('../services/auth.js'),
    util = require('../util.js'),
    inherit = require('inherit');

module.exports = BaseController = inherit({

    __constructor: function (config) {
        this._model = new Model(config);
        this._auth = new Auth(config);
        this._config = config;
    },

    isLastPage: function (issues) {
        return issues.length < this._config.perPage;
    },

    isArchive: function (req) {
        var isNegativePage = req.query && req.query.page < 0,
            isLangArchive = this.isLangSupportArchive(req);

        return (isNegativePage && isLangArchive) ? true : false;
    },

    isLangSupportArchive: function (req) {
        var archiveConfig = this._config.archive;
        return archiveConfig && archiveConfig[req.lang] ? true : false;
    },

    getTmplHelpers: function (req) {
        return {
            _: _,
            util: util,
            csrf: req.csrfToken(),
            config: this._config
        };
    },

    getCookie: function (req, part) {
        var userCookie = this._auth.getUserCookie(req, 'forum_user');

        return userCookie ? userCookie[part === 'token' ? 0 : 1] : null;
    },

    getPreviousUrl: function (req) {
        var session = req.session;
        return session && session.previousUrl;
    },

    setPreviousUrl: function (req) {
        var session = req.session;

        session ? (session.previousUrl = req.url)
            : this._logger.warn('Add session middleware for correct auth work');
    },

    onError: function (next, err) {
        this._logger.error(err);
        return next(err);
    }
});
