var _ = require('lodash'),
    querystring = require('querystring'),
    Model = require('../models/main.js'),
    Auth = require('../services/auth.js'),
    util = require('../util.js'),
    inherit = require('inherit');

module.exports = inherit({

    __constructor: function (config) {
        this._model = new Model(config);
        this._auth = new Auth(config);
        this._config = config;
    },

    /**
     * Verify the last page if the model gave less issues than expected
     * @param issues {Array}
     * @returns {boolean}
     */
    isLastPage: function (issues) {
        return issues.length < this._config.perPage;
    },

    /**
     * Verify by what type of page the user has requested archive or not
     * @param req {Object}
     * @param value {Number} page or issue id
     * @returns {boolean}
     */
    isArchive: function (req, value) {
        return (value < 0 && this.isLangSupportArchive(req)) ? true : false;
    },

    /**
     * Verify if the requested language archive posts
     * @param lang {String}
     * @returns {boolean}
     */
    isLangSupportArchive: function (lang) {
        var archiveConfig = this._config.archive;
        return archiveConfig && archiveConfig[lang] ? true : false;
    },

    /**
     * Prepare a list of helpers for templates
     * @param req {Object}
     * @returns {Object}
     */
    getTmplHelpers: function (req) {
        return {
            _: _,
            util: util,
            csrf: req.csrfToken(),
            config: this._config
        };
    },

    getCookie: function (req) {
        var userCookie = this._auth.getUserCookie(req, 'forum_user');

        if (!userCookie) {
            return {};
        }

        return {
            token: userCookie[0],
            name: userCookie[1]
        };
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
        if (this.isLangSupportArchive(req.lang)) {
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
