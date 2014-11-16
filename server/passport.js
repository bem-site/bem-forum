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
    if (user) {
        services.get().getUser({uid: user.id})
            .then(function (userModel) {
                if (!userModel) {
                    services.get().createUser({
                        login: user.username,
                        uid: user.id,
                        avatar_url: user._json.avatar_url,
                        name: user.displayName,
                        email: user.emails[0] !== 'undefined' ? user.emails[0].value : '',
                        token: ''
                    }).then(function (userModel) {
                        done(null, user.id);
                    }).fail(function (err) {
                        throw err;
                    });
                } else {
                    done(null, user.id);
                }
            }).fail(function (err) {
                throw err;
            });
    }
});

passport.deserializeUser(function (obj, done) {
    done(null, obj);
});

module.exports = passport;
