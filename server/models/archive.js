/**
 * 1. The model is responsible for get and working with archival data.
 * 2. The contents of the archive is taken from the json file specified in the config app.
 * 3. The archive is divided into languages and repeats the data structure API Github.
 * 4. Supports methods to retrieve issues(issue) and comments and has their own methods for sorting,
 * which is exactly the same sort to API Github.
 */
var fs = require('fs'),
    path = require('path'),
    vow = require('vow'),
    inherit = require('inherit'),
    Logger = require('bem-site-logger'),
    ArchiveModel;

module.exports = ArchiveModel = inherit({
    __constructor: function (config) {
        this._config = config;
        this._logger = Logger.setOptions(this._config['logger']).createLogger(module);
        this._initStorage();
    },

    /**
     * Initializing the memory storage
     * Synchronously reads the files specified in the config app
     * and writes them on the key language, to whom the archive.
     * @returns {Object} - filled with the archive data object
     * @private
     */
    _initStorage: function () {
        var archiveConfig = this._config.archive;

        this._storage = {};

        if (archiveConfig) {
            Object.keys(archiveConfig).forEach(function (lang) {
                try {
                    var data = fs.readFileSync(path.join(process.cwd(), archiveConfig[lang]), { encoding: 'utf-8' });
                    this._storage[lang] = JSON.parse(data);
                } catch (err) {
                    this._logger.error('Failed to parse json file with the %s archive error: %s', lang, err);
                }
            }, this);
        }

        return this._storage;
    },

    /**
     * Get the list of archived issues
     * 1. Filter by labels
     * 2. Sort by type and direction
     * 3. Filter by page and limit per page
     * @param options {Object} - options for pull issues
     * @returns {Array}
     */
    getIssues: function (options) {
        var storage = this._storage[options.lang];

        if (!storage) {
            return [];
        }

        var issues = storage.issues;

        issues = this._filterIssuesByLabels(issues, options.labels);
        issues = this._sortIssues(issues, options.sort, options.direction);
        issues = this._filterByPage(issues, options.page, options['per_page']);

        return issues;
    },

    /**
     * Get a single archived issue
     * @param options {Object} - options for pull issue
     * @returns {Object}
     */
    getIssue: function (options) {
        var storage = this._storage[options.lang];

        if (!storage) {
            return {};
        }

        return storage.issues.filter(function (item) {
            return item.number == options.number;
        })[0];
    },

    /**
     * Get the list of archived comments
     * Filtered by creation date in descending order, new in the end
     * @param options {Object} - options for pull comments
     * @returns {Array}
     */
    getComments: function (options) {
        var storage = this._storage[options.lang];

        if (!storage) {
            return [];
        }

        return storage.comments
            .filter(function (item) {
                return item.number == options.number;
            })
            .sort(function (a, b) {
                var da = new Date(a['created_at']),
                    db = new Date(b['created_at']);

                return da.getTime() - db.getTime();
            });
    },

    /**
     * Filter by labels
     * @param issues {Array}
     * @param labels {Array}
     * @returns {Array} - array of filtered issues
     * @private
     */
    _filterIssuesByLabels: function (issues, labels) {
        if (!labels) {
            return issues;
        }

        labels = labels.split(',');

        return issues.filter(function (issue) {
            // get issue label`s name
            var issueLabels = issue.labels.map(function (label) {
                return label.name || label;
            });

            // must have all option labels articles
            return labels.every(function (label) {
                return issueLabels.indexOf(label) > -1;
            });
        });
    },

    /**
     * Sort by type and direction
     * @param issues {Array}
     * @param field {String} - updated, created, comments
     * @param direction {String} - desc, asc
     * @returns {Array} - array of filtered issues
     * @private
     */
    _sortIssues: function (issues, field, direction) {
        var sortField = this._getSortField(field),
            order = this._getSortOrder(direction);

        return issues.sort(function (a, b) {
            if (sortField === 'comments') {
                return order * (+a[sortField] - +b[sortField]);
            }

            return order * ((new Date(a[sortField + '_at'])).getTime() -
                (new Date(b[sortField + '_at'])).getTime());
        });
    },

    /**
     * Get correct sort field
     * Fallback in case the option is not specified sort field
     * @param field {String} - the test sort field
     * @returns {String} - type of sort
     * @private
     */
    _getSortField: function (field) {
        return (field && /^(created|updated|comments)$/.test(field)) ? field : 'updated';
    },

    /**
     * Get a numeric sort order relative to the direction value
     * @param direction {String} - desc, asc
     * @returns {number}
     * @private
     */
    _getSortOrder: function (direction) {
        return this._getSortDirection(direction) === 'desc' ? -1 : 1;
    },

    /**
     * Get correct sort direction
     * Fallback in case the option is not specified sort direction
     * @param direction {String} - the test sort field
     * @returns {String} - direction
     * @private
     */
    _getSortDirection: function (direction) {
        return (direction && /^(asc|desc)$/.test(direction)) ? direction : 'desc';
    },

    /**
     * Filter by page and limit per page
     * @param issues {Array}
     * @param currentPage {Number}
     * @param perPage {number}
     * @returns {Array} - array of filtered issues
     * @private
     */
    _filterByPage: function (issues, currentPage, perPage) {
        var page = currentPage || 1,
            limit = perPage || this._config.perPage;

        // invert the negative value of the page
        if (page < 0) {
            page = Math.abs(page);
        }

        return issues.filter(function (issue, index) {
            return (index >= limit * (page - 1)) && (index < limit * page);
        });
    }
}, {
    getInstance: function (config) {
        if (!this._instance) {
            this._instance = new ArchiveModel(config);
        }

        return this._instance;
    }
});
