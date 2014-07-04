modules.define('forum-labels', ['jquery', 'events__channels', 'next-tick'], function(provide, $, channels, nextTick, LABELS) {

    provide(LABELS.decl({ modName: 'view', modVal: 'menu' }, {

        onSetMod: {
            js: {
                inited: function() {
                    this._labels = [];

                    this._getMenu();

                    channels('filter').on('labels', this._checkedLabelByFilter, this);
                    channels('filter').on('labels:clear', this._clearLabels, this);
                }
            }
        },

        _clearLabels: function(e) {
            this._menu._getItems().forEach(function(menuItem) {
                menuItem.delMod('checked');
            });
        },

        _getMenu: function() {
            this._menu = this.findBlockInside('labels', 'menu');
            this._menu && this._menu.on('item-click', this._checkedLabelsByFilter, this);
        },

        _checkedLabelsByFilter: function(e, item) {
            var _this = this,
                val = item.getVal(),
                position = this._labels.indexOf(val);

            if(position === -1) {
                this._labels.push(val);
            } else {
                this._labels.splice(position, 1);
            }

            nextTick(function() { _this._checkedLabels() });
        },

        _checkedLabelByFilter: function(e, data) {
            this._labels = data.labels;

            this._checkedLabels();

            return this;
        },

        _checkedLabels: function() {
            var _this = this;

            this._menu._getItems().forEach(function(menuItem) {
                menuItem.delMod('checked');

                _this._labels.forEach(function(label) {
                    if(label === menuItem.getVal()) {
                        menuItem.setMod('checked', true);
                    }
                });
            });

            channels('load').emit('issues', { labels: _this._labels });

            return this;
        }
    }));
});
