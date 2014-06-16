var express = require('express'),
    morgan  = require('morgan'),
    st = require('serve-static'),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    forum = require('./forum'),
    config = require('./config'),
    util = require('./util'),
    template = require('./template');

var app = express();

if(util.isDev()) {
    app.use(require('enb/lib/server/server-middleware').createMiddleware({
        cdir: process.cwd(),
        noLog: false
    }));
}

/*
{
     "auth": {
        "tokens": [
            "7a2fb4d7a380f8a20562f5fc910f35d3b1605341"
         ]
     },
     "storage": {
        "user": "name of github user or organization",
        "repo": "name of repository"
     },
     "oauth": {
         "localhost": {
            "clientId": "....",
            "secret": "....",
            "redirectUrl": "http://...."
         }
     }
}
 */
var forumOptions = config.get('forum');


app
    .use(st(process.cwd()))
    .use(morgan('default')) //todo remove it after development
    .use(cookieParser()) //also is necessary for forum
    .use(bodyParser()) //also is necessary for forum
    .use(forum('/', forumOptions)) //forum middleware
    .use(function(req, res) {
        return template.run({ block: 'page' }, req)
            .then(function(html) {
                res.end(html);
            })
            .fail(function(err) {
                res.end(err);
            });
    });

app.listen(3000, function() { console.log('server started on port 3000'); });
