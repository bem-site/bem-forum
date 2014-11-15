var Base = function (options) {
    this.init(options);
};

Base.prototype = {

    /**
     * Initialize forum model
     * @param {Object} options of forum
     * @returns {*}
     */
    init: function (options) {
        console.log(options);
        // TODO It should be implemented in nested classes
    },

    /**
     * Returns list of issues
     * @param {Object} options with fields:
     *  - options.token {String} oauth user token
     *  - options.state {String} state of issue (open|closed)
     *  - options.labels {String} string of labels separated by comma
     *  - options.sort {String} sort criteria (created|updated|comments)
     *  - options.direction {String} sort direction (asc|desc)
     *  - options.since {Date}: date from (optional) YYYY-MM-DDTHH:MM:SSZ
     *  - options.page {Number} number of page for pagination
     *  - options.per_page {Number} number of records per one page
     * @returns {*}
     */
    getIssues: function (options) {
        console.log(options);
        // TODO It should be implemented in nested classes
    },

    /**
     * Returns issue by it number
     * @param {Object} options with fields:
     *  - options.token {String} oauth user token (optional)
     *  - options.number {Number} unique number of issue
     * @returns {*}
     */
    getIssue: function (options) {
        console.log(options);
        // TODO It should be implemented in nested classes
    },

    /**
     * Creates new issue
     * @param {Object} options with fields:
     *  - options.token {String} oauth user token (optional)
     *  - options.title {String} title of issue (required)
     *  - options.body {String} body of issue (optional)
     *  - options.labels {Array} array of string label names (required)
     * @returns {*}
     */
    createIssue: function (options) {
        console.log(options);
        // TODO It should be implemented in nested classes
    },

    /**
     * Edit issue
     * @param {Object} options with fields:
     *  - options.token {String} oauth user token (optional)
     *  - options.number {Number} number of issue (required)
     *  - options.title {String} title of issue (optional)
     *  - options.body {String} body of issue (optional)
     *  - options.labels {Array} array of string label names (optional)
     *  - options.state {String} state of issue (open|closed) (optional)
     * @returns {*}
     */
    editIssue: function (options) {
        console.log(options);
        // TODO It should be implemented in nested classes
    },

    /**
     * Returns list of comments for issue
     * @param {Object} options with fields:
     *  - options.token {String} oauth user token (optional)
     *  - options.number {Number} unique number of issue (required)
     *  - options.page {Number} number of page for pagination (optional)
     *  - options.per_page {Number} number of records on one page (optional)
     * @returns {*}
     */
    getComments: function (options) {
        console.log(options);
        // TODO It should be implemented in nested classes
    },

    /**
     * Create new comment for issue
     * @param {Object} options with fields:
     *  - options.token {String} oauth user token
     *  - options.number {String} unique number of issue (required)
     *  - options.body {String} text for comment (required)
     * @returns {*}
     */
    createComment: function (options) {
        console.log(options);
        // TODO It should be implemented in nested classes
    },

    /**
     * Edit issue comment
     * @param {Object} options with fields:
     *  - options.token {String} oauth user token
     *  - options.id {String} unique id of comment (required)
     *  - options.body {String} text of comment (required)
     * @returns {*}
     */
    editComment: function (options) {
        console.log(options);
        // TODO It should be implemented in nested classes
    },

    /**
     * Removes comment from issue
     * @param {Object} options with fields:
     *  - options.token {String} oauth user token
     *  - options.id {String} unique id of comment (required)
     * @returns {*}
     */
    deleteComment: function (options) {
        console.log(options);
        // TODO It should be implemented in nested classes
    },

    /**
     * Returns list of repository labels
     * @param {Object} options with fields:
     *  - options.token {String} oauth user token
     * @returns {*}
     */
    getLabels: function (options) {
        console.log(options);
        // TODO It should be implemented in nested classes
    },

    /**
     * Returns authentificated user
     * @param {Object} options with fields:
     *  - options.token {String} oauth user token
     * @returns {*}
     */
    getAuthUser: function (options) {
        console.log(options);
        // TODO It should be implemented in nested classes
    },

    /**
     * Create authentificated user
     * @param {Object} options with fields:
     *  - options.token {String} oauth user token
     * @returns {*}
     */
    createAuthUser: function (options) {
        console.log(options);
        // TODO It should be implemented in nested classes
    },

    /**
     * Edit authentificated user
     * @param options - {Object} with fields:
     * @param options.token {String} oauth user token
     * @returns {*}
     */
    editAuthUser: function(options) {
        console.log(options);
        // TODO It should be implemented in nested classes
    },

    /**
     * Returns detail information about github repository
     * @param options - {Object} with fields:
     *  - token {String} oauth user token
     * @returns {*}
     */
    getRepoInfo: function (options) {
        console.log(options);
        // TODO It should be implemented in nested classes
    },

    getDefaultAPI: function () {},

    getUserAPI: function () {},

    addUserAPI: function () {},

    addDefaultAPI: function () {}
};

module.exports = Base;
