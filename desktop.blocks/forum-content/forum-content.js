modules.define(
    'forum-content',
    ['i-bem__dom', 'jquery', 'events__channels', 'location'],
    function(provide, BEMDOM, $, channels, location) {

    provide(BEMDOM.decl(this.name, {
        onSetMod: {
            js: {
                inited: function() {
                    this._loader = this.findBlockInside('forum-loader');
                    this._pager = this.findBlockInside('forum-pager');
                    this._labels = this.findBlockInside({ block: 'forum-labels', modName: 'view', modVal: 'menu' });
                    location.on('change', this._onChangeLocation, this);
                    BEMDOM.blocks.issue.on('process', function(e, data) {
                        this._loader.setMod('progress', data.enable);
                    }, this);
                }
            },

            loading: {
                true: function() {
                    this._loader.setMod('progress', true);
                },

                '': function() {
                    this._loader.delMod('progress');
                }
            }
        },

        _loadIssues: function(options) {
            var uri = location.getUri(),
                url = 'issues/';

            options.url  = url + uri.getQuery();

            this._sendRequest(options);
        },

        _onChangeLocation: function(e, state) {
            var uri = location.getUri(),
                prevParams = uri.parseQuery(uri.parseUri(state.referer).query),
                prevPage = prevParams.page && prevParams.page[0] || 1,
                currentPage = state.params.page && state.params.page[0] || 1,
                options = {};

            if(prevPage < currentPage) options.type = 'append';

            this._loadIssues(options);
        },

        _sendRequest: function(options) {
            this._abortRequest();

            this.setMod('loading', true);

            this._xhr = $.ajax({
                type: 'GET',
                dataType: 'json',
                url: this.params.forumUrl + options.url,
                cache: false,
                context: this
            }).done(function(result) {
                this._pager.setMod('disabled', result.isLastPage);

                this._onSuccess(result.html, options.type)
            });
        },

        _abortRequest: function() {
            this._xhr && this._xhr.abort();
        },

        _onSuccess: function(html, type) {
            if(!type) type = 'update';

            this.delMod('loading');
            this._render(html, type, 'container');
        },

        _render: function(html, addMethod, elem) {
            var container = (elem && this.elem(elem)) || this.domElem;

            BEMDOM[addMethod](container, html);
        }
    }));
});
