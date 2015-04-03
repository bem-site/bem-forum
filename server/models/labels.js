var inherits = require('util').inherits,
    baseModel = require('server/models/base.js');



function Labels() {
    this.init();
}

Labels.prototype.init = function () {
    this.data = {};

    return this.get();
}

Labels.prototype.get = function () {
    return this.github.getLabels(null, {
        per_page: 100
    });
}

module.exports = Labels;
