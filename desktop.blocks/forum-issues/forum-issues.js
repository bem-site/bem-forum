modules.define('forum-issues', ['i-bem__dom', 'events__channels'], function (provide, BEMDOM, channels) {
    provide(BEMDOM.decl(this.name, {
        onSetMod: {
            js: {
                inited: function () {
                    var isLastPage = this.params.isLastPage,
                        isArchive = this.params.isArchive;

                    if (isLastPage) {
                        channels('forum-issues').emit('hide-pager');
                    }

                    // Last page, but not archive
                    if (isLastPage && !isArchive) {
                        channels('forum-issues').emit('show-archive');
                    }
                }
            }
        }
    }));
});
