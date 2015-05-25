/**
 *  Module for caching/storage of data in memory obtained from Github.
 *  Cache special 'etag' value, used to verify the status change data
 *
 *  Store the following data types:
 *  - Issues: [lang]issues[page][sort][labels] = {
 *      data: {Array} list of issues,
 *      etag: {Number} etag
 *  }
 *
 *  - Issue: [lang]issue[issue_id] = {
 *      data: {Object} issue data,
 *      etag: {Number} etag
 *  }
 *
 *  - Comments: [lang]comments[issue_id][page] = {
 *      data: {Array} list of comments,
 *      etag: {Number} etag
 *  }
 *
 *  - Labels: [lang]labels = {
 *      data: {Array} list of labels,
 *      etag: {Number} etag
 *  }
 *
 *  - Users: users[name] = {
 *      data: {Object} user data,
 *      etag: {Number} etag
 *  }
 */

var _ = require('lodash'),
    inherit = require('inherit'),
    Logger = require('bem-site-logger'),
    MemoryStorage;

module.exports = MemoryStorage = inherit({

    __constructor: function (config) {
        this._config = config;
        this._logger = Logger.setOptions(this._config.logger).createLogger(module);
        this._createStructure();
    },

    /**
     * Creates an initial memory storage structure
     * IMPORTANT! If you do not specify the data sources from Github,
     * which will need storing - exit from the application.
     * @returns {Object} - storage
     * @private
     */
    _createStructure: function () {
        var storageByLang = this._config.storage;

        if (!storageByLang || _.isEmpty(storageByLang)) {
            this._logger.error('Fill the storage field in the config');
            process.exit(1);
        }

        this._storage = {};

        // set data that not require lang
        this._storage.users = {};

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

    /**
     * Getter for the labels storage
     * @param options {Object}
     * @returns {Array} - list of repo labels
     * @private
     */
    _getLabels: function (options) {
        return this._storage[options.lang].labels;
    },

    /**
     * Getter for the users storage by passed name
     * If this key(name of user) is not in the storage,
     * creates a new basic structure
     * @param options {Object}
     * Required:
     * - name {String} - user name
     * @returns {Object} - user storage
     * @private
     */
    _getUser: function (options) {
        var name = options.name,
            userStorage = this._storage.users;

        return (userStorage[name] = userStorage[name] || { data: [], etag: '' });
    },

    /**
     * Getter for the issues storage
     * If there's no issue with such keys in the vault — create new basic structure
     * @param options {Object}
     * Required:
     * - lang {String} - ru|en|etc
     * - page {Number} - number of issue page
     * - sort {String} - updated|created|comments
     * - labels {String} - bug,bemtree,bemhtml,etc
     * @returns {Array} - issues storage
     * @private
     */
    _getIssues: function (options) {
        var lang = options.lang,
            page = options.page,
            sort = options.sort,
            labels = options.labels,
            basicStorage = this._storage[lang].issues;

        basicStorage[page] = basicStorage[page] || {};
        basicStorage[page][sort] = basicStorage[page][sort] || {};

        return (basicStorage[page][sort][labels] = basicStorage[page][sort][labels] || { data: [], etag: '' });
    },

    /**
     * Getter for the issues storage
     * If there's no issue with such id in the vault — create new basic structure
     * @param options {Object}
     * Required:
     * - lang {String}
     * - number {Number} - issue number(id)
     * @returns {Object} - issue storage
     * @private
     */
    _getIssue: function (options) {
        var id = options.number,
            lang = options.lang,
            issueStorage = this._storage[lang].issue;

        return (issueStorage[id] = issueStorage[id] || { data: [], etag: '' });
    },

    /**
     * Getter for the comments storage
     * If there's no issue with such keys in the vault — create new basic structure
     * @param options {Object}
     * Required:
     * - lang {String}
     * - number {Number} - issue number(id )
     * - page {Number} - requested page comments
     * @returns {Array} - comments storage
     * @private
     */
    _getComments: function (options) {
        var lang = options.lang,
            id = options.number,
            page = options.page,
            basicStorage = this._storage[lang].comments;

        basicStorage[id] = basicStorage[id] || {};

        return (basicStorage[id][page] = basicStorage[id][page] || { data: [], etag: '' });
    },

    /**
     * Call methods for getting and setting data
     * @param field {String} - type of field to interact with (etag|data)
     * @param options {Object} - options for storage
     * @param [data] {Array|Object} - optional
     * @returns {Array|Object}
     * @private
     */
    _flowData: function (field, options, data) {
        var method = {
            labels: '_getLabels',
            users: '_getUser',
            issues: '_getIssues',
            issue: '_getIssue',
            comments: '_getComments'
        }[options.type],
        result = this[method](options);

        return arguments.length > 2 ? result[field] = data : result[field];
    },

    /**
     * Getter data from storage
     * @param field {String} - type of field to interact with (etag|data)
     * @param options {Object} - options for storage
     * @returns {*}
     */
    getData: function (field, options) {
        return this._flowData(field, options);
    },

    /**
     * Setter data to storage
     * @param field {String} - type of field to interact with (etag|data)
     * @param options {Object} - options for storage
     * @param [data] {Array|Object} - optional
     * @returns {Array|Object}
     */
    setData: function (field, options, data) {
        return this._flowData(field, options, data);
    }
}, {
    getInstance: function (config) {
        if (!this._instance) {
            this._instance = new MemoryStorage(config);
        }

        return this._instance;
    }
});
