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

    getIssues: function (req, res, next) {
        var _this = this,
            token = this.getCookie(req, 'token'),
            name = this.getCookie(req, 'name'),
            isArchive = this.isArchive(req, res),
            isLangSupportArchive = this.isLangSupportArchive(req);

        // Check whether the archive page
        res.locals.isArchive = isArchive;
        res.locals.isLangSupportArchive = isLangSupportArchive;

        vow.all({
            issues: this._model.getIssues(req, token, isArchive),
            user: this._model.getAuthUser(req, token, name)
        })
        .then(function (data) {
            var context = {
                block: 'forum-issues',
                js: {
                    isLastPage: _this.isLastPage(data.issues, _this._config.perPage),
                    isArchive: isArchive,
                    isLangSupportArchive: isLangSupportArchive
                }
            };

            _this._render(req, res, next, context, data);
        })
        .fail(function (err) {
            return next(err);
        });
    },

    getIssue: function (req, res, next) {
        return res.end('Hello! This is a start point of API BEM-forum.');
    },

    createIssue: function (req, res, next) {
        var _this = this,
            token = this.getCookie(req, 'token'),
            name = this.getCookie(req, 'name'),
            context = { block: 'issue' };

        this._model.createIssue(req, token)
            .then(function (issue) {
                _this._render(req, res, next, context, { issue: issue });
            })
            .fail(function (err) {
                return next(err);
            });
    },

    editIssue: function (req, res, next) {
        var _this = this,
            token = this.getCookie(req, 'token'),
            name = this.getCookie(req, 'name'),
            config = this._config,
            context = { block: 'issue' };

        // To add labels, select the token with admin rights
        if (req.query && req.query.__admin) {
            if (config.auth && config.auth['admin-token']) {
                token = config.auth['admin-token'];
            } else {
                this._logger.warn('Failed to add labels when editing issue,' +
                ' for this you need to add the admin token in');
            }
        }

        this._model.editIssue(req, token)
            .then(function (issue) {
                res.locals.issue = issue;
                return _this._model.getAuthUser(req, token, name);
            })
            .then(function (user) {
                _this._render(req, res, next, context, { user: user });
            })
            .fail(function (err) {
                return next(err);
            });
    },

    deleteIssue: function (req, res, next) {
        return res.end('Hello! This is a start point of API BEM-forum.');
    },

    createComment: function (req, res, next) {
        var _this = this,
            context = {
                block: 'comment',
                issueNumber: req.params && req.params.number
            },
            token = this.getCookie(req, 'token'),
            name = this.getCookie(req, 'name');

        this._model.createComment(req, token)
            .then(function (comment) {
                res.locals.comment = comment;
                return _this._model.getAuthUser(req, token, name);
            })
            .then(function (user) {
                _this._render(req, res, next, context, { user: user });
            })
            .fail(function (err) {
                return next(err);
            });
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

        // Check whether the archive page
        res.locals.isArchive = this.isArchive(req);

        vow.all({
            comments: this._model.getComments(req, token, res.locals.isArchive),
            user: this._model.getAuthUser(req, token, name)
        })
        .then(function (data) {
            _this._render(req, res, next, context, data);
        })
        .fail(function (err) {
            return next(err);
        });
    },

    editComment: function (req, res, next) {
        var _this = this,
            context = {
                block: 'comment',
                issueNumber: req.params && req.params.number
            },
            token = this.getCookie(req, 'token'),
            name = this.getCookie(req, 'name');

        this._model.editComment(req, token)
            .then(function (comment) {
                res.locals.comment = comment;
                return _this._model.getAuthUser(req, token, name);
            })
            .then(function (user) {
                _this._render(req, res, next, context, { user: user });
            })
            .fail(function (err) {
                return next(err);
            });
    },

    deleteComment: function (req, res, next) {
        this._model
            .deleteComment(req, this.getCookie(req, 'token'))
            .then(function () {
                return res.end('ok');
            })
            .fail(function (err) {
                return next(err);
            });
    },

    getLabels: function (req, res, next) {
        var _this = this,
            context = { block: 'forum-labels', mods: { view: req.query && req.query.view } };

        _this._model.getLabels(req, this.getCookie(req, 'token'))
            .then(function (labels) {
                _this._render(req, res, next, context, { labels: labels });
            })
            .fail(function (err) {
                return next(err);
            });

    },

    _render: function (req, res, next, context, data) {
        res.locals = _.extend(res.locals, data, this.getTmplHelpers(req), { xhr: true });

        if (req.query.__mode === 'json') {
            return res.json(data);
        }

        var ctx = {
            block: 'root',
            context: context,
            data: { forum: res.locals }
        };

        return this._template.run(ctx, req, res, next);
    }
});
