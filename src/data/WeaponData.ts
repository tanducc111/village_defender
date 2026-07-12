/**
 * Typed configuration for selectable weapons and their approved runtime assets.
 */

export type WeaponId = 'slipper' | 'bamboo' | 'plastic-chair';

export type WeaponStatId = 'area' | 'damage' | 'range' | 'speed';

export interface WeaponStat {
  readonly id: WeaponStatId;
  readonly label: string;
  readonly value: number;
}

export interface WeaponDisplayConfig {
  readonly impactScale: number;
  readonly projectileScale: number;
  readonly rotationSpeed: number;
}

export interface WeaponDefinition {
  readonly accentColor: number;
  readonly damage: number;
  readonly description: string;
  readonly display: WeaponDisplayConfig;
  readonly feature: string;
  readonly fireRate: number;
  readonly id: WeaponId;
  readonly impactTexture: string;
  readonly name: string;
  readonly projectileTexture: string;
  readonly range: number;
  readonly speed: number;
  readonly stats: readonly WeaponStat[];
}

export const DEFAULT_WEAPON_ID: WeaponId = 'slipper';

export const WEAPON_DEFINITIONS: readonly WeaponDefinition[] = [
  {
    accentColor: 0x9fca2e,
    damage: 1,
    description: 'Dép nhựa huyền thoại,\nbay nhanh và dễ trúng.',
    display: {
      impactScale: 1.15,
      projectileScale: 1.35,
      rotationSpeed: 14,
    },
    feature: 'Bay nhanh,\nphù hợp để tiêu diệt từng mục tiêu.',
    fireRate: 6,
    id: 'slipper',
    impactTexture: '/assets/weapons/slipper/impact.png',
    name: 'Dép tổ ong',
    projectileTexture: '/assets/weapons/slipper/idle.png',
    range: 1280,
    speed: 700,
    stats: [
      { id: 'range', label: 'Tầm xa', value: 5 },
      { id: 'damage', label: 'Sát thương', value: 2 },
      { id: 'speed', label: 'Tốc độ', value: 5 },
      { id: 'area', label: 'Phạm vi', value: 3 },
    ],
  },
  {
    accentColor: 0xd99a30,
    damage: 2,
    description: 'Điếu cày quen thuộc,\nđánh xa và sát thương cao.',
    display: {
      impactScale: 1.15,
      projectileScale: 1.25,
      rotationSpeed: 9,
    },
    feature: 'Sát thương mạnh,\nném xa,\nđường bay ổn định.',
    fireRate: 4,
    id: 'bamboo',
    impactTexture: '/assets/weapons/bamboo/impact.png',
    name: 'Điếu cày',
    projectileTexture: '/assets/weapons/bamboo/idle.png',
    range: 1280,
    speed: 560,
    stats: [
      { id: 'range', label: 'Tầm xa', value: 5 },
      { id: 'damage', label: 'Sát thương', value: 4 },
      { id: 'speed', label: 'Tốc độ', value: 3 },
      { id: 'area', label: 'Phạm vi', value: 3 },
    ],
  },
  {
    accentColor: 0xe04a36,
    damage: 3,
    description: 'Chiếc ghế đỏ quen thuộc,\nnặng nhưng rất uy lực.',
    display: {
      impactScale: 1.25,
      projectileScale: 1.3,
      rotationSpeed: 7,
    },
    feature: 'Sát thương cao,\nném mạnh,\nphù hợp khi quái đông.',
    fireRate: 3,
    id: 'plastic-chair',
    impactTexture: '/assets/weapons/plastic-chair/impact.png',
    name: 'Ghế nhựa',
    projectileTexture: '/assets/weapons/plastic-chair/idle.png',
    range: 900,
    speed: 430,
    stats: [
      { id: 'range', label: 'Tầm xa', value: 2 },
      { id: 'damage', label: 'Sát thương', value: 5 },
      { id: 'speed', label: 'Tốc độ', value: 2 },
      { id: 'area', label: 'Phạm vi', value: 4 },
    ],
  },
];

/** Returns the weapon config for an id, falling back to the default weapon. */
export function getWeaponDefinition(id: WeaponId): WeaponDefinition {
  return (
    WEAPON_DEFINITIONS.find((weapon) => weapon.id === id) ??
    WEAPON_DEFINITIONS[0] ??
    (() => {
      throw new Error('At least one weapon definition is required.');
    })()
  );
}
