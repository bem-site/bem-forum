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
