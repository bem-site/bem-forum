var _ = require('lodash'),
    vow = require('vow'),
    Logger = require('bem-site-logger');

function MemoryStorage (config) {
    this._init(config);
}

MemoryStorage.prototype = {
    _init: function (config) {
        this._config = config;
        this._logger = Logger.setOptions(this._config['logger']).createLogger(module);
        this._createStructure();
    },

    _createStructure: function () {
        var storageByLang = this._config.storage;

        if (!storageByLang || _.isEmpty(storageByLang)) {
            this._logger.error('Fill the storage field in the config');
            process.exit(1);
        }

        this._storage = {};

        // set data that not require lang
        this._storage.users = {};

        // Generate basic storage by lang
        _.keys(storageByLang).forEach(function (lang) {
            this._storage[lang] = {
                issues: {},
                labels: { etag: '', data: [] },
                comments: { etag: '', data: [] }
            }
        }, this);

        return this._storage;
    },

    _getUserStorage: function (name) {
        var userStorage = this._storage.users;

        if (!userStorage[name]) {
            userStorage[name] = { data: [], etag: '' };
        }

        return userStorage[name];
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

    getStorage: function (arg, options) {
        var type = arg.type;

        if (type === 'users') {
            return this._getUserStorage(arg.name).data;
        }

        if (type === 'issues' && options) {
            return this._getIssuesStorage(options).data;
        }

        return this._storage[arg.lang][type].data;
    },

    setStorage: function (arg, data, options) {
        var type = arg.type;

        if (type === 'users') {
            return this._getUserStorage(arg.name).data = data;
        }

        if (type === 'issues' && options) {
            return this._getIssuesStorage(options).data = data;
        }

        return this._storage[arg.lang][type].data = data;
    },

    getEtag: function (arg, options) {
        var type = arg.type;

        if (type === 'users') {
            return this._getUserStorage(arg.name).etag;
        }

        if (type === 'issues' && options) {
            return this._getIssuesStorage(options).etag;
        }

        return this._storage[arg.lang][type].etag;
    },

    setEtag: function (arg, etag, options) {
        var type = arg.type;

        if (type === 'users') {
            return this._getUserStorage(arg.name).etag = etag;
        }

        if (type === 'issues' && options) {
            return this._getIssuesStorage(options).etag = etag;
        }

        return this._storage[arg.lang][type].etag = etag;
    }
};

module.exports = MemoryStorage;
