modules.define('form', ['i-bem__dom', 'jquery'], function(provide, BEMDOM, $) {
    provide(BEMDOM.decl(this.name, {

        _onSubmit: function(e) {
            e.preventDefault();

            this.emit('submit', this._getSerialize());

            this._clearInputs();
        },

        setVal: function(name, value) {
            var inputs = this.findBlocksInside(this.elem('control'), 'input'),
                input = inputs.filter(function(item) {
                    return item.elem('control').attr('name') === name;
                });

            input[0].setVal(value);
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
        }

    }, {
        live: function() {
            this.liveBindTo('submit', function(e) {
                this._onSubmit(e);
            });
        }
    }));
});
