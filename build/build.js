var rollup = require('rollup')
var buble = require('rollup-plugin-buble')
var commonjs = require('rollup-plugin-commonjs')
var nodeResolve = require('rollup-plugin-node-resolve')
var uglify = require('rollup-plugin-uglify')
var vue = require('rollup-plugin-vue');
var css = require('@henrikjoreteg/rollup-plugin-css');
var replace = require('rollup-plugin-replace');



var build = function (opts) {
  rollup
    .rollup({
      entry: 'src/' + opts.entry,
      plugins: [
        replace({
          'process.env.NODE_ENV': JSON.stringify('production'),
        }),
        css({
          output: './dist/vuep.css',
          minify: true
        }),
        vue.default(),
        buble({
        objectAssign: 'assign',
        transforms: { dangerousForOf: true }
      }), 
      commonjs({
        namedExports: {
          // left-hand side can be an absolute path, a path
          // relative to the current directory, or the name
          // of a module in node_modules
          'node_modules/vue-template-compiler/browser.js': [ 'parseComponent' ]
        }
      }), nodeResolve()].concat(opts.plugins || []),
      external: opts.external
    })
    .then(function (bundle) {
      var dest = 'dist/' + (opts.output || opts.entry)

      console.log(dest)
      bundle.write({
        format: opts.format || 'umd',
        moduleName: opts.moduleName || 'Vuep',
        globals: {
        //  codemirror: 'CodeMirror',
          'vue/dist/vue.common': 'Vue',
            'vue-toasted': 'toasted'
        },
        dest: dest
      })
    })
    .catch(function (err) {
      console.error(err)
    })
}

build({
  entry: 'index.umd.js',
  output: 'vuep.js',
  external: ['vue/dist/vue.common']
})

build({
  entry: 'index.umd.js',
  output: 'vuep.min.js',
  plugins: [uglify()],
  external: ['vue/dist/vue.common']
})

build({
  entry: 'index.cjs.js',
  output: 'vuep.common.js',
  format: 'cjs',
  external: ['codemirror', 'vue/dist/vue.common']
})
