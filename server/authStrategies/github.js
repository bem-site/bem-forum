var GitHubStrategy = require('passport-github').Strategy,
    Strategy;

module.exports = {
    init: function (passport, options) {
        if (typeof options === null || !options.clientID || !options.clientSecret || !options.callbackURL) {
            return passport;
        }

        passport.serializeUser(function(user, done) {
            done(null, user);
        });

        passport.deserializeUser(function(obj, done) {
            done(null, obj);
        });

        Strategy = new GitHubStrategy({
                clientID: options.clientID,
                clientSecret: options.clientSecret,
                callbackURL: options.callbackURL
            },

            function(accessToken, refreshToken, profile, done) {
                // asynchronous verification, for effect...
                process.nextTick(function () {
                    return done(null, profile);
                });
            }
        );

        passport.use(Strategy);
        return passport;
    }
};
