modules.define('i-bem__dom', function(provide, BEMDOM) {

BEMDOM.decl('issue', {
    onSetMod: {
        js: {
            inited: function() {
                BEMDOM.blocks.button.on(this.elem('comments-switcher'), 'click', function() {
                    this.findBlockInside('comments').toggleMod('visible');
                }, this);
            }
        }
    }
});

provide(BEMDOM);

});
