/**
 * Extends block 'radio-group' from bem-components
 */

modules.define(
    'radio-group',
    function (provide, BEMDOM) {

provide(BEMDOM.decl(this.name, {

    getRadioByVal: function (val) {
        var radios = this.getRadios(),
            i = 0, option;

        while (option = radios[i++]) {
            if (option.getVal() === val) {
                return option;
            }
        }
    }

}));

});
