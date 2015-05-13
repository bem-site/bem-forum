var _ = require('lodash'),
    querystring = require('querystring'),
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

    isArchive: function (req, value) {
        return (value < 0 && this.isLangSupportArchive(req)) ? true : false;
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

    getArchiveQuery: function (req) {
        var query = req.query;

        if (!query) {
            return '';
        }

        delete query.page;

        return '&' + querystring.stringify(query);
    },

    validateArchive: function (req) {
        var isMatchArchive = false,
            archiveUrl = this._config.url + '?page=-1';

        // Check if archive contain issues by current criteries
        if (this.isLangSupportArchive(req)) {
            isMatchArchive = this._model.inspectArchiveIssues(req)
        }

        // Get url for archive button
        if (isMatchArchive) {
            archiveUrl += this.getArchiveQuery(req);
        }

        return {
            isMatchArchive: isMatchArchive,
            archiveUrl: archiveUrl
        }
    },

    onError: function (next, err) {
        this._logger.error(err);
        return next(err);
    }
});
