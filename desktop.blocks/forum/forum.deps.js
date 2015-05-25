({
    mustDeps: [
        'i-bem',
        'forum-variables',
        { block: 'i-bem', elem: 'i18n' },
        { block: 'icon', mods: { view: 'quote' } }
    ],

    shouldDeps: [
        'jquery',
        'forum-highlightjs',
        'forum-content',
        'forum-sidebar',
        'forum-column',
        'forum-line',
        'forum-header',
        'forum-footer',
        { block: 'events', elem: 'channels' },
        { elems: [
            'add-body',
            'add-form',
            'add-title',
            'inner',
            'labels',
            'labels-spin',
            'spin'
        ] }
    ]
});
