import Vuep from "./";

if (typeof require !== "undefined") {
  require("codemirror/addon/mode/overlay");
  require("codemirror/addon/mode/simple");
  require("codemirror/mode/css/css");
  require("codemirror/mode/htmlmixed/htmlmixed");

  require("codemirror/mode/vue/vue");
  require("codemirror/mode/xml/xml");
  require("codemirror/mode/jsx/jsx");
  require("codemirror/addon/lint/lint.js");
  //require("codemirror/addon/lint/lint.css");
  require(" codemirror/addon/lint/javascript-lint");
  require("codemirror/mode/javascript/javascript");
}

export default Vuep;
