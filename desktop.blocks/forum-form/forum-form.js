modules.define('forum-form', ['i-bem__dom', 'jquery'], function (provide, BEMDOM, $) {
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
                inited: function () {
                    this.bindTo('submit', this._onSubmit);
                    this._subscribes();
                }
            },

            processing: {
                yes: function () {
                    this._toggleProcessingUi();
                },

                '': function () {
                    this._toggleProcessingUi();
                }
            }
        },

        /**
         * На сабмит формы - получаем данные из контролов и очищаем поля
         * триггерим BEM событие submit
         * @private
         */
        _onSubmit: function (e) {
            e.preventDefault();

            this.emit('submit', this.getSerialize());

            return this;
        },

        /**
         * Подписываем на события внутри блока
         * @private
         */
        _subscribes: function () {
            this._listenCancel();

            return this;
        },

        /**
         * Слушаем клик на элементе cancel, клик по которому закрывает форму
         * @private
         */
        _listenCancel: function () {
            this._cancel = this.findBlockInside(this.elem('cancel'), 'button');

            this._cancel && this._cancel.on('click', this.toggle, this);
        },

        /**
         * Показывает ошибку в нативном модальном окне
         * @param errorText - текст ошибки
         * @private
         */
        _showError: function (errorText) {
            window.alert(errorText);
        },

        /**
         * Очищает поля всех контролов формы
         * @private
         */
        _clearForm: function () {
            var _this = this,
                $controls = this.elem('control', 'autoclear', 'yes');

            $controls.each(function (idx, control) {
                _this.findBlockInside(_this.getMod($(control), 'type')).setVal('');
            });

            return this;
        },

        /**
         * Получает значения контролов формы, http://api.jquery.com/serializeArray/
         * @returns {*}
         * @public
         */
        getSerialize: function () {
            return this.domElem.serializeArray();
        },

        /**
         * Переключается состояние элементов формы кнопки 'type=submit' и лоадера,
         * которые отображают процесс отправки
         * @returns {*}
         * @private
         */
        _toggleProcessingUi: function () {
            this.findBlockInside(this.elem('submit'), 'button').toggleMod('disabled', true, '');
            this.findBlockInside(this.elem('spin'), 'spin').toggleMod('visible', true, '');

            return this;
        },

        /**
         * Устанавливает значение контролу формы
         * @param name - значение атрибута name контрола
         * @param value - задаваемое значение
         * @returns {*}
         */
        setVal: function (name, value) {
            var inputs = this.findBlocksInside(this.elem('control'), 'input'),
                input = inputs.filter(function (item) {
                    return item.elem('control').attr('name') === name;
                });

            input[0].setVal(value);

            return this;
        },

        /**
         * Проверяем, введены ли данные в контрол, если нет возвращаем true
         * и показываем попап с ошибкой
         * @param name {String} - значение атрибута name контрола
         * @returns {boolean}
         */
        isEmptyInput: function (name) {
            var _this = this,
                $controls = this.elem('control'),
                resultCheck = false,
                i18n = this.params.i18n,
                errors = {
                    title: i18n['empty-title'],
                    comment: i18n['empty-comment']
                },
                blocksOnControl;

            $controls.each(function (idx, control) {
                blocksOnControl = _this.findBlocksInside(_this.getMod($(control), 'type'));

                if (blocksOnControl.length) {
                    // check if goal have the pass name value
                    blocksOnControl = blocksOnControl.filter(function (control) {
                        return control.elem('control').attr('name') === (name === 'comment' ? 'body' : name);
                    });

                    if (blocksOnControl.length && blocksOnControl[0].getVal() === '') {
                        _this._showError(errors[name]);
                        resultCheck = true;

                        // after find goal elem - exit from $.each()
                        return false;
                    }
                }
            });

            return resultCheck;
        },

        /**
         * Проверяем, отмечен ли хоть один из чекбоксов, если нет возвращаем true
         * и показываем попап с ошибкой
         * @param name - значение атрибута name чекбокса
         * @returns {boolean}
         */
        isEmptyCheckbox: function (name) {
            if (this.params.labelsRequired) {
                var checked = this.findBlocksInside(this.elem('control'), 'checkbox')
                    .filter(function (checkbox) {
                        return checkbox.elem('control').attr('name') === name;
                    })
                    .every(function (checkboxByName) {
                        return (!checkboxByName.hasMod('checked', true));
                    });

                if (checked) {
                    this._showError(this.params.i18n['empty-labels']);
                    return true;
                }
            }

            return false;
        },

        /**
         * Показываем/скрываем форму
         * @returns {*}
         */
        toggle: function () {
            this.toggleMod('visibility', 'hidden');
            this.emit('toggle');
            return this;
        },

        /**
         * Check if one of passed fields is empty
         * @returns {boolean}
         */
        isEmptyRequiredField: function () {
            var names = [].slice.call(arguments, 0),
                methods = {
                    title: this.isEmptyInput.bind(this),
                    comment: this.isEmptyInput.bind(this),
                    'labels[]': this.isEmptyCheckbox.bind(this)
                };

            return names.some(function (name) {
                return methods[name](name);
            });
        },

        /**
         * Show form`s processing
         * @returns {Object} - this block
         */
        showProcessing: function () {
            return this.setMod('processing', 'yes');
        },

        /**
         * Hide form`s processing,
         * if stop processing call after error,
         * form will not cleared
         * @param isError
         * @returns {Object} - this block
         */
        hideProcessing: function (isError) {
            !isError && this._clearForm();
            return this.delMod('processing');
        }

    }));
});
