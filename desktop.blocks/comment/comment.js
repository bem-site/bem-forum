modules.define('comment', ['i-bem__dom', 'jquery'], function(provide, BEMDOM, $) {
    provide(BEMDOM.decl(this.name, {

        _onSubmitEdit: function(e, data) {

            if(this._formEdit.isEmptyInput('body')) {
                return false;
            }

            var _this = this;

            this._spin = this.findBlockInside('spin');
            this._button =  this.findBlockInside(this.elem('edit-button'), 'button');

            this._beforeEdit();

            data.push({ name: 'id', value: this.params.id });

            $.ajax({
                dataType: 'html',
                type: 'PUT',
                data: data,
                url: '/issues/' + _this.params.issueNumber + '/comments/' + _this.params.id + '?__mode=content'
            }).done(function(html) {
                _this._render(html, 'update');

                _this._afterEdit();
            });
        },

        _beforeEdit: function() {
            this._spin.setMod('progress', true);
            this._button.setMod('disabled', true);
        },

        _afterEdit: function() {
            this._toggleFormEdit();

            this._spin.delMod('progress');
            this._button.delMod('disabled');
        },

        _render: function(html, type) {
            BEMDOM[type](this.domElem, html);
        },

        _toggleFormEdit: function() {
            var body = this.findElem('body');

            this._formEdit.toggleMod('visibility', 'hidden', '');
            this.toggleMod(body, 'visibility', 'hidden', '', !this._formEdit.hasMod('visibility', 'hidden'));
        },


        _onClickEditCancel: function(e) {
            e.preventDefault();

            this._toggleFormEdit();
        },

        _setFormEditHeight: function() {
            var height = this.findElem('body').outerHeight();

            this.findElem('edit-textarea').height(height);
        },

        _onClickEdit: function() {
            this._formEdit = this.findBlockInside(this.findElem('edit-form'), 'form');

            this._setFormEditHeight();

            this._toggleFormEdit();

            this._formEdit.on('submit', this._onSubmitEdit, this);

            this._buttonCancel = this.findBlockInside(this.findElem('edit-cancel'), 'button');
            this._buttonCancel.on('click', this._onClickEditCancel, this);
        },

        _onClickRemove: function() {
            var _this = this;

            if(window.confirm('Вы уверены?')) {
                $.ajax({
                    type: 'DELETE',
                    url: '/issues/' + _this.params.issueNumber + '/comments/' + _this.params.id
                }).done(function() {
                    _this.emit('comment:delete');

                    BEMDOM.destruct(_this.domElem);
                });
            }
        }
    }, {
        live: function() {
            this.liveBindTo('remove', 'click', function(e) {
                e.preventDefault();

                this._onClickRemove();
            });

            this.liveBindTo('edit', 'click', function(e) {
                e.preventDefault();

                this._onClickEdit();
            });
        }
    }));
});
