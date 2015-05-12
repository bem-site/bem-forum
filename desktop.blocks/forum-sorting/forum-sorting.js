modules.define(
    'forum-sorting',
    ['i-bem__dom', 'location', 'objects'],
    function (provide, BEMDOM, location, objects) {

    provide(BEMDOM.decl(this.name, {
        onSetMod: {
            js: {
                inited: function () {
                    this._select = this.findBlockInside('select');
                    this._select && this._select.on('change', this._onSelectChange, this);
                }
            }
        },

        _onSelectChange: function () {
            var val = this._select.getVal(),
                dir = (val % 2) ? 'asc' : 'desc',
                sortNum = Math.floor(val / 2),
                sort = (sortNum === 0 ? 'created' : (sortNum === 1 ? 'comments' : 'updated'));

            location.change({ params: this._getParams(sort, dir) });
        },

        _getParams: function (sort, dir) {
            var uri = location.getUri(),
                query = uri.queryParams,
                params = {};

            Object.keys(query).forEach(function (key) {
                params[key] = query[key][0];
            });

            return objects.extend(params, { sort: sort, direction: dir });
        }
    }));
});
