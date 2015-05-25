var config = require('./config').get('forum'),
    template = require('./template').getInstance(config),
    logger = require('bem-site-logger').setOptions(config.logger).createLogger(module),
    express = require('express'),
    app = express(),
    forumUtil = require('./util');

app.set('port', process.env.PORT || config.port);

// 1. Middleware for development env
if (forumUtil.isDev()) {

    // Logging http request
    app.use(require('morgan')('dev'));

    // Rebuild bundle on request
    app.use(require('enb/lib/server/server-middleware').createMiddleware({
        cdir: process.cwd(),
        noLog: false
    }));
}
// 2. Middleware for all env
app
    .use(require('serve-static')(process.cwd()))
    .use(require('serve-favicon')(process.cwd() + '/public/favicon.ico'))
    .use(require('cookie-parser')())
    .use(require('body-parser')())
    .use(require('express-session')({ secret: config.auth.secret, saveUninitialized: false, resave: false }))

    // csrf protection
    .use(require('csurf')())

    // middleware for set default lang
    .use(require('./middleware/locale')(config.lang))

    // forum middleware
    .use(require('./middleware/forum')('/', app, config));

// 3. Get html/json results
app.use(function (req, res, next) {
    var locals = res.locals;

    if (req.query._mode === 'json') {
        return res.end('<pre>' + JSON.stringify(locals, null, 4) + '</pre>');
    }

    return template.run({
        block: 'root',
        data: {
            title: locals.title,
            forum: locals
        }
    }, req, res, next);
});

// 4. Error handler
app.use(function (err, req, res) {
    if ([500, 404, 400].indexOf(err.code) === -1) {
        err.code = 500;
    }

    var code = err.code,
        message = forumUtil.isDev() ? err.message : 'Error: ' + code;

    return res.status(code).send(message).end();
});

// 5. Start app
app.listen(app.get('port'), function () {
    logger.info('Forum running in %s environment, visit http://localhost:%s', app.get('env'), app.get('port'));
});
