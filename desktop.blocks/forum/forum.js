modules.define('forum', ['i-bem__dom', 'jquery'], function (provide, BEMDOM, $) {
    provide(BEMDOM.decl(this.name, {
        onSetMod: {
            js: {
                inited: function () {
                    this._formAdd = this.findBlockInside('add-form', 'forum-form');

                    if (this._formAdd) {
                        this._formAdd.on('submit', this._addIssue, this);
                        this._forumUrl = this._formAdd.params.forumUrl;
                    }

                    var addButton = this.findBlockInside('add', 'button');
                    addButton && addButton.on('click', this._toggleFormAdd, this);
                }
            }
        },

        _addIssue: function (e, data) {
            var formAdd = this._formAdd;

            if (formAdd.isEmptyRequiredField('title', 'labels[]')) return false;

            formAdd.showProcessing();

            var labels = data
                .filter(function (item) {
                    return item.name === 'labels[]';
                })
                .map(function (label) {
                    return label.value;
                });

            $.ajax({
                dataType: 'html',
                type: 'POST',
                timeout: 10000,
                data: data,
                url: this._forumUrl + 'api/issues/?__mode=json',
                context: this
            }).done(function (issueJson) {
                this._addLabelsAfter(JSON.parse(issueJson), labels);
            }).fail(function (xhr) {
                alert(formAdd.params.i18n['error-add-post']);
                formAdd.hideProcessing(true);
                window.forum.debug && console.log('issue add fail', xhr);
            });
        },

        _addLabelsAfter: function (result, labels) {
            var issue = result.issue,
                data = {
                    number: issue.number,
                    title: issue.title,
                    body: issue.body,
                    labels: labels,
                    _csrf: this.elemParams('add-form').csrf
                };

            $.ajax({
                dataType: 'html',
                type: 'PUT',
                data: data,
                url: this._forumUrl + 'api/issues/' + issue.number + '/?__admin=true',
                context: this
            }).done(function (html) {
                this._render(html, 'prepend');
                this._afterAdd();
            });
        },

        _afterAdd: function () {
            this._formAdd
                .hideProcessing()
                .toggle();
        },

        _toggleFormAdd: function () {
            var labels = this.findBlockInside('labels', 'forum-labels');

            if (labels) {
                labels.getLabels();
            }

            this._formAdd.toggle();
        },

        _render: function (html, addMethod) {
            var forumIssues = this.findBlockInside('forum-issues'),
                container = forumIssues && forumIssues.domElem;

            if (!container) {
              var location = window.location,
                  forumRootHrefArr = location.href.substr(0, location.href.length -1).split('/'),
                  forumRootHref = forumRootHrefArr.slice(0, forumRootHrefArr.length - 1).join('/') + '/';

              location.href = forumRootHref;
              return;
            }

            BEMDOM[addMethod](container, html);
        }
    }));
});
