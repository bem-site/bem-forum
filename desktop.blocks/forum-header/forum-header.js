modules.define('forum-header', ['i-bem__dom', 'jquery', 'events__channels'], function (provide, BEMDOM, $, channels) {
    provide(BEMDOM.decl(this.name, {
        _showLabel: function (e) {
            channels('filter').emit('labels', { labels: ['bem-forum'] });
        }
    }, {
        live: function () {
            this.liveBindTo('bug-button', 'click', function (e) {
                e.preventDefault();

                this._showLabel();
            });
        }
    }));
});
