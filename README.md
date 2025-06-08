# Adekosiparis → Vertigram Forwarder

This repository hosts a Violent Monkey userscript that forwards project data from Adekosiparis to the Vertigram API.

## Installation

1. Install [Violent Monkey](https://violentmonkey.github.io/).
2. In the dashboard choose **"+" → "From URL"** and paste the raw script URL:
   ```
   https://raw.githubusercontent.com/username/vm-projects-forwarder/main/forwarder.user.js
   ```
3. Violent Monkey will automatically check this URL for updates when the `@version` changes.

The script adds a button to the Adekosiparis site that fetches projects and sends them to Vertigram.

## Automatic version bump

A GitHub Actions workflow increments the patch version of `forwarder.user.js` on every push to the `main` branch.
