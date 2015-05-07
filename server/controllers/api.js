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
        var _this = this,
            context = {
                block: 'comments',
                mods: { view: 'close' },
                issueNumber: req.params && req.params.issue_id
            },
            token = this.getCookie(req, 'token'),
            name = this.getCookie(req, 'name');

        vow.all({
            comments: this._model.getComments(req, token),
            user: this._model.getAuthUser(req, token, name)
        })
        .then(function (data) {
            _this._render(req, res, next, context, data);
        })
        .fail(function (err) {
            res.status(500);
            return next(err);
        });
    },

    editComment: function (req, res, next) {
        return res.end('Hello! This is a start point of API BEM-forum.');
    },

    deleteComment: function (req, res, next) {
        return res.end('Hello! This is a start point of API BEM-forum.');
    },

    _render: function (req, res, next, context, data) {
        res.locals = _.extend(res.locals, data, this.getTmplHelpers(req), { xhr: true });

        if (req.query._mode === 'json') {
            return res.json(JSON.stringify(data));
        }

        var ctx = {
            block: 'root',
            context: context,
            data: { forum: res.locals }
        };

        return this._template.run(ctx, req, res, next);
    }
});
