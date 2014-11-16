var LocalStrategy = require('passport-local').Strategy,
Strategy;

module.exports = {
    init: function (passport, options) {
        if (typeof options == null) {
            return passport;
        }

        Strategy = new LocalStrategy({
                usernameField: 'username',
                passwordField: 'password'
            },
            function(username, password, next) {
                User
                    .findOne()
                    .where({
                        or: [{
                            username: username
                        }, {
                            email: username
                        }]
                    })
                    .done(function(error, user) {
                        if (error) {
                            next(error);
                        } else if (!user) {
                            next(false, false, 'This user not exists');
                        } else if (!bcrypt.compareSync(password, user.password)) {
                            next(false, false, 'Wrong password');
                        } else {
                            next(false, user);
                        }
                    });
            }
        )

        passport.use(Strategy);

        return passport;
    }
};
