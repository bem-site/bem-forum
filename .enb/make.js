module.exports = function(config) {
    config.setLanguages(['ru', 'en']);

    config.nodes('*.bundles/*', function(nodeConfig) {
        nodeConfig.addTechs([
            [ require('enb/techs/file-provider'), { target: '?.bemdecl.js' } ],
            [ require('enb/techs/files') ],
            [ require('enb/techs/deps') ],
            [ require('enb-bemxjst/techs/bemtree'), { devMode: false }  ],
            [ require('enb-diverse-js/techs/browser-js'), { target: '?.pre.js' } ],
            [ require('enb-modules/techs/prepend-modules'), {
                target: '?.js',
                source: '?.pre.js'
            } ],
            [ require('enb-stylus/techs/css-stylus'), { target: '?.noprefix.css' } ],
            [ require('enb-bemxjst/techs/bemhtml'), { devMode: false } ],
            [ require('enb-bem-i18n/techs/i18n-lang-js'), { lang: 'all' } ],
            [ require('enb-bem-i18n/techs/i18n-lang-js'), { lang: '{lang}' } ],
            [ require('enb-bem-i18n/techs/i18n-merge-keysets'), { lang: 'all' } ],
            [ require('enb-bem-i18n/techs/i18n-merge-keysets'), { lang: '{lang}' } ],
            [ require('enb/techs/file-merge'), {
                target : '?.template.js',
                sources: ['?.bemtree.js', '?.bemhtml.js']
            }],
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
            [ require('enb/techs/levels'), { levels: getDesktops(config) } ],
            [ require('enb-autoprefixer/techs/css-autoprefixer'), {
                browserSupport: [ 'last 2 versions', 'ie 10', 'ff 24', 'opera 12.16' ],
                sourceTarget: '?.noprefix.css'
            }]
        ]);
    });

    config.mode('development', function(modeConfig) {
       config.nodes('*.bundles/*', function(nodeConfig) {
           nodeConfig.addTechs([
               [ require('enb/techs/file-copy'), { sourceTarget: '?.css', destTarget: '?.min.css' } ],
               [ require('enb/techs/file-copy'), { sourceTarget: '?.template.i18n.js', destTarget: '?.min.template.i18n.js' } ],
               [ require('enb-borschik/techs/borschik'), { sourceTarget: '?.js', destTarget: '?.borschik.js', minify: false } ],
               [ require('enb/techs/file-copy'), { sourceTarget: '?.borschik.js', destTarget: '?.min.js' } ]
           ]);
       });
    });

    config.mode('production', function(modeConfig) {
        config.nodes('*.bundles/*', function(nodeConfig) {
            nodeConfig.addTechs([
                [ require('enb-borschik/techs/borschik'), { sourceTarget: '?.css', destTarget: '?.min.css', tech: 'cleancss', freeze: true } ],
                [ require('enb-borschik/techs/borschik'), { sourceTarget: '?.template.i18n.js', destTarget: '?.min.template.i18n.js' } ],
                [ require('enb-borschik/techs/borschik'), { sourceTarget: '?.js', destTarget: '?.min.js' } ]
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
