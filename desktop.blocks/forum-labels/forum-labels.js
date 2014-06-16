modules.define('forum-labels', ['i-bem__dom', 'jquery'], function(provide, BEMDOM, $) {
    provide(BEMDOM.decl(this.name, {
        getLabels: function() {
            var _this = this;

            $.ajax({
                dataType: 'html',
                url: '/labels?__mode=content',
                type: 'GET'
            }).done(function(html) {
                BEMDOM.update(_this.elem('wrap'), html);

                _this.findBlockInside('spin', 'spin').delMod('progress');
            });
        }
    }));
});
