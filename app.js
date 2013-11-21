var FS = require('fs'),
    VM = require('vm'),
    HTTP = require('http'),
    express = require('express'),
    app = express(),
    Vow = require('vow'),
    GithubApi = require('github'),
    marked = require('marked');

var github = new GithubApi({
    version: '3.0.0',
    // debug: true,
    timeout: 5000
});

marked.setOptions({ gfm: true });

var bemtreeTemplate = FS.readFileSync('./desktop.bundles/index/index.bemtree.js', 'utf-8'),
    BEMHTML = require('./desktop.bundles/index/_index.bemhtml.js').BEMHTML;

var context = VM.createContext({
    console: console,
    Vow: Vow,
    github: github,
    marked: marked
});

VM.runInContext(bemtreeTemplate, context);
BEMTREE = context.BEMTREE;

var server = HTTP.createServer(app),
    port = process.env.PORT || 3000;

server.listen(port, function() {
    console.log('bem-forum server listening on ' + port);
});

app.get('/', function(req, res) {
    BEMTREE.apply({ block: 'page' }).then(function(bemjson) {
        // res.send(JSON.stringify(bemjson, null, '\t'));
        res.send(BEMHTML.apply(bemjson));
    });
});
