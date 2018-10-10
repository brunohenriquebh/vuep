import Vuep from './components/playground.vue'
import toasted from 'vue-toasted';







Vuep.config = function (opts) {
  Vuep.props.options.default = () => opts
}

function install (Vue, opts) {
  Vuep.config(opts)
  Vue.component(Vuep.name, Vuep)
  Vue.use(toasted)
  //Vue.component(VueGridLayout.GridLayout.name, VueGridLayout.GridLayout)
  //Vue.component(VueGridLayout.GridItem.name, VueGridLayout.GridItem)
  

}

Vuep.install = install

if (typeof Vue !== 'undefined') {
  Vue.use(install) // eslint-disable-line
}

export default Vuep
