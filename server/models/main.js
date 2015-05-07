var _ = require('lodash'),
    vow = require('vow'),
    Github = require('../services/github.js'),
    MemoryStorage = require('../services/memoryStorage.js'),
    Logger = require('bem-site-logger');

function Model (config) {
    this._init(config);
}

Model.prototype = {

    _init: function (config) {
        this._config = config;
        this._logger = Logger.setOptions(this._config['logger']).createLogger(module);
        this._github = Github.getInstance(config);
        this._storage = MemoryStorage.getInstance(config);
    },

    _onSuccess: function (def, item, stOptions, options, data) {
        // issues type have additional arguments
        if (['issues', 'issue', 'comments'].indexOf(stOptions.type) === -1) {
            data = options;
        }

        var meta = data.meta;

        // We has had item and the datа wasn`t changed -> get item from storage
        if (item && this._isDataNotChanged(meta)) {
            return def.resolve(item);
        }

        // We don`t have a datа or datа was changed -> resolve with new data
        this._logger.info('x-ratelimit-remaining: %s', data.meta['x-ratelimit-remaining']);
        this._storage.setEtag(stOptions, meta.etag, options);
        this._storage.setData(stOptions, data, options);

        return def.resolve(data);
    },

    _onError: function (def, err) {
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
            labels = this._storage.getData(stOptions),
            eTag = this._storage.getEtag(stOptions),
            options = {
                setRepoStorage: true,
                headers: eTag ? { 'If-None-Match': eTag } : {},
                per_page: 100,
                lang: lang,
                page: 1
            };

        this._github.getLabels(token, options)
            .then(this._onSuccess.bind(this, def, labels, stOptions))
            .fail(this._onError.bind(this, def));

        return def.promise();
    },

    getAuthUser: function (req, token, name) {
        var def = vow.defer();

        if (!token) {
            return def.resolve();
        }

        var stOptions = { type: 'users', name: name },
            user = this._storage.getData(stOptions),
            eTag = this._storage.getEtag(stOptions);

        this._github
            .getAuthUser(token, { headers: eTag ? { 'If-None-Match': eTag } : {} })
            .then(this._onSuccess.bind(this, def, user, stOptions))
            .fail(this._onError.bind(this, def));

        return def.promise();
    },

    getIssues: function (req, token) {
        var def = vow.defer(),
            query = req.query || {},
            options = {
                setRepoStorage: true,
                state: 'all',
                lang: req.lang,
                per_page: this._config.perPage,
                page: query.page || 1,
                sort: query.labels || 'comments',
                labels: query.labels || ''
            },
            stOptions = { type: 'issues', options: options },
            issues = this._storage.getData(stOptions, options),
            eTag = this._storage.getEtag(stOptions, options);

        this._github.getIssues(token, _.extend(options, { headers: eTag ? { 'If-None-Match': eTag } : {} }))
            .then(this._onSuccess.bind(this, def, issues, stOptions, options))
            .fail(this._onError.bind(this, def));

        return def.promise();
    },

    getIssue: function (req, token) {
        var def = vow.defer(),
            id = req.params && req.params.issue_id,
            options = {
                setRepoStorage: true,
                lang: req.lang,
                number: id
            },
            stOptions = {
                type: 'issue',
                number: id
            },
            issue = this._storage.getData(stOptions, options),
            eTag = this._storage.getEtag(stOptions, options);

        this._github.getIssue(token, _.extend(options, { headers: eTag ? { 'If-None-Match': eTag } : {} }))
            .then(this._onSuccess.bind(this, def, issue, stOptions, options))
            .fail(this._onError.bind(this, def));

        return def.promise();
    },

    getComments: function (req, token) {
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
            stOptions = {
                type: 'comments',
                id: id,
                page: page
            },
            comments = this._storage.getData(stOptions, options),
            eTag = this._storage.getEtag(stOptions, options);

        this._github.getComments(token, _.extend(options, { headers: eTag ? { 'If-None-Match': eTag } : {} }))
            .then(this._onSuccess.bind(this, def, comments, stOptions, options))
            .fail(this._onError.bind(this, def));

        return def.promise();
    },

    createComment: function (req, token) {
        var body = req.body,
            options = {
                setRepoStorage: true,
                lang: req.lang,
                number: body.number,
                body: body.body
            };

        return this._github.createComment(token, options);
    },

    editComment: function (req, token) {
        var body = req.body,
            options = {
                setRepoStorage: true,
                lang: req.lang,
                id: body.id,
                body: body.body
            };

        return this._github.editComment(token, options);
    },

    deleteComment: function (req, token) {
        var options = {
                setRepoStorage: true,
                lang: req.lang,
                id: req.body.id
            };

        return this._github.deleteComment(token, options);
    }
};

module.exports = Model;
