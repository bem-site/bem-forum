var techs = require('./techs');

module.exports = function(config) {
    config.setLanguages(['ru', 'en']);

    config.nodes('*.bundles/*', function(nodeConfig) {
        nodeConfig.addTechs([
            [ techs.files.provide, { target: '?.bemdecl.js' } ],
            [ techs.bem.files ],
            [ techs.bem.deps ],
            [ techs.engines.bemtree, { devMode: false }  ],
            [ techs.js.browserJs, { target: '?.pre.js' } ],
            [ techs.ym, { target: '?.js', source: '?.pre.js'} ],
            [ techs.css.stylus, { target: '?.noprefix.css' } ],
            [ techs.engines.bemhtml, { devMode: false } ],
            [ techs.i18n.lang, { lang: 'all' } ],
            [ techs.i18n.lang, { lang: '{lang}' } ],
            [ techs.i18n.keysets, { lang: 'all' } ],
            [ techs.i18n.keysets, { lang: '{lang}' } ],
            [ techs.files.merge, { target : '?.template.js', sources: ['?.bemtree.js', '?.bemhtml.js'] }],
            [ require('./techs/template-i18n'), {
                target: '?.template.i18n.js',
                sourceTarget: '?.template.js',
                langTargets: ['all'].concat(config.getLanguages()).map(function (lang) {
                    return '?.lang.' + lang + '.js';
                })
            } ]
        ]);

        nodeConfig.addTargets([
            '?.min.css',
            '?.min.js',
            '?.min.template.i18n.js'
        ]);
    });

    config.nodes('desktop.bundles/*', function(nodeConfig) {
        nodeConfig.addTechs([
            [ techs.bem.levels, { levels: getDesktops(config) } ],
            [ techs.css.autoprefixer, {
                browserSupport: ['ie >= 8', 'last 3 versions', '> 2%'],
                sourceTarget: '?.noprefix.css'
            }]
        ]);
    });

    config.mode('development', function(modeConfig) {
       config.nodes('*.bundles/*', function(nodeConfig) {
           nodeConfig.addTechs([
               [ techs.files.copy, { sourceTarget: '?.css', destTarget: '?.min.css' } ],
               [ techs.files.copy, { sourceTarget: '?.template.i18n.js', destTarget: '?.min.template.i18n.js' } ],
               [ techs.borschik, { sourceTarget: '?.js', destTarget: '?.borschik.js', minify: false } ],
               [ techs.files.copy, { sourceTarget: '?.borschik.js', destTarget: '?.min.js' } ]
           ]);
       });
    });

    config.mode('production', function(modeConfig) {
        config.nodes('*.bundles/*', function(nodeConfig) {
            nodeConfig.addTechs([
                [ techs.borschik, {
                    sourceTarget: '?.css',
                    destTarget: '?.min.css',
                    tech: 'cleancss',
                    freeze: true
                } ],
                [ techs.borschik, {
                    sourceTarget: '?.template.i18n.js',
                    destTarget: '?.min.template.i18n.js',
                    minify: true,
                    freeze: true
                } ],
                [ techs.borschik, {
                    sourceTarget: '?.js',
                    destTarget: '?.min.js',
                    minify: true,
                    freeze: true
                } ]
            ]);
        });
    });

};

function getDesktops(config) {
    return [
        { path: 'libs/bem-core/common.blocks', check: false },
        { path: 'libs/bem-core/desktop.blocks', check: false },
        { path: 'libs/bem-components/common.blocks', check: false },
        { path: 'libs/bem-components/design/common.blocks', check: false },
        { path: 'libs/bem-components/desktop.blocks', check: false },
        { path: 'libs/bem-components/design/desktop.blocks', check: false },
        { path: 'libs/bem-history/common.blocks', check: false },
        { path: 'libs/bem-content/common.blocks', check: false },
        'desktop.blocks',
        'wrapper.blocks'
    ].map(function(level) {
        return config.resolvePath(level);
    });
}
