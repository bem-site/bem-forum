var Base = require('./base'),
    ORM = function(options) {
        this.init(options);
    },
    Waterline = require('waterline'),
    waterLine = new Waterline();

var user = require('../models/user');
var issue = require('../models/issue');

var adapters = {
    'disk': require('sails-disk')
}

ORM.prototype = Object.create(Base.prototype);
ORM.prototype.init = function(options) {

    var adapterName = options.connection.adapter;
    var waterLineConfig = {
        adapters: {},
        connections: {
           'default': options.connection
        }
    };

    waterLineConfig.adapters[adapterName] = adapters[adapterName];

    waterLine.loadCollection(Waterline.Collection.extend(user));
    waterLine.loadCollection(Waterline.Collection.extend(issue));

    waterLine.initialize(waterLineConfig, function(err, data) {
        if (err) {
            console.log(err);
            throw err;
        }
        ORM.models = data.collections;
        ORM.connections = data.connections;
    });
};

ORM.prototype.getIssues = function(options) {
    ORM.models.issues.find().exec(function(err, models) {
        if(err){
            throw err;
        }
        return models;
    });
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
