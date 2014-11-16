module.exports = {

    identity: 'issue',
    connection: 'default',

    attributes: {
        number: 'integer',
        title: 'string',
        user:{
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
    }//,

    //afterCreate: function (record, cb) {
    //    console.log('record');
    //}
};
