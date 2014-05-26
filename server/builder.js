var path = require('path'),
    vow = require('vow'),
    enbBuilder = require('enb/lib/server/server-middleware').createBuilder({
        cdir: process.cwd(),
        noLog: false
    }),
    dropRequireCache = require('enb/lib/fs/drop-require-cache');

exports.build = function(targets) {
    return vow.all(
        targets.map(function (target) {
            return enbBuilder(target).then(function() {
                dropRequireCache(require, target);
                return target;
            });
        })
    );
};
