# FoldfolioSection for Framer

`FoldfolioSection.tsx` is one Framer code component. `FoldfolioSection.jsx` is the same component in plain JavaScript, with the TypeScript types removed. Use either one; they behave the same. It recreates the Foldfolio style:
- **The device:** a closed foldable phone that unfolds as you scroll into a full portfolio display. It folds like a book on desktop and tablet, and top to bottom on phones.
- **The display:** dark styling, rounded cards, a project grid that opens into a detail sheet, About and Contact, and a frame finish picker.

The defaults already contain Lennon's content and links, so it works as soon as it's dropped in.

lennonh.com itself isn't built in Framer; it's this repository, published by GitHub Pages. The same section is already live there, built in plain HTML, CSS and JS (`fold/`). Use this file only if you build the site, or a copy of it, in Framer.

## Paste it into Framer (about 2 minutes)

1. **Create the file.** Open your Framer project. In the left panel, go to **Assets**, then **Code**, and click **+**. Choose **New Code File** and name it `FoldfolioSection`.
2. **Paste the code.** Select everything in the editor that opens, delete it, and paste the whole of `FoldfolioSection.tsx`, or `FoldfolioSection.jsx` if you'd rather work in plain JavaScript. Framer saves it automatically.
3. **Place the component.** Go back to the canvas. On your Home page, drag **FoldfolioSection** from **Assets → Code** onto the page. Put it where the section should appear; with the order on lennonh.com, that's right after your laptop section.
4. **Size it.** With it selected, set **Width** to **Fill** and **Height** to **Fit**. The component sets its own height: 3 screens of scroll by default, adjustable with **Scroll length**.
5. **Check its container.** Make sure no parent frame has **Overflow: Hidden** or **Clip content** turned on. A clipping parent stops the sticky phone from staying on screen while you scroll.
6. **Add the heading font.** Go to **Site Settings → Fonts** and add **League Spartan** from Google Fonts, or type any font you already use into the **Heading font** control.
7. **Preview** (▶) and scroll: the phone arrives closed, then unfolds.

## Edit the content

Select the component and use the right-hand panel. You don't need to touch the code.

| Control | What it changes |
|---|---|
| Name, Role, Location, Email | The header, the cover screen and the Contact section |
| Headline / Accent words / Intro | The hero text. Accent words show in the accent color |
| Projects | Add, remove or reorder projects. Each one has a title, kind, text, comma-separated tags, a link and its label, a main image and a gallery |
| About lead, About, Facts, Stack | The About section. In About, each new line starts a new paragraph |
| Links | The buttons under the email address |
| Accent, Background | Theme colors |
| Frame, Finish picker | The phone's default finish (Graphite, Silver or Ember), and whether visitors can switch it |
| Scroll length | How many screens of scrolling the fold takes (2 to 6) |

The default project images load from `https://lennonh.com/fold/work/`. For a Framer site, replace them in the **Projects** control with images uploaded to Framer, so the site doesn't depend on the other host.

## Responsive behavior

- **Desktop:** the phone folds like a book along a vertical hinge.
- **Tablet:** the same book fold, scaled to fit.
- **Phones:** a clamshell that unfolds top to bottom. The component switches automatically when its area is narrower than 700px or clearly portrait.
- **Narrow displays:** the content inside the phone drops to one column below 620px of screen width.
- **Reduced motion:** visitors who prefer it see the phone snap open instead of animating.
