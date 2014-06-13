modules.define('comments', ['i-bem__dom', 'jquery'], function(provide, BEMDOM, $) {
    provide(BEMDOM.decl(this.name, {
        onSetMod: {
            js: {
                inited: function() {

                    this.on('show', this._showComments);

                    this.on('close', this._closeComments);

                    var form = this.findBlockInside(this.elem('add-form'), 'form');

                    if(form) {
                        form.on('submit', this._addComments, this);
                    }

                    this._spin = this.findBlockInside('spin');
                    this._button =  this.findBlockInside(this.elem('add-button'), 'button');
                }
            }
        },

        _addComments: function(e, data) {

            if(this._isEmptyBody(data)) {
                this._showError({ type: 'emptyBody' });
                return false;
            }

            this._beforeAdd();

            this._postComment(data);
        },

        _postComment: function(data) {
            var _this = this;

            data.push({ name: 'number', value: this.params.id });

            $.ajax({
                dataType: 'html',
                type: 'POST',
                data: data,
                url: '/issues/' + _this.params.id + '/comments'
            }).done(function(html) {
                _this._render(html, 'append', 'wrap');

                _this._afterAdd();
            });
        },

        _closeComments: function() {
            this.setMod('hidden', true);
        },

        _showComments: function() {
            var _this = this;

            if(this.params.comments === 0) {
                this._isHidden() && this.delMod('hidden');

                return false;
            }

            this.emit('comments:loading');

            this.
                _getComments(this.params.id)
                .done(function(html) {
                    _this._render(html, 'update', 'wrap');

                    _this.emit('comments:complete');

                    _this._commentAction();
                });
        },

        _commentAction: function() {
            var _this = this;

            this.findBlocksInside(this.elem('item'), 'comment').forEach(function(comment) {
                _this._listenCommentDelete(comment);
            });
        },

        _listenCommentDelete: function(comment) {

            var _this = this;

            comment.on('comment:delete', function() {

                _this.params.comments -= 1;
                _this.emit('comment:delete', { comments: _this.params.comments });
            });
        },

        _getComments: function(id) {
            return $.ajax({
                dataType: 'html',
                url: '/issues/' + id + '/comments?__mode=content'
            })
        },

        _render: function(html, addMethod, elem) {

            var container = (elem && this.elem(elem)) || this.domElem;

            BEMDOM[addMethod](container, html);

            this._isHidden() && this.delMod('hidden');
        },

        _beforeAdd: function() {
            this.emit('comment:beginAdd');

            this._spin.setMod('progress', true);
            this._button.setMod('disabled', true);
        },

        _afterAdd: function() {
            this.params.comments += 1;

            this.emit('comment:add', { comments: this.params.comments });

            this._listenCommentDelete(this.findBlocksInside(this.findElem('item'), 'comment').pop());

            this._spin.delMod('progress');
            this._button.delMod('disabled');
        },

        _isHidden: function() {
            return this.hasMod('hidden');
        },

        _isEmptyBody: function(data) {

            return data.some(function(obj) {
                if(obj.name === 'body' && obj.value === '') {
                    return true;
                }
            });
        },

        _showError: function(options) {

            if(!options || (options && !options.type)) {
                return false;
            }

            switch(options.type) {
                case 'emptyBody' :
                    this.emit('comment:empty');
                    window.alert('Добавьте текст для вашего ответа');
                    break;
            }
        }

    }));
});
