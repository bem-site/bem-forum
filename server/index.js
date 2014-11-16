var express = require('express'),
    morgan  = require('morgan'),
    st = require('serve-static'),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    session = require('express-session'),
    flash = require('connect-flash'),
    passport = require('./passport'),
    csrf = require('csurf'),
    _ = require('lodash'),
    forum = require('./forum'),
    config = require('./config'),
    util = require('./util'),
    template = require('./template'),

    app = express();

if (util.isDev()) {
    app.use(require('enb/lib/server/server-middleware').createMiddleware({
        cdir: process.cwd(),
        noLog: false
    }));
}

var forumOptions = config.get('forum');

app
    .use(st(process.cwd()))
    .use(morgan('default')) // todo remove it after development
    .use(cookieParser()) // also is necessary for forum
    .use(bodyParser()) // also is necessary for forum
    .use(session({
        secret: 'forum-session',
        saveUninitialized: true,
        resave: true,
        cookie: { maxAge: 24 * 60 * 60 * 1000 }
    }))
    .use(passport.initialize())
    .use(passport.session())
    .use(flash());

Object.keys(forumOptions.passport.strategies).forEach(function (strategyName) {
    app.get(u.format('/auth/%s', strategyName), passport.authenticate(strategyName));
    app.get(u.format('/auth/%s/callback', strategyName), function (err, user, info) {
        var expires = new Date(Date.now() + (86400000 * 5)); // 5 days
        res.cookie('forum_username', user.username, { expires: expires });
        // res.cookie('forum_token', access_token, { expires: expires });
        return res.redirect('/');
    })(req, res, next);
});


// handle the callback after facebook has authenticated the user
app.get('/auth/github/callback',
    passport.authenticate('github', {
        successRedirect: '/',
        failureRedirect: '/'
    }));

app.use(forum('/', forumOptions, passport)) // forum middleware
    .use(function(req, res) {
        return template.run(_.extend({ block: 'page' }, req.__data), req)
            .then(function (html) {
                res.end(html);
            })
            .fail(function (err) {
                res.end(err);
            });
    });

app.listen(3000, function () {
    console.log('server started on port 3000');
});
