modules.define('comments', function (provide, Comments) {
    provide(Comments.decl({ block: this.name, elem: 'add-button' }, {
        onElemSetMod: {
            'add-button': {
                'make-open': function (elem, modName, modVal) {
                    this.findBlockInside(elem, 'button')
                        .setText(this.elemParams(elem).text[modVal ? 'open' : 'default']);
                }
            }
        }
    }));
});
