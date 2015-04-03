var vow = require('vow'),
    labels = require('./models/labels.js');

/**
 * Collect base data for init forum
 * Data:
 * - labels
 * @returns {*}
 */
module.exports = function () {
    return vow.all([

    ])
    .then(function (data) {

    })
    .fail(function (err) {
        console.error(err);
    });
};
