({
    shouldDeps: [
        'forum-issues',
        'forum-loader',
        'forum-pager',
        'location',
        { block: 'button', mods: { theme: 'islands', size: 'xl', type: 'link', view: 'action' } },
        { block: 'events', elem: 'channels' },
        { elems: ['archive', 'container', 'left', 'right'] },
        { mods: { view: ['issues', 'issue'] } }
    ]
});
