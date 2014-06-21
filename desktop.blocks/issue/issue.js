modules.define('issue', ['i-bem__dom', 'jquery'], function(provide, BEMDOM, $) {
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
            this._setSwitcherCount();
            this._subscribes();

            if(this._comments && this._switcher) {
                this._toggleComments();
            }
        },

        _findElems: function() {
            this._comments = this.findBlockInside('comments');
            this._switcher = this.findBlockInside('comments-switcher', 'button');
            this._spin = this.findBlockInside('spin', 'spin');

            return this;
        },

        _setSwitcherCount: function() {
            this._comments.on('comment:add', function(e, data) {
                this._switcher.setText('Ответов: ' + data.comments);
            }, this);

            this._comments.on('comment:delete', function(e, data) {
                var count = data.comments,
                    text = 'Ответов: ' + count;

                if(count < 1) {
                    text = 'Ответить'
                }

                this._switcher.setText(text);
            }, this);
        },

        _subscribes: function() {
            this._comments.on('comments:loading', this._toggleLoadersUi, this);
            this._comments.on('comments:complete', this._toggleLoadersUi, this);

            this._subscribeOwnerActions();

            this.bindTo('label', 'click', this._onClickLabel);

            return this;
        },

        _subscribeOwnerActions: function() {
            this.bindTo(this.findElem('edit'), 'click', this._onClickEdit);
            this.bindTo(this.findElem('remove'), 'click', this._onClickRemove);
        },

        _onClickLabel: function(e) {
            e.preventDefault();

            this.emit('issue:label', { label: $(e.target).text() });
        },

        _onClickRemove: function(e) {
            e.preventDefault();

            this._toggleStartAnimateRemove();

            if(window.confirm('Вы уверены?')) {
                var _this = this;

                $.ajax({
                    dataType: 'html',
                    type: 'PUT',
                    data: [{ name: 'state', value: 'closed' }, { name: 'number', value: _this.params.number }],
                    url: '/issues/' + _this.params.id + '?__mode=json'
                }).done(function() {
                    _this._endAnimateRemove();

                    BEMDOM.destruct(_this.domElem);
                });
            } else {
                this._toggleStartAnimateRemove();
            }
        },

        _toggleStartAnimateRemove: function() {
            this.toggleMod('remove-animate', 'start');
        },

        _endAnimateRemove: function() {
            this.setMod('remove-animate', 'end');
        },

        _toggleEditBody: function(body) {
            this._formEdit.on('toggle', function() {
                this.toggleMod(body, 'visibility', 'hidden', '', !this._formEdit.hasMod('visibility', 'hidden'));
            }, this);
        },

        _onClickEdit: function(e) {
            e.preventDefault();

            this._formEdit = this.findBlockInside('edit-form', 'form');
            this._editLabels = this.findBlockInside('edit-labels', 'forum-labels');

            this._editLabels.getLabels(this.params.labels);

            var body = this.findElem('body');
            this.setMod(body, 'visibility', 'hidden') && this._toggleEditBody(body);

            this._formEdit.toggle();
            this._setFormEditHeight();
            this._formEdit.on('submit', this._onSubmitEdit, this);
        },

        _onSubmitEdit: function(e, data) {
            if(this._formEdit.isEmptyInput('title', 'Заголовок не может быть пустым')) {
                return false;
            }

            if (this._formEdit.isEmptyCheckbox('labels[]', 'Выберете один из лейблов')) {
                return false;
            }

            var _this = this;

            this._formEdit.setMod('processing', 'yes');

            data.push({ name: 'number', value: this.params.number });

            $.ajax({
                dataType: 'html',
                type: 'PUT',
                data: data,
                url: '/issues/' + _this.params.number + '?__mode=content'
            }).done(function(html) {
                _this._render(html);

                _this._afterEdit();
            });
        },

        _render: function(html) {
            BEMDOM.update(this.domElem, html);
        },

        _afterEdit: function() {
            this._formEdit
                .delMod('processing')
                .toggle();

            this._init();
        },

        _setFormEditHeight: function() {
            var height = this.findElem('body').outerHeight();

            this.findElem('edit-textarea').height(height);
        },

        _toggleLoadersUi: function() {
            this._spin.toggleMod('progress', true, '');
            this._switcher.toggleMod('disabled', true, '');
        },

        _toggleComments: function() {
            this._switcher.on('click', function() {
                this._comments.emit(this._switcher.hasMod('checked', true) ? 'show' : 'close');
            }, this);
        }
    }));
});
