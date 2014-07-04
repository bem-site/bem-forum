modules.define('forum-pager', ['i-bem__dom', 'jquery'], function(provide, BEMDOM, $) {
    provide(BEMDOM.decl(this.name, {
        onSetMod: {
            js: {
                inited: function() {
                    this._getRepoInfo();
                }
            }
        },

        _getRepoInfo: function() {
            this._sendRequest();
        },

        _sendRequest: function() {
            this._abortRequest();

            this._xhr = $.ajax({
                type: 'GET',
                dataType: 'json',
                url: 'repo?__mode=json',
                cache: false,
                success: this._onSuccess.bind(this)
            });
        },

        _abortRequest: function() {
            this._xhr && this._xhr.abort();
        },

        _onSuccess: function(result) {
            this._total = result.open_issues_count;
        }
    }));
});
