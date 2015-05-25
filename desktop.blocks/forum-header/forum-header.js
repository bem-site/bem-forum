modules.define('forum-header', ['i-bem__dom', 'events__channels'], function (provide, BEMDOM, channels) {
    provide(BEMDOM.decl(this.name, {
        onSetMod: {
            js: {
                inited: function () {
                    channels('forum-issues').on('archive', this._onArchive, this);
                }
            }
        },

        _onArchive: function () {
            this.setMod(this.elem('archive'), 'show', true);
        }
    }));
});
