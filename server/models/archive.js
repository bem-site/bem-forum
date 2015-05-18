var fs = require('fs'),
    util = require('util'),
    path = require('path'),
    _ = require('lodash'),
    vow = require('vow'),
    vowFs = require('vow-fs'),
    inherit = require('inherit'),
    Logger = require('bem-site-logger'),
    stringify = require('json-stringify-safe');

var Archive;

module.exports = Archive = inherit({
    __constructor: function (config) {
        this._config = config;
        this._logger = Logger.setOptions(this._config['logger']).createLogger(module);
        this._initStorage();
    },

    _initStorage: function () {
        var archiveConfig = this._config.archive;

        this._storage = {};

        if (!archiveConfig) {
            return;
        }

        _.keys(archiveConfig).forEach(function (lang) {
            try {
                var data = fs.readFileSync(path.join(process.cwd(), archiveConfig[lang]), { encoding: 'utf-8' });
                this._storage[lang] = JSON.parse(data);
            } catch (err) {
                this._logger.error('Failed to parse json file with the %s archive error: %s', lang, err);
            }
        }, this);
    },

    getIssues: function (options) {
        var storage = this._storage[options.lang];

        if (!storage) {
            return [];
        }

        var issues = storage.issues;

        // filter by issue labels
        issues = this.filterIssuesByLabels(issues, options.labels);

        // sort by type and direction
        issues = this._sortIssues(issues, options.sort, options.direction);

        // sort by page and limit per page
        issues = this._filterByPage(issues, options.page, options['per_page']);

        return issues;
    },

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
     * Returns comments array for issue with id
     * @param options - {Number} id of issue
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

    filterIssuesByLabels: function (issues, labels) {
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

    _filterByPage: function (issues, currentPage, perPage) {
        var page = currentPage || 1,
            limit = perPage || this._config.perPage;

        // invert the negative value of the page
        if (page < 0) {
            page = ~page + 1;
        }

        return issues.filter(function (issue, index) {
            return (index >= limit * (page - 1)) && (index < limit * page);
        });
    },

    _sortIssues: function (issues, sortType, direction) {
        var sortField = this._getSortField(sortType),
            order = this._getSortOrder(direction);

        return issues.sort(function (a, b) {
            if (sortField === 'comments') {
                return order * (+a[sortField] - +b[sortField]);
            }

            return order * ((new Date(a[sortField + '_at'])).getTime() -
                (new Date(b[sortField + '_at'])).getTime());
        });
    },

    _getSortField: function (sortType) {
        return (sortType && /^(created|updated|comments)$/.test(sortType)) ? sortType : 'updated';
    },

    _getSortOrder: function (direction) {
        return this._getSortDirection(direction) === 'desc' ? -1 : 1;
    },

    _getSortDirection: function (direction) {
        return (direction && /^(asc|desc)$/.test(direction)) ? direction : 'desc';
    }

}, {
    getInstance: function (config) {
        if (!this._instance) {
            this._instance = new Archive(config);
        }

        return this._instance;
    }
});
