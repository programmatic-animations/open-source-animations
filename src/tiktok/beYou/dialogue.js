import { SHOTS } from './shots.js';

// Current user-authored script. Timing stays provisional until recording.
// Natural accent and performance belong to the user's recording.
const drafts = [
  ['balu-question', 'Balu', .2, 3.2, 'Bro, how to get a girlfriend bro?', 'Earnest and casual; a little space around both bros.'],
  ['rabbit-advice', 'Rabbit', .15, 4.15, 'Brother, best way to get a girlfriend is to be yourself.', 'Deliver the advice sincerely and confidently.'],
  ['balu-check', 'Balu', .2, 1.15, 'Be myself?', 'Literal clarification, followed by a listening beat.'],
  ['rabbit-confirm', 'Rabbit', .12, 1.4, "Yes, don't hold back.", 'Cheerfully seals the mistake.'],
  ['balu-okay', 'Balu', .12, .75, 'Vokey', 'Straight-faced acceptance; leave a tiny beat before the eruption.'],
  ['rabbit-correction', 'Rabbit', .45, 4.05, 'Brooo, you should totally be someone else!', 'Prolong Brooo against the blast; panic rises through someone else.']
];

export const DIALOGUE = drafts.map(([shotId, speaker, from, to, text, delivery]) => {
  const shot = SHOTS.find(entry => entry.id === shotId);
  if (!shot || from < 0 || to > shot.duration) throw new Error(`Dialogue exceeds shot ${shotId}`);
  return Object.freeze({ shotId, speaker, start: shot.start + from, end: shot.start + to, text, delivery });
});
