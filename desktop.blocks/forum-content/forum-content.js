modules.define('forum-content', ['i-bem__dom', 'jquery', 'events__channels'], function(provide, BEMDOM, $, channels) {
    provide(BEMDOM.decl(this.name, {
        onSetMod: {
            js: {
                inited: function() {
                    this._spin = this.findBlockInside('spin', 'spin');
                    this._loadIssues();
                }
            },

            loading: {
                true: function() {
                    this._spin.setMod('progress', true);
                },

                '': function() {
                    this._spin.delMod('progress');
                    this._initSubscribes();
                }
            }
        },

        _loadIssues: function(e, data) {
            var url = '/issues?per_page=10';

            if(data) {
                if(data.labels) {
                    url = url + '&labels=' + data.labels.join(',');
                }
            }

            this._doRequest(url);
        },

        _loadIssue: function(e, data) {
            data && data.url && this._getRequest(data.url);
        },

        _initSubscribes: function() {
            channels('load').on('issues', this._loadIssues, this);
            channels('load').on('issue', this._loadIssue, this);
        },

        _doRequest: function(url) {
            this.setMod('loading', true);
            this._sendRequest(url);
        },

        _sendRequest: function(url) {
            this._abortRequest();

            this._xhr = $.ajax({
                type: 'GET',
                dataType: 'html',
                url: url,
                cache: false,
                success: this._onSuccess.bind(this)
            });
        },

        _abortRequest: function() {
            this._xhr && this._xhr.abort();
        },

        _onSuccess: function(html) {
            this.delMod('loading');
            this._render(html, 'update', 'container');
        },

        _render: function(html, addMethod, elem) {

            var container = (elem && this.elem(elem)) || this.domElem;

            BEMDOM[addMethod](container, html);
        }
    }));
});
