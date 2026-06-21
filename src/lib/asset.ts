/**
 * Resolve a path in /public against Vite's BASE_URL so absolute asset references
 * work whether the app is served from the domain root (Vercel) or a subpath
 * (GitHub Pages project site, e.g. /Midjourney-Medical/). BASE_URL always ends
 * in a slash, so we strip any leading slash from the path before joining.
 */
export const asset = (path: string): string =>
  `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`
