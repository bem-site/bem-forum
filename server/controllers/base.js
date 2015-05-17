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
        return (value < 0 && this.isLangSupportArchive(req.lang)) ? true : false;
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
    getTemplateHelpers: function (req) {
        return {
            _: _,
            util: util,
            csrf: req.csrfToken(),
            config: this._config
        };
    },

    /**
     * Getter a cookie with the values of the username and token
     * @param req {Object}
     * @returns {Object} { user: ..., token: ... }
     */
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

    /**
     * Getter for the latest pages visited by the user
     * @param req {Object}
     * @returns {String} - url
     */
    getPreviousUrl: function (req) {
        var session = req.session;
        return session && session.previousUrl;
    },

    /**
     * Setter for the latest pages visited by the user.
     * Used for the ability to return the user after login and logout
     * @param req
     */
    setPreviousUrl: function (req) {
        var session = req.session;

        session ? (session.previousUrl = req.url)
            : this._logger.warn('Add session middleware for correct auth work');

        return this;
    },

    /**
     * Collect query parameters for archives button.
     * Used for the ability to save query settings by navigating to the archive.
     * IMPORTANT! Saved query all except the page because the archive this query is -1
     * @param req {Object}
     * @returns {*}
     */
    collectArchiveQuery: function (req) {
        var query = req.query;

        if (!query) {
            return '';
        }

        delete query.page;

        return '&' + querystring.stringify(query);
    },

    /**
     * Check whether the archive posts with the given query.
     * Used for cases where we check whether to show the button
     * to switch to the archive section
     * @param req {Object}
     * @returns {{isMatchArchive: boolean, archiveUrl: string}}
     */
    validateArchive: function (req) {
        var isMatchArchive = false,
            archiveUrl = this._config.url + '?page=-1';

        // Check if there are any archived posts for the current language
        if (this.isLangSupportArchive(req.lang)) {
            isMatchArchive = this._model.inspectArchiveIssues(req)
        }

        /**
         * If there are archived posts,
         * then collect query parameters for the button in the archive,
         * it is necessary to keep the filter in the section of the archive
         */
        if (isMatchArchive) {
            archiveUrl += this.collectArchiveQuery(req);
        }

        return {
            isMatchArchive: isMatchArchive,
            archiveUrl: archiveUrl
        }
    },

    /**
     * A common error handler for all types of controllers
     * @param next {Function} express next middleware func
     * @param err {Object} error object
     * @returns {*}
     */
    onError: function (next, err) {
        this._logger.error(err);
        return next(err);
    }
});
