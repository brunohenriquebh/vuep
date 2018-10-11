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
                   <editor v-if="item['bindMethod'] != null"  class="panel" v-bind:data="item" @change="item['bindMethod']" :mode="item.mode" :element-name="item['elementName']"></editor>
                   <preview  v-if="item['bindMethod'] == null"  :value="preview" class="panel" :iframe="iframe"></preview>
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
    iframe: String
  },

  mounted(){
      this.layout = [   
        {"x":0,"y":3,"w":5,"h":2,"i":"0", "bindMethod": this.changeHtml, "mode": "html", "elementName": this.elInputHtml},
	      {"x":5,"y":3,"w":5,"h":2,"i":"1", "bindMethod": this.changeJs, "mode": "js", "elementName": this.elInputJs},
	      {"x":10,"y":3,"w":2,"h":2,"i":"2", "bindMethod": this.changeCss, "mode": "css", "elementName": this.elInputCss},
        {"x":0,"y":0,"w":12,"h":3,"i":"3", "bindMethod": null, "mode": "preview"},
      ];
      this.initialized = true;


  },
 created(){
     this.code_html  = document.getElementById(this.elInputHtml).value;
     this.code_css  = document.getElementById(this.elInputCss).value;
     this.code_js  = document.getElementById(this.elInputJs).value;
  },

  data: () => ({
    initialized: false,
    preview: '',
    code: '',
    code_html : '',
    code_js: '',
    code_css: '',
    layout: [
    ]
  }),

  methods: {
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

        if(this.iframe!= null){
            var iframe = document.getElementById(this.iframe);
            
            var   innerDoc = (iframe.contentDocument) 
              ? iframe.contentDocument 
              : iframe.contentWindow.document;

            loadVueOnDocument( this.code, innerDoc).then(
              App => {
            

                var component =     new Vue({
                  render: h => h(App),
                }).$mount();

                innerDoc.body.innerHTML = "";
                innerDoc.body.appendChild(component.$el);

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
 



</style>
