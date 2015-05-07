modules.define('comment', ['i-bem__dom', 'jquery'], function (provide, BEMDOM, $) {
    provide(BEMDOM.decl(this.name, {
        /**
         * Обработчик на сабмит формы редактирования
         * @param e
         * @param data
         * @returns {boolean}
         * @private
         */
        _onSubmitEdit: function (e, data) {
            if (this._getFormEdit().isEmptyInput('comment')) return false;

            this._getFormEdit().showProcessing();
            data.push({ name: 'id', value: this.params.id });

            $.ajax({
                dataType: 'html',
                type: 'PUT',
                timeout: 10000,
                data: data,
                url: this.params.forumUrl + 'api/issues/' + this.params.issueNumber + '/comments/' + this.params.id + '/?__mode=content',
                context: this
            }).done(function (html) {
                BEMDOM.update(this.domElem, html);
                this._getFormEdit().hideProcessing();
                this._dropCached();
            }).fail(function (xhr) {
                alert('Не удалось отредактировать комментарий');
                this._getFormEdit().hideProcessing(true);
                window.forum.debug && console.log('comment edit fail', xhr);
            });
        },

        /**
         * Кешируем инстанс формы редактирования
         */
        _formEdit: null,

        /**
         * Возвращает инстанс формы редактирования
         * @returns {BEMDOM}
         * @private
         */
        _getFormEdit: function () {
            return this._formEdit || (this._formEdit = this.findBlockInside('edit-form', 'forum-form'));
        },

        /**
         * Кешируем инстанс кнопки отмены
         */
        _cancelButton: null,

        /**
         * Возвращает инстанс инопки отмены
         * @returns {BEMDOM}
         * @private
         */
        _getCancelButton: function () {
            return this._cancelButton || (this._cancelButton = this.findBlockInside('edit-cancel', 'button'));
        },

        /**
         * Сбрасываем закешированные инстансы после обновления контента
         * @private
         */
        _dropCached: function () {
            this._formEdit = null;
            this._cancelButton = null;
        },

        /**
         * Показываем / скрываем форму редактирования
         * @private
         */
        _toggleFormEdit: function () {
            var body = this.findElem('body'),
                formEdit = this._getFormEdit();

            formEdit.toggleMod('visibility', 'hidden', '');
            this.toggleMod(body, 'visibility', 'hidden', '', !formEdit.hasMod('visibility', 'hidden'));
        },

        /**
         * Обработчик клика по кнопке отмены редактирования
         * @private
         */
        _onClickEditCancel: function () {
            this.toggleMod(this.findElem('body'), 'visibility', 'hidden', '');
            this._getFormEdit().un('submit', this._onSubmitEdit, this);
        },

        /**
         * Задаем высоту формы редактирования
         * @private
         */
        _setFormEditHeight: function () {
            var height = this.findElem('body').outerHeight();

            this.findElem('edit-textarea').height(height);
        },

        /**
         * Обработчик клика по иконке редактирования
         * @private
         */
        _onClickEdit: function () {
            this._setFormEditHeight();
            this._toggleFormEdit();

            this._getFormEdit().on('submit', this._onSubmitEdit, this);
            this._getCancelButton().on('click', this._onClickEditCancel, this);
        },

        /**
         * Обработчик клика по иконке удаления
         * @private
         */
        _onClickRemove: function () {
            if (window.confirm('Вы уверены?')) {
                var params = this.params;

                $.ajax({
                    type: 'DELETE',
                    timeout: 10000,
                    data: {
                        _csrf: params.csrf,
                        id: params.id
                    },
                    url: this.params.forumUrl + 'api/issues/' + this.params.issueNumber + '/comments/' + this.params.id + '/',
                    context: this
                }).done(function () {
                    this.emit('comment:delete');
                    BEMDOM.destruct(this.domElem);
                }).fail(function () {
                    alert('Не удалось удалить комментарий');
                });
            }
        }
    }, {
        live: function () {
            this.liveInitOnBlockInsideEvent('click', 'link', function (e) {
                // Задаем необходимый обработчик для клика по кнопкам Удалить/редактировать
                this['_onClick' + e.target.params.action]();
            });
        }
    }));
});
