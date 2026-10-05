// Updates come from the app's release history; guides are short, general eye-care reads.
export const POSTS = [
  {
    slug: 'ghost-moods-and-guided-exercises', kind: 'update', date: 'Sep 30, 2026', face: 'happy', bg: 'dusk',
    title: 'Distant 1.0 — Ghost moods and guided eye exercises',
    summary: 'The ghost now reacts to how you’re doing, and leads four short exercises during your breaks.',
    body: [
      'Skip a few breaks and the ghost gets tired, then sad. Keep a streak going and it perks right up. You’ll see its mood in the menu bar or tray, on the heads-up, and on the break screen.',
      'Breaks can now be guided: follow the ghost with your eyes, blink along slowly, palm your eyes, or look far into the distance. Distant rotates through them so no two breaks in a row feel the same.',
      'There’s also a new Report with today’s breaks, your streaks, a 7-day chart and the hour you tend to skip most.',
    ],
  },
  {
    slug: 'smarter-breaks', kind: 'update', date: 'Sep 30, 2026', face: 'calm', bg: 'ocean',
    title: 'Smarter breaks that wait for your calls',
    summary: 'Breaks hold while you’re on a call or watching video, and you can postpone instead of skipping.',
    body: [
      'Distant now notices when any app is using your microphone, so it never interrupts a meeting. On macOS it also waits out browser calls and video playback; on Windows, games, fullscreen video and presentations.',
      'A short toast tells you when breaks go on hold and when they’re back on.',
      'Not ready? Push a break back by one or five minutes. Skipping is still there, but it unlocks after five seconds so you can’t dismiss a break by reflex.',
    ],
  },
  {
    slug: 'fixed-time-breaks', kind: 'update', date: 'Sep 30, 2026', face: 'calm', bg: 'forest',
    title: 'Fixed-time breaks for lunch and walks',
    summary: 'Schedule breaks at set times of day. They still respect your calls and skip themselves if you’re already away.',
    body: [
      'Add a lunch break at 12:30 or an afternoon walk at 4. Each one has its own length and label.',
      'Fixed-time breaks wait for calls to end, just like regular ones, and skip themselves if you’re already away from your computer.',
    ],
  },
  {
    slug: '20-20-20-rule', kind: 'guide', face: 'calm', bg: 'honey',
    title: 'The 20-20-20 rule, explained',
    summary: 'Every 20 minutes, look at something 20 feet away for 20 seconds. Here’s why it works.',
    body: [
      'When you look at something close, the small muscles that focus your eyes stay contracted. Hours of that is a big part of why your eyes feel tired after a long day at a screen.',
      'The 20-20-20 rule, widely recommended by eye-care professionals, gives those muscles a regular rest: every 20 minutes, look at something about 20 feet (6 metres) away for at least 20 seconds.',
      'The hard part isn’t the rule, it’s remembering. That’s the whole job of a break reminder: it keeps count so you don’t have to, and holds off while you’re on a call.',
    ],
  },
  {
    slug: 'desk-setup', kind: 'guide', face: 'happy', bg: 'night',
    title: 'Set up your desk for less eye strain',
    summary: 'Screen distance, height, brightness and glare: small changes that add up over a working day.',
    body: [
      'Sit about an arm’s length from your screen, with the top of the display at or slightly below eye level so you look a little downward.',
      'Match screen brightness to the room. A screen much brighter or darker than its surroundings makes your eyes work harder. Light from the side beats light from behind the screen or straight behind you.',
      'Bump up text size instead of leaning in. And keep taking breaks: the best setup still needs you to look away now and then.',
    ],
  },
  {
    slug: 'blink-more', kind: 'guide', face: 'tired', bg: 'ember',
    title: 'Dry, tired eyes? Blink more',
    summary: 'We blink less when we concentrate on screens. A few full, slow blinks help more than you’d think.',
    body: [
      'Focusing on a screen tends to make us blink less often, and less completely. Fewer full blinks means the surface of the eye dries out faster.',
      'Try a few slow, complete blinks: close gently, pause, open. Blink reminders help build the habit until it sticks.',
      'If dryness, redness or blurred vision keep coming back, see an optometrist or ophthalmologist. A break reminder helps with habits, not with eye conditions.',
    ],
  },
]
