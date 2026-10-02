import { visemeAt } from '../../rigs/nativeMouth.js';

/** Speech owns only an existing native mouth's bounded surface controls.
 * No geometry, body joint, head transform or prop is created or animated.
 * Cues and time are recording-relative; callers own timeline placement.
 */
export function createSpeak({ mouth, cues }) {
  if (!mouth?.update || !Array.isArray(cues)) throw new Error('Speech requires native mouth anatomy and timed cues');
  return {
    update(localTime, controls = {}) {
      if (!Number.isFinite(localTime)) throw new RangeError('Speech time must be finite');
      const state = visemeAt(cues, localTime);
      return { ...mouth.update(state, controls), phase: state.shape === 'X' ? 'rest' : 'speaking' };
    }
  };
}
