var _ = require('lodash'),
    vow = require('vow'),
    Github = require('server/github.js');

function Model (config) {
    this.config = config;
    this.github = new Github(config);
}

Model.prototype = {

    labels: {},
    users: [],
    issues: [],
    comments: [],

    getLabels: function (token, lang) {
        var def = vow.defer(),
            labels = this.labels;

        if (!_.isEmpty(labels) && !_.isEmpty(this.labels[lang])) {

            github.getLabels(token, { lang: lang })

            def.resolve(this.labels[lang]);

        } else {

            var _this = this;

            return github.getLabels(token, { lang: lang })
                .then(function (data) {
                    _this.labels[lang] = data;

                    return def.resolve(data);
                })
                .fail(function (err) {
                    return def.reject(err);
                });

        }

        return def.promise();
    }
};
