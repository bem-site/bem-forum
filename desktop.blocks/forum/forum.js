modules.define('forum', ['i-bem__dom', 'jquery'], function(provide, BEMDOM, $) {
    provide(BEMDOM.decl(this.name, {
        onSetMod: {
            js: {
                inited: function() {
                    $.ajax({
                        type: 'GET',
                        dataType: 'html',
                        url: '/getIssues',
                        cache: false,
                        success: function(html) {
                            console.log(html);
                        }
                    });
                }
            }
        }
    }));
});
