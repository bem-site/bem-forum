modules.define('comment', ['i-bem__dom', 'jquery', 'events__channels'], function(provide, BEMDOM, $, channels) {
    provide(BEMDOM.decl(this.name, {
        onSetMod: {
            js: {
                inited: function() {

                }
            }
        },

        _onClickRemove: function() {
            var _this = this;

            if(window.confirm('Вы уверены?')) {
                $.ajax({
                    type: 'DELETE',
                    url: '/issues/' + _this.params.issueId + '/comments/' + _this.params.id
                }).done(function() {
                    _this.emit('comment:delete');

                    BEMDOM.destruct(_this.domElem);
                });
            }
        }
    }, {
        live: function() {
            this.liveBindTo('remove', 'click', function(e) {
                e.preventDefault();

                this._onClickRemove();
            });
        }
    }));
});
