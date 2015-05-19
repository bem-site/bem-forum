/**
 * 1. The main model to retrieve data and work with them.
 * 2. The model works with two data sources: Github archive and, if specified in the config app.
 * 3. For caching data from the Github module uses MemoryStorage that stores data in computer memory.
 */

var _ = require('lodash'),
    vow = require('vow'),
    inherit = require('inherit'),
    Archive = require('./archive.js'),
    Github = require('../services/github.js'),
    MemoryStorage = require('../services/memoryStorage.js'),
    Logger = require('bem-site-logger'),
    MainModel;

module.exports = MainModel = inherit({
    /**
     * The constructor of the Model class
     * @param config {Object} - app config
     * @private
     */
    __constructor: function (config) {
        this._config = config;
        this._logger = Logger.setOptions(this._config['logger']).createLogger(module);
        this._github = Github.getInstance(config);
        this._storage = MemoryStorage.getInstance(config);
        this._archive = Archive.getInstance(config);
    },

    /**
     * The handler successfully receive data from sources
     * 1. If the source replied 304, returns data from the memory,
     * in this case, the elapsed request to Github is not considered.
     * 2. If the data has changed and the source sent 200,
     * the data written in the memory and response to the new data.
     * @param options {Object}
     * @param data {Object} - data from source
     * @returns {Promise}
     * @private
     */
    _onSuccess: function (options, data) {
        /*
          If the option was given promise object,
          resolve data without additional action.
        */
        if (options.resolve || options.isArchive) {
            return options.resolve(data);
        }

        var meta = data.meta,
            stData = options.stData,
            stOptions = options.stOptions,
            ghOptions = options.ghOptions,
            cb = options.cb,
            result;

        if (stData && this._isDataNotChanged(meta)) {
            result = stData;
        } else {
            result = data;
            this._logger.info('x-ratelimit-remaining: %s', data.meta['x-ratelimit-remaining']);
            this._storage.setData('etag', stOptions, ghOptions, meta.etag);
            this._storage.setData('data', stOptions, ghOptions, data);
        }

        /*
          If the passed callback - that is called after data processing.
          This is needed for cases when you need to perform custom processing
          on the data before the response
        */
        if (cb && _.isFunction(cb)) {
            result = cb.call(this, result);
        }

        return options.def.resolve(result);
    },

    /**
     * The handler failed receive data from sources
     * @param def {Object} - vow.defer() object
     * @param err {Object}
     * @returns {Promise}
     * @private
     */
    _onError: function (def, err) {
        this._logger.error('Error occur: %s', err.message);
        return def.reject(err);
    },

    /**
     * If the response status from Github contains code 304,
     * then the data has not changed
     * @param meta {Object} - meta response data from the data source
     * @returns {boolean}
     * @private
     */
    _isDataNotChanged: function (meta) {
        return meta.status.indexOf('304') > -1;
    },

    /**
     * Get the list of all labels in the Github repository
     * @param req {Object}
     * @param token {Number} - user token
     * @returns {Promise} - promise with array of labels
     */
    getLabels: function (req, token) {
        var def = vow.defer(),
            lang = req.lang,
            stOptions = { type: 'labels', lang: lang },
            labels = this._storage.getData('data', stOptions, null),
            eTag = this._storage.getData('etag', stOptions, null),
            options = {
                setRepoStorage: true,
                headers: eTag ? { 'If-None-Match': eTag } : {},
                per_page: 100,
                lang: lang,
                page: 1
            };

        /**
         * The filtered labels that result in missed service label removed
         * Used as a callback for post-processing of the data got from Github
         * @param data {Array} - list of labels
         * @returns {*}
         */
        function skipRemovedLabel(data) {
            return data.filter(function (label) {
                return !label.name || label.name !== 'removed';
            });
        }

        this._github.getLabels(token, options)
            .then(this._onSuccess.bind(this, {
                def: def,
                stData: labels,
                stOptions: stOptions,
                cb: skipRemovedLabel
            }))
            .fail(this._onError.bind(this, def));

        return def.promise();
    },

    /**
     * Getting data about the user based on the token passed
     * @param req {Object}
     * @param token {Number} - user token
     * @param name {String} - user name
     * @returns {Promise} - promise with object of user data
     */
    getAuthUser: function (req, token, name) {
        var def = vow.defer();

        if (!token) {
            def.resolve();
        }

        var stOptions = { type: 'users', name: name },
            user = this._storage.getData('data', stOptions, null),
            eTag = this._storage.getData('etag', stOptions, null),
            headers = eTag ? { 'If-None-Match': eTag } : {};

        this._github
            .getAuthUser(token, { headers: headers })
            .then(this._onSuccess.bind(this, {
                def: def,
                stData: user,
                stOptions: stOptions
            }))
            .fail(this._onError.bind(this, def));

        return def.promise();
    },

    /**
     * Get the list of issues
     * IMPORTANT! If request an archive issues, take data from the archive.
     * @param req {Object}
     * @param token {Number} - user token
     * @param isArchive {Boolean}
     * @returns {Promise} - promise with array of issues
     */
    getIssues: function (req, token, isArchive) {
        var def = vow.defer(),
            query = req.query || {},
            page = query.page || 1,
            options = {
                setRepoStorage: true,
                state: 'all',
                lang: req.lang,
                per_page: this._config.perPage,
                page: page,
                sort: query.sort || 'updated',
                direction: query.direction || 'desc',
                labels: query.labels || ''
            };

        if (!isArchive && page < 0) {
            def.reject({ message: 'getIssues - no data found!', code: 404 });
        } else if (isArchive) {
            def.resolve(this._archive.getIssues(options));
        } else {
            var stOptions = { type: 'issues', options: options },
                issues = this._storage.getData('data', stOptions, options),
                eTag = this._storage.getData('etag', stOptions, options),
                headers = eTag ? { 'If-None-Match': eTag } : {};

            this._github.getIssues(token, _.extend(options, { headers: headers }))
                .then(this._onSuccess.bind(this, {
                    def: def,
                    stData: issues,
                    stOptions: stOptions,
                    ghOptions: options
                }))
                .fail(this._onError.bind(this, def));
        }

        return def.promise();
    },

    /**
     * Get data about single issue
     * IMPORTANT! If request an archive issue, take data from the archive.
     * @param req {Object}
     * @param token {Number} - user token
     * @param isArchive {Boolean}
     * @returns {Promise} - promise with object of issue data
     */
    getIssue: function (req, token, isArchive) {
        var def = vow.defer(),
            id = req.params && req.params.issue_id,
            options = {
                setRepoStorage: true,
                lang: req.lang,
                number: id
            };

        if (!isArchive && id < 0) {
            def.reject({ message: 'getIssue - no data found!', code: 404 });
        } else if (isArchive) {
            def.resolve(this._archive.getIssue(options));
        } else {
            var stOptions = { type: 'issue', number: id },
                issue = this._storage.getData('data', stOptions, options),
                eTag = this._storage.getData('etag', stOptions, options),
                headers = eTag ? { 'If-None-Match': eTag } : {};

            this._github.getIssue(token, _.extend(options, { headers: headers }))
                .then(this._onSuccess.bind(this, {
                    def: def,
                    stData: issue,
                    stOptions: stOptions,
                    ghOptions: options
                }))
                .fail(this._onError.bind(this, def));
        }

        return def.promise();
    },

    /**
     * Create new issue
     * @param req {Object}
     * @param token {Number} - user token
     * @returns {Promise} - promise with object of issue data
     */
    createIssue: function (req, token) {
        var def = vow.defer(),
            body = req.body,
            options = {
                setRepoStorage: true,
                lang: req.lang,
                title: body.title,
                body: body.body,
                labels: body.labels
            };

        this._github.createIssue(token, options)
            .then(this._onSuccess.bind(this, def))
            .fail(this._onError.bind(this, def));

        return def.promise();
    },

    /**
     * Edit issue
     * @param req {Object}
     * @param token {Number} - user token
     * @returns {Promise} - promise with object of issue edited data
     */
    editIssue: function (req, token) {
        var def = vow.defer(),
            body = req.body,
            options = {
                setRepoStorage: true,
                lang: req.lang,
                number: body.number,
                title: body.title,
                body: body.body,
                labels: body.labels,
                state: body.state
            };

        this._github.editIssue(token, options)
            .then(this._onSuccess.bind(this, def))
            .fail(this._onError.bind(this, def));

        return def.promise();
    },

    /**
     * Get list of issue`s comments
     * IMPORTANT! If request an archive issue`s comments, take data from the archive.
     * @param req {Object}
     * @param token {Number} - user token
     * @param isArchive {Boolean}
     * @returns {Promise} - promise with array of comments
     */
    getComments: function (req, token, isArchive) {
        var def = vow.defer(),
            id = req.params.issue_id,
            query = req.query,
            page = query && req.query.page,
            options = {
                setRepoStorage: true,
                lang: req.lang,
                number: id,
                page: page || 1,
                per_page: query && req.query.per_page || 100
            };

        if (!isArchive && id < 0) {
            def.reject({ message: 'getComments - no data found!', code: 404 });
        } else if (isArchive) {
            def.resolve(this._archive.getComments(options));
        } else {
            var stOptions = { type: 'comments', id: id, page: page },
                comments = this._storage.getData('data', stOptions, options),
                eTag = this._storage.getData('etag', stOptions, options),
                headers = eTag ? { 'If-None-Match': eTag } : {};

            this._github.getComments(token, _.extend(options, { headers: headers }))
                .then(this._onSuccess.bind(this, {
                    def: def,
                    stData: comments,
                    stOptions: stOptions,
                    ghOptions: options
                }))
                .fail(this._onError.bind(this, def));
        }

        return def.promise();
    },

    /**
     * Create new comment
     * @param req {Object}
     * @param token {Number} - user token
     * @returns {Promise} - promise with object of comment data
     */
    createComment: function (req, token) {
        var def = vow.defer(),
            body = req.body,
            options = {
                setRepoStorage: true,
                lang: req.lang,
                number: body.number,
                body: body.body
            };

        this._github.createComment(token, options)
            .then(this._onSuccess.bind(this, def))
            .fail(this._onError.bind(this, def));

        return def.promise();
    },

    /**
     * Edit comment
     * @param req {Object}
     * @param token {Number} - user token
     * @returns {Promise} - promise with object of comment edited data
     */
    editComment: function (req, token) {
        var def = vow.defer(),
            body = req.body,
            options = {
                setRepoStorage: true,
                lang: req.lang,
                id: body.id,
                body: body.body
            };

        this._github.editComment(token, options)
            .then(this._onSuccess.bind(this, def))
            .fail(this._onError.bind(this, def));

        return def.promise();
    },

    /**
     * Delete comment
     * @param req {Object}
     * @param token {Number} - user token=
     * @returns {Promise} - promise with object of comment data
     */
    deleteComment: function (req, token) {
        var def = vow.defer(),
            options = {
                setRepoStorage: true,
                lang: req.lang,
                id: req.body.id
            };

        this._github.deleteComment(token, options)
            .then(this._onSuccess.bind(this, def))
            .fail(this._onError.bind(this, def));

        return def.promise();
    },

    /**
     * Inspection whether the archive posts matching the query
     * @param req {Object}
     * @returns {boolean}
     */
    inspectArchiveIssues: function (req) {
        var query = req.query || {},
            issues = this._archive.getIssues({
                lang: req.lang,
                per_page: this._config.perPage,
                page: 1,
                sort: 'updated',
                direction: 'desc',
                labels: query.labels || ''
            });

        return issues && issues.length ? true : false;
    }
}, {
    getInstance: function (config) {
        if (!this._instance) {
            this._instance = new MainModel(config);
        }

        return this._instance;
    }
});
