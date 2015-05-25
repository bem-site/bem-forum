modules.define(
    'forum-labels',
    ['jquery', 'events__channels', 'next-tick', 'location'],
    function (provide, $, channels, nextTick, location, Labels) {

    provide(Labels.decl({ modName: 'view', modVal: 'menu' }, {

        onSetMod: {
            js: {
                inited: function () {
                    this._labels = [];
                    this._getMenu();
                    this._checkedLabelsByUri();
                    channels('filter').on('labels', this._checkedLabelByFilter, this);
                    channels('filter').on('labels:clear', this._clearLabels, this);
                }
            }
        },

        _clearLabels: function () {
            this._menu.getItems().forEach(function (menuItem) {
                menuItem.delMod('checked');
            });

            return this;
        },

        _getMenu: function () {
            this._menu = this.findBlockInside('labels', 'menu');
            this._menu && this._menu.on('item-click', this._checkedLabelsByFilter, this);

            return this;
        },

        _checkedLabelsByFilter: function (e, item) {
            var _this = this,
                val = item.item.getVal(),
                position = this._labels.indexOf(val);

            if (position === -1) {
                this._labels.push(val);
            } else {
                this._labels.splice(position, 1);
            }

            nextTick(function () { _this._checkedLabels(true) });

            return this;
        },

        _checkedLabelByFilter: function (e, data) {
            this._labels = data.labels;
            this._checkedLabels(true);
            return this;
        },

        _checkedLabels: function (needLocationChange) {
            var _this = this;

            this._menu.getItems().forEach(function (menuItem) {
                menuItem.delMod('checked');

                _this._labels.forEach(function (label) {
                    if (label === menuItem.getVal()) {
                        menuItem.setMod('checked', true);
                    }
                });
            });

            needLocationChange && location.change({ params: this._getParams() });

            return this;
        },

        _getParams: function () {
            var uri = location.getUri(),
                query = uri.queryParams,
                params = {};

            Object.keys(query).forEach(function (key) {
                if (key === 'page') {
                    params[key] = (+query[key] < 0) ? -1 : 1;
                    return false;
                }

                params[key] = query[key][0];
            });

            params.labels = this._labels.join(',');

            return params;
        },

        _checkedLabelsByUri: function () {
            var uri = location.getUri(),
                query = uri.queryParams,
                queryLabels = query.labels;

            if (queryLabels && queryLabels[0]) {
                this._labels = queryLabels[0].split(',');
                this._checkedLabels();
            }

            return this;
        }
    }));
});
