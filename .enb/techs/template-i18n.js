var vow = require('vow'),
    vfs = require('enb/lib/fs/async-fs');

module.exports = require('enb/lib/build-flow').create()
    .name('i18n-all')
    .target('target', '?.template.i18n.js')
    .useSourceListFilenames('langTargets', [])
    .useSourceText('sourceTarget', '?.template.js')
    .builder(function (langFilenames, source) {
        return vow.all(
            langFilenames.map(function (filename) {
                return vfs.read(filename);
            })
        ).then(function (langResults) {
                return langResults.join('\n') + source;
            });
    })
    .createTech();
