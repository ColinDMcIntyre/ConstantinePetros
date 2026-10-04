# Constantine Petros case-file site

This folder is a dependency-free static website. It can be hosted on GitHub Pages, Netlify, Cloudflare Pages, Amazon S3, or nearly any ordinary web server.

## GitHub Pages

1. Create a new GitHub repository.
2. Upload every file from this folder to the repository root.
3. Open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select the `main` branch and `/ (root)`, then save.

## Other static hosts

Upload this folder as the site root. No build command is required. The entry file is `index.html`.

## Before moving to a permanent domain

- Update the displayed date if needed.
- Review the court-resource URL.
- Add the final domain as a canonical URL in `index.html` after the new address is known.

## Editing

- Page content: `index.html`
- Colors and layout: `styles.css`
- Browser icon: `favicon.svg`
