# Lennon

The site opens on a 13-second [HyperFrames](https://github.com/heygen-com/hyperframes) showreel in a rounded frame just inside the screen edges. It's white with black type, with black accents and a blue triangle. It opens on LENNON HELMAN (software engineer, Greencastle, PA), then two chapters (code, with grey icons, and build), joined by a black circle iris, alternating black stripes, and dots that swell to fill the frame before a skewed white panel sweeps into the end card (Lennon Helman, software engineer, Greencastle, PA). It loops. The compositions in `reel/` (16:9) and `reel-portrait/` (9:16) are rendered to video in `media/`, so the device's video hardware plays them. Upright phones such as iPhones get the vertical cut, which fills the frame; landscape screens get the 16:9 one, at 720p on small screens. Nothing loads from outside the site. Visitors who prefer reduced motion see the end card. A **scroll** button at the bottom middle of the video takes you down to the laptop.

The page scrolls normally. The white card follows the scroll position, so it moves as far and as fast as you scroll, and from the laptop a single scroll takes you on to the services. The animation loop sleeps when nothing is moving.

An LH </> logo sits at the top left on larger screens (it goes back to the start), and a dark, pill-shaped bar of buttons sits in the top middle of every screen: **home**, **project gallery**, **services**, **about** and **contact**. The first four go there, opening or closing the MacBook on the way. **contact** opens an email. The button for the current section is white.

Scrolling down moves a white, round-cornered card up over the reel, with a heavy PROJECT GALLERY headline and a MacBook that lifts into place as the card arrives. It's a real-time 3D model (three.js, in `mac/`) built to a MacBook Air's measurements in Space Gray. It has a full US keyboard with legends, Touch ID, a glass trackpad, the notch and the side ports. It sits in a studio whose reflections give the aluminium its look, with soft contact shadows under it. Its display shows Lennon's project screenshots flowing along a curved strip, rendered into a texture every frame.

Scrolling stops at the laptop, so the open laptop is always seen. The next scroll goes straight to the services: the lid swings shut on its hinge as the camera cranes up and over it, and as the lid fills the screen, **Services we offer** slides up over it: custom websites, bug fixes and electronic projects, each with an email button, and a Start a project button. One scroll up from the top of the services takes them back down and opens the laptop again.

At the end of the services, one more scroll pops a white card up from the bottom of the screen, like the first card, with an **About me** in black type: an intro, the story behind Kepler and CTerm Studio, quick facts, the stack and links to email, GitHub and keplerbrowser.org. Where it's taller than the screen it scrolls inside the card, and one scroll up from its top takes the card back down. Without WebGL the page gets a plain dark background instead.

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
