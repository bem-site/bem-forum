modules.define('issue', ['i-bem__dom', 'jquery', 'events__channels', 'dom', 'next-tick'], function (provide, BEMDOM, $, channels, dom, nextTick) {
    provide(BEMDOM.decl(this.name, {
        onSetMod: {
            js: {
                inited: function () {
                    this._reinit();
                }
            }
        },

        _reinit: function () {
            this._findElems();
            this._subscribes();

            if (this._comments && this._switcher) {
                this._setSwitcherCount();
                this._toggleComments();
            }
        },

        _findElems: function () {
            this._comments = this.findBlockInside('comments');
            this._switcher = this.findBlockInside('comments-switcher', 'button');
            this._spin = this.findBlockInside('spin', 'spin');

            return this;
        },

        _setSwitcherCount: function () {
            var i18n = this.params.i18n;

            this._comments.on('comment:add', function (e, data) {
                this._switcher.setText(i18n.comments + ': ' + data.comments);
            }, this);

            this._comments.on('comment:delete', function (e, data) {
                var count = data.comments,
                    text = !count ? i18n.reply : i18n.comments + ': ' + count;

                this._switcher.setText(text);
            }, this);
        },

        _subscribes: function () {
            if (this._comments) {
                this._comments.on('comments:loading', this._toggleLoadersUi, this);
                this._comments.on('comments:complete', this._toggleLoadersUi, this);
            }

            if (dom.contains(this.domElem, this.elem('owner-action'))) {
                this._subscribeOwnerActions();
            }

            this.bindTo('label', 'click', this._onClickLabel);

            return this;
        },

        _subscribeOwnerActions: function () {
            this.bindTo(this.elem('edit'), 'click', this._onClickEdit);
            this.bindTo(this.elem('remove'), 'click', this._onClickRemove);
        },

        _onClickLabel: function (e) {
            e.preventDefault();

            channels('filter').emit('labels', { labels: [$(e.target).text()] });
        },

        _onClickRemove: function (e) {
            e.preventDefault();

            if (window.confirm(this.params.i18n['remove-message'])) {
                var data = this.findBlockInside('edit-form', 'forum-form').getSerialize(),
                    params = this.params;

                this.emit('process', { enable: true });

                data.push(
                    { name: 'labels[]', value: 'removed' },
                    { name: 'number', value: params.number }
                );

                $.ajax({
                    dataType: 'html',
                    type: 'PUT',
                    timeout: 10000,
                    data: data,
                    url: params.forumUrl + 'issues/' + params.number + '/?__access=owner&__mode=json',
                    context: this
                }).done(function () {
                    var _this = this;
                    // small hack, do desctruct in next tick,
                    // because always callback happens early
                    nextTick(function () {
                        BEMDOM.destruct(_this.domElem);
                    });
                }).fail(function (xhr) {
                    alert('Не удалось удалить пост');
                    window.forum.debug && console.log('issue remove fail', xhr);
                }).always(function () {
                    this.emit('process', { enable: false });
                });
            }
        },

        _toggleEditBody: function (body) {
            this._formEdit.on('toggle', function () {
                this.toggleMod(body, 'visibility', 'hidden', '', !this._formEdit.hasMod('visibility', 'hidden'));
            }, this);
        },

        _onClickEdit: function (e) {
            e.preventDefault();

            this._formEdit = this.findBlockInside('edit-form', 'forum-form');

            if (this.params.labelsRequired) {
                this.findBlockInside('edit-labels', 'forum-labels').getLabels(this.params.labels);
            }

            var body = this.findElem('body');
            this.setMod(body, 'visibility', 'hidden') && this._toggleEditBody(body);

            this._formEdit.toggle();
            this._formEdit.on('submit', this._onSubmitEdit, this);
        },

        _onSubmitEdit: function (e, data) {
            if (this._formEdit.isEmptyRequiredField('title', 'labels[]')) return false;

            var params = this.params;

            this._formEdit.setMod('processing', 'yes');

            data.push({ name: 'number', value: params.number });

            $.ajax({
                dataType: 'html',
                type: 'PUT',
                timeout: 10000,
                data: data,
                url: params.forumUrl + 'issues/' + params.number + '/?__access=owner',
                context: this
            }).done(function (html) {
                this._render(html);
                this._afterEdit();
            }).fail(function (xhr) {
                alert('Не удалось отредактировать пост');
                window.forum.debug && console.log('issue add fail', xhr);
            }).always(function () {
                this._formEdit.delMod('processing');
            });
        },

        _render: function (html) {
            BEMDOM.replace(this.domElem, html);
        },

        _afterEdit: function () {
            this._formEdit.toggle();

            this._reinit();
        },

        _toggleLoadersUi: function () {
            this._spin.toggleMod('visible', true, '');
            this._switcher.toggleMod('disabled', true, '');
        },

        _toggleComments: function () {
            this._switcher.on('click', function () {
                this._comments.emit(this._switcher.hasMod('checked', true) ? 'show' : 'close');
            }, this);
        }
    }));
});
