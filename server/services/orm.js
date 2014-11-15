var vow = require('vow'),
    Base = require('./base'),
    ORM = function(options) {
        this.init(options);
    },
    Waterline = require('waterline'),
    waterLine = new Waterline(),

    DEFAULT = {
        page: 1,
        limit: 30,
        sort: {
            field: 'updated',
            direction: 'desc'
        }
    };

var user = require('../models/user');
var issue = require('../models/issue');

var adapters = {
    'disk': require('sails-disk')
};

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
    options.limit = options.per_page;

    var def = vow.defer();
    ORM.models.issues.find().paginate(options).exec(function(err, models) {
        err ? def.reject() : def.resolve(models);
    });
    return def.promise();
};

ORM.prototype.getIssue = function(options) {
    var def = vow.defer();
    ORM.models.issues.find({ number: options.number }).exec(function(err, model) {
        err ? def.reject() : def.resolve(model);
    });
    return def.promise();
};

ORM.prototype.createIssue = function(options) {
    var def = vow.defer();
    ORM.models.issues.create(options, function(err, object) {
        err ? def.reject() : def.resolve(object);
    });
    return def.promise();
};

ORM.prototype.editIssue = function(options) {
    var def = vow.defer();
    ORM.models.issues.update({ number: options.number }, options, function(err, object) {
        err ? def.reject() : def.resolve(object);
    });
    return def.promise();
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
