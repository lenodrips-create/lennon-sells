# Lennon

The whole site is one full-screen animation: a 24-second [HyperFrames](https://github.com/heygen-com/hyperframes) showreel on black. The copy is developer-themed: BUILD / IT / SHIP, then five chapters (code, stack, deploy, commit and runtime, which glitches HELLO WORLD), each joined by a different transition: a circle iris, alternating stripes, dots that swell to fill the frame, a skewed panel, bars that rise into a wall, and a zoom through the type. It ends on a title card (Lennon Helman, software developer, Greencastle, PA) and loops. The page shows the composition in an iframe and plays its GSAP timeline, so nothing loads from outside the site. Visitors who prefer reduced motion see the end card.

Scrolling down leads to a white section where a laptop pops up from the bottom of the screen. Its display shows Lennon's name and a strip of pictures flowing along a rippling, curved ribbon. Scrolling nudges the strip faster. With reduced motion the laptop is already in place and the strip holds still.

**Live site:** http://lennonh.com/

## Files

| Path | What it is |
|---|---|
| `index.html` | The page: the showreel, full screen on black, then the laptop section. |
| `laptop/` | The laptop photo and the seven pictures cut from its screen for the moving strip. |
| `reel/index.html` | The showreel composition (24 s, 1920×1080, one GSAP timeline). |
| `reel/vendor/`, `reel/fonts/` | GSAP 3.14.2 and League Spartan (medium, bold, black), self-hosted. |
| `.well-known/security.txt` | Where to report security issues. |
| `.github/workflows/deploy.yml` | Publishes the site to GitHub Pages. |

## Edit the showreel

Change the text or timing in `reel/index.html`, then validate it:

```bash
cd reel && npx hyperframes check .
```

`npx hyperframes preview` opens it in HyperFrames Studio, and `npx hyperframes render` exports it as a video.

## Deploying

Every push to the `claude/gifted-pascal-xbq24p` branch runs `deploy.yml`, which copies the files into `_site` and publishes them to GitHub Pages.

The previous portfolio (photo sphere, night sky, projects, legal pages) is still in the git history if you want it back.
