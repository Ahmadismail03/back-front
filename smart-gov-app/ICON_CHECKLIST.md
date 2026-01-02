# App Icon Quality Checklist

Before deploying to stores, verify your icons meet these requirements:

## File Requirements

### icon.png
- [ ] Dimensions: Exactly 1024×1024 pixels
- [ ] Format: PNG
- [ ] Transparency: YES (transparent background)
- [ ] Content: Logo centered, ~70-80% of canvas
- [ ] No shadows baked into image
- [ ] No white/gray background pixels
- [ ] Sharp edges (no blur)
- [ ] File size: Reasonable (~50-500KB)

### adaptive-foreground.png
- [ ] Dimensions: Exactly 1024×1024 pixels
- [ ] Format: PNG
- [ ] Transparency: YES (fully transparent background)
- [ ] Content: Logo in safe zone (center 66%)
- [ ] Logo size: ~60-65% of canvas
- [ ] No shadows baked into image
- [ ] No background color at all
- [ ] Accounts for circular/rounded crops

## Visual Quality

### Open icon.png in image editor:
- [ ] Checkerboard pattern visible behind logo (confirms transparency)
- [ ] No white rectangle around logo
- [ ] No gray shadow on logo itself
- [ ] Logo is sharp and clear
- [ ] Colors match your brand
- [ ] Logo is centered

### Open adaptive-foreground.png in image editor:
- [ ] Checkerboard pattern visible everywhere except logo
- [ ] Logo fits in center circle (safe zone)
- [ ] Logo won't be cut off by Android shapes
- [ ] No background artifacts

## app.json Configuration

- [ ] `"icon": "./assets/icon.png"`
- [ ] `android.adaptiveIcon.foregroundImage: "./assets/adaptive-foreground.png"`
- [ ] `android.adaptiveIcon.backgroundColor: "#FFFFFF"` (or your brand color)
- [ ] Background color is NOT in the PNG files themselves
- [ ] Paths are correct and files exist

## Device Testing

### Android
- [ ] Icon appears clean on home screen
- [ ] Icon appears clean in app drawer
- [ ] Icon appears clean in settings
- [ ] No white box around icon
- [ ] No double shadow
- [ ] OS shadow looks natural
- [ ] Icon works in all launcher shapes (circle, rounded square, squircle)

### iOS
- [ ] Icon appears with rounded corners
- [ ] Icon is clean and sharp
- [ ] No white box
- [ ] No baked shadow
- [ ] Works on light and dark mode home screens

## Store Listing

### Google Play Store
- [ ] Icon looks professional in store listing
- [ ] Icon stands out among other apps
- [ ] Icon is recognizable at small sizes
- [ ] Background color complements logo

### Apple App Store
- [ ] Icon looks professional in store listing
- [ ] Icon follows iOS design guidelines
- [ ] Icon is recognizable at all sizes
- [ ] No transparency issues

## Comparison Check

Compare your icon side-by-side with professional apps:
- [ ] WhatsApp
- [ ] Instagram
- [ ] Google Maps
- [ ] Gmail

Your icon should have the same "clean, professional" look with:
- No baked shadows
- Clean edges
- Proper sizing
- OS-handled shadows only

## Common Issues to Avoid

❌ **Don't**:
- Bake shadows into the PNG
- Use logo at 100% size (needs margins)
- Include white/gray background in PNG
- Make logo too small (wasted space)
- Use JPEG format
- Use low-resolution source

✅ **Do**:
- Use transparent PNGs
- Center logo with proper margins
- Let OS handle shadows
- Test on real devices
- Use high-quality source logo
- Follow platform guidelines

## If Issues Found

1. **White box showing**: PNG background not transparent
   - Solution: Re-export with transparency enabled

2. **Logo cut off**: Logo too large for safe zone
   - Solution: Scale down to 60-65% of canvas

3. **Blurry icon**: Source resolution too low
   - Solution: Use higher resolution source, export at 1024×1024

4. **Shadow looks wrong**: Shadow baked into PNG
   - Solution: Remove shadow from PNG, let OS handle it

5. **Icon too small**: Logo scaled too conservatively
   - Solution: Increase to 70-80% of canvas

---

**Final Check**: Place your phone next to a friend's phone with WhatsApp/Instagram. Your icon should look equally professional and clean.

If not, iterate until it does. Users judge apps by their icons!
