var passport = require('passport'),
    config = require('./config'),
    forumOptions = config.get('forum'),
    strategies = require('./authStrategies/index'),
    services = require('./services');

if (forumOptions.passport.enabled) {
    var authStr = forumOptions.passport.strategies;
    Object.keys(authStr).forEach(function (name) {
        if (!authStr[name].enabled) {
            return false;
        }
        passport = strategies[name].init(passport, authStr[name]);
    });
}

passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (obj, done) {
    done(null, obj);
});

module.exports = passport;
