Russian version of readme is available [here](https://github.com/bem/bem-forum/blob/master/README.ru.md).

bem-forum
=========

[![David](https://img.shields.io/david/bem/bem-forum.svg)](https://david-dm.org/bem/bem-forum)
[![David](https://img.shields.io/david/dev/bem/bem-forum.svg)](https://david-dm.org/bem/bem-forum#info=devDependencies)

BEM forum project is built according to BEM methodology and uses github issues as it's main data storage.
 
Forum could be used in two capacities:

* as a separate application;
* as a plugin to an application built on express with the use of BEMTREE and BEMHTML templates.

### Installation

* Clone a repository `git clone git@github.com:bem/bem-forum.git`
* Go to downloaded project `cd bem-forum`
* Install dependencies `npm run deps`
* Generate [access token](https://help.github.com/articles/creating-an-access-token-for-command-line-use/) (choose scope – public_repo) and add it to config `configs/common/node.json`
* Launch the project `npm start`

In the browser go to `http://localhost:3000`.

### Configuration

The description of how to configure the project could be found within the following files:

* `configs/common/node.json` - common configuration for any type of environment;
* `configs/development/node.json` - development regime configuration;
* `configs/production/node.json` - production regime configuration.

#### Common configuration

```
{
    "forum": {
        "auth": {
            "tokens": [
                /* To get data from github for unauthorized users
                 * use generated tokens that enlarge limits of calls to API
                 * from 60 per hour to 5000. In case of high activity on the forum 
                 * you will need to add additional tokens.
                 */
                "7fdffdd7a38fd8a205fdf5fc910f35d3bfd05341" // This is a demonstration only token
            ]
        },
        /* To add labels you will need to add a token that has rights to git push
         * in to a repository the post will be added to
         */
        "owner_token": "98af04fdb993cee3fdc83e338f3dfd74dff5fdeb", // This is a demonstration only token
        /* An option to show or hide labels within the opening/editing form of the issue */
        "setLabels": true,
        /* A repository to store posts */
        "storage": {
            "user": "tavriaforever",
            "repo": "bem-forum-tests"
        },
        /* An option to upload forum's archive from a file system */
        "archive": "archive-example.json",
        /* Exact way to build bundle with templates and scripts notation */
        "template": {
            "level": "desktop",
            "bundle": "index"
        },
        // Enables a regime to fix bugs in server-side and client-side code
        // To see bugs within a broswer console you will need to add to the url 
        // a parameter ?debug=true
        "forumDebug": true
    }
}
```

#### Environment configuration

`configs/{environment}/node.json` allow to specify parameters for Oauth-authorization via Github:

```
"forum": {
    "oauth": {
        "localhost": {
            "clientId": "your client id",
            "secret": "your secret key",
            "redirectUrl": "http://localhost:3000"
        }
    }
}
```

Here we foresee an option of several subdomains support for sites with, for instance, several locales:

```
"forum": {
    "oauth": {
        "localhost": {
            ...
        },
        "en.localhost": {
            ...
        },
        "ru.localhost": {
            ...
        }
    }
}
```

### Important about labels

Standard behaviour so to say "battaries included" is the following: it is *not allowed* to set a label while opening or editing the post. 

**To add an option of labeling the posts you need:**

1) To open a common config `config/common/node.json`

2) To register within your own profile on github a token with rights to push into a repository where issues are hosted and paste this token into `owner_token` field

3) To enable labels within opening/editing posts forms set `setLabels` field as `true`
