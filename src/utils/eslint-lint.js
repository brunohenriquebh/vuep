// CodeMirror Lint addon to use ESLint, copyright (c) by Angelo ZERR and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

// Depends on eslint.js from https://github.com/eslint/eslint

//const Linter = require("eslint");
//import Linter from "eslint4b";
//const linter = new Linter();

(function(mod) {
  if (typeof exports == "object" && typeof module == "object")
    // CommonJS
    mod(require("codemirror"));
  else if (typeof define == "function" && define.amd)
    // AMD
    define(["codemirror"], mod);
  // Plain browser env
  else mod(CodeMirror);
})(function(CodeMirror) {
  "use strict";

  function validator(text, options) {
    if (window.linter == undefined) return [];

    var result = [],
      config =
        window.linterDefaultConfig !== undefined
          ? window.linterDefaultConfig
          : {};
    //var linter = new Linter();
    //Objeto global window.linter carregado antes usando a nova lib eslint-browser que criei

    var errors = window.linter.verify(text, config, { filename: "foo.js" });

    /*
   column: 3
fatal: true
line: 2
message: "Parsing error: The keyword 'export' is reserved"
ruleId: null
severity: 2
   */
    for (var i = 0; i < errors.length; i++) {
      var error = errors[i];
      var objLintError = {
        message: error.message,
        severity: getSeverity(error),
        from: getPos(error, true),
        to: getPos(error, false)
      };
      result.push(objLintError);
    }
    return result;
  }

  CodeMirror.registerHelper("lint", "javascript", validator);

  function getPos(error, from) {
    var line = error.line - 1,
      ch = from ? error.column : error.column + 1;
    if (error.node && error.node.loc) {
      line = from ? error.node.loc.start.line - 1 : error.node.loc.end.line - 1;
      ch = from ? error.node.loc.start.column : error.node.loc.end.column;
    }
    return CodeMirror.Pos(line, ch);
  }

  function getSeverity(error) {
    switch (error.severity) {
      case 1:
        return "warning";
      case 2:
        return "error";
      default:
        return "error";
    }
  }
});
