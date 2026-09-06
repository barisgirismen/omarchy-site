# Parked

Code the site does not build right now, kept whole for when it does.

- `plugins/`: the built-in plugin directory (the listing, the explorer,
  the develop and publish pages, and a page per plugin). For launch the
  directory lives at plugins.omarchy.org, so these routes are out and
  every `/plugins/...` address forwards there (see
  `scripts/assemble-static.mjs`). To bring them back, move the route
  files into `src/routes/` and the components into `src/components/`,
  put `/plugins` back in the prerender filter and page list in
  `vite.config.ts`, and point the plugin card and search results at
  the routes again.

Nothing in here is type checked or linted, and nothing imports it.
