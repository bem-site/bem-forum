module.exports = {

    identity: "issue",
    connection: "default",

    attributes: {
        number: "integer",
        "title": "string",
        "user": {
            "login": "string",
            "avatar_url": "string"
        },
        //"labels": [
        //],
        "comments": "integer",
        "created_at": "string",
        "updated_at": "string",
        "body": "string"
    }
};


