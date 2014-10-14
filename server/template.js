var u = require('util'),
    path = require('path'),
    vm = require('vm'),

    vow = require('vow'),
    vfs = require('vow-fs'),
    _ = require('lodash'),
    stringify = require('json-stringify-safe'),
    util = require('./util');

var targets;

exports.init = function(options) {
    var t = options.template;
    targets = {
        bemtree: u.format('%s.bundles/%s/%s.bemtree.js', t.level, t.bundle, t.bundle),
        bemhtml: u.format('%s.bundles/%s/%s.bemhtml.js', t.level, t.bundle, t.bundle)
    };

    if(t.prefix) {
        targets = Object.keys(targets).reduce(function(prev, item) {
            prev[item] = path.join(t.prefix, targets[item]);
            return prev;
        }, {})
    }
};

/**
 * Recompile bemtree and bemhtml templates (only for development environment)
 * throw context and applies bemtree and bemhtml templates
 * @param ctx  - {Object} context for templates
 * @param mode - {String} mode for output format
 * @returns {*}
 */
exports.run = function(ctx, req) {
    var builder = util.isDev() ?
        require('./builder') : { build: function() { return vow.resolve(); }};

    return builder.build(_.values(targets))
        .then(function() {
            var p = path.join(process.cwd(), targets.bemtree),
                context = vm.createContext({
                    console: console,
                    Vow: vow,
                    req: req,
                    _: _
                });

            return vfs.read(p).then(function(content) {
                vm.runInNewContext(content, context);
                return context;
            });
        })
        .then(function(template) {
            return template.BEMTREE.apply(ctx)
                .then(function(bemjson) {
                    if (req.query.__mode === 'bemjson') {
                        return stringify(bemjson, null, 2);
                    }

                    if(req.query.__mode === 'content') {
                        bemjson = bemjson.content;
                    }

                    return require(path.join(process.cwd(), targets.bemhtml)).BEMHTML.apply(bemjson);
                });
        });
};
