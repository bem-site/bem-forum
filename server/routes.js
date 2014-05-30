var Susanin = require('susanin'),
    susanin;

exports.init = function(pattern) {
    susanin = new Susanin();

    var _pattern = /\/$/.test(pattern) ? pattern : pattern + '/';

    [
        {
            pattern: pattern + '(/)'
        },
        {
            pattern : _pattern + 'issues',
            data : {
                method : 'GET',
                action : 'getIssues'
            }
        },
        {
            pattern: _pattern + 'issues/<issue>',
            data: {
                method: 'GET',
                action: 'getIssue'
            }
        },
        {
            pattern: _pattern + 'issues',
            data: {
                method: 'PUT',
                action: 'createIssue'
            }
        },
        {
            pattern: _pattern + 'issues/<issue>',
            data: {
                method: 'POST',
                action: 'updateIssue'
            }
        },
        {
            pattern: _pattern + 'issues/<issue>/comments',
            data: {
                method: 'GET',
                action: 'getComments'
            }
        },
        {
            pattern: _pattern + 'issues/<issue>/comments/<comment>',
            data: {
                method: 'GET',
                action: 'getComment'
            }
        },
        {
            pattern: _pattern + 'issues/<issue>/comments',
            data: {
                method: 'PUT',
                action: 'createComment'
            }
        },
        {
            pattern: _pattern + 'issues/<issue>/comments/<comment>',
            data: {
                method: 'POST',
                action: 'updateComment'
            }
        },
        {
            pattern: _pattern + 'issues/<issue>/comments/<comment>',
            data: {
                method: 'DELETE',
                action: 'deleteComment'
            }
        },
        {
            pattern: _pattern + 'labels',
            data: {
                method: 'GET',
                action: 'getLabels'
            }
        },
        {
            pattern: _pattern + 'labels/<label>',
            data: {
                method: 'GET',
                action: 'getLabel'
            }
        },
        {
            pattern: _pattern + 'labels',
            data: {
                method: 'PUT',
                action: 'createLabel'
            }
        },
        {
            pattern: _pattern + 'labels/<label>',
            data: {
                method: 'POST',
                action: 'updateLabel'
            }
        },
        {
            pattern: _pattern + 'labels/<label>',
            data: {
                method: 'DELETE',
                action: 'deleteLabel'
            }
        }
    ].forEach(function(item) {
        susanin.addRoute(item);
    });
};

exports.getRoute = function(url) {
    var r = susanin.findFirst(url);
    return r ? r[0] : null;
};
