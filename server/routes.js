var Susanin = require('susanin'),
    susanin;

/**
 * Initialize all inner urls for forum module
 * @param baseUrl - {String} base url
 */
exports.init = function(baseUrl) {
    susanin = new Susanin();

    var url = /\/$/.test(baseUrl) ? baseUrl : baseUrl + '/';

    [
        { name: 'index', pattern: baseUrl + '(/)' },
        { name: 'getIssues',     data: { method: 'GET' },    pattern: url + 'issues' },
        { name: 'getIssue',      data: { method: 'GET' },    pattern: url + 'issues/<issue>' },
        { name: 'createIssue',   data: { method: 'PUT' },    pattern: url + 'issues' },
        { name: 'updateIssue',   data: { method: 'POST' },   pattern: url + 'issues/<issue>' },
        { name: 'getComments',   data: { method: 'GET' },    pattern: url + 'issues/<issue>/comments' },
        { name: 'getComment',    data: { method: 'GET' },    pattern: url + 'issues/<issue>/comments/<comment>' },
        { name: 'createComment', data: { method: 'PUT' },    pattern: url + 'issues/<issue>/comments' },
        { name: 'updateComment', data: { method: 'POST' },   pattern: url + 'issues/<issue>/comments/<comment>' },
        { name: 'deleteComment', data: { method: 'DELETE' }, pattern: url + 'issues/<issue>/comments/<comment>' },
        { name: 'getLabels',     data: { method: 'GET' },    pattern: url + 'labels' },
        { name: 'getLabel',      data: { method: 'GET' },    pattern: url + 'labels/<label>' },
        { name: 'createLabel',   data: { method: 'PUT' },    pattern: url + 'labels' },
        { name: 'updateLabel',   data: { method: 'POST' },   pattern: url + 'labels/<label>' },
        { name: 'deleteLabel',   data: { method: 'DELETE' }, pattern: url + 'labels/<label>' }
    ].forEach(function(item) {
        susanin.addRoute(item);
    });
};

/**
 * Return matched route for url
 * @param url - {String} request url
 * @returns {*}
 */
exports.getRoute = function(url) {
    return susanin.findFirst(url);
};
