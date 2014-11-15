var _ = require('lodash'),
    md = require('marked'),
    hljs = require('highlight.js'),
    config = require('./config');

module.exports = {

    /**
     * Returns true if current environment is development
     * @returns {boolean}
     */
    isDev: function () {
        return config.get('NODE_ENV') === 'development';
    },

    /**
     * Compile *.md files & issue.body string with md to html with marked module
     * @param {String} content of *.md file
     * @param {Object} config object
     * @returns {String} html string
     */
    mdToHtml: function (content, config) {
        if (!config) {
            config = {};
        }

        return md(content, _.extend({
            sanitize: true,
            highlight: function (content) {
              return hljs.highlightAuto(content).value;
            }
        }, config));
    }
};
