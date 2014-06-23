modules.define('forum-labels', ['jquery', 'events__channels', 'next-tick'], function(provide, $, channels, nextTick, LABELS) {

    provide(LABELS.decl({ modName: 'view', modVal: 'menu' }, {

        onSetMod: {
            init: {
                true: function() {
                    this._labels = [];

                    this._getMenu();

                    channels('filter').on('label:click', this._checkedLabelByFilter, this);
                }
            }
        },

        getLabels: function(labels) {
            var _this = this;

            $.ajax({
                dataType: 'html',
                url: '/labels?__mode=content&view=menu',
                type: 'GET'
            }).done(function(html) {
                LABELS.update(_this.elem('wrap'), html);

                _this.findBlockInside('spin', 'spin').delMod('progress');

                _this.setMod('init', true);
            });

            return this;
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

            channels('filter').emit('label:loadIssue', { labels: _this._labels });

            return this;
        }
    }));
});
