modules.define('forum-labels', ['jquery'], function(provide, $, Labels) {

    provide(Labels.decl({ modName: 'view', modVal: 'checkbox' }, {

        getLabels: function(labels) {
            var _this = this,
                forumUrl = this.params['forumUrl'] || '/';

            $.ajax({
                dataType: 'html',
                url: forumUrl + 'labels/?__mode=content&view=checkbox',
                type: 'GET'
            }).done(function(html) {
                Labels.update(_this.elem('wrap'), html);

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
