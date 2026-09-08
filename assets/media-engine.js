/* ffmpeg.wasm 0.12 adapter. The worker and single-thread core are served locally. */
(function () {
  'use strict';
  const base = new URL('vendor/ffmpeg-core/', document.currentScript.src);
  let ffmpeg, loading;
  window.MediaEngine = {
    async load(onProgress) {
      if (!ffmpeg) {
        ffmpeg = new FFmpegWASM.FFmpeg();
        ffmpeg.on('progress', ({ progress }) => onProgress(Math.max(0, Math.min(100, progress * 100))));
      }
      if (!loading) loading = ffmpeg.load({
        coreURL: new URL('ffmpeg-core.js', base).href,
        wasmURL: new URL('ffmpeg-core.wasm', base).href
      }).catch(error => { ffmpeg.terminate(); ffmpeg = null; loading = null; throw error; });
      await loading;
      return ffmpeg;
    }
  };
})();
