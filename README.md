# Omarchy

Beautiful, Fun & Agentic Linux by DHH.

See https://github.com/omacom/omarchy for more.

## Working on the site

Run `npm ci`, then `npm run dev` (or `bin/serve`) to preview the React site.
`npm run build` produces the static site in `dist/client`; `npm run parity`
checks its page URLs and verifies that passthrough files are unchanged.

The HTML under the standalone page directories, `themes/`, `manual/`, and
dated `news/` directories is **content input**, not a second site design.
`scripts/port_content.py` extracts it into `src/data` on every build. Keep
layout, navigation, and styling in `src/`; preview through the dev server.
After editing content inputs, run `npm run port` to refresh the dev data.

- Edit standalone page content in its existing `index.html`.
- Edit the homepage announcement in `src/data/banner.json` (`null` hides it).
- Run `bin/build-news` after editing Markdown in `content/news/`; it updates
  article inputs, images, and the RSS feed.
- Run `bin/build-manual [path/to/omarchy/manual]` to refresh manual inputs and
  images. The React site builds its table of contents and search index.

The screensaver and the Discord redirect are still served
directly. Their styles, fonts, and scripts remain under `assets/`, alongside
shared images and public downloads.

## Adding your theme

Community themes are listed on [omarchy.org/themes](https://omarchy.org/themes/).
To get yours on the page, open a pull request with two things.

**1. A screenshot.** Take a 16:9 shot of the theme on a real desktop, then
convert it:

    magick preview.png -strip -resize '1200>' -quality 80 your-theme.webp

Put the result in `assets/themes/`. Name the file after the theme, lowercase
and hyphenated — `your-theme.webp`. Aim for 1200x675; keep it under about
100KB so the page stays quick to load.

**2. An entry.** Add a figure block to `themes/index.html`, in alphabetical
order among the others:

```html
<figure class="themes__theme">
  <a href="https://github.com/you/your-theme"><img src="/assets/themes/your-theme.webp" alt="Your Theme theme" loading="lazy" decoding="async"></a>
  <figcaption><a href="https://github.com/you/your-theme">Your Theme</a></figcaption>
</figure>
```

Both links point at the theme's own repository, which is where people
install it from and where it needs to keep living.

### The screenshot matters

The page is a grid of screenshots — that image is the whole pitch for your
theme, so give it the same care you gave the palette. Show a real session
with a terminal and an editor in it, not an empty desktop. Use the theme's own
wallpaper. Don't scale a small capture up, and don't include a cursor, a
notification, or anything personal you'd rather not publish.

Pull requests without a screenshot can't be merged, because there's nothing
to put on the page.

## Plugins

Plugins aren't in this repository. They're listed on
[omarchyplugins.com](https://omarchyplugins.com/) from the
[marketplace repo](https://github.com/HANCORE-linux/omarchy-plugin-marketplace),
which has its own submission guide.
