modules.define('forum-issues', ['i-bem__dom', 'events__channels'], function (provide, BEMDOM, channels) {
    provide(BEMDOM.decl(this.name, {
        onSetMod: {
            js: {
                inited: function () {
                    var params = this.params;

                    params.isLastPage && channels('forum-issues').emit('hide-pager');
                    params.isMatchArchive && channels('forum-issues').emit('show-archive', {
                        archiveUrl: params.archiveUrl
                    });
                }
            }
        }
    }));
});
