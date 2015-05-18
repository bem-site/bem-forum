var util = require('util'),
    path = require('path'),
    vm = require('vm'),
    _ = require('lodash'),
    vow = require('vow'),
    vfs = require('vow-fs'),
    inherit = require('inherit'),
    Logger = require('bem-site-logger'),
    stringify = require('json-stringify-safe'),
    forumUtil = require('./util'),
    Template;

module.exports = Template = inherit({
    __constructor: function (config) {
        this._config = config;
        this._logger = Logger.setOptions(this._config['logger']).createLogger(module);
        this._target = this._setTarget();
    },

    /**
     * Set the full path to the compiled file with BEMTREE and BEMHTML templates
     * @returns {String}
     * @private
     */
    _setTarget: function () {
        var tPath = this._config.template,
            target = util.format('%s.bundles/%s/%s.min.template.i18n.js', tPath.level, tPath.bundle, tPath.bundle);

        // For when a bundle is in a different location, e.g. bem-info
        if (tPath.prefix) {
            target = path.join(tPath.prefix, target)
        }

        return target;
    },

    /**
     * Read the template file and create a new context,
     * it is necessary to ensure that the scope of the template
     * to put the vow(required for the BEMTREE) and console.log
     * @returns {Promise} - promise with file
     * @private
     */
    _prepareTemplates: function () {
        var context = {
            console: console,
            Vow: vow
        };

        return vfs.read(path.join(process.cwd(), this._target))
            .then(function (bundleFile) {
                vm.runInNewContext(bundleFile, context);
                return context;
            });
    },

    /**
     * In the dev environment runs Builder module to rebuild the templates,
     * in production just run templates.
     * In every
     * @returns {*}
     * @private
     */
    _resolveTemplate: function () {
        if (!forumUtil.isDev()) {

            if (this._template) {
                return vow.resolve(this._template);
            }

            return this._prepareTemplates()
                .then(function (template) {
                    this._template = template;
                    return vow.resolve(this._template);
                }, this);
        }

        var builder = require('./builder');

        return builder
            .build([this._target])
            .then(function () {
                return this._prepareTemplates();
            }, this);
    },

    /**
     * Consistent calls of the BEMTREE and BEMHTML templates
     * for getting the html and the server response to the client
     *
     * @param ctx {Object} - BEMJSON
     * @param req {Object}
     * @param res {Object}
     * @param next {Function}
     * @returns {*}
     */
    run: function (ctx, req, res, next) {
        var _this = this;

        return this._resolveTemplate()
            .then(function (template) {

                // set lang
                template.BEM.I18N.lang(req.lang);

                try {
                    // apply bemtree templates
                    var bemtreePromise = template.BEMTREE.apply(ctx);
                } catch (err) {
                    _this._logger.error('BEMTREE ERROR: %s', err);
                    res.status(500);

                    return next(err);
                }

                return bemtreePromise.then(function (bemjson) {

                    if (req.query.__mode === 'bemjson') {
                        return stringify(bemjson, null, 2);
                    }

                    if (req.query.__mode === 'content') {
                        bemjson = bemjson.content;
                    }

                    try {
                        // apply bemhtml templates
                        var html = template.BEMHTML.apply(bemjson);
                    } catch (err) {
                        _this._logger.error('BEMHTML ERROR: %s', err);
                        res.status(500);

                        return next(err);
                    }

                    return res.end(html);
                });
            })
            .fail(function (err) {
                return next(err);
            });
    }

}, {
    /**
     * Get singleton instance of class Template
     * @param config
     * @returns {*}
     */
    getInstance: function (config) {
        if (!this._instance) {
            this._instance = new Template(config);
        }

        return this._instance;
    }
});
