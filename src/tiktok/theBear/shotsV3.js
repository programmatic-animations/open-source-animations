import { defineShots } from '../../runtime/shotTimeline.js';
import { HONEY_BETRAYAL_SHOTS } from '../../shots/honeyBetrayalShots.js';
// V3 keeps the bargain and revenge action at its authored speed. The opening
// and pit are retimed to let the smell, approach, fall and discovery breathe.
const cut = (id, title, world, from, to, framing, duration = to - from) => ({
  id, title, world, from, to, framing, duration, verticalZoom: 256 / 81
});
const dealFraming = {
  conspiracy: 'rabbits', 'their-price': 'rabbits', 'honey-insert': 'honey',
  agreement: 'bear', pickup: 'pickup', ladder: 'ladder', climb: 'climb',
  'honey-first': 'exchange', 'reluctant-choice': 'choice', handover: 'exchange',
  betrayal: 'release', fall: 'fall', silence: 'recovery', 'never-again': 'anger-push'
};
export const SHOTS = defineShots([
  cut('face-hook', 'Something smells good', 'trap', 12, 12.5, 'face-hook', 2),
  cut('branch-approach', 'The honey is close', 'trap', 12.5, 16.2, 'branch-approach', 5.2),
  cut('break', 'The branch breaks', 'trap', 16.2, 18.2, 'trap'),
  cut('wake', 'At the bottom', 'pit', 2.6, 4, 'pit-bear', 3),
  cut('reveal', 'The rabbits appear', 'pit', 4, 6.35, 'pit-rabbits'),
  cut('laugh', 'They laugh at him', 'pit', 6.35, 9.5, 'pit-laugh'),
  ...HONEY_BETRAYAL_SHOTS.map(s => cut(`deal-${s.id}`, s.title, 'deal', s.start, s.end, dealFraming[s.id])),
  cut('revenge-anger', 'A change inside Balu', 'revenge', 0, 2, 'revenge-anger'),
  cut('revenge-fingers', 'The fingers emerge', 'revenge', 2, 10, 'fingers-push'),
  cut('revenge-weapon', 'He takes the branch', 'revenge', 10, 14, 'weapon'),
  cut('revenge-fire', 'The eyes ignite', 'revenge', 14, 17, 'fire'),
  cut('revenge-skeptical', 'They still do not understand', 'revenge', 17, 19, 'rabbits'),
  cut('revenge-spear', 'The throw', 'revenge', 19, 22, 'throw'),
  cut('revenge-impact', 'The strike', 'revenge', 22, 23.2, 'impact'),
  cut('revenge-fall', 'The body falls', 'revenge', 23.2, 27, 'corpse'),
  cut('revenge-you-next', 'You are next', 'revenge', 30.5, 34, 'point'),
  // Hold the survivors' last fearful pose; the camera supplies the slow move.
  cut('revenge-three-reaction', 'The three survivors', 'revenge', 33.99, 34, 'survivors-group', 3.5),
  cut('revenge-scatter', 'All three flee', 'revenge', 34, 39, 'run-group'),
  cut('revenge-smile', 'Balu laughs', 'revenge', 39, 47, 'grin-push')
]);
