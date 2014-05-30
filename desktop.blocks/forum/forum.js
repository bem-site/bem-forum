modules.define('forum', ['i-bem__dom', 'jquery'], function(provide, BEMDOM, $) {
    provide(BEMDOM.decl(this.name, {
        onSetMod: {
            js: {
                inited: function() {
                    var _this = this;

                    $.ajax({
                        dataType: 'html',
                        url: '/issues',
                        type: 'GET',
                        success: function(html) {
                            BEMDOM.update(_this.domElem, html);
                        }
                    });
                }
            }
        }
    }));
});
