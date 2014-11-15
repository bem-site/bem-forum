var Base = require('./base'),
    ORM = function(options) {
        this.init(options);
    };

ORM.prototype = Object.create(Base.prototype);

ORM.prototype.init = function(options) {
    //TODO It should be implemented
};

ORM.prototype.getIssues = function(options) {
    //TODO It should be implemented
};

ORM.prototype.getIssue = function(options) {
    //TODO It should be implemented
};

ORM.prototype.createIssue = function(options) {
    //TODO It should be implemented
};

ORM.prototype.editIssue = function(options) {
    //TODO It should be implemented
};

ORM.prototype.getComments = function(options) {
    //TODO It should be implemented
};

ORM.prototype.createComment = function(options) {
    //TODO It should be implemented
};

ORM.prototype.editComment = function(options) {
    //TODO It should be implemented
};

ORM.prototype.deleteComment = function(options) {
    //TODO It should be implemented
};

ORM.prototype.getLabels = function(options) {
    //TODO It should be implemented
};

ORM.prototype.getAuthUser = function(options) {
    //TODO It should be implemented
};

ORM.prototype.getRepoInfo = function(options) {
    //TODO It should be implemented
};

module.exports = ORM;
