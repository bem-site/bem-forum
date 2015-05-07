var config = require('./config').get('forum'),
    template = require('./template').getInstance(config),

    logger = require('bem-site-logger').setOptions(config['logger']).createLogger(module),
    express = require('express'),
    _ = require('lodash'),

    app = express();

if (app.get('env') === 'development') {

    // Logging http request
    app.use(require('morgan')('dev'));

    // // Rebuild bundle on request
    app.use(require('enb/lib/server/server-middleware').createMiddleware({
        cdir: process.cwd(),
        noLog: false
    }));
}

app
    .set('port', process.env.PORT || config.port)
    .use(require('serve-static')(process.cwd()))
    .use(require('serve-favicon')(process.cwd() + '/public/favicon.ico'))
    .use(require('cookie-parser')())
    .use(require('body-parser')())
    .use(require('express-session')({ secret: 'beminfoforum', saveUninitialized: false, resave: false }))
    .use(require('csurf')())
    .use(require('./middleware/locale')(config.lang))
    .use(require('./middleware/forum')('/', app, config)) // forum middleware

/**
 * Get results and templating data
 */
app.use(function (req, res, next) {
    /**
     * get data`s json without templating
     */
    if (req.query._mode === 'json') {
        return res.end('<pre>' + JSON.stringify(res.locals, null, 4) + '</pre>');
    }

    /**
     * The generated html page using the bemhtml + bemhtml
     * and data obtained in middleware `forum`
     */

    return template.run({ block: 'root', data: { forum: res.locals }}, req, res, next);
});

app.use(function (err, req, res, next) {
    console.error(err);
    return res.status(err.code).send(err.message).end();
});

app.listen(app.get('port'), function () {
    logger.info('Forum running in %s environment, visit http://localhost:%s', app.get('env'), app.get('port'));
});
