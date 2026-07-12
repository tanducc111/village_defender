# Village Defender Assets

This folder contains project-local placeholder PNG assets generated for the portfolio build.

- `backgrounds/vietnam-village.png`: simple Vietnamese village playfield background
- `sprites/player-peanut.png`: player sprite sheet
- `sprites/player-duck.png`: alternate player sprite sheet
- `sprites/player-cow.png`: alternate player sprite sheet
- `sprites/enemy-normal.png`: normal enemy sprite sheet
- `sprites/enemy-big.png`: large enemy sprite sheet
- `sprites/enemy-spike.png`: spiky enemy sprite sheet
- `sprites/weapon-flipflop.png`: flip-flop projectile sprite sheet
- `sprites/house-vietnam.png`: village house/base sprite

Sprite sheets use 64x64 frames unless otherwise noted. The current game loads these files through `AssetLoader` and slices frame textures at runtime.
