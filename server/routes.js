var Susanin = require('susanin'),
    susanin;

/**
 * Initialize all inner urls for forum module
 * @param baseUrl - {String} base url
 */
exports.init = function(baseUrl) {

    //remove trailing slash
    //var url = baseUrl.replace(/\/$/, '');

    var url = baseUrl;

    susanin = [
        { name: 'index',         data: { method: 'GET' },    pattern: url },
        { name: 'getIssues',     data: { method: 'GET' },    pattern: url + 'issues'},
        { name: 'getIssue',      data: { method: 'GET' },    pattern: url + 'issues/<number>' },
        { name: 'createIssue',   data: { method: 'POST' },   pattern: url + 'issues' },
        { name: 'editIssue',     data: { method: 'PUT' },    pattern: url + 'issues/<number>' },
        { name: 'getComments',   data: { method: 'GET' },    pattern: url + 'issues/<number>/comments' },
        { name: 'createComment', data: { method: 'POST' },   pattern: url + 'issues/<number>/comments' },
        { name: 'editComment',   data: { method: 'PUT' },    pattern: url + 'issues/<number>/comments/<id>' },
        { name: 'deleteComment', data: { method: 'DELETE' }, pattern: url + 'issues/<number>/comments/<id>' },
        { name: 'getLabels',     data: { method: 'GET' },    pattern: url + 'labels' },
        { name: 'getAuthUser',   data: { method: 'GET' },    pattern: url + 'user' },
        { name: 'auth',          data: { method: 'GET' },    pattern: url + 'auth' },
        { name: 'getRepoInfo',   data: { method: 'GET' },    pattern: url + 'repo' },
        { name: 'facebookAuth',  data: { method: 'GET' },    pattern: url + 'auth/facebook' },
        { name: 'facebookAuthCallback',  data: { method: 'GET' },    pattern: url + 'auth/facebook/callback' },
        { name: 'githubAuth',  data: { method: 'GET' },    pattern: url + 'auth/github' },
        { name: 'githubAuthCallback',  data: { method: 'GET' },    pattern: url + 'auth/github/callback' }
    ].reduce(function(_susanin, route) {
            route.pattern += '(/)';
            _susanin.addRoute(route);
            return _susanin;
        }, new Susanin()
    );
};

/**
 * Return matched route for url
 * @param url - {String} request url
 * @returns {*}
 */
exports.getRoute = function(url, method) {
    var result = susanin.find(url, method);
    if(!result.length) {
        return null;
    }

    return result.filter(function(route) {
        return method === route[0].getData().method;
    })[0];
};
