modules.define(
    'forum-content',
    ['i-bem__dom', 'jquery', 'events__channels', 'location'],
    function (provide, BEMDOM, $, channels, location) {

    provide(BEMDOM.decl(this.name, {
        onSetMod: {
            js: {
                inited: function () {
                    this._loader = this.findBlockInside('forum-loader');
                    this._labels = this.findBlockInside({ block: 'forum-labels', modName: 'view', modVal: 'menu' });
                    location.on('change', this._onChangeLocation, this);
                    channels('forum-issues').on('show-archive', this._onShowArchive, this);
                    BEMDOM.blocks.issue.on('process', function (e, data) {
                        this._loader.setMod('progress', data.enable);
                    }, this);
                }
            },

            loading: {
                true: function () {
                    this._loader.setMod('progress', true);
                },

                '': function () {
                    this._loader.delMod('progress');
                }
            }
        },

        _onShowArchive: function (e, data) {
            this
                .setMod(this.elem('archive'), 'show', true)
                .elem('archive-button').attr('href', data.archiveUrl);
        },

        _loadIssues: function (options) {
            var uri = location.getUri();
            options.url = uri.getQuery();
            this._sendRequest(options);
        },

        _onChangeLocation: function (e, state) {
            var uri = location.getUri(),
                prevParams = uri.parseQuery(uri.parseUri(state.referer).query),
                prevPage = prevParams.page && prevParams.page[0] || 1,
                currentPage = state.params.page && state.params.page[0] || 1,
                options = {};

            // invert pages numbers if it is archive
            if (currentPage < 0) {
                prevPage = Math.abs(prevPage);
                currentPage = Math.abs(currentPage);
            }

            if (+prevPage < +currentPage) {
                options.type = 'append';
            }

            this._loadIssues(options);
        },

        _sendRequest: function (options) {
            this._abortRequest();

            var params = this.params;

            this.setMod('loading', true);

            this._xhr = $.ajax({
                type: 'GET',
                dataType: 'html',
                url: params.forumUrl + 'api/issues/' + options.url,
                cache: false,
                context: this
            }).fail(function () {
                alert(params.i18n['error-get-data']);
            }).done(function (html) {
                this._onSuccess(html, options.type)
            })
            .always(function () {
                this.delMod('loading');
            });
        },

        _abortRequest: function () {
            this._xhr && this._xhr.abort();
        },

        _onSuccess: function (html, type) {
            type = type || 'update';
            this._render(html, type, 'container');
        },

        _render: function (html, addMethod, elem) {
            var container = (elem && this.elem(elem)) || this.domElem;

            BEMDOM[addMethod](container, html);
        }
    }));
});
