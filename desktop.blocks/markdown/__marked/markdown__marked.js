modules.define(
    'markdown__marked',
    ['i-bem__dom'],
    function (provide) {

        /*borschik:include:../../node_modules/marked/lib/marked.js*/

        //marked.setOptions({
        //    highlight: function (code) {
        //        return hljs.highlightAuto(code).value;
        //    }
        //});

        provide(marked);

    }
);
