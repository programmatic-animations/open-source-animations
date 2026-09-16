import { createBear } from '../characters/bear.js';
import { createRabbit } from '../characters/rabbit.js';

const CHARACTER_FACTORIES = {
  bear: () => createBear(),

  rabbit: (config = {}) =>
    createRabbit({
      color: config.color,
      bellyColor: config.bellyColor,
      eyeColor: config.eyeColor
    })
};

export function createSceneCharacters(manifest) {
  const characters = {};

  for (const config of manifest) {
    const factory = CHARACTER_FACTORIES[config.type];

    if (!factory) {
      throw new Error(`Unknown character type: ${config.type}`);
    }

    characters[config.id] = factory(config);
  }

  return characters;
}