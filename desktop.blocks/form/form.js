modules.define('form', ['i-bem__dom', 'jquery'], function(provide, BEMDOM, $) {
    provide(BEMDOM.decl(this.name, {

        _onSubmit: function(e) {
            e.preventDefault();

            this.emit('submit', this._getSerialize());

            this.clearInputs();
        },

        clearInputs: function() {
            var inputs = this.findBlocksInside(this.elem('control', 'autoclear', 'yes'), 'input');

            inputs.forEach(function(input) {
                input.setVal('');
            });
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
