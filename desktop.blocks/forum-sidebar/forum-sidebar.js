modules.define('forum-sidebar', ['i-bem__dom', 'jquery'], function(provide, BEMDOM, $) {
    provide(BEMDOM.decl(this.name, {
        onSetMod: {
            js: {
                inited: function() {
                    this.findBlockInside('forum-labels').getLabels();
                }
            }
        }
    }));
});
