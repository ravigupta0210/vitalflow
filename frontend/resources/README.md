# VitalFlow App Resources

This folder contains the source assets for the app icon and splash screen.

## Generating App Icons and Splash Screens

### Option 1: Using Capacitor Assets (Recommended)

1. Convert SVGs to PNGs at the required sizes:
   - `icon.png` - 1024x1024 pixels
   - `splash.png` - 2732x2732 pixels

2. Run the Capacitor assets generator:
   ```bash
   npx @capacitor/assets generate --iconBackgroundColor '#0f172a'
   ```

### Option 2: Manual Generation

#### Icon Sizes Needed:

**Android:**
- `mipmap-mdpi`: 48x48
- `mipmap-hdpi`: 72x72
- `mipmap-xhdpi`: 96x96
- `mipmap-xxhdpi`: 144x144
- `mipmap-xxxhdpi`: 192x192

**iOS:**
- 20x20 (1x, 2x, 3x)
- 29x29 (1x, 2x, 3x)
- 40x40 (1x, 2x, 3x)
- 60x60 (2x, 3x)
- 76x76 (1x, 2x)
- 83.5x83.5 (2x)
- 1024x1024 (App Store)

### Converting SVG to PNG

You can use various tools:

1. **Online Tools:**
   - [CloudConvert](https://cloudconvert.com/svg-to-png)
   - [SVG to PNG Converter](https://svgtopng.com/)

2. **Command Line (using Inkscape):**
   ```bash
   inkscape -w 1024 -h 1024 icon.svg -o icon.png
   inkscape -w 2732 -h 2732 splash.svg -o splash.png
   ```

3. **Command Line (using ImageMagick):**
   ```bash
   convert -background none -resize 1024x1024 icon.svg icon.png
   convert -background none -resize 2732x2732 splash.svg splash.png
   ```

## Design Specifications

### Color Palette
- Background: `#0f172a` (Dark slate)
- Primary: `#06b6d4` (Cyan)
- Secondary: `#14b8a6` (Teal)

### Icon Design
- Activity/pulse line representing health tracking
- Gradient from cyan to teal
- Dark background for contrast
- Rounded corners (180px radius at 1024px)

### Splash Screen Design
- Same dark background
- Centered logo with subtle background circle
- App name "VitalFlow" below logo
- Tagline "Your Personal Health Companion"
