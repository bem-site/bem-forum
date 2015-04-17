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

        // Added to the storage site's default values divided by language
        // this._storage.blog.ru = { ... }
        _.keys(storageByLang).forEach(function (lang) {
            this._storage[lang] = {
                labels: {
                    etag: "",
                    data: []
                },
                users: {},
                issues: {
                    etag: "",
                    data: []
                },
                comments: {
                    etag: "",
                    data: []
                }
            }
        }, this);

        return this._storage;
    },

    _isNotChangedData: function (status) {
        return status.indexOf('304') !== -1;
    },

    _getStorage: function (arg) {
        var lang = arg.lang,
            type = arg.type,
            name = arg.name;

        this._logger.verbose('Get %s from %s storage', type, lang);

        if (type === 'users' && name) {
            return this._getUserStorage(lang, name).data;
        }

        return this._storage[lang][type].data;
    },

    _setStorage: function (arg, data) {
        var lang = arg.lang,
            type = arg.type,
            name = arg.name;

        this._logger.verbose('Set %s in %s storage', type, lang);

        if (type === 'users' && name) {
            return this._getUserStorage(lang, name).data = data;
        }

        this._storage[lang][type].data = data;
    },

    _getEtag: function (arg) {
        var lang = arg.lang,
            type = arg.type,
            name = arg.name;

        if (type === 'users' && name) {
            return this._getUserStorage(lang, name).etag;
        }

        return this._storage[lang][type].etag;
    },

    _setEtag: function (arg, etag) {
        var lang = arg.lang,
            type = arg.type,
            name = arg.name;

        if (type === 'users' && name) {
            this._getUserStorage(lang, name).etag = etag;
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

    /**
     * Check result.meta -> status, etag, x-ratelimit-remaining
     * @param token
     * @param lang
     * @returns {*}
     */
    getLabels: function (token, lang) {
        var _this = this,
            def = vow.defer(),

            arg = { type: 'labels', lang: lang },
            labels = this._getStorage(arg),
            eTag = this._getEtag(arg),

            options = {
                headers: eTag ? { 'If-None-Match': eTag } : {},
                lang: lang,
                per_page: 100,
                page: 1
            };

        this._github.getLabels(token, options)
            .then(function (result) {

                var meta = result.meta;

                // save etag in memory
                _this._setEtag(arg, meta.etag);

                /**
                 * If the labels are in memory
                 * and we spent all requests to github API
                 * or date hasn`t changed, then take the data from the memory
                 */
                if (labels && meta['x-ratelimit-remaining'] === 0 || _this._isNotChangedData(meta.status)) {
                    return def.resolve(labels);
                }

                // Else save labels in memory
                _this._setStorage(arg, result);

                return def.resolve(result);

            })
            .fail(function (err) {
                return def.reject(err);
            });

        return def.promise();
    },

    getAuthUser: function (req, token, name) {
        var def = vow.defer();

        if (!token) {
            def.resolve();
        }

        var _this = this,
            arg = { type: 'users', lang: req.lang, name: name },
            user = this._getStorage(arg),
            eTag = this._getEtag(arg);

        this._github
            .getAuthUser(token, { headers: eTag ? { 'If-None-Match': eTag } : {} })
            .then(function (result) {
                var meta = result.meta;

                // save etag in memory
                _this._setEtag(arg, meta.etag);

                if (user && meta['x-ratelimit-remaining'] === 0 || _this._isNotChangedData(meta.status)) {
                    return def.resolve(user);
                }

                _this._setStorage(arg, result);

                return def.resolve(result);
            })
            .fail(function (err) {
                return def.reject(err);
            });

        return def.promise();
    },

    getIssues: function (token, lang) {
        var def = vow.defer(),
            issues = this._issues,
            etag = this._etag,
            options = {
                headers: etag ? { 'If-None-Match': etag } : {},
                lang: lang,
                per_page: 100,
                page: 1,
                state: 'all',
                sort: 'updated'
            };

        // this._github.getIssues(token, options);
    }
};

module.exports = Model;
