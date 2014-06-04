modules.define('comments', ['i-bem__dom', 'jquery'], function(provide, BEMDOM, $) {
    provide(BEMDOM.decl(this.name, {
        onSetMod: {
            js: {
                inited: function() {

                    var addForm = this.findBlockInside(this.elem('add-form'), 'form');

                    addForm.on('submit', this._addComments, this);

                    this.on('show', this._showComments);
                    this.on('close', this._closeComments);
                }
            }
        },

        _addComments: function(e, data) {
            var _this = this;

            data.push({ name: 'number', value: _this.params.id });

            $.ajax({
                dataType: 'html',
                type: 'POST',
                data: data,
                url: '/issues/' + _this.params.id + '/comments'
            }).done(function(html) {
                _this._render(html, 'append', 'wrap');
            });
        },

        _closeComments: function() {
            this.setMod('hidden', true);
        },

        _showComments: function() {
            var _this = this;

            if(_this.params.comments === 0) {
                _this._isHidden() && _this.delMod('hidden');

                return this;
            }

            _this.
                _getComments(_this.params.id)
                .done(function(html) {
                    _this._render(html, 'prepend');
                });
        },

        _getComments: function(id) {
            return $.ajax({
                dataType: 'html',
                url: '/issues/' + id + '/comments?__mode=content'
            })
        },

        _render: function(html, addMethod, elem) {

            var container = (elem && this.elem(elem)) || this.domElem;

            BEMDOM[addMethod](container, html);

            this._isHidden() && this.delMod('hidden');
        },

        _isHidden: function() {
            return this.hasMod('hidden');
        }

    }));
});
