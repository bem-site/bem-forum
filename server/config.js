/**
 * Module for reading and merging of configs for app forum
 *
 * Join the configs of the two directories:
 * common + folder with config files relative to the current environment (development || production)
 *
 * 1. common/node.json - contains general not secret settings that are common to all environments
 * 2. common/credentials.json - contains secret settings that are common to all environments
 * 3. {ENV}/credentials.json - contains secret settings that are relevant only for the current environment
 */

var nconf = require('nconf'),
    path = require('path'),
    configsDir = path.resolve(process.cwd(), 'configs');

nconf
    .argv()
    .env()
    .add('common', { type: 'file', file: path.resolve(configsDir, 'common/node.json') })
    .add('credentials_common', { type: 'file', file: path.resolve(configsDir, 'common/credentials.json') })
    .add('current', { type: 'file', file: path.resolve(configsDir, 'current/node.json') })
    .add('credentials_current', { type: 'file', file: path.resolve(configsDir, 'current/credentials.json') });

module.exports = nconf;
