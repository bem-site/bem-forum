modules.define('issue', ['i-bem__dom', 'events__channels'], function(provide, BEMDOM, channels) {
    provide(BEMDOM.decl(this.name, {
        onSetMod: {
            js: {
                inited: function() {

                    var _this = this;

                    this._comments = this.findBlockInside('comments');

                    this._switcher = this.findBlockInside(this.elem('comments-switcher'), 'button');
                    this._spin = this.findBlockInside('spin');

                    if(this._comments && this._switcher) {
                        this._toggleComments();
                    }

                    this._comments.on('comment:add', function(e, data) {
                        _this._switcher.setText('Ответов: ' + data.comments);
                    });

                    this._comments.on('comment:delete', function(e, data) {
                        var count = data.comments,
                            text = 'Ответов: ' + count;

                        if(count < 1) {
                            text = 'Ответить'
                        }

                        _this._switcher.setText(text);
                    });

                    this._comments.on('comments:loading', function() {
                        _this._spin.setMod('progress', true);
                        _this._switcher.setMod('disabled', true);
                    });

                    this._comments.on('comments:complete', function() {
                        _this._spin.delMod('progress');
                        _this._switcher.delMod('disabled');
                    });

                    channels('comment').on('delete', function(e) {
                        console.log('comment DELETE');
                    });
                }
            }
        },

        _toggleComments: function() {

            var _this = this;

            this._switcher.on('click', function() {
                _this._comments.emit(_this._switcher.hasMod('checked', true) ? 'show' : 'close');
            });
        }
    }));
});
