var util = require('util'),
    path = require('path'),
    vm = require('vm'),
    _ = require('lodash'),
    vow = require('vow'),
    vfs = require('vow-fs'),
    inherit = require('inherit'),
    stringify = require('json-stringify-safe'),

    forumUtil = require('./util');

var Template;

module.exports = Template = inherit({
    __constructor: function (config) {
        this._config = config;
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

    run: function (ctx, req) {
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
                    req: req,
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

                return template.BEMTREE.apply(ctx)
                    .then(function (bemjson) {
                        if (req.query.__mode === 'bemjson') {
                            return stringify(bemjson, null, 2);
                        }

                        if (req.query.__mode === 'content') {
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
    }

}, {
    getInstance: function (config) {
        if (!this._instance) {
            this._instance = new Template(config);
        }

        return this._instance;
    }
});
