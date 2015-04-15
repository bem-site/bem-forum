var _ = require('lodash'),
    vow = require('vow'),
    GitHubApi = require('github'),
    Logger = require('bem-site-logger');

function Github (config) {
    this._init(config);
}

Github.prototype = {

    _authReadyApi: [],

    _init: function (config) {
        this._config = config;
        this._logger = Logger.setOptions(this._config['logger']).createLogger(module);
        this._addDefaultAPI();
    },

    _callGithubApi: function (site, token, group, name, options) {
        var _this = this,
            def = vow.defer(),
            github = token ? this._getUserAPI(token) : this._getDefaultAPI();

        // select github storage by site and lang
        options = this._setStorage(site, options);

        this._logger.info('name: %s, token: %s, options: %s', name, token, JSON.stringify(options));

        // see docs http://mikedeboer.github.io/node-github/
        github[group][name].call(null, options, function (err, result) {
            if (err || !result) {
                _this._logger.error('name: %s, token: %s, options: %s', name, group, token);

                def.reject(err);
            } else {
                def.resolve(result);
            }
        });

        return def.promise();
    },

    _setStorage: function (site, options) {
        return _.extend(options, site.storage[options.lang]);
    },

    _getGithubConfig: function () {
        return {
            version: '3.0.0',
            debug: false,
            host: 'api.github.com',
            timeout: 10000,
            headers: {
                'user-agent': 'BEM Forum'
            }
        };
    },

    _getGithubAuthInstance: function (token) {
        var github = new GitHubApi(this._getGithubConfig());

        github.authenticate({
            type: 'oauth',
            token: token
        });

        if (!github) {
            this._logger.warn('Not able to authenticate on github under this token: %s', token);
        }

        return github;
    },

    _addDefaultAPI: function () {
        var _this = this,
            tokens = this._config['api-tokens'];

        if (!tokens || !tokens.length) {
            this._logger.error('Filler in the config field "api tokens" to access the Github API');

            // Stop app if github access tokens not added
            process.exit(1);
        }

        this._authReadyApi = tokens.reduce(function (prev, token) {
            prev[token] = _this._getGithubAuthInstance(token);

            return prev;

        }, {});

        return this;
    },

    _addUserAPI: function (token) {
        var github = this._authReadyApi[token];

        if (!github) {
            github = this._getGithubAuthInstance(token);

            if (github) {
                this._authReadyApi[token] = github;
            } else {
                this._logger.warn('_addUserAPI: Set default API for token: %s', token);
                github = this._getDefaultAPI();
            }
        }

        return github;
    },

    _getUserAPI: function (token) {
        if (!this._authReadyApi[token]) {
            this._addUserAPI(token);
        }

        return this._authReadyApi[token];
    },

    _getDefaultAPI: function () {
        if (_.isEmpty(this._authReadyApi)) {
            this._addDefaultAPI();
        }
        return this._authReadyApi[_.sample(this._config['api-tokens'])];
    },

    /**
     * Returns list of repository labels
     * @param token - {String} oauth user token
     * @param options - {Object} options { per_page, page, headers: {}, lang: ...}
     * @returns {*}
     */
    getLabels: function (site, token, options) {
        return this._callGithubApi(site, token, 'issues', 'getLabels', options);
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
    getIssues: function (token, options, site) {
        return this._callGithubApi(token, 'issues', 'repoIssues', _.extend(options, { state: 'all', sort: 'updated' }), site);
    }
};

module.exports = Github;
