/**
 * The module for generation of a site map of a forum
 * @param allIssues {Array} - issues, which have to get to a sitemap
 * @param config {Array} - the config for the building of sitemap, contains language and the url for that language
 * @returns {string} - the generated xml
 */

exports.get = function (allIssues, config) {
    var urls = [];

    allIssues.forEach(function (issuesByLang, idx) {
        issuesByLang.forEach(function (issue) {
            urls.push(
                '<url>',
                    '<loc>' + config[idx].url + issue.number + '</loc>',
                    '<changefreq>monthly</changefreq>',
                    '<priority>0.5</priority>',
                '</url>'
            );
        });
    });

    return '<?xml version="1.0" encoding="UTF-8"?>' +
           '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
               urls.join('') +
           '</urlset>';
};
