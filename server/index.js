var config = require('./config').get('forum'),
    template = require('./template').getInstance(config),
    logger = require('bem-site-logger').setOptions(config['logger']).createLogger(module),
    express = require('express'),
    _ = require('lodash'),
    app = express(),
    forumUtil = require('./util');

app.set('port', process.env.PORT || config.port)

// Development
if (forumUtil.isDev()) {

    // Logging http request
    app.use(require('morgan')('dev'));

    // Rebuild bundle on request
    app.use(require('enb/lib/server/server-middleware').createMiddleware({
        cdir: process.cwd(),
        noLog: false
    }));
}

app
    .use(require('serve-static')(process.cwd()))
    .use(require('serve-favicon')(process.cwd() + '/public/favicon.ico'))
    .use(require('cookie-parser')())
    .use(require('body-parser')())
    .use(require('express-session')({ secret: 'beminfoforum', saveUninitialized: false, resave: false }))

    // csrf protection
    .use(require('csurf')())

    // middleware for set default lang
    .use(require('./middleware/locale')(config.lang))

    // forum middleware
    .use(require('./middleware/forum')('/', app, config))

// Get results and templating data
app.use(function (req, res, next) {

    if (req.query._mode === 'json') {
        return res.end('<pre>' + JSON.stringify(res.locals, null, 4) + '</pre>');
    }

    /**
     * The generated html page using the bemhtml + bemhtml
     * and data obtained in middleware `forum`
     */

    return template.run({
        block: 'root',
        data: {
            title: res.locals.title,
            forum: res.locals
        }
    }, req, res, next);
});

app.use(function (err, req, res, next) {
    if ([500, 404, 400].indexOf(err.code) === -1) {
        err.code = 500;
    }

    var code = err.code,
        message = forumUtil.isDev() ? err.message : 'Error: ' + code;

    return res.status(code).send(message).end();
});

app.listen(app.get('port'), function () {
    logger.info('Forum running in %s environment, visit http://localhost:%s', app.get('env'), app.get('port'));
});
