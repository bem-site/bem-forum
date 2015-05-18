var _ = require('lodash'),
    vow = require('vow'),
    Archive = require('./archive.js'),
    Github = require('../services/github.js'),
    MemoryStorage = require('../services/memoryStorage.js'),
    Logger = require('bem-site-logger'),

    CONST = {
        MAX_RECORD_PER_PAGE: 100
    };

function Model (config) {
    this._init(config);
}

Model.prototype = {

    _init: function (config) {
        this._config = config;
        this._logger = Logger.setOptions(this._config['logger']).createLogger(module);
        this._github = Github.getInstance(config);
        this._storage = MemoryStorage.getInstance(config);
        this._archive = Archive.getInstance(config);
    },

    _onSuccess: function (options, data) {
        if (options.resolve) {
            return options.resolve(data);
        }

        var meta = data.meta,
            stData = options.stData,
            stOptions = options.stOptions,
            ghOptions = options.ghOptions,
            cb = options.cb,
            result;

        // We has had item and the datа wasn`t changed -> get item from storage
        if (stData && this._isDataNotChanged(meta)) {
            result = stData;
        } else {
            result = data;
            this._logger.info('x-ratelimit-remaining: %s', data.meta['x-ratelimit-remaining']);
            this._storage.setData('etag', stOptions, ghOptions, meta.etag);
            this._storage.setData('data', stOptions, ghOptions, data);
        }

        if (cb && _.isFunction(cb)) {
            result = cb.call(this, result);
        }

        return options.def.resolve(result);
    },

    _onError: function (def, err) {
        this._logger.error('Error occur: %s', err.message);
        return def.reject(err);
    },

    _isDataNotChanged: function (meta) {
        return meta.status.indexOf('304') !== -1;
    },

    /**
     * Check result.meta -> status, etag, x-ratelimit-remaining
     * @param req
     * @param token
     * @returns {*}
     */
    getLabels: function (req, token) {
        var def = vow.defer(),
            lang = req.lang,
            stOptions = { type: 'labels', lang: lang },
            labels = this._storage.getData('data', stOptions, null),
            eTag = this._storage.getData('etag', stOptions, null),
            options = {
                setRepoStorage: true,
                headers: eTag ? { 'If-None-Match': eTag } : {},
                per_page: 100,
                lang: lang,
                page: 1
            };

        function skipRemovedLabel(data) {
            return data.filter(function (label) {
                return !label.name || label.name !== 'removed';
            });
        }

        this._github.getLabels(token, options)
            .then(this._onSuccess.bind(this, {
                def: def,
                stData: labels,
                stOptions: stOptions,
                cb: skipRemovedLabel
            }))
            .fail(this._onError.bind(this, def));

        return def.promise();
    },

    getAuthUser: function (req, token, name) {
        var def = vow.defer();

        if (!token) {
            def.resolve();
        }

        var stOptions = { type: 'users', name: name },
            user = this._storage.getData('data', stOptions, null),
            eTag = this._storage.getData('etag', stOptions, null),
            headers = eTag ? { 'If-None-Match': eTag } : {};

        this._github
            .getAuthUser(token, { headers: headers })
            .then(this._onSuccess.bind(this, {
                def: def,
                stData: user,
                stOptions: stOptions
            }))
            .fail(this._onError.bind(this, def));

        return def.promise();
    },

    getIssues: function (req, token, isArchive) {
        var def = vow.defer(),
            query = req.query || {},
            options = {
                setRepoStorage: true,
                state: 'all',
                lang: req.lang,
                per_page: this._config.perPage,
                page: query.page || 1,
                sort: query.sort || 'updated',
                direction: query.direction || 'desc',
                labels: query.labels || ''
            },
            issues;

        if (isArchive) {

            try {
                issues = this._archive.getIssues(options);
                def.resolve(issues);
            } catch (err) {
                this._onError.bind(this, def, err);
            }

        } else {
            var stOptions = { type: 'issues', options: options },
                eTag = this._storage.getData('etag', stOptions, options),
                headers = eTag ? { 'If-None-Match': eTag } : {};

            issues = this._storage.getData('data', stOptions, options)

            this._github.getIssues(token, _.extend(options, { headers: headers }))
                .then(this._onSuccess.bind(this, {
                    def: def,
                    stData: issues,
                    stOptions: stOptions,
                    ghOptions: options
                }))
                .fail(this._onError.bind(this, def));
        }

        return def.promise();
    },

    getIssue: function (req, token, isArchive) {
        var def = vow.defer(),
            id = req.params && req.params.issue_id,
            options = {
                setRepoStorage: true,
                lang: req.lang,
                number: id
            },
            issue;

        if (isArchive) {
            try {
                issue = this._archive.getIssue(options);
                def.resolve(issue);
            } catch (err) {
                this._onError.bind(this, def, err);
            }
        } else {
            var stOptions = {
                    type: 'issue',
                    number: id
                },
                eTag = this._storage.getData('etag', stOptions, options),
                headers = eTag ? { 'If-None-Match': eTag } : {};

            issue = this._storage.getData('data', stOptions, options);

            this._github.getIssue(token, _.extend(options, { headers: headers }))
                .then(this._onSuccess.bind(this, {
                    def: def,
                    stData: issue,
                    stOptions: stOptions,
                    ghOptions: options
                }))
                .fail(this._onError.bind(this, def));
        }

        return def.promise();
    },

    createIssue: function (req, token) {
        var def = vow.defer(),
            body = req.body,
            options = {
                setRepoStorage: true,
                lang: req.lang,
                title: body.title,
                body: body.body,
                labels: body.labels
            };

        this._github.createIssue(token, options)
            .then(this._onSuccess.bind(this, def))
            .fail(this._onError.bind(this, def));

        return def.promise();
    },

    editIssue: function (req, token) {
        var def = vow.defer(),
            body = req.body,
            options = {
                setRepoStorage: true,
                lang: req.lang,
                number: body.number,
                title: body.title,
                body: body.body,
                labels: body.labels,
                state: body.state
            };

        this._github.editIssue(token, options)
            .then(this._onSuccess.bind(this, def))
            .fail(this._onError.bind(this, def));

        return def.promise();
    },

    getComments: function (req, token, isArchive) {
        var def = vow.defer(),
            id = req.params.issue_id,
            query = req.query,
            page = query && req.query.page,
            options = {
                setRepoStorage: true,
                lang: req.lang,
                number: id,
                page: page || 1,
                per_page: query && req.query.per_page || 100
            },
            comments;

        if (isArchive) {
            try {
                comments = this._archive.getComments(options);
                def.resolve(comments);
            } catch (err) {
                this._onError.bind(this, def, err);
            }
        } else {
            var stOptions = {
                    type: 'comments',
                    id: id,
                    page: page
                },
                eTag = this._storage.getData('etag', stOptions, options),
                headers = eTag ? { 'If-None-Match': eTag } : {};

            comments = this._storage.getData('data', stOptions, options)

            this._github.getComments(token, _.extend(options, { headers: headers }))
                .then(this._onSuccess.bind(this, {
                    def: def,
                    stData: comments,
                    stOptions: stOptions,
                    ghOptions: options
                }))
                .fail(this._onError.bind(this, def));
        }

        return def.promise();
    },

    createComment: function (req, token) {
        var def = vow.defer(),
            body = req.body,
            options = {
                setRepoStorage: true,
                lang: req.lang,
                number: body.number,
                body: body.body
            };

        this._github.createComment(token, options)
            .then(this._onSuccess.bind(this, def))
            .fail(this._onError.bind(this, def));

        return def.promise();
    },

    editComment: function (req, token) {
        var def = vow.defer(),
            body = req.body,
            options = {
                setRepoStorage: true,
                lang: req.lang,
                id: body.id,
                body: body.body
            };

        this._github.editComment(token, options)
            .then(this._onSuccess.bind(this, def))
            .fail(this._onError.bind(this, def));

        return def.promise();
    },

    deleteComment: function (req, token) {
        var def = vow.defer(),
            options = {
                setRepoStorage: true,
                lang: req.lang,
                id: req.body.id
            };

        this._github.deleteComment(token, options)
            .then(this._onSuccess.bind(this, def))
            .fail(this._onError.bind(this, def));

        return def.promise();
    },

    inspectArchiveIssues: function (req) {
        var query = req.query || {},
            issues = this._archive.getIssues({
                lang: req.lang,
                per_page: this._config.perPage,
                page: 1,
                sort: 'updated',
                direction: 'desc',
                labels: query.labels || ''
            });

        return issues && issues.length ? true : false;
    }
};

module.exports = Model;
