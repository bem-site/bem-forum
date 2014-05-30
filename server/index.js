var express = require('express'),
    morgan  = require('morgan'),
    st = require('serve-static'),
    cookieParser = require('cookie-parser'),
    forum = require('./forum'),
    config = require('./config'),
    template = require('./template');

var app = express();

if('development' === config.get('NODE_ENV')) {
    app.use(require('enb/lib/server/server-middleware').createMiddleware({
        cdir: process.cwd(),
        noLog: false
    }));
}

app
    .use(st(process.cwd()))
    .use(morgan('default'))
    .use(cookieParser()) //also is necessary for forum
    .use(forum('/')) //forum middleware
    .use(function(req, res) {
        console.log('!!!!!');
        return template.run({ block: 'page' }, req.query.__mode)
            .then(function(html) {
                res.end(html);
            })
            .fail(function(err) {
                res.end(err);
            });
    });

app.listen(3000, function() { console.log('server started on port 3000'); });
