modules.define('forum-labels', ['i-bem__dom', 'jquery'], function(provide, BEMDOM, $) {
    provide(BEMDOM.decl(this.name, {
        getLabels: function(labels) {
            var _this = this;

            $.ajax({
                dataType: 'html',
                url: '/labels?__mode=content',
                type: 'GET'
            }).done(function(html) {
                BEMDOM.update(_this.elem('wrap'), html);

                _this.findBlockInside('spin', 'spin').delMod('progress');

                if(labels) {
                    _this._checkedLabels(labels);
                }
            });

            return this;
        },

        _checkedLabels: function(labels) {
            this.findBlocksInside('label', 'checkbox').forEach(function(checkbox) {
                labels.forEach(function(label) {
                    if(label === checkbox.elem('control').val()) {
                        checkbox.setMod('checked', true);
                    }
                });
            });
        }
    }));
});
