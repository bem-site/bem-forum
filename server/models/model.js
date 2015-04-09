var _ = require('lodash'),
    vow = require('vow'),
    Github = require('../github.js');

function Model (config) {
    this._init(config);
}

Model.prototype = {

    _etag: null,
    _labels: {},
    _users: [],
    _issues: [],
    _comments: [],

    _init: function (config) {
        this._config = config;
        this._github = new Github(config);
    },

    /**
     * Check result.meta -> status, etag, x-ratelimit-remaining
     * @param token
     * @param lang
     * @returns {*}
     */
    getLabels: function (token, lang) {
        var def = vow.defer(),
            labels = this._labels,
            etag = this._etag,
            options = {
                headers: etag ? { 'If-None-Match': etag } : {},
                lang: lang,
                per_page: 100,
                page: 1
            };

        this._github.getLabels(token, options)
            .then(function (result) {
                labels[lang] = result;

                def.resolve(labels[lang]);
            })
            .fail(function (err) {
                return def.reject(err);
            });

        return def.promise();
    }
};

module.exports = Model;
