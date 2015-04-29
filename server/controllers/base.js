var Model = require('../models/main.js'),
    Auth = require('../services/auth.js'),
    util = require('../util.js'),
    inherit = require('inherit');

module.exports = BaseController = inherit({

    __constructor: function (config) {
        this._model = new Model(config);
        this._auth = new Auth(config);
        this._config = config;
    },

    getTmplHelpers: function (req) {
        return {
            util: util,
            csrf: req.csrfToken(),
            config: this._config
        };
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
    getLocalData: function (res) {
        var locals = res.locals;
        return locals.forum ? locals.forum : (locals.forum = {});
    },

    setLocalData: function (res, data) {

    },

    getPreviousUrl: function (req) {
        var session = req.session;
        return session && session.previousUrl;
    },

    setPreviousUrl: function (req) {
        var session = req.session;

        session
            ? session.previousUrl = req.url
            : this._logger.warn('Add session middleware for correct auth work');
    }
});
