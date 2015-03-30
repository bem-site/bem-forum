modules.define('forum', ['i-bem__dom', 'jquery'], function (provide, BEMDOM, $) {
    provide(BEMDOM.decl(this.name, {
        onSetMod: {
            js: {
                inited: function () {
                    if (this.params.global) this._setGlobalParams();

                    this._formAdd = this.findBlockInside('add-form', 'forum-form');

                    if (this._formAdd) {
                        this._formAdd.on('submit', this._addIssue, this);
                        this._forumUrl = this._formAdd.params.forumUrl;
                    }

                    var addButton = this.findBlockInside('add', 'button');
                    addButton && addButton.on('click', this._toggleFormAdd, this);
                }
            }
        },

        _setGlobalParams: function () {
            window.forum = this.params.global;
        },

        _addIssue: function (e, data) {
            if (this._formAdd.isEmptyRequiredField('title', 'labels[]')) return false;

            this._formAdd.showProcessing();

            var labels = data
                .filter(function (item) {
                    return item.name === 'labels[]';
                })
                .map(function (label) {
                    return label.value;
                });

            $.ajax({
                dataType: 'html',
                type: 'POST',
                timeout: 10000,
                data: data,
                url: this._forumUrl + 'issues/?__mode=json',
                context: this
            }).done(function (json) {
                this._addLabelsAfter(JSON.parse(json), labels);
            }).fail(function (xhr) {
                alert('Не удалось добавить пост');
                this._formAdd.hideProcessing(true);
                window.forum.debug && console.log('issue add fail', xhr);
            });
        },

        _addLabelsAfter: function (result, labels) {
            var data = {
                number: result.number,
                title: result.title,
                body: result.body,
                labels: labels,
                _csrf: this.elemParams('add-form').csrf
            };

            $.ajax({
                dataType: 'html',
                type: 'PUT',
                data: data,
                url: this._forumUrl + 'issues/' + result.number + '/?__access=owner',
                context: this
            }).done(function (html) {
                this._render(html, 'prepend');
                this._afterAdd();
            });
        },

        _afterAdd: function () {
            this._formAdd
                .hideProcessing()
                .toggle();
        },

        _toggleFormAdd: function () {
            var labels = this.findBlockInside('labels', 'forum-labels');

            if (labels) {
                labels.getLabels();
            }

            this._formAdd.toggle();
        },

        _render: function (html, addMethod) {
            var container = this.findBlockInside('forum-issues').domElem;

            BEMDOM[addMethod](container, html);
        }
    }));
});
