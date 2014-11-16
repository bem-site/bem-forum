module.exports = {

    identity: 'issue',
    connection: 'default',

    attributes: {
        number: 'integer',
        title: 'string',
        owner:{
            model:'user'
        },
        labels: {
            collection: 'label',
            via: 'issues',
            dominant: true
        },
        comments: 'integer',
        created_at: 'string',
        updated_at: 'string',
        body: 'string'
    }
};
