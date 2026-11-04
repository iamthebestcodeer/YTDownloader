# YTDownloader

An Android app for saving YouTube videos, songs and whole playlists to your phone.
It runs [yt-dlp](https://github.com/yt-dlp/yt-dlp) and ffmpeg on the device, so no server is involved.

Built with Expo, React Native, HeroUI Native and Uniwind (scaffolded with
[Better-T-Stack](https://better-t-stack.dev)), in a Bun + Turborepo monorepo.

## Features

- **Search YouTube** or paste a video, Shorts or playlist link.
- **Share to the app** from YouTube or open YouTube links with it.
- **Video** up to 4K in MP4 or MKV, with an estimated file size for each quality.
- **Audio only** as MP3, M4A or Opus.
- **Embedded extras:** metadata, cover art and subtitles.
- **Playlist picker:** every video is listed with its thumbnail; tick the ones to download.
- **File picker:** a finished playlist lists every file with its own thumbnail; tap one to open it.
- **Rotating YouTube clients:** when YouTube refuses a request ("confirm you're not a bot",
  missing formats, 403/429), yt-dlp is retried as a different YouTube client and the one that
  worked is tried first next time.
- **Download queue** with progress, speed and time left. You can pause, resume, retry or cancel, and choose how many downloads run at once.
- **Background downloads:** a foreground service keeps them going when you leave the app.
- **Update yt-dlp** from the settings screen when a site changes.
- **Light and dark** themes.

Finished files go to `Download/YTDownloader` (playlists get their own subfolder) and show up in any file manager or player.

Requires Android 10 or newer.

## Project layout

```
apps/native/
  app/                     Expo Router routes (thin wrappers around feature screens)
  modules/yt-dlp/          Local Expo module (Kotlin) that runs yt-dlp + ffmpeg
    android/.../YtDlpEngine.kt              wraps youtubedl-android
    android/.../MediaStorePublisher.kt      copies finished files into Downloads
    android/.../DownloadKeepAliveService.kt foreground service while downloading
    android/.../YtDlpModule.kt              the bridge exposed to JavaScript
  src/
    domain/                Pure logic, no React: yt-dlp arguments, JSON parsing, progress, formatting
    engine/                DownloadEngine interface + native, unsupported and web-preview engines
    store/                 Zustand stores (settings, downloads) and the DownloadQueue scheduler
    features/              Screens: discover, media, downloads, settings, share
    ui/                    Small shared components built on HeroUI Native
  plugins/                 Expo config plugins (release signing)
```

Dependencies point inward: `features → store → engine → domain`. All yt-dlp knowledge
(arguments, output parsing) lives in `src/domain` and is unit tested. The Kotlin module just
runs the commands it is given and reports progress.

## Development

```bash
bun install
bun run lint          # Biome
bun run check-types   # TypeScript
bun run test          # bun test
```

Run on an Android device or emulator. This needs a development build, because Expo Go
cannot load the yt-dlp module:

```bash
cd apps/native
bunx expo run:android
```

To build a release APK locally:

```bash
cd apps/native
bunx expo prebuild --platform android
cd android && ./gradlew assembleRelease
```

`bun run dev:native` with the web target opens a browser preview of the UI. It uses a simulated
engine with recorded yt-dlp output, since yt-dlp cannot run in a browser.

## Releases

Every push to `main` builds a signed APK and publishes it as a GitHub release
(`.github/workflows/release.yml`). Signing uses these repository secrets: `KEYSTORE_BASE64`,
`KEYSTORE_PASSWORD`, `KEY_ALIAS` and `KEY_PASSWORD`. Without them, nothing is published: the
debug-signed APK is kept as a workflow artifact instead.

## License

[Apache 2.0](LICENSE)
