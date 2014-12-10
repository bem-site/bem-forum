var _ = require('lodash'),
    vow = require('vow'),
    Api = require('github');

var API_CONFIG = {
        version: "3.0.0",
        protocol: "https",
        timeout: 10000,
        debug: false,
        host: "api.github.com"
    },
    options,
    apiHash;

/**
 * Calls github api method
 * @param token - {String} auth token
 * @param group - {String} api group (user, issues ...)
 * @param name - {String} name of api method
 * @param options - {Object} params hash which can contain
 * different set of key depending on command
 * @returns {*}
 */
var apiCall = function(token, group, name, opts) {
    var def = vow.defer(),
        api = token ?
            module.exports.getUserAPI(token) :
            module.exports.getDefaultAPI();

    opts = _.extend({}, options.storage, opts);

    console.log('apiCall ', token, group, name, opts);

    if(!api) {
        return vow.reject('no api was found');
    }

    api[group][name].call(null, opts, function(err, res) {
        if(err || !res) {
            console.error('api[%s][%s]: %s', group, name, err);
            def.reject(err);
        } else {
            def.resolve(res);
        }
    });

    return def.promise();
};

/**
 * Returns name of function
 * @param fn - {Function}
 * @returns {*}
 * @private
 */
var getFnName = function(fn) {
    var _this = module.exports;

    return Object.keys(module.exports).filter(function(key) {
        return _this[key] === fn;
    })[0];
};

module.exports = {

    init: function(opts) {
        options = opts || {};
        return this;
    },

    /**
     * Returns individual github user api by access token
     * @param token - {String} github oauth access token
     * @returns {*}
     */
    getUserAPI: function(token) {
        return apiHash[token];
    },

    /**
     * Returns random api for one of configured tokens for non auth users
     * @returns {*}
     */
    getDefaultAPI: function() {
        var tokens = options.auth ? options.auth.tokens : [];
        return apiHash[_.sample(tokens)];
    },

    /**
     * Create github api for each configured token
     * @returns {exports}
     */
    addDefaultAPI: function() {
        var tokens = options.auth ? options.auth.tokens : [];

        apiHash = tokens.reduce(function(prev, token) {
            var api = new Api(API_CONFIG);
            api.authenticate({
                type: 'oauth',
                token: token
            });

            prev[token] = api;
            return prev;
        }, {});

        return this;
    },

    /**
     * Create individual api for each users
     * Auth user by access token and add to api hash
     * @param token - {String} github oauth access token
     * @returns {}
     */
    addUserAPI: function(token) {
        if(apiHash[token]) {
            return this;
        }

        var api = new Api(API_CONFIG);
        api.authenticate({
            type: 'oauth',
            token: token
        });

        apiHash[token] = api;
        return this;
    },

    /**
     * Returns list of issues for repository
     * @param token - {String} oauth user token
     * @param options - {Object} with fields:
     *  - state {String} state of issue (open|closed)
     *  - labels {Array} array of labels
     *  - sort {String} sort criteria (created|updated|comments)
     *  - direction {String} sort direction (asc|desc)
     *  - since {Date}: date from (optional) YYYY-MM-DDTHH:MM:SSZ
     *  - page {Number} number of page for pagination
     *  - per_page {Number} number of records per one page
     * @returns {*}
     */
    getIssues: function(token, options) {
        return apiCall(token, 'issues', 'repoIssues', _.extend(options, { state: 'all', sort: 'updated' }));
    },

    /**
     * Returns issue by it number
     * @param token - {String} oauth user token
     * @param options - {Object} with fields:
     *  - number {Number} unique number of issue
     * @returns {*}
     */
    getIssue: function(token, options) {
        return apiCall(token, 'issues', 'getRepoIssue', options);
    },

    /**
     * Creates new issue
     * @param token - {String} oauth user token
     * @param options - {Object} with fields:
     *  - title {String} title of issue (required)
     *  - body {String} body of issue (optional)
     *  - labels {Array} array of string label names (required)
     * @returns {*}
     */
    createIssue: function(token, options) {
        return apiCall(token, 'issues', 'create', options);
    },

    /**
     * Edit issue
     * @param token - {String} oauth user token
     * @param options - {Object} with fields:
     *  - number {Number} number of issue (required)
     *  - title {String} title of issue (optional)
     *  - body {String} body of issue (optional)
     *  - labels {Array} array of string label names (optional)
     *  - state {String} state of issue (open|closed) (optional)
     * @returns {*}
     */
    editIssue: function(token, options) {
        return apiCall(token, 'issues', 'edit', options);
    },

    /**
     * Returns list of comments for issue
     * @param token - {String} oauth user token
     * @param options - {Object} with fields:
     *  - number {Number} unique number of issue (required)
     *  - page {Number} number of page for pagination (optional)
     *  - per_page {Number} number of records on one page (optional)
     * @returns {*}
     */
    getComments: function(token, options) {
        return apiCall(token, 'issues', getFnName(arguments.callee), options);
    },

    /**
     * Create new comment for issue
     * @param token - {String} oauth user token
     * @param options - {Object} with fields:
     *  - number {String} unique number of issue (required)
     *  - body {String} text for comment (required)
     * @returns {*}
     */
    createComment: function(token, options) {
        return apiCall(token, 'issues', getFnName(arguments.callee), options);
    },

    /**
     * Edit issue comment
     * @param token - {String} oauth user token
     * @param options - {Object} with fields:
     *  - id {String} unique id of comment (required)
     *  - body {String} text of comment (required)
     * @returns {*}
     */
    editComment: function(token, options) {
        return apiCall(token, 'issues', getFnName(arguments.callee), options);
    },

    /**
     * Removes comment from issue
     * @param token - {String} oauth user token
     * @param options - {Object} with fields:
     *  - id {String} unique id of comment (required)
     * @returns {*}
     */
    deleteComment: function(token, options) {
        return apiCall(token, 'issues', getFnName(arguments.callee), options);
    },

    /**
     * Returns list of repository labels
     * @param token - {String} oauth user token
     * @param options - {Object} empty object literal
     * @returns {*}
     */
    getLabels: function(token, options) {
        return apiCall(token, 'issues', getFnName(arguments.callee), options);
    },

    /**
     * Returns authentificated user
     * @param token - {String} oauth user token
     * @param options - {Object} empty object
     * @returns {*}
     */
    getAuthUser: function(token, options) {
        return apiCall(token, 'user', 'get', options);
    },

    /**
     * Returns detail information about github repository
     * @param token - {String} oauth user token
     * @param options - {Object} empty object
     * @returns {*}
     */
    getRepoInfo: function(token, options) {
        return apiCall(token, 'repos', 'get', options)
    }
};
