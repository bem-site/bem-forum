/**
 * Wrapper around node-github http://mikedeboer.github.io/node-github/
 * 1. If a user is logged - used his token, if not - use the tokens specified in the config app
 * 2. Used the third version of the Github API - https://developer.github.com/v3/
 */

var _ = require('lodash'),
    vow = require('vow'),
    inherit = require('inherit'),
    GitHubApi = require('github'),
    Logger = require('bem-site-logger'),
    Github;

module.exports = Github = inherit({
    __constructor: function (config) {
        this._config = config;
        this._logger = Logger.setOptions(this._config['logger']).createLogger(module);
        this._createDefaultAPI();
    },

    _authReadyApi: [],

    /**
     * Call to the Github Api and receive data
     * If specified in the options fields 'setRepoStorage' and 'lang' -
     * select the data source from config
     * @param token {Number} - user token
     * @param group {String} - api group (issues, user, etc)
     * @param name {String} - api method name (get, create)
     * @param options {Object} - options to fetch data
     * @returns {Promise} - promise with data
     * @private
     */
    _callGithubApi: function (token, group, name, options) {
        var _this = this,
            def = vow.defer(),
            githubApi = token ? this._getUserAPI(token) : this._getDefaultAPI();

        if (options.setRepoStorage) {
            // select Github storage by lang from config app
            options = this._setStorage(options);
        }

        // see docs http://mikedeboer.github.io/node-github/
        githubApi[group][name].call(null, options, function (err, data) {
            if (err || !data) {
                _this._logger.error(
                    'group: %s, name: %s, token: %s, options: %s',
                    group, name, token, JSON.stringify(options));

                return def.reject(err);
            }

            _this._logger.info('status: %s, group: %s, name: %s, token: %s', data.meta.status, group, name, token);
            _this._logger.verbose('options: %s', JSON.stringify(options));
            return def.resolve(data);
        });

        return def.promise();
    },

    /**
     * Select the data source from config app.
     * Added to the options object fields 'user' and 'repo'
     * to Github inform where to get the data
     * @param options {Object} - options to fetch data
     * @private
     */
    _setStorage: function (options) {
        return _.extend(options, this._config.storage[options.lang]);
    },

    /**
     * The getter config for Github API
     * @returns {Object}
     * @private
     */
    _getGithubConfig: function () {
        return {
            version: '3.0.0',
            debug: false,
            host: 'api.github.com',
            timeout: 10000,
            headers: {
                'user-agent': 'BEM Forum'
            }
        };
    },

    /**
     * Create new instance of Github API for current token
     * @param token {Number} - user token
     * @returns {Object}
     * @private
     */
    _createGithubAuthInstance: function (token) {
        var github = new GitHubApi(this._getGithubConfig());

        github.authenticate({
            type: 'oauth',
            token: token
        });

        if (!github) {
            this._logger.warn('Authentification on Github with token %s failed', token);
        }

        return github;
    },

    /**
     * Create instances of the API for the tokens specified in the config app.
     * Used for cases when the user is not authorized
     * and does not have a token for requests to Github API
     * @returns {Object} - this
     * @private
     */
    _createDefaultAPI: function () {
        var _this = this,
            tokens = this._config.auth['api-tokens'];

        if (!tokens || !tokens.length) {
            this._logger.error('Fill in api tokens at config/credentials.json to access Github');

            // Stop app if github access tokens not added
            process.exit(1);
        }

        this._authReadyApi = tokens.reduce(function (prev, token) {
            prev[token] = _this._createGithubAuthInstance(token);

            return prev;

        }, {});

        return this;
    },

    /**
     * Create instances of the API for the user token.
     * Used for cases where the user is authorized.
     * @param token {Number} - user token
     * @returns {Object}
     * @private
     */
    _createUserAPI: function (token) {
        var github = this._authReadyApi[token];

        if (!github) {
            github = this._createGithubAuthInstance(token);

            if (github) {
                this._authReadyApi[token] = github;
            } else {
                this._logger.warn('_createUserAPI: Set default API for token: %s', token);
                github = this._getDefaultAPI();
            }
        }

        return github;
    },

    /**
     * Getter to obtain the API instance, if the passed token user
     * @param token
     * @returns {Object} - instance of API Githib
     * @private
     */
    _getUserAPI: function (token) {
        if (!this._authReadyApi[token]) {
            this._createUserAPI(token);
        }

        return this._authReadyApi[token];
    },

    /**
     * Getter to obtain the API instance, if the user is not authorized
     * @returns {Object} - instance of API Githib
     * @private
     */
    _getDefaultAPI: function () {
        if (_.isEmpty(this._authReadyApi)) {
            this._createDefaultAPI();
        }
        return this._authReadyApi[_.sample(this._config.auth['api-tokens'])];
    },

    /**
     * Returns list of repository labels
     * @param token {String} - oauth user token
     * @param options {Object} - options { per_page, page, headers: {}, lang: ...}
     * @returns {*}
     */
    getLabels: function (token, options) {
        return this._callGithubApi(token, 'issues', 'getLabels', options);
    },

    /**
     * Returns authentificated user
     * @param token {String} - oauth user token
     * @param options {Object} - empty object
     * @returns {*}
     */
    getAuthUser: function (token, options) {
        return this._callGithubApi(token, 'user', 'get', options);
    },

    /**
     * Returns list of issues for repository
     * @param token {String} - oauth user token
     * @param options {Object} - with fields:
     *  - state {String} state of issue (open|closed)
     *  - labels {Array} array of labels
     *  - sort {String} sort criteria (created|updated|comments)
     *  - direction {String} sort direction (asc|desc)
     *  - since {Date}: date from (optional) YYYY-MM-DDTHH:MM:SSZ
     *  - page {Number} number of page for pagination
     *  - per_page {Number} number of records per one page
     * @returns {Promise} - promise with array
     */
    getIssues: function (token, options) {
        return this._callGithubApi(token, 'issues', 'repoIssues', options);
    },

    /**
     * Returns issue by it number
     * @param token {String} - oauth user token
     * @param options {Object} - with fields:
     *  - number {Number} unique number of issue
     * @returns {Promise} - promise with object
     */
    getIssue: function (token, options) {
        return this._callGithubApi(token, 'issues', 'getRepoIssue', options);
    },

    /**
     * Creates new issue
     * @param token {String} - oauth user token
     * @param options {Object} - with fields:
     *  - title {String} title of issue (required)
     *  - body {String} body of issue (optional)
     *  - labels {Array} array of string label names (required)
     * @returns {Promise} - promise with object
     */
    createIssue: function (token, options) {
        return this._callGithubApi(token, 'issues', 'create', options);
    },

    /**
     * Edit issue
     * @param token {String} - oauth user token
     * @param options {Object} - with fields:
     *  - number {Number} number of issue (required)
     *  - title {String} title of issue (optional)
     *  - body {String} body of issue (optional)
     *  - labels {Array} array of string label names (optional)
     *  - state {String} state of issue (open|closed) (optional)
     * @returns {Promise} - promise with object
     */
    editIssue: function (token, options) {
        return this._callGithubApi(token, 'issues', 'edit', options);
    },

    /**
     * Returns list of comments for issue
     * @param token {String} - oauth user token
     * @param options {Object} - with fields:
     *  - number {Number} unique number of issue (required)
     *  - page {Number} number of page for pagination (optional)
     *  - per_page {Number} number of records on one page (optional)
     * @returns {Promise} - promise with array
     */
    getComments: function (token, options) {
        return this._callGithubApi(token, 'issues', 'getComments', options);
    },

    /**
     * Create new comment for issue
     * @param token {String} - oauth user token
     * @param options {Object} - with fields:
     *  - number {String} unique number of issue (required)
     *  - body {String} text for comment (required)
     * @returns {Promise} - promise with object
     */
    createComment: function (token, options) {
        return this._callGithubApi(token, 'issues', 'createComment', options);
    },

    /**
     * Edit issue comment
     * @param token {String} - oauth user token
     * @param options {Object} - with fields:
     *  - id {String} unique id of comment (required)
     *  - body {String} text of comment (required)
     * @returns {Promise} - promise with object
     */
    editComment: function (token, options) {
        return this._callGithubApi(token, 'issues', 'editComment', options);
    },

    /**
     * Removes comment from issue
     * @param token {String} - oauth user token
     * @param options {Object} - with fields:
     *  - id {String} unique id of comment (required)
     * @returns {Promise} - promise with object
     */
    deleteComment: function (token, options) {
        return this._callGithubApi(token, 'issues', 'deleteComment', options);
    }

}, {
    getInstance: function (config) {
        if (!this._instance) {
            this._instance = new Github(config);
        }

        return this._instance;
    }
});
