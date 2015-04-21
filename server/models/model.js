var _ = require('lodash'),
    vow = require('vow'),
    Github = require('../github.js'),
    Logger = require('bem-site-logger');

function Model (config) {
    this._init(config);
}

Model.prototype = {

    _storage: {},

    _init: function (config) {
        this._config = config;
        this._logger = Logger.setOptions(this._config['logger']).createLogger(module);
        this._github = new Github(config);
        this._initMemoryStorage();
    },

    _initMemoryStorage: function () {
        var storageByLang = this._config.storage;

        if (!storageByLang || _.isEmpty(storageByLang)) {
            this._logger.error('forum middleware storage info not found in config');
            process.exit(1);
        }

        this._storage = {};

        // Generate basic storage by lang
        _.keys(storageByLang).forEach(function (lang) {
            this._storage[lang] = {
                users: {},
                issues: {},
                labels: { etag: '', data: [] },
                comments: { etag: '', data: [] }
            }
        }, this);

        return this._storage;
    },

    _isDataNotChanged: function (meta) {
        return meta.status.indexOf('304') !== -1;
    },

    _isEndedApiReq: function (meta) {
        return meta['x-ratelimit-remaining'] < 100;
    },

    _getStorage: function (arg, options) {
        var lang = arg.lang,
            type = arg.type,
            name = arg.name;

        this._logger.verbose('Get %s from %s storage', type, lang);

        if (type === 'users' && name) {
            return this._getUserStorage(lang, name).data;
        }

        if (type === 'issues' && options) {
            return this._getIssuesStorage(options);
        }

        return this._storage[lang][type].data;
    },

    _setStorage: function (arg, data, options) {
        var lang = arg.lang,
            type = arg.type,
            name = arg.name;

        this._logger.verbose('Set %s in %s storage', type, lang);

        if (type === 'users' && name) {
            return this._getUserStorage(lang, name).data = data;
        }

        if (type === 'issues' && options) {
            return this._getIssuesStorage(options).data = data;
        }

        this._storage[lang][type].data = data;
    },

    _getEtag: function (arg, options) {
        var lang = arg.lang,
            type = arg.type,
            name = arg.name;

        if (type === 'users' && name) {
            return this._getUserStorage(lang, name).etag;
        }

        if (type === 'issues' && options) {
            return this._getIssuesStorage(options).etag;
        }

        return this._storage[lang][type].etag;
    },

    _setEtag: function (arg, etag, options) {
        var lang = arg.lang,
            type = arg.type,
            name = arg.name;

        if (type === 'users' && name) {
            this._getUserStorage(lang, name).etag = etag;
        }

        if (type === 'issues' && options) {
            return this._getIssuesStorage(options).etag = etag;
        }

        this._storage[lang][type].etag = etag;
    },

    _getUserStorage: function (lang, name) {
        var userStorage = this._storage[lang].users[name];

        if (!userStorage) {
            userStorage = { data: [], etag: '' };
        }

        return userStorage;
    },

    _getIssuesStorage: function (options) {
        var lang = options.lang,
            page = options.page,
            sort = options.sort,
            labels = options.labels;

        var basicStorage = this._storage[lang].issues;

        if (_.isEmpty(basicStorage) || !basicStorage[page]) {
            basicStorage[page] = {};
        }

        if (_.isEmpty(basicStorage[page]) || !basicStorage[page][sort]) {
            basicStorage[page][sort] = {};
        }

        if (_.isEmpty(basicStorage[page][sort]) || !basicStorage[page][sort][labels]) {
            basicStorage[page][sort][labels] = {};
        }

        var issuesStorage = basicStorage[page][sort][labels];

        if (!issuesStorage) {
            issuesStorage = { data: [], etag: '' }
        }

        return issuesStorage;
    },

    _onSuccess: function (def, item, argv, options, data) {

        // issues type have additional arguments
        data = (argv.type === 'issues') ? data : options;

        var meta = data.meta;

        // We has had item and the datа wasn`t changed -> get item from storage
        if (item && this._isDataNotChanged(meta)) {
            return def.resolve(item);
        }

        // We don`t have a datа or datа was changed -> resolve with new data
        this._setEtag(argv, meta.etag, options);
        this._setStorage(argv, data, options);

        return def.resolve(data);
    },

    _onError: function (def, err) {
        return def.reject(err);
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
            labels = this._getStorage(argv),
            eTag = this._getEtag(argv),

            options = {
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
            def.resolve();
        }

        var argv = { type: 'users', lang: req.lang, name: name },
            user = this._getStorage(argv),
            eTag = this._getEtag(argv);

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
                state: 'all',
                lang: req.lang,
                per_page: 5,
                page: query.page || 1,
                sort: query.sort || 'updated',
                labels: query.labels || ''
            },
            argv = { type: 'issues', options: options},
            issues = this._getStorage(argv, options),
            eTag = this._getEtag(argv, options);

        this._github.getIssues(token, _.extend(options, { headers: eTag ? { 'If-None-Match': eTag } : {} }))
            .then(this._onSuccess.bind(this, def, issues, argv, options))
            .fail(this._onError.bind(this, def));

        return def.promise();
    }
};

module.exports = Model;
