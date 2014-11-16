modules.define('comments', ['i-bem__dom', 'jquery'], function(provide, BEMDOM, $) {
    provide(BEMDOM.decl(this.name, {
        onSetMod: {
            js: {
                inited: function() {
                    // Форма добавления комментария
                    this._form = this.findBlockInside('add-form', 'forum-form');

                    this._binds();
                }
            }
        },

        /**
         * Подписываемся на события после инициализации
         * @private
         */
        _binds: function() {
            this.on('show', this._showComments);
            this.on('close', this._closeComments);
            this._form && this._form.on('submit', this._addComments, this);
            this.on('vote', this._setVote, this);
        },

        _setVote: function() {
            this._postComment([{
                name : 'body',
                value: ':+1:'
            }]);
        },

        /**
         * Обработчик сабмита формы добавления комментария
         * @param e
         * @param data
         * @returns {boolean}
         * @private
         */
        _addComments: function(e, data) {
            if(this._form.isEmptyInput('body')) return false;

            this._form.setMod('processing', 'yes');

            this._postComment(data);
        },

        /**
         * Отправляем комментарий
         * @param data
         * @private
         */
        _postComment: function(data) {
            data.push({ name: 'number', value: this.params.issueNumber });

            $.ajax({
                dataType: 'html',
                type: 'POST',
                timeout: 10000,
                data: data,
                url: this.params.forumUrl + 'issues/' + this.params.issueNumber + '/comments/',
                context: this
            }).done(function(html) {

                this._render(html, 'append', 'container');

                this._afterAdd();
            }).fail(function(xhr) {
                alert('Не удалось добавить комментарий');
                window.forum.debug && console.log('comment edit fail', xhr);
            }).always(function() {
                this._form.delMod('processing');
            });
        },

        /**
         * Закрываем комментарии
         * @private
         */
        _closeComments: function() {
            this.setMod('hidden');
        },

        /**
         * Показываем комментарии
         * @returns {boolean}
         * @private
         */
        _showComments: function() {
            // if comments is empty - show only add form
            // if(!this.params.comments) {
            //     this._toggle();
            //     return false;
            // }

            // this.emit('comments:loading');
            this._toggle();
            this._afterShow();

            // $.ajax({
            //     dataType: 'html',
            //     url: this.params.forumUrl + 'issues/' + this.params.issueNumber + '/comments/?__mode=content',
            //     context: this
            // }).done(function(html) {
            //     this._render(html, 'update', 'container');

            //     this._afterShow();
            // });
        },

        /**
         * После загрузки показываем форму добавления комментария
         * и комментарии + подписывамся на их удаление
         * @private
         */
        _afterShow: function() {
            this.emit('comments:complete');
            this._subscribes();
        },

        /**
         * Подписываемся на удаление комментария
         * @private
         */
        _subscribes: function() {
            this.findBlocksInside('item', 'comment').forEach(this._subscribeDelete, this);
        },

        /**
         * Обработчик удаления комментария
         * @private
         */
        _subscribeDelete: function(comment) {
            comment.on('comment:delete', function() {
                this.params.comments -= 1;
                this.emit('comment:delete', { comments: this.params.comments });
            }, this);
        },

        /**
         * Обертка над BEMDOM[append, update, replace..]
         * @param html
         * @param addMethod
         * @param elem
         * @private
         */
        _render: function(html, addMethod, elem) {
            var container = (elem && this.elem(elem)) || this.domElem;

            BEMDOM[addMethod](container, html);
        },

        /**
         * Показать / скрыть комментарии
         * @private
         */
        _toggle: function() {
            this.toggleMod('hidden');
        },

        /**
         * После добавления комментария
         * @private
         */
        _afterAdd: function() {
            this.params.comments += 1;

            this.emit('comment:add', { comments: this.params.comments });

            // подписываемся на удаление добавленного комментария
            this._subscribeDelete(this.findBlocksInside(this.findElem('item'), 'comment').pop());

            this._form.delMod('processing');
        }
    }));
});
