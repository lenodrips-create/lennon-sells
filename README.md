# Lennon

The site is a single black screen: `index.html` has no content, just a black background.

**Live site:** https://lenodrips-create.github.io/lennon-sells/

## Files

| Path | What it is |
|---|---|
| `index.html` | The whole site: a black page. |
| `.well-known/security.txt` | Where to report security issues. |
| `.github/workflows/deploy.yml` | Publishes the site to GitHub Pages. |

## Deploying

Every push to the `claude/gifted-pascal-xbq24p` branch runs `deploy.yml`, which copies the files into `_site` and publishes them to GitHub Pages.

The previous portfolio (photo sphere, night sky, projects, legal pages) is still in the git history if you want it back.
