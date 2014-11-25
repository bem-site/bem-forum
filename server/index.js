var express = require('express'),
    st = require('serve-static'),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    session = require('express-session'),
    csrf = require('csurf'),
    favicon = require('serve-favicon'),
    _ = require('lodash'),

    // forum modules
    forum = require('./forum'),
    config = require('./config').get('forum'),
    util = require('./util'),
    template = require('./template'),

    // app
    app = express();

if(util.isDev()) {
    app.use(require('enb/lib/server/server-middleware').createMiddleware({
        cdir: process.cwd(),
        noLog: false
    }));
}

app.set('port', process.env.PORT || config.port);

app
    .use(st(process.cwd()))
    .use(favicon(process.cwd() + '/public/favicon.ico'))
    .use(cookieParser()) //also is necessary for forum
    .use(bodyParser()) //also is necessary for forum
    .use(session({ secret: 'forum-session', saveUninitialized: true, resave: true }))
    .use(forum('/', config)) //forum middleware
    .use(function(req, res) {
        return template.run(_.extend({ block: 'page' }, req.__data), req)
            .then(function(html) {
                res.end(html);
            })
            .fail(function(err) {
                res.end(err);
            });
    });

app.listen(app.get('port'), function() {
    console.log('app forum running on port:', app.get('port'));
});
