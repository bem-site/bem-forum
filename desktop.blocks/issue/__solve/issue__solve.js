modules.define('issue', ['jquery'], function (provide, $, Issue) {
    provide(Issue.decl({ block: this.name, elem: 'solve' }, {
        onSetMod: {
            solved: function (modName, modVal) {
                this.setMod(this.elem('solve-badge'), 'show', modVal);
                this.findBlockInside('solve-icon', 'icon').setMod('action', modVal ? 'un-solve' : 'solve');
                this._comments && this._comments.setMod(this._comments.elem('add-button'), 'make-open', modVal);
            }
        },

        /**
         * Helper for repeat issue subscribes events
         * after it create or changes
         * @private
         */
        _reinit: function () {
            this.__base.apply(this, arguments);

            this._comments.on('comment:add', function () {

                this.hasMod('solved') && this._changeState(true);
            }, this);
        },

        /**
         * Subscribe to owner actions blocks events
         * @private
         */
        _subscribeOwnerActions: function () {
            this.__base.apply(this, arguments);

            this.findBlockInside('solve', 'link').on('click', this._onClickSolve, this);
        },

        /**
         * Handler to click on solved button
         * @private
         */
        _onClickSolve: function () {
            var isSolved = this.hasMod('solved'),
                i18n = this.elemParams('solve').i18n,
                message = [i18n[isSolved ? 'open-message' : 'close-message'], i18n.post.toLowerCase()].join(' ') + '?';

            window.confirm(message) && this._changeState(isSolved);
        },

        /**
         * Change state of issue
         * @param isSolved (boolean)
         * @private
         */
        _changeState: function (isSolved) {
            var params = this.params;

            this.emit('process', { enable: true });

            $.ajax({
                dataType: 'html',
                type: 'PUT',
                timeout: 10000,
                data: {
                    state: isSolved ? 'open' : 'closed',
                    number: params.number,
                    _csrf: params.csrf
                },
                url: params.forumUrl + 'api/issues/' + params.number + '/?__mode=json',
                context: this
            }).done(function () {
                this.setMod('solved', !isSolved);
            }).fail(function (xhr) {
                alert(this.elemParams('solve').i18n[isSolved ? 'error-open-post' : 'error-close-post']);
            }).always(function () {
                this.emit('process', { enable: false });
            });
        }
    }));
});
