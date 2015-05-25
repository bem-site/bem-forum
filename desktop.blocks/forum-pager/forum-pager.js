modules.define('forum-pager',
    ['i-bem__dom', 'location', 'events__channels'], function (provide, BEMDOM, location, channels) {
    provide(BEMDOM.decl(this.name, {
        onSetMod: {
            js: {
                inited: function () {
                    this._button = this.findBlockInside('button', 'button');
                    this._button && this._button.on('click', this._onClick, this);
                    this._page = location.getUri().getParam('page') || 1;
                    channels('forum-issues').on('hide-pager', this._onPagerHide, this);
                    location.on('change', function (e, state) {
                        if (!state.params.page) {
                            this._page = 1;
                        }
                    }, this);
                }
            },

            disabled: function (modName, modVal) {
                this._button.setMod('disabled', modVal);
            }
        },

        _onClick: function () {
            location.change({ params: { page: (this._page < 0) ? --this._page : ++this._page } });
        },

        _onPagerHide: function () {
            this.setMod('disabled');
        }
    }));
});
