var _ = require('lodash'),
    vow = require('vow'),
    CronJob = require('cron').CronJob,

    github = require('./github'),
    archive = require('./archive');

var MAX_LIMIT = 100,
    DEFAULT = {
        PAGE: 1,
        LIMIT: 30,
        SORT: {
            FIELD: 'updated',
            DIRECTION: 'desc'
        }
    },
    isCacheEnabled = false,
    issues = [],
    opts,
    job;


/**
 * Loads All issues for configured github repository and returns them
 * @returns {Promise}
 */
function loadAllGithubIssues() {
    return github.getRepoInfo(null, {})
        .then(function(res) {
            var count = res['open_issues'],
                promises = [],
                pages;

            //check for existed issues count for current repository
            if(!count) {
                issues = [];
                return vow.resolve(issues);
            }

            //calculate number of pages
            pages = ~~(count/MAX_LIMIT) + (count%MAX_LIMIT > 0 ? 1 : 0);

            //create promises for load all issues by pages
            for(var i = 1; i<= pages; i++) {
                promises.push(github.getIssues(null, { page: i, per_page: MAX_LIMIT }));
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

/**
 * Initialize archive model and loads issues from it
 * @param options - {Object} forum configuration object
 * @returns {*}
 */
function loadArchiveIssues(options) {
    return archive
        .init(options)
        .then(function() {
            return archive.getIssues();
        });
}

function isEnabled() {
    return isCacheEnabled;
}

/**
 * Returns name of function
 * @param fn - {Function}
 * @returns {*}
 * @private
 */
function getFnName(fn) {
    var _this = module.exports;

    return Object.keys(module.exports).filter(function(key) {
        return _this[key] == fn;
    })[0];
}

/**
 * Loads issues from gh and archive file and unite them into single array
 * @param o - {Object} forum configuration object
 * @returns {*}
 */
function load(o) {
    console.log('LOAD MODEL');

    return vow.all([
        loadAllGithubIssues(),
        loadArchiveIssues(o)
    ]).spread(function(ghIssues, archIssues) {
        issues = ghIssues.concat(archIssues);
    });
}

module.exports = {
    init: function(options) {
        if(!options.cache) {
            return;
        }

        opts = options;
        isCacheEnabled = true;

        if(options.update) {
            job = new CronJob({
                cronTime: options.update,
                onTick: function() { load(opts); },
                start: false
            });
            job.start();
        }

        return load(opts);
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
        if(!isEnabled()) {
            return github[getFnName(arguments.callee)].call(github, token, options);
        }

        var result = issues,
            sortField,
            sortDirection,
            order,
            page,
            limit;

        //show only open issues and issues from archive
        result = result.filter(function(item) {
            return item.state !== 'closed';
        });

        //filter by issue labels
        if(options.labels && options.labels.length) {
            var filterLabels = options.labels.split(',');

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
        if(options['since'] && _.isDate(options['since'])) {
            result = result.filter(function(item) {
                return (new Date(item['created_at'])).getTime() >= options['since'].getTime();
            });
        }

        //sort results
        sortField = (options.sort && /^(created|updated|comments)$/.test(options.sort))
                ? options.sort : DEFAULT.SORT.FIELD;
        sortDirection = (options.direction && /^(asc|desc)$/.test(options.direction))
                ? options.direction : DEFAULT.SORT.DIRECTION;
        order = DEFAULT.SORT.DIRECTION === sortDirection ? -1 : 1;

        result = result.sort(function(a, b) {
            var an = +a.number,
                bn = +b.number;

            //separate gh and archive issues
            if(an*bn < 0) {
                return bn - an;
            }

            if('comments' === sortField) {
                return order*(+a[sortField] - +b[sortField]);
            }else {
                return order*((new Date(a[sortField + '_at'])).getTime() -
                    (new Date(b[sortField + '_at'])).getTime());
            }
        });

        page = options.page || DEFAULT.PAGE;
        limit = options.per_page || DEFAULT.LIMIT;

        result = result.filter(function(item, index) {
            return index >= limit*(page - 1) && index < limit*page
        });

        return vow.resolve(result);
    },

    /**
     * Returns issue by it number
     * @param token - {String} oauth user token
     * @param options - {Object} with fields:
     *  - number {Number} unique number of issue
     * @returns {*}
     */
    getIssue: function(token, options) {
        if(!isEnabled()) {
            return github[getFnName(arguments.callee)].call(github, token, options);
        }

        if(!options.number) {
            return null;
        }

        var result = issues.filter(function(item) {
            return item.number == options.number;
        })[0];

        return vow.resolve(result);
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
        return github[getFnName(arguments.callee)].call(github, token, options)
            .then(function(issue) {
                if(isEnabled()) {
                    issues.push(issue);
                }

                return vow.resolve(issue);
            });
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
        return github[getFnName(arguments.callee)].call(github, token, options)
            .then(function(issue) {
                if(isEnabled()) {
                    var existed = issues.filter(function(item) {
                        return item.number == issue.number;
                    })[0];

                    existed && (issues[issues.indexOf(existed)] = issue);
                }

                return vow.resolve(issue);
            });
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

        if(options.number > 0) {
            return github[getFnName(arguments.callee)].call(github, token, options);
        }

        return vow.resolve(archive.getComments(options.number));
    },

    /**
     * Returns comment by it id
     * @param token - {String} oauth user token
     * @param options - {Object} with fields:
     *  - id {String} unique id of comment (required)
     * @returns {*}
     */
    getComment: function(token, options) {
        return github[getFnName(arguments.callee)].call(github, token, options);
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
        return github[getFnName(arguments.callee)].call(github, token, options).then(function(comment) {
            if(isEnabled()) {
                var existed = issues.filter(function(item) {
                    return item.number == options.number;
                })[0];

                existed && (issues[issues.indexOf(existed)].comments++);
            }

            return vow.resolve(comment);
        });
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
        return github[getFnName(arguments.callee)].call(github, token, options);
    },

    /**
     * Removes comment from issue
     * @param token - {String} oauth user token
     * @param options - {Object} with fields:
     *  - id {String} unique id of comment (required)
     * @returns {*}
     */
    deleteComment: function(token, options) {
        return github[getFnName(arguments.callee)].call(github, token, options).then(function(res) {
            if(isEnabled()) {
                var existed = issues.filter(function(item) {
                    return item.number == options.number;
                })[0];

                existed && (issues[issues.indexOf(existed)].comments--);
            }

            return vow.resolve(res);
        });
    },

    /**
     * Returns list of repository labels
     * @param token - {String} oauth user token
     * @param options - {Object} empty object literal
     * @returns {*}
     */
    getLabels: function(token, options) {
        return github[getFnName(arguments.callee)].call(github, token, options);
    },

    /**
     * Returns label from repository by it name
     * @param token - {String} oauth user token
     * @param options - {Object} with fields:
     *  - name {String} label name (required)
     * @returns {*}
     */
    getLabel: function(token, options) {
        return github[getFnName(arguments.callee)].call(github, token, options);
    },

    /**
     * Creates new label in repository
     * @param token - {String} oauth user token
     * @param options - {Object} with fields:
     *  - name {String} label name (required)
     *  - color {String} 6 symbol hex color of label (required)
     * @returns {*}
     */
    createLabel: function(token, options) {
        return github[getFnName(arguments.callee)].call(github, token, options);
    },

    /**
     * Updates label in repository
     * @param token - {String} oauth user token
     * @param options - {Object} with fields:
     *  - name {String} label name (required)
     *  - color {String} 6 symbol hex color of label (required)
     * @returns {*}
     */
    updateLabel: function(token, options) {
        return github[getFnName(arguments.callee)].call(github, token, options);
    },

    /**
     * Removes label from repository
     * @param token - {String} oauth user token
     * @param options - {Object} with fields:
     *  - name {String} label name (required)
     * @returns {*}
     */
    deleteLabel: function(token, options) {
        return github[getFnName(arguments.callee)].call(github, token, options);
    },

    /**
     * Returns authentificated user
     * @param token - {String} oauth user token
     * @param options - {Object} empty object
     * @returns {*}
     */
    getAuthUser: function(token, options) {
        return github[getFnName(arguments.callee)].call(github, token, options);
    },

    /**
     * Returns detail information about github repository
     * @param token - {String} oauth user token
     * @param options - {Object} empty object
     * @returns {*}
     */
    getRepoInfo: function(token, options) {
        return github[getFnName(arguments.callee)].call(github, token, options);
    }
};
