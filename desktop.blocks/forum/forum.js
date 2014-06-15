modules.define('forum', ['i-bem__dom', 'jquery'], function(provide, BEMDOM, $) {
    provide(BEMDOM.decl(this.name, {
        onSetMod: {
            js: {
                inited: function() {
                    this._loadIssues();

                    this._addButton = this.findBlockInside(this.elem('add'), 'button');

                    this._addButton && this._addButton.on('click', this._showFormAdd, this);

                    this._showFormAdd();
                }
            }
        },

        _showFormAdd: function() {
            if(!this._formAdd) {
                this._formAdd = this.findBlockInside('add-form', 'form');
            }

            this._formAdd &&
                this._formAdd
                    .toggleMod('visibility', 'hidden', '')
                    .on('submit', this._addIssue, this);

            if(!this._addCancel) {
                this._addCancel = this.findBlockInside('add-cancel', 'button');
            }

            this._addCancel && this._addCancel.on('click', function() {

                console.log('click');

                this._formAdd.toggleMod('visibility', 'hidden', '')
            }, this);
        },

        _addIssue: function(e, data) {
            if(this._formAdd.isEmpty('title')) {
                return false;
            }

            var _this = this;

            this._spin = this.findBlockInside('spin');
            this._button =  this.findBlockInside(this.elem('add-button'), 'button');

            this._beforeAdd();

            data.push({ name: 'labels[]', value: 'question' });
            data.push({ name: 'labels[]', value: 'custom' });

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

        _beforeAdd: function() {
            this._toggleLoaders();
        },

        _afterAdd: function() {
            this._toggleLoaders();

            this._formAdd.toggleMod('visibility', 'hidden', '');
        },

        _toggleLoaders: function() {
            this._spin.toggleMod('progress', true, '');
            this._button.toggleMod('disabled', true, '');
        },

        _loadIssues: function() {
            this._spin = this.findBlockInside(this.elem('spin'), 'spin');

            var _this = this;

            $.ajax({
                dataType: 'html',
                url: '/issues?__mode=content',
                type: 'GET'
            }).done(function(html) {
                _this._render(html, 'append');

                _this._spin && _this._spin.delMod('progress');
            });
        },

        _render: function(html, addMethod, elem) {

            var container = (elem && this.elem(elem)) || this.domElem;

            BEMDOM[addMethod](container, html);
        }
    }));
});
