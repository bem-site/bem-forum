var path = require('path'),

    _ = require('lodash'),
    vow = require('vow'),
    vowFs = require('vow-fs'),
    CronJob = require('cron').CronJob,

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

/**
 * Archive module
 * @returns {{init: init, getIssues: getIssues, getComments: getComments}}
 */
var Archive = function (options, lang) {
    this._options = options;
    this._lang = lang;
};

Archive.prototype = {
    model: {
        issues: [],
        comments: []
    },

    /**
     * Initializing archive
     * @returns {Object}
     */
    init: function () {
        return vowFs.read(path.join(process.cwd(), this._options.archive[this._lang]), 'utf-8')
            .then(function (data) {
                data = JSON.parse(data);
                this.model = Object.keys(data).reduce(function (prev, key) {
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
    getIssues: function () {
        return this.model.issues;
    },

    getIssue: function (number) {
        return this.getIssues().filter(function (item) {
            return item.number == number;
        })[0];
    },

    /**
     * Returns comments array for issue with id
     * @param issueId - {Number} id of issue
     * @returns {Array}
     */
    getComments: function (issueId) {
        return this.model.comments
            .filter(function (item) {
                return item.number == issueId;
            })
            .sort(function (a, b) {
                var da = new Date(a['created_at']),
                    db = new Date(b['created_at']);

                return db.getTime() - da.getTime();
            });
    }
};

var Model = function (options) {
    this.init(options);
};

Model.prototype = {
    archive: {},
    labels: {},
    job: null,

    init: function (options) {
        var languages = options.languages;

        this.initArchives(options);
        this.loadLabels(languages);
        this.job = new CronJob({
            cronTime: '0 0 */1 * * *',
            onTick: function () { this.loadLabels(languages); },
            start: false,
            context: this
        });
        this.job.start();
    },

    initArchives: function (options) {
        var _this = this;

        return vow.all(options.languages
            .filter(function (lang) {
                return options.archive[lang];
            })
            .map(function (lang) {
                var archive = new Archive(options, lang);

                _this.archive[lang] = archive;
                return archive.init();
            }));
    },

    /**
     * Loads labels from github and cache them to model
     * @param languages - {Array} forum languages
     * @returns {*}
     */
    loadLabels: function (languages) {
        var _this = this,
            promises;

        promises = languages.map(function (lang) {
            return github.getLabels.call(github, null, {
                lang: lang,
                page: DEFAULT.page,
                'per_page': DEFAULT.perPage
            }).then(function (labels) {
                _this.labels[lang] = (labels || [])
                    .filter(function (label) {
                        return label.name !== 'removed';
                    })
                    .sort(function (a, b) {
                        if (a.name === b.name) return 0;
                        return a.name > b.name ? 1 : -1;
                    });
            });
        });

        return vow.all(promises).fail(function (err) {
            console.error('model:loadLabels', err);
        });
    },

    /**
     * Returns cached array of labels
     * @returns {Array}
     */
    getLabels: function (lang) {
        return this.labels[lang];
    },

    /**
     * Return archive model
     * @returns {Archive}
     */
    getArchive: function (lang) {
        return _.isObject(this.archive) && this.archive[lang];
    },

    /**
     * Returns length of labels array.
     * Can be used for check is labels were loaded and cached
     * @returns {Number}
     */
    areLabelsLoaded: function (lang) {
        return this.labels[lang] && this.labels[lang].length;
    }
};

/**
 * Loads all issues for configured github repository and returns them
 * @returns {Promise}
 */
function loadAllGithubIssues(token, options) {
    var def = vow.defer(),
        issues = [],
        page = DEFAULT.page;

    (function getIssues() {
        return github.getIssues(token, { page: page, 'per_page': DEFAULT.perPage, lang: options.lang })
            .then(function (result) {
                ++page;
                issues = issues.concat(result);

                if (!_.isArray(issues)) {
                    def.reject();
                }

                if (DEFAULT.perPage === issues.length) {
                    getIssues();
                }

                return def.resolve(issues.filter(function (issue) {
                    var labels = issue.labels;

                    return labels.length ? labels.every(function (label) {
                        return label.name !== 'removed';
                    }) : true;
                }));
            });
    })();

    return def.promise();
}

module.exports = {

    /**
     * Initialize forum model
     * @param options - {Object} forum options
     * @returns {*}
     */
    init: function (options) {
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
    getIssues: function (token, options) {
        return loadAllGithubIssues(token, options).then(function (issues) {
            var archive = model.getArchive(options.lang),
                result = issues.concat(archive ? archive.getIssues() : []),
                filterLabels = options.labels,
                filterSince = options.since,
                sortField,
                sortDirection,
                order,
                page,
                limit;

            // filter by issue labels
            if (filterLabels) {
                filterLabels = filterLabels.split(',');

                result = result.filter(function (issueItem) {
                    var issueLabels = issueItem.labels.map(function (labelItem) {
                        return labelItem.name || labelItem;
                    });
                    return filterLabels.every(function (filterLabel) {
                        return issueLabels.indexOf(filterLabel) > -1;
                    });
                });
            }

            // filter by updated date
            if (filterSince && _.isDate(filterSince)) {
                result = result.filter(function (item) {
                    // jscs:disable requireCamelCaseOrUpperCaseIdentifiers
                    return (new Date(item.created_at)).getTime() >= filterSince.getTime();
                    // jscs:enable requireCamelCaseOrUpperCaseIdentifiers
                });
            }

            // sort results
            sortField = (options.sort && /^(created|updated|comments)$/.test(options.sort)) ?
                options.sort : DEFAULT.sort.field;
            sortDirection = (options.direction && /^(asc|desc)$/.test(options.direction)) ?
                options.direction : DEFAULT.sort.direction;
            order = DEFAULT.sort.direction === sortDirection ? -1 : 1;

            result = result.sort(function (a, b) {
                var an = +a.number,
                    bn = +b.number;

                // separate gh and archive issues
                if (an * bn < 0) {
                    return bn - an;
                }

                if (sortField === 'comments') {
                    return order * (+a[sortField] - +b[sortField]);
                }

                return order * ((new Date(a[sortField + '_at'])).getTime() -
                    (new Date(b[sortField + '_at'])).getTime());
            });

            page = options.page || DEFAULT.page;
            // jscs:disable requireCamelCaseOrUpperCaseIdentifiers
            limit = options.per_page || DEFAULT.limit;
            // jscs:enable requireCamelCaseOrUpperCaseIdentifiers

            result = result.filter(function (item, index) {
                return index >= limit * (page - 1) && index < limit * page
            });

            return vow.resolve(result);
        }, function (err) {
            console.err('Model.js -> loadAllGithubIssues', err);
        });
    },

    /**
     * Returns issue by it number
     * @param token - {String} oauth user token
     * @param options - {Object} with fields:
     *  - number {Number} unique number of issue
     * @returns {*}
     */
    getIssue: function (token, options) {
        var issueNumber = options.number;

        if (!issueNumber) {
            return null;
        }

        // load issue from archive
        if (issueNumber < 0) {
            return vow.resolve(model.getArchive(options.lang).getIssue(issueNumber));
        }

        // load gh issue
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
    createIssue: function (token, options) {
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
    editIssue: function (token, options) {
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
    getComments: function (token, options) {
        options.per_page = 100;

        if (!options.number) {
            return vow.resolve([]);
        }

        // load archive comments
        if (options.number < 0) {
            return vow.resolve(model.getArchive(options.lang).getComments(options.number));
        }

        // load gh comments
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
    createComment: function (token, options) {
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
    editComment: function (token, options) {
        return github.editComment.call(github, token, options);
    },

    /**
     * Removes comment from issue
     * @param token - {String} oauth user token
     * @param options - {Object} with fields:
     *  - id {String} unique id of comment (required)
     * @returns {*}
     */
    deleteComment: function (token, options) {
        return github.deleteComment.call(github, token, options);
    },

    /**
     * Returns list of repository labels
     * @param token - {String} oauth user token
     * @param options - {Object} empty object literal
     * @returns {*}
     */
    getLabels: function (token, options) {
        var lang = options.lang;

        return model.areLabelsLoaded(lang) ? vow.resolve(model.getLabels(lang)) :
            github.getLabels.call(github, token, options);
    },

    /**
     * Returns authentificated user
     * @param token - {String} oauth user token
     * @param options - {Object} empty object
     * @returns {*}
     */
    getAuthUser: function (token, options) {
        return github.getAuthUser.call(github, token, options);
    },

    /**
     * Returns detail information about github repository
     * @param token - {String} oauth user token
     * @param options - {Object} empty object
     * @returns {*}
     */
    getRepoInfo: function (token, options) {
        return github.getRepoInfo.call(github, token, options);
    },

    addUserAPI: function (token) {
        return github.addUserAPI.call(github, token);
    }
};
