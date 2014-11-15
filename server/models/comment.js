module.exports = {

    identity: 'comment',
    connection: 'default',

    attributes: {
        number: 'integer',
        user: {
            login: 'string',
            avatar_url: 'string'
        },
        "created_at": 'string',
        "updated_at": 'string',
        "body": 'string'
    }
};
