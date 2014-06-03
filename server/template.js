var path = require('path'),
    vm = require('vm'),

    vow = require('vow'),
    vfs = require('vow-fs'),
    _ = require('lodash'),
    stringify = require('json-stringify-safe'),
    util = require('./util');

var targets = {
    bemtree: 'desktop.bundles/index/index.min.bemtree.js',
    bemhtml: 'desktop.bundles/index/index.min.bemhtml.js'
};

/**
 * Recompile bemtree and bemhtml templates (only for development environment)
 * throw context and applies bemtree and bemhtml templates
 * @param ctx  - {Object} context for templates
 * @param mode - {String} mode for output format
 * @returns {*}
 */
exports.run = function(ctx, mode) {
    var builder = util.isDev() ?
        require('./builder') : { build: function() { return vow.resolve(); }};

    return builder.build(_.values(targets))
        .then(function() {
            var p = path.join(process.cwd(), targets.bemtree),
                context = vm.createContext({
                    console: console,
                    Vow: vow,
                    util: util
                });

            return vfs.read(p).then(function(content) {
                vm.runInNewContext(content, context);
                return context;
            });
        })
        .then(function(template) {
            return template.BEMTREE.apply(ctx)
                .then(function(bemjson) {
                    if (mode === 'bemjson') {
                        return stringify(bemjson, null, 2);
                    }

                    if(mode === 'content') {
                        bemjson = bemjson.content;
                    }

                    return require(path.join(process.cwd(), targets.bemhtml)).BEMHTML.apply(bemjson);
                });
        });
};
