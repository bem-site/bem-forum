modules.define('forum', ['i-bem__dom', 'jquery', 'events__channels'], function(provide, BEMDOM, $, channels) {
    provide(BEMDOM.decl(this.name, {
        onSetMod: {
            js: {
                inited: function() {
                    this._spin = this.findBlockInside('spin', 'spin');

                    this._loadIssues();
                }
            },

            progress: {
                yes: function() {
                    this._spin.setMod('progress', true);
                },

                '': function() {
                    this._spin.delMod('progress');

                    this._subscribes();
                }
            }
        },

        _addIssue: function(e, data) {
            if(this._formAdd.isEmptyInput('title', 'Заголовок не может быть пустым')) {
                return false;
            }

            if (this._formAdd.isEmptyCheckbox('labels[]', 'Выберете один из лейблов')) {
                return false;
            }

            var _this = this;

            this._formAdd.setMod('processing', 'yes');

            $.ajax({
                dataType: 'html',
                type: 'POST',
                data: data,
                url: '/issues/'
            }).done(function(html) {
                _this._render(html, 'prepend', 'content');

                _this._afterAdd();
            });
        },

        _afterAdd: function() {
            this._formAdd
                .delMod('processing')
                .toggle();
        },

        _subscribes: function() {
            this._formAdd = this.findBlockInside('add-form', 'form');
            this._formAdd && this._formAdd.on('submit', this._addIssue, this);

            this.findBlockInside('add', 'button') && this.findBlockInside('add', 'button').on('click', this._toggleFormAdd, this);

            channels('load').on('issues', this._loadIssues, this);
            channels('load').on('issue', this._loadIssue, this);
        },

        _toggleFormAdd: function() {
            this.findBlockInside('labels', 'forum-labels').getLabels();

            this._formAdd.toggle();
        },

        _loadIssuesByLabels: function(e, data) {
            if(!data) {
                return false;
            }

            this._loadIssues(data);

            return this;
        },

        _loadIssue: function(e, data) {
            this.setMod('progress', 'yes');

            this._getRequest(data.url);
        },

        _loadIssues: function(e, data) {
            this._xhr && this._xhr.abort();

            this.setMod('progress', 'yes');

            var url = '/issues?per_page=10';

            if(data) {
                if(data.labels) {
                    url = url + '&labels=' + data.labels.join(',');
                }
            }

            this._getRequest(url);
        },

        _getRequest: function(url) {
            var _this = this;

            this._xhr = $.ajax({
                dataType: 'html',
                url: url,
                type: 'GET'
            });

            this._xhr.done(function(html) {
                _this._render(html, 'update', 'content');

                _this.delMod('progress');
            });
        },

        _render: function(html, addMethod, elem) {

            var container = (elem && this.elem(elem)) || this.domElem;

            BEMDOM[addMethod](container, html);
        }
    }));
});
