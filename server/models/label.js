module.exports = {
    identity: 'label',
    connection: 'default',

    attributes: {
        name: 'string',
        issues: {
            collection: 'issue',
            via: 'labels'
        },
        color: 'string'
    }
};
