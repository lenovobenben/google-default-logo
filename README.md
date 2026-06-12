# google-default-logo

A minimal Chrome extension that keeps Google pages showing the default Google logo instead of Doodles.

Google occasionally replaces the default logo with holiday, anniversary, or event Doodles. This extension does one narrow thing: on supported Google home and search pages, it replaces the logo/Doodle area with a bundled default Google wordmark.

## Scope

- Supports `https://www.google.com/`
- Supports `https://www.google.com/search*`
- Does not handle `chrome://newtab`
- Does not request extra browser permissions

## Avoiding Country Redirects

Google may redirect you from `google.com` to a country-specific domain (e.g. `google.com.hk`, `google.co.jp`). This extension only runs on `google.com`, so Doodle replacement will not work on other domains.

To stay on `google.com`, set your browser homepage to `https://www.google.com/ncr` (No Country Redirect). This sets a cookie that prevents Google from redirecting you. The cookie lasts several months and is renewed each time you visit.

## Local Installation

1. Open `chrome://extensions/` in Chrome.
2. Enable Developer mode.
3. Click Load unpacked.
4. Select this directory: `/Users/lihaidong/code/google-default-logo`.

## Doodle Test Mode

Use this test URL to simulate a Doodle page:

```text
https://www.google.com/?gdl_test_doodle=1
```

The extension inserts a local fake Doodle first, then replaces it through the normal replacement logic. Regular URLs do not trigger this test path.

## Project Structure

```text
google-default-logo/
  manifest.json
  content.js
  assets/
    google-logo.svg
  docs/
    设计记录.md
```

## License

MIT
