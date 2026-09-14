# SunRE Academy — Password Access

`academy.html`, all three quiz pages, and `scoreboard.html` are now behind a shared password gate powered by `academy-auth.js`.

## Current password

Set in `academy-auth.js`:

```javascript
var ACADEMY_PASSWORD = "sunre2026";
```

## Changing the password

1. Open `academy-auth.js`.
2. Change the value of `ACADEMY_PASSWORD`.
3. Re-upload the file to GitHub.

That's it — you only edit this one file. Everyone who was previously let in (including on shared classroom devices) will be prompted again next time they load a page, since the site checks the *current* password on every visit rather than just remembering "unlocked forever."

## How it works

- On first visit to any protected page, a full-screen password prompt covers the page before any content is shown.
- Once the correct password is entered, the browser remembers it (via `localStorage`) so the student isn't asked again on every page during that visit.
- A small **🔒 Lock** link appears next to the "Back to Academy" nav link once unlocked — click it to manually re-lock that browser (useful on a shared or classroom computer).
- Adding a new quiz page later just needs one line in its `<head>`:
  ```html
  <script src="academy-auth.js"></script>
  ```

## Important limitation

This is a **client-side deterrent, not real security**. The password is stored in plain text in `academy-auth.js`, which is publicly downloadable like any other file on the site — anyone who looks at the page source or browser dev tools can read it. It's suitable for keeping the page out of casual view and off search engines, but not for protecting genuinely sensitive information. If you need real access control, that requires a backend or a service like Netlify/Cloudflare Access in front of the site.
