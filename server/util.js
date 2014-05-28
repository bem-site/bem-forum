var _ = require('lodash'),
    md = require('marked');

module.exports = {
    /**
     * Compile *.md files & issue.body string with md to html
     * with marked module
     * @param content - {String} content of *.md file
     * @param config - {Object} configuration object
     * @returns {String} html string
     */
    mdToHtml: function(content, config) {
        if(!config) {
            config = {};
        }

        return md(content, _.extend({
            gfm: true,
            pedantic: false,
            sanitize: false
        }, config));
    }
};
