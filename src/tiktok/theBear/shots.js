import { defineShots } from '../../runtime/shotTimeline.js';
import { HONEY_BETRAYAL_SHOTS } from '../../shots/honeyBetrayalShots.js';
// V5 gives each physical beat a distinct dramatic question. The source scenes
// retain their choreography; only the portrait edit and cameras change.
const cut = (id, title, world, from, to, framing, duration = to - from, verticalZoom = 256 / 81) => ({
  id, title, world, from, to, framing, duration, verticalZoom
});
const dealFraming = {
  conspiracy: 'rabbits', 'their-price': 'rabbit-leader', 'honey-insert': 'honey',
  agreement: 'bear', pickup: 'pickup', ladder: 'ladder', climb: 'climb',
  'honey-first': 'exchange', handover: 'exchange',
  betrayal: 'release', fall: 'fall', 'never-again': 'anger-push'
};
export const SHOTS = defineShots([
  cut('honey-hook', 'The temptation', 'trap', 0, 1.2, 'honey-hook', 1.2),
  cut('scent', 'Balu catches the scent', 'trap', 0, 2, 'scent', 2),
  cut('approach', 'He follows it', 'trap', 2, 4, 'approach', 2),
  cut('decision', 'He chooses the tree', 'trap', 5.7, 7.5, 'decision', 1.8),
  cut('climb-tree', 'He climbs', 'trap', 7.5, 11, 'climb-tree', 3.5),
  cut('branch-cross', 'The honey is close', 'trap', 11, 14.2, 'branch-cross', 2.7),
  cut('branch-warning', 'The branch gives way', 'trap', 14.2, 16.2, 'branch-warning', 1.9),
  cut('break', 'The branch breaks', 'trap', 16.2, 17.05, 'trap'),
  cut('landing', 'The impact', 'pit', 0, 1, 'pit-bear', 1),
  cut('brace', 'He struggles upright', 'pit', 1, 2.65, 'pit-brace', 1.65),
  cut('look-up', 'He hears something above', 'pit', 2.65, 4, 'pit-look', 1.35),
  cut('reveal', 'The rabbits appear', 'pit', 4, 6.35, 'pit-rabbits'),
  cut('laugh', 'They laugh at him', 'pit', 6.35, 9.5, 'pit-laugh'),
  ...HONEY_BETRAYAL_SHOTS.flatMap(s => {
    if (s.id === 'climb') return [
      cut('deal-climb', 'A way out', 'deal', s.start, s.start + 3, 'climb'),
      cut('deal-climb-hope', 'Almost there', 'deal', s.start + 3, s.end, 'climb-hope')
    ];
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
  cut('revenge-anger', 'A change inside Balu', 'revenge', 0, 2, 'revenge-anger', 0.8),
  cut('revenge-discovery', 'His hands are changing', 'revenge', 2, 4.5, 'discovery'),
  cut('revenge-fingers', 'The fingers emerge', 'revenge', 4.5, 10, 'fingers-push'),
  cut('revenge-weapon', 'He takes the branch', 'revenge', 10, 14, 'weapon'),
  cut('revenge-fire', 'The eyes ignite', 'revenge', 14, 17, 'fire'),
  cut('revenge-skeptical', 'They still do not understand', 'revenge', 17, 19, 'rabbits'),
  cut('revenge-spear', 'The throw', 'revenge', 19, 22, 'throw'),
  cut('revenge-impact', 'The strike', 'revenge', 22, 23.2, 'impact'),
  cut('revenge-fall', 'The body falls', 'revenge', 23.2, 27, 'corpse'),
  cut('revenge-witnesses', 'They see what happened', 'revenge', 27, 30.5, 'survivors-group', 2.6),
  cut('revenge-you-next', 'You are next', 'revenge', 30.5, 34, 'point'),
  cut('revenge-three-reaction', 'They look to one another', 'revenge', 34, 35.6, 'run-group', 1.4, 2.1),
  cut('revenge-scatter', 'All three flee', 'revenge', 35.6, 36.8, 'run-group', 0.9, 2.1),
  cut('revenge-smile', 'Balu laughs', 'revenge', 39, 47, 'grin-push')
]);
