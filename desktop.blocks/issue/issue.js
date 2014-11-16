modules.define('issue', ['i-bem__dom', 'jquery', 'events__channels'], function(provide, BEMDOM, $, channels) {
    provide(BEMDOM.decl(this.name, {
        onSetMod: {
            js: {
                inited: function() {
                    this._reinit();
                }
            }
        },

        _reinit: function() {
            this._findElems();
            this._subscribes();

            if(this._comments) {
                this._setSwitcherCount();
                this._toggleComments();
            }
        },

        _findElems: function() {
            this._comments = this.findBlockInside('comments');
            this._switcher = this.findBlockInside('comments-switcher', 'button');
            // this._spin = this.findBlockInside('spin', 'spin');
            this._vote = this.findBlockInside('vote', 'button');

            return this;
        },

        _setSwitcherCount: function() {
            this._comments.on('comment:add', function(e, data) {
                this._switcher && this._switcher.setText('Ответов: ' + data.comments);
                this.emit('process', { enable : false });
                this.elem('rate').text(this.elemParams('rate').count + 1);
                this._vote && BEMDOM.destruct(this._vote.domElem);
            }, this);

            this._comments.on('comment:delete', function(e, data) {
                var count = data.comments,
                    text = 'Ответов: ' + count;

                if(count < 1) {
                    text = 'Ответить'
                }

                this._switcher && this._switcher.setText(text);
            }, this);
        },

        _subscribes: function() {
            if(this._comments) {
                this._comments.on('comments:loading', this._toggleLoadersUi, this);
                this._comments.on('comments:complete', this._toggleLoadersUi, this);
            }

            this._subscribeOwnerActions();

            this.bindTo('label', 'click', this._onClickLabel);

            this._vote && this._vote.on('click', function() {
                this._comments.emit('vote');
                this.emit('process', { enable : true });
            }, this);

            return this;
        },

        _subscribeOwnerActions: function() {
            this.bindTo(this.findElem('edit'), 'click', this._onClickEdit);
            this.bindTo(this.findElem('remove'), 'click', this._onClickRemove);
        },

        _onClickLabel: function(e) {
            e.preventDefault();

            channels('filter').emit('labels', { labels: [$(e.target).text()] });
        },

        _onClickRemove: function(e) {
            e.preventDefault();

            var params = this.params;

            this.setMod('animate-remove', true);

            if(window.confirm('Вы уверены?')) {
                $.ajax({
                    dataType: 'html',
                    type: 'PUT',
                    timeout: 10000,
                    data: {
                        state: 'closed',
                        number: params.number,
                        _csrf: params.csrf
                    },
                    url: params.forumUrl + 'issues/' + params.id + '/?__mode=json',
                    context: this
                }).done(function() {
                    BEMDOM.destruct(this.domElem);
                }).fail(function(xhr) {
                    alert('Не удалось удалить пост');
                    window.forum.debug && console.log('issue remove fail', xhr);
                }).always(function() {
                    this.delMod('animate-remove');
                });
            } else {
                this.delMod('animate-remove');
            }
        },

        _toggleEditBody: function(body) {
            this._formEdit.on('toggle', function() {
                this.toggleMod(body, 'visibility', 'hidden', '', !this._formEdit.hasMod('visibility', 'hidden'));
            }, this);
        },

        _onClickEdit: function(e) {
            e.preventDefault();

            this._formEdit = this.findBlockInside('edit-form', 'forum-form');
            this._editLabels = this.findBlockInside('edit-labels', 'forum-labels');

            if(this._editLabels) {
                this._editLabels.getLabels(this.params.labels);
            }

            var body = this.findElem('body');
            this.setMod(body, 'visibility', 'hidden') && this._toggleEditBody(body);

            this._formEdit.toggle();
            this._setFormEditHeight();
            this._formEdit.on('submit', this._onSubmitEdit, this);
        },

        _onSubmitEdit: function(e, data) {
            var params = this.params;

            if(this._formEdit.isEmptyInput('title', 'Заголовок не может быть пустым')) {
                return false;
            }

            if (params.labelsRequired && this._formEdit.isEmptyCheckbox('labels[]', 'Выберете один из лейблов')) {
                return false;
            }

            this._formEdit.setMod('processing', 'yes');

            data.push({ name: 'number', value: params.number });

            $.ajax({
                dataType: 'html',
                type: 'PUT',
                timeout: 10000,
                data: data,
                url: params.forumUrl + 'issues/' + params.number + '/?__access=owner',
                context: this
            }).done(function(html) {
                this._render(html);
                this._afterEdit();
            }).fail(function(xhr) {
                alert('Не удалось отредактировать пост');
                window.forum.debug && console.log('issue add fail', xhr);
            }).always(function() {
                this._formEdit.delMod('processing');
            });
        },

        _render: function(html) {
            BEMDOM.replace(this.domElem, html);
        },

        _afterEdit: function() {
            this._formEdit.toggle();

            this._reinit();
        },

        _setFormEditHeight: function() {
            var height = this.findElem('body').outerHeight();

            this.findElem('edit-textarea').height(height);
        },

        _toggleLoadersUi: function() {
            // this._spin.toggleMod('progress', true, '');
            // this._switcher.toggleMod('disabled', true, '');
        },

        _toggleComments: function() {
            this._switcher && this._switcher.on('click', function() {
                this._comments.emit(this._switcher.hasMod('checked', true) ? 'show' : 'close');
            }, this);
        }
    }));
});
