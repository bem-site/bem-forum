modules.define('issue', ['i-bem__dom', 'next-tick'], function(provide, BEMDOM, nextTick) {
    provide(BEMDOM.decl(this.name, {
        onSetMod: {
            js: {
                inited: function() {
                    var _this = this,
                        comments = _this.findBlockInside('comments'),
                        switcher = _this.findBlockInside(_this.elem('comments-switcher'), 'button');

                    _this._toggleComments(switcher, comments);

                    nextTick(function() {
                        if(comments.hasMod('open', 'yes')) {
                            comments.emit('show');
                        }
                    });
                }
            }
        },

        _toggleComments: function(switcher, comments) {

            switcher.on('click', function() {
                comments.emit(switcher.hasMod('checked', true) ? 'show' : 'close');
            });

        }
    }));
});
