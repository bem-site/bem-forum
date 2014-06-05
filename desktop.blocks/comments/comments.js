modules.define('comments', ['i-bem__dom', 'jquery'], function(provide, BEMDOM, $) {
    provide(BEMDOM.decl(this.name, {
        onSetMod: {
            js: {
                inited: function() {

                    this.on('show', this._showComments);

                    this.on('close', this._closeComments);

                    var form = this.findBlockInside(this.elem('add-form'), 'form');

                    if(form) {
                        form.on('submit', this._addComments, this);
                    }

                    this._spin = this.findBlockInside('spin');
                    this._button =  this.findBlockInside(this.elem('add-button'), 'button');
                }
            }
        },

        _addComments: function(e, data) {
            var _this = this;

            this._spin.setMod('progress', true);
            this._button.setMod('disabled', true);

            data.push({ name: 'number', value: _this.params.id });

            $.ajax({
                dataType: 'html',
                type: 'POST',
                data: data,
                url: '/issues/' + _this.params.id + '/comments'
            }).done(function(html) {
                _this._render(html, 'append', 'wrap');

                _this.params.comments += 1;

                _this.emit('comment:add', { comments: _this.params.comments });

                _this._spin.delMod('progress');
                _this._button.delMod('disabled');
            });
        },

        _closeComments: function() {
            this.setMod('hidden', true);
        },

        _showComments: function() {
            var _this = this;

            if(this.params.comments === 0) {
                this._isHidden() && this.delMod('hidden');
            }

            this.emit('comments:loading');

            this.
                _getComments(this.params.id)
                .done(function(html) {
                    _this._render(html, 'update', 'wrap');

                    _this.emit('comments:complete');
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
