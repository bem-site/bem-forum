module.exports = {
    identity: 'comment',
    connection: 'default',
    autoCreatedAt: false,
    autoUpdatedAt: false,

    attributes: {
        number: 'integer',
        user:{
            model:'user'
        },
        created_at: 'datetime',
        updated_at: 'datetime',
        body: 'string'
    }
};
