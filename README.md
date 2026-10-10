# Lennon

The whole site is one full-screen animation: a 13-second [HyperFrames](https://github.com/heygen-com/hyperframes) showreel that covers the whole screen (on portrait phones it fits the width instead, so nothing important is cropped). It opens on LENNON HELMAN, then two chapters (code and build), joined by an orange circle iris, alternating stripes, and dots that swell to fill the frame before a skewed black panel sweeps into the end card (Lennon Helman, software developer, Greencastle, PA). It loops. The page shows the composition in an iframe and plays its GSAP timeline, so nothing loads from outside the site. Visitors who prefer reduced motion see the end card.

The page never scrolls natively. It has four stops (reel, laptop, folded phone, unfolded phone), and each wheel gesture, swipe or arrow key moves exactly one stop. Every layer animates with transforms only, and the animation loop sleeps when nothing is moving.

The first step raises a white, round-cornered card over the reel that eases up and grows to fill the screen, under a heavy PROJECT GALLERY headline, and a laptop glides up from the bottom of the screen. Its pictures flow along a curved strip; each one is mapped onto the curve with a perspective transform, so the GPU moves them without repainting.

One more scroll brings up a dark card with a closed foldable phone. Its cover screen shows the time and Lennon's name. The next scroll unfolds it in 3D (a book fold on desktop, top to bottom on phones) into the portfolio: hero, five projects that open into a detail sheet, About and Contact. The display scrolls on its own, and scrolling up from its top folds the phone again. A picker switches the phone's frame between Graphite, Silver and Ember. The style follows the Foldfolio Framer template. Its display shows Lennon's name and a strip of pictures flowing along a rippling, curved ribbon. Scrolling nudges the strip faster. With reduced motion the laptop is already in place and the strip holds still.

**Live site:** http://lennonh.com/

## Files

| Path | What it is |
|---|---|
| `index.html` | The page: the showreel, full screen on black, then the laptop section. |
| `fold/` | The foldable-phone portfolio: `fold.css`, `fold.js` and the project screenshots in `fold/work/`. |
| `framer/` | The same section as a Framer code component, with paste instructions in `framer/README.md`. |
| `laptop/` | The laptop photo and the seven pictures cut from its screen for the moving strip. |
| `reel/index.html` | The showreel composition (12.65 s, 1920×1080, one GSAP timeline). |
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
