var config = require('./config').get('forum'),
    template = require('./template'),

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
app.use(function (req, res) {
    /**
     * get data`s json without templating
     */
    //if (req.query._mode === 'json') {
        return res.end('<pre>' + JSON.stringify(res.locals, null, 4) + '</pre>');
    //}

    /**
     * The generated html page using the bemhtml + bemhtml
     * and data obtained in middleware `forum`
     */
    //return template.run(_.extend({ block: 'page' }, req.locals), req)
    //    .then(function (html) {
    //        res.end(html);
    //    })
    //    .fail(function (err) {
    //        res.end(err);
    //    });
});

app.listen(app.get('port'), function () {
    logger.info('Forum running, visit http://localhost:%s', app.get('port'));
});
