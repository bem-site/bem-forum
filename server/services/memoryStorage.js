var _ = require('lodash'),
    vow = require('vow'),
    inherit = require('inherit'),
    Logger = require('bem-site-logger');

var MemoryStorage;

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
        _.keys(storageByLang).forEach(function (lang) {
            this._storage[lang] = {
                issues: {},
                issue: {},
                comments: {},
                labels: { etag: '', data: [] }
            }
        }, this);

        return this._storage;
    },

    _getUser: function (name) {
        var userStorage = this._storage.users;

        if (!userStorage[name]) {
            userStorage[name] = { data: [], etag: '' };
        }

        return userStorage[name];
    },

    _getIssues: function (options) {
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
            issuesStorage = { data: [], etag: '' };
        }

        return issuesStorage;
    },

    _getIssue: function (options) {
        var id = options.number,
            lang = options.lang,
            issueStorage = this._storage[lang].issue;

        if (!issueStorage[id]) {
            issueStorage[id] = { data: [], etag: '' };
        }

        return issueStorage[id];
    },

    _getComments: function (options) {
        var lang = options.lang,
            id = options.id,
            page = options.page;

        var basicStorage = this._storage[lang].comments;

        if (_.isEmpty(basicStorage) || !basicStorage[id]) {
            basicStorage[id] = {};
        }

        if (_.isEmpty(basicStorage[id]) || !basicStorage[id][page]) {
            basicStorage[id][page] = {};
        }

        var commentsStorage = basicStorage[id][page];

        if (!commentsStorage) {
            commentsStorage = { data: [], etag: '' };
        }

        return commentsStorage;
    },

    getData: function (arg, options) {
        var type = arg.type;

        if (type === 'users') {
            return this._getUser(arg.name).data;
        }

        if (options) {
            if (type === 'issues') return this._getIssues(options).data;
            if (type === 'issue') return this._getIssue(options).data;
            if (type === 'comments') return this._getComments(options).data;
        }

        return this._storage[arg.lang][type].data;
    },

    setData: function (arg, data, options) {
        var type = arg.type;

        if (type === 'users') {
            return this._getUser(arg.name).data = data;
        }

        if (options) {
            if (type === 'issues') return this._getIssues(options).data = data;
            if (type === 'issue') return this._getIssue(options).data = data;
            if (type === 'comments') return this._getComments(options).data = data;
        }

        return this._storage[arg.lang][type].data = data;
    },

    getEtag: function (arg, options) {
        var type = arg.type;

        if (type === 'users') {
            return this._getUser(arg.name).etag;
        }

        if (options) {
            if (type === 'issues') return this._getIssues(options).etag;
            if (type === 'issue') return this._getIssue(options).etag;
            if (type === 'comments') return this._getComments(options).etag;
        }

        return this._storage[arg.lang][type].etag;
    },

    setEtag: function (arg, etag, options) {
        var type = arg.type;

        if (type === 'users') {
            return this._getUser(arg.name).etag = etag;
        }

        if (options) {
            if (type === 'issues') return this._getIssues(options).etag = etag;
            if (type === 'issue') return this._getIssue(options).etag = etag;
            if (type === 'comments') return this._getComments(options).etag = etag;
        }

        return this._storage[arg.lang][type].etag = etag;
    }
}, {
    getInstance: function (config) {
        if (!this._instance) {
            this._instance = new MemoryStorage(config);
        }

        return this._instance;
    }
});
