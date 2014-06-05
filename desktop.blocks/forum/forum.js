modules.define('forum', ['i-bem__dom', 'jquery'], function(provide, BEMDOM, $) {
    provide(BEMDOM.decl(this.name, {
        onSetMod: {
            js: {
                inited: function() {
                    var _this = this;

                    this._spin = this.findBlockInside(this.elem('spin'), 'spin');

                    $.ajax({
                        dataType: 'html',
                        url: '/issues?__mode=content',
                        type: 'GET',
                        success: function(html) {
                            BEMDOM.append(_this.domElem, html);

                            BEMDOM.destruct(_this._spin.domElem);
                        }
                    });
                }
            }
        }
    }));
});
