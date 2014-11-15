var Base = require('./base'),
    ORM = function(options) {
        this.init(options);
    },
    Waterline = require('waterline'),
    waterLine = new Waterline(),
    vow = require('vow');

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

/**
 * Returns authentificated user
 * @param options - {Object} with fields:
 * @param options.token {String} oauth user token
 * @returns {*}
 */
ORM.prototype.getAuthUser = function(options) {
    var def = vow.defer();
    ORM.models.user.findOne({ id: options.id }, function(err, model) {
        err ? def.reject(err) : def.resolve(model);
    });
    return def.promise();
};

/**
 * Create authentificated user
 * @param options - {Object} with fields:
 * @param options.token {String} oauth user token
 * @returns {*}
 */
ORM.prototype.createAuthUser = function(options) {
    var def = vow.defer();
    ORM.models.user.create(options, function(err, model) {
        err ? def.reject(err) : def.resolve(model);
    });
    return def.promise();
};

/**
 * Edit authentificated user
 * @param options - {Object} with fields:
 * @param options.token {String} oauth user token
 * @returns {*}
 */
ORM.prototype.editAuthUser = function(options) {
    var def = vow.defer();
    ORM.models.user.update({ token: options.token }, options, function(err, model) {
        err ? def.reject(err) : def.resolve(model);
    });
    return def.promise();
};

ORM.prototype.getRepoInfo = function(options) {
    //TODO It should be implemented
};

module.exports = ORM;
