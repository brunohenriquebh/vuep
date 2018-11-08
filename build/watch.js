import nodeResolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import buble from "rollup-plugin-buble";
import vue from "rollup-plugin-vue";
import replace from "rollup-plugin-replace";
import css from "@henrikjoreteg/rollup-plugin-css";
import json from "rollup-plugin-json";
import builtins from "rollup-plugin-node-builtins";

export default {
  input: "src/index.js",
  //transforms: { forOf: false },
  plugins: [
    replace({
      "process.env.NODE_ENV": "true"
    }),
    css({
      output: "./dist/vuep.css",
      minify: true
    }),
    vue(),
    json(),
    builtins(),
    buble({
      objectAssign: "assign",
      transforms: {
        dangerousForOf: true,
        generator: false
      }
    }),
    commonjs({
      namedExports: {
        // left-hand side can be an absolute path, a path
        // relative to the current directory, or the name
        // of a module in node_modules
        "node_modules/vue-template-compiler/browser.js": ["parseComponent"]
      }
    }),
    nodeResolve()
  ],

  external: ["vue"],
  output: {
    file: "dist/vuep.js",
    name: "Vuep",
    format: "umd",
    globals: {
      vue: "Vue"
      //'vue-grid-layout': 'VueGridLayout'
    }
  }
};
