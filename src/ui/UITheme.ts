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
  text: {
    dark: 0x3b2414,
    light: 0xfff7df,
    muted: 0x6f4a2f,
  },
} as const;
