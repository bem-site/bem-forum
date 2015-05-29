module.exports = {
    files : {
        provide : require('enb/techs/file-provider'),
        copy : require('enb/techs/file-copy'),
        merge : require('enb/techs/file-merge')
    },
    bem : require('enb-bem-techs'),
    css : {
        stylus : require('enb-stylus/techs/css-stylus'),
        autoprefixer: require('enb-autoprefixer/techs/css-autoprefixer')
    },
    js : {
        browserJs: require('enb-diverse-js/techs/browser-js')
    },
    ym : require('enb-modules/techs/prepend-modules'),
    engines : {
        bemtree : require('enb-bemxjst/techs/bemtree'),
        bemhtml : require('enb-bemxjst/techs/bemhtml')
    },
    html : {
        bemhtml : require('enb-bemxjst/techs/html-from-bemjson')
    },
    i18n: {
        keysets: require('enb-bem-i18n/techs/i18n-merge-keysets'),
        lang: require('enb-bem-i18n/techs/i18n-lang-js')
    },
    borschik : require('enb-borschik/techs/borschik')
};
