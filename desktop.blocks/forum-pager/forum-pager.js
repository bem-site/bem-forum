modules.define('forum-pager', ['i-bem__dom', 'jquery', 'events__channels', 'location'], function(provide, BEMDOM, $, channels, location) {
    provide(BEMDOM.decl(this.name, {
        onSetMod: {
            js: {
                inited: function() {
                    this._button = this.findBlockInside('button', 'button');
                    this._button.on('click', this._loadIssues, this);

                    var page = location.getUri().getParam('page');
                    this._page = page ? (+page[0] + 1) : 2;
                }
            }
        },

        _loadIssues: function() {
            if(location.getUri().getParam('labels') && !this._update) {
                this._page = 2;
                this._update = true;
            }
            
            location.change({ params: { page: this._page } });
            channels('load').emit('issues', { page: this._page });
            this._page += 1;
        }
    }));
});
