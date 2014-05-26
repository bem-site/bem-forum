var express = require('express'),
    morganMW  = require('morgan'),
    staticMW = require('serve-static'),
    enbMW = require('enb/lib/server/server-middleware'),
    template = require('./template');

var app = express();

app.use(enbMW.createMiddleware({
    cdir: process.cwd(),
    noLog: false
}));

app.use(staticMW(process.cwd()))
app.use(morganMW('default'));


app.get('/', function(req, res, next){
    next();
});

app.use(function(req, res, next) {
    return template.run({}, req.query.__mode)
        .then(function(html) {
            res.end(html);
        })
        .fail(function(err) {
            next(err);
        });
});


app.listen(3000);
