# Adekosiparis → Vertigram Forwarder

This repository hosts a Violent Monkey userscript that forwards project data from Adekosiparis (and select Parasut pages) to the Vertigram API.

## Installation

1. Install [Violent Monkey](https://violentmonkey.github.io/).
2. In the dashboard choose **"+" → "From URL"** and paste the raw script URL:
   ```
   https://raw.githubusercontent.com/akina5525/vm-projects-forwarder/main/forwarder.user.js
   ```
3. Violent Monkey will automatically check this URL for updates when the `@version` changes.

The script automatically forwards projects to Vertigram whenever you visit the Adekosiparis site or the Parasut invoice creation page. It stores a timestamp in a cookie so forwarding happens at most once every 30 minutes. A small status bar appears at the top of the page while the request is in progress.
It also expands the order info field on Parasut invoices after the page fully loads so that the extra information field is visible automatically. If the page loads content asynchronously, the script keeps checking until it finds the "SİPARİŞ BİLGİSİ EKLE" button and clicks it. Because Parasut is a single-page application, the script watches for URL changes to reapply these enhancements whenever you navigate to the invoice creation page.
The script now logs detailed diagnostics to the browser console when running on Parasut pages so issues can be debugged more easily.

## Automatic version bump

A GitHub Actions workflow increments the patch version of `forwarder.user.js` on every push to the `main` branch.
