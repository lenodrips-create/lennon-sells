# Lennon

The whole site is one full-screen animation: a 13-second [HyperFrames](https://github.com/heygen-com/hyperframes) showreel that covers the whole screen (on portrait phones it fits the width instead, so nothing important is cropped). It opens on LENNON HELMAN, then two chapters (code and build), joined by an orange circle iris, alternating stripes, and dots that swell to fill the frame before a skewed black panel sweeps into the end card (Lennon Helman, software developer, Greencastle, PA). It loops. The compositions in `reel/` (16:9) and `reel-portrait/` (9:16) are rendered to video in `media/`, so the device's video hardware plays them. Upright phones such as iPhones get the vertical cut, which fills the screen; landscape screens get the 16:9 one, at 720p on small screens. Nothing loads from outside the site. Visitors who prefer reduced motion see the end card.

The page never scrolls natively. It has four stops (reel, laptop, folded phone, unfolded phone), and each wheel gesture, swipe or arrow key moves exactly one stop. Every layer animates with transforms only, and the animation loop sleeps when nothing is moving.

A **Menu** button sits in the top-right corner on every screen. It's light over dark screens and dark over the white laptop page. It opens a full-screen menu with three links: **Project Gallery** goes to the laptop page, while **About** and **Contact** unfold the phone and jump its display to that section. The menu also has the email address, GitHub and a link back to the start, and closes on Escape.

The first step raises a white, round-cornered card over the reel that eases up and grows to fill the screen, under a heavy PROJECT GALLERY headline, and a laptop glides up from the bottom of the screen. Its pictures, Lennon's own project screenshots, flow along a curved strip; each one is mapped onto the curve with a perspective transform, so the GPU moves them without repainting.

One more scroll brings up a dark card with a closed foldable phone. Its cover screen shows the time and Lennon's name. The next scroll unfolds it in 3D (a book fold on desktop, top to bottom on phones) into the portfolio: hero, Services we offer (custom websites, bug fixes, electronic projects, each with an email button), About and Contact. The display scrolls on its own, and scrolling up from its top folds the phone again. A picker switches the phone's frame between Graphite, Silver and Ember. The style follows the Foldfolio Framer template. Its display shows Lennon's name and a strip of pictures flowing along a rippling, curved ribbon. Scrolling nudges the strip faster. With reduced motion the laptop is already in place and the strip holds still.

**Live site:** http://lennonh.com/

## Files

| Path | What it is |
|---|---|
| `index.html` | The page: the showreel, full screen on black, then the laptop section. |
| `media/` | The showreel rendered to video (WebM and MP4, 1080p and 720p) and its poster and end-card stills. |
| `fold/` | The foldable-phone portfolio (`fold.css`, `fold.js`) and the project screenshots in `fold/work/`. |
| `reel-portrait/` | The 9:16 showreel composition for upright phones. |
| `framer/` | The same section as a Framer code component, with paste instructions in `framer/README.md`. |
| `laptop/` | The laptop photo (its edge fade baked in). The strip on its screen uses the screenshots in `fold/work/`. |
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
