modules.define('forum-form', ['i-bem__dom', 'jquery'], function(provide, BEMDOM, $) {
    provide(BEMDOM.decl(this.name, {

        /**
         * Блок FORM, умеет:
         * реагировать на сабмит на форме,
         * проверять заполненны ли данные,
         * получать данные из контролов
         * Очищать поля контролов,
         * показывать ошибки заполнения
         */

        onSetMod: {
            js: {
                inited: function() {
                    this.bindTo('submit', this._onSubmit);

                    this._subscribes();
                }
            },

            processing: {
                yes: function() {
                    this._toggleProcessingUi();
                },

                '': function() {
                    this
                        ._toggleProcessingUi()
                        ._clearForm();
                }
            }
        },

        /**
         * На сабмит формы - получаем данные из контролов и очищаем поля
         * триггерим BEM событие submit
         * @private
         */
        _onSubmit: function(e) {
            e.preventDefault();

            this.emit('submit', this._getSerialize());

            return this;
        },

        /**
         * Подписываем на события внутри блока
         * @private
         */
        _subscribes: function() {
            this._listenCancel();

            return this;
        },

        /**
         * Слушаем клик на элементе cancel, клик по которому закрывает форму
         * @private
         */
        _listenCancel: function() {
            this._cancel = this.findBlockInside(this.elem('cancel'), 'button');

            this._cancel && this._cancel.on('click', this.toggle, this);
        },

        /**
         * Показывает ошибку в нативном модальном окне
         * @param type - тип ошибки
         * @param errorText - текст ошибки
         * @private
         */
        _showError: function(type, errorText) {
            switch(type) {
                case 'empty' :
                    window.alert(errorText || 'Это поле не может быть пустым');
                    break;
                case 'notChecked' :
                    window.alert(errorText || 'Нужно выбрать один вариантов');
            }
        },

        /**
         * Очищает поля всех контролов формы
         * @private
         */
        _clearForm: function() {
            var input = this.findBlocksInside(this.elem('control', 'autoclear', 'yes'), 'input');

            if(input.length > 1) {
                input.forEach(function(item) {
                    item.setVal('');
                });
            } else {
                input[0].setVal('');
            }

            return this;
        },

        /**
         * Получает значения контролов формы, http://api.jquery.com/serializeArray/
         * @returns {*}
         * @private
         */
        _getSerialize: function() {
            return this.domElem.serializeArray();
        },

        /**
         * Переключается состояние элементов формы кнопки 'type=submit' и лоадера,
         * которые отображают процесс отправки
         * @returns {*}
         * @private
         */
        _toggleProcessingUi: function() {
            this.findBlockInside(this.elem('submit'), 'button').toggleMod('disabled', true, '');
            this.findBlockInside(this.elem('spin'), 'spin').toggleMod('progress', true, '');

            return this;
        },

        /**
         * Устанавливает значение контролу формы
         * @param name - значение атрибута name контрола
         * @param value - задаваемое значение
         * @returns {*}
         */
        setVal: function(name, value) {
            var inputs = this.findBlocksInside(this.elem('control'), 'input'),
                input = inputs.filter(function(item) {
                    return item.elem('control').attr('name') === name;
                });

            input[0].setVal(value);

            return this;
        },

        /**
         * Проверяем, введены ли данные в контрол, если нет возвращаем true
         * и показываем попап с ошибкой
         * @param name - значение атрибута name контрола
         * @param errorText - можно задать кастомный текст для ошибки
         * @returns {boolean}
         */
        isEmptyInput: function(name, errorText) {
            var inputs = this.findBlocksInside(this.elem('control'), 'input'),
                input = inputs.filter(function(item) {
                    return item.elem('control').attr('name') === name;
                });

            if(input[0].getVal() === '') {
                this._showError('empty', errorText ? errorText : false);

                return true;
            }

            return false;
        },

        /**
         * Проверяем, отмечен ли хоть один из чекбоксов, если нет возвращаем true
         * и показываем попап с ошибкой
         * @param name - значение атрибута name чекбокса
         * @param errorText - можно задать кастомный текст для ошибки
         * @returns {boolean}
         */
        isEmptyCheckbox: function(name, errorText) {
            var checked = this.findBlocksInside(this.elem('control'), 'checkbox')
                .filter(function(checkbox) {
                    return checkbox.elem('control').attr('name') === name;
                })
                .every(function(checkboxByName) {
                    return (!checkboxByName.hasMod('checked', true));
                });

            if(checked) {
                this._showError('notChecked', errorText ? errorText : false);

                return true;
            }

            return false;
        },

        /**
         * Показываем/скрываем форму
         * @returns {*}
         */
        toggle: function() {
            this.toggleMod('visibility', 'hidden', '');

            this.emit('toggle');

            return this;
        }

    }));
});
