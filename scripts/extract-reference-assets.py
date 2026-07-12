"""Extract exact visible sprites from the approved Village Defender reference sheet.

The script crops artwork from references/character-sheet.png and removes only the
connected dark-blue panel background around each crop. It does not redraw,
recolor, synthesize, or repair any missing artwork.
"""

from __future__ import annotations

from collections import deque
from dataclasses import dataclass
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
SOURCE_PATH = ROOT / "references" / "character-sheet.png"
PREVIEW_PATH = ROOT / "references" / "extracted-assets-preview.png"
OUTPUT_ROOT = ROOT / "public" / "assets"
PADDING = 16


@dataclass(frozen=True)
class ExtractSpec:
    """Describes one exact crop from the composite reference sheet."""

    name: str
    output: Path
    bbox: tuple[int, int, int, int]
    transparent: bool = True


SPECS: tuple[ExtractSpec, ...] = (
    ExtractSpec("Lac Lac idle", OUTPUT_ROOT / "characters/lac-lac/idle.png", (48, 106, 190, 268)),
    ExtractSpec("Lac Lac walk 1", OUTPUT_ROOT / "characters/lac-lac/walk-1.png", (280, 392, 370, 492)),
    ExtractSpec("Lac Lac walk 2", OUTPUT_ROOT / "characters/lac-lac/walk-2.png", (280, 392, 370, 492)),
    ExtractSpec("Lac Lac throw", OUTPUT_ROOT / "characters/lac-lac/throw.png", (424, 396, 552, 482)),
    ExtractSpec(
        "Vit Co Don idle",
        OUTPUT_ROOT / "characters/vit-co-don/idle.png",
        (238, 106, 388, 270),
    ),
    ExtractSpec(
        "Vit Co Don walk 1",
        OUTPUT_ROOT / "characters/vit-co-don/walk-1.png",
        (280, 510, 368, 594),
    ),
    ExtractSpec(
        "Vit Co Don walk 2",
        OUTPUT_ROOT / "characters/vit-co-don/walk-2.png",
        (280, 510, 368, 594),
    ),
    ExtractSpec(
        "Vit Co Don throw",
        OUTPUT_ROOT / "characters/vit-co-don/throw.png",
        (426, 510, 552, 592),
    ),
    ExtractSpec("Bo Sua idle", OUTPUT_ROOT / "characters/bo-sua/idle.png", (430, 88, 592, 276)),
    ExtractSpec("Bo Sua walk 1", OUTPUT_ROOT / "characters/bo-sua/walk-1.png", (282, 612, 366, 692)),
    ExtractSpec("Bo Sua walk 2", OUTPUT_ROOT / "characters/bo-sua/walk-2.png", (282, 612, 366, 692)),
    ExtractSpec("Bo Sua throw", OUTPUT_ROOT / "characters/bo-sua/throw.png", (424, 612, 552, 686)),
    ExtractSpec(
        "Quai Thuong idle",
        OUTPUT_ROOT / "enemies/quai-thuong/idle.png",
        (744, 404, 820, 492),
    ),
    ExtractSpec(
        "Quai Thuong walk",
        OUTPUT_ROOT / "enemies/quai-thuong/walk.png",
        (872, 404, 970, 492),
    ),
    ExtractSpec(
        "Quai Thuong hit",
        OUTPUT_ROOT / "enemies/quai-thuong/hit.png",
        (1008, 398, 1082, 488),
    ),
    ExtractSpec("Quai To idle", OUTPUT_ROOT / "enemies/quai-to/idle.png", (736, 512, 842, 594)),
    ExtractSpec("Quai To walk", OUTPUT_ROOT / "enemies/quai-to/walk.png", (874, 514, 976, 594)),
    ExtractSpec("Quai To hit", OUTPUT_ROOT / "enemies/quai-to/hit.png", (1006, 510, 1090, 594)),
    ExtractSpec("Quai Gai idle", OUTPUT_ROOT / "enemies/quai-gai/idle.png", (744, 618, 838, 694)),
    ExtractSpec("Quai Gai walk", OUTPUT_ROOT / "enemies/quai-gai/walk.png", (874, 618, 976, 694)),
    ExtractSpec("Quai Gai hit", OUTPUT_ROOT / "enemies/quai-gai/hit.png", (1006, 612, 1094, 694)),
    ExtractSpec("Dep Nem", OUTPUT_ROOT / "weapons/dep-nem.png", (1264, 120, 1486, 278)),
    ExtractSpec("Dep Nem impact", OUTPUT_ROOT / "weapons/dep-nem-impact.png", (1186, 550, 1368, 676)),
    ExtractSpec(
        "Vietnamese thatched house",
        OUTPUT_ROOT / "environment/vietnamese-thatched-house.png",
        (150, 718, 532, 966),
    ),
    ExtractSpec(
        "Countryside background",
        OUTPUT_ROOT / "environment/countryside-background.png",
        (14, 714, 1522, 1012),
        transparent=False,
    ),
)


def is_dark_blue_background(rgb: np.ndarray) -> np.ndarray:
    """Return pixels that look like the connected dark-blue panel background."""

    red = rgb[:, :, 0].astype(np.int16)
    green = rgb[:, :, 1].astype(np.int16)
    blue = rgb[:, :, 2].astype(np.int16)
    value = np.maximum.reduce([red, green, blue])

    blue_panel = (blue > red + 10) & (blue > green + 4) & (value < 125)
    very_dark_blue = (blue > red + 4) & (blue > green) & (value < 65)

    return blue_panel | very_dark_blue


def remove_connected_background(image: Image.Image) -> Image.Image:
    """Remove only border-connected dark-blue background pixels from a crop."""

    rgba = image.convert("RGBA")
    data = np.array(rgba)
    candidate = is_dark_blue_background(data[:, :, :3])
    height, width = candidate.shape
    removable = np.zeros((height, width), dtype=bool)
    queue: deque[tuple[int, int]] = deque()

    for x in range(width):
        if candidate[0, x]:
            queue.append((x, 0))
        if candidate[height - 1, x]:
            queue.append((x, height - 1))

    for y in range(height):
        if candidate[y, 0]:
            queue.append((0, y))
        if candidate[y, width - 1]:
            queue.append((width - 1, y))

    while queue:
        x, y = queue.popleft()

        if removable[y, x] or not candidate[y, x]:
            continue

        removable[y, x] = True

        if x > 0:
            queue.append((x - 1, y))
        if x < width - 1:
            queue.append((x + 1, y))
        if y > 0:
            queue.append((x, y - 1))
        if y < height - 1:
            queue.append((x, y + 1))

    data[removable, 3] = 0
    return Image.fromarray(data, "RGBA")


def trim_and_pad(image: Image.Image) -> Image.Image:
    """Trim transparent borders and add consistent transparent padding."""

    alpha = image.getchannel("A")
    bbox = alpha.getbbox()

    if bbox is None:
        return image

    trimmed = image.crop(bbox)
    padded = Image.new("RGBA", (trimmed.width + PADDING * 2, trimmed.height + PADDING * 2), (0, 0, 0, 0))
    padded.alpha_composite(trimmed, (PADDING, PADDING))

    return padded


def extract_asset(source: Image.Image, spec: ExtractSpec) -> Image.Image:
    """Crop and optionally alpha-mask one asset."""

    crop = source.crop(spec.bbox)

    if spec.transparent:
        return trim_and_pad(remove_connected_background(crop))

    return crop.convert("RGBA")


def draw_checkerboard(draw: ImageDraw.ImageDraw, origin: tuple[int, int], size: tuple[int, int]) -> None:
    """Draw a neutral checkerboard behind transparent preview sprites."""

    x0, y0 = origin
    width, height = size
    cell = 12

    for y in range(y0, y0 + height, cell):
        for x in range(x0, x0 + width, cell):
            color = (44, 52, 64) if ((x - x0) // cell + (y - y0) // cell) % 2 == 0 else (64, 72, 86)
            draw.rectangle((x, y, min(x + cell, x0 + width), min(y + cell, y0 + height)), fill=color)


def create_preview(extracted: list[tuple[ExtractSpec, Image.Image]]) -> None:
    """Create a contact sheet for human approval before integration."""

    columns = 5
    tile_width = 270
    tile_height = 190
    title_height = 54
    rows = (len(extracted) + columns - 1) // columns
    preview = Image.new("RGBA", (columns * tile_width, rows * tile_height + title_height), (18, 25, 36, 255))
    draw = ImageDraw.Draw(preview)
    font = ImageFont.load_default()

    draw.text(
        (18, 18),
        "Extracted reference assets preview - exact crops, transparent background where possible",
        fill=(240, 244, 248),
        font=font,
    )

    for index, (spec, sprite) in enumerate(extracted):
        col = index % columns
        row = index // columns
        x = col * tile_width
        y = title_height + row * tile_height
        draw.rectangle((x + 8, y + 8, x + tile_width - 8, y + tile_height - 8), outline=(97, 117, 142))
        draw_checkerboard(draw, (x + 14, y + 32), (tile_width - 28, tile_height - 58))

        max_width = tile_width - 44
        max_height = tile_height - 78
        scale = min(max_width / sprite.width, max_height / sprite.height, 1.0)
        display = sprite
        if scale < 1.0:
            display = sprite.resize(
                (max(1, round(sprite.width * scale)), max(1, round(sprite.height * scale))),
                Image.Resampling.LANCZOS,
            )

        px = x + (tile_width - display.width) // 2
        py = y + 42 + (max_height - display.height) // 2
        preview.alpha_composite(display, (px, py))
        draw.text((x + 14, y + 14), spec.name, fill=(255, 209, 102), font=font)
        draw.text((x + 14, y + tile_height - 22), f"{sprite.width}x{sprite.height}", fill=(190, 203, 217), font=font)

    PREVIEW_PATH.parent.mkdir(parents=True, exist_ok=True)
    preview.save(PREVIEW_PATH)


def main() -> None:
    """Extract all configured assets and create the approval preview sheet."""

    if not SOURCE_PATH.exists():
        raise FileNotFoundError(f"Missing reference image: {SOURCE_PATH}")

    source = Image.open(SOURCE_PATH).convert("RGB")
    extracted: list[tuple[ExtractSpec, Image.Image]] = []

    for spec in SPECS:
        image = extract_asset(source, spec)
        spec.output.parent.mkdir(parents=True, exist_ok=True)
        image.save(spec.output)
        extracted.append((spec, image))

    create_preview(extracted)
    print(f"Extracted {len(extracted)} assets")
    print(f"Preview: {PREVIEW_PATH.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
