modules.define('forum-issues', ['i-bem__dom', 'events__channels'], function (provide, BEMDOM, channels) {
    provide(BEMDOM.decl(this.name, {
        onSetMod: {
            js: {
                inited: function () {
                    var params = this.params,
                        isLastPage = params.isLastPage,
                        isArchive = params.isArchive,
                        isLangSupportArchive = params.isLangSupportArchive;

                    if (isLastPage) {
                        channels('forum-issues').emit('hide-pager');
                    }

                    // Last page, but not archive
                    if (isLangSupportArchive && isLastPage && !isArchive) {
                        channels('forum-issues').emit('show-archive');
                    }
                }
            }
        }
    }));
});
