var express = require('express'),
    st = require('serve-static'),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    session = require('express-session'),
    csrf = require('csurf'),
    favicon = require('serve-favicon'),
    morgan = require('morgan'),

    _ = require('lodash'),

    // forum modules
    forum = require('./middleware/forum'),
    locale = require('./middleware/locale'),
    config = require('./config').get('forum'),
    util = require('./util'),
    template = require('./template'),

    app = express(),

    logger = require('bem-site-logger').setOptions(config['logger']).createLogger(module);

if (app.get('env') === 'development') {

    // Logging http request
    app.use(morgan('dev'));

    // // Rebuild bundle on request
    app.use(require('enb/lib/server/server-middleware').createMiddleware({
        cdir: process.cwd(),
        noLog: false
    }));
}

app
    .set('port', process.env.PORT || config.port)
    .use(st(process.cwd()))
    .use(favicon(process.cwd() + '/public/favicon.ico'))
    .use(cookieParser())
    .use(bodyParser())
    .use(session({ secret: 'beminfoforum', saveUninitialized: false, resave: false }))
    .use(csrf())
    .use(locale(config.lang))
    .use(forum(app, config, 'forum')) // forum middleware
    .use(function (req, res) {
        /**
         * get data`s json without templating
         */
        if (req.query._mode === 'json') {
            return res.json(res.locals);
        }

        if (req.cookies && req.cookies['forum_token']) {
            return res.end('TOKEN NA BASE)');
        }

        return res.end(JSON.stringify(res.locals, null, 4) || req.url || 'empty');

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
