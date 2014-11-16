var BaseGenerator = {
    orm: null,
    model: null,
    data: null,
    generate: function () {
        this.orm.models[this.model].destroy((function () {
            this.data.forEach(function (item) {
                    this.orm.models[this.model].create(item, (function (err, object) {
                        console.log('add %s %s', this.model, JSON.stringify(object));
                    }).bind(this));
                }, this);
        }).bind(this));
    }
};

function LabelsGenerator(orm) {
    this.orm = orm;
    this.model = 'label';
    this.data = [
        { name: 'archive', color: '' },
        { name: 'text', color: '' },
        { name: 'deps.js', color: '' },
        { name: 'asktheteam', color: '' }
    ];
}

LabelsGenerator.prototype = Object.create(BaseGenerator);
exports.LabelsGenerator = LabelsGenerator;

function UsersGenerator(orm) {
    this.orm = orm;
    this.model = 'user';
    this.data = [
        {
            login: 'octocat',
            id: 1,
            avatar_url: 'https://github.com/images/error/octocat_happy.gif',
            name: 'monalisa octocat',
            email: 'octocat@github.com'
        }
    ];
}

UsersGenerator.prototype = Object.create(BaseGenerator);
exports.UsersGenerator = UsersGenerator;

function IssuesGenerator(orm) {
    this.orm = orm;
    this.model = 'issue';
    this.data = [
        {
            number: 1,
            title: 'First post',
            user: 1,
            comments: 1,
            created_at: '2014-07-25T10:55:41Z',
            updated_at: '2014-07-26T12:25:59Z',
            body: 'The content of the archive post'
        },
        {
            number: 2,
            title: 'Second post',
            user: 1,
            comments: 4,
            created_at: '2014-07-24T21:09:27Z',
            updated_at: '2014-07-29T07:39:34Z',
            body: 'The content of the another archive post'
        }
    ];
}

IssuesGenerator.prototype = Object.create(BaseGenerator);
exports.IssuesGenerator = IssuesGenerator;

function CommentsGenerator(orm) {
    this.orm = orm;
    this.model = 'comment';
    this.data = [
        {
            number: 1,
            user: 1,
            body: '<p>Два дня до окончательного закрытия проекта Я.ру. МЕСТО СБОРА \'потерявшихся\' ярушников в ЖЖ:<em> <a href=\'http://otrageniya.livejournal.com/\'>http://otrageniya.livejournal.com/</a></em>  До встречи в новом доме!</p>'
        },
        {
            number: 2,
            user: 1,
            body: 'да, на текущий момент другого способа, к сожалению, нет.<br/><br/>в идеале необходимо научить все технологии нормально работать с depsByTech, но у нас в обозримом будущем не предвидятся ресурсы на это <ya-smile text=\:(\' code=\'3\' theme=\'default\'/>'
        }
    ];
}

CommentsGenerator.prototype = Object.create(BaseGenerator);
exports.CommentsGenerator = CommentsGenerator;
