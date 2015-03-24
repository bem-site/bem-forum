modules.define(
    'forum-create',
    ['i-bem__dom', 'markdown'],
    function (provide, BEMDOM, markdown) {

        provide(BEMDOM.decl(this.name, {

            onSetMod: {
                js: {
                    inited: function () {
                        this._switcher = this.findBlockInside('radio-group');
                        this._source   = this.findBlockInside('textarea');
                        this._preview  = this.findBlockInside('preview');
                        this._radioPreview = this._switcher.getRadioByVal('preview');

                        this._switcher.on('change', this._switch, this);
                        this._source.on('change', this._checkSource, this);

                        // Run first check (for edit mode)
                        this._checkSource();
                    }
                }
            },

            _switch: function () {
                var view = this._switcher.getVal();

                this.delMod(this.elem('view'), 'visible');
                this.setMod(this.elem('view', 'type', view), 'visible');

                if (view === 'preview') {
                    this._preview.domElem.html(markdown.render(this._source.getVal()));
                }
            },

            _checkSource: function () {
                this._radioPreview.setMod('disabled', !this._source.getVal());
            }

        }));

    }
);
