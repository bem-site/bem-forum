var _ = require('lodash'),
    vow = require('vow'),
    Api = require('github'),

    config = require('../config'),
    Base = require('./base'),
    Cache = require('../models/cache'),

    MAX_LIMIT = 100,
    DEFAULT = {
        page: 1,
        limit: 30,
        sort: {
            field: 'updated',
            direction: 'desc'
        }
    },
    API_CONFIG = {
        version: "3.0.0",
        protocol: "https",
        timeout: 10000,
        debug: true,
        host: "api.github.com"
    },
    options,
    apiHash,
    model;

/**
 * Loads all issues for configured github repository and returns them
 * @returns {Promise}
 */
function loadAllGithubIssues(token) {
    return Github.prototype
        .getRepoInfo({ token: token })
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
                var o = { page: i, per_page: MAX_LIMIT, token: token };
                promises.push(apiCall('issues', 'repoIssues', o));
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
 * Calls github api method
 * @param token - {String} auth token
 * @param group - {String} api group (user, issues ...)
 * @param name - {String} name of api method
 * @param options - {Object} params hash which can contain
 * different set of key depending on command
 * @returns {*}
 */
function apiCall(group, name, opts) {
    var def = vow.defer(),
        token = opts.token,
        api = token ?
            this.getUserAPI(token) :
            this.getDefaultAPI();

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
}

var Github = function() {
    this.init(config.get('forum'));
};

Github.prototype = Object.create(Base.prototype);

Github.prototype.init = function(options) {
    this.addDefaultAPI();
    model = new Cache(options, this);
};

Github.prototype.getIssues = function(token, options) {
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
        sortField = (options.sort && /^(created|updated|comments)$/.test(options.sort)) ?
            options.sort : DEFAULT.sort.field;
        sortDirection = (options.direction && /^(asc|desc)$/.test(options.direction)) ?
            options.direction : DEFAULT.sort.direction;
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
            return index >= limit * (page - 1) && index < limit * page;
        });

        return vow.resolve(result);
    });
};

Github.prototype.getIssue = function(options) {
    var issueNumber = options.number;

    if(!issueNumber) {
        return null;
    }

    //load issue from archive
    if(issueNumber < 0) {
        return vow.resolve(model.getArchive().getIssue(issueNumber));
    }

    //load gh issue
    return apiCall('issues', 'getRepoIssue', options);
};

Github.prototype.createIssue = function(options) {
    return apiCall('issues', 'create', options);
};

Github.prototype.editIssue = function(options) {
    return apiCall('issues', 'edit', options);
};

Github.prototype.getComments = function(options) {
    if(!options.number) {
        return vow.resolve([]);
    }

    //load archive comments
    if(options.number < 0) {
        return vow.resolve(model.getArchive().getComments(options.number));
    }

    //load gh comments
    return apiCall('issues', 'getComments', options);
};

Github.prototype.createComment = function(options) {
    return apiCall('issues', 'createComment', options);
};

Github.prototype.editComment = function(options) {
    return apiCall('issues', 'editComment', options);
};

Github.prototype.deleteComment = function(options) {
    return apiCall('issues', 'deleteComment', options);
};

Github.prototype.getLabels = function(options) {
    return model.areLabelsLoaded() ?
        vow.resolve(model.getLabels()) :
        apiCall('issues', 'getLabels', options);
};

Github.prototype.getAuthUser = function(options) {
    return apiCall('user', 'get', options);
};

Github.prototype.getRepoInfo = function(options) {
    return apiCall('repos', 'get', options);
};

/*** methods only for gh ***/

Github.prototype.getUserAPI = function (options) {
    return apiHash[options.token];
};

Github.prototype.getDefaultAPI = function () {
    var tokens = options.auth ? options.auth.tokens : [];
    return apiHash[_.sample(tokens)];
};

Github.prototype.addDefaultAPI = function (options) {
    var tokens = options.auth ? options.auth.tokens : [];

    apiHash = tokens.reduce(function (prev, token) {
        var api = new Api(API_CONFIG);
        api.authenticate({ type: 'oauth', token: token });
        prev[token] = api;
        return prev;
    }, {});

    return this;
};

Github.prototype.addUserAPI = function(token) {
    if (apiHash[token]) {
        return this;
    }

    var api = new Api(API_CONFIG);
    api.authenticate({ type: 'oauth', token: token });
    apiHash[token] = api;
    return this;
};
