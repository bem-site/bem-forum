modules.define('forum', ['i-bem__dom', 'jquery', 'events__channels'], function(provide, BEMDOM, $, channels) {
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
            this.findBlockInside('add', 'button') && this.findBlockInside('add', 'button').on('click', this._toggleFormAdd, this);
        },

        _addIssue: function(e, data) {
            if(this._formAdd.isEmptyInput('title', 'Заголовок не может быть пустым')) {
                return false;
            }

            if (this._formAdd.isEmptyCheckbox('labels[]', 'Выберете один из лейблов')) {
                return false;
            }

            var _this = this;

            this._formAdd.setMod('processing', 'yes');

            $.ajax({
                dataType: 'html',
                type: 'POST',
                data: data,
                url: '/issues/'
            }).done(function(html) {
                _this._render(html, 'prepend');

                _this._afterAdd();
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
            var container = this.findBlockInside('forum-content').elem('container');

            BEMDOM[addMethod](container, html);
        }
    }));
});
