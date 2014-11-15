var FacebookStrategy = require('passport-facebook').Strategy;

module.exports = {
	init: function (passport, options) {
		if (typeof options == null || !options.clientID || !options.clientSecret || !options.callbackURL) {
			return passport;
		}

		console.log("Inside facebook init strategy.")

		// Passport session setup.
		//   To support persistent login sessions, Passport needs to be able to
		//   serialize users into and deserialize users out of the session.  Typically,
		//   this will be as simple as storing the user ID when serializing, and finding
		//   the user by ID when deserializing.  However, since this example does not
		//   have a database of user records, the complete Facebook profile is serialized
		//   and deserialized.
		passport.serializeUser(function(user, done) {
			console.log("Should SERIALIZE USER: ", user)
			done(null, user);
		});

		passport.deserializeUser(function(obj, done) {
			console.log("Should DEEESERIALIZE USER: ", obj)
			done(null, obj);
		});

		// Use the FacebookStrategy within Passport.
		//   Strategies in Passport require a `verify` function, which accept
		//   credentials (in this case, an accessToken, refreshToken, and Facebook
		//   profile), and invoke a callback with a user object.

		Strategy = new FacebookStrategy({
				clientID: options.clientID,
				clientSecret: options.clientSecret,
				callbackURL: options.callbackURL
			},

			function(accessToken, refreshToken, profile, done) {
				// asynchronous verification, for effect...
				process.nextTick(function () {
					// To keep the example simple, the user's Facebook profile is returned to
					// represent the logged-in user.  In a typical application, you would want
					// to associate the Facebook account with a user record in your database,
					// and return that user instead.
					//console.log("User arguments: ", accessToken, refreshToken, profile)
					//console.log("User PROFILE: ", Strategy.userProfile(accessToken, function (err, data) {
					//	console.log("DONE:: ", arguments)
					//}))
					return done(null, profile);
				});
			}
		)

		passport.use(Strategy);

		return passport;
	}
}