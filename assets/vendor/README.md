# Vendored browser dependencies

These files are copied from the exact npm versions in `package-lock.json` by
`npm run vendor`. The website serves them from the same origin; no CDN is
required. `highlight.min.js` bundles the package's common language set.

| Package | Version | License |
| --- | --- | --- |
| @ffmpeg/ffmpeg | 0.12.15 | MIT |
| @ffmpeg/core | 0.12.10 | GPL-2.0-or-later |
| gif.js | 0.2.0 | MIT |
| imagetracerjs | 1.2.6 | Unlicense |
| marked | 11.1.1 | MIT |
| DOMPurify | 3.4.15 | Apache-2.0 OR MPL-2.0 |
| highlight.js | 11.9.0 | BSD-3-Clause |
| js-md5 | 0.8.3 | MIT |
| PapaParse | 5.4.1 | MIT |
| Pica | 9.0.1 | MIT |
| SVGO | 4.1.0 | MIT |

License texts are in `licenses/`; upstream copyright notices are retained.
The single-thread FFmpeg core is about 32 MB and is loaded only on first
conversion. It runs without cross-origin isolation headers.

FFmpeg core sources and reproducible build configuration:
[ffmpeg.wasm upstream](https://github.com/ffmpegwasm/ffmpeg.wasm),
[core 0.12.10 release](https://github.com/ffmpegwasm/ffmpeg.wasm/releases/tag/v0.12.10),
[FFmpeg sources](https://github.com/FFmpeg/FFmpeg).
The core has its own GPL license; the repository's main license does not replace
the licenses of bundled dependencies.
