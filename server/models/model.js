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
        var config = this._config,
            sites = config.sites;

        if (!sites) {
            this._logger.error('sites info not found in config');
            process.exit();
        }

        // Fill the storage keys for the site name (forum, blog, etc)
        _.keys(sites).forEach(function (site) {
            this._storage[site] = {};

            // Added to the storage site's default values divided by language
            // this._storage.blog.ru = { ... }
            _.forEach(sites[site].languages, function (lang) {
                this._storage[site][lang] = {
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

        }, this);

        //console.log('STORAGE', JSON.stringify(this._storage, null, 4));

        return this._storage;
    },

    _isNotChangedData: function (status) {
        return status.indexOf('304') !== -1;
    },

    _getStorage: function (arg) {
        return this._storage[arg.site][arg.lang][arg.type].data;
    },

    _setStorage: function (arg, data) {
        this._storage[arg.site][arg.lang][arg.type].data = data;
    },

    _getEtag: function (arg) {
        return this._storage[arg.site][arg.lang][arg.type].etag;
    },

    _setEtag: function (arg, etag) {
        this._storage[arg.site][arg.lang][arg.type].etag = etag;
    },

    /**
     * Check result.meta -> status, etag, x-ratelimit-remaining
     * @param token
     * @param site
     * @param lang
     * @returns {*}
     */
    getLabels: function (token, site, lang) {
        var _this = this,
            def = vow.defer(),

            arg = {
                site: site,
                type: 'labels',
                lang: lang
            },
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

                // If labels were not changed, get from memory
                if (labels && _this._isNotChangedData(meta.status)) {
                    return def.resolve(labels);
                }

                // Save labels in memory
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
