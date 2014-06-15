modules.define('form', ['i-bem__dom', 'jquery'], function(provide, BEMDOM, $) {
    provide(BEMDOM.decl(this.name, {

        onSetMod: {
            js: {
                inited: function() {
                    this.bindTo('submit', function(e) {
                        e.preventDefault();

                        this._onSubmit();
                    });

                    this._listenCancel();
                }
            }
        },

        _onSubmit: function() {
            this.emit('submit', this._getSerialize());

            this._clearInputs();
        },

        _listenCancel: function() {
            this._cancel = this.findBlockInside(this.elem('cancel'), 'button');

            this._cancel && this._cancel.on('click', this.toggle, this);
        },

        _showError: function(type) {
            switch(type) {
                case 'empty' :
                    window.alert('Это поле не может быть пустым');
                    break;
            }
        },

        _clearInputs: function() {
            var input = this.findBlocksInside(this.elem('control', 'autoclear', 'yes'), 'input');

            if(input.length > 1) {
                input.forEach(function(item) {
                    item.setVal('');
                });
            } else {
                input[0].setVal('');
            }
        },

        _getSerialize: function() {
            return this.domElem.serializeArray();
        },

        setVal: function(name, value) {
            var inputs = this.findBlocksInside(this.elem('control'), 'input'),
                input = inputs.filter(function(item) {
                    return item.elem('control').attr('name') === name;
                });

            input[0].setVal(value);

            return this;
        },

        isEmpty: function(name) {
            var inputs = this.findBlocksInside(this.elem('control'), 'input'),

                input = inputs.filter(function(item) {
                    return item.elem('control').attr('name') === name;
                });

            if(input[0].getVal() === '') {
                this._showError('empty');

                return true;
            }

            return false;
        },

        toggleLoadersUi: function() {
            this.findBlockInside(this.elem('submit'), 'button').toggleMod('disabled', true, '');
            this.findBlockInside(this.elem('spin'), 'spin').toggleMod('progress', true, '');

            return this;
        },

        toggle: function() {
            this.toggleMod('visibility', 'hidden', '');

            return this;
        }

    }));
});
