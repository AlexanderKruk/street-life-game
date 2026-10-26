export const trash = {
  'trash.full': 'Your backpack has no room for another container.',
  'trash.result.title': 'Trash search results',
  'trash.result.found': {
    plural: 'found',
    one: 'You searched the trash for {minutes} minutes and kept {found} returnable container.',
    other: 'You searched the trash for {minutes} minutes and kept {found} returnable containers.',
  },
  'trash.result.empty': 'You searched for {minutes} minutes and found nothing useful.',
  'trash.title': 'Look for bottles',
  'trash.tip': 'Drag rubbish out. Tap intact bottles & cans.',
  'trash.kept': { plural: 'found', one: '{found} container kept', other: '{found} containers kept' },
  'trash.pickCan': 'Pick up can',
  'trash.pickBottle': 'Pick up plastic bottle',
  'trash.moveRubbish': 'Drag rubbish aside · arrow keys to move',
  'trash.finish': 'Finish searching',
  // The model returns 10–60 minutes in steps of five, never a singular minute.
  'trash.time.label': 'Search time: {minutes} minutes',
  'trash.time.short': '{minutes} min',
} as const
