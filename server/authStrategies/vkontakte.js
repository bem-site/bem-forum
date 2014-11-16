var VKontakteStrategy = require('passport-vkontakte').Strategy,
    Strategy;

module.exports = {
    init: function (passport, options) {
        if (typeof options === null || !options.clientID || !options.clientSecret || !options.callbackURL) {
            return passport;
        }

        Strategy = new VKontakteStrategy({
                clientID: options.clientID,
                clientSecret: options.clientSecret,
                callbackURL: options.callbackURL,
                apiVersion: '5.26'
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
