modules.define('forum', ['i-bem__dom', 'jquery'], function(provide, BEMDOM, $) {
    provide(BEMDOM.decl(this.name, {
        onSetMod: {
            js: {
                inited: function() {
                    this._loadIssues();
                }
            }
        },

        _getIssueByLabel: function() {
            var _this = this;

            this.findBlocksInside('issue').forEach(function(issue) {
                issue.on('issue:label', _this._loadIssues, _this);
            });
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
                _this._render(html, 'prepend', 'issues');

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

            this._getIssueByLabel();
        },

        _toggleFormAdd: function() {
            this.findBlockInside('labels', 'forum-labels').getLabels();

            this._formAdd.toggle();
        },

        _loadIssues: function(e, data) {

            console.log('data', data);

            this._spin = this.findBlockInside('spin', 'spin');

            var _this = this,
                url = '/issues?per_page=2';

            if(data && data.label) {
                url = url + '&labels=' + data.label;

                this._spin.setMod('progress', true);
            }

            $.ajax({
                dataType: 'html',
                url: url,
                type: 'GET'
            }).done(function(html) {
                _this._render(html, 'update', 'content');

                _this._spin.delMod('progress');

                _this._subscribes();
            });
        },

        _render: function(html, addMethod, elem) {

            var container = (elem && this.elem(elem)) || this.domElem;

            BEMDOM[addMethod](container, html);
        }
    }));
});
