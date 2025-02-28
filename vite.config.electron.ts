import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { manualChunksPlugin } from "vite-plugin-webpackchunkname";
import { visualizer } from "rollup-plugin-visualizer";
import electron from "vite-plugin-electron";
import electronRender from "vite-plugin-electron-renderer";

// eslint-disable-next-line no-undef
const getPath = (_path) => path.resolve(__dirname, _path);
// https://vitejs.dev/config/
export default ({ mode, command }) => {
  const env = loadEnv(mode, process.cwd()); // 获取.env文件里定义的环境变量
  const analysPlugins: any[] =
    mode === "analys"
      ? [
          visualizer({
            emitFile: false,
            filename: "stats.html",
            gzipSize: true,
            open: true,
          }),
        ]
      : [];
  return defineConfig({
    plugins: [
      react(),
      electron([
        {
          entry: [
            "electron/main.js",
            "electron/preload.js",
            "electron/listenEvent.js",
          ],
          vite: {
            build: {
              chunkSizeWarningLimit: 2048,
              outDir: "build/electron",
              // minify: "terser",
            },
          },
        },
      ]),
      electronRender(),
      manualChunksPlugin(),
    ].concat(analysPlugins),
    build: {
      emptyOutDir: true,
      sourcemap: false,
      outDir: "build",
      // manifest: true, //开启manifest
      terserOptions: {
        // 生产环境去除 console
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      },
      rollupOptions: {
        output: {
          chunkFileNames: "static/js/[name].[hash].js",
          entryFileNames: "static/js/[name].[hash].js",
          assetFileNames: "static/[ext]/[name].[hash].[ext]",
          manualChunks(id: string) {
            if (id.includes("node_modules")) {
              return "vendor"; //代码宰割为第三方包
            }
          },
        },
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    base: "./",
    define: {
      "process.env": process.env,
    },
    server: {
      port: 8881,
      host: true,
      proxy: {
        "/api": {
          target: env.VITE_BASE_URL,
          // target: 'http://192.168.120.178:3000',
          changeOrigin: true,
          secure: false, // 解决代理https协议报错问题
          headers: {
            "Access-Control-Allow-Origin": "*",
          },
          rewrite: (path: string) => path.replace(/^\/api/, ""),
        },
      },
    },
    css: {
      preprocessorOptions: {
        // 全局样式引入
        scss: {
          additionalData: `@use "@/assets/styles/global.scss";`,
        },
      },
    },
  });
};
