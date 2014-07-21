modules.define(
    'forum-content',
    ['i-bem__dom', 'jquery', 'events__channels', 'location'],
    function(provide, BEMDOM, $, channels, location) {

    provide(BEMDOM.decl(this.name, {
        onSetMod: {
            js: {
                inited: function() {
                    this._loader = this.findBlockInside('forum-loader');
                    this._initSubscribes();
                }
            },

            loading: {
                true: function() {
                    this._loader.setMod('progress', true);
                },

                '': function() {
                    this._loader.delMod('progress');
                    this._initSubscribes();
                }
            }
        },

        _loadIssues: function(e, data) {
            var uri = location.getUri(),
                url = 'issues/',
                options = {};

            if(!data) return;

            console.log('query', uri.getQuery());

            options.url  = url + uri.getQuery();

//            if(data.labels && data.labels.length) {
//                var labels = data.labels.join(',');
//
////                !this._pageLabel ? this._pageLabel = 1 : this._pageLabel += 1;
//
//                location.change({
//                    params: {
//                        per_page: 2,
//                        page: 1,
//                        labels: labels
//                    },
//                    forceParams: true
//                });
//
//                console.log('uri get', uri.getQuery());
//
//                options = {
//                    url: url + uri.getQuery(),
//                    type: 'update'
//                };
//            } else if (data.page) {
//                var page = data.page;
//
//                location.change({ params: { per_page: 2, page: page } });
//
//                options = {
//                    url: url + uri.getQuery(),
//                    type: 'append'
//                };
//
//                console.log('location.change', uri.getQuery());
//
//                return;
//
//            } else {
//                location.change({ params: { per_page: 2, page: 1 }});
//
//                options = {
//                    url: url + uri.getQuery(),
//                    type: 'update'
//                };
//            }

//            return;

            this._doRequest(options);
        },

        _loadIssue: function(e, data) {
            data && data.url && this._getRequest(data.url);
        },

        _initSubscribes: function() {
            channels('load').on('issues', this._loadIssues, this);
            channels('load').on('issue', this._loadIssue, this);
        },

        _doRequest: function(options) {
            this.setMod('loading', true);
            this._sendRequest(options);
        },

        _sendRequest: function(options) {
            this._abortRequest();

            this._xhr = $.ajax({
                type: 'GET',
                dataType: 'html',
                url: this.params.forumUrl + options.url,
                cache: false,
                context: this
            }).done(function(result) {
                this._onSuccess(result, options.type)
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
