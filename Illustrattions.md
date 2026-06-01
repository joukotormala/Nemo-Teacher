What's new
1. Image generation now works — 
generate-image/route.ts

Switched from broken Gemini Imagen 4 → NVIDIA FLUX-schnell (uses your existing NVIDIA_API_KEY)
The broken image icon is also fixed — SVG placeholder always renders properly now
2. New "Illustrations" tab in Admin — go to /admin → click Illustrations

Generator form: fill in 3 fields and click Generate & Save:
Concept / Filename — e.g. skeleton
Folder — pick from a dropdown (science/biology, math, lab_tech, etc.)
Image Prompt — e.g. A clear labeled diagram of the human skeletal system, educational style
After generation (~15s), it shows:
A preview of the generated image
The exact ILLUSTRATION_MAP entry to copy-paste into 
page.tsx
 (one click to copy)
Gallery — shows all existing illustrations in a scrollable grid
3. New admin API — 
/api/admin/illustrations

Generates via NVIDIA FLUX and permanently saves to the correct public/illustrations/ subfolder
Also lists all existing illustration files for the gallery