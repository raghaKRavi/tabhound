# Tabhound Privacy Policy

_Last updated: 2026-11-01_

Tabhound is a browser extension that lets you search and manage your open tabs.
**Tabhound does not collect, transmit, sell or share any of your data.** Everything it
reads is processed on your device, inside your browser, and never leaves it.

## What Tabhound reads

| Data | Why | Where it goes |
|---|---|---|
| Titles and URLs of your open tabs | To search them and switch to the one you pick | Kept in memory in the extension; discarded when the tab closes or the browser quits |
| Tab favicons | To show a site icon next to each result | Loaded by your browser from its local favicon cache, or from the site's own icon URL (the same request the site's tab already made). Never from a third-party service |
| Page description and first heading (`<h1>`) | **Only if you turn on "content search"** (see below) | Kept in memory in the extension; never leaves your device |

## Content search (optional, off by default)

Tabhound can also search each page's meta description and first heading. This needs
permission to access all sites, which Tabhound **does not request at install**. It asks
only when you click **Turn on** in the popup, and you can click **Turn off** at any time,
which removes the permission and discards the text it collected. Tabhound reads only those
two elements, and does not read form fields, passwords, or other page content.

## What Tabhound does not do

- No analytics, telemetry, tracking or advertising.
- No accounts and no server. Tabhound makes no network requests of its own.
- No remote code. All code ships inside the extension package.
- No sale or transfer of data to third parties, and no use of data for purposes unrelated to
  the extension's single purpose (searching and managing your open tabs).

## Permissions, and why they are needed

| Permission | Reason |
|---|---|
| `tabs` | Read tab titles and URLs; focus, close, move tabs |
| `tabGroups` (Chromium browsers only) | Put selected tabs in a group |
| `favicon` (Chromium browsers only) | Show site icons from the browser's local cache |
| `scripting` | Register the page-description reader after you turn on content search |
| Access to all sites (optional) | Only used for content search, and only after you grant it |

## Children

Tabhound is not directed at children and collects no data from anyone.

## Changes

If this policy changes, the new version will be posted at this location with an updated
date. Any change that involves collecting data would require a new version of the
extension that asks for your permission first.

## Contact

Questions or concerns: open an issue at <https://github.com/raghaKRavi/tabhound/issues>.
