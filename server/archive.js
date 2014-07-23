var path = require('path'),
    vowFs = require('vow-fs');

var model;

module.exports = {

    /**
     * Initialize archive from local file
     * @param options
     * @returns {Archive}
     */
    init: function(options) {
        console.log('Initialize archive start');

        var onError = function() {
            model = {
                issues: [],
                comments: []
            };
        };

        if(!options || !options.archive) {
            console.warn('Archive options were not set');
            return onError();
        }

        return vowFs.read(path.join(process.cwd(), options.archive), 'utf-8')
            .then(function(data) {
                return JSON.parse(data);
            })
            .then(function(data) {
                model = Object.keys(data).reduce(function(prev, key) {
                    prev[key] = data[key];
                    return prev;
                }, {});
            })
            .fail(function() {
                console.error('Archive initialization failed with error');
                return onError();
            });
    },

    /**
     * Return issues array from archive
     * @returns {Array}
     */
    getIssues: function() {
        return model.issues;
    },

    /**
     * Returns comments array for issue with id
     * @param issueId - {Number} id of issue
     * @returns {Array}
     */
    getComments: function(issueId) {
        return model.comments
            .filter(function(item) {
                return item.number == issueId;
            })
            .sort(function(a, b) {
                var da = new Date(a['created_at']),
                    db = new Date(b['created_at']);

                return db.getTime() - da.getTime();
            });
    }
};


