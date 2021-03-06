<template>
  <div class="editor"> {{ upperLabel }}
    <textarea ref="textarea" class="editor" :name="elementName" :id="elementId">
    </textarea>
  </div>
</template>

<script>
import CodeMirror from "codemirror";
import emmet from "@emmetio/codemirror-plugin";
//import 'codemirror/lib/codemirror.css';

import "codemirror/addon/selection/active-line";
import "codemirror/addon/edit/matchbrackets";
import "codemirror/mode/vue/vue";
//Es Lint
import "../utils/eslint-lint.js";
//import 'eslint';
import "codemirror/addon/lint/lint.js";
import "codemirror/mode/javascript/javascript";
//
import "codemirror/addon/search/search.js";
import "codemirror/addon/search/searchcursor.js";
import "codemirror/addon/search/jump-to-line.js";
import "codemirror/addon/dialog/dialog.js";

//
 
//
import { debounce } from "throttle-debounce";
import isAbsouteUrl from "is-absolute-url";
import { downloadURL } from "../utils/store";

//emmet(CodeMirror);
const defaultValueHtml = `  <div>
    <h2>Hello</h2>
    <h3>Demo</h3>
    <ul>
      <li v-for="url in urls">
        <a target="_blank" :href="url">{{ url }}</a>
      </li>
    </ul>
  </div>`;

const defaultValueJs = `export default {
  data: () => ({

    urls: [
      'https://vuep.run/QingWei-Li/vue-trend/docs/home.vue',
      'https://vuep.run/QingWei-Li/vuep.run/examples/element-ui.vue?pkg=element-ui&css=element-ui/lib/theme-chalk/index.css',
      'https://vuep.run/vuetifyjs/vuetifyjs.com/blob/dev/examples/ripples/navigationDrawers.vue?pkg=vuetify&css=vuetify/dist/vuetify.min.css'
    ]
  })
}`;

const defaultValueCss = ``;

export default {
  data: () => ({
    code: ""
  }),
  props: ["mode", "elementName", "label"],

  computed: {
    upperLabel() {
      return this.label.toUpperCase();
    },
    elementId() {
      return this.elementName +'-text-area';
    }
  },
  methods: {
    getFileContent(filename) {
      this.$toasted.show("Loading file...");

      let url;
      if (/^\w+$/.test(filename)) {
        url = downloadURL(filename);
      } else if (isAbsouteUrl(filename)) {
        url = filename;
      } else if (/^[\w-]+\.\w+/.test(filename)) {
        url = "//" + filename;
      } else {
        // convert url to github raw url
        const repo = filename.match(
          /^([^\/]+\/[^\/]+)(\/blob\/([\w-]+))?(\S+)$/
        );
        url = `//raw.githubusercontent.com/${repo[1]}/${repo[3] || "master"}${
          repo[4]
        }`;
      }

      if (/github\.com\//.test(url)) {
        url = url
          .replace(/github\.com\//, "raw.githubusercontent.com/")
          .replace(/\/blob\//, "/");
      }

      try {
        const result = fetch(url);

        this.$toasted.clear();

        return result.text();
      } catch (e) {
        this.$toasted.clear();
        this.$toasted.show("File not found", {
          type: "error",
          duration: 2000
        });
        return null;
      }
    }
  },

  mounted() {
    var modeParams = {
      html: {
        //defaultValue: defaultValueHtml,
        editorMode: "vue",
        autofocus: false,
        lint: false
      },
      css: {
        //defaultValue: defaultValueCss,
        editorMode: "css",
        autofocus: false,
        lint: false
      },
      js: {
        //defaultValue: defaultValueJs,
        editorMode: "javascript",
        autofocus: true,
        lint: true
      }
    };

    const editor = CodeMirror.fromTextArea(this.$refs.textarea, {
      mode: modeParams[this.mode].editorMode,
      theme: "lucario",
      value: `<template></template>`,
      lineNumbers: true,
      tabSize: 2,
      autofocus: modeParams[this.mode].autofocus,
      lint: modeParams[this.mode].lint,
      gutters: ["CodeMirror-lint-markers"],
      line: true,
      styleActiveLine: true,
      indentWithTabs: false,
      matchBrackets: true,
      extraKeys: {
          "Alt-F": "findPersistent",
          Tab: (cm) => cm.execCommand("indentMore"),
          "Shift-Tab": (cm) => cm.execCommand("indentLess"),
        Enter: "emmetInsertLineBreak"
      }
    });
    editor.setSize("100%", "calc(100% - 32px)");

    editor.on(
      "change",
      debounce(200, () => {
        this.$emit("change", editor.getValue());
      })
    );

    let value;
    if (document.getElementById(this.elementName) != null) {
      value = document.getElementById(this.elementName).value;
    }
    value = value || modeParams[this.mode].defaultValue;
    if (value == null) {
      value = "";
    }

    editor.setValue(value);

    this.$emit("change", editor.getValue());
  }
};
</script>

<style lang="stylus" scoped>
.editor >>> .CodeMirror {
  border: 1px solid black;
  height: 100%;
  line-height: 1.2rem;
}
</style>
