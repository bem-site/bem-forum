modules.define('forum-loader', ['i-bem__dom'], function (provide, BEMDOM) {
    provide(BEMDOM.decl(this.name, {
        onSetMod: {
            progress: function (modName, modVal) {
                if (!this._spin) {
                    this._spin = this.findBlockInside('spin');
                }

                // TODO: Исследовать, почему мод. progress выставляется раньше чем inited
                this._spin.setMod('visible', modVal);
            }
        }
    }));
});
