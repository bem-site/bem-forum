modules.define('comment', ['i-bem__dom', 'jquery'], function (provide, BEMDOM, $) {
    provide(BEMDOM.decl(this.name, {
        onSetMod: {
            progress: function (modName, modVal) {
                this._spin || (this._spin = this.findBlockInside('spin'));
                this._editButton || (this._editButton = this.findBlockInside('edit-button', 'button'));

                this._spin.setMod('visible', modVal);
                this._editButton.setMod('disabled', modVal);
            }
        },

        /**
         * Обработчик на сабмит формы редактирования
         * @param e
         * @param data
         * @returns {boolean}
         * @private
         */
        _onSubmitEdit: function (e, data) {
            if (this._getFormEdit().isEmptyInput('comment')) return false;

            this.setMod('progress', true);

            data.push({ name: 'id', value: this.params.id });

            $.ajax({
                dataType: 'html',
                type: 'PUT',
                timeout: 10000,
                data: data,
                url: this.params.forumUrl + 'issues/' + this.params.issueNumber + '/comments/' + this.params.id + '/?__mode=content',
                context: this
            }).done(function (html) {
                BEMDOM.update(this.domElem, html);
                this._dropCached();
            }).fail(function (xhr) {
                alert('Не удалось отредактировать комментарий');
                window.forum.debug && console.log('comment edit fail', xhr);
            }).always(function () {
                this.delMod('progress');
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
         * Кешируем инстанс кнопки редактирования
         */
        _editButton: null,

        /**
         * Возвращает инстанс кнопки редактирования
         * @returns {BEMDOM}
         * @private
         */
        _getEditButton: function () {
            return this._editButton || (this._editButton = this.findBlockInside('edit-button', 'button'));
        },

        /**
         * Сбрасываем закешированные инстансы после обновления контента
         * @private
         */
        _dropCached: function () {
            this._formEdit = null;
            this._editButton = null;
            this._cancelButton = null;
        },

        /**
         * Прогресс сохранения отредактированного комментария
         * @param progress
         * @private
         */
        _submitProgress: function (progress) {
            var spin = this.findBlockInside('spin'),
                button =  this._getEditButton();

            spin.setMod('visible', progress);
            button.setMod('disabled', progress);
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
                $.ajax({
                    type: 'DELETE',
                    timeout: 10000,
                    data: { _csrf: this.params.csrf },
                    url: this.params.forumUrl + 'issues/' + this.params.issueNumber + '/comments/' + this.params.id + '/',
                    context: this
                }).done(function () {
                    this.emit('comment:delete');

                    BEMDOM.destruct(this.domElem);
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
