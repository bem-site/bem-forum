/**
 * Archive module
 * @returns {{init: init, getIssues: getIssues, getComments: getComments}}
 */
var Archive = function (options, lang) {
    this._options = options;
    this._lang = lang;
};

Archive.prototype = {
    model: {
        issues: [],
        comments: []
    },

    /**
     * Initializing archive
     * @returns {Object}
     */
    init: function () {
        return vowFs.read(path.join(process.cwd(), this._options.archive[this._lang]), 'utf-8')
            .then(function (data) {
                data = JSON.parse(data);
                this.model = Object.keys(data).reduce(function (prev, key) {
                    prev[key] = data[key];
                    return prev;
                }, {});
                return vow.resolve(this.model);
            }, this);
    },

    /**
     * Returns issues array from archive
     * @returns {Array}
     */
    getIssues: function () {
        return this.model.issues;
    },

    getIssue: function (number) {
        return this.getIssues().filter(function (item) {
            return item.number == number;
        })[0];
    },

    /**
     * Returns comments array for issue with id
     * @param issueId - {Number} id of issue
     * @returns {Array}
     */
    getComments: function (issueId) {
        return this.model.comments
            .filter(function (item) {
                return item.number == issueId;
            })
            .sort(function (a, b) {
                var da = new Date(a['created_at']),
                    db = new Date(b['created_at']);

                return db.getTime() - da.getTime();
            });
    }
};
