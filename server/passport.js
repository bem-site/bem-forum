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
	_.forEach(forumOptions.passport.strategies, function (options, name) {
		if (!options.enabled) {
			return false;
		}
		console.log("Init %s passport strategy", name);
		console.log("Strategies: ", strategies);
		passport = strategies[name].init(passport, options);
	})
}

module.exports = passport;