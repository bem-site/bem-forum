var CronJob = require('cron').CronJob,
    Archive = require('./archive');

var Model = function(options, gh) {
    this.init(options, gh);
};

Model.prototype = {
    gh: null,
    archive: null,
    labels: [],
    job: null,

    init: function(options, gh) {
        this.gh = gh;
        this.archive = new Archive(options);
        this.loadLabels();
        this.job = new CronJob({
            cronTime: '0 0 */1 * * *',
            onTick: (function() { this.loadLabels(); }).bind(this),
            start: false,
            context: this
        });
        this.job.start();
    },

    /**
     * Loads labels from github and cache them to model
     * @returns {*}
     */
    loadLabels: function() {
        return this.gh.getLabels({ per_page: 100, page: 1, token: null }).then(function(labels) {
            this.labels = (labels || []).sort(function(a, b) {
                if(a.name === b.name) {
                    return 0;
                }
                return a.name > b.name ? 1 : -1;
            });
        }, this);
    },

    /**
     * Returns cached array of labels
     * @returns {Array}
     */
    getLabels: function() {
        return this.labels;
    },

    /**
     * Return archive model
     * @returns {Archive}
     */
    getArchive: function() {
        return this.archive;
    },

    /**
     * Returns length of labels array.
     * Can be used for check is labels were loaded and cached
     * @returns {Number}
     */
    areLabelsLoaded: function() {
        return this.labels.length;
    }
};
