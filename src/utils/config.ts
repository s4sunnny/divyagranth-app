/**
 * Where book JSON files live. This is a *static* host — GitHub Pages,
 * Cloudflare Pages, S3, Netlify, anything that can serve a folder of files
 * over HTTPS. No backend code is required.
 *
 * Layout expected at this URL:
 *
 *   {CONTENT_BASE_URL}/manifest.json          ← list of all books
 *   {CONTENT_BASE_URL}/books/{id}.json        ← one book per file
 *
 * Audio URLs inside each book point at Internet Archive (or any other
 * public-domain host). See {@code docs/CONTENT_HOSTING.md}.
 *
 * To switch hosts, change this one constant. To run without internet, the
 * app falls back to bundled local books (see {@code data/localBooks.ts}).
 */
export const Config = {
  /**
   * Base URL of the static content host. Replace with your own GitHub Pages
   * / Cloudflare / S3 URL once you've uploaded the files in `/content`.
   */
  contentBaseUrl: 'https://s4sunnny.github.io/divyagranth-content',

  /** Network timeout (ms) for content fetches. */
  fetchTimeoutMs: 10_000,

  /** Where downloaded files (JSON + audio) are tracked in AsyncStorage. */
  downloadsKey: 'dg.v1.downloads',
};
