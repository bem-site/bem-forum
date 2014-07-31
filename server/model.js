var path = require('path'),

    _ = require('lodash'),
    vow = require('vow'),
    vowFs = require('vow-fs'),
    CronJob = require('cron').CronJob,

    github = require('./github');

var MAX_LIMIT = 100,
    DEFAULT = {
        page: 1,
        limit: 30,
        sort: {
            field: 'updated',
            direction: 'desc'
        }
    },
    model;

/**
 * Archive module
 * @returns {{init: init, getIssues: getIssues, getComments: getComments}}
 */
var Archive = function(options) {
    this.init(options);
};

Archive.prototype = {
    model: {
        issues: [],
        comments: []
    },

    /**
     * Initializing archive
     * @param options
     * @returns {Object}
     */
    init: function(options) {
        return vowFs.read(path.join(process.cwd(), options.archive), 'utf-8')
            .then(function(data) {
                data = JSON.parse(data);
                this.model = Object.keys(data).reduce(function(prev, key) {
                    prev[key] = data[key];
                    return prev;
                }, {});
                return vow.resolve(this.model);
            }, this);
    },

    /**
     * Returns issues array from archive
     * @returns {Array}
     */
    getIssues: function() {
        return this.model.issues;
    },

    getIssue: function(number) {
        return this.getIssues().filter(function(item) {
            return item.number == number;
        })[0];
    },

    /**
     * Returns comments array for issue with id
     * @param issueId - {Number} id of issue
     * @returns {Array}
     */
    getComments: function(issueId) {
        return this.model.comments
            .filter(function(item) {
                return item.number == issueId;
            })
            .sort(function(a, b) {
                var da = new Date(a['created_at']),
                    db = new Date(b['created_at']);

                return db.getTime() - da.getTime();
            });
    }
};

var Model = function(options) {
    this.init(options);
};

Model.prototype = {
    archive: null,
    labels: [],
    job: null,

    init: function(options) {
        this.archive = new Archive(options);
        this.loadLabels();
        this.job = new CronJob({
            cronTime: '0 0 */1 * * *',
            onTick: function() { this.loadLabels(); },
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
        return github.getLabels.call(github, null, { per_page: 100, page: 1 }).then(function(labels) {
            this.labels = labels || [];
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
     * Return archive model
     * @returns {Archive}
     */
    getArchive: function() {
        return this.archive;
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

/**
 * Loads all issues for configured github repository and returns them
 * @returns {Promise}
 */
function loadAllGithubIssues(token) {
    return github.getRepoInfo(token, {})
        .then(function(res) {
            var count = res['open_issues'],
                promises = [],
                pages;

            //check for existed issues count for current repository
            if(!count) {
                return vow.resolve([]);
            }

            //calculate number of pages
            pages = ~~(count/MAX_LIMIT) + (count % MAX_LIMIT > 0 ? 1 : 0);

            //create promises for load all issues by pages
            for(var i = 1; i<= pages; i++) {
                promises.push(github.getIssues(token, { page: i, per_page: MAX_LIMIT }));
            }

            //after all load processes we should unite results and return common array of issues
            return vow.all(promises).then(function(res) {
                return res.reduce(function(prev, item) {
                    prev = prev.concat(item);
                    return prev;
                }, []);
            });
        });
}

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
        return loadAllGithubIssues(token).then(function(issues) {
            var result = issues.concat(model.getArchive().getIssues()),
                filterLabels = options.labels,
                filterSince = options.since,
                sortField,
                sortDirection,
                order,
                page,
                limit;

            //show only open issues and issues from archive
            result = result.filter(function(item) {
                return 'closed' !== item.state;
            });

            //filter by issue labels
            if(filterLabels) {
                filterLabels = filterLabels.split(',');

                result = result.filter(function(issueItem) {
                    var issueLabels = issueItem.labels.map(function(labelItem) {
                        return labelItem.name || labelItem;
                    });
                    return filterLabels.every(function(filterLabel) {
                        return issueLabels.indexOf(filterLabel) > -1;
                    });
                });
            }

            //filter by updated date
            if(filterSince && _.isDate(filterSince)) {
                result = result.filter(function(item) {
                    return (new Date(item.created_at)).getTime() >= filterSince.getTime();
                });
            }

            //sort results
            sortField = (options.sort && /^(created|updated|comments)$/.test(options.sort))
                ? options.sort : DEFAULT.sort.field;
            sortDirection = (options.direction && /^(asc|desc)$/.test(options.direction))
                ? options.direction : DEFAULT.sort.direction;
            order = DEFAULT.sort.direction === sortDirection ? -1 : 1;

            result = result.sort(function(a, b) {
                var an = +a.number,
                    bn = +b.number;

                //separate gh and archive issues
                if(an*bn < 0) {
                    return bn - an;
                }

                if('comments' === sortField) {
                    return order*(+a[sortField] - +b[sortField]);
                }

                return order*((new Date(a[sortField + '_at'])).getTime() -
                    (new Date(b[sortField + '_at'])).getTime());
            });

            page = options.page || DEFAULT.page;
            limit = options.per_page || DEFAULT.limit;

            result = result.filter(function(item, index) {
                return index >= limit * (page - 1) && index < limit * page
            });

            return vow.resolve(result);
        });
    },

    /**
     * Returns issue by it number
     * @param token - {String} oauth user token
     * @param options - {Object} with fields:
     *  - number {Number} unique number of issue
     * @returns {*}
     */
    getIssue: function(token, options) {
        var issueNumber = options.number;

        if(!issueNumber) {
            return null;
        }

        //load issue from archive
        if(issueNumber < 0) {
            return vow.resolve(model.getArchive().getIssue(issueNumber));
        }

        //load gh issue
        return github.getIssue.call(github, token, options);
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
        if(!options.number) {
            return vow.resolve([]);
        }

        //load archive comments
        if(options.number < 0) {
            return vow.resolve(model.getArchive().getComments(options.number));
        }

        //load gh comments
        return github.getComments.call(github, token, options);
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
        return model.areLabelsLoaded() ? vow.resolve(model.getLabels()) :
            github.getLabels.call(github, token, options);
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
