modules.define('comments', ['i-bem__dom', 'jquery'], function(provide, BEMDOM, $) {
    provide(BEMDOM.decl(this.name, {
        onSetMod: {
            js: {
                inited: function() {
                    this._toggleComments();

                    this._formSubmit();
                }
            }
        },

        _formSubmit: function() {
            this._form = this.findBlockInside(this.elem('add-form'), 'forum-form');
            this._form && this._form.on('submit', this._addComments, this);
        },

        _toggleComments: function() {
            this.on('show', this._showComments);
            this.on('close', this._closeComments);
        },

        _addComments: function(e, data) {
            if(this._form.isEmptyInput('body')) {
                return false;
            }

            this._form.setMod('processing', 'yes');

            this._postComment(data);
        },

        _postComment: function(data) {
            var _this = this;

            data.push({ name: 'number', value: this.params.issueNumber });

            $.ajax({
                dataType: 'html',
                type: 'POST',
                data: data,
                url: this.params.forumUrl + 'issues/' + this.params.issueNumber + '/comments'
            }).done(function(html) {
                _this._render(html, 'append', 'container');

                _this._afterAdd();
            });
        },

        _closeComments: function() {
            this.setMod('hidden', true);
        },

        _showComments: function() {
            var _this = this;

            // if comments is empty - show only add form
            if(this.params.comments === 0) {
                this._toggle();

                return false;
            }

            this.emit('comments:loading');

            $.ajax({
                dataType: 'html',
                url: this.params.forumUrl + 'issues/' + this.params.issueNumber + '/comments?__mode=content'
            }).done(function(html) {
                _this._render(html, 'update', 'container');

                _this._afterShow();
            });
        },

        _afterShow: function() {
            this.emit('comments:complete');

            this._toggle();

            this._subscribes();
        },

        _subscribes: function() {
            var _this = this;

            this.findBlocksInside(this.elem('item'), 'comment').forEach(function(comment) {
                _this._subscribeDelete(comment);
            });
        },

        _subscribeDelete: function(comment) {
            var _this = this;

            comment.on('comment:delete', function() {

                _this.params.comments -= 1;
                _this.emit('comment:delete', { comments: _this.params.comments });
            });
        },

        _render: function(html, addMethod, elem) {
            var container = (elem && this.elem(elem)) || this.domElem;

            BEMDOM[addMethod](container, html);
        },

        _toggle: function() {
            this.toggleMod('hidden', true, '');
        },

        _beforeAdd: function() {
            this.emit('comment:beginAdd');

            this._form.toggleLoadersUi();
        },

        _afterAdd: function() {
            this.params.comments += 1;

            this.emit('comment:add', { comments: this.params.comments });

            this._subscribeDelete(this.findBlocksInside(this.findElem('item'), 'comment').pop());

            this._form.delMod('processing');
        }
    }));
});
