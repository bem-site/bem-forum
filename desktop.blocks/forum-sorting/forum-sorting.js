modules.define(
    'forum-sorting',
    ['i-bem__dom', 'location'],
    function(provide, BEMDOM, location) {

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

            location.change({ params: { sort: sort, direction: dir }, forceParams: true});
        }
    }));
});
