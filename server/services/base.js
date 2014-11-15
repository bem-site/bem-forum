var Base = function(options) {
    this.init(options);
};

Base.prototype = {

    /**
     * Initialize forum model
     * @param options - {Object} forum options
     * @returns {*}
     */
    init: function(options) {
        //TODO It should be implemented in nested classes
    },

    /**
     * Returns list of issues
     * @param options - {Object} with fields:
     *  - token {String} oauth user token
     *  - state {String} state of issue (open|closed)
     *  - labels {String} string of labels separated by comma
     *  - sort {String} sort criteria (created|updated|comments)
     *  - direction {String} sort direction (asc|desc)
     *  - since {Date}: date from (optional) YYYY-MM-DDTHH:MM:SSZ
     *  - page {Number} number of page for pagination
     *  - per_page {Number} number of records per one page
     * @returns {*}
     */
    getIssues: function(options) {
        //TODO It should be implemented in nested classes
    },

    /**
     * Returns issue by it number
     * @param options - {Object} with fields:
     *  - token {String} oauth user token
     *  - number {Number} unique number of issue
     * @returns {*}
     */
    getIssue: function(options) {
        //TODO It should be implemented in nested classes
    },

    /**
     * Creates new issue
     * @param options - {Object} with fields:
     *  - token {String} oauth user token
     *  - title {String} title of issue (required)
     *  - body {String} body of issue (optional)
     *  - labels {Array} array of string label names (required)
     * @returns {*}
     */
    createIssue: function(options) {
        //TODO It should be implemented in nested classes
    },

    /**
     * Edit issue
     * @param options - {Object} with fields:
     *  - token {String} oauth user token
     *  - number {Number} number of issue (required)
     *  - title {String} title of issue (optional)
     *  - body {String} body of issue (optional)
     *  - labels {Array} array of string label names (optional)
     *  - state {String} state of issue (open|closed) (optional)
     * @returns {*}
     */
    editIssue: function(options) {
        //TODO It should be implemented in nested classes
    },

    /**
     * Returns list of comments for issue
     * @param options - {Object} with fields:
     *  - token {String} oauth user token
     *  - number {Number} unique number of issue (required)
     *  - page {Number} number of page for pagination (optional)
     *  - per_page {Number} number of records on one page (optional)
     * @returns {*}
     */
    getComments: function(options) {
        //TODO It should be implemented in nested classes
    },

    /**
     * Create new comment for issue
     * @param options - {Object} with fields:
     *  - token {String} oauth user token
     *  - number {String} unique number of issue (required)
     *  - body {String} text for comment (required)
     * @returns {*}
     */
    createComment: function(options) {
        //TODO It should be implemented in nested classes
    },

    /**
     * Edit issue comment
     * @param options - {Object} with fields:
     *  - token {String} oauth user token
     *  - id {String} unique id of comment (required)
     *  - body {String} text of comment (required)
     * @returns {*}
     */
    editComment: function(options) {
        //TODO It should be implemented in nested classes
    },

    /**
     * Removes comment from issue
     * @param options - {Object} with fields:
     *  - token {String} oauth user token
     *  - id {String} unique id of comment (required)
     * @returns {*}
     */
    deleteComment: function(options) {
        //TODO It should be implemented in nested classes
    },

    /**
     * Returns list of repository labels
     * @param options - {Object} with fields:
     *  - token {String} oauth user token
     * @returns {*}
     */
    getLabels: function(options) {
        //TODO It should be implemented in nested classes
    },

    /**
     * Returns authentificated user
     * @param options - {Object} with fields:
     *  - token {String} oauth user token
     * @returns {*}
     */
    getAuthUser: function(options) {
        //TODO It should be implemented in nested classes
    },

    /**
     * Returns detail information about github repository
     * @param options - {Object} with fields:
     *  - token {String} oauth user token
     * @returns {*}
     */
    getRepoInfo: function(options) {
        //TODO It should be implemented in nested classes
    }
};

module.exports = Base;
