var path = require('path'),
    vm = require('vm'),

    vow = require('vow'),
    vfs = require('vow-fs'),
    _ = require('lodash'),
    stringify = require('json-stringify-safe'),
    util = require('./util'),

    builder = require('./builder');

var targets = {
    bemtree: 'desktop.bundles/index/index.min.bemtree.js',
    bemhtml: 'desktop.bundles/index/index.min.bemhtml.js'
};

exports.run = function(ctx, mode) {
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

                    return require(path.join(process.cwd(), targets.bemhtml)).BEMHTML.apply(bemjson);
                });
        });
};
