var _ = require('lodash'),
    vow = require('vow'),
    inherit = require('inherit'),
    Logger = require('bem-site-logger'),
    BaseController = require('./base.js'),
    util = require('../util.js'),
    Template = require('../template');

module.exports = inherit(BaseController, {

    __constructor: function (config) {
        this.__base(config);
        this._logger = Logger.setOptions(this._config['logger']).createLogger(module);
        this._template = Template.getInstance(config);
    },

    index: function (req, res, next) {
        return res.end('Hello! This is a start point of API BEM-forum.');
    },

    postIssue: function (req, res, next) {
        return res.end('Hello! This is a start point of API BEM-forum.');
    },

    getIssues: function (req, res, next) {
        return res.end('Hello! This is a start point of API BEM-forum.');
    },

    getIssue: function (req, res, next) {
        return res.end('Hello! This is a start point of API BEM-forum.');
    },

    editIssue: function (req, res, next) {
        return res.end('Hello! This is a start point of API BEM-forum.');
    },

    deleteIssue: function (req, res, next) {
        return res.end('Hello! This is a start point of API BEM-forum.');
    },

    postComment: function (req, res, next) {
        return res.end('Hello! This is a start point of API BEM-forum.');
    },

    getComments: function (req, res, next) {
        return res.end('Hello! This is a start point of API BEM-forum.');
        //var id = req.params && req.params.issue_id,
        //    mode = req.query && req.query.__mode,
        //    ctx = {
        //        block: 'comments',
        //        mods: { view: 'close' },
        //        issueNumber: id,
        //        forumUrl: this._config.url
        //    };
        //
        //this._template.run(ctx, req)
        //    .then(function (html) {
        //        return res.end(html);
        //    })
        //    .fail(function (err) {
        //        return next(err);
        //    })
    },

    editComment: function (req, res, next) {
        return res.end('Hello! This is a start point of API BEM-forum.');
    },

    deleteComment: function (req, res, next) {
        return res.end('Hello! This is a start point of API BEM-forum.');
    }
});
