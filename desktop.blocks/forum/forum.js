modules.define('forum', ['i-bem__dom', 'jquery'], function(provide, BEMDOM, $) {
    provide(BEMDOM.decl(this.name, {
        onSetMod: {
            js: {
                inited: function() {
                    this._subscribes();
                }
            }
        },

        _subscribes: function() {
            this._formAdd = this.findBlockInside('add-form', 'forum-form');
            this._formAdd && this._formAdd.on('submit', this._addIssue, this);
            this._forumUrl = this._formAdd.params.forumUrl;
            this.findBlockInside('add', 'button') && this.findBlockInside('add', 'button').on('click', this._toggleFormAdd, this);
        },

        _addIssue: function(e, data) {
            if(this._formAdd.isEmptyInput('title', 'Заголовок не может быть пустым')) {
                return false;
            }

            if (this._formAdd.isEmptyCheckbox('labels[]', 'Выберете один из лейблов')) {
                return false;
            }

            this._formAdd.setMod('processing', 'yes');

            var labels = data
                .filter(function(item) {
                    return item.name === 'labels[]';
                })
                .map(function(label) {
                    return label.value;
                });

            $.ajax({
                dataType: 'html',
                type: 'POST',
                data: data,
                url: this._forumUrl + 'issues/?__mode=json',
                context: this
            }).done(function(json) {
                this._addLabelsAfter(JSON.parse(json), labels);
            });
        },

        _addLabelsAfter: function(result, labels) {
            var data = {
                number: result.number,
                title: result.title,
                body: result.body,
                labels: labels
            };

            $.ajax({
                dataType: 'html',
                type: 'PUT',
                data: data,
                url: this._forumUrl + 'issues/' + result.number + '/?__access=owner',
                context: this
            }).done(function(html) {
                this._render(html, 'prepend');

                this._afterAdd();
            });
        },

        _afterAdd: function() {
            this._formAdd
                .delMod('processing')
                .toggle();
        },

        _toggleFormAdd: function() {
            this.findBlockInside('labels', 'forum-labels').getLabels();

            this._formAdd.toggle();
        },

        _render: function(html, addMethod) {
            var container = this.findBlockInside('forum-issues').domElem;

            BEMDOM[addMethod](container, html);
        }
    }));
});
