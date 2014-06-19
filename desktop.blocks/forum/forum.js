modules.define('forum', ['i-bem__dom', 'jquery'], function(provide, BEMDOM, $) {
    provide(BEMDOM.decl(this.name, {
        onSetMod: {
            js: {
                inited: function() {
                    this._loadIssues();
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
            this._formAdd.on('submit', this._addIssue, this);

            this.findBlockInside('add', 'button').on('click', this._toggleFormAdd, this);
        },

        _toggleFormAdd: function() {
            this.findBlockInside('labels', 'forum-labels').getLabels();

            this._formAdd.toggle();
        },

        _loadIssues: function() {
            this._spin = this.findBlockInside('spin', 'spin');

            var _this = this;

            $.ajax({
                dataType: 'html',
                url: '/issues?per_page=2&__mode=content',
                type: 'GET'
            }).done(function(html) {
                _this._render(html, 'append');

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
