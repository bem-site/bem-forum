var _ = require('lodash'),
    vow = require('vow'),
    inherit = require('inherit'),
    Logger = require('bem-site-logger'),
    MemoryStorage;

module.exports = MemoryStorage = inherit({

    __constructor: function (config) {
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
        this._storage = Object.keys(storageByLang).reduce(function (prev, lang) {
            prev[lang] = {
                issues: {},
                issue: {},
                comments: {},
                labels: { etag: '', data: [] }
            };
            return prev;
        }, this._storage);

        return this._storage;
    },

    _getUser: function (name) {
        var userStorage = this._storage.users;
        userStorage[name] = userStorage[name] || { data: [], etag: '' };

        return userStorage[name];
    },

    _getIssues: function (options) {
        var lang = options.lang,
            page = options.page,
            sort = options.sort,
            labels = options.labels,
            basicStorage = this._storage[lang].issues,
            issuesStorage;

        basicStorage[page] = basicStorage[page] || {};
        basicStorage[page][sort] = basicStorage[page][sort] || {};
        basicStorage[page][sort][labels] = basicStorage[page][sort][labels] || {};

        issuesStorage = basicStorage[page][sort][labels];
        issuesStorage = issuesStorage || { data: [], etag: '' };

        return issuesStorage;
    },

    _getIssue: function (options) {
        var id = options.number,
            lang = options.lang,
            issueStorage = this._storage[lang].issue;

        issueStorage[id] = issueStorage[id] || { data: [], etag: '' };

        return issueStorage[id];
    },

    _getComments: function (options) {
        var lang = options.lang,
            id = options.id,
            page = options.page,
            basicStorage = this._storage[lang].comments,
            commentsStorage;

        basicStorage[id] = basicStorage[id] || {};
        basicStorage[id][page] = basicStorage[id][page] || {};

        commentsStorage = basicStorage[id][page];
        commentsStorage = commentsStorage || { data: [], etag: '' };

        return commentsStorage;
    },

    _flowData: function (field, arg, options, data) {
        var type = arg.type,
            result;

        if (type === 'users') {
            result = this._getUser(arg.name);
        }

        if (options) {
            var method = {
                issues: '_getIssues',
                issue: '_getIssue',
                comments: '_getComments'
            }[type];
            result = this[method](options);
        }

        result = result || this._storage[arg.lang][type];

        return arguments.length > 3 ? result[field] = data : result[field];
    },

    getData: function (field, arg, options) {
        return this._flowData(field, arg, options);
    },

    setData: function (field, arg, options, data) {
        return this._flowData(field, arg, options, data);
    }
}, {
    getInstance: function (config) {
        if (!this._instance) {
            this._instance = new MemoryStorage(config);
        }

        return this._instance;
    }
});
