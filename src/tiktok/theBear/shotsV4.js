import { defineShots } from '../../runtime/shotTimeline.js';
import { HONEY_BETRAYAL_SHOTS } from '../../shots/honeyBetrayalShots.js';
// V4 keeps the approved bargain and revenge performances at their authored
// speed. Opening inserts restore desire, decision, climb and impact.
const cut = (id, title, world, from, to, framing, duration = to - from, verticalZoom = 256 / 81) => ({
  id, title, world, from, to, framing, duration, verticalZoom
});
const dealFraming = {
  conspiracy: 'rabbits', 'their-price': 'rabbits', 'honey-insert': 'honey',
  agreement: 'bear', pickup: 'pickup', ladder: 'ladder', climb: 'climb',
  'honey-first': 'exchange', handover: 'exchange',
  betrayal: 'release', fall: 'fall', 'never-again': 'anger-push'
};
export const SHOTS = defineShots([
  cut('honey-hook', 'The temptation', 'trap', 0, 1.2, 'honey-hook', 1.2),
  cut('scent', 'Balu catches the scent', 'trap', 0, 2, 'scent', 2),
  cut('decision', 'He chooses the tree', 'trap', 5.7, 7.5, 'decision', 1.8),
  cut('climb-tree', 'He climbs', 'trap', 7.5, 11, 'climb-tree', 3.5),
  cut('branch-approach', 'The honey is close', 'trap', 11, 16.2, 'branch-approach', 5.2),
  cut('break', 'The branch breaks', 'trap', 16.2, 17.05, 'trap'),
  cut('landing', 'The impact', 'pit', 0, 1, 'pit-bear', 1),
  cut('wake', 'At the bottom', 'pit', 1, 4, 'pit-bear', 3),
  cut('reveal', 'The rabbits appear', 'pit', 4, 6.35, 'pit-rabbits'),
  cut('laugh', 'They laugh at him', 'pit', 6.35, 9.5, 'pit-laugh'),
  ...HONEY_BETRAYAL_SHOTS.flatMap(s => {
    if (s.id === 'reluctant-choice') return [
      cut('deal-choice-face', 'He looks to the rabbit', 'deal', s.start, s.start + 1.8, 'choice-face'),
      cut('deal-choice-hands', 'He studies the offered paw', 'deal', s.start + 1.8, s.end, 'choice-hands')
    ];
    if (s.id === 'silence') return [
      cut('deal-wounded', 'He feels the betrayal', 'deal', s.start, s.start + 1.5, 'wounded'),
      cut('deal-silence', 'He rises', 'deal', s.start + 1.5, s.end, 'recovery')
    ];
    return [cut(`deal-${s.id}`, s.title, 'deal', s.start, s.end, dealFraming[s.id])];
  }),
  cut('revenge-anger', 'A change inside Balu', 'revenge', 0, 2, 'revenge-anger'),
  cut('revenge-discovery', 'His hands are changing', 'revenge', 2, 4.5, 'discovery'),
  cut('revenge-fingers', 'The fingers emerge', 'revenge', 4.5, 10, 'fingers-push'),
  cut('revenge-weapon', 'He takes the branch', 'revenge', 10, 14, 'weapon'),
  cut('revenge-fire', 'The eyes ignite', 'revenge', 14, 17, 'fire'),
  cut('revenge-skeptical', 'They still do not understand', 'revenge', 17, 19, 'rabbits'),
  cut('revenge-spear', 'The throw', 'revenge', 19, 22, 'throw'),
  cut('revenge-impact', 'The strike', 'revenge', 22, 23.2, 'impact'),
  cut('revenge-fall', 'The body falls', 'revenge', 23.2, 27, 'corpse'),
  cut('revenge-witnesses', 'They see what happened', 'revenge', 27, 30.5, 'survivors-group'),
  cut('revenge-you-next', 'You are next', 'revenge', 30.5, 34, 'point'),
  cut('revenge-three-reaction', 'Fear reaches the survivors', 'revenge', 34, 35.2, 'survivor-close'),
  cut('revenge-scatter', 'All three flee', 'revenge', 35.2, 36.5, 'run-group', 3.3, 2.1),
  cut('revenge-smile', 'Balu laughs', 'revenge', 39, 47, 'grin-push')
]);
