var CronJob = require('cron').CronJob,
    github = require('./github');

var DEFAULT = {
        page: 1,
        perPage: 100,
        limit: 10,
        sort: {
            field: 'updated',
            direction: 'desc'
        }
    },
    model;

var Model = function(options) {
    this.init(options);
};

Model.prototype = {
    labels: [],
    job: undefined,

    init: function() {
        function onTick() {
            this.loadLabels();
        }

        this.loadLabels();
        this.job = new CronJob({
            cronTime: '0 0 */1 * * *',
            onTick: onTick.bind(this),
            start: false,
            context: this
        });
        this.job.start();
    },

    /**
     * Loads labels from github and cache them to model
     * @returns {*}
     */
    loadLabels: function() {
        return github.getLabels.call(github, null, { page: DEFAULT.page, per_page: DEFAULT.perPage })
            .then(function(labels) {
                this.labels = (labels || [])
                    .filter(function(label) {
                        return label.name !== 'removed';
                    })
                    .sort(function(a, b) {
                        if(a.name === b.name) {
                            return 0;
                        }
                        return a.name > b.name ? 1 : -1;
                    });
            }, this);
    },

    /**
     * Returns cached array of labels
     * @returns {Array}
     */
    getLabels: function() {
        return this.labels;
    },

    /**
     * Returns length of labels array.
     * Can be used for check is labels were loaded and cached
     * @returns {Number}
     */
    areLabelsLoaded: function() {
        return this.labels.length;
    }
};

module.exports = {

    /**
     * Initialize forum model
     * @param options - {Object} forum options
     * @returns {*}
     */
    init: function(options) {
        github.init(options).addDefaultAPI();
        model = new Model(options);
    },

    /**
     * Returns list of issues
     * @param token - {String} oauth user token
     * @param options - {Object} with fields:
     *  - state {String} state of issue (open|closed)
     *  - labels {String} string of labels separated by comma
     *  - sort {String} sort criteria (created|updated|comments)
     *  - direction {String} sort direction (asc|desc)
     *  - since {Date}: date from (optional) YYYY-MM-DDTHH:MM:SSZ
     *  - page {Number} number of page for pagination
     *  - per_page {Number} number of records per one page
     * @returns {*}
     */
    getIssues: function(token, options) {
        options.labels = options.labels ? options.labels.join(',') : '';
        options.sort = (options.sort && /^(created|updated|comments)$/.test(options.sort)) ?
            options.sort : DEFAULT.sort.field;
        options.direction = (options.direction && /^(asc|desc)$/.test(options.direction)) ?
            options.direction : DEFAULT.sort.direction;
        options.page = options.page || DEFAULT.page;
        options.per_page = options.per_page || DEFAULT.limit;

        return github.getIssues(token, options);
    },

    /**
     * Returns issue by it number
     * @param token - {String} oauth user token
     * @param options - {Object} with fields:
     *  - number {Number} unique number of issue
     * @returns {*}
     */
    getIssue: function(token, options) {
        return options.number ? github.getIssue.call(github, token, options) : null;
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
        return github.createIssue.call(github, token, options);
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
        return github.editIssue.call(github, token, options);
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
        return options.number ? github.getComments.call(github, token, options) : [];
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
        return github.createComment.call(github, token, options);
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
        return github.editComment.call(github, token, options);
    },

    /**
     * Removes comment from issue
     * @param token - {String} oauth user token
     * @param options - {Object} with fields:
     *  - id {String} unique id of comment (required)
     * @returns {*}
     */
    deleteComment: function(token, options) {
        return github.deleteComment.call(github, token, options);
    },

    /**
     * Returns list of repository labels
     * @param token - {String} oauth user token
     * @param options - {Object} empty object literal
     * @returns {*}
     */
    getLabels: function(token, options) {
        return model.areLabelsLoaded() ?
            model.getLabels() : github.getLabels.call(github, token, options);
    },

    /**
     * Returns authentificated user
     * @param token - {String} oauth user token
     * @param options - {Object} empty object
     * @returns {*}
     */
    getAuthUser: function(token, options) {
        return github.getAuthUser.call(github, token, options);
    },

    /**
     * Returns detail information about github repository
     * @param token - {String} oauth user token
     * @param options - {Object} empty object
     * @returns {*}
     */
    getRepoInfo: function(token, options) {
        return github.getRepoInfo.call(github, token, options);
    },

    addUserAPI: function(token) {
        return github.addUserAPI.call(github, token);
    }
};
