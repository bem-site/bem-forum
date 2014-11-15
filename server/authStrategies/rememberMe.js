var RememberMeStrategy = require('passport-remember-me').Strategy,
	Strategy;

module.exports = {
	init: function (passport, options) {
		if (typeof options == null || !options.key) {
			return passport;
		}

		Strategy = new RememberMeStrategy({
				key: '_token' //Указываем имя cookie, где хранится ваш token
			},
			function(token, done) {
				// Example User should be ORM for our user
				User
					.findOne()
					.where({
						autoLoginHash: token
					})
					.done(function(error, user) {
						if (error) {
							done(error);
						} else if (!user) {
							done(null, false);
						} else {
							delete user.autoLoginHash;
							user.save(function() {});
							done(null, user);
						}
					});
			}, function(user, done) {
				var token = crypto.randomBytes(32).toString('hex');
				user.autoLoginHash = token;
				user.save(function() {});
				done(null, token);
			})

		passport.use(Strategy);

		return passport
	}
};