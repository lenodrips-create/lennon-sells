# HyperFrames intro

The source for the 12-second intro that plays at the top of the home page (`../index.html`).

```bash
cd intro
npx hyperframes preview   # live editor in the browser
npx hyperframes check     # validate
npx hyperframes render -o ../public/intro.mp4
ffmpeg -y -i ../public/intro.mp4 -c:v libvpx-vp9 -b:v 0 -crf 34 -an ../public/intro.webm
```
