<template>
  <section class="app">
    <nav v-if="false" class="navbar">
      <span>Vuep.run</span>

      <ul class="list">
        <li>
          <a target="_blank" href="//github.com/qingwei-li/vuep.run">GitHub</a>
        </li>
      </ul>
      <button @click="upload" class="save">Save</button>
    </nav>

    <main class="main">
    <grid-layout
             :layout="layout"
            :col-num="12"
            :row-height="100"
            :is-draggable="true"
            :is-resizable="true"
            :is-mirrored="false"
            :vertical-compact="false"
            :margin="[10, 10]"
            :use-css-transforms="false"
            @layout-updated="layoutUpdatedEvent"
    >
     <grid-item v-for="item in layout"
                   :x="item.x"
                   :y="item.y"
                   :w="item.w"
                   :h="item.h"
                   :i="item.i" 
                   :key="item.i"
                   drag-ignore-from=".CodeMirror"
                    >
                   <editor v-if="item['mode'] != 'preview'"  class="panel" v-bind:data="item" @change="change($event, item['mode'])" :mode="item.mode" :element-name="item['elementName']"></editor>
                   <preview  v-if="item['mode'] == 'preview'"  :value="preview" class="panel" :iframe="iframe" :complexPreviewUrl="complexPreviewUrl"></preview>
        </grid-item>

    </grid-layout>

    </main>
  </section>
</template>

<script>
import Editor from './editor.vue';
import Preview from './preview.vue';
import { parseComponent } from 'vue-template-compiler/browser';
import { parse as queryParse } from 'query-string';
import getImports from '../utils/get-imports';
import getPkgs from '../utils/get-pkgs';
import isAbsouteUrl from 'is-absolute-url';
import { upload } from '../utils/store';
import * as params from '../utils/params';




const CDN_MAP = {
  unpkg: '//unpkg.com/',
  jsdelivr: '//cdn.jsdelivr.net/npm/'
};

export default {
  name: 'vuep',
  components: {
    Editor,
    Preview,
    
  },
  props: {
    options: {},
    elInputHtml: String,
    elInputCss: String,
    elInputJs: String,
    iframe: String,
    layout: Array,
    complexPreviewUrl: String //Se o component não puder se renderlizado localmente, o iframe é criado com a URL
  },

  mounted(){


      //
      //for(var i in this.layoutConfig){

      //}
      this.initialized = true;


  },
 created(){
     this.code_html  = document.getElementById(this.elInputHtml).value;
     this.code_css  = document.getElementById(this.elInputCss).value;
     this.code_js  = document.getElementById(this.elInputJs).value;
    

    if(this.layout == null || this.layout.length == 0)
        this.layout = [   
          {"x":0,"y":3,"w":5,"h":2,"i":"0", "mode": "html", "elementName": this.elInputHtml},
          {"x":5,"y":3,"w":5,"h":2,"i":"1",  "mode": "js", "elementName": this.elInputJs},
          {"x":10,"y":3,"w":2,"h":2,"i":"2",  "mode": "css", "elementName": this.elInputCss},
          {"x":0,"y":0,"w":12,"h":3,"i":"3",  "mode": "preview"},
        ];



  },

  data: () => ({
    initialized: false,
    preview: '',
    code: '',
    code_html : '',
    code_js: '',
    code_css: '',
    layoutConfig: []
  }),

  methods: {
      layoutUpdatedEvent: function(newLayout){
        //console.log("Updated layout: ", newLayout)
        if(this.$bus != null){
          this.$bus.$emit('layout-updated-event', newLayout);
        }
      },
      change(code, mode){
        if(mode == 'html'){
          this.changeHtml(code);
        }
        else if(mode == 'js'){
          this.changeJs(code);
        }
        else if(mode == 'css'){
          this.changeCss(code);

        }

      },
      changeHtml(code) {
        this.code_html = code;
        document.getElementById(this.elInputHtml).value = code; //Atualiza o input hidden tbm
        this.compile();

      },
      changeCss(code) {
        this.code_css = code;
        document.getElementById(this.elInputCss).value = code; //Atualiza o input hidden tbm
        this.compile();

      },
      changeJs(code) {
        this.code_js = code;
        document.getElementById(this.elInputJs).value = code; //Atualiza o input hidden tbm
        this.compile();

      },
    compile() {
   
      //Begin template with string_vue: to custom browser-vue-loader parse  as string
      this.code =  'string_vue: <template>\n'+ this.code_html + '\n<\/template> \n <script>\n'+ this.code_js +'\n<\/script> \n<style scoped>\n'+ this.code_css +'\n<\/style> ';
   
      if (!this.code || !this.initialized ) {
        return;
      }

        if(this.iframe!= null  && this.complexPreviewUrl == ''){ //Somente componentes sem url para previsualização complexa são renderizados no component localmente
            var iframe = document.getElementById(this.iframe);
            
            var   innerDoc = (iframe.contentDocument) 
              ? iframe.contentDocument 
              : iframe.contentWindow.document;

            loadVueOnDocument( this.code, innerDoc).then(
              App => {
                var component =     new Vue({
                  render: h => h(App),
                }).$mount();

                if(innerDoc.body != null){ //<Ja carregou todo o iframe

                  innerDoc.body.innerHTML = "";
                  innerDoc.body.appendChild(component.$el);
                }

            }
        )


        }

        return;
    }




  }
};
</script>


<style lang="stylus">

.main
  display flex

.vue-grid-layout
 width: 100%;

 .panel
   height: 100%;
   padding-top: 20px;
 



</style>
