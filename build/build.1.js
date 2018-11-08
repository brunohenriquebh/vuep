var rollup = require("rollup");
var buble = require("rollup-plugin-buble");
var commonjs = require("rollup-plugin-commonjs");
var nodeResolve = require("rollup-plugin-node-resolve");
var uglify = require("rollup-plugin-uglify");
var vue = require("rollup-plugin-vue");
var css = require("@henrikjoreteg/rollup-plugin-css");
var replace = require("rollup-plugin-replace");
var includePaths = require("rollup-plugin-includepaths");
var json = require("rollup-plugin-json");
var builtins = require("rollup-plugin-node-builtins");

let includePathOptions = {
  include: {
    vue: "node_modules/vue/dist/vue.common.js"
    //'vue-router': 'node_modules/vue-router/dist/vue-router.js'
  },
  external: [
    "vue"
    //'vue-router'
  ]
};

var build = function(opts) {
  rollup
    .rollup({
      input: "src/index.js", // + opts.entry,
      plugins: [
        replace({
          "process.env.NODE_ENV": "true"
        }),
        css({
          output: "./dist/vuep.css",
          minify: true
        }),
        vue.default(),
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
      ].concat(opts.plugins || []),
      external: ["vue"],
      output: {
        file: "dist/vuep.js",
        globals: {
          //  codemirror: 'CodeMirror',
          vue: "Vue"
        }
      }
    })
    .then(function(bundle) {
      var dest = "dist/" + (opts.output || opts.entry);

      console.log(dest);
      bundle.write({
        globals: {
          //  codemirror: 'CodeMirror',
          vue: "Vue",

          "vue-toasted": "toasted"
        },
        output: {
          file: dest,
          format: opts.format || "umd",
          name: opts.moduleName || "Vuep"
        }
        //dest: dest
        //external: [ 'vue']
      });
    })
    .catch(function(err) {
      console.error(err);
    });
};

/*

build({
  input: "index.umd.js",
  output: {
    file: "vuep.js",
    globals: {
      //  codemirror: 'CodeMirror',
      vue: "Vue"
    }
  }
  //external: [ 'vue']
});

build({
  input: "index.umd.js",
  output: {
    file: "vuep.min.js"
  },
  plugins: [uglify()]
  // external: ['vue/dist/vue.common']
});

build({
  input: "index.cjs.js",
  output: {
    file: "vuep.common.js",
    format: "cjs"
  },
  external: ["codemirror", "vue/dist/vue.common"]
});
*/
