var _ = require('lodash'),
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

    _callGithubApi: function (token, group, name, options) {
        var _this = this,
            def = vow.defer(),
            github = token ? this._getUserAPI(token) : this._getDefaultAPI();

        // select github storage by lang
        options = this._setStorage(options);

        this._logger.info('name: %s, token: %s, options: %s', name, group, token);

        // see docs http://mikedeboer.github.io/node-github/
        github[group][name].call(null, options, function (err, result) {

            if (err || !result) {
                _this._logger.error('name: %s, token: %s, options: %s', name, group, token);

                def.reject(err);
            } else {
                def.resolve(result);
            }
        });
    },

    _setStorage: function (options) {
        return _.extend(options, this._config.storage[options.lang]);
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
            this._logger.warn('_getGithubAuthInstance: Can`t get github API auth by this token: %s', token);
        }

        return github;
    },

    _addDefaultAPI: function () {
        var _this = this,
            auth = this._config.auth,
            tokens = auth && auth['api-tokens'];

        if (!tokens || !tokens.length) {
            this._logger.error('Add github access token(s) to forum config');

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
        return this._authReadyApi[_.sample(this._config.auth.tokens)];
    },

    /**
     * Returns list of repository labels
     * @param token - {String} oauth user token
     * @param options - {Object} options { per_page, page, headers: {}, lang: ...}
     * @returns {*}
     */
    getLabels: function (token, options) {
        return this._callGithubApi(token, 'issues', 'getLabels', options);
    }
};

module.exports = Github;
