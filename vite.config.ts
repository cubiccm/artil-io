import { defineConfig } from 'vite';
import replace from '@rollup/plugin-replace';
import { resolve } from 'path';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  build: {
    rollupOptions: {
      plugins: [
        //  Toggle the booleans here to enable / disable Phaser 3 features:
        replace({
          'typeof CANVAS_RENDERER': "'true'",
          'typeof WEBGL_RENDERER': "'true'",
          'typeof EXPERIMENTAL': "'true'",
          'typeof PLUGIN_CAMERA3D': "'false'",
          'typeof PLUGIN_FBINSTANT': "'false'",
          'typeof FEATURE_SOUND': "'true'"
        })
      ]
    }
  },
  server: {
    host: '0.0.0.0',
    port: 4000,
    hmr: false,
    // hmr: {
    //   host: '0.0.0.0',
    //   port: 4000
    // },
    proxy: {
      // Proxying socket.io
      '/socket.io': {
        target: 'ws://0.0.0.0:3000',
        ws: true,
        changeOrigin: true
      }
    }
  },
  plugins: [tsconfigPaths()]
});
