var passport = require('passport'),
    config = require('./config'),
    forumOptions = config.get('forum'),
    strategies = require('./authStrategies/index'),
    _ = require('lodash');

/*
* If forum passport conf is enabled, then iterate through all configured passport strategies
* and init it in passport if it is enabled.
* */
if (forumOptions.passport.enabled) {
    var authStr = forumOptions.passport.strategies;
    Object.keys(authStr).forEach(function (name, index, arr) {
        if (!authStr[name].enabled) {
            return false;
        }
        console.log('Init %s passport strategy', name);
        console.log('Strategies: ', strategies);
        passport = strategies[name].init(passport, authStr[name]);
    });
}

module.exports = passport;
