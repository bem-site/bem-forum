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
            console.log('lang', lang);
            this._storage[lang] = {
                labels: {
                    etag: "",
                    data: []
                },
                users: {
                    etag: "",
                    data: []
                },
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
            type = arg.type;

        this._logger.debug('Get %s from %s storage', type, lang);
        return this._storage[lang][type].data;
    },

    _setStorage: function (arg, data) {
        var lang = arg.lang,
            type = arg.type;

        this._logger.debug('Set %s in %s storage', type, lang);
        this._storage[lang][type].data = data;
    },

    _getEtag: function (arg) {
        return this._storage[arg.lang][arg.type].etag;
    },

    _setEtag: function (arg, etag) {
        this._storage[arg.lang][arg.type].etag = etag;
    },

    /**
     * Check result.meta -> status, etag, x-ratelimit-remaining
     * @param token
     * @param lang
     * @returns {*}
     */
    getLabels: function (lang) {
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

        this._github.getLabels(null, options)
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
