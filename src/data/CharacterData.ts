/**
 * Typed configuration for playable characters and their approved asset paths.
 */

export type CharacterId = 'lac-lac' | 'vit-co-don' | 'bo-sua';

export interface CharacterConfig {
  readonly id: CharacterId;
  readonly name: string;
  readonly description: string;
  readonly hp: number;
  readonly attack: number;
  readonly speed: number;
  readonly idleTexture: string;
  readonly walkTextures: readonly string[];
  readonly throwTexture: string;
}

export const DEFAULT_CHARACTER_ID: CharacterId = 'lac-lac';

export const CHARACTER_CONFIGS: readonly CharacterConfig[] = [
  {
    attack: 4,
    description: 'Đậu phộng dũng cảm,\nnhanh nhẹn và cân bằng.',
    hp: 4,
    id: 'lac-lac',
    idleTexture: '/assets/characters/lac-lac/idle.png',
    name: 'Lạc Lạc',
    speed: 4,
    throwTexture: '/assets/characters/lac-lac/throw.png',
    walkTextures: [],
  },
  {
    attack: 4,
    description: 'Nhanh nhẹn, di chuyển linh hoạt\nvà tấn công nhanh.',
    hp: 3,
    id: 'vit-co-don',
    idleTexture: '/assets/characters/vit-co-don/idle.png',
    name: 'Vịt Cô Đơn',
    speed: 4,
    throwTexture: '/assets/characters/vit-co-don/throw.png',
    walkTextures: [],
  },
  {
    attack: 4,
    description: 'Trâu bò, sức mạnh vượt trội\nvà trụ vững trước mọi thử thách.',
    hp: 5,
    id: 'bo-sua',
    idleTexture: '/assets/characters/bo-sua/idle.png',
    name: 'Bò Sữa',
    speed: 2,
    throwTexture: '/assets/characters/bo-sua/throw.png',
    walkTextures: [],
  },
];

/** Returns the character config for an id, falling back to the default character. */
export function getCharacterConfig(id: CharacterId): CharacterConfig {
  return (
    CHARACTER_CONFIGS.find((character) => character.id === id) ??
    CHARACTER_CONFIGS[0] ??
    (() => {
      throw new Error('At least one character configuration is required.');
    })()
  );
}
