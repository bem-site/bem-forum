modules.define('forum-labels', ['jquery'], function(provide, $, LABELS) {

    provide(LABELS.decl({ modName: 'view', modVal: 'menu' }, {

        getLabels: function(labels) {
            var _this = this;

            $.ajax({
                dataType: 'html',
                url: '/labels?__mode=content&view=menu',
                type: 'GET'
            }).done(function(html) {
                LABELS.update(_this.elem('wrap'), html);

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
