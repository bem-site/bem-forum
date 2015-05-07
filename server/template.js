var util = require('util'),
    path = require('path'),
    vm = require('vm'),
    _ = require('lodash'),
    vow = require('vow'),
    vfs = require('vow-fs'),
    inherit = require('inherit'),
    Logger = require('bem-site-logger'),
    stringify = require('json-stringify-safe'),

    forumUtil = require('./util');

var Template;

module.exports = Template = inherit({
    __constructor: function (config) {
        this._config = config;
        this._logger = Logger.setOptions(this._config['logger']).createLogger(module);
        this._target = this._setTarget();
    },

    _setTarget: function () {
        var tPath = this._config.template,
            target = util.format('%s.bundles/%s/%s.min.template.i18n.js', tPath.level, tPath.bundle, tPath.bundle);

        // For when a bundle is in a different location, e.g. bem-info
        if (tPath.prefix) {
            target = path.join(t.prefix, target)
        }

        return target;
    },

    run: function (ctx, req, res, next) {
        var _this = this,
            builder = forumUtil.isDev()
                        ? require('./builder')
                        : { build: function () { return vow.resolve(); } };

        return builder
            .build([this._target])
            .then(function () {
                var context = {
                    console: console,
                    Vow: vow,
                    _: _
                };

                return vfs.read(path.join(process.cwd(), _this._target)).then(function (bundleFile) {
                    vm.runInNewContext(bundleFile, context);
                    return context;
                });
            })
            .then(function (template) {
                // set lang
                template.BEM.I18N.lang(req.lang);

                try {
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
                        var html = template.BEMHTML.apply(bemjson);
                    } catch (err) {
                        _this._logger.error('BEMHTML ERROR: %s', err);
                        res.status(500);
                        return next(err);
                    }

                    return html;
                });
            });
    }

}, {
    getInstance: function (config) {
        if (!this._instance) {
            this._instance = new Template(config);
        }

        return this._instance;
    }
});
