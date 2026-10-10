# Lennon

The whole site is one full-screen animation: a 13-second [HyperFrames](https://github.com/heygen-com/hyperframes) showreel that covers the whole screen. It opens on LENNON HELMAN, then two chapters (code and build), joined by an orange circle iris, alternating stripes, and dots that swell to fill the frame before a skewed black panel sweeps into the end card (Lennon Helman, software developer, Greencastle, PA). It loops. The compositions in `reel/` (16:9) and `reel-portrait/` (9:16) are rendered to video in `media/`, so the device's video hardware plays them. Upright phones such as iPhones get the vertical cut, which fills the screen; landscape screens get the 16:9 one, at 720p on small screens. Nothing loads from outside the site. Visitors who prefer reduced motion see the end card.

The page never scrolls natively. It has three stops (reel, open MacBook, closed MacBook with the services page), and each wheel gesture, swipe or arrow key moves exactly one stop. The animation loop sleeps when nothing is moving.

A **Menu** button sits in the top-right corner on every screen. It's light over dark screens and dark over the white laptop page. It opens a full-screen menu with two links: **Project Gallery** goes to the laptop page, and **Services** closes the MacBook onto the services page. The menu also has the email address, GitHub and a link back to the start, and closes on Escape.

The first step raises a white, round-cornered card over the reel, under a heavy PROJECT GALLERY headline, and a MacBook glides up from the bottom of the screen. It's a real-time 3D model (three.js, in `mac/`) built to a MacBook Air's measurements in Space Gray. It has a full US keyboard with legends, Touch ID, a glass trackpad, the notch and the side ports. It sits in a studio whose reflections give the aluminium its look, with soft contact shadows under it. Its display shows Lennon's project screenshots flowing along a curved strip, rendered into a texture every frame.

The next scroll closes the lid on its hinge while the camera cranes up and over it, until the lid fills the whole screen. Then **Services we offer** rises in on top of the closed lid: custom websites, bug fixes and electronic projects, each with an email button, and a Start a project button. Where it's taller than the screen it scrolls on its own, and scrolling up from its top opens the MacBook again. Without WebGL the page gets a plain dark background instead.

**Live site:** http://lennonh.com/

## Files

| Path | What it is |
|---|---|
| `index.html` | The page: the showreel, the MacBook section and the services page, plus the navigation. |
| `media/` | The showreel rendered to video (WebM and MP4, 1080p and 720p) and its poster and end-card stills. |
| `mac/` | The 3D MacBook. `src/mac.js` is the source; `mac.min.js` is it bundled with three.js (`cd mac && npm install && npm run build`). |
| `info/info.css` | The services page's styles. |
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
