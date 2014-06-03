modules.define('comments', ['i-bem__dom', 'jquery'], function(provide, BEMDOM, $) {
    provide(BEMDOM.decl(this.name, {
        onSetMod: {
            js: {
                inited: function() {

                    if(this.params.comments > 0) {
                        this.on('show', this._showComments);
                        this.on('close', this._closeComments);
                    }
                }
            }
        },

        _closeComments: function() {
            this.setMod('hidden', true);
        },

        _showComments: function() {
            var _this = this;

            _this.
                _getComments(_this.params.id)
                .done(function(html) {
                    _this._render(html);
                });
        },

        _getComments: function(id) {
            return $.ajax({
                dataType: 'html',
                url: '/issues/' + id + '/comments?__mode=content'
            })
        },

        _render: function(html) {

            BEMDOM.update(this.domElem, html);

            this._isHidden() && this.delMod('hidden');
        },

        _isHidden: function() {
            return this.hasMod('hidden');
        }

    }));
});
