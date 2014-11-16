module.exports = {
    identity: 'comment',
    connection: 'default',

    attributes: {
        number: 'integer',
        owner:{
            model:'user'
        },
        created_at: 'string',
        updated_at: 'string',
        body: 'string'
    }
};
