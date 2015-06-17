/**
 * The module for generation sitemap of a forum
 */

var js2xml = require('js2xmlparser');

/**
 * Get urlset for building forum sitemap
 * @param allIssues {Array} - issues, which have to get to a sitemap
 * @param config {Array} - the config for the building of sitemap, contains language and the url for that language
 * @returns {string} - the generated xml
 */
function getUrlset (allIssues, config) {
    var urls = [];

    allIssues.forEach(function (issuesByLang, idx) {
        issuesByLang.forEach(function (issue) {
            urls.push({
                loc: config[idx].url + issue.number,
                changefreq: 'monthly',
                priority: 0.5
            });
        });
    });

    return {
        '@': { xmlns: 'http://www.sitemaps.org/schemas/sitemap/0.9' },
        url: urls
    };
}

/**
 * Get xml sitemap
 * @param allIssues {Array} - issues, which have to get to a sitemap
 * @param config {Array} - the config for the building of sitemap, contains language and the url for that language
 * @returns {string} - the generated xml
 */
exports.getXml = function (allIssues, config) {
    return js2xml('urlset', getUrlset(allIssues, config));
};

/**
 * Get json sitemap
 * @param allIssues {Array} - issues, which have to get to a sitemap
 * @param config {Array} - the config for the building of sitemap, contains language and the url for that language
 * @returns {string} - the generated xml
 */
exports.getJson = function (allIssues, config) {
    return JSON.stringify(getUrlset(allIssues, config));
};
