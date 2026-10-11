# Lennon

The site is two parts: the **Project Gallery** and the **Services**.

It opens in the sky: big black LENNON HELMAN, with SOFTWARE ENGINEER · GREENCASTLE, PA under it, over blue sky and slowly drifting clouds. The letters rise in one by one, the subtitle fades in after them, and the name keeps a gentle bob (drawn on canvas, so the letters stay sharp at any size). Scrolling flies the camera into the O of LENNON until its middle fills the screen, on through the clouds and a brief white-out, then down from high above a lawn onto the open laptop. One scroll plays the whole flight down to the laptop, and one scroll up at the laptop flies back up to the sky.

Then comes the Project Gallery: a heavy white PROJECT GALLERY headline over a real-time 3D MacBook (three.js, in `mac/`), built to a MacBook Air's measurements in Space Gray, lying open on a sunny lawn and seen from above. The lawn (`mac/src/grass.js`) is a painted grass ground under tens of thousands of 3D blades that sway gently, with daisies scattered through it. The sun throws the laptop's shadow across the grass, and the aluminium reflects the sky. The display shows Lennon's project screenshots flowing along a curved strip. Next to the laptop stands a modern two-storey house (`mac/src/house.js`, modelled in 3D like the laptop) built to look real: white lap siding with real relief and shadow lines, white corner boards and a concrete foundation, black flat roofs with deep fascias and soffit lights, black aluminium windows with sashes and sills, a frosted glass garage door, a full-glass front door with a steel pull and wall lights, and a balcony with cedar trim, composite decking and a steel cable railing. Its glass and metal reflect a real sky (a Poly Haven HDRI); the glass is see-through, with curtained rooms behind it; corners, the ground and the undersides of the overhangs get the soft shading of bounced light. Shrubs, lavender and trees stand round it under a blue sky with soft clouds. At the laptop, one scroll flies the camera back across the lawn to take in the house, over the balcony rail and in through the open door to the upstairs office, stopping square on to a whiteboard in the middle of its back wall, where the services are written out in marker as you arrive (websites, bug fixes and electronics, with doodles, and lenodrips@gmail.com boxed at the bottom; the board stands upright on a phone held upright so the writing is big enough to read), with a **Start a project** button under it; one scroll up flies back to the laptop. The office is lit by the daylight from its door and windows: an oak floor, an aluminium-framed whiteboard with markers in its tray and a picture light over it, a real potted plant and velvet armchair (models from the Khronos glTF samples), a low oak cabinet with books and a lamp, a desk and a rug. The house's assets are in `mac/assets/`, with their credits in `mac/assets/CREDITS.md`. To keep it smooth: the house's surfaces are painted and its sky decoded in a background worker (`mac/src/paint.js`), everything about it is compiled and put on the GPU while the visitor is still up in the sky, the grass blades are only drawn near the laptop, and the 3D view renders within a pixel budget that drops automatically (and comes back) if frames run slow. A pill of two buttons in the top middle, **project gallery** and **services**, goes to the laptop or the office (the services aren't on the page for now).

The showreel compositions (`reel/`, `reel-portrait/`) and their rendered videos (`media/`) are still in the repository but no longer on the page; `reel/fonts/` holds the League Spartan files the page uses.

**Live site:** http://lennonh.com/

## Files

| Path | What it is |
|---|---|
| `index.html` | The page: the showreel, the MacBook section and the services page, plus the navigation. |
| `media/` | The showreel rendered to video (WebM and MP4, 1080p and 720p) and its poster and end-card stills. |
| `mac/` | The 3D MacBook. `src/mac.js` is the source; `mac.min.js` is it bundled with three.js (`cd mac && npm install && npm run build`). |
| `info/info.css` | The services page's styles. |
| `fonts/` | Readex Pro (regular) for the navigation bar, self-hosted. |
| `img/work/` | Lennon's project screenshots, shown on the MacBook's display. |
| `reel-portrait/` | The 9:16 showreel composition for upright phones. |
| `framer/` | The earlier foldable-phone section as a Framer code component, with paste instructions in `framer/README.md`. |
| `reel/index.html` | The showreel composition (12.65 s, 1920×1080, one GSAP timeline). |
| `reel/vendor/`, `reel/fonts/` | GSAP 3.14.2 and League Spartan (medium, bold, black), self-hosted. |
| `.well-known/security.txt` | Where to report security issues. |
| `.github/workflows/deploy.yml` | Publishes the site to GitHub Pages. |

## Edit the showreel

Change the text or timing in `reel/index.html`, check it, then render it to video and re-encode it for the web:

```bash
cd reel && npx hyperframes check . && npx hyperframes render . -o /tmp/reel.mp4 --fps 30 --quality delivery && cd ..
ffmpeg -y -i /tmp/reel.mp4 -c:v libvpx-vp9 -b:v 0 -crf 34 -row-mt 1 -an media/reel.webm
ffmpeg -y -i /tmp/reel.mp4 -vf scale=1280:-2 -c:v libvpx-vp9 -b:v 0 -crf 35 -row-mt 1 -an media/reel-720.webm
ffmpeg -y -i /tmp/reel.mp4 -c:v libx264 -preset slow -crf 23 -pix_fmt yuv420p -movflags +faststart -an media/reel.mp4
ffmpeg -y -i /tmp/reel.mp4 -vf scale=1280:-2 -c:v libx264 -preset slow -crf 24 -pix_fmt yuv420p -movflags +faststart -an media/reel-720.mp4
ffmpeg -y -ss 0.9 -i /tmp/reel.mp4 -frames:v 1 -q:v 4 media/reel-poster.jpg
ffmpeg -y -ss 11.5 -i /tmp/reel.mp4 -frames:v 1 -q:v 4 media/reel-end.jpg
```

## Deploying

Every push to the `claude/gifted-pascal-xbq24p` branch runs `deploy.yml`, which copies the files into `_site` and publishes them to GitHub Pages.

The previous portfolio (photo sphere, night sky, projects, legal pages) is still in the git history if you want it back.
