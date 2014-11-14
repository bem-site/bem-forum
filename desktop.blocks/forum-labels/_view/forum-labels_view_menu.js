modules.define(
    'forum-labels',
    ['jquery', 'events__channels', 'next-tick', 'location', 'objects'],
    function(provide, $, channels, nextTick, location, objects, Labels) {

    provide(Labels.decl({ modName: 'view', modVal: 'menu' }, {

        onSetMod: {
            js: {
                inited: function() {
                    this._labels = [];

                    this._getMenu();
                    this._setMenuOnLoad();

                    channels('filter').on('labels', this._checkedLabelByFilter, this);
                    channels('filter').on('labels:clear', this._clearLabels, this);
                }
            }
        },

        _clearLabels: function() {
            this._menu.getItems().forEach(function(menuItem) {
                menuItem.delMod('checked');
            });
        },

        _setMenuOnLoad: function () {
            //this._labels = location.getUri().getParams() && location.getUri().getParams().labels && location.getUri().getParams().labels[0].split(',');

            //console.log('labels', this._labels);

            //this._checkedLabels();
        },

        _getMenu: function() {
            this._menu = this.findBlockInside('labels', 'menu');
            this._menu && this._menu.on('item-click', this._checkedLabelsByFilter, this);
        },

        _checkedLabelsByFilter: function(e, item) {
            var _this = this,
                val = item.item.getVal(),
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

            this._menu.getItems().forEach(function(menuItem) {
                menuItem.delMod('checked');

                _this._labels.forEach(function(label) {
                    if(label === menuItem.getVal()) {
                        menuItem.setMod('checked', true);
                    }
                });
            });

            if(objects.isEmpty(this._labels)) {
                location.change({ forceParams: true });
            } else {
                location.change({ params: { labels: this._labels.join(',') }, forceParams: true });
            }
        }
    }));
});
