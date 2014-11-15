modules.define(
    'comments',
    ['jquery'],
    function(provide, $, Comments) {

        provide(Comments.decl({block: this.name, elem: 'show-more'}, {
            onSetMod: {
                js: {
                    inited: function() {
                        this.__base.apply(this, arguments);

                        this._button = this.findBlockInside('button');
                        this._button && this._button.on('click', this._onButtonClick, this);
                    }
                }
            },

            _onButtonClick: function () {
                this._page = (this._page) ? this._page + 1 : 2;

                this.emit('comments:loading');

                $.ajax({
                    dataType: 'html',
                    url: this.params.forumUrl + 'issues/' +
                    this.params.issueNumber + '/comments/?__mode=content&per_page=' +
                    this.elemParams('show-more').numComments + '&page=' + this._page,
                    context: this
                }).done(function(html) {
                    this._render(html, 'append', 'container');

                    this.emit('comments:complete');

                    this._checkMore(this._page);
                });
            }
        }));
    });
