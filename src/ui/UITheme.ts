/**
 * Shared UI colors and typography for village-themed menus and panels.
 */

export type GameButtonVariant = 'danger' | 'primary' | 'secondary';

export interface GameButtonPalette {
  readonly border: number;
  readonly disabled: number;
  readonly fill: number;
  readonly hover: number;
  readonly pressed: number;
  readonly shadow: number;
  readonly text: number;
}

export type StatBarVariant = 'green' | 'red' | 'yellow';

export const SELECTION_LAYOUT = {
  screenWidth: 1280,
  screenHeight: 720,
  titleY: 72,
  subtitleY: 142,
  cardsTop: 172,
  cardsBottom: 622,
  footerY: 684,
  outerMarginX: 48,
  cardGap: 36,
  selectedScale: 1.02,
  hoverScale: 1.012,
} as const;

export const CHARACTER_CARD_LAYOUT = {
  width: 330,
  height: 430,
  radius: 24,
  glowPadding: 10,
  headerTop: 18,
  headerHeight: 56,
  headerWidth: 270,
  previewTop: 82,
  previewHeight: 210,
  previewWidth: 260,
  spriteBaselineY: 284,
  pedestalY: 256,
  statsTop: 300,
  statsHeight: 74,
  statsWidth: 280,
  statRowHeight: 23,
  descriptionTop: 382,
  descriptionHeight: 40,
  paddingX: 18,
} as const;

export const WEAPON_CARD_LAYOUT = {
  width: 330,
  height: 430,
  radius: 22,
  glowPadding: 10,
  headerTop: 18,
  headerHeight: 52,
  headerWidth: 238,
  previewTop: 76,
  previewHeight: 150,
  previewWidth: 272,
  descriptionTop: 232,
  descriptionHeight: 48,
  statsTop: 286,
  statsHeight: 100,
  statsWidth: 268,
  statsRowHeight: 24,
  featureTop: 392,
  featureHeight: 30,
  paddingX: 18,
} as const;

export const TITLE_BANNER_LAYOUT = {
  characterWidth: 720,
  weaponWidth: 560,
  height: 86,
} as const;

export const UI_THEME = {
  button: {
    danger: {
      border: 0x5c351b,
      disabled: 0x7b6a58,
      fill: 0x9a5f29,
      hover: 0xb87434,
      pressed: 0x76451f,
      shadow: 0x3a2417,
      text: 0xfff7df,
    },
    primary: {
      border: 0x6b3f1f,
      disabled: 0x9b8664,
      fill: 0xf2a63b,
      hover: 0xffbd4a,
      pressed: 0xd88728,
      shadow: 0x4a2a18,
      text: 0x3b2414,
    },
    secondary: {
      border: 0x31512a,
      disabled: 0x73836f,
      fill: 0x6fb347,
      hover: 0x82c957,
      pressed: 0x568c37,
      shadow: 0x24381f,
      text: 0xfff7df,
    },
  } satisfies Record<GameButtonVariant, GameButtonPalette>,
  panel: {
    border: 0x5c351b,
    fill: 0xa6632b,
    highlight: 0xd08a3d,
    shadow: 0x2c1a10,
  },
  selectionCard: {
    bodyFill: 0x132218,
    bodyFillStrong: 0x172820,
    shadow: 0x050908,
    selectedGlow: 0xffe783,
    selectedStroke: 0xffd85a,
  },
  statBar: {
    background: 0x332b21,
    green: 0x9fca2e,
    red: 0xe04a36,
    yellow: 0xd99a30,
  } satisfies Record<StatBarVariant | 'background', number>,
  text: {
    dark: 0x3b2414,
    light: 0xfff7df,
    muted: 0x6f4a2f,
  },
} as const;
