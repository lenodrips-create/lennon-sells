# Lennon: portfolio

The personal portfolio of Lennon (@lenodrips), a developer who builds browsers, dev tools and websites.

**Live site:** https://lenodrips-create.github.io/lennon-sells/

## What's on the page

From top to bottom:

1. **Intro film.** A short film plays at 2× speed under a black veil, with a Skip button. There's no loading screen.
2. **Project sphere.** 21 screenshots of real projects sit on a 3D sphere (laid out with a Fibonacci spiral). "I Build What I Imagine" stays in its center.
   - Drag to rotate it.
   - Scrolling zooms in slightly and spins it.
   - Click a photo to open it in a lightbox with its title and notes.
   - The grid button switches to a flat grid of every photo.
3. **Night sky.** A canvas sky sits behind everything:
   - a faint Milky Way band with dust lanes
   - thousands of pin-point stars, colored like real stars
   - a few dozen bright stars that twinkle
   - it turns slowly with the sphere.
4. **About me.** A short bio, quick facts and a tech list.
5. **Projects.** Kepler, keplerbrowser.org, CTerm Studio, FORGIVN and this site, each with a short description, its tech and a link.
6. **Contact.** A background film with a glass email bar. Typing an email and pressing the arrow opens the visitor's own email app with a message to lenodrips@gmail.com.
7. **Footer.** Copyright, email, and links to the legal pages.

There's also a full-screen menu and a custom cursor on desktop.

## Files

| Path | What it is |
|---|---|
| `index.html` | The whole site in one file: one `<style>` block, one `<script>`, no frameworks or build step. |
| `privacy.html`, `terms.html`, `accessibility.html` | The legal pages. They share `legal.css`. |
| `work/` | Project screenshots. Each has a full-size `NN.jpg` and a `NN-min.jpg` thumbnail, plus `avatar.jpg`. |
| `fonts/` | Self-hosted Playfair Display and Inter, with their licence files. |
| `.well-known/security.txt` | Where to report security issues. |
| `.github/workflows/deploy.yml` | Publishes the site to GitHub Pages. |

## Run it locally

No install is needed. Serve the folder over HTTP and open it:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000/
```

Opening `index.html` straight from disk mostly works. Use a local server, though, so the images can be downscaled on a canvas.

## Edit the projects

**Photos on the sphere.** These are listed in the `SHOTS` array near the top of the `<script>` in `index.html`. Each entry looks like this:

```js
["01", "A Browser From Another Orbit", "Kepler · C++ / Qt 6", "The note shown in the lightbox."]
```

- The first value is the image name in `work/`, so `"01"` uses `work/01.jpg` and `work/01-min.jpg`.
- Add `true` as a fifth value for a tall (portrait) card.

To add a photo, save a full-size JPG and a thumbnail about 900px wide, then add a line to `SHOTS`.

**Projects list.** This list sits under About me, in the `<section id="projects">` block of `index.html`.

## Deploying

Every push to the `claude/gifted-pascal-xbq24p` branch runs `deploy.yml`. It copies the site files into `_site` and publishes them to GitHub Pages. There's no build step.

If you add a new top-level file or folder, add it to the copy step in `deploy.yml` too.

## Privacy and accessibility

- **Privacy:** the site sets no cookies and uses no analytics or tracking. Fonts and images are served from this site. The only outside requests are the two background films. Details are in [privacy.html](privacy.html).
- **Accessibility:** the target is WCAG 2.2 AA, and the site is built for it:
  - a skip link
  - keyboard-operable photos, with the lightbox handling focus as a dialog
  - inert overlays when closed
  - text contrast of at least 4.5:1
  - support for reduced motion
  - working layouts at 200% zoom.

  To report a barrier, see [accessibility.html](accessibility.html).

## Credits and licences

- **Fonts:** Playfair Display and Inter, under the SIL Open Font License 1.1 (see `fonts/`).
- **Arrow icon:** based on [Lucide](https://lucide.dev) (ISC License).
- **Background films:** streamed from a third-party host. They belong to their creator.
- **Screenshots:** they show Lennon's own projects. Third-party names and logos that appear in them belong to their owners.

The site's text, design and screenshots are © 2026 Lennon. Each project's code is covered by the licence in its own repository.

## Contact

lenodrips@gmail.com · [github.com/lenodrips-create](https://github.com/lenodrips-create)
