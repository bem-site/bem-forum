var _ = require('lodash'),
    vow = require('vow'),
    inherit = require('inherit'),
    Logger = require('bem-site-logger'),
    BaseController = require('./base'),
    sm = require('../services/sitemap');

module.exports = inherit(BaseController, {
    __constructor: function (config) {
        this.__base(config);
        this._logger = Logger.setOptions(this._config.logger).createLogger(module);
    },

    /**
     * Controler of the xml sitemap page
     * 1. Receives all issues depending on sitemap config from the model
     * 2. Generate sitemap and gave response to the browser
     * @param req {Object}
     * @param res {Object}
     * @param next {Function}
     */
    sitemap: function (req, res, next) {
        var sitemapConfig = this._config.sitemap;

        return vow.all(sitemapConfig.map(function (config) {
            return this._model.getAllIssues(config.lang);
        }, this))
        .then(function (allIssues) {
            res.header('Content-Type', 'application/xml');
            res.send(sm.get(allIssues, sitemapConfig));
        })
        .fail(function (err) {
            this._logger.error(err);
            next(err);
        }, this).done();
    }
});
