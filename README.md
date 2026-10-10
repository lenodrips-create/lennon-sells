# Lennon

A white page with an animated intro at the top: "Lennon Helman" flips in letter by letter, a light line draws across, then "Greencastle, PA" drifts in. The intro is a [HyperFrames](https://github.com/heygen-com/hyperframes) composition. The page shows it in an iframe and plays its GSAP timeline, so nothing loads from outside the site.

Below it is a 24-second showreel, also a HyperFrames composition. It has five chapters (type, shape, motion, rhythm and signal), each joined by a different transition: a circle iris, alternating stripes, dots that swell to fill the frame, a skewed panel, bars that rise into a wall, and a zoom through the type. It ends on a title card. The reel loops while it is on screen and pauses when scrolled away. Visitors who prefer reduced motion see the end card.

**Live site:** http://lennonh.com/

## Files

| Path | What it is |
|---|---|
| `index.html` | The page: white, with the intro at the top. |
| `intro/index.html` | The HyperFrames composition (8 s, 1920×1080, one GSAP timeline). |
| `intro/vendor/gsap.min.js` | GSAP 3.14.2, self-hosted. |
| `intro/fonts/` | League Spartan (medium and bold), with its licence file. |
| `reel/index.html` | The showreel composition (24 s, 1920×1080, one GSAP timeline). |
| `reel/vendor/`, `reel/fonts/` | GSAP 3.14.2 and League Spartan (medium, bold, black), self-hosted. |
| `.well-known/security.txt` | Where to report security issues. |
| `.github/workflows/deploy.yml` | Publishes the site to GitHub Pages. |

## Edit the intro

Change the text or timing in `intro/index.html`, then validate it:

```bash
cd intro && npx hyperframes check .   # or: cd reel
```

`npx hyperframes preview` opens it in HyperFrames Studio, and `npx hyperframes render` exports it as a video.

## Deploying

Every push to the `claude/gifted-pascal-xbq24p` branch runs `deploy.yml`, which copies the files into `_site` and publishes them to GitHub Pages.

The previous portfolio (photo sphere, night sky, projects, legal pages) is still in the git history if you want it back.
