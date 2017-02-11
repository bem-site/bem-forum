modules.define('button', function (provide, Button) {

provide(Button.decl({

    _onPointerPress: function (event) {
        if (event.originalEvent) {
            return;
        }
        if (!this.hasMod('disabled')) {
            this._isPointerPressInProgress = true;
            this
                .bindToDoc('pointerrelease', this._onPointerRelease)
                .setMod('pressed');
        }
    }

}));

});
