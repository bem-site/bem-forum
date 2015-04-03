var github = require('github');

module.exports = BaseModel = function () {
    this.data = {};
    this.init();
};

BaseModel.prototype = {
    init: function () {
        return this.gitHub = github.init();
    },

    getGithub: function () {
        return this.gitHub;
    }
};
