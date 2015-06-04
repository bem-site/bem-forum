/**
 * The module for generation of a site map of a forum
 * @param allIssues {Array} - issues, which have to get to a sitemap
 * @param config {Array} - the config for the building of sitemap, contains language and the url for that language
 * @returns {string} - the generated xml
 */

exports.get = function (allIssues, config) {
    var sm = '<?xml version="1.0" encoding="UTF-8"?>' + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';

    allIssues.forEach(function (issuesByLang, idx) {
        issuesByLang.forEach(function (issue) {
            sm += '<url>';
            sm += '<loc>' + config[idx].url + issue.number + '</loc>';
            sm += '<changefreq>monthly</changefreq>';
            sm += '<priority>0.5</priority>';
            sm += '</url>';
        });
    });

    sm += '</urlset>';

    return sm;
};
