var u = require('util'),
    path = require('path'),
    vm = require('vm'),

    vow = require('vow'),
    vfs = require('vow-fs'),
    _ = require('lodash'),
    stringify = require('json-stringify-safe'),
    util = require('./util');

exports.init = function (options) {
    var t = options.template;
    target = u.format('%s.bundles/%s/%s.min.template.i18n.js', t.level, t.bundle, t.bundle);

    if (t.prefix) target = path.join(t.prefix, target);
};

/**
 * Recompile bemtree and bemhtml templates (only for development environment)
 * throw context and applies bemtree and bemhtml templates
 * @param ctx  - {Object} context for templates
 * @param req - {Object} expressjs request object
 * @returns {*}
 */
exports.run = function (ctx, req) {
    var builder = util.isDev() ?
        require('./builder') : { build: function () { return vow.resolve(); } };

    return builder
        .build([target])
        .then(function () {
            var context = {
                console: console,
                Vow: vow,
                req: req,
                _: _
            };

            return vfs.read(path.join(process.cwd(), target)).then(function (bundleFile) {
                vm.runInNewContext(bundleFile, context);
                return context;
            });
        })
        .then(function (template) {
            // set lang
            template.BEM.I18N.lang(req.lang);

            return template.BEMTREE.apply(ctx)
                .then(function (bemjson) {
                    if (req.query._mode === 'bemjson') {
                        return stringify(bemjson, null, 2);
                    }

                    if (req.query._mode === 'content') {
                        bemjson = bemjson.content;
                    }

                    var html;

                    try {
                        html = template.BEMHTML.apply(bemjson);
                    } catch (e) {
                        throw new Error(e);
                    }
                    return html;
                });
        });
};
