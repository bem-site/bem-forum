/**
 * 1. The main model to retrieve data and work with them.
 * 2. The model works with two data sources: Github and archive, if specified in the config app.
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
            optionsData = options.optionsData,
            cb = options.cb,
            result;

        if (stData && this._isNotModified(meta)) {
            result = stData;
        } else {
            result = data;
            this._logger.info('x-ratelimit-remaining: %s', data.meta['x-ratelimit-remaining']);
            this._storage.setData('etag', optionsData, meta.etag);
            this._storage.setData('data', optionsData, data);
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
     * The handler failed to receive data from sources
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
    _isNotModified: function (meta) {
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
            options = {
                type: 'labels',
                setRepoStorage: true,
                per_page: 100,
                lang: lang,
                page: 1
            },
            labels = this._storage.getData('data', options),
            eTag = this._storage.getData('etag', options);

        options = this._extendEtagHeaders(options, eTag);

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
                optionsData: options,
                cb: skipRemovedLabel
            }))
            .fail(this._onError.bind(this, def));

        return def.promise();
    },

    /**
     * Extends object field headers,
     * and added 'If-None-Match' if the specified eTag
     * @param obj {Object}
     * @param eTag {Number}
     * @private
     */
    _extendEtagHeaders: function (obj, eTag) {
        return eTag ? _.extend(obj, { headers: { 'If-None-Match': eTag } }) : obj;
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

        var options = { type: 'users', name: name },
            user = this._storage.getData('data', options),
            eTag = this._storage.getData('etag', options);

        options = this._extendEtagHeaders(options, eTag);

        this._github
            .getAuthUser(token, options)
            .then(this._onSuccess.bind(this, {
                def: def,
                stData: user,
                optionsData: options
            }))
            .fail(this._onError.bind(this, def));

        return def.promise();
    },

    /**
     * Get the list of issues
     * IMPORTANT! If request is an archive issues, take data from the archive.
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
                type: 'issues',
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
            var issues = this._storage.getData('data', options),
                eTag = this._storage.getData('etag', options);

            options = this._extendEtagHeaders(options, eTag);

            this._github.getIssues(token, options)
                .then(this._onSuccess.bind(this, {
                    def: def,
                    stData: issues,
                    optionsData: options
                }))
                .fail(this._onError.bind(this, def));
        }

        return def.promise();
    },

    /**
     * Get data about single issue
     * IMPORTANT! If request is an archive issue, take data from the archive.
     * @param req {Object}
     * @param token {Number} - user token
     * @param isArchive {Boolean}
     * @returns {Promise} - promise with object of issue data
     */
    getIssue: function (req, token, isArchive) {
        var def = vow.defer(),
            id = req.params && req.params.issue_id,
            options = {
                type: 'issue',
                setRepoStorage: true,
                lang: req.lang,
                number: id
            };

        if (!isArchive && id < 0) {
            def.reject({ message: 'getIssue - no data found!', code: 404 });
        } else if (isArchive) {
            def.resolve(this._archive.getIssue(options));
        } else {
            var issue = this._storage.getData('data', options),
                eTag = this._storage.getData('etag', options);

            options = this._extendEtagHeaders(options, eTag);

            this._github.getIssue(token, options)
                .then(this._onSuccess.bind(this, {
                    def: def,
                    stData: issue,
                    optionsData: options
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
     * IMPORTANT! If request is an archive issue`s comments, take data from the archive.
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
                type: 'comments',
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
            var comments = this._storage.getData('data', options),
                eTag = this._storage.getData('etag', options);

            options = this._extendEtagHeaders(options, eTag);

            this._github.getComments(token, options)
                .then(this._onSuccess.bind(this, {
                    def: def,
                    stData: comments,
                    optionsData: options
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

        return !!issues && !!issues.length;
    },

    /**
     * Get all issues from repo by lang
     * @param lang {String}
     * @returns {Promise} - promise with array issues
     */
    getAllIssues: function (lang) {
        var _this = this,
            def = vow.defer(),
            issues = [],
            perPage = 100,
            page = 1,
            options = {
                type: 'allIssues',
                setRepoStorage: true,
                lang: lang,
                state: 'all',
                page: 1,
                per_page: perPage
            },
            issuesData = this._storage.getData('data', options),
            issuesTime = this._storage.getData('time', options);

        /*
            if we have data issues in memory and it took less than 360 minutes
            on last storage wrote – we will resolve promise
          */
        if (issuesData.length && ((+new Date() - issuesTime) / 1000 / 60) < 360) {
            this._logger.debug('Get all repo %s %s issues from Storage', lang, issuesData.length);
            def.resolve(issuesData);
        } else {
            this._logger.debug('Get all repo %s issues from Github', lang);
            (function getIssues() {
                return _this._github.getIssues(null, options)
                    .then(function (data) {
                        // 1. Collect data
                        issues = issues.concat(data);

                        // 2. Set next page
                        ++options.page;

                        // 4. Filter removed issues
                        issues = issues.filter(function (issue) {
                            var labels = issue.labels;

                            return labels.length ? labels.every(function (label) {
                                return label.name !== 'removed';
                            }) : true;
                        });

                        // 3. if it is last page - save data and time in memory for an hour and resolve promise
                        if (data.length !== perPage) {
                            _this._storage.setData('data', options, issues);
                            _this._storage.setData('time', options, +new Date());
                            return def.resolve(issues);
                        }

                        getIssues();

                    }, this)
                    .fail(function (err) {
                        def.reject(err);
                    });
            })();
        }

        return def.promise();
    }
}, {
    getInstance: function (config) {
        if (!this._instance) {
            this._instance = new MainModel(config);
        }

        return this._instance;
    }
});
