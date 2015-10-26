![BEM:true](http://img.shields.io/badge/bem-true-yellow.svg?style=flat)

bem-forum
=========

[![David](https://img.shields.io/david/bem/bem-forum.svg)](https://david-dm.org/bem/bem-forum)
[![David](https://img.shields.io/david/dev/bem/bem-forum.svg)](https://david-dm.org/bem/bem-forum#info=devDependencies)

Форум построен на БЭМ-методологии и использует github issues в качестве основного хранилища.

Форум можно использовать в 2-х режимах:

* как отдельное приложение;
* как плагин к приложению, построенному на express, c использованием BEMTREE и BEMHTML-шаблонов.

### Установка

* Клонировать репозиторий: `git clone git@github.com:bem/bem-forum.git`
* Перейти в папку со скаченным проектом: `cd bem-forum`
* Установить зависимости `npm run build`
* Сгенерировать [токен](https://help.github.com/articles/creating-an-access-token-for-command-line-use/) (выбрать scope – public_repo) и вставить его в конфиг `configs/common/node.json`
* Запустить проект `npm start`

В браузере перейти по адресу: `http://localhost:3000`.

### Конфигурация

Конфигурация проекта описывается в следующих файлах:

* `configs/common/node.json` - общая конфигурация для всех окружений;
* `configs/development/node.json` - конфигурация для режима разработки;
* `configs/production/node.json` - конфигурация для production-режима.

#### Общая конфигурация

```
{
    "forum": {
        "auth": {
            "tokens": [
                /* Для получения данных с гитхаба для неавторизованных пользователей
                 * используются сгенерированные токены, которые увеличивают лимит обращений к API
                 * c 60 запросов в час до 5000. В случае высокой активности на форуме,
                 * нужно добавить дополнительные токены.
                 */
                "7fdffdd7a38fd8a205fdf5fc910f35d3bfd05341" // данный токен только для демонстрации
            ]
        },
        /* Чтобы добавлять метки (labels), нужно добавить токен, который имеет права на git push
         * в репозиторий, в который добавляется пост
         */
        "owner_token": "98af04fdb993cee3fdc83e338f3dfd74dff5fdeb", // данный токен только для демонстрации
        /* Возможность отобразить/скрыть метки в форме добавления/редактирования поста(issue) */
        "labelsRequired": true,
        /* Репозиторий, который будет использоваться для хранения постов */
        "storage": {
            "user": "tavriaforever",
            "repo": "bem-forum-tests"
        },
        /* Возможность загружать архив форума с файловой системы */
        "archive": "archive-example.json",
        /* Точное указание пути до собранного бандла с шаблонами и скриптами */
        "template": {
            "level": "desktop",
            "bundle": "index"
        },
        // Включает режим отладки ошибок серверного и клиентского кода
        // Чтобы увидеть в браузерной консоли ошибки, добавьте к адресу
        // параметр ?debug=true
        "forumDebug": true
    }
}
```

#### Конфигурация окружения

`configs/{environment}/node.json` позволяют указать параметры для Oauth-авторизации через Github:

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

Здесь предусмотрена возможность существования нескольких поддоменов для сайта в случае, например, наличия нескольких локалей:

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

### p.s. Важно о метках

Стандартное поведение из «коробки» – указать метку (label) при создании/редактировании поста *нельзя*

**Чтобы добавить возможность устанавливать метки для постов:**

1) Открыть общий конфиг `config/common/node.json`

2) Зарегистрировать в своем профиле на гитхабе токен с правами на push в репозиторий, где хранятся посты(issues) и вставить полученный токен в поле `owner_token`

3) Чтобы в формах добавления/редактирования появились лейблы, установите поле `labelsRequired` в значение `true`
