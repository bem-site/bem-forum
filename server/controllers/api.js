var _ = require('lodash'),
    vow = require('vow'),
    inherit = require('inherit'),
    Logger = require('bem-site-logger'),
    BaseController = require('./base.js'),
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
        var cookie = this.getCookie(req),
            query = req.query,
            page = query && query.page || 1,
            isArchive = this.isArchive(req, page);

        res.locals.isArchive = isArchive;

        return vow.all({
            issues: this._model.getIssues(req, cookie.token, isArchive),
            user: this._model.getAuthUser(req, cookie.token, cookie.name)
        })
        .then(function (data) {
            var def = vow.defer(),
                isLastPage = this.isLastPage(data.issues),
                context = {
                    block: 'forum-issues',
                    js: { isLastPage: isLastPage, isArchive: isArchive }
                };

            if (!isArchive && isLastPage) {
                var archiveInfo = this.validateArchive(req);

                context.js = _.extend(context.js, {
                    isMatchArchive: archiveInfo.isMatchArchive,
                    archiveUrl: archiveInfo.archiveUrl
                });
            }

            this._render(req, res, next, context, data);
            return def.promise();
        }, this)
        .fail(this.onError.bind(this, next));
    },

    getIssue: function (req, res, next) {
        return res.end('Hello! This is a start point of API BEM-forum.');
    },

    createIssue: function (req, res, next) {
        var context = { block: 'issue' };

        return this._model.createIssue(req, this.getCookie(req).token)
            .then(function (issue) {
                return this._render(req, res, next, context, { issue: issue });
            }, this)
            .fail(this.onError.bind(this, next));
    },

    editIssue: function (req, res, next) {
        var cookie = this.getCookie(req),
            config = this._config,
            context = { block: 'issue' };

        // To add labels, select the token with admin rights
        if (req.query && req.query.__admin) {
            if (config.auth && config.auth['admin-token']) {
                cookie.token = config.auth['admin-token'];
            } else {
                this._logger.warn('Failed to add labels when editing issue,' +
                ' for this you need to add the admin token in');
            }
        }

        return this._model.editIssue(req, cookie.token)
            .then(function (issue) {
                res.locals.issue = issue;
                return this._model.getAuthUser(req, cookie.token, cookie.name);
            }, this)
            .then(function (user) {
                return this._render(req, res, next, context, { user: user });
            }, this)
            .fail(this.onError.bind(this, next));
    },

    createComment: function (req, res, next) {
        var context = {
                block: 'comment',
                issueNumber: req.params && req.params.number
            },
            cookie = this.getCookie(req);

        return this._model.createComment(req, cookie.token)
            .then(function (comment) {
                res.locals.comment = comment;
                return this._model.getAuthUser(req, cookie.token, cookie.name);
            }, this)
            .then(function (user) {
                return this._render(req, res, next, context, { user: user });
            }, this)
            .fail(this.onError.bind(this, next));
    },

    getComments: function (req, res, next) {
        var issueId = req.params && req.params.issue_id,
            context = {
                block: 'comments',
                mods: { view: 'close' },
                issueNumber: issueId
            },
            cookie = this.getCookie(req),
            isArchive = this.isArchive(req, issueId);

        // Check whether the archive page
        res.locals.isArchive = isArchive;

        return vow.all({
            comments: this._model.getComments(req, cookie.token, isArchive),
            user: this._model.getAuthUser(req, cookie.token, cookie.name)
        })
        .then(function (data) {
            return this._render(req, res, next, context, data);
        }, this)
        .fail(this.onError.bind(this, next));
    },

    editComment: function (req, res, next) {
        var context = {
                block: 'comment',
                issueNumber: req.params && req.params.number
            },
            cookie = this.getCookie(req);

        return this._model.editComment(req, cookie.token)
            .then(function (comment) {
                res.locals.comment = comment;
                return this._model.getAuthUser(req, cookie.token, cookie.name);
            }, this)
            .then(function (user) {
                return this._render(req, res, next, context, { user: user });
            }, this)
            .fail(this.onError.bind(this, next));
    },

    deleteComment: function (req, res, next) {
        return this._model
            .deleteComment(req, this.getCookie(req).token)
            .then(function () {
                return res.end('ok');
            })
            .fail(this.onError.bind(this, next));
    },

    getLabels: function (req, res, next) {
        var context = { block: 'forum-labels', mods: { view: req.query && req.query.view } };

        return this._model.getLabels(req, this.getCookie(req).token)
            .then(function (labels) {
                return this._render(req, res, next, context, { labels: labels });
            }, this)
            .fail(this.onError.bind(this, next));
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
