modules.define(
    'forum-sorting',
    ['i-bem__dom', 'location', 'cookie'],
    function(provide, BEMDOM, location, cookie) {

    provide(BEMDOM.decl(this.name, {
        onSetMod: {
            js: {
                inited: function() {
                    this._select = this.findBlockInside('select');
                    this._select && this._select.on('change', this._onSelectChange, this);
                }
            }
        },

        _onSelectChange: function() {
            var val = this._select.getVal(),
                dir = (val % 2) ? 'asc' : 'desc',
                sortNum = Math.floor(val / 2),
                sort = (sortNum === 0 ? 'created' : (sortNum === 1 ? 'comments' : 'updated') );

            cookie.set('forum_sorting', val, {expires: new Date(Date.now() + 60 * 60 * 1000)})

            location.change({ params: { sort: sort, direction: dir }, forceParams: true});
        }
    }));
});
