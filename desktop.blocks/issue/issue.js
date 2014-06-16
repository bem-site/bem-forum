modules.define('issue', ['i-bem__dom', 'jquery'], function(provide, BEMDOM, $) {
    provide(BEMDOM.decl(this.name, {
        onSetMod: {
            js: {
                inited: function() {
                    this._findElems();

                    this._setSwitcherCount();

                    this._subscribes();

                    if(this._comments && this._switcher) {
                        this._toggleComments();
                    }
                }
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
            this._comments.on('comments:loading', function() {
                this._toggleLoadersUi();
            }, this);

            this._comments.on('comments:complete', function() {
                this._toggleLoadersUi();
            }, this);

            this.findBlockInside('edit', 'link').on('click', this._onClickEdit, this);
            this.findBlockInside('remove', 'link').on('click', this._onClickRemove, this);

            return this;
        },

        _onClickRemove: function(e) {
            if(window.confirm('Вы уверены?')) {
                e.preventDefault();

                var _this = this;

                $.ajax({
                    dataType: 'html',
                    type: 'PUT',
                    data: [{ name: 'state', value: 'closed' }, { name: 'number', value: _this.params.number }],
                    url: '/issues/' + _this.params.number + '?__mode=json'
                }).done(function() {
                    BEMDOM.destruct(_this.domElem);
                });
            }
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
