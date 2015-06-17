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
    sitemapXml: function (req, res, next) {
        var smConfig = this._config.sitemap.baseUrls;

        return this._getAllIssues.call(this, smConfig)
            .then(function (allIssues) {
                res.header('Content-Type', 'application/xml');
                res.send(sm.getXml(allIssues, smConfig));
            })
            .fail(this._onError.bind(this, next, 'sitemap.xml')).done();
    },

    sitemapJson: function (req, res, next) {
        var smConfig = this._config.sitemap.baseUrls;

        return this._getAllIssues.call(this, smConfig)
            .then(function (allIssues) {
                res.header('Content-Type', 'application/json');
                res.send(sm.getJson(allIssues, smConfig));
            })
            .fail(this._onError.bind(this, next, 'sitemap.json')).done();
    },

    _getAllIssues: function (smConfig) {
        return vow.all(smConfig.map(function (config) {
            return this._model.getAllIssues(config.lang);
        }, this));
    },

    _onError: function (next, errTarget, err) {
        this._logger.error('can`t get %s', errTarget, err);
        next(err);
    }
});
