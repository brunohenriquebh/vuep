import nodeResolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import buble from 'rollup-plugin-buble'
import vue from 'rollup-plugin-vue';
import replace from 'rollup-plugin-replace';
import css from '@henrikjoreteg/rollup-plugin-css';

export default {
  entry: 'src/index.js',
  //transforms: { forOf: false },
  plugins: [
    replace({
      'process.env.NODE_ENV': 'true',
    }),
    css({
      output: './dist/style.css',
      minify: true
    }),
    vue(),
    buble({
    objectAssign: 'assign',
    transforms: { dangerousForOf: true  },
  }), commonjs({
    namedExports: {
      // left-hand side can be an absolute path, a path
      // relative to the current directory, or the name
      // of a module in node_modules
      'node_modules/vue-template-compiler/browser.js': [ 'parseComponent' ]
    }
  }), nodeResolve()],
  dest: 'dist/vuep.js',
  format: 'umd',
  moduleName: 'Vuep',
  external: [ 'vue'],
  globals: {
    'vue': 'Vue',
    //'vue-grid-layout': 'VueGridLayout' 
  }
}