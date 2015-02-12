modules.define('preview', ['i-bem__dom'], function (provide, BEMDOM) {

    provide(BEMDOM.decl(this.name, {

        /**
         * Clear preview area
         */
        clear: function () {
            this.domElem.html('');
        }

    }));

});
