# Lennon

An animated personal site for Lennon (@lenodrips). Open `index.html` to view it.

- `intro/index.html` is the HyperFrames composition for the 12-second intro (kinetic name, role rotator, drips, outro card).
- `intro.mp4` and `intro.webm` are the rendered intro, which plays as the hero.
- `js/` holds GSAP and ScrollTrigger for the scroll animations.

## Editing the intro

```bash
cd intro
npx hyperframes preview   # live editor in the browser
npx hyperframes check     # validate
npx hyperframes render -o ../intro.mp4
ffmpeg -y -i ../intro.mp4 -c:v libvpx-vp9 -b:v 0 -crf 34 -an ../intro.webm
```
