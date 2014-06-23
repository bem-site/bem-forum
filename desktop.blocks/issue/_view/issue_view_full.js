modules.define('issue', ['next-tick', 'events__channels'], function(provide, nextTick, channels, ISSUE) {
    provide(ISSUE.decl({ modName: 'view', modVal: 'full' }, {
        onSetMod: {
            js: {
                inited: function() {
                    this.__base();

                    var _this = this;

                    nextTick(function() {
                        _this._switcher
                            .setMod('checked', true)
                            .emit('click');

                        channels('filter').emit('labels:clear');
                    });
                }
            }
        }
    }));
});
