# Lennon

A black page with an animated intro at the top: "Lennon Helman" flips in letter by letter, a light line draws across, then "Greencastle, PA" drifts in with its coordinates and a pulsing pin. The intro is a [HyperFrames](https://github.com/heygen-com/hyperframes) composition. The page shows it in an iframe and plays its GSAP timeline, so nothing loads from outside the site.

**Live site:** https://lenodrips-create.github.io/lennon-sells/

## Files

| Path | What it is |
|---|---|
| `index.html` | The page: black, with the intro at the top. |
| `intro/index.html` | The HyperFrames composition (8 s, 1920×1080, one GSAP timeline). |
| `intro/vendor/gsap.min.js` | GSAP 3.14.2, self-hosted. |
| `intro/fonts/` | Inter and Playfair Display italic, with their licence files. |
| `.well-known/security.txt` | Where to report security issues. |
| `.github/workflows/deploy.yml` | Publishes the site to GitHub Pages. |

## Edit the intro

Change the text or timing in `intro/index.html`, then validate it:

```bash
cd intro && npx hyperframes check .
```

`npx hyperframes preview` opens it in HyperFrames Studio, and `npx hyperframes render` exports it as a video.

## Deploying

Every push to the `claude/gifted-pascal-xbq24p` branch runs `deploy.yml`, which copies the files into `_site` and publishes them to GitHub Pages.

The previous portfolio (photo sphere, night sky, projects, legal pages) is still in the git history if you want it back.
