param()

$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Drawing

$Frame = 64
$Root = Split-Path -Parent $PSScriptRoot
$SpriteDir = Join-Path $Root 'src/assets/sprites'
$BackgroundDir = Join-Path $Root 'src/assets/backgrounds'
New-Item -ItemType Directory -Force -Path $SpriteDir, $BackgroundDir | Out-Null

function New-Color([int]$hex, [int]$alpha = 255) {
  return [System.Drawing.Color]::FromArgb(
    $alpha,
    ($hex -shr 16) -band 255,
    ($hex -shr 8) -band 255,
    $hex -band 255
  )
}

function New-Brush([int]$hex, [int]$alpha = 255) {
  return [System.Drawing.SolidBrush]::new((New-Color $hex $alpha))
}

function New-Pen([int]$hex, [float]$width = 1.5, [int]$alpha = 255) {
  return [System.Drawing.Pen]::new((New-Color $hex $alpha), $width)
}

function New-RoundPath([float]$x, [float]$y, [float]$w, [float]$h, [float]$r) {
  $path = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $d = $r * 2
  $path.AddArc($x, $y, $d, $d, 180, 90)
  $path.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
  $path.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
  $path.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
  $path.CloseFigure()
  return $path
}

function Fill-RoundRect($g, [int]$color, [float]$x, [float]$y, [float]$w, [float]$h, [float]$r) {
  $brush = New-Brush $color
  $path = New-RoundPath $x $y $w $h $r
  $g.FillPath($brush, $path)
  $path.Dispose()
  $brush.Dispose()
}

function Stroke-RoundRect($g, [int]$color, [float]$x, [float]$y, [float]$w, [float]$h, [float]$r) {
  $pen = New-Pen $color 2
  $path = New-RoundPath $x $y $w $h $r
  $g.DrawPath($pen, $path)
  $path.Dispose()
  $pen.Dispose()
}

function Save-Bitmap($bitmap, [string]$path) {
  $bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $bitmap.Dispose()
}

function New-TransparentBitmap([int]$width, [int]$height) {
  $bitmap = [System.Drawing.Bitmap]::new($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.Clear([System.Drawing.Color]::Transparent)
  return @{ Bitmap = $bitmap; Graphics = $graphics }
}

function Draw-Eyes($g, [float]$x, [float]$y) {
  $white = New-Brush 0xffffff
  $black = New-Brush 0x111827
  $g.FillEllipse($white, $x, $y, 9, 10)
  $g.FillEllipse($white, $x + 12, $y, 9, 10)
  $g.FillEllipse($black, $x + 5, $y + 4, 3.4, 3.4)
  $g.FillEllipse($black, $x + 17, $y + 4, 3.4, 3.4)
  $white.Dispose()
  $black.Dispose()
}

function Draw-FlipFlop($g, [float]$angle, [float]$scale = 1.0) {
  $state = $g.Save()
  $g.TranslateTransform(32, 32)
  $g.RotateTransform($angle)
  $g.ScaleTransform($scale, $scale)
  $sole = New-Brush 0x8dbb22
  $edge = New-Pen 0x4c6f16 2
  $strap = New-Pen 0x365314 2
  $g.FillEllipse($sole, -24, -11, 48, 22)
  $g.DrawEllipse($edge, -24, -11, 48, 22)
  $g.DrawLine($strap, -10, -4, 0, 3)
  $g.DrawLine($strap, 10, -4, 0, 3)
  $g.DrawLine($strap, 0, 3, 0, 9)
  $sole.Dispose()
  $edge.Dispose()
  $strap.Dispose()
  $g.Restore($state)
}

function New-Sheet([string]$path, [int]$frames, [scriptblock]$drawFrame) {
  $canvas = New-TransparentBitmap ($Frame * $frames) $Frame
  $g = $canvas.Graphics
  for ($i = 0; $i -lt $frames; $i++) {
    $state = $g.Save()
    $g.TranslateTransform($i * $Frame, 0)
    & $drawFrame $g $i
    $g.Restore($state)
  }
  $g.Dispose()
  Save-Bitmap $canvas.Bitmap $path
}

function Draw-Peanut($g, [int]$frame) {
  $body = New-Brush 0xd98a23
  $shadow = New-Brush 0x0b1220 45
  $line = New-Pen 0x8b4f16 1.2
  $arm = New-Pen 0xd98a23 4
  $leg = New-Pen 0x8b4f16 3
  $walk = if ($frame % 2 -eq 0) { -2 } else { 2 }
  $throw = $frame -eq 3
  $g.FillEllipse($shadow, 18, 55, 28, 5)
  $g.FillEllipse($body, 17, 9, 30, 47)
  $g.DrawArc($line, 20, 10, 24, 42, 65, 230)
  $g.DrawLine($line, 30, 13, 30, 50)
  $g.DrawLine($line, 38, 17, 35, 48)
  Draw-Eyes $g 23 20
  if ($throw) {
    $g.DrawLine($arm, 44, 33, 58, 25)
    Draw-FlipFlop $g -12 0.48
  } else {
    $g.DrawLine($arm, 19, 34, 10, 41)
    $g.DrawLine($arm, 45, 34, 54, 41)
  }
  $g.DrawLine($leg, 25, 54, 22 + $walk, 61)
  $g.DrawLine($leg, 38, 54, 41 - $walk, 61)
  $body.Dispose(); $shadow.Dispose(); $line.Dispose(); $arm.Dispose(); $leg.Dispose()
}

function Draw-Duck($g, [int]$frame) {
  $body = New-Brush 0x9ac0ad
  $wing = New-Brush 0x739885
  $beak = New-Brush 0xf59e0b
  $line = New-Pen 0x547366 1.5
  $leg = New-Pen 0xf59e0b 3
  $walk = if ($frame % 2 -eq 0) { -2 } else { 2 }
  $throw = $frame -eq 3
  $g.FillEllipse($body, 18, 18, 31, 34)
  $g.FillEllipse($body, 23, 7, 25, 23)
  $g.FillEllipse($wing, 18, 30, 15, 17)
  $g.FillPie($beak, 42, 18, 16, 10, -25, 70)
  Draw-Eyes $g 29 13
  if ($throw) { Draw-FlipFlop $g -8 0.48 } else { $g.DrawArc($line, 12, 27, 14, 18, 95, 120) }
  $g.DrawLine($leg, 29, 51, 27 + $walk, 60)
  $g.DrawLine($leg, 40, 51, 43 - $walk, 60)
  $body.Dispose(); $wing.Dispose(); $beak.Dispose(); $line.Dispose(); $leg.Dispose()
}

function Draw-Cow($g, [int]$frame) {
  $white = New-Brush 0xf8fafc
  $black = New-Brush 0x1f2937
  $pink = New-Brush 0xf4a7a7
  $horn = New-Brush 0xfacc15
  $leg = New-Pen 0x1f2937 3
  $walk = if ($frame % 2 -eq 0) { -2 } else { 2 }
  $throw = $frame -eq 3
  $g.FillEllipse($white, 14, 13, 38, 42)
  $g.FillEllipse($black, 16, 20, 13, 17)
  $g.FillEllipse($black, 39, 31, 10, 13)
  $g.FillEllipse($pink, 23, 31, 22, 15)
  $g.FillPolygon($horn, @([System.Drawing.PointF]::new(20, 15), [System.Drawing.PointF]::new(14, 7), [System.Drawing.PointF]::new(26, 12)))
  $g.FillPolygon($horn, @([System.Drawing.PointF]::new(44, 15), [System.Drawing.PointF]::new(50, 7), [System.Drawing.PointF]::new(38, 12)))
  Draw-Eyes $g 23 18
  if ($throw) { Draw-FlipFlop $g -8 0.48 }
  $g.DrawLine($leg, 24, 53, 22 + $walk, 61)
  $g.DrawLine($leg, 40, 53, 43 - $walk, 61)
  $white.Dispose(); $black.Dispose(); $pink.Dispose(); $horn.Dispose(); $leg.Dispose()
}

function Draw-EnemyNormal($g, [int]$frame) {
  $color = if ($frame -eq 3) { 0x9f3330 } else { 0xb94b48 }
  Fill-RoundRect $g $color 18 16 30 39 8
  Stroke-RoundRect $g 0x6f2829 18 16 30 39 8
  if ($frame -eq 3) {
    $pen = New-Pen 0xffffff 2
    $g.DrawLine($pen, 27, 27, 34, 34)
    $g.DrawLine($pen, 34, 27, 27, 34)
    $g.DrawLine($pen, 40, 27, 46, 34)
    $g.DrawLine($pen, 46, 27, 40, 34)
    $pen.Dispose()
  } else {
    Draw-Eyes $g 25 25
  }
}

function Draw-EnemyBig($g, [int]$frame) {
  $body = New-Brush 0x87529b
  $dark = New-Pen 0x4b2c5d 2
  for ($i = 0; $i -lt 9; $i++) {
    $dot = New-Brush 0xaa6dbf 180
    $g.FillEllipse($dot, 10 + (($i * 11) % 42), 10 + (($i * 17) % 44), 5, 5)
    $dot.Dispose()
  }
  $g.FillEllipse($body, 12, 13, 42, 42)
  $g.DrawEllipse($dark, 12, 13, 42, 42)
  if ($frame -eq 3) {
    $pen = New-Pen 0xffffff 2
    $g.DrawLine($pen, 25, 28, 31, 34)
    $g.DrawLine($pen, 31, 28, 25, 34)
    $g.DrawLine($pen, 39, 28, 45, 34)
    $g.DrawLine($pen, 45, 28, 39, 34)
    $pen.Dispose()
  } else {
    Draw-Eyes $g 24 24
    $mouth = New-Pen 0x111827 2
    $g.DrawArc($mouth, 25, 35, 18, 9, 200, 140)
    $mouth.Dispose()
  }
  $body.Dispose(); $dark.Dispose()
}

function Draw-EnemySpike($g, [int]$frame) {
  $body = New-Brush 0x63752d
  $dark = New-Pen 0x314015 2
  $horn = New-Brush 0xf59e0b
  $g.FillPolygon($horn, @([System.Drawing.PointF]::new(18, 18), [System.Drawing.PointF]::new(15, 6), [System.Drawing.PointF]::new(26, 14)))
  $g.FillPolygon($horn, @([System.Drawing.PointF]::new(45, 18), [System.Drawing.PointF]::new(49, 6), [System.Drawing.PointF]::new(38, 14)))
  $g.FillEllipse($body, 12, 14, 42, 42)
  $g.DrawEllipse($dark, 12, 14, 42, 42)
  $eyeWhite = New-Brush 0xffffff
  $eyeBlack = New-Brush 0x111827
  $g.FillEllipse($eyeWhite, 27, 22, 13, 13)
  $g.FillEllipse($eyeBlack, 32, 27, 4, 4)
  if ($frame -gt 1) {
    $mouth = New-Pen 0xffffff 2
    $g.DrawArc($mouth, 24, 38, 17, 9, 205, 130)
    $mouth.Dispose()
  }
  $body.Dispose(); $dark.Dispose(); $horn.Dispose(); $eyeWhite.Dispose(); $eyeBlack.Dispose()
}

function New-House() {
  $canvas = New-TransparentBitmap 256 192
  $g = $canvas.Graphics
  $wood = New-Brush 0xa86f32
  $darkWood = New-Pen 0x5f3d1f 2
  $roof = New-Brush 0x8f6427
  $thatch = New-Pen 0xd5a253 2
  $g.FillRectangle($wood, 38, 82, 174, 78)
  for ($x = 45; $x -le 200; $x += 18) { $g.DrawLine($darkWood, $x, 84, $x, 158) }
  $g.FillPolygon($roof, @(
    [System.Drawing.PointF]::new(24, 86),
    [System.Drawing.PointF]::new(124, 28),
    [System.Drawing.PointF]::new(226, 86)
  ))
  for ($x = 32; $x -le 216; $x += 12) { $g.DrawLine($thatch, $x, 84, $x + 68, 47) }
  Fill-RoundRect $g 0x4b2e1b 103 112 37 48 2
  Fill-RoundRect $g 0x332016 58 108 34 26 2
  Fill-RoundRect $g 0x332016 156 108 34 26 2
  $g.DrawLine($darkWood, 30, 160, 224, 160)
  $g.DrawLine($darkWood, 64, 160, 64, 178)
  $g.DrawLine($darkWood, 188, 160, 188, 178)
  $wood.Dispose(); $darkWood.Dispose(); $roof.Dispose(); $thatch.Dispose()
  $g.Dispose()
  Save-Bitmap $canvas.Bitmap (Join-Path $SpriteDir 'house-vietnam.png')
}

function New-Background() {
  $bitmap = [System.Drawing.Bitmap]::new(1280, 720, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($bitmap)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $sky = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
    [System.Drawing.Rectangle]::new(0, 0, 1280, 720),
    (New-Color 0x0f2033),
    (New-Color 0x28435b),
    [System.Drawing.Drawing2D.LinearGradientMode]::Vertical
  )
  $g.FillRectangle($sky, 0, 0, 1280, 720)
  $moon = New-Brush 0xf7c76d
  $g.FillEllipse($moon, 1045, 94, 44, 44)
  $hill = New-Brush 0x17314a 220
  $g.FillEllipse($hill, 720, 485, 720, 260)
  $g.FillEllipse($hill, -80, 500, 620, 240)
  $ground = New-Brush 0x2f5f42
  $soil = New-Brush 0x5a3b24
  $g.FillRectangle($ground, 0, 510, 1280, 132)
  $g.FillRectangle($soil, 0, 642, 1280, 78)
  $bamboo = New-Pen 0x8dbb55 6
  for ($x = 32; $x -lt 190; $x += 22) {
    $g.DrawLine($bamboo, $x, 300, $x + 18, 518)
    $leaf = New-Brush 0x3f7d3f 180
    $g.FillEllipse($leaf, $x - 18, 320, 42, 13)
    $leaf.Dispose()
  }
  $fencePen = New-Pen 0x95612f 5
  for ($x = 0; $x -lt 1280; $x += 58) {
    $g.DrawLine($fencePen, $x, 505, $x, 574)
  }
  $g.DrawLine($fencePen, 0, 528, 1280, 528)
  $g.DrawLine($fencePen, 0, 558, 1280, 558)
  $sky.Dispose(); $moon.Dispose(); $hill.Dispose(); $ground.Dispose(); $soil.Dispose(); $bamboo.Dispose(); $fencePen.Dispose()
  $g.Dispose()
  Save-Bitmap $bitmap (Join-Path $BackgroundDir 'vietnam-village.png')
}

New-Sheet (Join-Path $SpriteDir 'player-peanut.png') 4 ${function:Draw-Peanut}
New-Sheet (Join-Path $SpriteDir 'player-duck.png') 4 ${function:Draw-Duck}
New-Sheet (Join-Path $SpriteDir 'player-cow.png') 4 ${function:Draw-Cow}
New-Sheet (Join-Path $SpriteDir 'enemy-normal.png') 4 ${function:Draw-EnemyNormal}
New-Sheet (Join-Path $SpriteDir 'enemy-big.png') 4 ${function:Draw-EnemyBig}
New-Sheet (Join-Path $SpriteDir 'enemy-spike.png') 4 ${function:Draw-EnemySpike}
New-Sheet (Join-Path $SpriteDir 'weapon-flipflop.png') 8 { param($g, $i) Draw-FlipFlop $g ($i * 45) 0.82 }
New-House
New-Background

Write-Host "Generated Village Defender assets in $SpriteDir and $BackgroundDir"
