modules.define('forum-header', ['i-bem__dom', 'jquery'], function(provide, BEMDOM, $) {
    provide(BEMDOM.decl({ block: this.name, modName: 'view', modVal: 'auth' }, {
        onSetMod: {
            js: {
                inited: function() {
                    this._showUser();
                }
            }
        },

        _showUser: function() {
            var _this = this;

            this._getUser().done(function(html) {
                _this._render(html);
            });
        },

        _getUser: function() {
            return $.ajax({
                dataType: 'html',
                url: '/user',
                type: 'GET'
            });
        },

        _render: function(html) {
            BEMDOM.append(this.elem('user-wrapper'), html);
        }
    }))
});
