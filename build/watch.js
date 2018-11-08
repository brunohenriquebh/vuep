import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import buble from "rollup-plugin-buble";
import vue from "rollup-plugin-vue";
import replace from "rollup-plugin-replace";
import css from "@henrikjoreteg/rollup-plugin-css";
import json from "rollup-plugin-json";
import builtins from "rollup-plugin-node-builtins";
import globals from "rollup-plugin-node-globals";

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

    builtins(),
    vue(),
    resolve({ browser: true }), // tells Rollup how to find date-fns in node_modules
    commonjs({
      namedExports: {
        // left-hand side can be an absolute path, a path
        // relative to the current directory, or the name
        // of a module in node_modules
        "node_modules/vue-template-compiler/browser.js": ["parseComponent"]
      }
    }),
    globals(),

    json(),
    buble({
      objectAssign: "assign",
      transforms: {
        dangerousForOf: true,
        generator: false
      }
    })
  ],

  external: ["vue"],
  output: {
    file: "dist/vuep.js",
    name: "Vuep",
    format: "iife",
    globals: {
      vue: "Vue"
      //'vue-grid-layout': 'VueGridLayout'
    }
  }
};
