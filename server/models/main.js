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

    _onSuccess: function (def, item, argv, options, data) {
        if (argv.type !== 'issues') {
            data = options;
            //isHidePagination: function (issues) {
            //    return issues.length < this._config.perPage;
            //},
        }

        var meta = data.meta;

        // We has had item and the datа wasn`t changed -> get item from storage
        if (item && this._isDataNotChanged(meta)) {
            return def.resolve(item);
        }

        // We don`t have a datа or datа was changed -> resolve with new data
        this._logger.info('x-ratelimit-remaining: %s', data.meta['x-ratelimit-remaining']);
        this._storage.setEtag(argv, meta.etag, options);
        this._storage.setStorage(argv, data, options);

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
     * @param token
     * @param lang
     * @returns {*}
     */
    getLabels: function (token, lang) {
        var def = vow.defer(),

            argv = { type: 'labels', lang: lang },
            labels = this._storage.getStorage(argv),
            eTag = this._storage.getEtag(argv),

            options = {
                setRepoStorage: true,
                headers: eTag ? { 'If-None-Match': eTag } : {},
                per_page: 100,
                lang: lang,
                page: 1
            };

        this._github.getLabels(token, options)
            .then(this._onSuccess.bind(this, def, labels, argv))
            .fail(this._onError.bind(this, def));

        return def.promise();
    },

    getAuthUser: function (req, token, name) {
        var def = vow.defer();

        if (!token) {
            return def.resolve();
        }

        var argv = { type: 'users', name: name },
            user = this._storage.getStorage(argv),
            eTag = this._storage.getEtag(argv);

        this._github
            .getAuthUser(token, { headers: eTag ? { 'If-None-Match': eTag } : {} })
            .then(this._onSuccess.bind(this, def, user, argv))
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
            argv = { type: 'issues', options: options },
            issues = this._storage.getStorage(argv, options),
            eTag = this._storage.getEtag(argv, options);

        this._github.getIssues(token, _.extend(options, { headers: eTag ? { 'If-None-Match': eTag } : {} }))
            .then(this._onSuccess.bind(this, def, issues, argv, options))
            .fail(this._onError.bind(this, def));

        return def.promise();
    }
};

module.exports = Model;
