var u = require('util'),
    path = require('path'),
    vm = require('vm'),

    vow = require('vow'),
    vfs = require('vow-fs'),
    _ = require('lodash'),
    stringify = require('json-stringify-safe'),
    util = require('./util'),

    targets;

function rebuild(targets) {
    if (!util.isDev()) {
        return vow.resolve();
    }

    var enbBuilder = require('enb/lib/server/server-middleware').createBuilder({
        cdir: process.cwd(),
        noLog: false
    }),
    dropRequireCache = require('enb/lib/fs/drop-require-cache');
    return vow.all(targets.map(function (target) {
        return enbBuilder(target).then(function () {
            dropRequireCache(require, target);
            return target;
        });
    }));
}

exports.init = function (options) {
    var t = options.template;
    targets = {
        bemtree: u.format('%s.bundles/%s/%s.bemtree.js', t.level, t.bundle, t.bundle),
        bemhtml: u.format('%s.bundles/%s/%s.bemhtml.js', t.level, t.bundle, t.bundle)
    };

    if (t.prefix) {
        targets = Object.keys(targets).reduce(function (prev, item) {
            prev[item] = path.join(t.prefix, targets[item]);
            return prev;
        }, {});
    }
};

/**
 * Recompile bemtree and bemhtml templates (only for development environment)
 * throw context and applies bemtree and bemhtml templates
 * @param {Object} ctx - context for templates
 * @param {Object} req - request object
 * @returns {*}
 */
exports.run = function (ctx, req) {
    return rebuild(_.values(targets))
        .then(function () {
            var p = path.join(process.cwd(), targets.bemtree),
                context = vm.createContext({
                    console: console,
                    Vow: vow,
                    req: req,
                    _: _
                });

            return vfs.read(p).then(function (content) {
                vm.runInNewContext(content, context);
                return context;
            });
        })
        .then(function (template) {
            return template.BEMTREE.apply(ctx)
                .then(function (bemjson) {
                    if (req.query.__mode === 'bemjson') {
                        return stringify(bemjson, null, 2);
                    }

                    if (req.query.__mode === 'content') {
                        bemjson = bemjson.content;
                    }

                    return require(path.join(process.cwd(), targets.bemhtml)).BEMHTML.apply(bemjson);
                });
        });
};
