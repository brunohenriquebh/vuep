var Vuep = (function (Vue$1) {
	'use strict';

	Vue$1 = Vue$1 && Vue$1.hasOwnProperty('default') ? Vue$1['default'] : Vue$1;

	var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

	function unwrapExports (x) {
		return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x.default : x;
	}

	function createCommonjsModule(fn, module) {
		return module = { exports: {} }, fn(module, module.exports), module.exports;
	}

	var codemirror = createCommonjsModule(function (module, exports) {
	// CodeMirror, copyright (c) by Marijn Haverbeke and others
	// Distributed under an MIT license: https://codemirror.net/LICENSE

	// This is CodeMirror (https://codemirror.net), a code editor
	// implemented in JavaScript on top of the browser's DOM.
	//
	// You can find some technical background for some of the code below
	// at http://marijnhaverbeke.nl/blog/#cm-internals .

	(function (global, factory) {
		module.exports = factory();
	}(commonjsGlobal, (function () {
	// Kludges for bugs and behavior differences that can't be feature
	// detected are enabled based on userAgent etc sniffing.
	var userAgent = navigator.userAgent;
	var platform = navigator.platform;

	var gecko = /gecko\/\d/i.test(userAgent);
	var ie_upto10 = /MSIE \d/.test(userAgent);
	var ie_11up = /Trident\/(?:[7-9]|\d{2,})\..*rv:(\d+)/.exec(userAgent);
	var edge = /Edge\/(\d+)/.exec(userAgent);
	var ie = ie_upto10 || ie_11up || edge;
	var ie_version = ie && (ie_upto10 ? document.documentMode || 6 : +(edge || ie_11up)[1]);
	var webkit = !edge && /WebKit\//.test(userAgent);
	var qtwebkit = webkit && /Qt\/\d+\.\d+/.test(userAgent);
	var chrome = !edge && /Chrome\//.test(userAgent);
	var presto = /Opera\//.test(userAgent);
	var safari = /Apple Computer/.test(navigator.vendor);
	var mac_geMountainLion = /Mac OS X 1\d\D([8-9]|\d\d)\D/.test(userAgent);
	var phantom = /PhantomJS/.test(userAgent);

	var ios = !edge && /AppleWebKit/.test(userAgent) && /Mobile\/\w+/.test(userAgent);
	var android = /Android/.test(userAgent);
	// This is woefully incomplete. Suggestions for alternative methods welcome.
	var mobile = ios || android || /webOS|BlackBerry|Opera Mini|Opera Mobi|IEMobile/i.test(userAgent);
	var mac = ios || /Mac/.test(platform);
	var chromeOS = /\bCrOS\b/.test(userAgent);
	var windows = /win/i.test(platform);

	var presto_version = presto && userAgent.match(/Version\/(\d*\.\d*)/);
	if (presto_version) { presto_version = Number(presto_version[1]); }
	if (presto_version && presto_version >= 15) { presto = false; webkit = true; }
	// Some browsers use the wrong event properties to signal cmd/ctrl on OS X
	var flipCtrlCmd = mac && (qtwebkit || presto && (presto_version == null || presto_version < 12.11));
	var captureRightClick = gecko || (ie && ie_version >= 9);

	function classTest(cls) { return new RegExp("(^|\\s)" + cls + "(?:$|\\s)\\s*") }

	var rmClass = function(node, cls) {
	  var current = node.className;
	  var match = classTest(cls).exec(current);
	  if (match) {
	    var after = current.slice(match.index + match[0].length);
	    node.className = current.slice(0, match.index) + (after ? match[1] + after : "");
	  }
	};

	function removeChildren(e) {
	  for (var count = e.childNodes.length; count > 0; --count)
	    { e.removeChild(e.firstChild); }
	  return e
	}

	function removeChildrenAndAdd(parent, e) {
	  return removeChildren(parent).appendChild(e)
	}

	function elt(tag, content, className, style) {
	  var e = document.createElement(tag);
	  if (className) { e.className = className; }
	  if (style) { e.style.cssText = style; }
	  if (typeof content == "string") { e.appendChild(document.createTextNode(content)); }
	  else if (content) { for (var i = 0; i < content.length; ++i) { e.appendChild(content[i]); } }
	  return e
	}
	// wrapper for elt, which removes the elt from the accessibility tree
	function eltP(tag, content, className, style) {
	  var e = elt(tag, content, className, style);
	  e.setAttribute("role", "presentation");
	  return e
	}

	var range;
	if (document.createRange) { range = function(node, start, end, endNode) {
	  var r = document.createRange();
	  r.setEnd(endNode || node, end);
	  r.setStart(node, start);
	  return r
	}; }
	else { range = function(node, start, end) {
	  var r = document.body.createTextRange();
	  try { r.moveToElementText(node.parentNode); }
	  catch(e) { return r }
	  r.collapse(true);
	  r.moveEnd("character", end);
	  r.moveStart("character", start);
	  return r
	}; }

	function contains(parent, child) {
	  if (child.nodeType == 3) // Android browser always returns false when child is a textnode
	    { child = child.parentNode; }
	  if (parent.contains)
	    { return parent.contains(child) }
	  do {
	    if (child.nodeType == 11) { child = child.host; }
	    if (child == parent) { return true }
	  } while (child = child.parentNode)
	}

	function activeElt() {
	  // IE and Edge may throw an "Unspecified Error" when accessing document.activeElement.
	  // IE < 10 will throw when accessed while the page is loading or in an iframe.
	  // IE > 9 and Edge will throw when accessed in an iframe if document.body is unavailable.
	  var activeElement;
	  try {
	    activeElement = document.activeElement;
	  } catch(e) {
	    activeElement = document.body || null;
	  }
	  while (activeElement && activeElement.shadowRoot && activeElement.shadowRoot.activeElement)
	    { activeElement = activeElement.shadowRoot.activeElement; }
	  return activeElement
	}

	function addClass(node, cls) {
	  var current = node.className;
	  if (!classTest(cls).test(current)) { node.className += (current ? " " : "") + cls; }
	}
	function joinClasses(a, b) {
	  var as = a.split(" ");
	  for (var i = 0; i < as.length; i++)
	    { if (as[i] && !classTest(as[i]).test(b)) { b += " " + as[i]; } }
	  return b
	}

	var selectInput = function(node) { node.select(); };
	if (ios) // Mobile Safari apparently has a bug where select() is broken.
	  { selectInput = function(node) { node.selectionStart = 0; node.selectionEnd = node.value.length; }; }
	else if (ie) // Suppress mysterious IE10 errors
	  { selectInput = function(node) { try { node.select(); } catch(_e) {} }; }

	function bind(f) {
	  var args = Array.prototype.slice.call(arguments, 1);
	  return function(){return f.apply(null, args)}
	}

	function copyObj(obj, target, overwrite) {
	  if (!target) { target = {}; }
	  for (var prop in obj)
	    { if (obj.hasOwnProperty(prop) && (overwrite !== false || !target.hasOwnProperty(prop)))
	      { target[prop] = obj[prop]; } }
	  return target
	}

	// Counts the column offset in a string, taking tabs into account.
	// Used mostly to find indentation.
	function countColumn(string, end, tabSize, startIndex, startValue) {
	  if (end == null) {
	    end = string.search(/[^\s\u00a0]/);
	    if (end == -1) { end = string.length; }
	  }
	  for (var i = startIndex || 0, n = startValue || 0;;) {
	    var nextTab = string.indexOf("\t", i);
	    if (nextTab < 0 || nextTab >= end)
	      { return n + (end - i) }
	    n += nextTab - i;
	    n += tabSize - (n % tabSize);
	    i = nextTab + 1;
	  }
	}

	var Delayed = function() {this.id = null;};
	Delayed.prototype.set = function (ms, f) {
	  clearTimeout(this.id);
	  this.id = setTimeout(f, ms);
	};

	function indexOf(array, elt) {
	  for (var i = 0; i < array.length; ++i)
	    { if (array[i] == elt) { return i } }
	  return -1
	}

	// Number of pixels added to scroller and sizer to hide scrollbar
	var scrollerGap = 30;

	// Returned or thrown by various protocols to signal 'I'm not
	// handling this'.
	var Pass = {toString: function(){return "CodeMirror.Pass"}};

	// Reused option objects for setSelection & friends
	var sel_dontScroll = {scroll: false};
	var sel_mouse = {origin: "*mouse"};
	var sel_move = {origin: "+move"};

	// The inverse of countColumn -- find the offset that corresponds to
	// a particular column.
	function findColumn(string, goal, tabSize) {
	  for (var pos = 0, col = 0;;) {
	    var nextTab = string.indexOf("\t", pos);
	    if (nextTab == -1) { nextTab = string.length; }
	    var skipped = nextTab - pos;
	    if (nextTab == string.length || col + skipped >= goal)
	      { return pos + Math.min(skipped, goal - col) }
	    col += nextTab - pos;
	    col += tabSize - (col % tabSize);
	    pos = nextTab + 1;
	    if (col >= goal) { return pos }
	  }
	}

	var spaceStrs = [""];
	function spaceStr(n) {
	  while (spaceStrs.length <= n)
	    { spaceStrs.push(lst(spaceStrs) + " "); }
	  return spaceStrs[n]
	}

	function lst(arr) { return arr[arr.length-1] }

	function map(array, f) {
	  var out = [];
	  for (var i = 0; i < array.length; i++) { out[i] = f(array[i], i); }
	  return out
	}

	function insertSorted(array, value, score) {
	  var pos = 0, priority = score(value);
	  while (pos < array.length && score(array[pos]) <= priority) { pos++; }
	  array.splice(pos, 0, value);
	}

	function nothing() {}

	function createObj(base, props) {
	  var inst;
	  if (Object.create) {
	    inst = Object.create(base);
	  } else {
	    nothing.prototype = base;
	    inst = new nothing();
	  }
	  if (props) { copyObj(props, inst); }
	  return inst
	}

	var nonASCIISingleCaseWordChar = /[\u00df\u0587\u0590-\u05f4\u0600-\u06ff\u3040-\u309f\u30a0-\u30ff\u3400-\u4db5\u4e00-\u9fcc\uac00-\ud7af]/;
	function isWordCharBasic(ch) {
	  return /\w/.test(ch) || ch > "\x80" &&
	    (ch.toUpperCase() != ch.toLowerCase() || nonASCIISingleCaseWordChar.test(ch))
	}
	function isWordChar(ch, helper) {
	  if (!helper) { return isWordCharBasic(ch) }
	  if (helper.source.indexOf("\\w") > -1 && isWordCharBasic(ch)) { return true }
	  return helper.test(ch)
	}

	function isEmpty(obj) {
	  for (var n in obj) { if (obj.hasOwnProperty(n) && obj[n]) { return false } }
	  return true
	}

	// Extending unicode characters. A series of a non-extending char +
	// any number of extending chars is treated as a single unit as far
	// as editing and measuring is concerned. This is not fully correct,
	// since some scripts/fonts/browsers also treat other configurations
	// of code points as a group.
	var extendingChars = /[\u0300-\u036f\u0483-\u0489\u0591-\u05bd\u05bf\u05c1\u05c2\u05c4\u05c5\u05c7\u0610-\u061a\u064b-\u065e\u0670\u06d6-\u06dc\u06de-\u06e4\u06e7\u06e8\u06ea-\u06ed\u0711\u0730-\u074a\u07a6-\u07b0\u07eb-\u07f3\u0816-\u0819\u081b-\u0823\u0825-\u0827\u0829-\u082d\u0900-\u0902\u093c\u0941-\u0948\u094d\u0951-\u0955\u0962\u0963\u0981\u09bc\u09be\u09c1-\u09c4\u09cd\u09d7\u09e2\u09e3\u0a01\u0a02\u0a3c\u0a41\u0a42\u0a47\u0a48\u0a4b-\u0a4d\u0a51\u0a70\u0a71\u0a75\u0a81\u0a82\u0abc\u0ac1-\u0ac5\u0ac7\u0ac8\u0acd\u0ae2\u0ae3\u0b01\u0b3c\u0b3e\u0b3f\u0b41-\u0b44\u0b4d\u0b56\u0b57\u0b62\u0b63\u0b82\u0bbe\u0bc0\u0bcd\u0bd7\u0c3e-\u0c40\u0c46-\u0c48\u0c4a-\u0c4d\u0c55\u0c56\u0c62\u0c63\u0cbc\u0cbf\u0cc2\u0cc6\u0ccc\u0ccd\u0cd5\u0cd6\u0ce2\u0ce3\u0d3e\u0d41-\u0d44\u0d4d\u0d57\u0d62\u0d63\u0dca\u0dcf\u0dd2-\u0dd4\u0dd6\u0ddf\u0e31\u0e34-\u0e3a\u0e47-\u0e4e\u0eb1\u0eb4-\u0eb9\u0ebb\u0ebc\u0ec8-\u0ecd\u0f18\u0f19\u0f35\u0f37\u0f39\u0f71-\u0f7e\u0f80-\u0f84\u0f86\u0f87\u0f90-\u0f97\u0f99-\u0fbc\u0fc6\u102d-\u1030\u1032-\u1037\u1039\u103a\u103d\u103e\u1058\u1059\u105e-\u1060\u1071-\u1074\u1082\u1085\u1086\u108d\u109d\u135f\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u17b7-\u17bd\u17c6\u17c9-\u17d3\u17dd\u180b-\u180d\u18a9\u1920-\u1922\u1927\u1928\u1932\u1939-\u193b\u1a17\u1a18\u1a56\u1a58-\u1a5e\u1a60\u1a62\u1a65-\u1a6c\u1a73-\u1a7c\u1a7f\u1b00-\u1b03\u1b34\u1b36-\u1b3a\u1b3c\u1b42\u1b6b-\u1b73\u1b80\u1b81\u1ba2-\u1ba5\u1ba8\u1ba9\u1c2c-\u1c33\u1c36\u1c37\u1cd0-\u1cd2\u1cd4-\u1ce0\u1ce2-\u1ce8\u1ced\u1dc0-\u1de6\u1dfd-\u1dff\u200c\u200d\u20d0-\u20f0\u2cef-\u2cf1\u2de0-\u2dff\u302a-\u302f\u3099\u309a\ua66f-\ua672\ua67c\ua67d\ua6f0\ua6f1\ua802\ua806\ua80b\ua825\ua826\ua8c4\ua8e0-\ua8f1\ua926-\ua92d\ua947-\ua951\ua980-\ua982\ua9b3\ua9b6-\ua9b9\ua9bc\uaa29-\uaa2e\uaa31\uaa32\uaa35\uaa36\uaa43\uaa4c\uaab0\uaab2-\uaab4\uaab7\uaab8\uaabe\uaabf\uaac1\uabe5\uabe8\uabed\udc00-\udfff\ufb1e\ufe00-\ufe0f\ufe20-\ufe26\uff9e\uff9f]/;
	function isExtendingChar(ch) { return ch.charCodeAt(0) >= 768 && extendingChars.test(ch) }

	// Returns a number from the range [`0`; `str.length`] unless `pos` is outside that range.
	function skipExtendingChars(str, pos, dir) {
	  while ((dir < 0 ? pos > 0 : pos < str.length) && isExtendingChar(str.charAt(pos))) { pos += dir; }
	  return pos
	}

	// Returns the value from the range [`from`; `to`] that satisfies
	// `pred` and is closest to `from`. Assumes that at least `to`
	// satisfies `pred`. Supports `from` being greater than `to`.
	function findFirst(pred, from, to) {
	  // At any point we are certain `to` satisfies `pred`, don't know
	  // whether `from` does.
	  var dir = from > to ? -1 : 1;
	  for (;;) {
	    if (from == to) { return from }
	    var midF = (from + to) / 2, mid = dir < 0 ? Math.ceil(midF) : Math.floor(midF);
	    if (mid == from) { return pred(mid) ? from : to }
	    if (pred(mid)) { to = mid; }
	    else { from = mid + dir; }
	  }
	}

	// The display handles the DOM integration, both for input reading
	// and content drawing. It holds references to DOM nodes and
	// display-related state.

	function Display(place, doc, input) {
	  var d = this;
	  this.input = input;

	  // Covers bottom-right square when both scrollbars are present.
	  d.scrollbarFiller = elt("div", null, "CodeMirror-scrollbar-filler");
	  d.scrollbarFiller.setAttribute("cm-not-content", "true");
	  // Covers bottom of gutter when coverGutterNextToScrollbar is on
	  // and h scrollbar is present.
	  d.gutterFiller = elt("div", null, "CodeMirror-gutter-filler");
	  d.gutterFiller.setAttribute("cm-not-content", "true");
	  // Will contain the actual code, positioned to cover the viewport.
	  d.lineDiv = eltP("div", null, "CodeMirror-code");
	  // Elements are added to these to represent selection and cursors.
	  d.selectionDiv = elt("div", null, null, "position: relative; z-index: 1");
	  d.cursorDiv = elt("div", null, "CodeMirror-cursors");
	  // A visibility: hidden element used to find the size of things.
	  d.measure = elt("div", null, "CodeMirror-measure");
	  // When lines outside of the viewport are measured, they are drawn in this.
	  d.lineMeasure = elt("div", null, "CodeMirror-measure");
	  // Wraps everything that needs to exist inside the vertically-padded coordinate system
	  d.lineSpace = eltP("div", [d.measure, d.lineMeasure, d.selectionDiv, d.cursorDiv, d.lineDiv],
	                    null, "position: relative; outline: none");
	  var lines = eltP("div", [d.lineSpace], "CodeMirror-lines");
	  // Moved around its parent to cover visible view.
	  d.mover = elt("div", [lines], null, "position: relative");
	  // Set to the height of the document, allowing scrolling.
	  d.sizer = elt("div", [d.mover], "CodeMirror-sizer");
	  d.sizerWidth = null;
	  // Behavior of elts with overflow: auto and padding is
	  // inconsistent across browsers. This is used to ensure the
	  // scrollable area is big enough.
	  d.heightForcer = elt("div", null, null, "position: absolute; height: " + scrollerGap + "px; width: 1px;");
	  // Will contain the gutters, if any.
	  d.gutters = elt("div", null, "CodeMirror-gutters");
	  d.lineGutter = null;
	  // Actual scrollable element.
	  d.scroller = elt("div", [d.sizer, d.heightForcer, d.gutters], "CodeMirror-scroll");
	  d.scroller.setAttribute("tabIndex", "-1");
	  // The element in which the editor lives.
	  d.wrapper = elt("div", [d.scrollbarFiller, d.gutterFiller, d.scroller], "CodeMirror");

	  // Work around IE7 z-index bug (not perfect, hence IE7 not really being supported)
	  if (ie && ie_version < 8) { d.gutters.style.zIndex = -1; d.scroller.style.paddingRight = 0; }
	  if (!webkit && !(gecko && mobile)) { d.scroller.draggable = true; }

	  if (place) {
	    if (place.appendChild) { place.appendChild(d.wrapper); }
	    else { place(d.wrapper); }
	  }

	  // Current rendered range (may be bigger than the view window).
	  d.viewFrom = d.viewTo = doc.first;
	  d.reportedViewFrom = d.reportedViewTo = doc.first;
	  // Information about the rendered lines.
	  d.view = [];
	  d.renderedView = null;
	  // Holds info about a single rendered line when it was rendered
	  // for measurement, while not in view.
	  d.externalMeasured = null;
	  // Empty space (in pixels) above the view
	  d.viewOffset = 0;
	  d.lastWrapHeight = d.lastWrapWidth = 0;
	  d.updateLineNumbers = null;

	  d.nativeBarWidth = d.barHeight = d.barWidth = 0;
	  d.scrollbarsClipped = false;

	  // Used to only resize the line number gutter when necessary (when
	  // the amount of lines crosses a boundary that makes its width change)
	  d.lineNumWidth = d.lineNumInnerWidth = d.lineNumChars = null;
	  // Set to true when a non-horizontal-scrolling line widget is
	  // added. As an optimization, line widget aligning is skipped when
	  // this is false.
	  d.alignWidgets = false;

	  d.cachedCharWidth = d.cachedTextHeight = d.cachedPaddingH = null;

	  // Tracks the maximum line length so that the horizontal scrollbar
	  // can be kept static when scrolling.
	  d.maxLine = null;
	  d.maxLineLength = 0;
	  d.maxLineChanged = false;

	  // Used for measuring wheel scrolling granularity
	  d.wheelDX = d.wheelDY = d.wheelStartX = d.wheelStartY = null;

	  // True when shift is held down.
	  d.shift = false;

	  // Used to track whether anything happened since the context menu
	  // was opened.
	  d.selForContextMenu = null;

	  d.activeTouch = null;

	  input.init(d);
	}

	// Find the line object corresponding to the given line number.
	function getLine(doc, n) {
	  n -= doc.first;
	  if (n < 0 || n >= doc.size) { throw new Error("There is no line " + (n + doc.first) + " in the document.") }
	  var chunk = doc;
	  while (!chunk.lines) {
	    for (var i = 0;; ++i) {
	      var child = chunk.children[i], sz = child.chunkSize();
	      if (n < sz) { chunk = child; break }
	      n -= sz;
	    }
	  }
	  return chunk.lines[n]
	}

	// Get the part of a document between two positions, as an array of
	// strings.
	function getBetween(doc, start, end) {
	  var out = [], n = start.line;
	  doc.iter(start.line, end.line + 1, function (line) {
	    var text = line.text;
	    if (n == end.line) { text = text.slice(0, end.ch); }
	    if (n == start.line) { text = text.slice(start.ch); }
	    out.push(text);
	    ++n;
	  });
	  return out
	}
	// Get the lines between from and to, as array of strings.
	function getLines(doc, from, to) {
	  var out = [];
	  doc.iter(from, to, function (line) { out.push(line.text); }); // iter aborts when callback returns truthy value
	  return out
	}

	// Update the height of a line, propagating the height change
	// upwards to parent nodes.
	function updateLineHeight(line, height) {
	  var diff = height - line.height;
	  if (diff) { for (var n = line; n; n = n.parent) { n.height += diff; } }
	}

	// Given a line object, find its line number by walking up through
	// its parent links.
	function lineNo(line) {
	  if (line.parent == null) { return null }
	  var cur = line.parent, no = indexOf(cur.lines, line);
	  for (var chunk = cur.parent; chunk; cur = chunk, chunk = chunk.parent) {
	    for (var i = 0;; ++i) {
	      if (chunk.children[i] == cur) { break }
	      no += chunk.children[i].chunkSize();
	    }
	  }
	  return no + cur.first
	}

	// Find the line at the given vertical position, using the height
	// information in the document tree.
	function lineAtHeight(chunk, h) {
	  var n = chunk.first;
	  outer: do {
	    for (var i$1 = 0; i$1 < chunk.children.length; ++i$1) {
	      var child = chunk.children[i$1], ch = child.height;
	      if (h < ch) { chunk = child; continue outer }
	      h -= ch;
	      n += child.chunkSize();
	    }
	    return n
	  } while (!chunk.lines)
	  var i = 0;
	  for (; i < chunk.lines.length; ++i) {
	    var line = chunk.lines[i], lh = line.height;
	    if (h < lh) { break }
	    h -= lh;
	  }
	  return n + i
	}

	function isLine(doc, l) {return l >= doc.first && l < doc.first + doc.size}

	function lineNumberFor(options, i) {
	  return String(options.lineNumberFormatter(i + options.firstLineNumber))
	}

	// A Pos instance represents a position within the text.
	function Pos(line, ch, sticky) {
	  if ( sticky === void 0 ) { sticky = null; }

	  if (!(this instanceof Pos)) { return new Pos(line, ch, sticky) }
	  this.line = line;
	  this.ch = ch;
	  this.sticky = sticky;
	}

	// Compare two positions, return 0 if they are the same, a negative
	// number when a is less, and a positive number otherwise.
	function cmp(a, b) { return a.line - b.line || a.ch - b.ch }

	function equalCursorPos(a, b) { return a.sticky == b.sticky && cmp(a, b) == 0 }

	function copyPos(x) {return Pos(x.line, x.ch)}
	function maxPos(a, b) { return cmp(a, b) < 0 ? b : a }
	function minPos(a, b) { return cmp(a, b) < 0 ? a : b }

	// Most of the external API clips given positions to make sure they
	// actually exist within the document.
	function clipLine(doc, n) {return Math.max(doc.first, Math.min(n, doc.first + doc.size - 1))}
	function clipPos(doc, pos) {
	  if (pos.line < doc.first) { return Pos(doc.first, 0) }
	  var last = doc.first + doc.size - 1;
	  if (pos.line > last) { return Pos(last, getLine(doc, last).text.length) }
	  return clipToLen(pos, getLine(doc, pos.line).text.length)
	}
	function clipToLen(pos, linelen) {
	  var ch = pos.ch;
	  if (ch == null || ch > linelen) { return Pos(pos.line, linelen) }
	  else if (ch < 0) { return Pos(pos.line, 0) }
	  else { return pos }
	}
	function clipPosArray(doc, array) {
	  var out = [];
	  for (var i = 0; i < array.length; i++) { out[i] = clipPos(doc, array[i]); }
	  return out
	}

	// Optimize some code when these features are not used.
	var sawReadOnlySpans = false;
	var sawCollapsedSpans = false;

	function seeReadOnlySpans() {
	  sawReadOnlySpans = true;
	}

	function seeCollapsedSpans() {
	  sawCollapsedSpans = true;
	}

	// TEXTMARKER SPANS

	function MarkedSpan(marker, from, to) {
	  this.marker = marker;
	  this.from = from; this.to = to;
	}

	// Search an array of spans for a span matching the given marker.
	function getMarkedSpanFor(spans, marker) {
	  if (spans) { for (var i = 0; i < spans.length; ++i) {
	    var span = spans[i];
	    if (span.marker == marker) { return span }
	  } }
	}
	// Remove a span from an array, returning undefined if no spans are
	// left (we don't store arrays for lines without spans).
	function removeMarkedSpan(spans, span) {
	  var r;
	  for (var i = 0; i < spans.length; ++i)
	    { if (spans[i] != span) { (r || (r = [])).push(spans[i]); } }
	  return r
	}
	// Add a span to a line.
	function addMarkedSpan(line, span) {
	  line.markedSpans = line.markedSpans ? line.markedSpans.concat([span]) : [span];
	  span.marker.attachLine(line);
	}

	// Used for the algorithm that adjusts markers for a change in the
	// document. These functions cut an array of spans at a given
	// character position, returning an array of remaining chunks (or
	// undefined if nothing remains).
	function markedSpansBefore(old, startCh, isInsert) {
	  var nw;
	  if (old) { for (var i = 0; i < old.length; ++i) {
	    var span = old[i], marker = span.marker;
	    var startsBefore = span.from == null || (marker.inclusiveLeft ? span.from <= startCh : span.from < startCh);
	    if (startsBefore || span.from == startCh && marker.type == "bookmark" && (!isInsert || !span.marker.insertLeft)) {
	      var endsAfter = span.to == null || (marker.inclusiveRight ? span.to >= startCh : span.to > startCh);(nw || (nw = [])).push(new MarkedSpan(marker, span.from, endsAfter ? null : span.to));
	    }
	  } }
	  return nw
	}
	function markedSpansAfter(old, endCh, isInsert) {
	  var nw;
	  if (old) { for (var i = 0; i < old.length; ++i) {
	    var span = old[i], marker = span.marker;
	    var endsAfter = span.to == null || (marker.inclusiveRight ? span.to >= endCh : span.to > endCh);
	    if (endsAfter || span.from == endCh && marker.type == "bookmark" && (!isInsert || span.marker.insertLeft)) {
	      var startsBefore = span.from == null || (marker.inclusiveLeft ? span.from <= endCh : span.from < endCh);(nw || (nw = [])).push(new MarkedSpan(marker, startsBefore ? null : span.from - endCh,
	                                            span.to == null ? null : span.to - endCh));
	    }
	  } }
	  return nw
	}

	// Given a change object, compute the new set of marker spans that
	// cover the line in which the change took place. Removes spans
	// entirely within the change, reconnects spans belonging to the
	// same marker that appear on both sides of the change, and cuts off
	// spans partially within the change. Returns an array of span
	// arrays with one element for each line in (after) the change.
	function stretchSpansOverChange(doc, change) {
	  if (change.full) { return null }
	  var oldFirst = isLine(doc, change.from.line) && getLine(doc, change.from.line).markedSpans;
	  var oldLast = isLine(doc, change.to.line) && getLine(doc, change.to.line).markedSpans;
	  if (!oldFirst && !oldLast) { return null }

	  var startCh = change.from.ch, endCh = change.to.ch, isInsert = cmp(change.from, change.to) == 0;
	  // Get the spans that 'stick out' on both sides
	  var first = markedSpansBefore(oldFirst, startCh, isInsert);
	  var last = markedSpansAfter(oldLast, endCh, isInsert);

	  // Next, merge those two ends
	  var sameLine = change.text.length == 1, offset = lst(change.text).length + (sameLine ? startCh : 0);
	  if (first) {
	    // Fix up .to properties of first
	    for (var i = 0; i < first.length; ++i) {
	      var span = first[i];
	      if (span.to == null) {
	        var found = getMarkedSpanFor(last, span.marker);
	        if (!found) { span.to = startCh; }
	        else if (sameLine) { span.to = found.to == null ? null : found.to + offset; }
	      }
	    }
	  }
	  if (last) {
	    // Fix up .from in last (or move them into first in case of sameLine)
	    for (var i$1 = 0; i$1 < last.length; ++i$1) {
	      var span$1 = last[i$1];
	      if (span$1.to != null) { span$1.to += offset; }
	      if (span$1.from == null) {
	        var found$1 = getMarkedSpanFor(first, span$1.marker);
	        if (!found$1) {
	          span$1.from = offset;
	          if (sameLine) { (first || (first = [])).push(span$1); }
	        }
	      } else {
	        span$1.from += offset;
	        if (sameLine) { (first || (first = [])).push(span$1); }
	      }
	    }
	  }
	  // Make sure we didn't create any zero-length spans
	  if (first) { first = clearEmptySpans(first); }
	  if (last && last != first) { last = clearEmptySpans(last); }

	  var newMarkers = [first];
	  if (!sameLine) {
	    // Fill gap with whole-line-spans
	    var gap = change.text.length - 2, gapMarkers;
	    if (gap > 0 && first)
	      { for (var i$2 = 0; i$2 < first.length; ++i$2)
	        { if (first[i$2].to == null)
	          { (gapMarkers || (gapMarkers = [])).push(new MarkedSpan(first[i$2].marker, null, null)); } } }
	    for (var i$3 = 0; i$3 < gap; ++i$3)
	      { newMarkers.push(gapMarkers); }
	    newMarkers.push(last);
	  }
	  return newMarkers
	}

	// Remove spans that are empty and don't have a clearWhenEmpty
	// option of false.
	function clearEmptySpans(spans) {
	  for (var i = 0; i < spans.length; ++i) {
	    var span = spans[i];
	    if (span.from != null && span.from == span.to && span.marker.clearWhenEmpty !== false)
	      { spans.splice(i--, 1); }
	  }
	  if (!spans.length) { return null }
	  return spans
	}

	// Used to 'clip' out readOnly ranges when making a change.
	function removeReadOnlyRanges(doc, from, to) {
	  var markers = null;
	  doc.iter(from.line, to.line + 1, function (line) {
	    if (line.markedSpans) { for (var i = 0; i < line.markedSpans.length; ++i) {
	      var mark = line.markedSpans[i].marker;
	      if (mark.readOnly && (!markers || indexOf(markers, mark) == -1))
	        { (markers || (markers = [])).push(mark); }
	    } }
	  });
	  if (!markers) { return null }
	  var parts = [{from: from, to: to}];
	  for (var i = 0; i < markers.length; ++i) {
	    var mk = markers[i], m = mk.find(0);
	    for (var j = 0; j < parts.length; ++j) {
	      var p = parts[j];
	      if (cmp(p.to, m.from) < 0 || cmp(p.from, m.to) > 0) { continue }
	      var newParts = [j, 1], dfrom = cmp(p.from, m.from), dto = cmp(p.to, m.to);
	      if (dfrom < 0 || !mk.inclusiveLeft && !dfrom)
	        { newParts.push({from: p.from, to: m.from}); }
	      if (dto > 0 || !mk.inclusiveRight && !dto)
	        { newParts.push({from: m.to, to: p.to}); }
	      parts.splice.apply(parts, newParts);
	      j += newParts.length - 3;
	    }
	  }
	  return parts
	}

	// Connect or disconnect spans from a line.
	function detachMarkedSpans(line) {
	  var spans = line.markedSpans;
	  if (!spans) { return }
	  for (var i = 0; i < spans.length; ++i)
	    { spans[i].marker.detachLine(line); }
	  line.markedSpans = null;
	}
	function attachMarkedSpans(line, spans) {
	  if (!spans) { return }
	  for (var i = 0; i < spans.length; ++i)
	    { spans[i].marker.attachLine(line); }
	  line.markedSpans = spans;
	}

	// Helpers used when computing which overlapping collapsed span
	// counts as the larger one.
	function extraLeft(marker) { return marker.inclusiveLeft ? -1 : 0 }
	function extraRight(marker) { return marker.inclusiveRight ? 1 : 0 }

	// Returns a number indicating which of two overlapping collapsed
	// spans is larger (and thus includes the other). Falls back to
	// comparing ids when the spans cover exactly the same range.
	function compareCollapsedMarkers(a, b) {
	  var lenDiff = a.lines.length - b.lines.length;
	  if (lenDiff != 0) { return lenDiff }
	  var aPos = a.find(), bPos = b.find();
	  var fromCmp = cmp(aPos.from, bPos.from) || extraLeft(a) - extraLeft(b);
	  if (fromCmp) { return -fromCmp }
	  var toCmp = cmp(aPos.to, bPos.to) || extraRight(a) - extraRight(b);
	  if (toCmp) { return toCmp }
	  return b.id - a.id
	}

	// Find out whether a line ends or starts in a collapsed span. If
	// so, return the marker for that span.
	function collapsedSpanAtSide(line, start) {
	  var sps = sawCollapsedSpans && line.markedSpans, found;
	  if (sps) { for (var sp = (void 0), i = 0; i < sps.length; ++i) {
	    sp = sps[i];
	    if (sp.marker.collapsed && (start ? sp.from : sp.to) == null &&
	        (!found || compareCollapsedMarkers(found, sp.marker) < 0))
	      { found = sp.marker; }
	  } }
	  return found
	}
	function collapsedSpanAtStart(line) { return collapsedSpanAtSide(line, true) }
	function collapsedSpanAtEnd(line) { return collapsedSpanAtSide(line, false) }

	function collapsedSpanAround(line, ch) {
	  var sps = sawCollapsedSpans && line.markedSpans, found;
	  if (sps) { for (var i = 0; i < sps.length; ++i) {
	    var sp = sps[i];
	    if (sp.marker.collapsed && (sp.from == null || sp.from < ch) && (sp.to == null || sp.to > ch) &&
	        (!found || compareCollapsedMarkers(found, sp.marker) < 0)) { found = sp.marker; }
	  } }
	  return found
	}

	// Test whether there exists a collapsed span that partially
	// overlaps (covers the start or end, but not both) of a new span.
	// Such overlap is not allowed.
	function conflictingCollapsedRange(doc, lineNo$$1, from, to, marker) {
	  var line = getLine(doc, lineNo$$1);
	  var sps = sawCollapsedSpans && line.markedSpans;
	  if (sps) { for (var i = 0; i < sps.length; ++i) {
	    var sp = sps[i];
	    if (!sp.marker.collapsed) { continue }
	    var found = sp.marker.find(0);
	    var fromCmp = cmp(found.from, from) || extraLeft(sp.marker) - extraLeft(marker);
	    var toCmp = cmp(found.to, to) || extraRight(sp.marker) - extraRight(marker);
	    if (fromCmp >= 0 && toCmp <= 0 || fromCmp <= 0 && toCmp >= 0) { continue }
	    if (fromCmp <= 0 && (sp.marker.inclusiveRight && marker.inclusiveLeft ? cmp(found.to, from) >= 0 : cmp(found.to, from) > 0) ||
	        fromCmp >= 0 && (sp.marker.inclusiveRight && marker.inclusiveLeft ? cmp(found.from, to) <= 0 : cmp(found.from, to) < 0))
	      { return true }
	  } }
	}

	// A visual line is a line as drawn on the screen. Folding, for
	// example, can cause multiple logical lines to appear on the same
	// visual line. This finds the start of the visual line that the
	// given line is part of (usually that is the line itself).
	function visualLine(line) {
	  var merged;
	  while (merged = collapsedSpanAtStart(line))
	    { line = merged.find(-1, true).line; }
	  return line
	}

	function visualLineEnd(line) {
	  var merged;
	  while (merged = collapsedSpanAtEnd(line))
	    { line = merged.find(1, true).line; }
	  return line
	}

	// Returns an array of logical lines that continue the visual line
	// started by the argument, or undefined if there are no such lines.
	function visualLineContinued(line) {
	  var merged, lines;
	  while (merged = collapsedSpanAtEnd(line)) {
	    line = merged.find(1, true).line
	    ;(lines || (lines = [])).push(line);
	  }
	  return lines
	}

	// Get the line number of the start of the visual line that the
	// given line number is part of.
	function visualLineNo(doc, lineN) {
	  var line = getLine(doc, lineN), vis = visualLine(line);
	  if (line == vis) { return lineN }
	  return lineNo(vis)
	}

	// Get the line number of the start of the next visual line after
	// the given line.
	function visualLineEndNo(doc, lineN) {
	  if (lineN > doc.lastLine()) { return lineN }
	  var line = getLine(doc, lineN), merged;
	  if (!lineIsHidden(doc, line)) { return lineN }
	  while (merged = collapsedSpanAtEnd(line))
	    { line = merged.find(1, true).line; }
	  return lineNo(line) + 1
	}

	// Compute whether a line is hidden. Lines count as hidden when they
	// are part of a visual line that starts with another line, or when
	// they are entirely covered by collapsed, non-widget span.
	function lineIsHidden(doc, line) {
	  var sps = sawCollapsedSpans && line.markedSpans;
	  if (sps) { for (var sp = (void 0), i = 0; i < sps.length; ++i) {
	    sp = sps[i];
	    if (!sp.marker.collapsed) { continue }
	    if (sp.from == null) { return true }
	    if (sp.marker.widgetNode) { continue }
	    if (sp.from == 0 && sp.marker.inclusiveLeft && lineIsHiddenInner(doc, line, sp))
	      { return true }
	  } }
	}
	function lineIsHiddenInner(doc, line, span) {
	  if (span.to == null) {
	    var end = span.marker.find(1, true);
	    return lineIsHiddenInner(doc, end.line, getMarkedSpanFor(end.line.markedSpans, span.marker))
	  }
	  if (span.marker.inclusiveRight && span.to == line.text.length)
	    { return true }
	  for (var sp = (void 0), i = 0; i < line.markedSpans.length; ++i) {
	    sp = line.markedSpans[i];
	    if (sp.marker.collapsed && !sp.marker.widgetNode && sp.from == span.to &&
	        (sp.to == null || sp.to != span.from) &&
	        (sp.marker.inclusiveLeft || span.marker.inclusiveRight) &&
	        lineIsHiddenInner(doc, line, sp)) { return true }
	  }
	}

	// Find the height above the given line.
	function heightAtLine(lineObj) {
	  lineObj = visualLine(lineObj);

	  var h = 0, chunk = lineObj.parent;
	  for (var i = 0; i < chunk.lines.length; ++i) {
	    var line = chunk.lines[i];
	    if (line == lineObj) { break }
	    else { h += line.height; }
	  }
	  for (var p = chunk.parent; p; chunk = p, p = chunk.parent) {
	    for (var i$1 = 0; i$1 < p.children.length; ++i$1) {
	      var cur = p.children[i$1];
	      if (cur == chunk) { break }
	      else { h += cur.height; }
	    }
	  }
	  return h
	}

	// Compute the character length of a line, taking into account
	// collapsed ranges (see markText) that might hide parts, and join
	// other lines onto it.
	function lineLength(line) {
	  if (line.height == 0) { return 0 }
	  var len = line.text.length, merged, cur = line;
	  while (merged = collapsedSpanAtStart(cur)) {
	    var found = merged.find(0, true);
	    cur = found.from.line;
	    len += found.from.ch - found.to.ch;
	  }
	  cur = line;
	  while (merged = collapsedSpanAtEnd(cur)) {
	    var found$1 = merged.find(0, true);
	    len -= cur.text.length - found$1.from.ch;
	    cur = found$1.to.line;
	    len += cur.text.length - found$1.to.ch;
	  }
	  return len
	}

	// Find the longest line in the document.
	function findMaxLine(cm) {
	  var d = cm.display, doc = cm.doc;
	  d.maxLine = getLine(doc, doc.first);
	  d.maxLineLength = lineLength(d.maxLine);
	  d.maxLineChanged = true;
	  doc.iter(function (line) {
	    var len = lineLength(line);
	    if (len > d.maxLineLength) {
	      d.maxLineLength = len;
	      d.maxLine = line;
	    }
	  });
	}

	// BIDI HELPERS

	function iterateBidiSections(order, from, to, f) {
	  if (!order) { return f(from, to, "ltr", 0) }
	  var found = false;
	  for (var i = 0; i < order.length; ++i) {
	    var part = order[i];
	    if (part.from < to && part.to > from || from == to && part.to == from) {
	      f(Math.max(part.from, from), Math.min(part.to, to), part.level == 1 ? "rtl" : "ltr", i);
	      found = true;
	    }
	  }
	  if (!found) { f(from, to, "ltr"); }
	}

	var bidiOther = null;
	function getBidiPartAt(order, ch, sticky) {
	  var found;
	  bidiOther = null;
	  for (var i = 0; i < order.length; ++i) {
	    var cur = order[i];
	    if (cur.from < ch && cur.to > ch) { return i }
	    if (cur.to == ch) {
	      if (cur.from != cur.to && sticky == "before") { found = i; }
	      else { bidiOther = i; }
	    }
	    if (cur.from == ch) {
	      if (cur.from != cur.to && sticky != "before") { found = i; }
	      else { bidiOther = i; }
	    }
	  }
	  return found != null ? found : bidiOther
	}

	// Bidirectional ordering algorithm
	// See http://unicode.org/reports/tr9/tr9-13.html for the algorithm
	// that this (partially) implements.

	// One-char codes used for character types:
	// L (L):   Left-to-Right
	// R (R):   Right-to-Left
	// r (AL):  Right-to-Left Arabic
	// 1 (EN):  European Number
	// + (ES):  European Number Separator
	// % (ET):  European Number Terminator
	// n (AN):  Arabic Number
	// , (CS):  Common Number Separator
	// m (NSM): Non-Spacing Mark
	// b (BN):  Boundary Neutral
	// s (B):   Paragraph Separator
	// t (S):   Segment Separator
	// w (WS):  Whitespace
	// N (ON):  Other Neutrals

	// Returns null if characters are ordered as they appear
	// (left-to-right), or an array of sections ({from, to, level}
	// objects) in the order in which they occur visually.
	var bidiOrdering = (function() {
	  // Character types for codepoints 0 to 0xff
	  var lowTypes = "bbbbbbbbbtstwsbbbbbbbbbbbbbbssstwNN%%%NNNNNN,N,N1111111111NNNNNNNLLLLLLLLLLLLLLLLLLLLLLLLLLNNNNNNLLLLLLLLLLLLLLLLLLLLLLLLLLNNNNbbbbbbsbbbbbbbbbbbbbbbbbbbbbbbbbb,N%%%%NNNNLNNNNN%%11NLNNN1LNNNNNLLLLLLLLLLLLLLLLLLLLLLLNLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLN";
	  // Character types for codepoints 0x600 to 0x6f9
	  var arabicTypes = "nnnnnnNNr%%r,rNNmmmmmmmmmmmrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrmmmmmmmmmmmmmmmmmmmmmnnnnnnnnnn%nnrrrmrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrmmmmmmmnNmmmmmmrrmmNmmmmrr1111111111";
	  function charType(code) {
	    if (code <= 0xf7) { return lowTypes.charAt(code) }
	    else if (0x590 <= code && code <= 0x5f4) { return "R" }
	    else if (0x600 <= code && code <= 0x6f9) { return arabicTypes.charAt(code - 0x600) }
	    else if (0x6ee <= code && code <= 0x8ac) { return "r" }
	    else if (0x2000 <= code && code <= 0x200b) { return "w" }
	    else if (code == 0x200c) { return "b" }
	    else { return "L" }
	  }

	  var bidiRE = /[\u0590-\u05f4\u0600-\u06ff\u0700-\u08ac]/;
	  var isNeutral = /[stwN]/, isStrong = /[LRr]/, countsAsLeft = /[Lb1n]/, countsAsNum = /[1n]/;

	  function BidiSpan(level, from, to) {
	    this.level = level;
	    this.from = from; this.to = to;
	  }

	  return function(str, direction) {
	    var outerType = direction == "ltr" ? "L" : "R";

	    if (str.length == 0 || direction == "ltr" && !bidiRE.test(str)) { return false }
	    var len = str.length, types = [];
	    for (var i = 0; i < len; ++i)
	      { types.push(charType(str.charCodeAt(i))); }

	    // W1. Examine each non-spacing mark (NSM) in the level run, and
	    // change the type of the NSM to the type of the previous
	    // character. If the NSM is at the start of the level run, it will
	    // get the type of sor.
	    for (var i$1 = 0, prev = outerType; i$1 < len; ++i$1) {
	      var type = types[i$1];
	      if (type == "m") { types[i$1] = prev; }
	      else { prev = type; }
	    }

	    // W2. Search backwards from each instance of a European number
	    // until the first strong type (R, L, AL, or sor) is found. If an
	    // AL is found, change the type of the European number to Arabic
	    // number.
	    // W3. Change all ALs to R.
	    for (var i$2 = 0, cur = outerType; i$2 < len; ++i$2) {
	      var type$1 = types[i$2];
	      if (type$1 == "1" && cur == "r") { types[i$2] = "n"; }
	      else if (isStrong.test(type$1)) { cur = type$1; if (type$1 == "r") { types[i$2] = "R"; } }
	    }

	    // W4. A single European separator between two European numbers
	    // changes to a European number. A single common separator between
	    // two numbers of the same type changes to that type.
	    for (var i$3 = 1, prev$1 = types[0]; i$3 < len - 1; ++i$3) {
	      var type$2 = types[i$3];
	      if (type$2 == "+" && prev$1 == "1" && types[i$3+1] == "1") { types[i$3] = "1"; }
	      else if (type$2 == "," && prev$1 == types[i$3+1] &&
	               (prev$1 == "1" || prev$1 == "n")) { types[i$3] = prev$1; }
	      prev$1 = type$2;
	    }

	    // W5. A sequence of European terminators adjacent to European
	    // numbers changes to all European numbers.
	    // W6. Otherwise, separators and terminators change to Other
	    // Neutral.
	    for (var i$4 = 0; i$4 < len; ++i$4) {
	      var type$3 = types[i$4];
	      if (type$3 == ",") { types[i$4] = "N"; }
	      else if (type$3 == "%") {
	        var end = (void 0);
	        for (end = i$4 + 1; end < len && types[end] == "%"; ++end) {}
	        var replace = (i$4 && types[i$4-1] == "!") || (end < len && types[end] == "1") ? "1" : "N";
	        for (var j = i$4; j < end; ++j) { types[j] = replace; }
	        i$4 = end - 1;
	      }
	    }

	    // W7. Search backwards from each instance of a European number
	    // until the first strong type (R, L, or sor) is found. If an L is
	    // found, then change the type of the European number to L.
	    for (var i$5 = 0, cur$1 = outerType; i$5 < len; ++i$5) {
	      var type$4 = types[i$5];
	      if (cur$1 == "L" && type$4 == "1") { types[i$5] = "L"; }
	      else if (isStrong.test(type$4)) { cur$1 = type$4; }
	    }

	    // N1. A sequence of neutrals takes the direction of the
	    // surrounding strong text if the text on both sides has the same
	    // direction. European and Arabic numbers act as if they were R in
	    // terms of their influence on neutrals. Start-of-level-run (sor)
	    // and end-of-level-run (eor) are used at level run boundaries.
	    // N2. Any remaining neutrals take the embedding direction.
	    for (var i$6 = 0; i$6 < len; ++i$6) {
	      if (isNeutral.test(types[i$6])) {
	        var end$1 = (void 0);
	        for (end$1 = i$6 + 1; end$1 < len && isNeutral.test(types[end$1]); ++end$1) {}
	        var before = (i$6 ? types[i$6-1] : outerType) == "L";
	        var after = (end$1 < len ? types[end$1] : outerType) == "L";
	        var replace$1 = before == after ? (before ? "L" : "R") : outerType;
	        for (var j$1 = i$6; j$1 < end$1; ++j$1) { types[j$1] = replace$1; }
	        i$6 = end$1 - 1;
	      }
	    }

	    // Here we depart from the documented algorithm, in order to avoid
	    // building up an actual levels array. Since there are only three
	    // levels (0, 1, 2) in an implementation that doesn't take
	    // explicit embedding into account, we can build up the order on
	    // the fly, without following the level-based algorithm.
	    var order = [], m;
	    for (var i$7 = 0; i$7 < len;) {
	      if (countsAsLeft.test(types[i$7])) {
	        var start = i$7;
	        for (++i$7; i$7 < len && countsAsLeft.test(types[i$7]); ++i$7) {}
	        order.push(new BidiSpan(0, start, i$7));
	      } else {
	        var pos = i$7, at = order.length;
	        for (++i$7; i$7 < len && types[i$7] != "L"; ++i$7) {}
	        for (var j$2 = pos; j$2 < i$7;) {
	          if (countsAsNum.test(types[j$2])) {
	            if (pos < j$2) { order.splice(at, 0, new BidiSpan(1, pos, j$2)); }
	            var nstart = j$2;
	            for (++j$2; j$2 < i$7 && countsAsNum.test(types[j$2]); ++j$2) {}
	            order.splice(at, 0, new BidiSpan(2, nstart, j$2));
	            pos = j$2;
	          } else { ++j$2; }
	        }
	        if (pos < i$7) { order.splice(at, 0, new BidiSpan(1, pos, i$7)); }
	      }
	    }
	    if (direction == "ltr") {
	      if (order[0].level == 1 && (m = str.match(/^\s+/))) {
	        order[0].from = m[0].length;
	        order.unshift(new BidiSpan(0, 0, m[0].length));
	      }
	      if (lst(order).level == 1 && (m = str.match(/\s+$/))) {
	        lst(order).to -= m[0].length;
	        order.push(new BidiSpan(0, len - m[0].length, len));
	      }
	    }

	    return direction == "rtl" ? order.reverse() : order
	  }
	})();

	// Get the bidi ordering for the given line (and cache it). Returns
	// false for lines that are fully left-to-right, and an array of
	// BidiSpan objects otherwise.
	function getOrder(line, direction) {
	  var order = line.order;
	  if (order == null) { order = line.order = bidiOrdering(line.text, direction); }
	  return order
	}

	// EVENT HANDLING

	// Lightweight event framework. on/off also work on DOM nodes,
	// registering native DOM handlers.

	var noHandlers = [];

	var on = function(emitter, type, f) {
	  if (emitter.addEventListener) {
	    emitter.addEventListener(type, f, false);
	  } else if (emitter.attachEvent) {
	    emitter.attachEvent("on" + type, f);
	  } else {
	    var map$$1 = emitter._handlers || (emitter._handlers = {});
	    map$$1[type] = (map$$1[type] || noHandlers).concat(f);
	  }
	};

	function getHandlers(emitter, type) {
	  return emitter._handlers && emitter._handlers[type] || noHandlers
	}

	function off(emitter, type, f) {
	  if (emitter.removeEventListener) {
	    emitter.removeEventListener(type, f, false);
	  } else if (emitter.detachEvent) {
	    emitter.detachEvent("on" + type, f);
	  } else {
	    var map$$1 = emitter._handlers, arr = map$$1 && map$$1[type];
	    if (arr) {
	      var index = indexOf(arr, f);
	      if (index > -1)
	        { map$$1[type] = arr.slice(0, index).concat(arr.slice(index + 1)); }
	    }
	  }
	}

	function signal(emitter, type /*, values...*/) {
	  var handlers = getHandlers(emitter, type);
	  if (!handlers.length) { return }
	  var args = Array.prototype.slice.call(arguments, 2);
	  for (var i = 0; i < handlers.length; ++i) { handlers[i].apply(null, args); }
	}

	// The DOM events that CodeMirror handles can be overridden by
	// registering a (non-DOM) handler on the editor for the event name,
	// and preventDefault-ing the event in that handler.
	function signalDOMEvent(cm, e, override) {
	  if (typeof e == "string")
	    { e = {type: e, preventDefault: function() { this.defaultPrevented = true; }}; }
	  signal(cm, override || e.type, cm, e);
	  return e_defaultPrevented(e) || e.codemirrorIgnore
	}

	function signalCursorActivity(cm) {
	  var arr = cm._handlers && cm._handlers.cursorActivity;
	  if (!arr) { return }
	  var set = cm.curOp.cursorActivityHandlers || (cm.curOp.cursorActivityHandlers = []);
	  for (var i = 0; i < arr.length; ++i) { if (indexOf(set, arr[i]) == -1)
	    { set.push(arr[i]); } }
	}

	function hasHandler(emitter, type) {
	  return getHandlers(emitter, type).length > 0
	}

	// Add on and off methods to a constructor's prototype, to make
	// registering events on such objects more convenient.
	function eventMixin(ctor) {
	  ctor.prototype.on = function(type, f) {on(this, type, f);};
	  ctor.prototype.off = function(type, f) {off(this, type, f);};
	}

	// Due to the fact that we still support jurassic IE versions, some
	// compatibility wrappers are needed.

	function e_preventDefault(e) {
	  if (e.preventDefault) { e.preventDefault(); }
	  else { e.returnValue = false; }
	}
	function e_stopPropagation(e) {
	  if (e.stopPropagation) { e.stopPropagation(); }
	  else { e.cancelBubble = true; }
	}
	function e_defaultPrevented(e) {
	  return e.defaultPrevented != null ? e.defaultPrevented : e.returnValue == false
	}
	function e_stop(e) {e_preventDefault(e); e_stopPropagation(e);}

	function e_target(e) {return e.target || e.srcElement}
	function e_button(e) {
	  var b = e.which;
	  if (b == null) {
	    if (e.button & 1) { b = 1; }
	    else if (e.button & 2) { b = 3; }
	    else if (e.button & 4) { b = 2; }
	  }
	  if (mac && e.ctrlKey && b == 1) { b = 3; }
	  return b
	}

	// Detect drag-and-drop
	var dragAndDrop = function() {
	  // There is *some* kind of drag-and-drop support in IE6-8, but I
	  // couldn't get it to work yet.
	  if (ie && ie_version < 9) { return false }
	  var div = elt('div');
	  return "draggable" in div || "dragDrop" in div
	}();

	var zwspSupported;
	function zeroWidthElement(measure) {
	  if (zwspSupported == null) {
	    var test = elt("span", "\u200b");
	    removeChildrenAndAdd(measure, elt("span", [test, document.createTextNode("x")]));
	    if (measure.firstChild.offsetHeight != 0)
	      { zwspSupported = test.offsetWidth <= 1 && test.offsetHeight > 2 && !(ie && ie_version < 8); }
	  }
	  var node = zwspSupported ? elt("span", "\u200b") :
	    elt("span", "\u00a0", null, "display: inline-block; width: 1px; margin-right: -1px");
	  node.setAttribute("cm-text", "");
	  return node
	}

	// Feature-detect IE's crummy client rect reporting for bidi text
	var badBidiRects;
	function hasBadBidiRects(measure) {
	  if (badBidiRects != null) { return badBidiRects }
	  var txt = removeChildrenAndAdd(measure, document.createTextNode("A\u062eA"));
	  var r0 = range(txt, 0, 1).getBoundingClientRect();
	  var r1 = range(txt, 1, 2).getBoundingClientRect();
	  removeChildren(measure);
	  if (!r0 || r0.left == r0.right) { return false } // Safari returns null in some cases (#2780)
	  return badBidiRects = (r1.right - r0.right < 3)
	}

	// See if "".split is the broken IE version, if so, provide an
	// alternative way to split lines.
	var splitLinesAuto = "\n\nb".split(/\n/).length != 3 ? function (string) {
	  var pos = 0, result = [], l = string.length;
	  while (pos <= l) {
	    var nl = string.indexOf("\n", pos);
	    if (nl == -1) { nl = string.length; }
	    var line = string.slice(pos, string.charAt(nl - 1) == "\r" ? nl - 1 : nl);
	    var rt = line.indexOf("\r");
	    if (rt != -1) {
	      result.push(line.slice(0, rt));
	      pos += rt + 1;
	    } else {
	      result.push(line);
	      pos = nl + 1;
	    }
	  }
	  return result
	} : function (string) { return string.split(/\r\n?|\n/); };

	var hasSelection = window.getSelection ? function (te) {
	  try { return te.selectionStart != te.selectionEnd }
	  catch(e) { return false }
	} : function (te) {
	  var range$$1;
	  try {range$$1 = te.ownerDocument.selection.createRange();}
	  catch(e) {}
	  if (!range$$1 || range$$1.parentElement() != te) { return false }
	  return range$$1.compareEndPoints("StartToEnd", range$$1) != 0
	};

	var hasCopyEvent = (function () {
	  var e = elt("div");
	  if ("oncopy" in e) { return true }
	  e.setAttribute("oncopy", "return;");
	  return typeof e.oncopy == "function"
	})();

	var badZoomedRects = null;
	function hasBadZoomedRects(measure) {
	  if (badZoomedRects != null) { return badZoomedRects }
	  var node = removeChildrenAndAdd(measure, elt("span", "x"));
	  var normal = node.getBoundingClientRect();
	  var fromRange = range(node, 0, 1).getBoundingClientRect();
	  return badZoomedRects = Math.abs(normal.left - fromRange.left) > 1
	}

	// Known modes, by name and by MIME
	var modes = {};
	var mimeModes = {};

	// Extra arguments are stored as the mode's dependencies, which is
	// used by (legacy) mechanisms like loadmode.js to automatically
	// load a mode. (Preferred mechanism is the require/define calls.)
	function defineMode(name, mode) {
	  if (arguments.length > 2)
	    { mode.dependencies = Array.prototype.slice.call(arguments, 2); }
	  modes[name] = mode;
	}

	function defineMIME(mime, spec) {
	  mimeModes[mime] = spec;
	}

	// Given a MIME type, a {name, ...options} config object, or a name
	// string, return a mode config object.
	function resolveMode(spec) {
	  if (typeof spec == "string" && mimeModes.hasOwnProperty(spec)) {
	    spec = mimeModes[spec];
	  } else if (spec && typeof spec.name == "string" && mimeModes.hasOwnProperty(spec.name)) {
	    var found = mimeModes[spec.name];
	    if (typeof found == "string") { found = {name: found}; }
	    spec = createObj(found, spec);
	    spec.name = found.name;
	  } else if (typeof spec == "string" && /^[\w\-]+\/[\w\-]+\+xml$/.test(spec)) {
	    return resolveMode("application/xml")
	  } else if (typeof spec == "string" && /^[\w\-]+\/[\w\-]+\+json$/.test(spec)) {
	    return resolveMode("application/json")
	  }
	  if (typeof spec == "string") { return {name: spec} }
	  else { return spec || {name: "null"} }
	}

	// Given a mode spec (anything that resolveMode accepts), find and
	// initialize an actual mode object.
	function getMode(options, spec) {
	  spec = resolveMode(spec);
	  var mfactory = modes[spec.name];
	  if (!mfactory) { return getMode(options, "text/plain") }
	  var modeObj = mfactory(options, spec);
	  if (modeExtensions.hasOwnProperty(spec.name)) {
	    var exts = modeExtensions[spec.name];
	    for (var prop in exts) {
	      if (!exts.hasOwnProperty(prop)) { continue }
	      if (modeObj.hasOwnProperty(prop)) { modeObj["_" + prop] = modeObj[prop]; }
	      modeObj[prop] = exts[prop];
	    }
	  }
	  modeObj.name = spec.name;
	  if (spec.helperType) { modeObj.helperType = spec.helperType; }
	  if (spec.modeProps) { for (var prop$1 in spec.modeProps)
	    { modeObj[prop$1] = spec.modeProps[prop$1]; } }

	  return modeObj
	}

	// This can be used to attach properties to mode objects from
	// outside the actual mode definition.
	var modeExtensions = {};
	function extendMode(mode, properties) {
	  var exts = modeExtensions.hasOwnProperty(mode) ? modeExtensions[mode] : (modeExtensions[mode] = {});
	  copyObj(properties, exts);
	}

	function copyState(mode, state) {
	  if (state === true) { return state }
	  if (mode.copyState) { return mode.copyState(state) }
	  var nstate = {};
	  for (var n in state) {
	    var val = state[n];
	    if (val instanceof Array) { val = val.concat([]); }
	    nstate[n] = val;
	  }
	  return nstate
	}

	// Given a mode and a state (for that mode), find the inner mode and
	// state at the position that the state refers to.
	function innerMode(mode, state) {
	  var info;
	  while (mode.innerMode) {
	    info = mode.innerMode(state);
	    if (!info || info.mode == mode) { break }
	    state = info.state;
	    mode = info.mode;
	  }
	  return info || {mode: mode, state: state}
	}

	function startState(mode, a1, a2) {
	  return mode.startState ? mode.startState(a1, a2) : true
	}

	// STRING STREAM

	// Fed to the mode parsers, provides helper functions to make
	// parsers more succinct.

	var StringStream = function(string, tabSize, lineOracle) {
	  this.pos = this.start = 0;
	  this.string = string;
	  this.tabSize = tabSize || 8;
	  this.lastColumnPos = this.lastColumnValue = 0;
	  this.lineStart = 0;
	  this.lineOracle = lineOracle;
	};

	StringStream.prototype.eol = function () {return this.pos >= this.string.length};
	StringStream.prototype.sol = function () {return this.pos == this.lineStart};
	StringStream.prototype.peek = function () {return this.string.charAt(this.pos) || undefined};
	StringStream.prototype.next = function () {
	  if (this.pos < this.string.length)
	    { return this.string.charAt(this.pos++) }
	};
	StringStream.prototype.eat = function (match) {
	  var ch = this.string.charAt(this.pos);
	  var ok;
	  if (typeof match == "string") { ok = ch == match; }
	  else { ok = ch && (match.test ? match.test(ch) : match(ch)); }
	  if (ok) {++this.pos; return ch}
	};
	StringStream.prototype.eatWhile = function (match) {
	  var start = this.pos;
	  while (this.eat(match)){}
	  return this.pos > start
	};
	StringStream.prototype.eatSpace = function () {
	    var this$1 = this;

	  var start = this.pos;
	  while (/[\s\u00a0]/.test(this.string.charAt(this.pos))) { ++this$1.pos; }
	  return this.pos > start
	};
	StringStream.prototype.skipToEnd = function () {this.pos = this.string.length;};
	StringStream.prototype.skipTo = function (ch) {
	  var found = this.string.indexOf(ch, this.pos);
	  if (found > -1) {this.pos = found; return true}
	};
	StringStream.prototype.backUp = function (n) {this.pos -= n;};
	StringStream.prototype.column = function () {
	  if (this.lastColumnPos < this.start) {
	    this.lastColumnValue = countColumn(this.string, this.start, this.tabSize, this.lastColumnPos, this.lastColumnValue);
	    this.lastColumnPos = this.start;
	  }
	  return this.lastColumnValue - (this.lineStart ? countColumn(this.string, this.lineStart, this.tabSize) : 0)
	};
	StringStream.prototype.indentation = function () {
	  return countColumn(this.string, null, this.tabSize) -
	    (this.lineStart ? countColumn(this.string, this.lineStart, this.tabSize) : 0)
	};
	StringStream.prototype.match = function (pattern, consume, caseInsensitive) {
	  if (typeof pattern == "string") {
	    var cased = function (str) { return caseInsensitive ? str.toLowerCase() : str; };
	    var substr = this.string.substr(this.pos, pattern.length);
	    if (cased(substr) == cased(pattern)) {
	      if (consume !== false) { this.pos += pattern.length; }
	      return true
	    }
	  } else {
	    var match = this.string.slice(this.pos).match(pattern);
	    if (match && match.index > 0) { return null }
	    if (match && consume !== false) { this.pos += match[0].length; }
	    return match
	  }
	};
	StringStream.prototype.current = function (){return this.string.slice(this.start, this.pos)};
	StringStream.prototype.hideFirstChars = function (n, inner) {
	  this.lineStart += n;
	  try { return inner() }
	  finally { this.lineStart -= n; }
	};
	StringStream.prototype.lookAhead = function (n) {
	  var oracle = this.lineOracle;
	  return oracle && oracle.lookAhead(n)
	};
	StringStream.prototype.baseToken = function () {
	  var oracle = this.lineOracle;
	  return oracle && oracle.baseToken(this.pos)
	};

	var SavedContext = function(state, lookAhead) {
	  this.state = state;
	  this.lookAhead = lookAhead;
	};

	var Context = function(doc, state, line, lookAhead) {
	  this.state = state;
	  this.doc = doc;
	  this.line = line;
	  this.maxLookAhead = lookAhead || 0;
	  this.baseTokens = null;
	  this.baseTokenPos = 1;
	};

	Context.prototype.lookAhead = function (n) {
	  var line = this.doc.getLine(this.line + n);
	  if (line != null && n > this.maxLookAhead) { this.maxLookAhead = n; }
	  return line
	};

	Context.prototype.baseToken = function (n) {
	    var this$1 = this;

	  if (!this.baseTokens) { return null }
	  while (this.baseTokens[this.baseTokenPos] <= n)
	    { this$1.baseTokenPos += 2; }
	  var type = this.baseTokens[this.baseTokenPos + 1];
	  return {type: type && type.replace(/( |^)overlay .*/, ""),
	          size: this.baseTokens[this.baseTokenPos] - n}
	};

	Context.prototype.nextLine = function () {
	  this.line++;
	  if (this.maxLookAhead > 0) { this.maxLookAhead--; }
	};

	Context.fromSaved = function (doc, saved, line) {
	  if (saved instanceof SavedContext)
	    { return new Context(doc, copyState(doc.mode, saved.state), line, saved.lookAhead) }
	  else
	    { return new Context(doc, copyState(doc.mode, saved), line) }
	};

	Context.prototype.save = function (copy) {
	  var state = copy !== false ? copyState(this.doc.mode, this.state) : this.state;
	  return this.maxLookAhead > 0 ? new SavedContext(state, this.maxLookAhead) : state
	};


	// Compute a style array (an array starting with a mode generation
	// -- for invalidation -- followed by pairs of end positions and
	// style strings), which is used to highlight the tokens on the
	// line.
	function highlightLine(cm, line, context, forceToEnd) {
	  // A styles array always starts with a number identifying the
	  // mode/overlays that it is based on (for easy invalidation).
	  var st = [cm.state.modeGen], lineClasses = {};
	  // Compute the base array of styles
	  runMode(cm, line.text, cm.doc.mode, context, function (end, style) { return st.push(end, style); },
	          lineClasses, forceToEnd);
	  var state = context.state;

	  // Run overlays, adjust style array.
	  var loop = function ( o ) {
	    context.baseTokens = st;
	    var overlay = cm.state.overlays[o], i = 1, at = 0;
	    context.state = true;
	    runMode(cm, line.text, overlay.mode, context, function (end, style) {
	      var start = i;
	      // Ensure there's a token end at the current position, and that i points at it
	      while (at < end) {
	        var i_end = st[i];
	        if (i_end > end)
	          { st.splice(i, 1, end, st[i+1], i_end); }
	        i += 2;
	        at = Math.min(end, i_end);
	      }
	      if (!style) { return }
	      if (overlay.opaque) {
	        st.splice(start, i - start, end, "overlay " + style);
	        i = start + 2;
	      } else {
	        for (; start < i; start += 2) {
	          var cur = st[start+1];
	          st[start+1] = (cur ? cur + " " : "") + "overlay " + style;
	        }
	      }
	    }, lineClasses);
	    context.state = state;
	    context.baseTokens = null;
	    context.baseTokenPos = 1;
	  };

	  for (var o = 0; o < cm.state.overlays.length; ++o) { loop( o ); }

	  return {styles: st, classes: lineClasses.bgClass || lineClasses.textClass ? lineClasses : null}
	}

	function getLineStyles(cm, line, updateFrontier) {
	  if (!line.styles || line.styles[0] != cm.state.modeGen) {
	    var context = getContextBefore(cm, lineNo(line));
	    var resetState = line.text.length > cm.options.maxHighlightLength && copyState(cm.doc.mode, context.state);
	    var result = highlightLine(cm, line, context);
	    if (resetState) { context.state = resetState; }
	    line.stateAfter = context.save(!resetState);
	    line.styles = result.styles;
	    if (result.classes) { line.styleClasses = result.classes; }
	    else if (line.styleClasses) { line.styleClasses = null; }
	    if (updateFrontier === cm.doc.highlightFrontier)
	      { cm.doc.modeFrontier = Math.max(cm.doc.modeFrontier, ++cm.doc.highlightFrontier); }
	  }
	  return line.styles
	}

	function getContextBefore(cm, n, precise) {
	  var doc = cm.doc, display = cm.display;
	  if (!doc.mode.startState) { return new Context(doc, true, n) }
	  var start = findStartLine(cm, n, precise);
	  var saved = start > doc.first && getLine(doc, start - 1).stateAfter;
	  var context = saved ? Context.fromSaved(doc, saved, start) : new Context(doc, startState(doc.mode), start);

	  doc.iter(start, n, function (line) {
	    processLine(cm, line.text, context);
	    var pos = context.line;
	    line.stateAfter = pos == n - 1 || pos % 5 == 0 || pos >= display.viewFrom && pos < display.viewTo ? context.save() : null;
	    context.nextLine();
	  });
	  if (precise) { doc.modeFrontier = context.line; }
	  return context
	}

	// Lightweight form of highlight -- proceed over this line and
	// update state, but don't save a style array. Used for lines that
	// aren't currently visible.
	function processLine(cm, text, context, startAt) {
	  var mode = cm.doc.mode;
	  var stream = new StringStream(text, cm.options.tabSize, context);
	  stream.start = stream.pos = startAt || 0;
	  if (text == "") { callBlankLine(mode, context.state); }
	  while (!stream.eol()) {
	    readToken(mode, stream, context.state);
	    stream.start = stream.pos;
	  }
	}

	function callBlankLine(mode, state) {
	  if (mode.blankLine) { return mode.blankLine(state) }
	  if (!mode.innerMode) { return }
	  var inner = innerMode(mode, state);
	  if (inner.mode.blankLine) { return inner.mode.blankLine(inner.state) }
	}

	function readToken(mode, stream, state, inner) {
	  for (var i = 0; i < 10; i++) {
	    if (inner) { inner[0] = innerMode(mode, state).mode; }
	    var style = mode.token(stream, state);
	    if (stream.pos > stream.start) { return style }
	  }
	  throw new Error("Mode " + mode.name + " failed to advance stream.")
	}

	var Token = function(stream, type, state) {
	  this.start = stream.start; this.end = stream.pos;
	  this.string = stream.current();
	  this.type = type || null;
	  this.state = state;
	};

	// Utility for getTokenAt and getLineTokens
	function takeToken(cm, pos, precise, asArray) {
	  var doc = cm.doc, mode = doc.mode, style;
	  pos = clipPos(doc, pos);
	  var line = getLine(doc, pos.line), context = getContextBefore(cm, pos.line, precise);
	  var stream = new StringStream(line.text, cm.options.tabSize, context), tokens;
	  if (asArray) { tokens = []; }
	  while ((asArray || stream.pos < pos.ch) && !stream.eol()) {
	    stream.start = stream.pos;
	    style = readToken(mode, stream, context.state);
	    if (asArray) { tokens.push(new Token(stream, style, copyState(doc.mode, context.state))); }
	  }
	  return asArray ? tokens : new Token(stream, style, context.state)
	}

	function extractLineClasses(type, output) {
	  if (type) { for (;;) {
	    var lineClass = type.match(/(?:^|\s+)line-(background-)?(\S+)/);
	    if (!lineClass) { break }
	    type = type.slice(0, lineClass.index) + type.slice(lineClass.index + lineClass[0].length);
	    var prop = lineClass[1] ? "bgClass" : "textClass";
	    if (output[prop] == null)
	      { output[prop] = lineClass[2]; }
	    else if (!(new RegExp("(?:^|\s)" + lineClass[2] + "(?:$|\s)")).test(output[prop]))
	      { output[prop] += " " + lineClass[2]; }
	  } }
	  return type
	}

	// Run the given mode's parser over a line, calling f for each token.
	function runMode(cm, text, mode, context, f, lineClasses, forceToEnd) {
	  var flattenSpans = mode.flattenSpans;
	  if (flattenSpans == null) { flattenSpans = cm.options.flattenSpans; }
	  var curStart = 0, curStyle = null;
	  var stream = new StringStream(text, cm.options.tabSize, context), style;
	  var inner = cm.options.addModeClass && [null];
	  if (text == "") { extractLineClasses(callBlankLine(mode, context.state), lineClasses); }
	  while (!stream.eol()) {
	    if (stream.pos > cm.options.maxHighlightLength) {
	      flattenSpans = false;
	      if (forceToEnd) { processLine(cm, text, context, stream.pos); }
	      stream.pos = text.length;
	      style = null;
	    } else {
	      style = extractLineClasses(readToken(mode, stream, context.state, inner), lineClasses);
	    }
	    if (inner) {
	      var mName = inner[0].name;
	      if (mName) { style = "m-" + (style ? mName + " " + style : mName); }
	    }
	    if (!flattenSpans || curStyle != style) {
	      while (curStart < stream.start) {
	        curStart = Math.min(stream.start, curStart + 5000);
	        f(curStart, curStyle);
	      }
	      curStyle = style;
	    }
	    stream.start = stream.pos;
	  }
	  while (curStart < stream.pos) {
	    // Webkit seems to refuse to render text nodes longer than 57444
	    // characters, and returns inaccurate measurements in nodes
	    // starting around 5000 chars.
	    var pos = Math.min(stream.pos, curStart + 5000);
	    f(pos, curStyle);
	    curStart = pos;
	  }
	}

	// Finds the line to start with when starting a parse. Tries to
	// find a line with a stateAfter, so that it can start with a
	// valid state. If that fails, it returns the line with the
	// smallest indentation, which tends to need the least context to
	// parse correctly.
	function findStartLine(cm, n, precise) {
	  var minindent, minline, doc = cm.doc;
	  var lim = precise ? -1 : n - (cm.doc.mode.innerMode ? 1000 : 100);
	  for (var search = n; search > lim; --search) {
	    if (search <= doc.first) { return doc.first }
	    var line = getLine(doc, search - 1), after = line.stateAfter;
	    if (after && (!precise || search + (after instanceof SavedContext ? after.lookAhead : 0) <= doc.modeFrontier))
	      { return search }
	    var indented = countColumn(line.text, null, cm.options.tabSize);
	    if (minline == null || minindent > indented) {
	      minline = search - 1;
	      minindent = indented;
	    }
	  }
	  return minline
	}

	function retreatFrontier(doc, n) {
	  doc.modeFrontier = Math.min(doc.modeFrontier, n);
	  if (doc.highlightFrontier < n - 10) { return }
	  var start = doc.first;
	  for (var line = n - 1; line > start; line--) {
	    var saved = getLine(doc, line).stateAfter;
	    // change is on 3
	    // state on line 1 looked ahead 2 -- so saw 3
	    // test 1 + 2 < 3 should cover this
	    if (saved && (!(saved instanceof SavedContext) || line + saved.lookAhead < n)) {
	      start = line + 1;
	      break
	    }
	  }
	  doc.highlightFrontier = Math.min(doc.highlightFrontier, start);
	}

	// LINE DATA STRUCTURE

	// Line objects. These hold state related to a line, including
	// highlighting info (the styles array).
	var Line = function(text, markedSpans, estimateHeight) {
	  this.text = text;
	  attachMarkedSpans(this, markedSpans);
	  this.height = estimateHeight ? estimateHeight(this) : 1;
	};

	Line.prototype.lineNo = function () { return lineNo(this) };
	eventMixin(Line);

	// Change the content (text, markers) of a line. Automatically
	// invalidates cached information and tries to re-estimate the
	// line's height.
	function updateLine(line, text, markedSpans, estimateHeight) {
	  line.text = text;
	  if (line.stateAfter) { line.stateAfter = null; }
	  if (line.styles) { line.styles = null; }
	  if (line.order != null) { line.order = null; }
	  detachMarkedSpans(line);
	  attachMarkedSpans(line, markedSpans);
	  var estHeight = estimateHeight ? estimateHeight(line) : 1;
	  if (estHeight != line.height) { updateLineHeight(line, estHeight); }
	}

	// Detach a line from the document tree and its markers.
	function cleanUpLine(line) {
	  line.parent = null;
	  detachMarkedSpans(line);
	}

	// Convert a style as returned by a mode (either null, or a string
	// containing one or more styles) to a CSS style. This is cached,
	// and also looks for line-wide styles.
	var styleToClassCache = {};
	var styleToClassCacheWithMode = {};
	function interpretTokenStyle(style, options) {
	  if (!style || /^\s*$/.test(style)) { return null }
	  var cache = options.addModeClass ? styleToClassCacheWithMode : styleToClassCache;
	  return cache[style] ||
	    (cache[style] = style.replace(/\S+/g, "cm-$&"))
	}

	// Render the DOM representation of the text of a line. Also builds
	// up a 'line map', which points at the DOM nodes that represent
	// specific stretches of text, and is used by the measuring code.
	// The returned object contains the DOM node, this map, and
	// information about line-wide styles that were set by the mode.
	function buildLineContent(cm, lineView) {
	  // The padding-right forces the element to have a 'border', which
	  // is needed on Webkit to be able to get line-level bounding
	  // rectangles for it (in measureChar).
	  var content = eltP("span", null, null, webkit ? "padding-right: .1px" : null);
	  var builder = {pre: eltP("pre", [content], "CodeMirror-line"), content: content,
	                 col: 0, pos: 0, cm: cm,
	                 trailingSpace: false,
	                 splitSpaces: cm.getOption("lineWrapping")};
	  lineView.measure = {};

	  // Iterate over the logical lines that make up this visual line.
	  for (var i = 0; i <= (lineView.rest ? lineView.rest.length : 0); i++) {
	    var line = i ? lineView.rest[i - 1] : lineView.line, order = (void 0);
	    builder.pos = 0;
	    builder.addToken = buildToken;
	    // Optionally wire in some hacks into the token-rendering
	    // algorithm, to deal with browser quirks.
	    if (hasBadBidiRects(cm.display.measure) && (order = getOrder(line, cm.doc.direction)))
	      { builder.addToken = buildTokenBadBidi(builder.addToken, order); }
	    builder.map = [];
	    var allowFrontierUpdate = lineView != cm.display.externalMeasured && lineNo(line);
	    insertLineContent(line, builder, getLineStyles(cm, line, allowFrontierUpdate));
	    if (line.styleClasses) {
	      if (line.styleClasses.bgClass)
	        { builder.bgClass = joinClasses(line.styleClasses.bgClass, builder.bgClass || ""); }
	      if (line.styleClasses.textClass)
	        { builder.textClass = joinClasses(line.styleClasses.textClass, builder.textClass || ""); }
	    }

	    // Ensure at least a single node is present, for measuring.
	    if (builder.map.length == 0)
	      { builder.map.push(0, 0, builder.content.appendChild(zeroWidthElement(cm.display.measure))); }

	    // Store the map and a cache object for the current logical line
	    if (i == 0) {
	      lineView.measure.map = builder.map;
	      lineView.measure.cache = {};
	    } else {
	      (lineView.measure.maps || (lineView.measure.maps = [])).push(builder.map)
	      ;(lineView.measure.caches || (lineView.measure.caches = [])).push({});
	    }
	  }

	  // See issue #2901
	  if (webkit) {
	    var last = builder.content.lastChild;
	    if (/\bcm-tab\b/.test(last.className) || (last.querySelector && last.querySelector(".cm-tab")))
	      { builder.content.className = "cm-tab-wrap-hack"; }
	  }

	  signal(cm, "renderLine", cm, lineView.line, builder.pre);
	  if (builder.pre.className)
	    { builder.textClass = joinClasses(builder.pre.className, builder.textClass || ""); }

	  return builder
	}

	function defaultSpecialCharPlaceholder(ch) {
	  var token = elt("span", "\u2022", "cm-invalidchar");
	  token.title = "\\u" + ch.charCodeAt(0).toString(16);
	  token.setAttribute("aria-label", token.title);
	  return token
	}

	// Build up the DOM representation for a single token, and add it to
	// the line map. Takes care to render special characters separately.
	function buildToken(builder, text, style, startStyle, endStyle, title, css) {
	  if (!text) { return }
	  var displayText = builder.splitSpaces ? splitSpaces(text, builder.trailingSpace) : text;
	  var special = builder.cm.state.specialChars, mustWrap = false;
	  var content;
	  if (!special.test(text)) {
	    builder.col += text.length;
	    content = document.createTextNode(displayText);
	    builder.map.push(builder.pos, builder.pos + text.length, content);
	    if (ie && ie_version < 9) { mustWrap = true; }
	    builder.pos += text.length;
	  } else {
	    content = document.createDocumentFragment();
	    var pos = 0;
	    while (true) {
	      special.lastIndex = pos;
	      var m = special.exec(text);
	      var skipped = m ? m.index - pos : text.length - pos;
	      if (skipped) {
	        var txt = document.createTextNode(displayText.slice(pos, pos + skipped));
	        if (ie && ie_version < 9) { content.appendChild(elt("span", [txt])); }
	        else { content.appendChild(txt); }
	        builder.map.push(builder.pos, builder.pos + skipped, txt);
	        builder.col += skipped;
	        builder.pos += skipped;
	      }
	      if (!m) { break }
	      pos += skipped + 1;
	      var txt$1 = (void 0);
	      if (m[0] == "\t") {
	        var tabSize = builder.cm.options.tabSize, tabWidth = tabSize - builder.col % tabSize;
	        txt$1 = content.appendChild(elt("span", spaceStr(tabWidth), "cm-tab"));
	        txt$1.setAttribute("role", "presentation");
	        txt$1.setAttribute("cm-text", "\t");
	        builder.col += tabWidth;
	      } else if (m[0] == "\r" || m[0] == "\n") {
	        txt$1 = content.appendChild(elt("span", m[0] == "\r" ? "\u240d" : "\u2424", "cm-invalidchar"));
	        txt$1.setAttribute("cm-text", m[0]);
	        builder.col += 1;
	      } else {
	        txt$1 = builder.cm.options.specialCharPlaceholder(m[0]);
	        txt$1.setAttribute("cm-text", m[0]);
	        if (ie && ie_version < 9) { content.appendChild(elt("span", [txt$1])); }
	        else { content.appendChild(txt$1); }
	        builder.col += 1;
	      }
	      builder.map.push(builder.pos, builder.pos + 1, txt$1);
	      builder.pos++;
	    }
	  }
	  builder.trailingSpace = displayText.charCodeAt(text.length - 1) == 32;
	  if (style || startStyle || endStyle || mustWrap || css) {
	    var fullStyle = style || "";
	    if (startStyle) { fullStyle += startStyle; }
	    if (endStyle) { fullStyle += endStyle; }
	    var token = elt("span", [content], fullStyle, css);
	    if (title) { token.title = title; }
	    return builder.content.appendChild(token)
	  }
	  builder.content.appendChild(content);
	}

	// Change some spaces to NBSP to prevent the browser from collapsing
	// trailing spaces at the end of a line when rendering text (issue #1362).
	function splitSpaces(text, trailingBefore) {
	  if (text.length > 1 && !/  /.test(text)) { return text }
	  var spaceBefore = trailingBefore, result = "";
	  for (var i = 0; i < text.length; i++) {
	    var ch = text.charAt(i);
	    if (ch == " " && spaceBefore && (i == text.length - 1 || text.charCodeAt(i + 1) == 32))
	      { ch = "\u00a0"; }
	    result += ch;
	    spaceBefore = ch == " ";
	  }
	  return result
	}

	// Work around nonsense dimensions being reported for stretches of
	// right-to-left text.
	function buildTokenBadBidi(inner, order) {
	  return function (builder, text, style, startStyle, endStyle, title, css) {
	    style = style ? style + " cm-force-border" : "cm-force-border";
	    var start = builder.pos, end = start + text.length;
	    for (;;) {
	      // Find the part that overlaps with the start of this text
	      var part = (void 0);
	      for (var i = 0; i < order.length; i++) {
	        part = order[i];
	        if (part.to > start && part.from <= start) { break }
	      }
	      if (part.to >= end) { return inner(builder, text, style, startStyle, endStyle, title, css) }
	      inner(builder, text.slice(0, part.to - start), style, startStyle, null, title, css);
	      startStyle = null;
	      text = text.slice(part.to - start);
	      start = part.to;
	    }
	  }
	}

	function buildCollapsedSpan(builder, size, marker, ignoreWidget) {
	  var widget = !ignoreWidget && marker.widgetNode;
	  if (widget) { builder.map.push(builder.pos, builder.pos + size, widget); }
	  if (!ignoreWidget && builder.cm.display.input.needsContentAttribute) {
	    if (!widget)
	      { widget = builder.content.appendChild(document.createElement("span")); }
	    widget.setAttribute("cm-marker", marker.id);
	  }
	  if (widget) {
	    builder.cm.display.input.setUneditable(widget);
	    builder.content.appendChild(widget);
	  }
	  builder.pos += size;
	  builder.trailingSpace = false;
	}

	// Outputs a number of spans to make up a line, taking highlighting
	// and marked text into account.
	function insertLineContent(line, builder, styles) {
	  var spans = line.markedSpans, allText = line.text, at = 0;
	  if (!spans) {
	    for (var i$1 = 1; i$1 < styles.length; i$1+=2)
	      { builder.addToken(builder, allText.slice(at, at = styles[i$1]), interpretTokenStyle(styles[i$1+1], builder.cm.options)); }
	    return
	  }

	  var len = allText.length, pos = 0, i = 1, text = "", style, css;
	  var nextChange = 0, spanStyle, spanEndStyle, spanStartStyle, title, collapsed;
	  for (;;) {
	    if (nextChange == pos) { // Update current marker set
	      spanStyle = spanEndStyle = spanStartStyle = title = css = "";
	      collapsed = null; nextChange = Infinity;
	      var foundBookmarks = [], endStyles = (void 0);
	      for (var j = 0; j < spans.length; ++j) {
	        var sp = spans[j], m = sp.marker;
	        if (m.type == "bookmark" && sp.from == pos && m.widgetNode) {
	          foundBookmarks.push(m);
	        } else if (sp.from <= pos && (sp.to == null || sp.to > pos || m.collapsed && sp.to == pos && sp.from == pos)) {
	          if (sp.to != null && sp.to != pos && nextChange > sp.to) {
	            nextChange = sp.to;
	            spanEndStyle = "";
	          }
	          if (m.className) { spanStyle += " " + m.className; }
	          if (m.css) { css = (css ? css + ";" : "") + m.css; }
	          if (m.startStyle && sp.from == pos) { spanStartStyle += " " + m.startStyle; }
	          if (m.endStyle && sp.to == nextChange) { (endStyles || (endStyles = [])).push(m.endStyle, sp.to); }
	          if (m.title && !title) { title = m.title; }
	          if (m.collapsed && (!collapsed || compareCollapsedMarkers(collapsed.marker, m) < 0))
	            { collapsed = sp; }
	        } else if (sp.from > pos && nextChange > sp.from) {
	          nextChange = sp.from;
	        }
	      }
	      if (endStyles) { for (var j$1 = 0; j$1 < endStyles.length; j$1 += 2)
	        { if (endStyles[j$1 + 1] == nextChange) { spanEndStyle += " " + endStyles[j$1]; } } }

	      if (!collapsed || collapsed.from == pos) { for (var j$2 = 0; j$2 < foundBookmarks.length; ++j$2)
	        { buildCollapsedSpan(builder, 0, foundBookmarks[j$2]); } }
	      if (collapsed && (collapsed.from || 0) == pos) {
	        buildCollapsedSpan(builder, (collapsed.to == null ? len + 1 : collapsed.to) - pos,
	                           collapsed.marker, collapsed.from == null);
	        if (collapsed.to == null) { return }
	        if (collapsed.to == pos) { collapsed = false; }
	      }
	    }
	    if (pos >= len) { break }

	    var upto = Math.min(len, nextChange);
	    while (true) {
	      if (text) {
	        var end = pos + text.length;
	        if (!collapsed) {
	          var tokenText = end > upto ? text.slice(0, upto - pos) : text;
	          builder.addToken(builder, tokenText, style ? style + spanStyle : spanStyle,
	                           spanStartStyle, pos + tokenText.length == nextChange ? spanEndStyle : "", title, css);
	        }
	        if (end >= upto) {text = text.slice(upto - pos); pos = upto; break}
	        pos = end;
	        spanStartStyle = "";
	      }
	      text = allText.slice(at, at = styles[i++]);
	      style = interpretTokenStyle(styles[i++], builder.cm.options);
	    }
	  }
	}


	// These objects are used to represent the visible (currently drawn)
	// part of the document. A LineView may correspond to multiple
	// logical lines, if those are connected by collapsed ranges.
	function LineView(doc, line, lineN) {
	  // The starting line
	  this.line = line;
	  // Continuing lines, if any
	  this.rest = visualLineContinued(line);
	  // Number of logical lines in this visual line
	  this.size = this.rest ? lineNo(lst(this.rest)) - lineN + 1 : 1;
	  this.node = this.text = null;
	  this.hidden = lineIsHidden(doc, line);
	}

	// Create a range of LineView objects for the given lines.
	function buildViewArray(cm, from, to) {
	  var array = [], nextPos;
	  for (var pos = from; pos < to; pos = nextPos) {
	    var view = new LineView(cm.doc, getLine(cm.doc, pos), pos);
	    nextPos = pos + view.size;
	    array.push(view);
	  }
	  return array
	}

	var operationGroup = null;

	function pushOperation(op) {
	  if (operationGroup) {
	    operationGroup.ops.push(op);
	  } else {
	    op.ownsGroup = operationGroup = {
	      ops: [op],
	      delayedCallbacks: []
	    };
	  }
	}

	function fireCallbacksForOps(group) {
	  // Calls delayed callbacks and cursorActivity handlers until no
	  // new ones appear
	  var callbacks = group.delayedCallbacks, i = 0;
	  do {
	    for (; i < callbacks.length; i++)
	      { callbacks[i].call(null); }
	    for (var j = 0; j < group.ops.length; j++) {
	      var op = group.ops[j];
	      if (op.cursorActivityHandlers)
	        { while (op.cursorActivityCalled < op.cursorActivityHandlers.length)
	          { op.cursorActivityHandlers[op.cursorActivityCalled++].call(null, op.cm); } }
	    }
	  } while (i < callbacks.length)
	}

	function finishOperation(op, endCb) {
	  var group = op.ownsGroup;
	  if (!group) { return }

	  try { fireCallbacksForOps(group); }
	  finally {
	    operationGroup = null;
	    endCb(group);
	  }
	}

	var orphanDelayedCallbacks = null;

	// Often, we want to signal events at a point where we are in the
	// middle of some work, but don't want the handler to start calling
	// other methods on the editor, which might be in an inconsistent
	// state or simply not expect any other events to happen.
	// signalLater looks whether there are any handlers, and schedules
	// them to be executed when the last operation ends, or, if no
	// operation is active, when a timeout fires.
	function signalLater(emitter, type /*, values...*/) {
	  var arr = getHandlers(emitter, type);
	  if (!arr.length) { return }
	  var args = Array.prototype.slice.call(arguments, 2), list;
	  if (operationGroup) {
	    list = operationGroup.delayedCallbacks;
	  } else if (orphanDelayedCallbacks) {
	    list = orphanDelayedCallbacks;
	  } else {
	    list = orphanDelayedCallbacks = [];
	    setTimeout(fireOrphanDelayed, 0);
	  }
	  var loop = function ( i ) {
	    list.push(function () { return arr[i].apply(null, args); });
	  };

	  for (var i = 0; i < arr.length; ++i)
	    { loop( i ); }
	}

	function fireOrphanDelayed() {
	  var delayed = orphanDelayedCallbacks;
	  orphanDelayedCallbacks = null;
	  for (var i = 0; i < delayed.length; ++i) { delayed[i](); }
	}

	// When an aspect of a line changes, a string is added to
	// lineView.changes. This updates the relevant part of the line's
	// DOM structure.
	function updateLineForChanges(cm, lineView, lineN, dims) {
	  for (var j = 0; j < lineView.changes.length; j++) {
	    var type = lineView.changes[j];
	    if (type == "text") { updateLineText(cm, lineView); }
	    else if (type == "gutter") { updateLineGutter(cm, lineView, lineN, dims); }
	    else if (type == "class") { updateLineClasses(cm, lineView); }
	    else if (type == "widget") { updateLineWidgets(cm, lineView, dims); }
	  }
	  lineView.changes = null;
	}

	// Lines with gutter elements, widgets or a background class need to
	// be wrapped, and have the extra elements added to the wrapper div
	function ensureLineWrapped(lineView) {
	  if (lineView.node == lineView.text) {
	    lineView.node = elt("div", null, null, "position: relative");
	    if (lineView.text.parentNode)
	      { lineView.text.parentNode.replaceChild(lineView.node, lineView.text); }
	    lineView.node.appendChild(lineView.text);
	    if (ie && ie_version < 8) { lineView.node.style.zIndex = 2; }
	  }
	  return lineView.node
	}

	function updateLineBackground(cm, lineView) {
	  var cls = lineView.bgClass ? lineView.bgClass + " " + (lineView.line.bgClass || "") : lineView.line.bgClass;
	  if (cls) { cls += " CodeMirror-linebackground"; }
	  if (lineView.background) {
	    if (cls) { lineView.background.className = cls; }
	    else { lineView.background.parentNode.removeChild(lineView.background); lineView.background = null; }
	  } else if (cls) {
	    var wrap = ensureLineWrapped(lineView);
	    lineView.background = wrap.insertBefore(elt("div", null, cls), wrap.firstChild);
	    cm.display.input.setUneditable(lineView.background);
	  }
	}

	// Wrapper around buildLineContent which will reuse the structure
	// in display.externalMeasured when possible.
	function getLineContent(cm, lineView) {
	  var ext = cm.display.externalMeasured;
	  if (ext && ext.line == lineView.line) {
	    cm.display.externalMeasured = null;
	    lineView.measure = ext.measure;
	    return ext.built
	  }
	  return buildLineContent(cm, lineView)
	}

	// Redraw the line's text. Interacts with the background and text
	// classes because the mode may output tokens that influence these
	// classes.
	function updateLineText(cm, lineView) {
	  var cls = lineView.text.className;
	  var built = getLineContent(cm, lineView);
	  if (lineView.text == lineView.node) { lineView.node = built.pre; }
	  lineView.text.parentNode.replaceChild(built.pre, lineView.text);
	  lineView.text = built.pre;
	  if (built.bgClass != lineView.bgClass || built.textClass != lineView.textClass) {
	    lineView.bgClass = built.bgClass;
	    lineView.textClass = built.textClass;
	    updateLineClasses(cm, lineView);
	  } else if (cls) {
	    lineView.text.className = cls;
	  }
	}

	function updateLineClasses(cm, lineView) {
	  updateLineBackground(cm, lineView);
	  if (lineView.line.wrapClass)
	    { ensureLineWrapped(lineView).className = lineView.line.wrapClass; }
	  else if (lineView.node != lineView.text)
	    { lineView.node.className = ""; }
	  var textClass = lineView.textClass ? lineView.textClass + " " + (lineView.line.textClass || "") : lineView.line.textClass;
	  lineView.text.className = textClass || "";
	}

	function updateLineGutter(cm, lineView, lineN, dims) {
	  if (lineView.gutter) {
	    lineView.node.removeChild(lineView.gutter);
	    lineView.gutter = null;
	  }
	  if (lineView.gutterBackground) {
	    lineView.node.removeChild(lineView.gutterBackground);
	    lineView.gutterBackground = null;
	  }
	  if (lineView.line.gutterClass) {
	    var wrap = ensureLineWrapped(lineView);
	    lineView.gutterBackground = elt("div", null, "CodeMirror-gutter-background " + lineView.line.gutterClass,
	                                    ("left: " + (cm.options.fixedGutter ? dims.fixedPos : -dims.gutterTotalWidth) + "px; width: " + (dims.gutterTotalWidth) + "px"));
	    cm.display.input.setUneditable(lineView.gutterBackground);
	    wrap.insertBefore(lineView.gutterBackground, lineView.text);
	  }
	  var markers = lineView.line.gutterMarkers;
	  if (cm.options.lineNumbers || markers) {
	    var wrap$1 = ensureLineWrapped(lineView);
	    var gutterWrap = lineView.gutter = elt("div", null, "CodeMirror-gutter-wrapper", ("left: " + (cm.options.fixedGutter ? dims.fixedPos : -dims.gutterTotalWidth) + "px"));
	    cm.display.input.setUneditable(gutterWrap);
	    wrap$1.insertBefore(gutterWrap, lineView.text);
	    if (lineView.line.gutterClass)
	      { gutterWrap.className += " " + lineView.line.gutterClass; }
	    if (cm.options.lineNumbers && (!markers || !markers["CodeMirror-linenumbers"]))
	      { lineView.lineNumber = gutterWrap.appendChild(
	        elt("div", lineNumberFor(cm.options, lineN),
	            "CodeMirror-linenumber CodeMirror-gutter-elt",
	            ("left: " + (dims.gutterLeft["CodeMirror-linenumbers"]) + "px; width: " + (cm.display.lineNumInnerWidth) + "px"))); }
	    if (markers) { for (var k = 0; k < cm.options.gutters.length; ++k) {
	      var id = cm.options.gutters[k], found = markers.hasOwnProperty(id) && markers[id];
	      if (found)
	        { gutterWrap.appendChild(elt("div", [found], "CodeMirror-gutter-elt",
	                                   ("left: " + (dims.gutterLeft[id]) + "px; width: " + (dims.gutterWidth[id]) + "px"))); }
	    } }
	  }
	}

	function updateLineWidgets(cm, lineView, dims) {
	  if (lineView.alignable) { lineView.alignable = null; }
	  for (var node = lineView.node.firstChild, next = (void 0); node; node = next) {
	    next = node.nextSibling;
	    if (node.className == "CodeMirror-linewidget")
	      { lineView.node.removeChild(node); }
	  }
	  insertLineWidgets(cm, lineView, dims);
	}

	// Build a line's DOM representation from scratch
	function buildLineElement(cm, lineView, lineN, dims) {
	  var built = getLineContent(cm, lineView);
	  lineView.text = lineView.node = built.pre;
	  if (built.bgClass) { lineView.bgClass = built.bgClass; }
	  if (built.textClass) { lineView.textClass = built.textClass; }

	  updateLineClasses(cm, lineView);
	  updateLineGutter(cm, lineView, lineN, dims);
	  insertLineWidgets(cm, lineView, dims);
	  return lineView.node
	}

	// A lineView may contain multiple logical lines (when merged by
	// collapsed spans). The widgets for all of them need to be drawn.
	function insertLineWidgets(cm, lineView, dims) {
	  insertLineWidgetsFor(cm, lineView.line, lineView, dims, true);
	  if (lineView.rest) { for (var i = 0; i < lineView.rest.length; i++)
	    { insertLineWidgetsFor(cm, lineView.rest[i], lineView, dims, false); } }
	}

	function insertLineWidgetsFor(cm, line, lineView, dims, allowAbove) {
	  if (!line.widgets) { return }
	  var wrap = ensureLineWrapped(lineView);
	  for (var i = 0, ws = line.widgets; i < ws.length; ++i) {
	    var widget = ws[i], node = elt("div", [widget.node], "CodeMirror-linewidget");
	    if (!widget.handleMouseEvents) { node.setAttribute("cm-ignore-events", "true"); }
	    positionLineWidget(widget, node, lineView, dims);
	    cm.display.input.setUneditable(node);
	    if (allowAbove && widget.above)
	      { wrap.insertBefore(node, lineView.gutter || lineView.text); }
	    else
	      { wrap.appendChild(node); }
	    signalLater(widget, "redraw");
	  }
	}

	function positionLineWidget(widget, node, lineView, dims) {
	  if (widget.noHScroll) {
	    (lineView.alignable || (lineView.alignable = [])).push(node);
	    var width = dims.wrapperWidth;
	    node.style.left = dims.fixedPos + "px";
	    if (!widget.coverGutter) {
	      width -= dims.gutterTotalWidth;
	      node.style.paddingLeft = dims.gutterTotalWidth + "px";
	    }
	    node.style.width = width + "px";
	  }
	  if (widget.coverGutter) {
	    node.style.zIndex = 5;
	    node.style.position = "relative";
	    if (!widget.noHScroll) { node.style.marginLeft = -dims.gutterTotalWidth + "px"; }
	  }
	}

	function widgetHeight(widget) {
	  if (widget.height != null) { return widget.height }
	  var cm = widget.doc.cm;
	  if (!cm) { return 0 }
	  if (!contains(document.body, widget.node)) {
	    var parentStyle = "position: relative;";
	    if (widget.coverGutter)
	      { parentStyle += "margin-left: -" + cm.display.gutters.offsetWidth + "px;"; }
	    if (widget.noHScroll)
	      { parentStyle += "width: " + cm.display.wrapper.clientWidth + "px;"; }
	    removeChildrenAndAdd(cm.display.measure, elt("div", [widget.node], null, parentStyle));
	  }
	  return widget.height = widget.node.parentNode.offsetHeight
	}

	// Return true when the given mouse event happened in a widget
	function eventInWidget(display, e) {
	  for (var n = e_target(e); n != display.wrapper; n = n.parentNode) {
	    if (!n || (n.nodeType == 1 && n.getAttribute("cm-ignore-events") == "true") ||
	        (n.parentNode == display.sizer && n != display.mover))
	      { return true }
	  }
	}

	// POSITION MEASUREMENT

	function paddingTop(display) {return display.lineSpace.offsetTop}
	function paddingVert(display) {return display.mover.offsetHeight - display.lineSpace.offsetHeight}
	function paddingH(display) {
	  if (display.cachedPaddingH) { return display.cachedPaddingH }
	  var e = removeChildrenAndAdd(display.measure, elt("pre", "x"));
	  var style = window.getComputedStyle ? window.getComputedStyle(e) : e.currentStyle;
	  var data = {left: parseInt(style.paddingLeft), right: parseInt(style.paddingRight)};
	  if (!isNaN(data.left) && !isNaN(data.right)) { display.cachedPaddingH = data; }
	  return data
	}

	function scrollGap(cm) { return scrollerGap - cm.display.nativeBarWidth }
	function displayWidth(cm) {
	  return cm.display.scroller.clientWidth - scrollGap(cm) - cm.display.barWidth
	}
	function displayHeight(cm) {
	  return cm.display.scroller.clientHeight - scrollGap(cm) - cm.display.barHeight
	}

	// Ensure the lineView.wrapping.heights array is populated. This is
	// an array of bottom offsets for the lines that make up a drawn
	// line. When lineWrapping is on, there might be more than one
	// height.
	function ensureLineHeights(cm, lineView, rect) {
	  var wrapping = cm.options.lineWrapping;
	  var curWidth = wrapping && displayWidth(cm);
	  if (!lineView.measure.heights || wrapping && lineView.measure.width != curWidth) {
	    var heights = lineView.measure.heights = [];
	    if (wrapping) {
	      lineView.measure.width = curWidth;
	      var rects = lineView.text.firstChild.getClientRects();
	      for (var i = 0; i < rects.length - 1; i++) {
	        var cur = rects[i], next = rects[i + 1];
	        if (Math.abs(cur.bottom - next.bottom) > 2)
	          { heights.push((cur.bottom + next.top) / 2 - rect.top); }
	      }
	    }
	    heights.push(rect.bottom - rect.top);
	  }
	}

	// Find a line map (mapping character offsets to text nodes) and a
	// measurement cache for the given line number. (A line view might
	// contain multiple lines when collapsed ranges are present.)
	function mapFromLineView(lineView, line, lineN) {
	  if (lineView.line == line)
	    { return {map: lineView.measure.map, cache: lineView.measure.cache} }
	  for (var i = 0; i < lineView.rest.length; i++)
	    { if (lineView.rest[i] == line)
	      { return {map: lineView.measure.maps[i], cache: lineView.measure.caches[i]} } }
	  for (var i$1 = 0; i$1 < lineView.rest.length; i$1++)
	    { if (lineNo(lineView.rest[i$1]) > lineN)
	      { return {map: lineView.measure.maps[i$1], cache: lineView.measure.caches[i$1], before: true} } }
	}

	// Render a line into the hidden node display.externalMeasured. Used
	// when measurement is needed for a line that's not in the viewport.
	function updateExternalMeasurement(cm, line) {
	  line = visualLine(line);
	  var lineN = lineNo(line);
	  var view = cm.display.externalMeasured = new LineView(cm.doc, line, lineN);
	  view.lineN = lineN;
	  var built = view.built = buildLineContent(cm, view);
	  view.text = built.pre;
	  removeChildrenAndAdd(cm.display.lineMeasure, built.pre);
	  return view
	}

	// Get a {top, bottom, left, right} box (in line-local coordinates)
	// for a given character.
	function measureChar(cm, line, ch, bias) {
	  return measureCharPrepared(cm, prepareMeasureForLine(cm, line), ch, bias)
	}

	// Find a line view that corresponds to the given line number.
	function findViewForLine(cm, lineN) {
	  if (lineN >= cm.display.viewFrom && lineN < cm.display.viewTo)
	    { return cm.display.view[findViewIndex(cm, lineN)] }
	  var ext = cm.display.externalMeasured;
	  if (ext && lineN >= ext.lineN && lineN < ext.lineN + ext.size)
	    { return ext }
	}

	// Measurement can be split in two steps, the set-up work that
	// applies to the whole line, and the measurement of the actual
	// character. Functions like coordsChar, that need to do a lot of
	// measurements in a row, can thus ensure that the set-up work is
	// only done once.
	function prepareMeasureForLine(cm, line) {
	  var lineN = lineNo(line);
	  var view = findViewForLine(cm, lineN);
	  if (view && !view.text) {
	    view = null;
	  } else if (view && view.changes) {
	    updateLineForChanges(cm, view, lineN, getDimensions(cm));
	    cm.curOp.forceUpdate = true;
	  }
	  if (!view)
	    { view = updateExternalMeasurement(cm, line); }

	  var info = mapFromLineView(view, line, lineN);
	  return {
	    line: line, view: view, rect: null,
	    map: info.map, cache: info.cache, before: info.before,
	    hasHeights: false
	  }
	}

	// Given a prepared measurement object, measures the position of an
	// actual character (or fetches it from the cache).
	function measureCharPrepared(cm, prepared, ch, bias, varHeight) {
	  if (prepared.before) { ch = -1; }
	  var key = ch + (bias || ""), found;
	  if (prepared.cache.hasOwnProperty(key)) {
	    found = prepared.cache[key];
	  } else {
	    if (!prepared.rect)
	      { prepared.rect = prepared.view.text.getBoundingClientRect(); }
	    if (!prepared.hasHeights) {
	      ensureLineHeights(cm, prepared.view, prepared.rect);
	      prepared.hasHeights = true;
	    }
	    found = measureCharInner(cm, prepared, ch, bias);
	    if (!found.bogus) { prepared.cache[key] = found; }
	  }
	  return {left: found.left, right: found.right,
	          top: varHeight ? found.rtop : found.top,
	          bottom: varHeight ? found.rbottom : found.bottom}
	}

	var nullRect = {left: 0, right: 0, top: 0, bottom: 0};

	function nodeAndOffsetInLineMap(map$$1, ch, bias) {
	  var node, start, end, collapse, mStart, mEnd;
	  // First, search the line map for the text node corresponding to,
	  // or closest to, the target character.
	  for (var i = 0; i < map$$1.length; i += 3) {
	    mStart = map$$1[i];
	    mEnd = map$$1[i + 1];
	    if (ch < mStart) {
	      start = 0; end = 1;
	      collapse = "left";
	    } else if (ch < mEnd) {
	      start = ch - mStart;
	      end = start + 1;
	    } else if (i == map$$1.length - 3 || ch == mEnd && map$$1[i + 3] > ch) {
	      end = mEnd - mStart;
	      start = end - 1;
	      if (ch >= mEnd) { collapse = "right"; }
	    }
	    if (start != null) {
	      node = map$$1[i + 2];
	      if (mStart == mEnd && bias == (node.insertLeft ? "left" : "right"))
	        { collapse = bias; }
	      if (bias == "left" && start == 0)
	        { while (i && map$$1[i - 2] == map$$1[i - 3] && map$$1[i - 1].insertLeft) {
	          node = map$$1[(i -= 3) + 2];
	          collapse = "left";
	        } }
	      if (bias == "right" && start == mEnd - mStart)
	        { while (i < map$$1.length - 3 && map$$1[i + 3] == map$$1[i + 4] && !map$$1[i + 5].insertLeft) {
	          node = map$$1[(i += 3) + 2];
	          collapse = "right";
	        } }
	      break
	    }
	  }
	  return {node: node, start: start, end: end, collapse: collapse, coverStart: mStart, coverEnd: mEnd}
	}

	function getUsefulRect(rects, bias) {
	  var rect = nullRect;
	  if (bias == "left") { for (var i = 0; i < rects.length; i++) {
	    if ((rect = rects[i]).left != rect.right) { break }
	  } } else { for (var i$1 = rects.length - 1; i$1 >= 0; i$1--) {
	    if ((rect = rects[i$1]).left != rect.right) { break }
	  } }
	  return rect
	}

	function measureCharInner(cm, prepared, ch, bias) {
	  var place = nodeAndOffsetInLineMap(prepared.map, ch, bias);
	  var node = place.node, start = place.start, end = place.end, collapse = place.collapse;

	  var rect;
	  if (node.nodeType == 3) { // If it is a text node, use a range to retrieve the coordinates.
	    for (var i$1 = 0; i$1 < 4; i$1++) { // Retry a maximum of 4 times when nonsense rectangles are returned
	      while (start && isExtendingChar(prepared.line.text.charAt(place.coverStart + start))) { --start; }
	      while (place.coverStart + end < place.coverEnd && isExtendingChar(prepared.line.text.charAt(place.coverStart + end))) { ++end; }
	      if (ie && ie_version < 9 && start == 0 && end == place.coverEnd - place.coverStart)
	        { rect = node.parentNode.getBoundingClientRect(); }
	      else
	        { rect = getUsefulRect(range(node, start, end).getClientRects(), bias); }
	      if (rect.left || rect.right || start == 0) { break }
	      end = start;
	      start = start - 1;
	      collapse = "right";
	    }
	    if (ie && ie_version < 11) { rect = maybeUpdateRectForZooming(cm.display.measure, rect); }
	  } else { // If it is a widget, simply get the box for the whole widget.
	    if (start > 0) { collapse = bias = "right"; }
	    var rects;
	    if (cm.options.lineWrapping && (rects = node.getClientRects()).length > 1)
	      { rect = rects[bias == "right" ? rects.length - 1 : 0]; }
	    else
	      { rect = node.getBoundingClientRect(); }
	  }
	  if (ie && ie_version < 9 && !start && (!rect || !rect.left && !rect.right)) {
	    var rSpan = node.parentNode.getClientRects()[0];
	    if (rSpan)
	      { rect = {left: rSpan.left, right: rSpan.left + charWidth(cm.display), top: rSpan.top, bottom: rSpan.bottom}; }
	    else
	      { rect = nullRect; }
	  }

	  var rtop = rect.top - prepared.rect.top, rbot = rect.bottom - prepared.rect.top;
	  var mid = (rtop + rbot) / 2;
	  var heights = prepared.view.measure.heights;
	  var i = 0;
	  for (; i < heights.length - 1; i++)
	    { if (mid < heights[i]) { break } }
	  var top = i ? heights[i - 1] : 0, bot = heights[i];
	  var result = {left: (collapse == "right" ? rect.right : rect.left) - prepared.rect.left,
	                right: (collapse == "left" ? rect.left : rect.right) - prepared.rect.left,
	                top: top, bottom: bot};
	  if (!rect.left && !rect.right) { result.bogus = true; }
	  if (!cm.options.singleCursorHeightPerLine) { result.rtop = rtop; result.rbottom = rbot; }

	  return result
	}

	// Work around problem with bounding client rects on ranges being
	// returned incorrectly when zoomed on IE10 and below.
	function maybeUpdateRectForZooming(measure, rect) {
	  if (!window.screen || screen.logicalXDPI == null ||
	      screen.logicalXDPI == screen.deviceXDPI || !hasBadZoomedRects(measure))
	    { return rect }
	  var scaleX = screen.logicalXDPI / screen.deviceXDPI;
	  var scaleY = screen.logicalYDPI / screen.deviceYDPI;
	  return {left: rect.left * scaleX, right: rect.right * scaleX,
	          top: rect.top * scaleY, bottom: rect.bottom * scaleY}
	}

	function clearLineMeasurementCacheFor(lineView) {
	  if (lineView.measure) {
	    lineView.measure.cache = {};
	    lineView.measure.heights = null;
	    if (lineView.rest) { for (var i = 0; i < lineView.rest.length; i++)
	      { lineView.measure.caches[i] = {}; } }
	  }
	}

	function clearLineMeasurementCache(cm) {
	  cm.display.externalMeasure = null;
	  removeChildren(cm.display.lineMeasure);
	  for (var i = 0; i < cm.display.view.length; i++)
	    { clearLineMeasurementCacheFor(cm.display.view[i]); }
	}

	function clearCaches(cm) {
	  clearLineMeasurementCache(cm);
	  cm.display.cachedCharWidth = cm.display.cachedTextHeight = cm.display.cachedPaddingH = null;
	  if (!cm.options.lineWrapping) { cm.display.maxLineChanged = true; }
	  cm.display.lineNumChars = null;
	}

	function pageScrollX() {
	  // Work around https://bugs.chromium.org/p/chromium/issues/detail?id=489206
	  // which causes page_Offset and bounding client rects to use
	  // different reference viewports and invalidate our calculations.
	  if (chrome && android) { return -(document.body.getBoundingClientRect().left - parseInt(getComputedStyle(document.body).marginLeft)) }
	  return window.pageXOffset || (document.documentElement || document.body).scrollLeft
	}
	function pageScrollY() {
	  if (chrome && android) { return -(document.body.getBoundingClientRect().top - parseInt(getComputedStyle(document.body).marginTop)) }
	  return window.pageYOffset || (document.documentElement || document.body).scrollTop
	}

	function widgetTopHeight(lineObj) {
	  var height = 0;
	  if (lineObj.widgets) { for (var i = 0; i < lineObj.widgets.length; ++i) { if (lineObj.widgets[i].above)
	    { height += widgetHeight(lineObj.widgets[i]); } } }
	  return height
	}

	// Converts a {top, bottom, left, right} box from line-local
	// coordinates into another coordinate system. Context may be one of
	// "line", "div" (display.lineDiv), "local"./null (editor), "window",
	// or "page".
	function intoCoordSystem(cm, lineObj, rect, context, includeWidgets) {
	  if (!includeWidgets) {
	    var height = widgetTopHeight(lineObj);
	    rect.top += height; rect.bottom += height;
	  }
	  if (context == "line") { return rect }
	  if (!context) { context = "local"; }
	  var yOff = heightAtLine(lineObj);
	  if (context == "local") { yOff += paddingTop(cm.display); }
	  else { yOff -= cm.display.viewOffset; }
	  if (context == "page" || context == "window") {
	    var lOff = cm.display.lineSpace.getBoundingClientRect();
	    yOff += lOff.top + (context == "window" ? 0 : pageScrollY());
	    var xOff = lOff.left + (context == "window" ? 0 : pageScrollX());
	    rect.left += xOff; rect.right += xOff;
	  }
	  rect.top += yOff; rect.bottom += yOff;
	  return rect
	}

	// Coverts a box from "div" coords to another coordinate system.
	// Context may be "window", "page", "div", or "local"./null.
	function fromCoordSystem(cm, coords, context) {
	  if (context == "div") { return coords }
	  var left = coords.left, top = coords.top;
	  // First move into "page" coordinate system
	  if (context == "page") {
	    left -= pageScrollX();
	    top -= pageScrollY();
	  } else if (context == "local" || !context) {
	    var localBox = cm.display.sizer.getBoundingClientRect();
	    left += localBox.left;
	    top += localBox.top;
	  }

	  var lineSpaceBox = cm.display.lineSpace.getBoundingClientRect();
	  return {left: left - lineSpaceBox.left, top: top - lineSpaceBox.top}
	}

	function charCoords(cm, pos, context, lineObj, bias) {
	  if (!lineObj) { lineObj = getLine(cm.doc, pos.line); }
	  return intoCoordSystem(cm, lineObj, measureChar(cm, lineObj, pos.ch, bias), context)
	}

	// Returns a box for a given cursor position, which may have an
	// 'other' property containing the position of the secondary cursor
	// on a bidi boundary.
	// A cursor Pos(line, char, "before") is on the same visual line as `char - 1`
	// and after `char - 1` in writing order of `char - 1`
	// A cursor Pos(line, char, "after") is on the same visual line as `char`
	// and before `char` in writing order of `char`
	// Examples (upper-case letters are RTL, lower-case are LTR):
	//     Pos(0, 1, ...)
	//     before   after
	// ab     a|b     a|b
	// aB     a|B     aB|
	// Ab     |Ab     A|b
	// AB     B|A     B|A
	// Every position after the last character on a line is considered to stick
	// to the last character on the line.
	function cursorCoords(cm, pos, context, lineObj, preparedMeasure, varHeight) {
	  lineObj = lineObj || getLine(cm.doc, pos.line);
	  if (!preparedMeasure) { preparedMeasure = prepareMeasureForLine(cm, lineObj); }
	  function get(ch, right) {
	    var m = measureCharPrepared(cm, preparedMeasure, ch, right ? "right" : "left", varHeight);
	    if (right) { m.left = m.right; } else { m.right = m.left; }
	    return intoCoordSystem(cm, lineObj, m, context)
	  }
	  var order = getOrder(lineObj, cm.doc.direction), ch = pos.ch, sticky = pos.sticky;
	  if (ch >= lineObj.text.length) {
	    ch = lineObj.text.length;
	    sticky = "before";
	  } else if (ch <= 0) {
	    ch = 0;
	    sticky = "after";
	  }
	  if (!order) { return get(sticky == "before" ? ch - 1 : ch, sticky == "before") }

	  function getBidi(ch, partPos, invert) {
	    var part = order[partPos], right = part.level == 1;
	    return get(invert ? ch - 1 : ch, right != invert)
	  }
	  var partPos = getBidiPartAt(order, ch, sticky);
	  var other = bidiOther;
	  var val = getBidi(ch, partPos, sticky == "before");
	  if (other != null) { val.other = getBidi(ch, other, sticky != "before"); }
	  return val
	}

	// Used to cheaply estimate the coordinates for a position. Used for
	// intermediate scroll updates.
	function estimateCoords(cm, pos) {
	  var left = 0;
	  pos = clipPos(cm.doc, pos);
	  if (!cm.options.lineWrapping) { left = charWidth(cm.display) * pos.ch; }
	  var lineObj = getLine(cm.doc, pos.line);
	  var top = heightAtLine(lineObj) + paddingTop(cm.display);
	  return {left: left, right: left, top: top, bottom: top + lineObj.height}
	}

	// Positions returned by coordsChar contain some extra information.
	// xRel is the relative x position of the input coordinates compared
	// to the found position (so xRel > 0 means the coordinates are to
	// the right of the character position, for example). When outside
	// is true, that means the coordinates lie outside the line's
	// vertical range.
	function PosWithInfo(line, ch, sticky, outside, xRel) {
	  var pos = Pos(line, ch, sticky);
	  pos.xRel = xRel;
	  if (outside) { pos.outside = true; }
	  return pos
	}

	// Compute the character position closest to the given coordinates.
	// Input must be lineSpace-local ("div" coordinate system).
	function coordsChar(cm, x, y) {
	  var doc = cm.doc;
	  y += cm.display.viewOffset;
	  if (y < 0) { return PosWithInfo(doc.first, 0, null, true, -1) }
	  var lineN = lineAtHeight(doc, y), last = doc.first + doc.size - 1;
	  if (lineN > last)
	    { return PosWithInfo(doc.first + doc.size - 1, getLine(doc, last).text.length, null, true, 1) }
	  if (x < 0) { x = 0; }

	  var lineObj = getLine(doc, lineN);
	  for (;;) {
	    var found = coordsCharInner(cm, lineObj, lineN, x, y);
	    var collapsed = collapsedSpanAround(lineObj, found.ch + (found.xRel > 0 ? 1 : 0));
	    if (!collapsed) { return found }
	    var rangeEnd = collapsed.find(1);
	    if (rangeEnd.line == lineN) { return rangeEnd }
	    lineObj = getLine(doc, lineN = rangeEnd.line);
	  }
	}

	function wrappedLineExtent(cm, lineObj, preparedMeasure, y) {
	  y -= widgetTopHeight(lineObj);
	  var end = lineObj.text.length;
	  var begin = findFirst(function (ch) { return measureCharPrepared(cm, preparedMeasure, ch - 1).bottom <= y; }, end, 0);
	  end = findFirst(function (ch) { return measureCharPrepared(cm, preparedMeasure, ch).top > y; }, begin, end);
	  return {begin: begin, end: end}
	}

	function wrappedLineExtentChar(cm, lineObj, preparedMeasure, target) {
	  if (!preparedMeasure) { preparedMeasure = prepareMeasureForLine(cm, lineObj); }
	  var targetTop = intoCoordSystem(cm, lineObj, measureCharPrepared(cm, preparedMeasure, target), "line").top;
	  return wrappedLineExtent(cm, lineObj, preparedMeasure, targetTop)
	}

	// Returns true if the given side of a box is after the given
	// coordinates, in top-to-bottom, left-to-right order.
	function boxIsAfter(box, x, y, left) {
	  return box.bottom <= y ? false : box.top > y ? true : (left ? box.left : box.right) > x
	}

	function coordsCharInner(cm, lineObj, lineNo$$1, x, y) {
	  // Move y into line-local coordinate space
	  y -= heightAtLine(lineObj);
	  var preparedMeasure = prepareMeasureForLine(cm, lineObj);
	  // When directly calling `measureCharPrepared`, we have to adjust
	  // for the widgets at this line.
	  var widgetHeight$$1 = widgetTopHeight(lineObj);
	  var begin = 0, end = lineObj.text.length, ltr = true;

	  var order = getOrder(lineObj, cm.doc.direction);
	  // If the line isn't plain left-to-right text, first figure out
	  // which bidi section the coordinates fall into.
	  if (order) {
	    var part = (cm.options.lineWrapping ? coordsBidiPartWrapped : coordsBidiPart)
	                 (cm, lineObj, lineNo$$1, preparedMeasure, order, x, y);
	    ltr = part.level != 1;
	    // The awkward -1 offsets are needed because findFirst (called
	    // on these below) will treat its first bound as inclusive,
	    // second as exclusive, but we want to actually address the
	    // characters in the part's range
	    begin = ltr ? part.from : part.to - 1;
	    end = ltr ? part.to : part.from - 1;
	  }

	  // A binary search to find the first character whose bounding box
	  // starts after the coordinates. If we run across any whose box wrap
	  // the coordinates, store that.
	  var chAround = null, boxAround = null;
	  var ch = findFirst(function (ch) {
	    var box = measureCharPrepared(cm, preparedMeasure, ch);
	    box.top += widgetHeight$$1; box.bottom += widgetHeight$$1;
	    if (!boxIsAfter(box, x, y, false)) { return false }
	    if (box.top <= y && box.left <= x) {
	      chAround = ch;
	      boxAround = box;
	    }
	    return true
	  }, begin, end);

	  var baseX, sticky, outside = false;
	  // If a box around the coordinates was found, use that
	  if (boxAround) {
	    // Distinguish coordinates nearer to the left or right side of the box
	    var atLeft = x - boxAround.left < boxAround.right - x, atStart = atLeft == ltr;
	    ch = chAround + (atStart ? 0 : 1);
	    sticky = atStart ? "after" : "before";
	    baseX = atLeft ? boxAround.left : boxAround.right;
	  } else {
	    // (Adjust for extended bound, if necessary.)
	    if (!ltr && (ch == end || ch == begin)) { ch++; }
	    // To determine which side to associate with, get the box to the
	    // left of the character and compare it's vertical position to the
	    // coordinates
	    sticky = ch == 0 ? "after" : ch == lineObj.text.length ? "before" :
	      (measureCharPrepared(cm, preparedMeasure, ch - (ltr ? 1 : 0)).bottom + widgetHeight$$1 <= y) == ltr ?
	      "after" : "before";
	    // Now get accurate coordinates for this place, in order to get a
	    // base X position
	    var coords = cursorCoords(cm, Pos(lineNo$$1, ch, sticky), "line", lineObj, preparedMeasure);
	    baseX = coords.left;
	    outside = y < coords.top || y >= coords.bottom;
	  }

	  ch = skipExtendingChars(lineObj.text, ch, 1);
	  return PosWithInfo(lineNo$$1, ch, sticky, outside, x - baseX)
	}

	function coordsBidiPart(cm, lineObj, lineNo$$1, preparedMeasure, order, x, y) {
	  // Bidi parts are sorted left-to-right, and in a non-line-wrapping
	  // situation, we can take this ordering to correspond to the visual
	  // ordering. This finds the first part whose end is after the given
	  // coordinates.
	  var index = findFirst(function (i) {
	    var part = order[i], ltr = part.level != 1;
	    return boxIsAfter(cursorCoords(cm, Pos(lineNo$$1, ltr ? part.to : part.from, ltr ? "before" : "after"),
	                                   "line", lineObj, preparedMeasure), x, y, true)
	  }, 0, order.length - 1);
	  var part = order[index];
	  // If this isn't the first part, the part's start is also after
	  // the coordinates, and the coordinates aren't on the same line as
	  // that start, move one part back.
	  if (index > 0) {
	    var ltr = part.level != 1;
	    var start = cursorCoords(cm, Pos(lineNo$$1, ltr ? part.from : part.to, ltr ? "after" : "before"),
	                             "line", lineObj, preparedMeasure);
	    if (boxIsAfter(start, x, y, true) && start.top > y)
	      { part = order[index - 1]; }
	  }
	  return part
	}

	function coordsBidiPartWrapped(cm, lineObj, _lineNo, preparedMeasure, order, x, y) {
	  // In a wrapped line, rtl text on wrapping boundaries can do things
	  // that don't correspond to the ordering in our `order` array at
	  // all, so a binary search doesn't work, and we want to return a
	  // part that only spans one line so that the binary search in
	  // coordsCharInner is safe. As such, we first find the extent of the
	  // wrapped line, and then do a flat search in which we discard any
	  // spans that aren't on the line.
	  var ref = wrappedLineExtent(cm, lineObj, preparedMeasure, y);
	  var begin = ref.begin;
	  var end = ref.end;
	  if (/\s/.test(lineObj.text.charAt(end - 1))) { end--; }
	  var part = null, closestDist = null;
	  for (var i = 0; i < order.length; i++) {
	    var p = order[i];
	    if (p.from >= end || p.to <= begin) { continue }
	    var ltr = p.level != 1;
	    var endX = measureCharPrepared(cm, preparedMeasure, ltr ? Math.min(end, p.to) - 1 : Math.max(begin, p.from)).right;
	    // Weigh against spans ending before this, so that they are only
	    // picked if nothing ends after
	    var dist = endX < x ? x - endX + 1e9 : endX - x;
	    if (!part || closestDist > dist) {
	      part = p;
	      closestDist = dist;
	    }
	  }
	  if (!part) { part = order[order.length - 1]; }
	  // Clip the part to the wrapped line.
	  if (part.from < begin) { part = {from: begin, to: part.to, level: part.level}; }
	  if (part.to > end) { part = {from: part.from, to: end, level: part.level}; }
	  return part
	}

	var measureText;
	// Compute the default text height.
	function textHeight(display) {
	  if (display.cachedTextHeight != null) { return display.cachedTextHeight }
	  if (measureText == null) {
	    measureText = elt("pre");
	    // Measure a bunch of lines, for browsers that compute
	    // fractional heights.
	    for (var i = 0; i < 49; ++i) {
	      measureText.appendChild(document.createTextNode("x"));
	      measureText.appendChild(elt("br"));
	    }
	    measureText.appendChild(document.createTextNode("x"));
	  }
	  removeChildrenAndAdd(display.measure, measureText);
	  var height = measureText.offsetHeight / 50;
	  if (height > 3) { display.cachedTextHeight = height; }
	  removeChildren(display.measure);
	  return height || 1
	}

	// Compute the default character width.
	function charWidth(display) {
	  if (display.cachedCharWidth != null) { return display.cachedCharWidth }
	  var anchor = elt("span", "xxxxxxxxxx");
	  var pre = elt("pre", [anchor]);
	  removeChildrenAndAdd(display.measure, pre);
	  var rect = anchor.getBoundingClientRect(), width = (rect.right - rect.left) / 10;
	  if (width > 2) { display.cachedCharWidth = width; }
	  return width || 10
	}

	// Do a bulk-read of the DOM positions and sizes needed to draw the
	// view, so that we don't interleave reading and writing to the DOM.
	function getDimensions(cm) {
	  var d = cm.display, left = {}, width = {};
	  var gutterLeft = d.gutters.clientLeft;
	  for (var n = d.gutters.firstChild, i = 0; n; n = n.nextSibling, ++i) {
	    left[cm.options.gutters[i]] = n.offsetLeft + n.clientLeft + gutterLeft;
	    width[cm.options.gutters[i]] = n.clientWidth;
	  }
	  return {fixedPos: compensateForHScroll(d),
	          gutterTotalWidth: d.gutters.offsetWidth,
	          gutterLeft: left,
	          gutterWidth: width,
	          wrapperWidth: d.wrapper.clientWidth}
	}

	// Computes display.scroller.scrollLeft + display.gutters.offsetWidth,
	// but using getBoundingClientRect to get a sub-pixel-accurate
	// result.
	function compensateForHScroll(display) {
	  return display.scroller.getBoundingClientRect().left - display.sizer.getBoundingClientRect().left
	}

	// Returns a function that estimates the height of a line, to use as
	// first approximation until the line becomes visible (and is thus
	// properly measurable).
	function estimateHeight(cm) {
	  var th = textHeight(cm.display), wrapping = cm.options.lineWrapping;
	  var perLine = wrapping && Math.max(5, cm.display.scroller.clientWidth / charWidth(cm.display) - 3);
	  return function (line) {
	    if (lineIsHidden(cm.doc, line)) { return 0 }

	    var widgetsHeight = 0;
	    if (line.widgets) { for (var i = 0; i < line.widgets.length; i++) {
	      if (line.widgets[i].height) { widgetsHeight += line.widgets[i].height; }
	    } }

	    if (wrapping)
	      { return widgetsHeight + (Math.ceil(line.text.length / perLine) || 1) * th }
	    else
	      { return widgetsHeight + th }
	  }
	}

	function estimateLineHeights(cm) {
	  var doc = cm.doc, est = estimateHeight(cm);
	  doc.iter(function (line) {
	    var estHeight = est(line);
	    if (estHeight != line.height) { updateLineHeight(line, estHeight); }
	  });
	}

	// Given a mouse event, find the corresponding position. If liberal
	// is false, it checks whether a gutter or scrollbar was clicked,
	// and returns null if it was. forRect is used by rectangular
	// selections, and tries to estimate a character position even for
	// coordinates beyond the right of the text.
	function posFromMouse(cm, e, liberal, forRect) {
	  var display = cm.display;
	  if (!liberal && e_target(e).getAttribute("cm-not-content") == "true") { return null }

	  var x, y, space = display.lineSpace.getBoundingClientRect();
	  // Fails unpredictably on IE[67] when mouse is dragged around quickly.
	  try { x = e.clientX - space.left; y = e.clientY - space.top; }
	  catch (e) { return null }
	  var coords = coordsChar(cm, x, y), line;
	  if (forRect && coords.xRel == 1 && (line = getLine(cm.doc, coords.line).text).length == coords.ch) {
	    var colDiff = countColumn(line, line.length, cm.options.tabSize) - line.length;
	    coords = Pos(coords.line, Math.max(0, Math.round((x - paddingH(cm.display).left) / charWidth(cm.display)) - colDiff));
	  }
	  return coords
	}

	// Find the view element corresponding to a given line. Return null
	// when the line isn't visible.
	function findViewIndex(cm, n) {
	  if (n >= cm.display.viewTo) { return null }
	  n -= cm.display.viewFrom;
	  if (n < 0) { return null }
	  var view = cm.display.view;
	  for (var i = 0; i < view.length; i++) {
	    n -= view[i].size;
	    if (n < 0) { return i }
	  }
	}

	function updateSelection(cm) {
	  cm.display.input.showSelection(cm.display.input.prepareSelection());
	}

	function prepareSelection(cm, primary) {
	  if ( primary === void 0 ) { primary = true; }

	  var doc = cm.doc, result = {};
	  var curFragment = result.cursors = document.createDocumentFragment();
	  var selFragment = result.selection = document.createDocumentFragment();

	  for (var i = 0; i < doc.sel.ranges.length; i++) {
	    if (!primary && i == doc.sel.primIndex) { continue }
	    var range$$1 = doc.sel.ranges[i];
	    if (range$$1.from().line >= cm.display.viewTo || range$$1.to().line < cm.display.viewFrom) { continue }
	    var collapsed = range$$1.empty();
	    if (collapsed || cm.options.showCursorWhenSelecting)
	      { drawSelectionCursor(cm, range$$1.head, curFragment); }
	    if (!collapsed)
	      { drawSelectionRange(cm, range$$1, selFragment); }
	  }
	  return result
	}

	// Draws a cursor for the given range
	function drawSelectionCursor(cm, head, output) {
	  var pos = cursorCoords(cm, head, "div", null, null, !cm.options.singleCursorHeightPerLine);

	  var cursor = output.appendChild(elt("div", "\u00a0", "CodeMirror-cursor"));
	  cursor.style.left = pos.left + "px";
	  cursor.style.top = pos.top + "px";
	  cursor.style.height = Math.max(0, pos.bottom - pos.top) * cm.options.cursorHeight + "px";

	  if (pos.other) {
	    // Secondary cursor, shown when on a 'jump' in bi-directional text
	    var otherCursor = output.appendChild(elt("div", "\u00a0", "CodeMirror-cursor CodeMirror-secondarycursor"));
	    otherCursor.style.display = "";
	    otherCursor.style.left = pos.other.left + "px";
	    otherCursor.style.top = pos.other.top + "px";
	    otherCursor.style.height = (pos.other.bottom - pos.other.top) * .85 + "px";
	  }
	}

	function cmpCoords(a, b) { return a.top - b.top || a.left - b.left }

	// Draws the given range as a highlighted selection
	function drawSelectionRange(cm, range$$1, output) {
	  var display = cm.display, doc = cm.doc;
	  var fragment = document.createDocumentFragment();
	  var padding = paddingH(cm.display), leftSide = padding.left;
	  var rightSide = Math.max(display.sizerWidth, displayWidth(cm) - display.sizer.offsetLeft) - padding.right;
	  var docLTR = doc.direction == "ltr";

	  function add(left, top, width, bottom) {
	    if (top < 0) { top = 0; }
	    top = Math.round(top);
	    bottom = Math.round(bottom);
	    fragment.appendChild(elt("div", null, "CodeMirror-selected", ("position: absolute; left: " + left + "px;\n                             top: " + top + "px; width: " + (width == null ? rightSide - left : width) + "px;\n                             height: " + (bottom - top) + "px")));
	  }

	  function drawForLine(line, fromArg, toArg) {
	    var lineObj = getLine(doc, line);
	    var lineLen = lineObj.text.length;
	    var start, end;
	    function coords(ch, bias) {
	      return charCoords(cm, Pos(line, ch), "div", lineObj, bias)
	    }

	    function wrapX(pos, dir, side) {
	      var extent = wrappedLineExtentChar(cm, lineObj, null, pos);
	      var prop = (dir == "ltr") == (side == "after") ? "left" : "right";
	      var ch = side == "after" ? extent.begin : extent.end - (/\s/.test(lineObj.text.charAt(extent.end - 1)) ? 2 : 1);
	      return coords(ch, prop)[prop]
	    }

	    var order = getOrder(lineObj, doc.direction);
	    iterateBidiSections(order, fromArg || 0, toArg == null ? lineLen : toArg, function (from, to, dir, i) {
	      var ltr = dir == "ltr";
	      var fromPos = coords(from, ltr ? "left" : "right");
	      var toPos = coords(to - 1, ltr ? "right" : "left");

	      var openStart = fromArg == null && from == 0, openEnd = toArg == null && to == lineLen;
	      var first = i == 0, last = !order || i == order.length - 1;
	      if (toPos.top - fromPos.top <= 3) { // Single line
	        var openLeft = (docLTR ? openStart : openEnd) && first;
	        var openRight = (docLTR ? openEnd : openStart) && last;
	        var left = openLeft ? leftSide : (ltr ? fromPos : toPos).left;
	        var right = openRight ? rightSide : (ltr ? toPos : fromPos).right;
	        add(left, fromPos.top, right - left, fromPos.bottom);
	      } else { // Multiple lines
	        var topLeft, topRight, botLeft, botRight;
	        if (ltr) {
	          topLeft = docLTR && openStart && first ? leftSide : fromPos.left;
	          topRight = docLTR ? rightSide : wrapX(from, dir, "before");
	          botLeft = docLTR ? leftSide : wrapX(to, dir, "after");
	          botRight = docLTR && openEnd && last ? rightSide : toPos.right;
	        } else {
	          topLeft = !docLTR ? leftSide : wrapX(from, dir, "before");
	          topRight = !docLTR && openStart && first ? rightSide : fromPos.right;
	          botLeft = !docLTR && openEnd && last ? leftSide : toPos.left;
	          botRight = !docLTR ? rightSide : wrapX(to, dir, "after");
	        }
	        add(topLeft, fromPos.top, topRight - topLeft, fromPos.bottom);
	        if (fromPos.bottom < toPos.top) { add(leftSide, fromPos.bottom, null, toPos.top); }
	        add(botLeft, toPos.top, botRight - botLeft, toPos.bottom);
	      }

	      if (!start || cmpCoords(fromPos, start) < 0) { start = fromPos; }
	      if (cmpCoords(toPos, start) < 0) { start = toPos; }
	      if (!end || cmpCoords(fromPos, end) < 0) { end = fromPos; }
	      if (cmpCoords(toPos, end) < 0) { end = toPos; }
	    });
	    return {start: start, end: end}
	  }

	  var sFrom = range$$1.from(), sTo = range$$1.to();
	  if (sFrom.line == sTo.line) {
	    drawForLine(sFrom.line, sFrom.ch, sTo.ch);
	  } else {
	    var fromLine = getLine(doc, sFrom.line), toLine = getLine(doc, sTo.line);
	    var singleVLine = visualLine(fromLine) == visualLine(toLine);
	    var leftEnd = drawForLine(sFrom.line, sFrom.ch, singleVLine ? fromLine.text.length + 1 : null).end;
	    var rightStart = drawForLine(sTo.line, singleVLine ? 0 : null, sTo.ch).start;
	    if (singleVLine) {
	      if (leftEnd.top < rightStart.top - 2) {
	        add(leftEnd.right, leftEnd.top, null, leftEnd.bottom);
	        add(leftSide, rightStart.top, rightStart.left, rightStart.bottom);
	      } else {
	        add(leftEnd.right, leftEnd.top, rightStart.left - leftEnd.right, leftEnd.bottom);
	      }
	    }
	    if (leftEnd.bottom < rightStart.top)
	      { add(leftSide, leftEnd.bottom, null, rightStart.top); }
	  }

	  output.appendChild(fragment);
	}

	// Cursor-blinking
	function restartBlink(cm) {
	  if (!cm.state.focused) { return }
	  var display = cm.display;
	  clearInterval(display.blinker);
	  var on = true;
	  display.cursorDiv.style.visibility = "";
	  if (cm.options.cursorBlinkRate > 0)
	    { display.blinker = setInterval(function () { return display.cursorDiv.style.visibility = (on = !on) ? "" : "hidden"; },
	      cm.options.cursorBlinkRate); }
	  else if (cm.options.cursorBlinkRate < 0)
	    { display.cursorDiv.style.visibility = "hidden"; }
	}

	function ensureFocus(cm) {
	  if (!cm.state.focused) { cm.display.input.focus(); onFocus(cm); }
	}

	function delayBlurEvent(cm) {
	  cm.state.delayingBlurEvent = true;
	  setTimeout(function () { if (cm.state.delayingBlurEvent) {
	    cm.state.delayingBlurEvent = false;
	    onBlur(cm);
	  } }, 100);
	}

	function onFocus(cm, e) {
	  if (cm.state.delayingBlurEvent) { cm.state.delayingBlurEvent = false; }

	  if (cm.options.readOnly == "nocursor") { return }
	  if (!cm.state.focused) {
	    signal(cm, "focus", cm, e);
	    cm.state.focused = true;
	    addClass(cm.display.wrapper, "CodeMirror-focused");
	    // This test prevents this from firing when a context
	    // menu is closed (since the input reset would kill the
	    // select-all detection hack)
	    if (!cm.curOp && cm.display.selForContextMenu != cm.doc.sel) {
	      cm.display.input.reset();
	      if (webkit) { setTimeout(function () { return cm.display.input.reset(true); }, 20); } // Issue #1730
	    }
	    cm.display.input.receivedFocus();
	  }
	  restartBlink(cm);
	}
	function onBlur(cm, e) {
	  if (cm.state.delayingBlurEvent) { return }

	  if (cm.state.focused) {
	    signal(cm, "blur", cm, e);
	    cm.state.focused = false;
	    rmClass(cm.display.wrapper, "CodeMirror-focused");
	  }
	  clearInterval(cm.display.blinker);
	  setTimeout(function () { if (!cm.state.focused) { cm.display.shift = false; } }, 150);
	}

	// Read the actual heights of the rendered lines, and update their
	// stored heights to match.
	function updateHeightsInViewport(cm) {
	  var display = cm.display;
	  var prevBottom = display.lineDiv.offsetTop;
	  for (var i = 0; i < display.view.length; i++) {
	    var cur = display.view[i], height = (void 0);
	    if (cur.hidden) { continue }
	    if (ie && ie_version < 8) {
	      var bot = cur.node.offsetTop + cur.node.offsetHeight;
	      height = bot - prevBottom;
	      prevBottom = bot;
	    } else {
	      var box = cur.node.getBoundingClientRect();
	      height = box.bottom - box.top;
	    }
	    var diff = cur.line.height - height;
	    if (height < 2) { height = textHeight(display); }
	    if (diff > .005 || diff < -.005) {
	      updateLineHeight(cur.line, height);
	      updateWidgetHeight(cur.line);
	      if (cur.rest) { for (var j = 0; j < cur.rest.length; j++)
	        { updateWidgetHeight(cur.rest[j]); } }
	    }
	  }
	}

	// Read and store the height of line widgets associated with the
	// given line.
	function updateWidgetHeight(line) {
	  if (line.widgets) { for (var i = 0; i < line.widgets.length; ++i) {
	    var w = line.widgets[i], parent = w.node.parentNode;
	    if (parent) { w.height = parent.offsetHeight; }
	  } }
	}

	// Compute the lines that are visible in a given viewport (defaults
	// the the current scroll position). viewport may contain top,
	// height, and ensure (see op.scrollToPos) properties.
	function visibleLines(display, doc, viewport) {
	  var top = viewport && viewport.top != null ? Math.max(0, viewport.top) : display.scroller.scrollTop;
	  top = Math.floor(top - paddingTop(display));
	  var bottom = viewport && viewport.bottom != null ? viewport.bottom : top + display.wrapper.clientHeight;

	  var from = lineAtHeight(doc, top), to = lineAtHeight(doc, bottom);
	  // Ensure is a {from: {line, ch}, to: {line, ch}} object, and
	  // forces those lines into the viewport (if possible).
	  if (viewport && viewport.ensure) {
	    var ensureFrom = viewport.ensure.from.line, ensureTo = viewport.ensure.to.line;
	    if (ensureFrom < from) {
	      from = ensureFrom;
	      to = lineAtHeight(doc, heightAtLine(getLine(doc, ensureFrom)) + display.wrapper.clientHeight);
	    } else if (Math.min(ensureTo, doc.lastLine()) >= to) {
	      from = lineAtHeight(doc, heightAtLine(getLine(doc, ensureTo)) - display.wrapper.clientHeight);
	      to = ensureTo;
	    }
	  }
	  return {from: from, to: Math.max(to, from + 1)}
	}

	// Re-align line numbers and gutter marks to compensate for
	// horizontal scrolling.
	function alignHorizontally(cm) {
	  var display = cm.display, view = display.view;
	  if (!display.alignWidgets && (!display.gutters.firstChild || !cm.options.fixedGutter)) { return }
	  var comp = compensateForHScroll(display) - display.scroller.scrollLeft + cm.doc.scrollLeft;
	  var gutterW = display.gutters.offsetWidth, left = comp + "px";
	  for (var i = 0; i < view.length; i++) { if (!view[i].hidden) {
	    if (cm.options.fixedGutter) {
	      if (view[i].gutter)
	        { view[i].gutter.style.left = left; }
	      if (view[i].gutterBackground)
	        { view[i].gutterBackground.style.left = left; }
	    }
	    var align = view[i].alignable;
	    if (align) { for (var j = 0; j < align.length; j++)
	      { align[j].style.left = left; } }
	  } }
	  if (cm.options.fixedGutter)
	    { display.gutters.style.left = (comp + gutterW) + "px"; }
	}

	// Used to ensure that the line number gutter is still the right
	// size for the current document size. Returns true when an update
	// is needed.
	function maybeUpdateLineNumberWidth(cm) {
	  if (!cm.options.lineNumbers) { return false }
	  var doc = cm.doc, last = lineNumberFor(cm.options, doc.first + doc.size - 1), display = cm.display;
	  if (last.length != display.lineNumChars) {
	    var test = display.measure.appendChild(elt("div", [elt("div", last)],
	                                               "CodeMirror-linenumber CodeMirror-gutter-elt"));
	    var innerW = test.firstChild.offsetWidth, padding = test.offsetWidth - innerW;
	    display.lineGutter.style.width = "";
	    display.lineNumInnerWidth = Math.max(innerW, display.lineGutter.offsetWidth - padding) + 1;
	    display.lineNumWidth = display.lineNumInnerWidth + padding;
	    display.lineNumChars = display.lineNumInnerWidth ? last.length : -1;
	    display.lineGutter.style.width = display.lineNumWidth + "px";
	    updateGutterSpace(cm);
	    return true
	  }
	  return false
	}

	// SCROLLING THINGS INTO VIEW

	// If an editor sits on the top or bottom of the window, partially
	// scrolled out of view, this ensures that the cursor is visible.
	function maybeScrollWindow(cm, rect) {
	  if (signalDOMEvent(cm, "scrollCursorIntoView")) { return }

	  var display = cm.display, box = display.sizer.getBoundingClientRect(), doScroll = null;
	  if (rect.top + box.top < 0) { doScroll = true; }
	  else if (rect.bottom + box.top > (window.innerHeight || document.documentElement.clientHeight)) { doScroll = false; }
	  if (doScroll != null && !phantom) {
	    var scrollNode = elt("div", "\u200b", null, ("position: absolute;\n                         top: " + (rect.top - display.viewOffset - paddingTop(cm.display)) + "px;\n                         height: " + (rect.bottom - rect.top + scrollGap(cm) + display.barHeight) + "px;\n                         left: " + (rect.left) + "px; width: " + (Math.max(2, rect.right - rect.left)) + "px;"));
	    cm.display.lineSpace.appendChild(scrollNode);
	    scrollNode.scrollIntoView(doScroll);
	    cm.display.lineSpace.removeChild(scrollNode);
	  }
	}

	// Scroll a given position into view (immediately), verifying that
	// it actually became visible (as line heights are accurately
	// measured, the position of something may 'drift' during drawing).
	function scrollPosIntoView(cm, pos, end, margin) {
	  if (margin == null) { margin = 0; }
	  var rect;
	  if (!cm.options.lineWrapping && pos == end) {
	    // Set pos and end to the cursor positions around the character pos sticks to
	    // If pos.sticky == "before", that is around pos.ch - 1, otherwise around pos.ch
	    // If pos == Pos(_, 0, "before"), pos and end are unchanged
	    pos = pos.ch ? Pos(pos.line, pos.sticky == "before" ? pos.ch - 1 : pos.ch, "after") : pos;
	    end = pos.sticky == "before" ? Pos(pos.line, pos.ch + 1, "before") : pos;
	  }
	  for (var limit = 0; limit < 5; limit++) {
	    var changed = false;
	    var coords = cursorCoords(cm, pos);
	    var endCoords = !end || end == pos ? coords : cursorCoords(cm, end);
	    rect = {left: Math.min(coords.left, endCoords.left),
	            top: Math.min(coords.top, endCoords.top) - margin,
	            right: Math.max(coords.left, endCoords.left),
	            bottom: Math.max(coords.bottom, endCoords.bottom) + margin};
	    var scrollPos = calculateScrollPos(cm, rect);
	    var startTop = cm.doc.scrollTop, startLeft = cm.doc.scrollLeft;
	    if (scrollPos.scrollTop != null) {
	      updateScrollTop(cm, scrollPos.scrollTop);
	      if (Math.abs(cm.doc.scrollTop - startTop) > 1) { changed = true; }
	    }
	    if (scrollPos.scrollLeft != null) {
	      setScrollLeft(cm, scrollPos.scrollLeft);
	      if (Math.abs(cm.doc.scrollLeft - startLeft) > 1) { changed = true; }
	    }
	    if (!changed) { break }
	  }
	  return rect
	}

	// Scroll a given set of coordinates into view (immediately).
	function scrollIntoView(cm, rect) {
	  var scrollPos = calculateScrollPos(cm, rect);
	  if (scrollPos.scrollTop != null) { updateScrollTop(cm, scrollPos.scrollTop); }
	  if (scrollPos.scrollLeft != null) { setScrollLeft(cm, scrollPos.scrollLeft); }
	}

	// Calculate a new scroll position needed to scroll the given
	// rectangle into view. Returns an object with scrollTop and
	// scrollLeft properties. When these are undefined, the
	// vertical/horizontal position does not need to be adjusted.
	function calculateScrollPos(cm, rect) {
	  var display = cm.display, snapMargin = textHeight(cm.display);
	  if (rect.top < 0) { rect.top = 0; }
	  var screentop = cm.curOp && cm.curOp.scrollTop != null ? cm.curOp.scrollTop : display.scroller.scrollTop;
	  var screen = displayHeight(cm), result = {};
	  if (rect.bottom - rect.top > screen) { rect.bottom = rect.top + screen; }
	  var docBottom = cm.doc.height + paddingVert(display);
	  var atTop = rect.top < snapMargin, atBottom = rect.bottom > docBottom - snapMargin;
	  if (rect.top < screentop) {
	    result.scrollTop = atTop ? 0 : rect.top;
	  } else if (rect.bottom > screentop + screen) {
	    var newTop = Math.min(rect.top, (atBottom ? docBottom : rect.bottom) - screen);
	    if (newTop != screentop) { result.scrollTop = newTop; }
	  }

	  var screenleft = cm.curOp && cm.curOp.scrollLeft != null ? cm.curOp.scrollLeft : display.scroller.scrollLeft;
	  var screenw = displayWidth(cm) - (cm.options.fixedGutter ? display.gutters.offsetWidth : 0);
	  var tooWide = rect.right - rect.left > screenw;
	  if (tooWide) { rect.right = rect.left + screenw; }
	  if (rect.left < 10)
	    { result.scrollLeft = 0; }
	  else if (rect.left < screenleft)
	    { result.scrollLeft = Math.max(0, rect.left - (tooWide ? 0 : 10)); }
	  else if (rect.right > screenw + screenleft - 3)
	    { result.scrollLeft = rect.right + (tooWide ? 0 : 10) - screenw; }
	  return result
	}

	// Store a relative adjustment to the scroll position in the current
	// operation (to be applied when the operation finishes).
	function addToScrollTop(cm, top) {
	  if (top == null) { return }
	  resolveScrollToPos(cm);
	  cm.curOp.scrollTop = (cm.curOp.scrollTop == null ? cm.doc.scrollTop : cm.curOp.scrollTop) + top;
	}

	// Make sure that at the end of the operation the current cursor is
	// shown.
	function ensureCursorVisible(cm) {
	  resolveScrollToPos(cm);
	  var cur = cm.getCursor();
	  cm.curOp.scrollToPos = {from: cur, to: cur, margin: cm.options.cursorScrollMargin};
	}

	function scrollToCoords(cm, x, y) {
	  if (x != null || y != null) { resolveScrollToPos(cm); }
	  if (x != null) { cm.curOp.scrollLeft = x; }
	  if (y != null) { cm.curOp.scrollTop = y; }
	}

	function scrollToRange(cm, range$$1) {
	  resolveScrollToPos(cm);
	  cm.curOp.scrollToPos = range$$1;
	}

	// When an operation has its scrollToPos property set, and another
	// scroll action is applied before the end of the operation, this
	// 'simulates' scrolling that position into view in a cheap way, so
	// that the effect of intermediate scroll commands is not ignored.
	function resolveScrollToPos(cm) {
	  var range$$1 = cm.curOp.scrollToPos;
	  if (range$$1) {
	    cm.curOp.scrollToPos = null;
	    var from = estimateCoords(cm, range$$1.from), to = estimateCoords(cm, range$$1.to);
	    scrollToCoordsRange(cm, from, to, range$$1.margin);
	  }
	}

	function scrollToCoordsRange(cm, from, to, margin) {
	  var sPos = calculateScrollPos(cm, {
	    left: Math.min(from.left, to.left),
	    top: Math.min(from.top, to.top) - margin,
	    right: Math.max(from.right, to.right),
	    bottom: Math.max(from.bottom, to.bottom) + margin
	  });
	  scrollToCoords(cm, sPos.scrollLeft, sPos.scrollTop);
	}

	// Sync the scrollable area and scrollbars, ensure the viewport
	// covers the visible area.
	function updateScrollTop(cm, val) {
	  if (Math.abs(cm.doc.scrollTop - val) < 2) { return }
	  if (!gecko) { updateDisplaySimple(cm, {top: val}); }
	  setScrollTop(cm, val, true);
	  if (gecko) { updateDisplaySimple(cm); }
	  startWorker(cm, 100);
	}

	function setScrollTop(cm, val, forceScroll) {
	  val = Math.min(cm.display.scroller.scrollHeight - cm.display.scroller.clientHeight, val);
	  if (cm.display.scroller.scrollTop == val && !forceScroll) { return }
	  cm.doc.scrollTop = val;
	  cm.display.scrollbars.setScrollTop(val);
	  if (cm.display.scroller.scrollTop != val) { cm.display.scroller.scrollTop = val; }
	}

	// Sync scroller and scrollbar, ensure the gutter elements are
	// aligned.
	function setScrollLeft(cm, val, isScroller, forceScroll) {
	  val = Math.min(val, cm.display.scroller.scrollWidth - cm.display.scroller.clientWidth);
	  if ((isScroller ? val == cm.doc.scrollLeft : Math.abs(cm.doc.scrollLeft - val) < 2) && !forceScroll) { return }
	  cm.doc.scrollLeft = val;
	  alignHorizontally(cm);
	  if (cm.display.scroller.scrollLeft != val) { cm.display.scroller.scrollLeft = val; }
	  cm.display.scrollbars.setScrollLeft(val);
	}

	// SCROLLBARS

	// Prepare DOM reads needed to update the scrollbars. Done in one
	// shot to minimize update/measure roundtrips.
	function measureForScrollbars(cm) {
	  var d = cm.display, gutterW = d.gutters.offsetWidth;
	  var docH = Math.round(cm.doc.height + paddingVert(cm.display));
	  return {
	    clientHeight: d.scroller.clientHeight,
	    viewHeight: d.wrapper.clientHeight,
	    scrollWidth: d.scroller.scrollWidth, clientWidth: d.scroller.clientWidth,
	    viewWidth: d.wrapper.clientWidth,
	    barLeft: cm.options.fixedGutter ? gutterW : 0,
	    docHeight: docH,
	    scrollHeight: docH + scrollGap(cm) + d.barHeight,
	    nativeBarWidth: d.nativeBarWidth,
	    gutterWidth: gutterW
	  }
	}

	var NativeScrollbars = function(place, scroll, cm) {
	  this.cm = cm;
	  var vert = this.vert = elt("div", [elt("div", null, null, "min-width: 1px")], "CodeMirror-vscrollbar");
	  var horiz = this.horiz = elt("div", [elt("div", null, null, "height: 100%; min-height: 1px")], "CodeMirror-hscrollbar");
	  vert.tabIndex = horiz.tabIndex = -1;
	  place(vert); place(horiz);

	  on(vert, "scroll", function () {
	    if (vert.clientHeight) { scroll(vert.scrollTop, "vertical"); }
	  });
	  on(horiz, "scroll", function () {
	    if (horiz.clientWidth) { scroll(horiz.scrollLeft, "horizontal"); }
	  });

	  this.checkedZeroWidth = false;
	  // Need to set a minimum width to see the scrollbar on IE7 (but must not set it on IE8).
	  if (ie && ie_version < 8) { this.horiz.style.minHeight = this.vert.style.minWidth = "18px"; }
	};

	NativeScrollbars.prototype.update = function (measure) {
	  var needsH = measure.scrollWidth > measure.clientWidth + 1;
	  var needsV = measure.scrollHeight > measure.clientHeight + 1;
	  var sWidth = measure.nativeBarWidth;

	  if (needsV) {
	    this.vert.style.display = "block";
	    this.vert.style.bottom = needsH ? sWidth + "px" : "0";
	    var totalHeight = measure.viewHeight - (needsH ? sWidth : 0);
	    // A bug in IE8 can cause this value to be negative, so guard it.
	    this.vert.firstChild.style.height =
	      Math.max(0, measure.scrollHeight - measure.clientHeight + totalHeight) + "px";
	  } else {
	    this.vert.style.display = "";
	    this.vert.firstChild.style.height = "0";
	  }

	  if (needsH) {
	    this.horiz.style.display = "block";
	    this.horiz.style.right = needsV ? sWidth + "px" : "0";
	    this.horiz.style.left = measure.barLeft + "px";
	    var totalWidth = measure.viewWidth - measure.barLeft - (needsV ? sWidth : 0);
	    this.horiz.firstChild.style.width =
	      Math.max(0, measure.scrollWidth - measure.clientWidth + totalWidth) + "px";
	  } else {
	    this.horiz.style.display = "";
	    this.horiz.firstChild.style.width = "0";
	  }

	  if (!this.checkedZeroWidth && measure.clientHeight > 0) {
	    if (sWidth == 0) { this.zeroWidthHack(); }
	    this.checkedZeroWidth = true;
	  }

	  return {right: needsV ? sWidth : 0, bottom: needsH ? sWidth : 0}
	};

	NativeScrollbars.prototype.setScrollLeft = function (pos) {
	  if (this.horiz.scrollLeft != pos) { this.horiz.scrollLeft = pos; }
	  if (this.disableHoriz) { this.enableZeroWidthBar(this.horiz, this.disableHoriz, "horiz"); }
	};

	NativeScrollbars.prototype.setScrollTop = function (pos) {
	  if (this.vert.scrollTop != pos) { this.vert.scrollTop = pos; }
	  if (this.disableVert) { this.enableZeroWidthBar(this.vert, this.disableVert, "vert"); }
	};

	NativeScrollbars.prototype.zeroWidthHack = function () {
	  var w = mac && !mac_geMountainLion ? "12px" : "18px";
	  this.horiz.style.height = this.vert.style.width = w;
	  this.horiz.style.pointerEvents = this.vert.style.pointerEvents = "none";
	  this.disableHoriz = new Delayed;
	  this.disableVert = new Delayed;
	};

	NativeScrollbars.prototype.enableZeroWidthBar = function (bar, delay, type) {
	  bar.style.pointerEvents = "auto";
	  function maybeDisable() {
	    // To find out whether the scrollbar is still visible, we
	    // check whether the element under the pixel in the bottom
	    // right corner of the scrollbar box is the scrollbar box
	    // itself (when the bar is still visible) or its filler child
	    // (when the bar is hidden). If it is still visible, we keep
	    // it enabled, if it's hidden, we disable pointer events.
	    var box = bar.getBoundingClientRect();
	    var elt$$1 = type == "vert" ? document.elementFromPoint(box.right - 1, (box.top + box.bottom) / 2)
	        : document.elementFromPoint((box.right + box.left) / 2, box.bottom - 1);
	    if (elt$$1 != bar) { bar.style.pointerEvents = "none"; }
	    else { delay.set(1000, maybeDisable); }
	  }
	  delay.set(1000, maybeDisable);
	};

	NativeScrollbars.prototype.clear = function () {
	  var parent = this.horiz.parentNode;
	  parent.removeChild(this.horiz);
	  parent.removeChild(this.vert);
	};

	var NullScrollbars = function () {};

	NullScrollbars.prototype.update = function () { return {bottom: 0, right: 0} };
	NullScrollbars.prototype.setScrollLeft = function () {};
	NullScrollbars.prototype.setScrollTop = function () {};
	NullScrollbars.prototype.clear = function () {};

	function updateScrollbars(cm, measure) {
	  if (!measure) { measure = measureForScrollbars(cm); }
	  var startWidth = cm.display.barWidth, startHeight = cm.display.barHeight;
	  updateScrollbarsInner(cm, measure);
	  for (var i = 0; i < 4 && startWidth != cm.display.barWidth || startHeight != cm.display.barHeight; i++) {
	    if (startWidth != cm.display.barWidth && cm.options.lineWrapping)
	      { updateHeightsInViewport(cm); }
	    updateScrollbarsInner(cm, measureForScrollbars(cm));
	    startWidth = cm.display.barWidth; startHeight = cm.display.barHeight;
	  }
	}

	// Re-synchronize the fake scrollbars with the actual size of the
	// content.
	function updateScrollbarsInner(cm, measure) {
	  var d = cm.display;
	  var sizes = d.scrollbars.update(measure);

	  d.sizer.style.paddingRight = (d.barWidth = sizes.right) + "px";
	  d.sizer.style.paddingBottom = (d.barHeight = sizes.bottom) + "px";
	  d.heightForcer.style.borderBottom = sizes.bottom + "px solid transparent";

	  if (sizes.right && sizes.bottom) {
	    d.scrollbarFiller.style.display = "block";
	    d.scrollbarFiller.style.height = sizes.bottom + "px";
	    d.scrollbarFiller.style.width = sizes.right + "px";
	  } else { d.scrollbarFiller.style.display = ""; }
	  if (sizes.bottom && cm.options.coverGutterNextToScrollbar && cm.options.fixedGutter) {
	    d.gutterFiller.style.display = "block";
	    d.gutterFiller.style.height = sizes.bottom + "px";
	    d.gutterFiller.style.width = measure.gutterWidth + "px";
	  } else { d.gutterFiller.style.display = ""; }
	}

	var scrollbarModel = {"native": NativeScrollbars, "null": NullScrollbars};

	function initScrollbars(cm) {
	  if (cm.display.scrollbars) {
	    cm.display.scrollbars.clear();
	    if (cm.display.scrollbars.addClass)
	      { rmClass(cm.display.wrapper, cm.display.scrollbars.addClass); }
	  }

	  cm.display.scrollbars = new scrollbarModel[cm.options.scrollbarStyle](function (node) {
	    cm.display.wrapper.insertBefore(node, cm.display.scrollbarFiller);
	    // Prevent clicks in the scrollbars from killing focus
	    on(node, "mousedown", function () {
	      if (cm.state.focused) { setTimeout(function () { return cm.display.input.focus(); }, 0); }
	    });
	    node.setAttribute("cm-not-content", "true");
	  }, function (pos, axis) {
	    if (axis == "horizontal") { setScrollLeft(cm, pos); }
	    else { updateScrollTop(cm, pos); }
	  }, cm);
	  if (cm.display.scrollbars.addClass)
	    { addClass(cm.display.wrapper, cm.display.scrollbars.addClass); }
	}

	// Operations are used to wrap a series of changes to the editor
	// state in such a way that each change won't have to update the
	// cursor and display (which would be awkward, slow, and
	// error-prone). Instead, display updates are batched and then all
	// combined and executed at once.

	var nextOpId = 0;
	// Start a new operation.
	function startOperation(cm) {
	  cm.curOp = {
	    cm: cm,
	    viewChanged: false,      // Flag that indicates that lines might need to be redrawn
	    startHeight: cm.doc.height, // Used to detect need to update scrollbar
	    forceUpdate: false,      // Used to force a redraw
	    updateInput: null,       // Whether to reset the input textarea
	    typing: false,           // Whether this reset should be careful to leave existing text (for compositing)
	    changeObjs: null,        // Accumulated changes, for firing change events
	    cursorActivityHandlers: null, // Set of handlers to fire cursorActivity on
	    cursorActivityCalled: 0, // Tracks which cursorActivity handlers have been called already
	    selectionChanged: false, // Whether the selection needs to be redrawn
	    updateMaxLine: false,    // Set when the widest line needs to be determined anew
	    scrollLeft: null, scrollTop: null, // Intermediate scroll position, not pushed to DOM yet
	    scrollToPos: null,       // Used to scroll to a specific position
	    focus: false,
	    id: ++nextOpId           // Unique ID
	  };
	  pushOperation(cm.curOp);
	}

	// Finish an operation, updating the display and signalling delayed events
	function endOperation(cm) {
	  var op = cm.curOp;
	  finishOperation(op, function (group) {
	    for (var i = 0; i < group.ops.length; i++)
	      { group.ops[i].cm.curOp = null; }
	    endOperations(group);
	  });
	}

	// The DOM updates done when an operation finishes are batched so
	// that the minimum number of relayouts are required.
	function endOperations(group) {
	  var ops = group.ops;
	  for (var i = 0; i < ops.length; i++) // Read DOM
	    { endOperation_R1(ops[i]); }
	  for (var i$1 = 0; i$1 < ops.length; i$1++) // Write DOM (maybe)
	    { endOperation_W1(ops[i$1]); }
	  for (var i$2 = 0; i$2 < ops.length; i$2++) // Read DOM
	    { endOperation_R2(ops[i$2]); }
	  for (var i$3 = 0; i$3 < ops.length; i$3++) // Write DOM (maybe)
	    { endOperation_W2(ops[i$3]); }
	  for (var i$4 = 0; i$4 < ops.length; i$4++) // Read DOM
	    { endOperation_finish(ops[i$4]); }
	}

	function endOperation_R1(op) {
	  var cm = op.cm, display = cm.display;
	  maybeClipScrollbars(cm);
	  if (op.updateMaxLine) { findMaxLine(cm); }

	  op.mustUpdate = op.viewChanged || op.forceUpdate || op.scrollTop != null ||
	    op.scrollToPos && (op.scrollToPos.from.line < display.viewFrom ||
	                       op.scrollToPos.to.line >= display.viewTo) ||
	    display.maxLineChanged && cm.options.lineWrapping;
	  op.update = op.mustUpdate &&
	    new DisplayUpdate(cm, op.mustUpdate && {top: op.scrollTop, ensure: op.scrollToPos}, op.forceUpdate);
	}

	function endOperation_W1(op) {
	  op.updatedDisplay = op.mustUpdate && updateDisplayIfNeeded(op.cm, op.update);
	}

	function endOperation_R2(op) {
	  var cm = op.cm, display = cm.display;
	  if (op.updatedDisplay) { updateHeightsInViewport(cm); }

	  op.barMeasure = measureForScrollbars(cm);

	  // If the max line changed since it was last measured, measure it,
	  // and ensure the document's width matches it.
	  // updateDisplay_W2 will use these properties to do the actual resizing
	  if (display.maxLineChanged && !cm.options.lineWrapping) {
	    op.adjustWidthTo = measureChar(cm, display.maxLine, display.maxLine.text.length).left + 3;
	    cm.display.sizerWidth = op.adjustWidthTo;
	    op.barMeasure.scrollWidth =
	      Math.max(display.scroller.clientWidth, display.sizer.offsetLeft + op.adjustWidthTo + scrollGap(cm) + cm.display.barWidth);
	    op.maxScrollLeft = Math.max(0, display.sizer.offsetLeft + op.adjustWidthTo - displayWidth(cm));
	  }

	  if (op.updatedDisplay || op.selectionChanged)
	    { op.preparedSelection = display.input.prepareSelection(); }
	}

	function endOperation_W2(op) {
	  var cm = op.cm;

	  if (op.adjustWidthTo != null) {
	    cm.display.sizer.style.minWidth = op.adjustWidthTo + "px";
	    if (op.maxScrollLeft < cm.doc.scrollLeft)
	      { setScrollLeft(cm, Math.min(cm.display.scroller.scrollLeft, op.maxScrollLeft), true); }
	    cm.display.maxLineChanged = false;
	  }

	  var takeFocus = op.focus && op.focus == activeElt();
	  if (op.preparedSelection)
	    { cm.display.input.showSelection(op.preparedSelection, takeFocus); }
	  if (op.updatedDisplay || op.startHeight != cm.doc.height)
	    { updateScrollbars(cm, op.barMeasure); }
	  if (op.updatedDisplay)
	    { setDocumentHeight(cm, op.barMeasure); }

	  if (op.selectionChanged) { restartBlink(cm); }

	  if (cm.state.focused && op.updateInput)
	    { cm.display.input.reset(op.typing); }
	  if (takeFocus) { ensureFocus(op.cm); }
	}

	function endOperation_finish(op) {
	  var cm = op.cm, display = cm.display, doc = cm.doc;

	  if (op.updatedDisplay) { postUpdateDisplay(cm, op.update); }

	  // Abort mouse wheel delta measurement, when scrolling explicitly
	  if (display.wheelStartX != null && (op.scrollTop != null || op.scrollLeft != null || op.scrollToPos))
	    { display.wheelStartX = display.wheelStartY = null; }

	  // Propagate the scroll position to the actual DOM scroller
	  if (op.scrollTop != null) { setScrollTop(cm, op.scrollTop, op.forceScroll); }

	  if (op.scrollLeft != null) { setScrollLeft(cm, op.scrollLeft, true, true); }
	  // If we need to scroll a specific position into view, do so.
	  if (op.scrollToPos) {
	    var rect = scrollPosIntoView(cm, clipPos(doc, op.scrollToPos.from),
	                                 clipPos(doc, op.scrollToPos.to), op.scrollToPos.margin);
	    maybeScrollWindow(cm, rect);
	  }

	  // Fire events for markers that are hidden/unidden by editing or
	  // undoing
	  var hidden = op.maybeHiddenMarkers, unhidden = op.maybeUnhiddenMarkers;
	  if (hidden) { for (var i = 0; i < hidden.length; ++i)
	    { if (!hidden[i].lines.length) { signal(hidden[i], "hide"); } } }
	  if (unhidden) { for (var i$1 = 0; i$1 < unhidden.length; ++i$1)
	    { if (unhidden[i$1].lines.length) { signal(unhidden[i$1], "unhide"); } } }

	  if (display.wrapper.offsetHeight)
	    { doc.scrollTop = cm.display.scroller.scrollTop; }

	  // Fire change events, and delayed event handlers
	  if (op.changeObjs)
	    { signal(cm, "changes", cm, op.changeObjs); }
	  if (op.update)
	    { op.update.finish(); }
	}

	// Run the given function in an operation
	function runInOp(cm, f) {
	  if (cm.curOp) { return f() }
	  startOperation(cm);
	  try { return f() }
	  finally { endOperation(cm); }
	}
	// Wraps a function in an operation. Returns the wrapped function.
	function operation(cm, f) {
	  return function() {
	    if (cm.curOp) { return f.apply(cm, arguments) }
	    startOperation(cm);
	    try { return f.apply(cm, arguments) }
	    finally { endOperation(cm); }
	  }
	}
	// Used to add methods to editor and doc instances, wrapping them in
	// operations.
	function methodOp(f) {
	  return function() {
	    if (this.curOp) { return f.apply(this, arguments) }
	    startOperation(this);
	    try { return f.apply(this, arguments) }
	    finally { endOperation(this); }
	  }
	}
	function docMethodOp(f) {
	  return function() {
	    var cm = this.cm;
	    if (!cm || cm.curOp) { return f.apply(this, arguments) }
	    startOperation(cm);
	    try { return f.apply(this, arguments) }
	    finally { endOperation(cm); }
	  }
	}

	// Updates the display.view data structure for a given change to the
	// document. From and to are in pre-change coordinates. Lendiff is
	// the amount of lines added or subtracted by the change. This is
	// used for changes that span multiple lines, or change the way
	// lines are divided into visual lines. regLineChange (below)
	// registers single-line changes.
	function regChange(cm, from, to, lendiff) {
	  if (from == null) { from = cm.doc.first; }
	  if (to == null) { to = cm.doc.first + cm.doc.size; }
	  if (!lendiff) { lendiff = 0; }

	  var display = cm.display;
	  if (lendiff && to < display.viewTo &&
	      (display.updateLineNumbers == null || display.updateLineNumbers > from))
	    { display.updateLineNumbers = from; }

	  cm.curOp.viewChanged = true;

	  if (from >= display.viewTo) { // Change after
	    if (sawCollapsedSpans && visualLineNo(cm.doc, from) < display.viewTo)
	      { resetView(cm); }
	  } else if (to <= display.viewFrom) { // Change before
	    if (sawCollapsedSpans && visualLineEndNo(cm.doc, to + lendiff) > display.viewFrom) {
	      resetView(cm);
	    } else {
	      display.viewFrom += lendiff;
	      display.viewTo += lendiff;
	    }
	  } else if (from <= display.viewFrom && to >= display.viewTo) { // Full overlap
	    resetView(cm);
	  } else if (from <= display.viewFrom) { // Top overlap
	    var cut = viewCuttingPoint(cm, to, to + lendiff, 1);
	    if (cut) {
	      display.view = display.view.slice(cut.index);
	      display.viewFrom = cut.lineN;
	      display.viewTo += lendiff;
	    } else {
	      resetView(cm);
	    }
	  } else if (to >= display.viewTo) { // Bottom overlap
	    var cut$1 = viewCuttingPoint(cm, from, from, -1);
	    if (cut$1) {
	      display.view = display.view.slice(0, cut$1.index);
	      display.viewTo = cut$1.lineN;
	    } else {
	      resetView(cm);
	    }
	  } else { // Gap in the middle
	    var cutTop = viewCuttingPoint(cm, from, from, -1);
	    var cutBot = viewCuttingPoint(cm, to, to + lendiff, 1);
	    if (cutTop && cutBot) {
	      display.view = display.view.slice(0, cutTop.index)
	        .concat(buildViewArray(cm, cutTop.lineN, cutBot.lineN))
	        .concat(display.view.slice(cutBot.index));
	      display.viewTo += lendiff;
	    } else {
	      resetView(cm);
	    }
	  }

	  var ext = display.externalMeasured;
	  if (ext) {
	    if (to < ext.lineN)
	      { ext.lineN += lendiff; }
	    else if (from < ext.lineN + ext.size)
	      { display.externalMeasured = null; }
	  }
	}

	// Register a change to a single line. Type must be one of "text",
	// "gutter", "class", "widget"
	function regLineChange(cm, line, type) {
	  cm.curOp.viewChanged = true;
	  var display = cm.display, ext = cm.display.externalMeasured;
	  if (ext && line >= ext.lineN && line < ext.lineN + ext.size)
	    { display.externalMeasured = null; }

	  if (line < display.viewFrom || line >= display.viewTo) { return }
	  var lineView = display.view[findViewIndex(cm, line)];
	  if (lineView.node == null) { return }
	  var arr = lineView.changes || (lineView.changes = []);
	  if (indexOf(arr, type) == -1) { arr.push(type); }
	}

	// Clear the view.
	function resetView(cm) {
	  cm.display.viewFrom = cm.display.viewTo = cm.doc.first;
	  cm.display.view = [];
	  cm.display.viewOffset = 0;
	}

	function viewCuttingPoint(cm, oldN, newN, dir) {
	  var index = findViewIndex(cm, oldN), diff, view = cm.display.view;
	  if (!sawCollapsedSpans || newN == cm.doc.first + cm.doc.size)
	    { return {index: index, lineN: newN} }
	  var n = cm.display.viewFrom;
	  for (var i = 0; i < index; i++)
	    { n += view[i].size; }
	  if (n != oldN) {
	    if (dir > 0) {
	      if (index == view.length - 1) { return null }
	      diff = (n + view[index].size) - oldN;
	      index++;
	    } else {
	      diff = n - oldN;
	    }
	    oldN += diff; newN += diff;
	  }
	  while (visualLineNo(cm.doc, newN) != newN) {
	    if (index == (dir < 0 ? 0 : view.length - 1)) { return null }
	    newN += dir * view[index - (dir < 0 ? 1 : 0)].size;
	    index += dir;
	  }
	  return {index: index, lineN: newN}
	}

	// Force the view to cover a given range, adding empty view element
	// or clipping off existing ones as needed.
	function adjustView(cm, from, to) {
	  var display = cm.display, view = display.view;
	  if (view.length == 0 || from >= display.viewTo || to <= display.viewFrom) {
	    display.view = buildViewArray(cm, from, to);
	    display.viewFrom = from;
	  } else {
	    if (display.viewFrom > from)
	      { display.view = buildViewArray(cm, from, display.viewFrom).concat(display.view); }
	    else if (display.viewFrom < from)
	      { display.view = display.view.slice(findViewIndex(cm, from)); }
	    display.viewFrom = from;
	    if (display.viewTo < to)
	      { display.view = display.view.concat(buildViewArray(cm, display.viewTo, to)); }
	    else if (display.viewTo > to)
	      { display.view = display.view.slice(0, findViewIndex(cm, to)); }
	  }
	  display.viewTo = to;
	}

	// Count the number of lines in the view whose DOM representation is
	// out of date (or nonexistent).
	function countDirtyView(cm) {
	  var view = cm.display.view, dirty = 0;
	  for (var i = 0; i < view.length; i++) {
	    var lineView = view[i];
	    if (!lineView.hidden && (!lineView.node || lineView.changes)) { ++dirty; }
	  }
	  return dirty
	}

	// HIGHLIGHT WORKER

	function startWorker(cm, time) {
	  if (cm.doc.highlightFrontier < cm.display.viewTo)
	    { cm.state.highlight.set(time, bind(highlightWorker, cm)); }
	}

	function highlightWorker(cm) {
	  var doc = cm.doc;
	  if (doc.highlightFrontier >= cm.display.viewTo) { return }
	  var end = +new Date + cm.options.workTime;
	  var context = getContextBefore(cm, doc.highlightFrontier);
	  var changedLines = [];

	  doc.iter(context.line, Math.min(doc.first + doc.size, cm.display.viewTo + 500), function (line) {
	    if (context.line >= cm.display.viewFrom) { // Visible
	      var oldStyles = line.styles;
	      var resetState = line.text.length > cm.options.maxHighlightLength ? copyState(doc.mode, context.state) : null;
	      var highlighted = highlightLine(cm, line, context, true);
	      if (resetState) { context.state = resetState; }
	      line.styles = highlighted.styles;
	      var oldCls = line.styleClasses, newCls = highlighted.classes;
	      if (newCls) { line.styleClasses = newCls; }
	      else if (oldCls) { line.styleClasses = null; }
	      var ischange = !oldStyles || oldStyles.length != line.styles.length ||
	        oldCls != newCls && (!oldCls || !newCls || oldCls.bgClass != newCls.bgClass || oldCls.textClass != newCls.textClass);
	      for (var i = 0; !ischange && i < oldStyles.length; ++i) { ischange = oldStyles[i] != line.styles[i]; }
	      if (ischange) { changedLines.push(context.line); }
	      line.stateAfter = context.save();
	      context.nextLine();
	    } else {
	      if (line.text.length <= cm.options.maxHighlightLength)
	        { processLine(cm, line.text, context); }
	      line.stateAfter = context.line % 5 == 0 ? context.save() : null;
	      context.nextLine();
	    }
	    if (+new Date > end) {
	      startWorker(cm, cm.options.workDelay);
	      return true
	    }
	  });
	  doc.highlightFrontier = context.line;
	  doc.modeFrontier = Math.max(doc.modeFrontier, context.line);
	  if (changedLines.length) { runInOp(cm, function () {
	    for (var i = 0; i < changedLines.length; i++)
	      { regLineChange(cm, changedLines[i], "text"); }
	  }); }
	}

	// DISPLAY DRAWING

	var DisplayUpdate = function(cm, viewport, force) {
	  var display = cm.display;

	  this.viewport = viewport;
	  // Store some values that we'll need later (but don't want to force a relayout for)
	  this.visible = visibleLines(display, cm.doc, viewport);
	  this.editorIsHidden = !display.wrapper.offsetWidth;
	  this.wrapperHeight = display.wrapper.clientHeight;
	  this.wrapperWidth = display.wrapper.clientWidth;
	  this.oldDisplayWidth = displayWidth(cm);
	  this.force = force;
	  this.dims = getDimensions(cm);
	  this.events = [];
	};

	DisplayUpdate.prototype.signal = function (emitter, type) {
	  if (hasHandler(emitter, type))
	    { this.events.push(arguments); }
	};
	DisplayUpdate.prototype.finish = function () {
	    var this$1 = this;

	  for (var i = 0; i < this.events.length; i++)
	    { signal.apply(null, this$1.events[i]); }
	};

	function maybeClipScrollbars(cm) {
	  var display = cm.display;
	  if (!display.scrollbarsClipped && display.scroller.offsetWidth) {
	    display.nativeBarWidth = display.scroller.offsetWidth - display.scroller.clientWidth;
	    display.heightForcer.style.height = scrollGap(cm) + "px";
	    display.sizer.style.marginBottom = -display.nativeBarWidth + "px";
	    display.sizer.style.borderRightWidth = scrollGap(cm) + "px";
	    display.scrollbarsClipped = true;
	  }
	}

	function selectionSnapshot(cm) {
	  if (cm.hasFocus()) { return null }
	  var active = activeElt();
	  if (!active || !contains(cm.display.lineDiv, active)) { return null }
	  var result = {activeElt: active};
	  if (window.getSelection) {
	    var sel = window.getSelection();
	    if (sel.anchorNode && sel.extend && contains(cm.display.lineDiv, sel.anchorNode)) {
	      result.anchorNode = sel.anchorNode;
	      result.anchorOffset = sel.anchorOffset;
	      result.focusNode = sel.focusNode;
	      result.focusOffset = sel.focusOffset;
	    }
	  }
	  return result
	}

	function restoreSelection(snapshot) {
	  if (!snapshot || !snapshot.activeElt || snapshot.activeElt == activeElt()) { return }
	  snapshot.activeElt.focus();
	  if (snapshot.anchorNode && contains(document.body, snapshot.anchorNode) && contains(document.body, snapshot.focusNode)) {
	    var sel = window.getSelection(), range$$1 = document.createRange();
	    range$$1.setEnd(snapshot.anchorNode, snapshot.anchorOffset);
	    range$$1.collapse(false);
	    sel.removeAllRanges();
	    sel.addRange(range$$1);
	    sel.extend(snapshot.focusNode, snapshot.focusOffset);
	  }
	}

	// Does the actual updating of the line display. Bails out
	// (returning false) when there is nothing to be done and forced is
	// false.
	function updateDisplayIfNeeded(cm, update) {
	  var display = cm.display, doc = cm.doc;

	  if (update.editorIsHidden) {
	    resetView(cm);
	    return false
	  }

	  // Bail out if the visible area is already rendered and nothing changed.
	  if (!update.force &&
	      update.visible.from >= display.viewFrom && update.visible.to <= display.viewTo &&
	      (display.updateLineNumbers == null || display.updateLineNumbers >= display.viewTo) &&
	      display.renderedView == display.view && countDirtyView(cm) == 0)
	    { return false }

	  if (maybeUpdateLineNumberWidth(cm)) {
	    resetView(cm);
	    update.dims = getDimensions(cm);
	  }

	  // Compute a suitable new viewport (from & to)
	  var end = doc.first + doc.size;
	  var from = Math.max(update.visible.from - cm.options.viewportMargin, doc.first);
	  var to = Math.min(end, update.visible.to + cm.options.viewportMargin);
	  if (display.viewFrom < from && from - display.viewFrom < 20) { from = Math.max(doc.first, display.viewFrom); }
	  if (display.viewTo > to && display.viewTo - to < 20) { to = Math.min(end, display.viewTo); }
	  if (sawCollapsedSpans) {
	    from = visualLineNo(cm.doc, from);
	    to = visualLineEndNo(cm.doc, to);
	  }

	  var different = from != display.viewFrom || to != display.viewTo ||
	    display.lastWrapHeight != update.wrapperHeight || display.lastWrapWidth != update.wrapperWidth;
	  adjustView(cm, from, to);

	  display.viewOffset = heightAtLine(getLine(cm.doc, display.viewFrom));
	  // Position the mover div to align with the current scroll position
	  cm.display.mover.style.top = display.viewOffset + "px";

	  var toUpdate = countDirtyView(cm);
	  if (!different && toUpdate == 0 && !update.force && display.renderedView == display.view &&
	      (display.updateLineNumbers == null || display.updateLineNumbers >= display.viewTo))
	    { return false }

	  // For big changes, we hide the enclosing element during the
	  // update, since that speeds up the operations on most browsers.
	  var selSnapshot = selectionSnapshot(cm);
	  if (toUpdate > 4) { display.lineDiv.style.display = "none"; }
	  patchDisplay(cm, display.updateLineNumbers, update.dims);
	  if (toUpdate > 4) { display.lineDiv.style.display = ""; }
	  display.renderedView = display.view;
	  // There might have been a widget with a focused element that got
	  // hidden or updated, if so re-focus it.
	  restoreSelection(selSnapshot);

	  // Prevent selection and cursors from interfering with the scroll
	  // width and height.
	  removeChildren(display.cursorDiv);
	  removeChildren(display.selectionDiv);
	  display.gutters.style.height = display.sizer.style.minHeight = 0;

	  if (different) {
	    display.lastWrapHeight = update.wrapperHeight;
	    display.lastWrapWidth = update.wrapperWidth;
	    startWorker(cm, 400);
	  }

	  display.updateLineNumbers = null;

	  return true
	}

	function postUpdateDisplay(cm, update) {
	  var viewport = update.viewport;

	  for (var first = true;; first = false) {
	    if (!first || !cm.options.lineWrapping || update.oldDisplayWidth == displayWidth(cm)) {
	      // Clip forced viewport to actual scrollable area.
	      if (viewport && viewport.top != null)
	        { viewport = {top: Math.min(cm.doc.height + paddingVert(cm.display) - displayHeight(cm), viewport.top)}; }
	      // Updated line heights might result in the drawn area not
	      // actually covering the viewport. Keep looping until it does.
	      update.visible = visibleLines(cm.display, cm.doc, viewport);
	      if (update.visible.from >= cm.display.viewFrom && update.visible.to <= cm.display.viewTo)
	        { break }
	    }
	    if (!updateDisplayIfNeeded(cm, update)) { break }
	    updateHeightsInViewport(cm);
	    var barMeasure = measureForScrollbars(cm);
	    updateSelection(cm);
	    updateScrollbars(cm, barMeasure);
	    setDocumentHeight(cm, barMeasure);
	    update.force = false;
	  }

	  update.signal(cm, "update", cm);
	  if (cm.display.viewFrom != cm.display.reportedViewFrom || cm.display.viewTo != cm.display.reportedViewTo) {
	    update.signal(cm, "viewportChange", cm, cm.display.viewFrom, cm.display.viewTo);
	    cm.display.reportedViewFrom = cm.display.viewFrom; cm.display.reportedViewTo = cm.display.viewTo;
	  }
	}

	function updateDisplaySimple(cm, viewport) {
	  var update = new DisplayUpdate(cm, viewport);
	  if (updateDisplayIfNeeded(cm, update)) {
	    updateHeightsInViewport(cm);
	    postUpdateDisplay(cm, update);
	    var barMeasure = measureForScrollbars(cm);
	    updateSelection(cm);
	    updateScrollbars(cm, barMeasure);
	    setDocumentHeight(cm, barMeasure);
	    update.finish();
	  }
	}

	// Sync the actual display DOM structure with display.view, removing
	// nodes for lines that are no longer in view, and creating the ones
	// that are not there yet, and updating the ones that are out of
	// date.
	function patchDisplay(cm, updateNumbersFrom, dims) {
	  var display = cm.display, lineNumbers = cm.options.lineNumbers;
	  var container = display.lineDiv, cur = container.firstChild;

	  function rm(node) {
	    var next = node.nextSibling;
	    // Works around a throw-scroll bug in OS X Webkit
	    if (webkit && mac && cm.display.currentWheelTarget == node)
	      { node.style.display = "none"; }
	    else
	      { node.parentNode.removeChild(node); }
	    return next
	  }

	  var view = display.view, lineN = display.viewFrom;
	  // Loop over the elements in the view, syncing cur (the DOM nodes
	  // in display.lineDiv) with the view as we go.
	  for (var i = 0; i < view.length; i++) {
	    var lineView = view[i];
	    if (lineView.hidden) ; else if (!lineView.node || lineView.node.parentNode != container) { // Not drawn yet
	      var node = buildLineElement(cm, lineView, lineN, dims);
	      container.insertBefore(node, cur);
	    } else { // Already drawn
	      while (cur != lineView.node) { cur = rm(cur); }
	      var updateNumber = lineNumbers && updateNumbersFrom != null &&
	        updateNumbersFrom <= lineN && lineView.lineNumber;
	      if (lineView.changes) {
	        if (indexOf(lineView.changes, "gutter") > -1) { updateNumber = false; }
	        updateLineForChanges(cm, lineView, lineN, dims);
	      }
	      if (updateNumber) {
	        removeChildren(lineView.lineNumber);
	        lineView.lineNumber.appendChild(document.createTextNode(lineNumberFor(cm.options, lineN)));
	      }
	      cur = lineView.node.nextSibling;
	    }
	    lineN += lineView.size;
	  }
	  while (cur) { cur = rm(cur); }
	}

	function updateGutterSpace(cm) {
	  var width = cm.display.gutters.offsetWidth;
	  cm.display.sizer.style.marginLeft = width + "px";
	}

	function setDocumentHeight(cm, measure) {
	  cm.display.sizer.style.minHeight = measure.docHeight + "px";
	  cm.display.heightForcer.style.top = measure.docHeight + "px";
	  cm.display.gutters.style.height = (measure.docHeight + cm.display.barHeight + scrollGap(cm)) + "px";
	}

	// Rebuild the gutter elements, ensure the margin to the left of the
	// code matches their width.
	function updateGutters(cm) {
	  var gutters = cm.display.gutters, specs = cm.options.gutters;
	  removeChildren(gutters);
	  var i = 0;
	  for (; i < specs.length; ++i) {
	    var gutterClass = specs[i];
	    var gElt = gutters.appendChild(elt("div", null, "CodeMirror-gutter " + gutterClass));
	    if (gutterClass == "CodeMirror-linenumbers") {
	      cm.display.lineGutter = gElt;
	      gElt.style.width = (cm.display.lineNumWidth || 1) + "px";
	    }
	  }
	  gutters.style.display = i ? "" : "none";
	  updateGutterSpace(cm);
	}

	// Make sure the gutters options contains the element
	// "CodeMirror-linenumbers" when the lineNumbers option is true.
	function setGuttersForLineNumbers(options) {
	  var found = indexOf(options.gutters, "CodeMirror-linenumbers");
	  if (found == -1 && options.lineNumbers) {
	    options.gutters = options.gutters.concat(["CodeMirror-linenumbers"]);
	  } else if (found > -1 && !options.lineNumbers) {
	    options.gutters = options.gutters.slice(0);
	    options.gutters.splice(found, 1);
	  }
	}

	// Since the delta values reported on mouse wheel events are
	// unstandardized between browsers and even browser versions, and
	// generally horribly unpredictable, this code starts by measuring
	// the scroll effect that the first few mouse wheel events have,
	// and, from that, detects the way it can convert deltas to pixel
	// offsets afterwards.
	//
	// The reason we want to know the amount a wheel event will scroll
	// is that it gives us a chance to update the display before the
	// actual scrolling happens, reducing flickering.

	var wheelSamples = 0;
	var wheelPixelsPerUnit = null;
	// Fill in a browser-detected starting value on browsers where we
	// know one. These don't have to be accurate -- the result of them
	// being wrong would just be a slight flicker on the first wheel
	// scroll (if it is large enough).
	if (ie) { wheelPixelsPerUnit = -.53; }
	else if (gecko) { wheelPixelsPerUnit = 15; }
	else if (chrome) { wheelPixelsPerUnit = -.7; }
	else if (safari) { wheelPixelsPerUnit = -1/3; }

	function wheelEventDelta(e) {
	  var dx = e.wheelDeltaX, dy = e.wheelDeltaY;
	  if (dx == null && e.detail && e.axis == e.HORIZONTAL_AXIS) { dx = e.detail; }
	  if (dy == null && e.detail && e.axis == e.VERTICAL_AXIS) { dy = e.detail; }
	  else if (dy == null) { dy = e.wheelDelta; }
	  return {x: dx, y: dy}
	}
	function wheelEventPixels(e) {
	  var delta = wheelEventDelta(e);
	  delta.x *= wheelPixelsPerUnit;
	  delta.y *= wheelPixelsPerUnit;
	  return delta
	}

	function onScrollWheel(cm, e) {
	  var delta = wheelEventDelta(e), dx = delta.x, dy = delta.y;

	  var display = cm.display, scroll = display.scroller;
	  // Quit if there's nothing to scroll here
	  var canScrollX = scroll.scrollWidth > scroll.clientWidth;
	  var canScrollY = scroll.scrollHeight > scroll.clientHeight;
	  if (!(dx && canScrollX || dy && canScrollY)) { return }

	  // Webkit browsers on OS X abort momentum scrolls when the target
	  // of the scroll event is removed from the scrollable element.
	  // This hack (see related code in patchDisplay) makes sure the
	  // element is kept around.
	  if (dy && mac && webkit) {
	    outer: for (var cur = e.target, view = display.view; cur != scroll; cur = cur.parentNode) {
	      for (var i = 0; i < view.length; i++) {
	        if (view[i].node == cur) {
	          cm.display.currentWheelTarget = cur;
	          break outer
	        }
	      }
	    }
	  }

	  // On some browsers, horizontal scrolling will cause redraws to
	  // happen before the gutter has been realigned, causing it to
	  // wriggle around in a most unseemly way. When we have an
	  // estimated pixels/delta value, we just handle horizontal
	  // scrolling entirely here. It'll be slightly off from native, but
	  // better than glitching out.
	  if (dx && !gecko && !presto && wheelPixelsPerUnit != null) {
	    if (dy && canScrollY)
	      { updateScrollTop(cm, Math.max(0, scroll.scrollTop + dy * wheelPixelsPerUnit)); }
	    setScrollLeft(cm, Math.max(0, scroll.scrollLeft + dx * wheelPixelsPerUnit));
	    // Only prevent default scrolling if vertical scrolling is
	    // actually possible. Otherwise, it causes vertical scroll
	    // jitter on OSX trackpads when deltaX is small and deltaY
	    // is large (issue #3579)
	    if (!dy || (dy && canScrollY))
	      { e_preventDefault(e); }
	    display.wheelStartX = null; // Abort measurement, if in progress
	    return
	  }

	  // 'Project' the visible viewport to cover the area that is being
	  // scrolled into view (if we know enough to estimate it).
	  if (dy && wheelPixelsPerUnit != null) {
	    var pixels = dy * wheelPixelsPerUnit;
	    var top = cm.doc.scrollTop, bot = top + display.wrapper.clientHeight;
	    if (pixels < 0) { top = Math.max(0, top + pixels - 50); }
	    else { bot = Math.min(cm.doc.height, bot + pixels + 50); }
	    updateDisplaySimple(cm, {top: top, bottom: bot});
	  }

	  if (wheelSamples < 20) {
	    if (display.wheelStartX == null) {
	      display.wheelStartX = scroll.scrollLeft; display.wheelStartY = scroll.scrollTop;
	      display.wheelDX = dx; display.wheelDY = dy;
	      setTimeout(function () {
	        if (display.wheelStartX == null) { return }
	        var movedX = scroll.scrollLeft - display.wheelStartX;
	        var movedY = scroll.scrollTop - display.wheelStartY;
	        var sample = (movedY && display.wheelDY && movedY / display.wheelDY) ||
	          (movedX && display.wheelDX && movedX / display.wheelDX);
	        display.wheelStartX = display.wheelStartY = null;
	        if (!sample) { return }
	        wheelPixelsPerUnit = (wheelPixelsPerUnit * wheelSamples + sample) / (wheelSamples + 1);
	        ++wheelSamples;
	      }, 200);
	    } else {
	      display.wheelDX += dx; display.wheelDY += dy;
	    }
	  }
	}

	// Selection objects are immutable. A new one is created every time
	// the selection changes. A selection is one or more non-overlapping
	// (and non-touching) ranges, sorted, and an integer that indicates
	// which one is the primary selection (the one that's scrolled into
	// view, that getCursor returns, etc).
	var Selection = function(ranges, primIndex) {
	  this.ranges = ranges;
	  this.primIndex = primIndex;
	};

	Selection.prototype.primary = function () { return this.ranges[this.primIndex] };

	Selection.prototype.equals = function (other) {
	    var this$1 = this;

	  if (other == this) { return true }
	  if (other.primIndex != this.primIndex || other.ranges.length != this.ranges.length) { return false }
	  for (var i = 0; i < this.ranges.length; i++) {
	    var here = this$1.ranges[i], there = other.ranges[i];
	    if (!equalCursorPos(here.anchor, there.anchor) || !equalCursorPos(here.head, there.head)) { return false }
	  }
	  return true
	};

	Selection.prototype.deepCopy = function () {
	    var this$1 = this;

	  var out = [];
	  for (var i = 0; i < this.ranges.length; i++)
	    { out[i] = new Range(copyPos(this$1.ranges[i].anchor), copyPos(this$1.ranges[i].head)); }
	  return new Selection(out, this.primIndex)
	};

	Selection.prototype.somethingSelected = function () {
	    var this$1 = this;

	  for (var i = 0; i < this.ranges.length; i++)
	    { if (!this$1.ranges[i].empty()) { return true } }
	  return false
	};

	Selection.prototype.contains = function (pos, end) {
	    var this$1 = this;

	  if (!end) { end = pos; }
	  for (var i = 0; i < this.ranges.length; i++) {
	    var range = this$1.ranges[i];
	    if (cmp(end, range.from()) >= 0 && cmp(pos, range.to()) <= 0)
	      { return i }
	  }
	  return -1
	};

	var Range = function(anchor, head) {
	  this.anchor = anchor; this.head = head;
	};

	Range.prototype.from = function () { return minPos(this.anchor, this.head) };
	Range.prototype.to = function () { return maxPos(this.anchor, this.head) };
	Range.prototype.empty = function () { return this.head.line == this.anchor.line && this.head.ch == this.anchor.ch };

	// Take an unsorted, potentially overlapping set of ranges, and
	// build a selection out of it. 'Consumes' ranges array (modifying
	// it).
	function normalizeSelection(ranges, primIndex) {
	  var prim = ranges[primIndex];
	  ranges.sort(function (a, b) { return cmp(a.from(), b.from()); });
	  primIndex = indexOf(ranges, prim);
	  for (var i = 1; i < ranges.length; i++) {
	    var cur = ranges[i], prev = ranges[i - 1];
	    if (cmp(prev.to(), cur.from()) >= 0) {
	      var from = minPos(prev.from(), cur.from()), to = maxPos(prev.to(), cur.to());
	      var inv = prev.empty() ? cur.from() == cur.head : prev.from() == prev.head;
	      if (i <= primIndex) { --primIndex; }
	      ranges.splice(--i, 2, new Range(inv ? to : from, inv ? from : to));
	    }
	  }
	  return new Selection(ranges, primIndex)
	}

	function simpleSelection(anchor, head) {
	  return new Selection([new Range(anchor, head || anchor)], 0)
	}

	// Compute the position of the end of a change (its 'to' property
	// refers to the pre-change end).
	function changeEnd(change) {
	  if (!change.text) { return change.to }
	  return Pos(change.from.line + change.text.length - 1,
	             lst(change.text).length + (change.text.length == 1 ? change.from.ch : 0))
	}

	// Adjust a position to refer to the post-change position of the
	// same text, or the end of the change if the change covers it.
	function adjustForChange(pos, change) {
	  if (cmp(pos, change.from) < 0) { return pos }
	  if (cmp(pos, change.to) <= 0) { return changeEnd(change) }

	  var line = pos.line + change.text.length - (change.to.line - change.from.line) - 1, ch = pos.ch;
	  if (pos.line == change.to.line) { ch += changeEnd(change).ch - change.to.ch; }
	  return Pos(line, ch)
	}

	function computeSelAfterChange(doc, change) {
	  var out = [];
	  for (var i = 0; i < doc.sel.ranges.length; i++) {
	    var range = doc.sel.ranges[i];
	    out.push(new Range(adjustForChange(range.anchor, change),
	                       adjustForChange(range.head, change)));
	  }
	  return normalizeSelection(out, doc.sel.primIndex)
	}

	function offsetPos(pos, old, nw) {
	  if (pos.line == old.line)
	    { return Pos(nw.line, pos.ch - old.ch + nw.ch) }
	  else
	    { return Pos(nw.line + (pos.line - old.line), pos.ch) }
	}

	// Used by replaceSelections to allow moving the selection to the
	// start or around the replaced test. Hint may be "start" or "around".
	function computeReplacedSel(doc, changes, hint) {
	  var out = [];
	  var oldPrev = Pos(doc.first, 0), newPrev = oldPrev;
	  for (var i = 0; i < changes.length; i++) {
	    var change = changes[i];
	    var from = offsetPos(change.from, oldPrev, newPrev);
	    var to = offsetPos(changeEnd(change), oldPrev, newPrev);
	    oldPrev = change.to;
	    newPrev = to;
	    if (hint == "around") {
	      var range = doc.sel.ranges[i], inv = cmp(range.head, range.anchor) < 0;
	      out[i] = new Range(inv ? to : from, inv ? from : to);
	    } else {
	      out[i] = new Range(from, from);
	    }
	  }
	  return new Selection(out, doc.sel.primIndex)
	}

	// Used to get the editor into a consistent state again when options change.

	function loadMode(cm) {
	  cm.doc.mode = getMode(cm.options, cm.doc.modeOption);
	  resetModeState(cm);
	}

	function resetModeState(cm) {
	  cm.doc.iter(function (line) {
	    if (line.stateAfter) { line.stateAfter = null; }
	    if (line.styles) { line.styles = null; }
	  });
	  cm.doc.modeFrontier = cm.doc.highlightFrontier = cm.doc.first;
	  startWorker(cm, 100);
	  cm.state.modeGen++;
	  if (cm.curOp) { regChange(cm); }
	}

	// DOCUMENT DATA STRUCTURE

	// By default, updates that start and end at the beginning of a line
	// are treated specially, in order to make the association of line
	// widgets and marker elements with the text behave more intuitive.
	function isWholeLineUpdate(doc, change) {
	  return change.from.ch == 0 && change.to.ch == 0 && lst(change.text) == "" &&
	    (!doc.cm || doc.cm.options.wholeLineUpdateBefore)
	}

	// Perform a change on the document data structure.
	function updateDoc(doc, change, markedSpans, estimateHeight$$1) {
	  function spansFor(n) {return markedSpans ? markedSpans[n] : null}
	  function update(line, text, spans) {
	    updateLine(line, text, spans, estimateHeight$$1);
	    signalLater(line, "change", line, change);
	  }
	  function linesFor(start, end) {
	    var result = [];
	    for (var i = start; i < end; ++i)
	      { result.push(new Line(text[i], spansFor(i), estimateHeight$$1)); }
	    return result
	  }

	  var from = change.from, to = change.to, text = change.text;
	  var firstLine = getLine(doc, from.line), lastLine = getLine(doc, to.line);
	  var lastText = lst(text), lastSpans = spansFor(text.length - 1), nlines = to.line - from.line;

	  // Adjust the line structure
	  if (change.full) {
	    doc.insert(0, linesFor(0, text.length));
	    doc.remove(text.length, doc.size - text.length);
	  } else if (isWholeLineUpdate(doc, change)) {
	    // This is a whole-line replace. Treated specially to make
	    // sure line objects move the way they are supposed to.
	    var added = linesFor(0, text.length - 1);
	    update(lastLine, lastLine.text, lastSpans);
	    if (nlines) { doc.remove(from.line, nlines); }
	    if (added.length) { doc.insert(from.line, added); }
	  } else if (firstLine == lastLine) {
	    if (text.length == 1) {
	      update(firstLine, firstLine.text.slice(0, from.ch) + lastText + firstLine.text.slice(to.ch), lastSpans);
	    } else {
	      var added$1 = linesFor(1, text.length - 1);
	      added$1.push(new Line(lastText + firstLine.text.slice(to.ch), lastSpans, estimateHeight$$1));
	      update(firstLine, firstLine.text.slice(0, from.ch) + text[0], spansFor(0));
	      doc.insert(from.line + 1, added$1);
	    }
	  } else if (text.length == 1) {
	    update(firstLine, firstLine.text.slice(0, from.ch) + text[0] + lastLine.text.slice(to.ch), spansFor(0));
	    doc.remove(from.line + 1, nlines);
	  } else {
	    update(firstLine, firstLine.text.slice(0, from.ch) + text[0], spansFor(0));
	    update(lastLine, lastText + lastLine.text.slice(to.ch), lastSpans);
	    var added$2 = linesFor(1, text.length - 1);
	    if (nlines > 1) { doc.remove(from.line + 1, nlines - 1); }
	    doc.insert(from.line + 1, added$2);
	  }

	  signalLater(doc, "change", doc, change);
	}

	// Call f for all linked documents.
	function linkedDocs(doc, f, sharedHistOnly) {
	  function propagate(doc, skip, sharedHist) {
	    if (doc.linked) { for (var i = 0; i < doc.linked.length; ++i) {
	      var rel = doc.linked[i];
	      if (rel.doc == skip) { continue }
	      var shared = sharedHist && rel.sharedHist;
	      if (sharedHistOnly && !shared) { continue }
	      f(rel.doc, shared);
	      propagate(rel.doc, doc, shared);
	    } }
	  }
	  propagate(doc, null, true);
	}

	// Attach a document to an editor.
	function attachDoc(cm, doc) {
	  if (doc.cm) { throw new Error("This document is already in use.") }
	  cm.doc = doc;
	  doc.cm = cm;
	  estimateLineHeights(cm);
	  loadMode(cm);
	  setDirectionClass(cm);
	  if (!cm.options.lineWrapping) { findMaxLine(cm); }
	  cm.options.mode = doc.modeOption;
	  regChange(cm);
	}

	function setDirectionClass(cm) {
	  (cm.doc.direction == "rtl" ? addClass : rmClass)(cm.display.lineDiv, "CodeMirror-rtl");
	}

	function directionChanged(cm) {
	  runInOp(cm, function () {
	    setDirectionClass(cm);
	    regChange(cm);
	  });
	}

	function History(startGen) {
	  // Arrays of change events and selections. Doing something adds an
	  // event to done and clears undo. Undoing moves events from done
	  // to undone, redoing moves them in the other direction.
	  this.done = []; this.undone = [];
	  this.undoDepth = Infinity;
	  // Used to track when changes can be merged into a single undo
	  // event
	  this.lastModTime = this.lastSelTime = 0;
	  this.lastOp = this.lastSelOp = null;
	  this.lastOrigin = this.lastSelOrigin = null;
	  // Used by the isClean() method
	  this.generation = this.maxGeneration = startGen || 1;
	}

	// Create a history change event from an updateDoc-style change
	// object.
	function historyChangeFromChange(doc, change) {
	  var histChange = {from: copyPos(change.from), to: changeEnd(change), text: getBetween(doc, change.from, change.to)};
	  attachLocalSpans(doc, histChange, change.from.line, change.to.line + 1);
	  linkedDocs(doc, function (doc) { return attachLocalSpans(doc, histChange, change.from.line, change.to.line + 1); }, true);
	  return histChange
	}

	// Pop all selection events off the end of a history array. Stop at
	// a change event.
	function clearSelectionEvents(array) {
	  while (array.length) {
	    var last = lst(array);
	    if (last.ranges) { array.pop(); }
	    else { break }
	  }
	}

	// Find the top change event in the history. Pop off selection
	// events that are in the way.
	function lastChangeEvent(hist, force) {
	  if (force) {
	    clearSelectionEvents(hist.done);
	    return lst(hist.done)
	  } else if (hist.done.length && !lst(hist.done).ranges) {
	    return lst(hist.done)
	  } else if (hist.done.length > 1 && !hist.done[hist.done.length - 2].ranges) {
	    hist.done.pop();
	    return lst(hist.done)
	  }
	}

	// Register a change in the history. Merges changes that are within
	// a single operation, or are close together with an origin that
	// allows merging (starting with "+") into a single event.
	function addChangeToHistory(doc, change, selAfter, opId) {
	  var hist = doc.history;
	  hist.undone.length = 0;
	  var time = +new Date, cur;
	  var last;

	  if ((hist.lastOp == opId ||
	       hist.lastOrigin == change.origin && change.origin &&
	       ((change.origin.charAt(0) == "+" && hist.lastModTime > time - (doc.cm ? doc.cm.options.historyEventDelay : 500)) ||
	        change.origin.charAt(0) == "*")) &&
	      (cur = lastChangeEvent(hist, hist.lastOp == opId))) {
	    // Merge this change into the last event
	    last = lst(cur.changes);
	    if (cmp(change.from, change.to) == 0 && cmp(change.from, last.to) == 0) {
	      // Optimized case for simple insertion -- don't want to add
	      // new changesets for every character typed
	      last.to = changeEnd(change);
	    } else {
	      // Add new sub-event
	      cur.changes.push(historyChangeFromChange(doc, change));
	    }
	  } else {
	    // Can not be merged, start a new event.
	    var before = lst(hist.done);
	    if (!before || !before.ranges)
	      { pushSelectionToHistory(doc.sel, hist.done); }
	    cur = {changes: [historyChangeFromChange(doc, change)],
	           generation: hist.generation};
	    hist.done.push(cur);
	    while (hist.done.length > hist.undoDepth) {
	      hist.done.shift();
	      if (!hist.done[0].ranges) { hist.done.shift(); }
	    }
	  }
	  hist.done.push(selAfter);
	  hist.generation = ++hist.maxGeneration;
	  hist.lastModTime = hist.lastSelTime = time;
	  hist.lastOp = hist.lastSelOp = opId;
	  hist.lastOrigin = hist.lastSelOrigin = change.origin;

	  if (!last) { signal(doc, "historyAdded"); }
	}

	function selectionEventCanBeMerged(doc, origin, prev, sel) {
	  var ch = origin.charAt(0);
	  return ch == "*" ||
	    ch == "+" &&
	    prev.ranges.length == sel.ranges.length &&
	    prev.somethingSelected() == sel.somethingSelected() &&
	    new Date - doc.history.lastSelTime <= (doc.cm ? doc.cm.options.historyEventDelay : 500)
	}

	// Called whenever the selection changes, sets the new selection as
	// the pending selection in the history, and pushes the old pending
	// selection into the 'done' array when it was significantly
	// different (in number of selected ranges, emptiness, or time).
	function addSelectionToHistory(doc, sel, opId, options) {
	  var hist = doc.history, origin = options && options.origin;

	  // A new event is started when the previous origin does not match
	  // the current, or the origins don't allow matching. Origins
	  // starting with * are always merged, those starting with + are
	  // merged when similar and close together in time.
	  if (opId == hist.lastSelOp ||
	      (origin && hist.lastSelOrigin == origin &&
	       (hist.lastModTime == hist.lastSelTime && hist.lastOrigin == origin ||
	        selectionEventCanBeMerged(doc, origin, lst(hist.done), sel))))
	    { hist.done[hist.done.length - 1] = sel; }
	  else
	    { pushSelectionToHistory(sel, hist.done); }

	  hist.lastSelTime = +new Date;
	  hist.lastSelOrigin = origin;
	  hist.lastSelOp = opId;
	  if (options && options.clearRedo !== false)
	    { clearSelectionEvents(hist.undone); }
	}

	function pushSelectionToHistory(sel, dest) {
	  var top = lst(dest);
	  if (!(top && top.ranges && top.equals(sel)))
	    { dest.push(sel); }
	}

	// Used to store marked span information in the history.
	function attachLocalSpans(doc, change, from, to) {
	  var existing = change["spans_" + doc.id], n = 0;
	  doc.iter(Math.max(doc.first, from), Math.min(doc.first + doc.size, to), function (line) {
	    if (line.markedSpans)
	      { (existing || (existing = change["spans_" + doc.id] = {}))[n] = line.markedSpans; }
	    ++n;
	  });
	}

	// When un/re-doing restores text containing marked spans, those
	// that have been explicitly cleared should not be restored.
	function removeClearedSpans(spans) {
	  if (!spans) { return null }
	  var out;
	  for (var i = 0; i < spans.length; ++i) {
	    if (spans[i].marker.explicitlyCleared) { if (!out) { out = spans.slice(0, i); } }
	    else if (out) { out.push(spans[i]); }
	  }
	  return !out ? spans : out.length ? out : null
	}

	// Retrieve and filter the old marked spans stored in a change event.
	function getOldSpans(doc, change) {
	  var found = change["spans_" + doc.id];
	  if (!found) { return null }
	  var nw = [];
	  for (var i = 0; i < change.text.length; ++i)
	    { nw.push(removeClearedSpans(found[i])); }
	  return nw
	}

	// Used for un/re-doing changes from the history. Combines the
	// result of computing the existing spans with the set of spans that
	// existed in the history (so that deleting around a span and then
	// undoing brings back the span).
	function mergeOldSpans(doc, change) {
	  var old = getOldSpans(doc, change);
	  var stretched = stretchSpansOverChange(doc, change);
	  if (!old) { return stretched }
	  if (!stretched) { return old }

	  for (var i = 0; i < old.length; ++i) {
	    var oldCur = old[i], stretchCur = stretched[i];
	    if (oldCur && stretchCur) {
	      spans: for (var j = 0; j < stretchCur.length; ++j) {
	        var span = stretchCur[j];
	        for (var k = 0; k < oldCur.length; ++k)
	          { if (oldCur[k].marker == span.marker) { continue spans } }
	        oldCur.push(span);
	      }
	    } else if (stretchCur) {
	      old[i] = stretchCur;
	    }
	  }
	  return old
	}

	// Used both to provide a JSON-safe object in .getHistory, and, when
	// detaching a document, to split the history in two
	function copyHistoryArray(events, newGroup, instantiateSel) {
	  var copy = [];
	  for (var i = 0; i < events.length; ++i) {
	    var event = events[i];
	    if (event.ranges) {
	      copy.push(instantiateSel ? Selection.prototype.deepCopy.call(event) : event);
	      continue
	    }
	    var changes = event.changes, newChanges = [];
	    copy.push({changes: newChanges});
	    for (var j = 0; j < changes.length; ++j) {
	      var change = changes[j], m = (void 0);
	      newChanges.push({from: change.from, to: change.to, text: change.text});
	      if (newGroup) { for (var prop in change) { if (m = prop.match(/^spans_(\d+)$/)) {
	        if (indexOf(newGroup, Number(m[1])) > -1) {
	          lst(newChanges)[prop] = change[prop];
	          delete change[prop];
	        }
	      } } }
	    }
	  }
	  return copy
	}

	// The 'scroll' parameter given to many of these indicated whether
	// the new cursor position should be scrolled into view after
	// modifying the selection.

	// If shift is held or the extend flag is set, extends a range to
	// include a given position (and optionally a second position).
	// Otherwise, simply returns the range between the given positions.
	// Used for cursor motion and such.
	function extendRange(range, head, other, extend) {
	  if (extend) {
	    var anchor = range.anchor;
	    if (other) {
	      var posBefore = cmp(head, anchor) < 0;
	      if (posBefore != (cmp(other, anchor) < 0)) {
	        anchor = head;
	        head = other;
	      } else if (posBefore != (cmp(head, other) < 0)) {
	        head = other;
	      }
	    }
	    return new Range(anchor, head)
	  } else {
	    return new Range(other || head, head)
	  }
	}

	// Extend the primary selection range, discard the rest.
	function extendSelection(doc, head, other, options, extend) {
	  if (extend == null) { extend = doc.cm && (doc.cm.display.shift || doc.extend); }
	  setSelection(doc, new Selection([extendRange(doc.sel.primary(), head, other, extend)], 0), options);
	}

	// Extend all selections (pos is an array of selections with length
	// equal the number of selections)
	function extendSelections(doc, heads, options) {
	  var out = [];
	  var extend = doc.cm && (doc.cm.display.shift || doc.extend);
	  for (var i = 0; i < doc.sel.ranges.length; i++)
	    { out[i] = extendRange(doc.sel.ranges[i], heads[i], null, extend); }
	  var newSel = normalizeSelection(out, doc.sel.primIndex);
	  setSelection(doc, newSel, options);
	}

	// Updates a single range in the selection.
	function replaceOneSelection(doc, i, range, options) {
	  var ranges = doc.sel.ranges.slice(0);
	  ranges[i] = range;
	  setSelection(doc, normalizeSelection(ranges, doc.sel.primIndex), options);
	}

	// Reset the selection to a single range.
	function setSimpleSelection(doc, anchor, head, options) {
	  setSelection(doc, simpleSelection(anchor, head), options);
	}

	// Give beforeSelectionChange handlers a change to influence a
	// selection update.
	function filterSelectionChange(doc, sel, options) {
	  var obj = {
	    ranges: sel.ranges,
	    update: function(ranges) {
	      var this$1 = this;

	      this.ranges = [];
	      for (var i = 0; i < ranges.length; i++)
	        { this$1.ranges[i] = new Range(clipPos(doc, ranges[i].anchor),
	                                   clipPos(doc, ranges[i].head)); }
	    },
	    origin: options && options.origin
	  };
	  signal(doc, "beforeSelectionChange", doc, obj);
	  if (doc.cm) { signal(doc.cm, "beforeSelectionChange", doc.cm, obj); }
	  if (obj.ranges != sel.ranges) { return normalizeSelection(obj.ranges, obj.ranges.length - 1) }
	  else { return sel }
	}

	function setSelectionReplaceHistory(doc, sel, options) {
	  var done = doc.history.done, last = lst(done);
	  if (last && last.ranges) {
	    done[done.length - 1] = sel;
	    setSelectionNoUndo(doc, sel, options);
	  } else {
	    setSelection(doc, sel, options);
	  }
	}

	// Set a new selection.
	function setSelection(doc, sel, options) {
	  setSelectionNoUndo(doc, sel, options);
	  addSelectionToHistory(doc, doc.sel, doc.cm ? doc.cm.curOp.id : NaN, options);
	}

	function setSelectionNoUndo(doc, sel, options) {
	  if (hasHandler(doc, "beforeSelectionChange") || doc.cm && hasHandler(doc.cm, "beforeSelectionChange"))
	    { sel = filterSelectionChange(doc, sel, options); }

	  var bias = options && options.bias ||
	    (cmp(sel.primary().head, doc.sel.primary().head) < 0 ? -1 : 1);
	  setSelectionInner(doc, skipAtomicInSelection(doc, sel, bias, true));

	  if (!(options && options.scroll === false) && doc.cm)
	    { ensureCursorVisible(doc.cm); }
	}

	function setSelectionInner(doc, sel) {
	  if (sel.equals(doc.sel)) { return }

	  doc.sel = sel;

	  if (doc.cm) {
	    doc.cm.curOp.updateInput = doc.cm.curOp.selectionChanged = true;
	    signalCursorActivity(doc.cm);
	  }
	  signalLater(doc, "cursorActivity", doc);
	}

	// Verify that the selection does not partially select any atomic
	// marked ranges.
	function reCheckSelection(doc) {
	  setSelectionInner(doc, skipAtomicInSelection(doc, doc.sel, null, false));
	}

	// Return a selection that does not partially select any atomic
	// ranges.
	function skipAtomicInSelection(doc, sel, bias, mayClear) {
	  var out;
	  for (var i = 0; i < sel.ranges.length; i++) {
	    var range = sel.ranges[i];
	    var old = sel.ranges.length == doc.sel.ranges.length && doc.sel.ranges[i];
	    var newAnchor = skipAtomic(doc, range.anchor, old && old.anchor, bias, mayClear);
	    var newHead = skipAtomic(doc, range.head, old && old.head, bias, mayClear);
	    if (out || newAnchor != range.anchor || newHead != range.head) {
	      if (!out) { out = sel.ranges.slice(0, i); }
	      out[i] = new Range(newAnchor, newHead);
	    }
	  }
	  return out ? normalizeSelection(out, sel.primIndex) : sel
	}

	function skipAtomicInner(doc, pos, oldPos, dir, mayClear) {
	  var line = getLine(doc, pos.line);
	  if (line.markedSpans) { for (var i = 0; i < line.markedSpans.length; ++i) {
	    var sp = line.markedSpans[i], m = sp.marker;
	    if ((sp.from == null || (m.inclusiveLeft ? sp.from <= pos.ch : sp.from < pos.ch)) &&
	        (sp.to == null || (m.inclusiveRight ? sp.to >= pos.ch : sp.to > pos.ch))) {
	      if (mayClear) {
	        signal(m, "beforeCursorEnter");
	        if (m.explicitlyCleared) {
	          if (!line.markedSpans) { break }
	          else {--i; continue}
	        }
	      }
	      if (!m.atomic) { continue }

	      if (oldPos) {
	        var near = m.find(dir < 0 ? 1 : -1), diff = (void 0);
	        if (dir < 0 ? m.inclusiveRight : m.inclusiveLeft)
	          { near = movePos(doc, near, -dir, near && near.line == pos.line ? line : null); }
	        if (near && near.line == pos.line && (diff = cmp(near, oldPos)) && (dir < 0 ? diff < 0 : diff > 0))
	          { return skipAtomicInner(doc, near, pos, dir, mayClear) }
	      }

	      var far = m.find(dir < 0 ? -1 : 1);
	      if (dir < 0 ? m.inclusiveLeft : m.inclusiveRight)
	        { far = movePos(doc, far, dir, far.line == pos.line ? line : null); }
	      return far ? skipAtomicInner(doc, far, pos, dir, mayClear) : null
	    }
	  } }
	  return pos
	}

	// Ensure a given position is not inside an atomic range.
	function skipAtomic(doc, pos, oldPos, bias, mayClear) {
	  var dir = bias || 1;
	  var found = skipAtomicInner(doc, pos, oldPos, dir, mayClear) ||
	      (!mayClear && skipAtomicInner(doc, pos, oldPos, dir, true)) ||
	      skipAtomicInner(doc, pos, oldPos, -dir, mayClear) ||
	      (!mayClear && skipAtomicInner(doc, pos, oldPos, -dir, true));
	  if (!found) {
	    doc.cantEdit = true;
	    return Pos(doc.first, 0)
	  }
	  return found
	}

	function movePos(doc, pos, dir, line) {
	  if (dir < 0 && pos.ch == 0) {
	    if (pos.line > doc.first) { return clipPos(doc, Pos(pos.line - 1)) }
	    else { return null }
	  } else if (dir > 0 && pos.ch == (line || getLine(doc, pos.line)).text.length) {
	    if (pos.line < doc.first + doc.size - 1) { return Pos(pos.line + 1, 0) }
	    else { return null }
	  } else {
	    return new Pos(pos.line, pos.ch + dir)
	  }
	}

	function selectAll(cm) {
	  cm.setSelection(Pos(cm.firstLine(), 0), Pos(cm.lastLine()), sel_dontScroll);
	}

	// UPDATING

	// Allow "beforeChange" event handlers to influence a change
	function filterChange(doc, change, update) {
	  var obj = {
	    canceled: false,
	    from: change.from,
	    to: change.to,
	    text: change.text,
	    origin: change.origin,
	    cancel: function () { return obj.canceled = true; }
	  };
	  if (update) { obj.update = function (from, to, text, origin) {
	    if (from) { obj.from = clipPos(doc, from); }
	    if (to) { obj.to = clipPos(doc, to); }
	    if (text) { obj.text = text; }
	    if (origin !== undefined) { obj.origin = origin; }
	  }; }
	  signal(doc, "beforeChange", doc, obj);
	  if (doc.cm) { signal(doc.cm, "beforeChange", doc.cm, obj); }

	  if (obj.canceled) { return null }
	  return {from: obj.from, to: obj.to, text: obj.text, origin: obj.origin}
	}

	// Apply a change to a document, and add it to the document's
	// history, and propagating it to all linked documents.
	function makeChange(doc, change, ignoreReadOnly) {
	  if (doc.cm) {
	    if (!doc.cm.curOp) { return operation(doc.cm, makeChange)(doc, change, ignoreReadOnly) }
	    if (doc.cm.state.suppressEdits) { return }
	  }

	  if (hasHandler(doc, "beforeChange") || doc.cm && hasHandler(doc.cm, "beforeChange")) {
	    change = filterChange(doc, change, true);
	    if (!change) { return }
	  }

	  // Possibly split or suppress the update based on the presence
	  // of read-only spans in its range.
	  var split = sawReadOnlySpans && !ignoreReadOnly && removeReadOnlyRanges(doc, change.from, change.to);
	  if (split) {
	    for (var i = split.length - 1; i >= 0; --i)
	      { makeChangeInner(doc, {from: split[i].from, to: split[i].to, text: i ? [""] : change.text, origin: change.origin}); }
	  } else {
	    makeChangeInner(doc, change);
	  }
	}

	function makeChangeInner(doc, change) {
	  if (change.text.length == 1 && change.text[0] == "" && cmp(change.from, change.to) == 0) { return }
	  var selAfter = computeSelAfterChange(doc, change);
	  addChangeToHistory(doc, change, selAfter, doc.cm ? doc.cm.curOp.id : NaN);

	  makeChangeSingleDoc(doc, change, selAfter, stretchSpansOverChange(doc, change));
	  var rebased = [];

	  linkedDocs(doc, function (doc, sharedHist) {
	    if (!sharedHist && indexOf(rebased, doc.history) == -1) {
	      rebaseHist(doc.history, change);
	      rebased.push(doc.history);
	    }
	    makeChangeSingleDoc(doc, change, null, stretchSpansOverChange(doc, change));
	  });
	}

	// Revert a change stored in a document's history.
	function makeChangeFromHistory(doc, type, allowSelectionOnly) {
	  var suppress = doc.cm && doc.cm.state.suppressEdits;
	  if (suppress && !allowSelectionOnly) { return }

	  var hist = doc.history, event, selAfter = doc.sel;
	  var source = type == "undo" ? hist.done : hist.undone, dest = type == "undo" ? hist.undone : hist.done;

	  // Verify that there is a useable event (so that ctrl-z won't
	  // needlessly clear selection events)
	  var i = 0;
	  for (; i < source.length; i++) {
	    event = source[i];
	    if (allowSelectionOnly ? event.ranges && !event.equals(doc.sel) : !event.ranges)
	      { break }
	  }
	  if (i == source.length) { return }
	  hist.lastOrigin = hist.lastSelOrigin = null;

	  for (;;) {
	    event = source.pop();
	    if (event.ranges) {
	      pushSelectionToHistory(event, dest);
	      if (allowSelectionOnly && !event.equals(doc.sel)) {
	        setSelection(doc, event, {clearRedo: false});
	        return
	      }
	      selAfter = event;
	    } else if (suppress) {
	      source.push(event);
	      return
	    } else { break }
	  }

	  // Build up a reverse change object to add to the opposite history
	  // stack (redo when undoing, and vice versa).
	  var antiChanges = [];
	  pushSelectionToHistory(selAfter, dest);
	  dest.push({changes: antiChanges, generation: hist.generation});
	  hist.generation = event.generation || ++hist.maxGeneration;

	  var filter = hasHandler(doc, "beforeChange") || doc.cm && hasHandler(doc.cm, "beforeChange");

	  var loop = function ( i ) {
	    var change = event.changes[i];
	    change.origin = type;
	    if (filter && !filterChange(doc, change, false)) {
	      source.length = 0;
	      return {}
	    }

	    antiChanges.push(historyChangeFromChange(doc, change));

	    var after = i ? computeSelAfterChange(doc, change) : lst(source);
	    makeChangeSingleDoc(doc, change, after, mergeOldSpans(doc, change));
	    if (!i && doc.cm) { doc.cm.scrollIntoView({from: change.from, to: changeEnd(change)}); }
	    var rebased = [];

	    // Propagate to the linked documents
	    linkedDocs(doc, function (doc, sharedHist) {
	      if (!sharedHist && indexOf(rebased, doc.history) == -1) {
	        rebaseHist(doc.history, change);
	        rebased.push(doc.history);
	      }
	      makeChangeSingleDoc(doc, change, null, mergeOldSpans(doc, change));
	    });
	  };

	  for (var i$1 = event.changes.length - 1; i$1 >= 0; --i$1) {
	    var returned = loop( i$1 );

	    if ( returned ) { return returned.v; }
	  }
	}

	// Sub-views need their line numbers shifted when text is added
	// above or below them in the parent document.
	function shiftDoc(doc, distance) {
	  if (distance == 0) { return }
	  doc.first += distance;
	  doc.sel = new Selection(map(doc.sel.ranges, function (range) { return new Range(
	    Pos(range.anchor.line + distance, range.anchor.ch),
	    Pos(range.head.line + distance, range.head.ch)
	  ); }), doc.sel.primIndex);
	  if (doc.cm) {
	    regChange(doc.cm, doc.first, doc.first - distance, distance);
	    for (var d = doc.cm.display, l = d.viewFrom; l < d.viewTo; l++)
	      { regLineChange(doc.cm, l, "gutter"); }
	  }
	}

	// More lower-level change function, handling only a single document
	// (not linked ones).
	function makeChangeSingleDoc(doc, change, selAfter, spans) {
	  if (doc.cm && !doc.cm.curOp)
	    { return operation(doc.cm, makeChangeSingleDoc)(doc, change, selAfter, spans) }

	  if (change.to.line < doc.first) {
	    shiftDoc(doc, change.text.length - 1 - (change.to.line - change.from.line));
	    return
	  }
	  if (change.from.line > doc.lastLine()) { return }

	  // Clip the change to the size of this doc
	  if (change.from.line < doc.first) {
	    var shift = change.text.length - 1 - (doc.first - change.from.line);
	    shiftDoc(doc, shift);
	    change = {from: Pos(doc.first, 0), to: Pos(change.to.line + shift, change.to.ch),
	              text: [lst(change.text)], origin: change.origin};
	  }
	  var last = doc.lastLine();
	  if (change.to.line > last) {
	    change = {from: change.from, to: Pos(last, getLine(doc, last).text.length),
	              text: [change.text[0]], origin: change.origin};
	  }

	  change.removed = getBetween(doc, change.from, change.to);

	  if (!selAfter) { selAfter = computeSelAfterChange(doc, change); }
	  if (doc.cm) { makeChangeSingleDocInEditor(doc.cm, change, spans); }
	  else { updateDoc(doc, change, spans); }
	  setSelectionNoUndo(doc, selAfter, sel_dontScroll);
	}

	// Handle the interaction of a change to a document with the editor
	// that this document is part of.
	function makeChangeSingleDocInEditor(cm, change, spans) {
	  var doc = cm.doc, display = cm.display, from = change.from, to = change.to;

	  var recomputeMaxLength = false, checkWidthStart = from.line;
	  if (!cm.options.lineWrapping) {
	    checkWidthStart = lineNo(visualLine(getLine(doc, from.line)));
	    doc.iter(checkWidthStart, to.line + 1, function (line) {
	      if (line == display.maxLine) {
	        recomputeMaxLength = true;
	        return true
	      }
	    });
	  }

	  if (doc.sel.contains(change.from, change.to) > -1)
	    { signalCursorActivity(cm); }

	  updateDoc(doc, change, spans, estimateHeight(cm));

	  if (!cm.options.lineWrapping) {
	    doc.iter(checkWidthStart, from.line + change.text.length, function (line) {
	      var len = lineLength(line);
	      if (len > display.maxLineLength) {
	        display.maxLine = line;
	        display.maxLineLength = len;
	        display.maxLineChanged = true;
	        recomputeMaxLength = false;
	      }
	    });
	    if (recomputeMaxLength) { cm.curOp.updateMaxLine = true; }
	  }

	  retreatFrontier(doc, from.line);
	  startWorker(cm, 400);

	  var lendiff = change.text.length - (to.line - from.line) - 1;
	  // Remember that these lines changed, for updating the display
	  if (change.full)
	    { regChange(cm); }
	  else if (from.line == to.line && change.text.length == 1 && !isWholeLineUpdate(cm.doc, change))
	    { regLineChange(cm, from.line, "text"); }
	  else
	    { regChange(cm, from.line, to.line + 1, lendiff); }

	  var changesHandler = hasHandler(cm, "changes"), changeHandler = hasHandler(cm, "change");
	  if (changeHandler || changesHandler) {
	    var obj = {
	      from: from, to: to,
	      text: change.text,
	      removed: change.removed,
	      origin: change.origin
	    };
	    if (changeHandler) { signalLater(cm, "change", cm, obj); }
	    if (changesHandler) { (cm.curOp.changeObjs || (cm.curOp.changeObjs = [])).push(obj); }
	  }
	  cm.display.selForContextMenu = null;
	}

	function replaceRange(doc, code, from, to, origin) {
	  if (!to) { to = from; }
	  if (cmp(to, from) < 0) { var assign;
	    (assign = [to, from], from = assign[0], to = assign[1]); }
	  if (typeof code == "string") { code = doc.splitLines(code); }
	  makeChange(doc, {from: from, to: to, text: code, origin: origin});
	}

	// Rebasing/resetting history to deal with externally-sourced changes

	function rebaseHistSelSingle(pos, from, to, diff) {
	  if (to < pos.line) {
	    pos.line += diff;
	  } else if (from < pos.line) {
	    pos.line = from;
	    pos.ch = 0;
	  }
	}

	// Tries to rebase an array of history events given a change in the
	// document. If the change touches the same lines as the event, the
	// event, and everything 'behind' it, is discarded. If the change is
	// before the event, the event's positions are updated. Uses a
	// copy-on-write scheme for the positions, to avoid having to
	// reallocate them all on every rebase, but also avoid problems with
	// shared position objects being unsafely updated.
	function rebaseHistArray(array, from, to, diff) {
	  for (var i = 0; i < array.length; ++i) {
	    var sub = array[i], ok = true;
	    if (sub.ranges) {
	      if (!sub.copied) { sub = array[i] = sub.deepCopy(); sub.copied = true; }
	      for (var j = 0; j < sub.ranges.length; j++) {
	        rebaseHistSelSingle(sub.ranges[j].anchor, from, to, diff);
	        rebaseHistSelSingle(sub.ranges[j].head, from, to, diff);
	      }
	      continue
	    }
	    for (var j$1 = 0; j$1 < sub.changes.length; ++j$1) {
	      var cur = sub.changes[j$1];
	      if (to < cur.from.line) {
	        cur.from = Pos(cur.from.line + diff, cur.from.ch);
	        cur.to = Pos(cur.to.line + diff, cur.to.ch);
	      } else if (from <= cur.to.line) {
	        ok = false;
	        break
	      }
	    }
	    if (!ok) {
	      array.splice(0, i + 1);
	      i = 0;
	    }
	  }
	}

	function rebaseHist(hist, change) {
	  var from = change.from.line, to = change.to.line, diff = change.text.length - (to - from) - 1;
	  rebaseHistArray(hist.done, from, to, diff);
	  rebaseHistArray(hist.undone, from, to, diff);
	}

	// Utility for applying a change to a line by handle or number,
	// returning the number and optionally registering the line as
	// changed.
	function changeLine(doc, handle, changeType, op) {
	  var no = handle, line = handle;
	  if (typeof handle == "number") { line = getLine(doc, clipLine(doc, handle)); }
	  else { no = lineNo(handle); }
	  if (no == null) { return null }
	  if (op(line, no) && doc.cm) { regLineChange(doc.cm, no, changeType); }
	  return line
	}

	// The document is represented as a BTree consisting of leaves, with
	// chunk of lines in them, and branches, with up to ten leaves or
	// other branch nodes below them. The top node is always a branch
	// node, and is the document object itself (meaning it has
	// additional methods and properties).
	//
	// All nodes have parent links. The tree is used both to go from
	// line numbers to line objects, and to go from objects to numbers.
	// It also indexes by height, and is used to convert between height
	// and line object, and to find the total height of the document.
	//
	// See also http://marijnhaverbeke.nl/blog/codemirror-line-tree.html

	function LeafChunk(lines) {
	  var this$1 = this;

	  this.lines = lines;
	  this.parent = null;
	  var height = 0;
	  for (var i = 0; i < lines.length; ++i) {
	    lines[i].parent = this$1;
	    height += lines[i].height;
	  }
	  this.height = height;
	}

	LeafChunk.prototype = {
	  chunkSize: function() { return this.lines.length },

	  // Remove the n lines at offset 'at'.
	  removeInner: function(at, n) {
	    var this$1 = this;

	    for (var i = at, e = at + n; i < e; ++i) {
	      var line = this$1.lines[i];
	      this$1.height -= line.height;
	      cleanUpLine(line);
	      signalLater(line, "delete");
	    }
	    this.lines.splice(at, n);
	  },

	  // Helper used to collapse a small branch into a single leaf.
	  collapse: function(lines) {
	    lines.push.apply(lines, this.lines);
	  },

	  // Insert the given array of lines at offset 'at', count them as
	  // having the given height.
	  insertInner: function(at, lines, height) {
	    var this$1 = this;

	    this.height += height;
	    this.lines = this.lines.slice(0, at).concat(lines).concat(this.lines.slice(at));
	    for (var i = 0; i < lines.length; ++i) { lines[i].parent = this$1; }
	  },

	  // Used to iterate over a part of the tree.
	  iterN: function(at, n, op) {
	    var this$1 = this;

	    for (var e = at + n; at < e; ++at)
	      { if (op(this$1.lines[at])) { return true } }
	  }
	};

	function BranchChunk(children) {
	  var this$1 = this;

	  this.children = children;
	  var size = 0, height = 0;
	  for (var i = 0; i < children.length; ++i) {
	    var ch = children[i];
	    size += ch.chunkSize(); height += ch.height;
	    ch.parent = this$1;
	  }
	  this.size = size;
	  this.height = height;
	  this.parent = null;
	}

	BranchChunk.prototype = {
	  chunkSize: function() { return this.size },

	  removeInner: function(at, n) {
	    var this$1 = this;

	    this.size -= n;
	    for (var i = 0; i < this.children.length; ++i) {
	      var child = this$1.children[i], sz = child.chunkSize();
	      if (at < sz) {
	        var rm = Math.min(n, sz - at), oldHeight = child.height;
	        child.removeInner(at, rm);
	        this$1.height -= oldHeight - child.height;
	        if (sz == rm) { this$1.children.splice(i--, 1); child.parent = null; }
	        if ((n -= rm) == 0) { break }
	        at = 0;
	      } else { at -= sz; }
	    }
	    // If the result is smaller than 25 lines, ensure that it is a
	    // single leaf node.
	    if (this.size - n < 25 &&
	        (this.children.length > 1 || !(this.children[0] instanceof LeafChunk))) {
	      var lines = [];
	      this.collapse(lines);
	      this.children = [new LeafChunk(lines)];
	      this.children[0].parent = this;
	    }
	  },

	  collapse: function(lines) {
	    var this$1 = this;

	    for (var i = 0; i < this.children.length; ++i) { this$1.children[i].collapse(lines); }
	  },

	  insertInner: function(at, lines, height) {
	    var this$1 = this;

	    this.size += lines.length;
	    this.height += height;
	    for (var i = 0; i < this.children.length; ++i) {
	      var child = this$1.children[i], sz = child.chunkSize();
	      if (at <= sz) {
	        child.insertInner(at, lines, height);
	        if (child.lines && child.lines.length > 50) {
	          // To avoid memory thrashing when child.lines is huge (e.g. first view of a large file), it's never spliced.
	          // Instead, small slices are taken. They're taken in order because sequential memory accesses are fastest.
	          var remaining = child.lines.length % 25 + 25;
	          for (var pos = remaining; pos < child.lines.length;) {
	            var leaf = new LeafChunk(child.lines.slice(pos, pos += 25));
	            child.height -= leaf.height;
	            this$1.children.splice(++i, 0, leaf);
	            leaf.parent = this$1;
	          }
	          child.lines = child.lines.slice(0, remaining);
	          this$1.maybeSpill();
	        }
	        break
	      }
	      at -= sz;
	    }
	  },

	  // When a node has grown, check whether it should be split.
	  maybeSpill: function() {
	    if (this.children.length <= 10) { return }
	    var me = this;
	    do {
	      var spilled = me.children.splice(me.children.length - 5, 5);
	      var sibling = new BranchChunk(spilled);
	      if (!me.parent) { // Become the parent node
	        var copy = new BranchChunk(me.children);
	        copy.parent = me;
	        me.children = [copy, sibling];
	        me = copy;
	     } else {
	        me.size -= sibling.size;
	        me.height -= sibling.height;
	        var myIndex = indexOf(me.parent.children, me);
	        me.parent.children.splice(myIndex + 1, 0, sibling);
	      }
	      sibling.parent = me.parent;
	    } while (me.children.length > 10)
	    me.parent.maybeSpill();
	  },

	  iterN: function(at, n, op) {
	    var this$1 = this;

	    for (var i = 0; i < this.children.length; ++i) {
	      var child = this$1.children[i], sz = child.chunkSize();
	      if (at < sz) {
	        var used = Math.min(n, sz - at);
	        if (child.iterN(at, used, op)) { return true }
	        if ((n -= used) == 0) { break }
	        at = 0;
	      } else { at -= sz; }
	    }
	  }
	};

	// Line widgets are block elements displayed above or below a line.

	var LineWidget = function(doc, node, options) {
	  var this$1 = this;

	  if (options) { for (var opt in options) { if (options.hasOwnProperty(opt))
	    { this$1[opt] = options[opt]; } } }
	  this.doc = doc;
	  this.node = node;
	};

	LineWidget.prototype.clear = function () {
	    var this$1 = this;

	  var cm = this.doc.cm, ws = this.line.widgets, line = this.line, no = lineNo(line);
	  if (no == null || !ws) { return }
	  for (var i = 0; i < ws.length; ++i) { if (ws[i] == this$1) { ws.splice(i--, 1); } }
	  if (!ws.length) { line.widgets = null; }
	  var height = widgetHeight(this);
	  updateLineHeight(line, Math.max(0, line.height - height));
	  if (cm) {
	    runInOp(cm, function () {
	      adjustScrollWhenAboveVisible(cm, line, -height);
	      regLineChange(cm, no, "widget");
	    });
	    signalLater(cm, "lineWidgetCleared", cm, this, no);
	  }
	};

	LineWidget.prototype.changed = function () {
	    var this$1 = this;

	  var oldH = this.height, cm = this.doc.cm, line = this.line;
	  this.height = null;
	  var diff = widgetHeight(this) - oldH;
	  if (!diff) { return }
	  if (!lineIsHidden(this.doc, line)) { updateLineHeight(line, line.height + diff); }
	  if (cm) {
	    runInOp(cm, function () {
	      cm.curOp.forceUpdate = true;
	      adjustScrollWhenAboveVisible(cm, line, diff);
	      signalLater(cm, "lineWidgetChanged", cm, this$1, lineNo(line));
	    });
	  }
	};
	eventMixin(LineWidget);

	function adjustScrollWhenAboveVisible(cm, line, diff) {
	  if (heightAtLine(line) < ((cm.curOp && cm.curOp.scrollTop) || cm.doc.scrollTop))
	    { addToScrollTop(cm, diff); }
	}

	function addLineWidget(doc, handle, node, options) {
	  var widget = new LineWidget(doc, node, options);
	  var cm = doc.cm;
	  if (cm && widget.noHScroll) { cm.display.alignWidgets = true; }
	  changeLine(doc, handle, "widget", function (line) {
	    var widgets = line.widgets || (line.widgets = []);
	    if (widget.insertAt == null) { widgets.push(widget); }
	    else { widgets.splice(Math.min(widgets.length - 1, Math.max(0, widget.insertAt)), 0, widget); }
	    widget.line = line;
	    if (cm && !lineIsHidden(doc, line)) {
	      var aboveVisible = heightAtLine(line) < doc.scrollTop;
	      updateLineHeight(line, line.height + widgetHeight(widget));
	      if (aboveVisible) { addToScrollTop(cm, widget.height); }
	      cm.curOp.forceUpdate = true;
	    }
	    return true
	  });
	  if (cm) { signalLater(cm, "lineWidgetAdded", cm, widget, typeof handle == "number" ? handle : lineNo(handle)); }
	  return widget
	}

	// TEXTMARKERS

	// Created with markText and setBookmark methods. A TextMarker is a
	// handle that can be used to clear or find a marked position in the
	// document. Line objects hold arrays (markedSpans) containing
	// {from, to, marker} object pointing to such marker objects, and
	// indicating that such a marker is present on that line. Multiple
	// lines may point to the same marker when it spans across lines.
	// The spans will have null for their from/to properties when the
	// marker continues beyond the start/end of the line. Markers have
	// links back to the lines they currently touch.

	// Collapsed markers have unique ids, in order to be able to order
	// them, which is needed for uniquely determining an outer marker
	// when they overlap (they may nest, but not partially overlap).
	var nextMarkerId = 0;

	var TextMarker = function(doc, type) {
	  this.lines = [];
	  this.type = type;
	  this.doc = doc;
	  this.id = ++nextMarkerId;
	};

	// Clear the marker.
	TextMarker.prototype.clear = function () {
	    var this$1 = this;

	  if (this.explicitlyCleared) { return }
	  var cm = this.doc.cm, withOp = cm && !cm.curOp;
	  if (withOp) { startOperation(cm); }
	  if (hasHandler(this, "clear")) {
	    var found = this.find();
	    if (found) { signalLater(this, "clear", found.from, found.to); }
	  }
	  var min = null, max = null;
	  for (var i = 0; i < this.lines.length; ++i) {
	    var line = this$1.lines[i];
	    var span = getMarkedSpanFor(line.markedSpans, this$1);
	    if (cm && !this$1.collapsed) { regLineChange(cm, lineNo(line), "text"); }
	    else if (cm) {
	      if (span.to != null) { max = lineNo(line); }
	      if (span.from != null) { min = lineNo(line); }
	    }
	    line.markedSpans = removeMarkedSpan(line.markedSpans, span);
	    if (span.from == null && this$1.collapsed && !lineIsHidden(this$1.doc, line) && cm)
	      { updateLineHeight(line, textHeight(cm.display)); }
	  }
	  if (cm && this.collapsed && !cm.options.lineWrapping) { for (var i$1 = 0; i$1 < this.lines.length; ++i$1) {
	    var visual = visualLine(this$1.lines[i$1]), len = lineLength(visual);
	    if (len > cm.display.maxLineLength) {
	      cm.display.maxLine = visual;
	      cm.display.maxLineLength = len;
	      cm.display.maxLineChanged = true;
	    }
	  } }

	  if (min != null && cm && this.collapsed) { regChange(cm, min, max + 1); }
	  this.lines.length = 0;
	  this.explicitlyCleared = true;
	  if (this.atomic && this.doc.cantEdit) {
	    this.doc.cantEdit = false;
	    if (cm) { reCheckSelection(cm.doc); }
	  }
	  if (cm) { signalLater(cm, "markerCleared", cm, this, min, max); }
	  if (withOp) { endOperation(cm); }
	  if (this.parent) { this.parent.clear(); }
	};

	// Find the position of the marker in the document. Returns a {from,
	// to} object by default. Side can be passed to get a specific side
	// -- 0 (both), -1 (left), or 1 (right). When lineObj is true, the
	// Pos objects returned contain a line object, rather than a line
	// number (used to prevent looking up the same line twice).
	TextMarker.prototype.find = function (side, lineObj) {
	    var this$1 = this;

	  if (side == null && this.type == "bookmark") { side = 1; }
	  var from, to;
	  for (var i = 0; i < this.lines.length; ++i) {
	    var line = this$1.lines[i];
	    var span = getMarkedSpanFor(line.markedSpans, this$1);
	    if (span.from != null) {
	      from = Pos(lineObj ? line : lineNo(line), span.from);
	      if (side == -1) { return from }
	    }
	    if (span.to != null) {
	      to = Pos(lineObj ? line : lineNo(line), span.to);
	      if (side == 1) { return to }
	    }
	  }
	  return from && {from: from, to: to}
	};

	// Signals that the marker's widget changed, and surrounding layout
	// should be recomputed.
	TextMarker.prototype.changed = function () {
	    var this$1 = this;

	  var pos = this.find(-1, true), widget = this, cm = this.doc.cm;
	  if (!pos || !cm) { return }
	  runInOp(cm, function () {
	    var line = pos.line, lineN = lineNo(pos.line);
	    var view = findViewForLine(cm, lineN);
	    if (view) {
	      clearLineMeasurementCacheFor(view);
	      cm.curOp.selectionChanged = cm.curOp.forceUpdate = true;
	    }
	    cm.curOp.updateMaxLine = true;
	    if (!lineIsHidden(widget.doc, line) && widget.height != null) {
	      var oldHeight = widget.height;
	      widget.height = null;
	      var dHeight = widgetHeight(widget) - oldHeight;
	      if (dHeight)
	        { updateLineHeight(line, line.height + dHeight); }
	    }
	    signalLater(cm, "markerChanged", cm, this$1);
	  });
	};

	TextMarker.prototype.attachLine = function (line) {
	  if (!this.lines.length && this.doc.cm) {
	    var op = this.doc.cm.curOp;
	    if (!op.maybeHiddenMarkers || indexOf(op.maybeHiddenMarkers, this) == -1)
	      { (op.maybeUnhiddenMarkers || (op.maybeUnhiddenMarkers = [])).push(this); }
	  }
	  this.lines.push(line);
	};

	TextMarker.prototype.detachLine = function (line) {
	  this.lines.splice(indexOf(this.lines, line), 1);
	  if (!this.lines.length && this.doc.cm) {
	    var op = this.doc.cm.curOp;(op.maybeHiddenMarkers || (op.maybeHiddenMarkers = [])).push(this);
	  }
	};
	eventMixin(TextMarker);

	// Create a marker, wire it up to the right lines, and
	function markText(doc, from, to, options, type) {
	  // Shared markers (across linked documents) are handled separately
	  // (markTextShared will call out to this again, once per
	  // document).
	  if (options && options.shared) { return markTextShared(doc, from, to, options, type) }
	  // Ensure we are in an operation.
	  if (doc.cm && !doc.cm.curOp) { return operation(doc.cm, markText)(doc, from, to, options, type) }

	  var marker = new TextMarker(doc, type), diff = cmp(from, to);
	  if (options) { copyObj(options, marker, false); }
	  // Don't connect empty markers unless clearWhenEmpty is false
	  if (diff > 0 || diff == 0 && marker.clearWhenEmpty !== false)
	    { return marker }
	  if (marker.replacedWith) {
	    // Showing up as a widget implies collapsed (widget replaces text)
	    marker.collapsed = true;
	    marker.widgetNode = eltP("span", [marker.replacedWith], "CodeMirror-widget");
	    if (!options.handleMouseEvents) { marker.widgetNode.setAttribute("cm-ignore-events", "true"); }
	    if (options.insertLeft) { marker.widgetNode.insertLeft = true; }
	  }
	  if (marker.collapsed) {
	    if (conflictingCollapsedRange(doc, from.line, from, to, marker) ||
	        from.line != to.line && conflictingCollapsedRange(doc, to.line, from, to, marker))
	      { throw new Error("Inserting collapsed marker partially overlapping an existing one") }
	    seeCollapsedSpans();
	  }

	  if (marker.addToHistory)
	    { addChangeToHistory(doc, {from: from, to: to, origin: "markText"}, doc.sel, NaN); }

	  var curLine = from.line, cm = doc.cm, updateMaxLine;
	  doc.iter(curLine, to.line + 1, function (line) {
	    if (cm && marker.collapsed && !cm.options.lineWrapping && visualLine(line) == cm.display.maxLine)
	      { updateMaxLine = true; }
	    if (marker.collapsed && curLine != from.line) { updateLineHeight(line, 0); }
	    addMarkedSpan(line, new MarkedSpan(marker,
	                                       curLine == from.line ? from.ch : null,
	                                       curLine == to.line ? to.ch : null));
	    ++curLine;
	  });
	  // lineIsHidden depends on the presence of the spans, so needs a second pass
	  if (marker.collapsed) { doc.iter(from.line, to.line + 1, function (line) {
	    if (lineIsHidden(doc, line)) { updateLineHeight(line, 0); }
	  }); }

	  if (marker.clearOnEnter) { on(marker, "beforeCursorEnter", function () { return marker.clear(); }); }

	  if (marker.readOnly) {
	    seeReadOnlySpans();
	    if (doc.history.done.length || doc.history.undone.length)
	      { doc.clearHistory(); }
	  }
	  if (marker.collapsed) {
	    marker.id = ++nextMarkerId;
	    marker.atomic = true;
	  }
	  if (cm) {
	    // Sync editor state
	    if (updateMaxLine) { cm.curOp.updateMaxLine = true; }
	    if (marker.collapsed)
	      { regChange(cm, from.line, to.line + 1); }
	    else if (marker.className || marker.title || marker.startStyle || marker.endStyle || marker.css)
	      { for (var i = from.line; i <= to.line; i++) { regLineChange(cm, i, "text"); } }
	    if (marker.atomic) { reCheckSelection(cm.doc); }
	    signalLater(cm, "markerAdded", cm, marker);
	  }
	  return marker
	}

	// SHARED TEXTMARKERS

	// A shared marker spans multiple linked documents. It is
	// implemented as a meta-marker-object controlling multiple normal
	// markers.
	var SharedTextMarker = function(markers, primary) {
	  var this$1 = this;

	  this.markers = markers;
	  this.primary = primary;
	  for (var i = 0; i < markers.length; ++i)
	    { markers[i].parent = this$1; }
	};

	SharedTextMarker.prototype.clear = function () {
	    var this$1 = this;

	  if (this.explicitlyCleared) { return }
	  this.explicitlyCleared = true;
	  for (var i = 0; i < this.markers.length; ++i)
	    { this$1.markers[i].clear(); }
	  signalLater(this, "clear");
	};

	SharedTextMarker.prototype.find = function (side, lineObj) {
	  return this.primary.find(side, lineObj)
	};
	eventMixin(SharedTextMarker);

	function markTextShared(doc, from, to, options, type) {
	  options = copyObj(options);
	  options.shared = false;
	  var markers = [markText(doc, from, to, options, type)], primary = markers[0];
	  var widget = options.widgetNode;
	  linkedDocs(doc, function (doc) {
	    if (widget) { options.widgetNode = widget.cloneNode(true); }
	    markers.push(markText(doc, clipPos(doc, from), clipPos(doc, to), options, type));
	    for (var i = 0; i < doc.linked.length; ++i)
	      { if (doc.linked[i].isParent) { return } }
	    primary = lst(markers);
	  });
	  return new SharedTextMarker(markers, primary)
	}

	function findSharedMarkers(doc) {
	  return doc.findMarks(Pos(doc.first, 0), doc.clipPos(Pos(doc.lastLine())), function (m) { return m.parent; })
	}

	function copySharedMarkers(doc, markers) {
	  for (var i = 0; i < markers.length; i++) {
	    var marker = markers[i], pos = marker.find();
	    var mFrom = doc.clipPos(pos.from), mTo = doc.clipPos(pos.to);
	    if (cmp(mFrom, mTo)) {
	      var subMark = markText(doc, mFrom, mTo, marker.primary, marker.primary.type);
	      marker.markers.push(subMark);
	      subMark.parent = marker;
	    }
	  }
	}

	function detachSharedMarkers(markers) {
	  var loop = function ( i ) {
	    var marker = markers[i], linked = [marker.primary.doc];
	    linkedDocs(marker.primary.doc, function (d) { return linked.push(d); });
	    for (var j = 0; j < marker.markers.length; j++) {
	      var subMarker = marker.markers[j];
	      if (indexOf(linked, subMarker.doc) == -1) {
	        subMarker.parent = null;
	        marker.markers.splice(j--, 1);
	      }
	    }
	  };

	  for (var i = 0; i < markers.length; i++) { loop( i ); }
	}

	var nextDocId = 0;
	var Doc = function(text, mode, firstLine, lineSep, direction) {
	  if (!(this instanceof Doc)) { return new Doc(text, mode, firstLine, lineSep, direction) }
	  if (firstLine == null) { firstLine = 0; }

	  BranchChunk.call(this, [new LeafChunk([new Line("", null)])]);
	  this.first = firstLine;
	  this.scrollTop = this.scrollLeft = 0;
	  this.cantEdit = false;
	  this.cleanGeneration = 1;
	  this.modeFrontier = this.highlightFrontier = firstLine;
	  var start = Pos(firstLine, 0);
	  this.sel = simpleSelection(start);
	  this.history = new History(null);
	  this.id = ++nextDocId;
	  this.modeOption = mode;
	  this.lineSep = lineSep;
	  this.direction = (direction == "rtl") ? "rtl" : "ltr";
	  this.extend = false;

	  if (typeof text == "string") { text = this.splitLines(text); }
	  updateDoc(this, {from: start, to: start, text: text});
	  setSelection(this, simpleSelection(start), sel_dontScroll);
	};

	Doc.prototype = createObj(BranchChunk.prototype, {
	  constructor: Doc,
	  // Iterate over the document. Supports two forms -- with only one
	  // argument, it calls that for each line in the document. With
	  // three, it iterates over the range given by the first two (with
	  // the second being non-inclusive).
	  iter: function(from, to, op) {
	    if (op) { this.iterN(from - this.first, to - from, op); }
	    else { this.iterN(this.first, this.first + this.size, from); }
	  },

	  // Non-public interface for adding and removing lines.
	  insert: function(at, lines) {
	    var height = 0;
	    for (var i = 0; i < lines.length; ++i) { height += lines[i].height; }
	    this.insertInner(at - this.first, lines, height);
	  },
	  remove: function(at, n) { this.removeInner(at - this.first, n); },

	  // From here, the methods are part of the public interface. Most
	  // are also available from CodeMirror (editor) instances.

	  getValue: function(lineSep) {
	    var lines = getLines(this, this.first, this.first + this.size);
	    if (lineSep === false) { return lines }
	    return lines.join(lineSep || this.lineSeparator())
	  },
	  setValue: docMethodOp(function(code) {
	    var top = Pos(this.first, 0), last = this.first + this.size - 1;
	    makeChange(this, {from: top, to: Pos(last, getLine(this, last).text.length),
	                      text: this.splitLines(code), origin: "setValue", full: true}, true);
	    if (this.cm) { scrollToCoords(this.cm, 0, 0); }
	    setSelection(this, simpleSelection(top), sel_dontScroll);
	  }),
	  replaceRange: function(code, from, to, origin) {
	    from = clipPos(this, from);
	    to = to ? clipPos(this, to) : from;
	    replaceRange(this, code, from, to, origin);
	  },
	  getRange: function(from, to, lineSep) {
	    var lines = getBetween(this, clipPos(this, from), clipPos(this, to));
	    if (lineSep === false) { return lines }
	    return lines.join(lineSep || this.lineSeparator())
	  },

	  getLine: function(line) {var l = this.getLineHandle(line); return l && l.text},

	  getLineHandle: function(line) {if (isLine(this, line)) { return getLine(this, line) }},
	  getLineNumber: function(line) {return lineNo(line)},

	  getLineHandleVisualStart: function(line) {
	    if (typeof line == "number") { line = getLine(this, line); }
	    return visualLine(line)
	  },

	  lineCount: function() {return this.size},
	  firstLine: function() {return this.first},
	  lastLine: function() {return this.first + this.size - 1},

	  clipPos: function(pos) {return clipPos(this, pos)},

	  getCursor: function(start) {
	    var range$$1 = this.sel.primary(), pos;
	    if (start == null || start == "head") { pos = range$$1.head; }
	    else if (start == "anchor") { pos = range$$1.anchor; }
	    else if (start == "end" || start == "to" || start === false) { pos = range$$1.to(); }
	    else { pos = range$$1.from(); }
	    return pos
	  },
	  listSelections: function() { return this.sel.ranges },
	  somethingSelected: function() {return this.sel.somethingSelected()},

	  setCursor: docMethodOp(function(line, ch, options) {
	    setSimpleSelection(this, clipPos(this, typeof line == "number" ? Pos(line, ch || 0) : line), null, options);
	  }),
	  setSelection: docMethodOp(function(anchor, head, options) {
	    setSimpleSelection(this, clipPos(this, anchor), clipPos(this, head || anchor), options);
	  }),
	  extendSelection: docMethodOp(function(head, other, options) {
	    extendSelection(this, clipPos(this, head), other && clipPos(this, other), options);
	  }),
	  extendSelections: docMethodOp(function(heads, options) {
	    extendSelections(this, clipPosArray(this, heads), options);
	  }),
	  extendSelectionsBy: docMethodOp(function(f, options) {
	    var heads = map(this.sel.ranges, f);
	    extendSelections(this, clipPosArray(this, heads), options);
	  }),
	  setSelections: docMethodOp(function(ranges, primary, options) {
	    var this$1 = this;

	    if (!ranges.length) { return }
	    var out = [];
	    for (var i = 0; i < ranges.length; i++)
	      { out[i] = new Range(clipPos(this$1, ranges[i].anchor),
	                         clipPos(this$1, ranges[i].head)); }
	    if (primary == null) { primary = Math.min(ranges.length - 1, this.sel.primIndex); }
	    setSelection(this, normalizeSelection(out, primary), options);
	  }),
	  addSelection: docMethodOp(function(anchor, head, options) {
	    var ranges = this.sel.ranges.slice(0);
	    ranges.push(new Range(clipPos(this, anchor), clipPos(this, head || anchor)));
	    setSelection(this, normalizeSelection(ranges, ranges.length - 1), options);
	  }),

	  getSelection: function(lineSep) {
	    var this$1 = this;

	    var ranges = this.sel.ranges, lines;
	    for (var i = 0; i < ranges.length; i++) {
	      var sel = getBetween(this$1, ranges[i].from(), ranges[i].to());
	      lines = lines ? lines.concat(sel) : sel;
	    }
	    if (lineSep === false) { return lines }
	    else { return lines.join(lineSep || this.lineSeparator()) }
	  },
	  getSelections: function(lineSep) {
	    var this$1 = this;

	    var parts = [], ranges = this.sel.ranges;
	    for (var i = 0; i < ranges.length; i++) {
	      var sel = getBetween(this$1, ranges[i].from(), ranges[i].to());
	      if (lineSep !== false) { sel = sel.join(lineSep || this$1.lineSeparator()); }
	      parts[i] = sel;
	    }
	    return parts
	  },
	  replaceSelection: function(code, collapse, origin) {
	    var dup = [];
	    for (var i = 0; i < this.sel.ranges.length; i++)
	      { dup[i] = code; }
	    this.replaceSelections(dup, collapse, origin || "+input");
	  },
	  replaceSelections: docMethodOp(function(code, collapse, origin) {
	    var this$1 = this;

	    var changes = [], sel = this.sel;
	    for (var i = 0; i < sel.ranges.length; i++) {
	      var range$$1 = sel.ranges[i];
	      changes[i] = {from: range$$1.from(), to: range$$1.to(), text: this$1.splitLines(code[i]), origin: origin};
	    }
	    var newSel = collapse && collapse != "end" && computeReplacedSel(this, changes, collapse);
	    for (var i$1 = changes.length - 1; i$1 >= 0; i$1--)
	      { makeChange(this$1, changes[i$1]); }
	    if (newSel) { setSelectionReplaceHistory(this, newSel); }
	    else if (this.cm) { ensureCursorVisible(this.cm); }
	  }),
	  undo: docMethodOp(function() {makeChangeFromHistory(this, "undo");}),
	  redo: docMethodOp(function() {makeChangeFromHistory(this, "redo");}),
	  undoSelection: docMethodOp(function() {makeChangeFromHistory(this, "undo", true);}),
	  redoSelection: docMethodOp(function() {makeChangeFromHistory(this, "redo", true);}),

	  setExtending: function(val) {this.extend = val;},
	  getExtending: function() {return this.extend},

	  historySize: function() {
	    var hist = this.history, done = 0, undone = 0;
	    for (var i = 0; i < hist.done.length; i++) { if (!hist.done[i].ranges) { ++done; } }
	    for (var i$1 = 0; i$1 < hist.undone.length; i$1++) { if (!hist.undone[i$1].ranges) { ++undone; } }
	    return {undo: done, redo: undone}
	  },
	  clearHistory: function() {this.history = new History(this.history.maxGeneration);},

	  markClean: function() {
	    this.cleanGeneration = this.changeGeneration(true);
	  },
	  changeGeneration: function(forceSplit) {
	    if (forceSplit)
	      { this.history.lastOp = this.history.lastSelOp = this.history.lastOrigin = null; }
	    return this.history.generation
	  },
	  isClean: function (gen) {
	    return this.history.generation == (gen || this.cleanGeneration)
	  },

	  getHistory: function() {
	    return {done: copyHistoryArray(this.history.done),
	            undone: copyHistoryArray(this.history.undone)}
	  },
	  setHistory: function(histData) {
	    var hist = this.history = new History(this.history.maxGeneration);
	    hist.done = copyHistoryArray(histData.done.slice(0), null, true);
	    hist.undone = copyHistoryArray(histData.undone.slice(0), null, true);
	  },

	  setGutterMarker: docMethodOp(function(line, gutterID, value) {
	    return changeLine(this, line, "gutter", function (line) {
	      var markers = line.gutterMarkers || (line.gutterMarkers = {});
	      markers[gutterID] = value;
	      if (!value && isEmpty(markers)) { line.gutterMarkers = null; }
	      return true
	    })
	  }),

	  clearGutter: docMethodOp(function(gutterID) {
	    var this$1 = this;

	    this.iter(function (line) {
	      if (line.gutterMarkers && line.gutterMarkers[gutterID]) {
	        changeLine(this$1, line, "gutter", function () {
	          line.gutterMarkers[gutterID] = null;
	          if (isEmpty(line.gutterMarkers)) { line.gutterMarkers = null; }
	          return true
	        });
	      }
	    });
	  }),

	  lineInfo: function(line) {
	    var n;
	    if (typeof line == "number") {
	      if (!isLine(this, line)) { return null }
	      n = line;
	      line = getLine(this, line);
	      if (!line) { return null }
	    } else {
	      n = lineNo(line);
	      if (n == null) { return null }
	    }
	    return {line: n, handle: line, text: line.text, gutterMarkers: line.gutterMarkers,
	            textClass: line.textClass, bgClass: line.bgClass, wrapClass: line.wrapClass,
	            widgets: line.widgets}
	  },

	  addLineClass: docMethodOp(function(handle, where, cls) {
	    return changeLine(this, handle, where == "gutter" ? "gutter" : "class", function (line) {
	      var prop = where == "text" ? "textClass"
	               : where == "background" ? "bgClass"
	               : where == "gutter" ? "gutterClass" : "wrapClass";
	      if (!line[prop]) { line[prop] = cls; }
	      else if (classTest(cls).test(line[prop])) { return false }
	      else { line[prop] += " " + cls; }
	      return true
	    })
	  }),
	  removeLineClass: docMethodOp(function(handle, where, cls) {
	    return changeLine(this, handle, where == "gutter" ? "gutter" : "class", function (line) {
	      var prop = where == "text" ? "textClass"
	               : where == "background" ? "bgClass"
	               : where == "gutter" ? "gutterClass" : "wrapClass";
	      var cur = line[prop];
	      if (!cur) { return false }
	      else if (cls == null) { line[prop] = null; }
	      else {
	        var found = cur.match(classTest(cls));
	        if (!found) { return false }
	        var end = found.index + found[0].length;
	        line[prop] = cur.slice(0, found.index) + (!found.index || end == cur.length ? "" : " ") + cur.slice(end) || null;
	      }
	      return true
	    })
	  }),

	  addLineWidget: docMethodOp(function(handle, node, options) {
	    return addLineWidget(this, handle, node, options)
	  }),
	  removeLineWidget: function(widget) { widget.clear(); },

	  markText: function(from, to, options) {
	    return markText(this, clipPos(this, from), clipPos(this, to), options, options && options.type || "range")
	  },
	  setBookmark: function(pos, options) {
	    var realOpts = {replacedWith: options && (options.nodeType == null ? options.widget : options),
	                    insertLeft: options && options.insertLeft,
	                    clearWhenEmpty: false, shared: options && options.shared,
	                    handleMouseEvents: options && options.handleMouseEvents};
	    pos = clipPos(this, pos);
	    return markText(this, pos, pos, realOpts, "bookmark")
	  },
	  findMarksAt: function(pos) {
	    pos = clipPos(this, pos);
	    var markers = [], spans = getLine(this, pos.line).markedSpans;
	    if (spans) { for (var i = 0; i < spans.length; ++i) {
	      var span = spans[i];
	      if ((span.from == null || span.from <= pos.ch) &&
	          (span.to == null || span.to >= pos.ch))
	        { markers.push(span.marker.parent || span.marker); }
	    } }
	    return markers
	  },
	  findMarks: function(from, to, filter) {
	    from = clipPos(this, from); to = clipPos(this, to);
	    var found = [], lineNo$$1 = from.line;
	    this.iter(from.line, to.line + 1, function (line) {
	      var spans = line.markedSpans;
	      if (spans) { for (var i = 0; i < spans.length; i++) {
	        var span = spans[i];
	        if (!(span.to != null && lineNo$$1 == from.line && from.ch >= span.to ||
	              span.from == null && lineNo$$1 != from.line ||
	              span.from != null && lineNo$$1 == to.line && span.from >= to.ch) &&
	            (!filter || filter(span.marker)))
	          { found.push(span.marker.parent || span.marker); }
	      } }
	      ++lineNo$$1;
	    });
	    return found
	  },
	  getAllMarks: function() {
	    var markers = [];
	    this.iter(function (line) {
	      var sps = line.markedSpans;
	      if (sps) { for (var i = 0; i < sps.length; ++i)
	        { if (sps[i].from != null) { markers.push(sps[i].marker); } } }
	    });
	    return markers
	  },

	  posFromIndex: function(off) {
	    var ch, lineNo$$1 = this.first, sepSize = this.lineSeparator().length;
	    this.iter(function (line) {
	      var sz = line.text.length + sepSize;
	      if (sz > off) { ch = off; return true }
	      off -= sz;
	      ++lineNo$$1;
	    });
	    return clipPos(this, Pos(lineNo$$1, ch))
	  },
	  indexFromPos: function (coords) {
	    coords = clipPos(this, coords);
	    var index = coords.ch;
	    if (coords.line < this.first || coords.ch < 0) { return 0 }
	    var sepSize = this.lineSeparator().length;
	    this.iter(this.first, coords.line, function (line) { // iter aborts when callback returns a truthy value
	      index += line.text.length + sepSize;
	    });
	    return index
	  },

	  copy: function(copyHistory) {
	    var doc = new Doc(getLines(this, this.first, this.first + this.size),
	                      this.modeOption, this.first, this.lineSep, this.direction);
	    doc.scrollTop = this.scrollTop; doc.scrollLeft = this.scrollLeft;
	    doc.sel = this.sel;
	    doc.extend = false;
	    if (copyHistory) {
	      doc.history.undoDepth = this.history.undoDepth;
	      doc.setHistory(this.getHistory());
	    }
	    return doc
	  },

	  linkedDoc: function(options) {
	    if (!options) { options = {}; }
	    var from = this.first, to = this.first + this.size;
	    if (options.from != null && options.from > from) { from = options.from; }
	    if (options.to != null && options.to < to) { to = options.to; }
	    var copy = new Doc(getLines(this, from, to), options.mode || this.modeOption, from, this.lineSep, this.direction);
	    if (options.sharedHist) { copy.history = this.history
	    ; }(this.linked || (this.linked = [])).push({doc: copy, sharedHist: options.sharedHist});
	    copy.linked = [{doc: this, isParent: true, sharedHist: options.sharedHist}];
	    copySharedMarkers(copy, findSharedMarkers(this));
	    return copy
	  },
	  unlinkDoc: function(other) {
	    var this$1 = this;

	    if (other instanceof CodeMirror$1) { other = other.doc; }
	    if (this.linked) { for (var i = 0; i < this.linked.length; ++i) {
	      var link = this$1.linked[i];
	      if (link.doc != other) { continue }
	      this$1.linked.splice(i, 1);
	      other.unlinkDoc(this$1);
	      detachSharedMarkers(findSharedMarkers(this$1));
	      break
	    } }
	    // If the histories were shared, split them again
	    if (other.history == this.history) {
	      var splitIds = [other.id];
	      linkedDocs(other, function (doc) { return splitIds.push(doc.id); }, true);
	      other.history = new History(null);
	      other.history.done = copyHistoryArray(this.history.done, splitIds);
	      other.history.undone = copyHistoryArray(this.history.undone, splitIds);
	    }
	  },
	  iterLinkedDocs: function(f) {linkedDocs(this, f);},

	  getMode: function() {return this.mode},
	  getEditor: function() {return this.cm},

	  splitLines: function(str) {
	    if (this.lineSep) { return str.split(this.lineSep) }
	    return splitLinesAuto(str)
	  },
	  lineSeparator: function() { return this.lineSep || "\n" },

	  setDirection: docMethodOp(function (dir) {
	    if (dir != "rtl") { dir = "ltr"; }
	    if (dir == this.direction) { return }
	    this.direction = dir;
	    this.iter(function (line) { return line.order = null; });
	    if (this.cm) { directionChanged(this.cm); }
	  })
	});

	// Public alias.
	Doc.prototype.eachLine = Doc.prototype.iter;

	// Kludge to work around strange IE behavior where it'll sometimes
	// re-fire a series of drag-related events right after the drop (#1551)
	var lastDrop = 0;

	function onDrop(e) {
	  var cm = this;
	  clearDragCursor(cm);
	  if (signalDOMEvent(cm, e) || eventInWidget(cm.display, e))
	    { return }
	  e_preventDefault(e);
	  if (ie) { lastDrop = +new Date; }
	  var pos = posFromMouse(cm, e, true), files = e.dataTransfer.files;
	  if (!pos || cm.isReadOnly()) { return }
	  // Might be a file drop, in which case we simply extract the text
	  // and insert it.
	  if (files && files.length && window.FileReader && window.File) {
	    var n = files.length, text = Array(n), read = 0;
	    var loadFile = function (file, i) {
	      if (cm.options.allowDropFileTypes &&
	          indexOf(cm.options.allowDropFileTypes, file.type) == -1)
	        { return }

	      var reader = new FileReader;
	      reader.onload = operation(cm, function () {
	        var content = reader.result;
	        if (/[\x00-\x08\x0e-\x1f]{2}/.test(content)) { content = ""; }
	        text[i] = content;
	        if (++read == n) {
	          pos = clipPos(cm.doc, pos);
	          var change = {from: pos, to: pos,
	                        text: cm.doc.splitLines(text.join(cm.doc.lineSeparator())),
	                        origin: "paste"};
	          makeChange(cm.doc, change);
	          setSelectionReplaceHistory(cm.doc, simpleSelection(pos, changeEnd(change)));
	        }
	      });
	      reader.readAsText(file);
	    };
	    for (var i = 0; i < n; ++i) { loadFile(files[i], i); }
	  } else { // Normal drop
	    // Don't do a replace if the drop happened inside of the selected text.
	    if (cm.state.draggingText && cm.doc.sel.contains(pos) > -1) {
	      cm.state.draggingText(e);
	      // Ensure the editor is re-focused
	      setTimeout(function () { return cm.display.input.focus(); }, 20);
	      return
	    }
	    try {
	      var text$1 = e.dataTransfer.getData("Text");
	      if (text$1) {
	        var selected;
	        if (cm.state.draggingText && !cm.state.draggingText.copy)
	          { selected = cm.listSelections(); }
	        setSelectionNoUndo(cm.doc, simpleSelection(pos, pos));
	        if (selected) { for (var i$1 = 0; i$1 < selected.length; ++i$1)
	          { replaceRange(cm.doc, "", selected[i$1].anchor, selected[i$1].head, "drag"); } }
	        cm.replaceSelection(text$1, "around", "paste");
	        cm.display.input.focus();
	      }
	    }
	    catch(e){}
	  }
	}

	function onDragStart(cm, e) {
	  if (ie && (!cm.state.draggingText || +new Date - lastDrop < 100)) { e_stop(e); return }
	  if (signalDOMEvent(cm, e) || eventInWidget(cm.display, e)) { return }

	  e.dataTransfer.setData("Text", cm.getSelection());
	  e.dataTransfer.effectAllowed = "copyMove";

	  // Use dummy image instead of default browsers image.
	  // Recent Safari (~6.0.2) have a tendency to segfault when this happens, so we don't do it there.
	  if (e.dataTransfer.setDragImage && !safari) {
	    var img = elt("img", null, null, "position: fixed; left: 0; top: 0;");
	    img.src = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
	    if (presto) {
	      img.width = img.height = 1;
	      cm.display.wrapper.appendChild(img);
	      // Force a relayout, or Opera won't use our image for some obscure reason
	      img._top = img.offsetTop;
	    }
	    e.dataTransfer.setDragImage(img, 0, 0);
	    if (presto) { img.parentNode.removeChild(img); }
	  }
	}

	function onDragOver(cm, e) {
	  var pos = posFromMouse(cm, e);
	  if (!pos) { return }
	  var frag = document.createDocumentFragment();
	  drawSelectionCursor(cm, pos, frag);
	  if (!cm.display.dragCursor) {
	    cm.display.dragCursor = elt("div", null, "CodeMirror-cursors CodeMirror-dragcursors");
	    cm.display.lineSpace.insertBefore(cm.display.dragCursor, cm.display.cursorDiv);
	  }
	  removeChildrenAndAdd(cm.display.dragCursor, frag);
	}

	function clearDragCursor(cm) {
	  if (cm.display.dragCursor) {
	    cm.display.lineSpace.removeChild(cm.display.dragCursor);
	    cm.display.dragCursor = null;
	  }
	}

	// These must be handled carefully, because naively registering a
	// handler for each editor will cause the editors to never be
	// garbage collected.

	function forEachCodeMirror(f) {
	  if (!document.getElementsByClassName) { return }
	  var byClass = document.getElementsByClassName("CodeMirror");
	  for (var i = 0; i < byClass.length; i++) {
	    var cm = byClass[i].CodeMirror;
	    if (cm) { f(cm); }
	  }
	}

	var globalsRegistered = false;
	function ensureGlobalHandlers() {
	  if (globalsRegistered) { return }
	  registerGlobalHandlers();
	  globalsRegistered = true;
	}
	function registerGlobalHandlers() {
	  // When the window resizes, we need to refresh active editors.
	  var resizeTimer;
	  on(window, "resize", function () {
	    if (resizeTimer == null) { resizeTimer = setTimeout(function () {
	      resizeTimer = null;
	      forEachCodeMirror(onResize);
	    }, 100); }
	  });
	  // When the window loses focus, we want to show the editor as blurred
	  on(window, "blur", function () { return forEachCodeMirror(onBlur); });
	}
	// Called when the window resizes
	function onResize(cm) {
	  var d = cm.display;
	  // Might be a text scaling operation, clear size caches.
	  d.cachedCharWidth = d.cachedTextHeight = d.cachedPaddingH = null;
	  d.scrollbarsClipped = false;
	  cm.setSize();
	}

	var keyNames = {
	  3: "Pause", 8: "Backspace", 9: "Tab", 13: "Enter", 16: "Shift", 17: "Ctrl", 18: "Alt",
	  19: "Pause", 20: "CapsLock", 27: "Esc", 32: "Space", 33: "PageUp", 34: "PageDown", 35: "End",
	  36: "Home", 37: "Left", 38: "Up", 39: "Right", 40: "Down", 44: "PrintScrn", 45: "Insert",
	  46: "Delete", 59: ";", 61: "=", 91: "Mod", 92: "Mod", 93: "Mod",
	  106: "*", 107: "=", 109: "-", 110: ".", 111: "/", 127: "Delete", 145: "ScrollLock",
	  173: "-", 186: ";", 187: "=", 188: ",", 189: "-", 190: ".", 191: "/", 192: "`", 219: "[", 220: "\\",
	  221: "]", 222: "'", 63232: "Up", 63233: "Down", 63234: "Left", 63235: "Right", 63272: "Delete",
	  63273: "Home", 63275: "End", 63276: "PageUp", 63277: "PageDown", 63302: "Insert"
	};

	// Number keys
	for (var i = 0; i < 10; i++) { keyNames[i + 48] = keyNames[i + 96] = String(i); }
	// Alphabetic keys
	for (var i$1 = 65; i$1 <= 90; i$1++) { keyNames[i$1] = String.fromCharCode(i$1); }
	// Function keys
	for (var i$2 = 1; i$2 <= 12; i$2++) { keyNames[i$2 + 111] = keyNames[i$2 + 63235] = "F" + i$2; }

	var keyMap = {};

	keyMap.basic = {
	  "Left": "goCharLeft", "Right": "goCharRight", "Up": "goLineUp", "Down": "goLineDown",
	  "End": "goLineEnd", "Home": "goLineStartSmart", "PageUp": "goPageUp", "PageDown": "goPageDown",
	  "Delete": "delCharAfter", "Backspace": "delCharBefore", "Shift-Backspace": "delCharBefore",
	  "Tab": "defaultTab", "Shift-Tab": "indentAuto",
	  "Enter": "newlineAndIndent", "Insert": "toggleOverwrite",
	  "Esc": "singleSelection"
	};
	// Note that the save and find-related commands aren't defined by
	// default. User code or addons can define them. Unknown commands
	// are simply ignored.
	keyMap.pcDefault = {
	  "Ctrl-A": "selectAll", "Ctrl-D": "deleteLine", "Ctrl-Z": "undo", "Shift-Ctrl-Z": "redo", "Ctrl-Y": "redo",
	  "Ctrl-Home": "goDocStart", "Ctrl-End": "goDocEnd", "Ctrl-Up": "goLineUp", "Ctrl-Down": "goLineDown",
	  "Ctrl-Left": "goGroupLeft", "Ctrl-Right": "goGroupRight", "Alt-Left": "goLineStart", "Alt-Right": "goLineEnd",
	  "Ctrl-Backspace": "delGroupBefore", "Ctrl-Delete": "delGroupAfter", "Ctrl-S": "save", "Ctrl-F": "find",
	  "Ctrl-G": "findNext", "Shift-Ctrl-G": "findPrev", "Shift-Ctrl-F": "replace", "Shift-Ctrl-R": "replaceAll",
	  "Ctrl-[": "indentLess", "Ctrl-]": "indentMore",
	  "Ctrl-U": "undoSelection", "Shift-Ctrl-U": "redoSelection", "Alt-U": "redoSelection",
	  "fallthrough": "basic"
	};
	// Very basic readline/emacs-style bindings, which are standard on Mac.
	keyMap.emacsy = {
	  "Ctrl-F": "goCharRight", "Ctrl-B": "goCharLeft", "Ctrl-P": "goLineUp", "Ctrl-N": "goLineDown",
	  "Alt-F": "goWordRight", "Alt-B": "goWordLeft", "Ctrl-A": "goLineStart", "Ctrl-E": "goLineEnd",
	  "Ctrl-V": "goPageDown", "Shift-Ctrl-V": "goPageUp", "Ctrl-D": "delCharAfter", "Ctrl-H": "delCharBefore",
	  "Alt-D": "delWordAfter", "Alt-Backspace": "delWordBefore", "Ctrl-K": "killLine", "Ctrl-T": "transposeChars",
	  "Ctrl-O": "openLine"
	};
	keyMap.macDefault = {
	  "Cmd-A": "selectAll", "Cmd-D": "deleteLine", "Cmd-Z": "undo", "Shift-Cmd-Z": "redo", "Cmd-Y": "redo",
	  "Cmd-Home": "goDocStart", "Cmd-Up": "goDocStart", "Cmd-End": "goDocEnd", "Cmd-Down": "goDocEnd", "Alt-Left": "goGroupLeft",
	  "Alt-Right": "goGroupRight", "Cmd-Left": "goLineLeft", "Cmd-Right": "goLineRight", "Alt-Backspace": "delGroupBefore",
	  "Ctrl-Alt-Backspace": "delGroupAfter", "Alt-Delete": "delGroupAfter", "Cmd-S": "save", "Cmd-F": "find",
	  "Cmd-G": "findNext", "Shift-Cmd-G": "findPrev", "Cmd-Alt-F": "replace", "Shift-Cmd-Alt-F": "replaceAll",
	  "Cmd-[": "indentLess", "Cmd-]": "indentMore", "Cmd-Backspace": "delWrappedLineLeft", "Cmd-Delete": "delWrappedLineRight",
	  "Cmd-U": "undoSelection", "Shift-Cmd-U": "redoSelection", "Ctrl-Up": "goDocStart", "Ctrl-Down": "goDocEnd",
	  "fallthrough": ["basic", "emacsy"]
	};
	keyMap["default"] = mac ? keyMap.macDefault : keyMap.pcDefault;

	// KEYMAP DISPATCH

	function normalizeKeyName(name) {
	  var parts = name.split(/-(?!$)/);
	  name = parts[parts.length - 1];
	  var alt, ctrl, shift, cmd;
	  for (var i = 0; i < parts.length - 1; i++) {
	    var mod = parts[i];
	    if (/^(cmd|meta|m)$/i.test(mod)) { cmd = true; }
	    else if (/^a(lt)?$/i.test(mod)) { alt = true; }
	    else if (/^(c|ctrl|control)$/i.test(mod)) { ctrl = true; }
	    else if (/^s(hift)?$/i.test(mod)) { shift = true; }
	    else { throw new Error("Unrecognized modifier name: " + mod) }
	  }
	  if (alt) { name = "Alt-" + name; }
	  if (ctrl) { name = "Ctrl-" + name; }
	  if (cmd) { name = "Cmd-" + name; }
	  if (shift) { name = "Shift-" + name; }
	  return name
	}

	// This is a kludge to keep keymaps mostly working as raw objects
	// (backwards compatibility) while at the same time support features
	// like normalization and multi-stroke key bindings. It compiles a
	// new normalized keymap, and then updates the old object to reflect
	// this.
	function normalizeKeyMap(keymap) {
	  var copy = {};
	  for (var keyname in keymap) { if (keymap.hasOwnProperty(keyname)) {
	    var value = keymap[keyname];
	    if (/^(name|fallthrough|(de|at)tach)$/.test(keyname)) { continue }
	    if (value == "...") { delete keymap[keyname]; continue }

	    var keys = map(keyname.split(" "), normalizeKeyName);
	    for (var i = 0; i < keys.length; i++) {
	      var val = (void 0), name = (void 0);
	      if (i == keys.length - 1) {
	        name = keys.join(" ");
	        val = value;
	      } else {
	        name = keys.slice(0, i + 1).join(" ");
	        val = "...";
	      }
	      var prev = copy[name];
	      if (!prev) { copy[name] = val; }
	      else if (prev != val) { throw new Error("Inconsistent bindings for " + name) }
	    }
	    delete keymap[keyname];
	  } }
	  for (var prop in copy) { keymap[prop] = copy[prop]; }
	  return keymap
	}

	function lookupKey(key, map$$1, handle, context) {
	  map$$1 = getKeyMap(map$$1);
	  var found = map$$1.call ? map$$1.call(key, context) : map$$1[key];
	  if (found === false) { return "nothing" }
	  if (found === "...") { return "multi" }
	  if (found != null && handle(found)) { return "handled" }

	  if (map$$1.fallthrough) {
	    if (Object.prototype.toString.call(map$$1.fallthrough) != "[object Array]")
	      { return lookupKey(key, map$$1.fallthrough, handle, context) }
	    for (var i = 0; i < map$$1.fallthrough.length; i++) {
	      var result = lookupKey(key, map$$1.fallthrough[i], handle, context);
	      if (result) { return result }
	    }
	  }
	}

	// Modifier key presses don't count as 'real' key presses for the
	// purpose of keymap fallthrough.
	function isModifierKey(value) {
	  var name = typeof value == "string" ? value : keyNames[value.keyCode];
	  return name == "Ctrl" || name == "Alt" || name == "Shift" || name == "Mod"
	}

	function addModifierNames(name, event, noShift) {
	  var base = name;
	  if (event.altKey && base != "Alt") { name = "Alt-" + name; }
	  if ((flipCtrlCmd ? event.metaKey : event.ctrlKey) && base != "Ctrl") { name = "Ctrl-" + name; }
	  if ((flipCtrlCmd ? event.ctrlKey : event.metaKey) && base != "Cmd") { name = "Cmd-" + name; }
	  if (!noShift && event.shiftKey && base != "Shift") { name = "Shift-" + name; }
	  return name
	}

	// Look up the name of a key as indicated by an event object.
	function keyName(event, noShift) {
	  if (presto && event.keyCode == 34 && event["char"]) { return false }
	  var name = keyNames[event.keyCode];
	  if (name == null || event.altGraphKey) { return false }
	  // Ctrl-ScrollLock has keyCode 3, same as Ctrl-Pause,
	  // so we'll use event.code when available (Chrome 48+, FF 38+, Safari 10.1+)
	  if (event.keyCode == 3 && event.code) { name = event.code; }
	  return addModifierNames(name, event, noShift)
	}

	function getKeyMap(val) {
	  return typeof val == "string" ? keyMap[val] : val
	}

	// Helper for deleting text near the selection(s), used to implement
	// backspace, delete, and similar functionality.
	function deleteNearSelection(cm, compute) {
	  var ranges = cm.doc.sel.ranges, kill = [];
	  // Build up a set of ranges to kill first, merging overlapping
	  // ranges.
	  for (var i = 0; i < ranges.length; i++) {
	    var toKill = compute(ranges[i]);
	    while (kill.length && cmp(toKill.from, lst(kill).to) <= 0) {
	      var replaced = kill.pop();
	      if (cmp(replaced.from, toKill.from) < 0) {
	        toKill.from = replaced.from;
	        break
	      }
	    }
	    kill.push(toKill);
	  }
	  // Next, remove those actual ranges.
	  runInOp(cm, function () {
	    for (var i = kill.length - 1; i >= 0; i--)
	      { replaceRange(cm.doc, "", kill[i].from, kill[i].to, "+delete"); }
	    ensureCursorVisible(cm);
	  });
	}

	function moveCharLogically(line, ch, dir) {
	  var target = skipExtendingChars(line.text, ch + dir, dir);
	  return target < 0 || target > line.text.length ? null : target
	}

	function moveLogically(line, start, dir) {
	  var ch = moveCharLogically(line, start.ch, dir);
	  return ch == null ? null : new Pos(start.line, ch, dir < 0 ? "after" : "before")
	}

	function endOfLine(visually, cm, lineObj, lineNo, dir) {
	  if (visually) {
	    var order = getOrder(lineObj, cm.doc.direction);
	    if (order) {
	      var part = dir < 0 ? lst(order) : order[0];
	      var moveInStorageOrder = (dir < 0) == (part.level == 1);
	      var sticky = moveInStorageOrder ? "after" : "before";
	      var ch;
	      // With a wrapped rtl chunk (possibly spanning multiple bidi parts),
	      // it could be that the last bidi part is not on the last visual line,
	      // since visual lines contain content order-consecutive chunks.
	      // Thus, in rtl, we are looking for the first (content-order) character
	      // in the rtl chunk that is on the last line (that is, the same line
	      // as the last (content-order) character).
	      if (part.level > 0 || cm.doc.direction == "rtl") {
	        var prep = prepareMeasureForLine(cm, lineObj);
	        ch = dir < 0 ? lineObj.text.length - 1 : 0;
	        var targetTop = measureCharPrepared(cm, prep, ch).top;
	        ch = findFirst(function (ch) { return measureCharPrepared(cm, prep, ch).top == targetTop; }, (dir < 0) == (part.level == 1) ? part.from : part.to - 1, ch);
	        if (sticky == "before") { ch = moveCharLogically(lineObj, ch, 1); }
	      } else { ch = dir < 0 ? part.to : part.from; }
	      return new Pos(lineNo, ch, sticky)
	    }
	  }
	  return new Pos(lineNo, dir < 0 ? lineObj.text.length : 0, dir < 0 ? "before" : "after")
	}

	function moveVisually(cm, line, start, dir) {
	  var bidi = getOrder(line, cm.doc.direction);
	  if (!bidi) { return moveLogically(line, start, dir) }
	  if (start.ch >= line.text.length) {
	    start.ch = line.text.length;
	    start.sticky = "before";
	  } else if (start.ch <= 0) {
	    start.ch = 0;
	    start.sticky = "after";
	  }
	  var partPos = getBidiPartAt(bidi, start.ch, start.sticky), part = bidi[partPos];
	  if (cm.doc.direction == "ltr" && part.level % 2 == 0 && (dir > 0 ? part.to > start.ch : part.from < start.ch)) {
	    // Case 1: We move within an ltr part in an ltr editor. Even with wrapped lines,
	    // nothing interesting happens.
	    return moveLogically(line, start, dir)
	  }

	  var mv = function (pos, dir) { return moveCharLogically(line, pos instanceof Pos ? pos.ch : pos, dir); };
	  var prep;
	  var getWrappedLineExtent = function (ch) {
	    if (!cm.options.lineWrapping) { return {begin: 0, end: line.text.length} }
	    prep = prep || prepareMeasureForLine(cm, line);
	    return wrappedLineExtentChar(cm, line, prep, ch)
	  };
	  var wrappedLineExtent = getWrappedLineExtent(start.sticky == "before" ? mv(start, -1) : start.ch);

	  if (cm.doc.direction == "rtl" || part.level == 1) {
	    var moveInStorageOrder = (part.level == 1) == (dir < 0);
	    var ch = mv(start, moveInStorageOrder ? 1 : -1);
	    if (ch != null && (!moveInStorageOrder ? ch >= part.from && ch >= wrappedLineExtent.begin : ch <= part.to && ch <= wrappedLineExtent.end)) {
	      // Case 2: We move within an rtl part or in an rtl editor on the same visual line
	      var sticky = moveInStorageOrder ? "before" : "after";
	      return new Pos(start.line, ch, sticky)
	    }
	  }

	  // Case 3: Could not move within this bidi part in this visual line, so leave
	  // the current bidi part

	  var searchInVisualLine = function (partPos, dir, wrappedLineExtent) {
	    var getRes = function (ch, moveInStorageOrder) { return moveInStorageOrder
	      ? new Pos(start.line, mv(ch, 1), "before")
	      : new Pos(start.line, ch, "after"); };

	    for (; partPos >= 0 && partPos < bidi.length; partPos += dir) {
	      var part = bidi[partPos];
	      var moveInStorageOrder = (dir > 0) == (part.level != 1);
	      var ch = moveInStorageOrder ? wrappedLineExtent.begin : mv(wrappedLineExtent.end, -1);
	      if (part.from <= ch && ch < part.to) { return getRes(ch, moveInStorageOrder) }
	      ch = moveInStorageOrder ? part.from : mv(part.to, -1);
	      if (wrappedLineExtent.begin <= ch && ch < wrappedLineExtent.end) { return getRes(ch, moveInStorageOrder) }
	    }
	  };

	  // Case 3a: Look for other bidi parts on the same visual line
	  var res = searchInVisualLine(partPos + dir, dir, wrappedLineExtent);
	  if (res) { return res }

	  // Case 3b: Look for other bidi parts on the next visual line
	  var nextCh = dir > 0 ? wrappedLineExtent.end : mv(wrappedLineExtent.begin, -1);
	  if (nextCh != null && !(dir > 0 && nextCh == line.text.length)) {
	    res = searchInVisualLine(dir > 0 ? 0 : bidi.length - 1, dir, getWrappedLineExtent(nextCh));
	    if (res) { return res }
	  }

	  // Case 4: Nowhere to move
	  return null
	}

	// Commands are parameter-less actions that can be performed on an
	// editor, mostly used for keybindings.
	var commands = {
	  selectAll: selectAll,
	  singleSelection: function (cm) { return cm.setSelection(cm.getCursor("anchor"), cm.getCursor("head"), sel_dontScroll); },
	  killLine: function (cm) { return deleteNearSelection(cm, function (range) {
	    if (range.empty()) {
	      var len = getLine(cm.doc, range.head.line).text.length;
	      if (range.head.ch == len && range.head.line < cm.lastLine())
	        { return {from: range.head, to: Pos(range.head.line + 1, 0)} }
	      else
	        { return {from: range.head, to: Pos(range.head.line, len)} }
	    } else {
	      return {from: range.from(), to: range.to()}
	    }
	  }); },
	  deleteLine: function (cm) { return deleteNearSelection(cm, function (range) { return ({
	    from: Pos(range.from().line, 0),
	    to: clipPos(cm.doc, Pos(range.to().line + 1, 0))
	  }); }); },
	  delLineLeft: function (cm) { return deleteNearSelection(cm, function (range) { return ({
	    from: Pos(range.from().line, 0), to: range.from()
	  }); }); },
	  delWrappedLineLeft: function (cm) { return deleteNearSelection(cm, function (range) {
	    var top = cm.charCoords(range.head, "div").top + 5;
	    var leftPos = cm.coordsChar({left: 0, top: top}, "div");
	    return {from: leftPos, to: range.from()}
	  }); },
	  delWrappedLineRight: function (cm) { return deleteNearSelection(cm, function (range) {
	    var top = cm.charCoords(range.head, "div").top + 5;
	    var rightPos = cm.coordsChar({left: cm.display.lineDiv.offsetWidth + 100, top: top}, "div");
	    return {from: range.from(), to: rightPos }
	  }); },
	  undo: function (cm) { return cm.undo(); },
	  redo: function (cm) { return cm.redo(); },
	  undoSelection: function (cm) { return cm.undoSelection(); },
	  redoSelection: function (cm) { return cm.redoSelection(); },
	  goDocStart: function (cm) { return cm.extendSelection(Pos(cm.firstLine(), 0)); },
	  goDocEnd: function (cm) { return cm.extendSelection(Pos(cm.lastLine())); },
	  goLineStart: function (cm) { return cm.extendSelectionsBy(function (range) { return lineStart(cm, range.head.line); },
	    {origin: "+move", bias: 1}
	  ); },
	  goLineStartSmart: function (cm) { return cm.extendSelectionsBy(function (range) { return lineStartSmart(cm, range.head); },
	    {origin: "+move", bias: 1}
	  ); },
	  goLineEnd: function (cm) { return cm.extendSelectionsBy(function (range) { return lineEnd(cm, range.head.line); },
	    {origin: "+move", bias: -1}
	  ); },
	  goLineRight: function (cm) { return cm.extendSelectionsBy(function (range) {
	    var top = cm.cursorCoords(range.head, "div").top + 5;
	    return cm.coordsChar({left: cm.display.lineDiv.offsetWidth + 100, top: top}, "div")
	  }, sel_move); },
	  goLineLeft: function (cm) { return cm.extendSelectionsBy(function (range) {
	    var top = cm.cursorCoords(range.head, "div").top + 5;
	    return cm.coordsChar({left: 0, top: top}, "div")
	  }, sel_move); },
	  goLineLeftSmart: function (cm) { return cm.extendSelectionsBy(function (range) {
	    var top = cm.cursorCoords(range.head, "div").top + 5;
	    var pos = cm.coordsChar({left: 0, top: top}, "div");
	    if (pos.ch < cm.getLine(pos.line).search(/\S/)) { return lineStartSmart(cm, range.head) }
	    return pos
	  }, sel_move); },
	  goLineUp: function (cm) { return cm.moveV(-1, "line"); },
	  goLineDown: function (cm) { return cm.moveV(1, "line"); },
	  goPageUp: function (cm) { return cm.moveV(-1, "page"); },
	  goPageDown: function (cm) { return cm.moveV(1, "page"); },
	  goCharLeft: function (cm) { return cm.moveH(-1, "char"); },
	  goCharRight: function (cm) { return cm.moveH(1, "char"); },
	  goColumnLeft: function (cm) { return cm.moveH(-1, "column"); },
	  goColumnRight: function (cm) { return cm.moveH(1, "column"); },
	  goWordLeft: function (cm) { return cm.moveH(-1, "word"); },
	  goGroupRight: function (cm) { return cm.moveH(1, "group"); },
	  goGroupLeft: function (cm) { return cm.moveH(-1, "group"); },
	  goWordRight: function (cm) { return cm.moveH(1, "word"); },
	  delCharBefore: function (cm) { return cm.deleteH(-1, "char"); },
	  delCharAfter: function (cm) { return cm.deleteH(1, "char"); },
	  delWordBefore: function (cm) { return cm.deleteH(-1, "word"); },
	  delWordAfter: function (cm) { return cm.deleteH(1, "word"); },
	  delGroupBefore: function (cm) { return cm.deleteH(-1, "group"); },
	  delGroupAfter: function (cm) { return cm.deleteH(1, "group"); },
	  indentAuto: function (cm) { return cm.indentSelection("smart"); },
	  indentMore: function (cm) { return cm.indentSelection("add"); },
	  indentLess: function (cm) { return cm.indentSelection("subtract"); },
	  insertTab: function (cm) { return cm.replaceSelection("\t"); },
	  insertSoftTab: function (cm) {
	    var spaces = [], ranges = cm.listSelections(), tabSize = cm.options.tabSize;
	    for (var i = 0; i < ranges.length; i++) {
	      var pos = ranges[i].from();
	      var col = countColumn(cm.getLine(pos.line), pos.ch, tabSize);
	      spaces.push(spaceStr(tabSize - col % tabSize));
	    }
	    cm.replaceSelections(spaces);
	  },
	  defaultTab: function (cm) {
	    if (cm.somethingSelected()) { cm.indentSelection("add"); }
	    else { cm.execCommand("insertTab"); }
	  },
	  // Swap the two chars left and right of each selection's head.
	  // Move cursor behind the two swapped characters afterwards.
	  //
	  // Doesn't consider line feeds a character.
	  // Doesn't scan more than one line above to find a character.
	  // Doesn't do anything on an empty line.
	  // Doesn't do anything with non-empty selections.
	  transposeChars: function (cm) { return runInOp(cm, function () {
	    var ranges = cm.listSelections(), newSel = [];
	    for (var i = 0; i < ranges.length; i++) {
	      if (!ranges[i].empty()) { continue }
	      var cur = ranges[i].head, line = getLine(cm.doc, cur.line).text;
	      if (line) {
	        if (cur.ch == line.length) { cur = new Pos(cur.line, cur.ch - 1); }
	        if (cur.ch > 0) {
	          cur = new Pos(cur.line, cur.ch + 1);
	          cm.replaceRange(line.charAt(cur.ch - 1) + line.charAt(cur.ch - 2),
	                          Pos(cur.line, cur.ch - 2), cur, "+transpose");
	        } else if (cur.line > cm.doc.first) {
	          var prev = getLine(cm.doc, cur.line - 1).text;
	          if (prev) {
	            cur = new Pos(cur.line, 1);
	            cm.replaceRange(line.charAt(0) + cm.doc.lineSeparator() +
	                            prev.charAt(prev.length - 1),
	                            Pos(cur.line - 1, prev.length - 1), cur, "+transpose");
	          }
	        }
	      }
	      newSel.push(new Range(cur, cur));
	    }
	    cm.setSelections(newSel);
	  }); },
	  newlineAndIndent: function (cm) { return runInOp(cm, function () {
	    var sels = cm.listSelections();
	    for (var i = sels.length - 1; i >= 0; i--)
	      { cm.replaceRange(cm.doc.lineSeparator(), sels[i].anchor, sels[i].head, "+input"); }
	    sels = cm.listSelections();
	    for (var i$1 = 0; i$1 < sels.length; i$1++)
	      { cm.indentLine(sels[i$1].from().line, null, true); }
	    ensureCursorVisible(cm);
	  }); },
	  openLine: function (cm) { return cm.replaceSelection("\n", "start"); },
	  toggleOverwrite: function (cm) { return cm.toggleOverwrite(); }
	};


	function lineStart(cm, lineN) {
	  var line = getLine(cm.doc, lineN);
	  var visual = visualLine(line);
	  if (visual != line) { lineN = lineNo(visual); }
	  return endOfLine(true, cm, visual, lineN, 1)
	}
	function lineEnd(cm, lineN) {
	  var line = getLine(cm.doc, lineN);
	  var visual = visualLineEnd(line);
	  if (visual != line) { lineN = lineNo(visual); }
	  return endOfLine(true, cm, line, lineN, -1)
	}
	function lineStartSmart(cm, pos) {
	  var start = lineStart(cm, pos.line);
	  var line = getLine(cm.doc, start.line);
	  var order = getOrder(line, cm.doc.direction);
	  if (!order || order[0].level == 0) {
	    var firstNonWS = Math.max(0, line.text.search(/\S/));
	    var inWS = pos.line == start.line && pos.ch <= firstNonWS && pos.ch;
	    return Pos(start.line, inWS ? 0 : firstNonWS, start.sticky)
	  }
	  return start
	}

	// Run a handler that was bound to a key.
	function doHandleBinding(cm, bound, dropShift) {
	  if (typeof bound == "string") {
	    bound = commands[bound];
	    if (!bound) { return false }
	  }
	  // Ensure previous input has been read, so that the handler sees a
	  // consistent view of the document
	  cm.display.input.ensurePolled();
	  var prevShift = cm.display.shift, done = false;
	  try {
	    if (cm.isReadOnly()) { cm.state.suppressEdits = true; }
	    if (dropShift) { cm.display.shift = false; }
	    done = bound(cm) != Pass;
	  } finally {
	    cm.display.shift = prevShift;
	    cm.state.suppressEdits = false;
	  }
	  return done
	}

	function lookupKeyForEditor(cm, name, handle) {
	  for (var i = 0; i < cm.state.keyMaps.length; i++) {
	    var result = lookupKey(name, cm.state.keyMaps[i], handle, cm);
	    if (result) { return result }
	  }
	  return (cm.options.extraKeys && lookupKey(name, cm.options.extraKeys, handle, cm))
	    || lookupKey(name, cm.options.keyMap, handle, cm)
	}

	// Note that, despite the name, this function is also used to check
	// for bound mouse clicks.

	var stopSeq = new Delayed;

	function dispatchKey(cm, name, e, handle) {
	  var seq = cm.state.keySeq;
	  if (seq) {
	    if (isModifierKey(name)) { return "handled" }
	    if (/\'$/.test(name))
	      { cm.state.keySeq = null; }
	    else
	      { stopSeq.set(50, function () {
	        if (cm.state.keySeq == seq) {
	          cm.state.keySeq = null;
	          cm.display.input.reset();
	        }
	      }); }
	    if (dispatchKeyInner(cm, seq + " " + name, e, handle)) { return true }
	  }
	  return dispatchKeyInner(cm, name, e, handle)
	}

	function dispatchKeyInner(cm, name, e, handle) {
	  var result = lookupKeyForEditor(cm, name, handle);

	  if (result == "multi")
	    { cm.state.keySeq = name; }
	  if (result == "handled")
	    { signalLater(cm, "keyHandled", cm, name, e); }

	  if (result == "handled" || result == "multi") {
	    e_preventDefault(e);
	    restartBlink(cm);
	  }

	  return !!result
	}

	// Handle a key from the keydown event.
	function handleKeyBinding(cm, e) {
	  var name = keyName(e, true);
	  if (!name) { return false }

	  if (e.shiftKey && !cm.state.keySeq) {
	    // First try to resolve full name (including 'Shift-'). Failing
	    // that, see if there is a cursor-motion command (starting with
	    // 'go') bound to the keyname without 'Shift-'.
	    return dispatchKey(cm, "Shift-" + name, e, function (b) { return doHandleBinding(cm, b, true); })
	        || dispatchKey(cm, name, e, function (b) {
	             if (typeof b == "string" ? /^go[A-Z]/.test(b) : b.motion)
	               { return doHandleBinding(cm, b) }
	           })
	  } else {
	    return dispatchKey(cm, name, e, function (b) { return doHandleBinding(cm, b); })
	  }
	}

	// Handle a key from the keypress event
	function handleCharBinding(cm, e, ch) {
	  return dispatchKey(cm, "'" + ch + "'", e, function (b) { return doHandleBinding(cm, b, true); })
	}

	var lastStoppedKey = null;
	function onKeyDown(e) {
	  var cm = this;
	  cm.curOp.focus = activeElt();
	  if (signalDOMEvent(cm, e)) { return }
	  // IE does strange things with escape.
	  if (ie && ie_version < 11 && e.keyCode == 27) { e.returnValue = false; }
	  var code = e.keyCode;
	  cm.display.shift = code == 16 || e.shiftKey;
	  var handled = handleKeyBinding(cm, e);
	  if (presto) {
	    lastStoppedKey = handled ? code : null;
	    // Opera has no cut event... we try to at least catch the key combo
	    if (!handled && code == 88 && !hasCopyEvent && (mac ? e.metaKey : e.ctrlKey))
	      { cm.replaceSelection("", null, "cut"); }
	  }

	  // Turn mouse into crosshair when Alt is held on Mac.
	  if (code == 18 && !/\bCodeMirror-crosshair\b/.test(cm.display.lineDiv.className))
	    { showCrossHair(cm); }
	}

	function showCrossHair(cm) {
	  var lineDiv = cm.display.lineDiv;
	  addClass(lineDiv, "CodeMirror-crosshair");

	  function up(e) {
	    if (e.keyCode == 18 || !e.altKey) {
	      rmClass(lineDiv, "CodeMirror-crosshair");
	      off(document, "keyup", up);
	      off(document, "mouseover", up);
	    }
	  }
	  on(document, "keyup", up);
	  on(document, "mouseover", up);
	}

	function onKeyUp(e) {
	  if (e.keyCode == 16) { this.doc.sel.shift = false; }
	  signalDOMEvent(this, e);
	}

	function onKeyPress(e) {
	  var cm = this;
	  if (eventInWidget(cm.display, e) || signalDOMEvent(cm, e) || e.ctrlKey && !e.altKey || mac && e.metaKey) { return }
	  var keyCode = e.keyCode, charCode = e.charCode;
	  if (presto && keyCode == lastStoppedKey) {lastStoppedKey = null; e_preventDefault(e); return}
	  if ((presto && (!e.which || e.which < 10)) && handleKeyBinding(cm, e)) { return }
	  var ch = String.fromCharCode(charCode == null ? keyCode : charCode);
	  // Some browsers fire keypress events for backspace
	  if (ch == "\x08") { return }
	  if (handleCharBinding(cm, e, ch)) { return }
	  cm.display.input.onKeyPress(e);
	}

	var DOUBLECLICK_DELAY = 400;

	var PastClick = function(time, pos, button) {
	  this.time = time;
	  this.pos = pos;
	  this.button = button;
	};

	PastClick.prototype.compare = function (time, pos, button) {
	  return this.time + DOUBLECLICK_DELAY > time &&
	    cmp(pos, this.pos) == 0 && button == this.button
	};

	var lastClick;
	var lastDoubleClick;
	function clickRepeat(pos, button) {
	  var now = +new Date;
	  if (lastDoubleClick && lastDoubleClick.compare(now, pos, button)) {
	    lastClick = lastDoubleClick = null;
	    return "triple"
	  } else if (lastClick && lastClick.compare(now, pos, button)) {
	    lastDoubleClick = new PastClick(now, pos, button);
	    lastClick = null;
	    return "double"
	  } else {
	    lastClick = new PastClick(now, pos, button);
	    lastDoubleClick = null;
	    return "single"
	  }
	}

	// A mouse down can be a single click, double click, triple click,
	// start of selection drag, start of text drag, new cursor
	// (ctrl-click), rectangle drag (alt-drag), or xwin
	// middle-click-paste. Or it might be a click on something we should
	// not interfere with, such as a scrollbar or widget.
	function onMouseDown(e) {
	  var cm = this, display = cm.display;
	  if (signalDOMEvent(cm, e) || display.activeTouch && display.input.supportsTouch()) { return }
	  display.input.ensurePolled();
	  display.shift = e.shiftKey;

	  if (eventInWidget(display, e)) {
	    if (!webkit) {
	      // Briefly turn off draggability, to allow widgets to do
	      // normal dragging things.
	      display.scroller.draggable = false;
	      setTimeout(function () { return display.scroller.draggable = true; }, 100);
	    }
	    return
	  }
	  var button = e_button(e);
	  if (button == 3 && captureRightClick ? contextMenuInGutter(cm, e) : clickInGutter(cm, e)) { return }
	  var pos = posFromMouse(cm, e), repeat = pos ? clickRepeat(pos, button) : "single";
	  window.focus();

	  // #3261: make sure, that we're not starting a second selection
	  if (button == 1 && cm.state.selectingText)
	    { cm.state.selectingText(e); }

	  if (pos && handleMappedButton(cm, button, pos, repeat, e)) { return }

	  if (button == 1) {
	    if (pos) { leftButtonDown(cm, pos, repeat, e); }
	    else if (e_target(e) == display.scroller) { e_preventDefault(e); }
	  } else if (button == 2) {
	    if (pos) { extendSelection(cm.doc, pos); }
	    setTimeout(function () { return display.input.focus(); }, 20);
	  } else if (button == 3) {
	    if (captureRightClick) { onContextMenu(cm, e); }
	    else { delayBlurEvent(cm); }
	  }
	}

	function handleMappedButton(cm, button, pos, repeat, event) {
	  var name = "Click";
	  if (repeat == "double") { name = "Double" + name; }
	  else if (repeat == "triple") { name = "Triple" + name; }
	  name = (button == 1 ? "Left" : button == 2 ? "Middle" : "Right") + name;

	  return dispatchKey(cm,  addModifierNames(name, event), event, function (bound) {
	    if (typeof bound == "string") { bound = commands[bound]; }
	    if (!bound) { return false }
	    var done = false;
	    try {
	      if (cm.isReadOnly()) { cm.state.suppressEdits = true; }
	      done = bound(cm, pos) != Pass;
	    } finally {
	      cm.state.suppressEdits = false;
	    }
	    return done
	  })
	}

	function configureMouse(cm, repeat, event) {
	  var option = cm.getOption("configureMouse");
	  var value = option ? option(cm, repeat, event) : {};
	  if (value.unit == null) {
	    var rect = chromeOS ? event.shiftKey && event.metaKey : event.altKey;
	    value.unit = rect ? "rectangle" : repeat == "single" ? "char" : repeat == "double" ? "word" : "line";
	  }
	  if (value.extend == null || cm.doc.extend) { value.extend = cm.doc.extend || event.shiftKey; }
	  if (value.addNew == null) { value.addNew = mac ? event.metaKey : event.ctrlKey; }
	  if (value.moveOnDrag == null) { value.moveOnDrag = !(mac ? event.altKey : event.ctrlKey); }
	  return value
	}

	function leftButtonDown(cm, pos, repeat, event) {
	  if (ie) { setTimeout(bind(ensureFocus, cm), 0); }
	  else { cm.curOp.focus = activeElt(); }

	  var behavior = configureMouse(cm, repeat, event);

	  var sel = cm.doc.sel, contained;
	  if (cm.options.dragDrop && dragAndDrop && !cm.isReadOnly() &&
	      repeat == "single" && (contained = sel.contains(pos)) > -1 &&
	      (cmp((contained = sel.ranges[contained]).from(), pos) < 0 || pos.xRel > 0) &&
	      (cmp(contained.to(), pos) > 0 || pos.xRel < 0))
	    { leftButtonStartDrag(cm, event, pos, behavior); }
	  else
	    { leftButtonSelect(cm, event, pos, behavior); }
	}

	// Start a text drag. When it ends, see if any dragging actually
	// happen, and treat as a click if it didn't.
	function leftButtonStartDrag(cm, event, pos, behavior) {
	  var display = cm.display, moved = false;
	  var dragEnd = operation(cm, function (e) {
	    if (webkit) { display.scroller.draggable = false; }
	    cm.state.draggingText = false;
	    off(display.wrapper.ownerDocument, "mouseup", dragEnd);
	    off(display.wrapper.ownerDocument, "mousemove", mouseMove);
	    off(display.scroller, "dragstart", dragStart);
	    off(display.scroller, "drop", dragEnd);
	    if (!moved) {
	      e_preventDefault(e);
	      if (!behavior.addNew)
	        { extendSelection(cm.doc, pos, null, null, behavior.extend); }
	      // Work around unexplainable focus problem in IE9 (#2127) and Chrome (#3081)
	      if (webkit || ie && ie_version == 9)
	        { setTimeout(function () {display.wrapper.ownerDocument.body.focus(); display.input.focus();}, 20); }
	      else
	        { display.input.focus(); }
	    }
	  });
	  var mouseMove = function(e2) {
	    moved = moved || Math.abs(event.clientX - e2.clientX) + Math.abs(event.clientY - e2.clientY) >= 10;
	  };
	  var dragStart = function () { return moved = true; };
	  // Let the drag handler handle this.
	  if (webkit) { display.scroller.draggable = true; }
	  cm.state.draggingText = dragEnd;
	  dragEnd.copy = !behavior.moveOnDrag;
	  // IE's approach to draggable
	  if (display.scroller.dragDrop) { display.scroller.dragDrop(); }
	  on(display.wrapper.ownerDocument, "mouseup", dragEnd);
	  on(display.wrapper.ownerDocument, "mousemove", mouseMove);
	  on(display.scroller, "dragstart", dragStart);
	  on(display.scroller, "drop", dragEnd);

	  delayBlurEvent(cm);
	  setTimeout(function () { return display.input.focus(); }, 20);
	}

	function rangeForUnit(cm, pos, unit) {
	  if (unit == "char") { return new Range(pos, pos) }
	  if (unit == "word") { return cm.findWordAt(pos) }
	  if (unit == "line") { return new Range(Pos(pos.line, 0), clipPos(cm.doc, Pos(pos.line + 1, 0))) }
	  var result = unit(cm, pos);
	  return new Range(result.from, result.to)
	}

	// Normal selection, as opposed to text dragging.
	function leftButtonSelect(cm, event, start, behavior) {
	  var display = cm.display, doc = cm.doc;
	  e_preventDefault(event);

	  var ourRange, ourIndex, startSel = doc.sel, ranges = startSel.ranges;
	  if (behavior.addNew && !behavior.extend) {
	    ourIndex = doc.sel.contains(start);
	    if (ourIndex > -1)
	      { ourRange = ranges[ourIndex]; }
	    else
	      { ourRange = new Range(start, start); }
	  } else {
	    ourRange = doc.sel.primary();
	    ourIndex = doc.sel.primIndex;
	  }

	  if (behavior.unit == "rectangle") {
	    if (!behavior.addNew) { ourRange = new Range(start, start); }
	    start = posFromMouse(cm, event, true, true);
	    ourIndex = -1;
	  } else {
	    var range$$1 = rangeForUnit(cm, start, behavior.unit);
	    if (behavior.extend)
	      { ourRange = extendRange(ourRange, range$$1.anchor, range$$1.head, behavior.extend); }
	    else
	      { ourRange = range$$1; }
	  }

	  if (!behavior.addNew) {
	    ourIndex = 0;
	    setSelection(doc, new Selection([ourRange], 0), sel_mouse);
	    startSel = doc.sel;
	  } else if (ourIndex == -1) {
	    ourIndex = ranges.length;
	    setSelection(doc, normalizeSelection(ranges.concat([ourRange]), ourIndex),
	                 {scroll: false, origin: "*mouse"});
	  } else if (ranges.length > 1 && ranges[ourIndex].empty() && behavior.unit == "char" && !behavior.extend) {
	    setSelection(doc, normalizeSelection(ranges.slice(0, ourIndex).concat(ranges.slice(ourIndex + 1)), 0),
	                 {scroll: false, origin: "*mouse"});
	    startSel = doc.sel;
	  } else {
	    replaceOneSelection(doc, ourIndex, ourRange, sel_mouse);
	  }

	  var lastPos = start;
	  function extendTo(pos) {
	    if (cmp(lastPos, pos) == 0) { return }
	    lastPos = pos;

	    if (behavior.unit == "rectangle") {
	      var ranges = [], tabSize = cm.options.tabSize;
	      var startCol = countColumn(getLine(doc, start.line).text, start.ch, tabSize);
	      var posCol = countColumn(getLine(doc, pos.line).text, pos.ch, tabSize);
	      var left = Math.min(startCol, posCol), right = Math.max(startCol, posCol);
	      for (var line = Math.min(start.line, pos.line), end = Math.min(cm.lastLine(), Math.max(start.line, pos.line));
	           line <= end; line++) {
	        var text = getLine(doc, line).text, leftPos = findColumn(text, left, tabSize);
	        if (left == right)
	          { ranges.push(new Range(Pos(line, leftPos), Pos(line, leftPos))); }
	        else if (text.length > leftPos)
	          { ranges.push(new Range(Pos(line, leftPos), Pos(line, findColumn(text, right, tabSize)))); }
	      }
	      if (!ranges.length) { ranges.push(new Range(start, start)); }
	      setSelection(doc, normalizeSelection(startSel.ranges.slice(0, ourIndex).concat(ranges), ourIndex),
	                   {origin: "*mouse", scroll: false});
	      cm.scrollIntoView(pos);
	    } else {
	      var oldRange = ourRange;
	      var range$$1 = rangeForUnit(cm, pos, behavior.unit);
	      var anchor = oldRange.anchor, head;
	      if (cmp(range$$1.anchor, anchor) > 0) {
	        head = range$$1.head;
	        anchor = minPos(oldRange.from(), range$$1.anchor);
	      } else {
	        head = range$$1.anchor;
	        anchor = maxPos(oldRange.to(), range$$1.head);
	      }
	      var ranges$1 = startSel.ranges.slice(0);
	      ranges$1[ourIndex] = bidiSimplify(cm, new Range(clipPos(doc, anchor), head));
	      setSelection(doc, normalizeSelection(ranges$1, ourIndex), sel_mouse);
	    }
	  }

	  var editorSize = display.wrapper.getBoundingClientRect();
	  // Used to ensure timeout re-tries don't fire when another extend
	  // happened in the meantime (clearTimeout isn't reliable -- at
	  // least on Chrome, the timeouts still happen even when cleared,
	  // if the clear happens after their scheduled firing time).
	  var counter = 0;

	  function extend(e) {
	    var curCount = ++counter;
	    var cur = posFromMouse(cm, e, true, behavior.unit == "rectangle");
	    if (!cur) { return }
	    if (cmp(cur, lastPos) != 0) {
	      cm.curOp.focus = activeElt();
	      extendTo(cur);
	      var visible = visibleLines(display, doc);
	      if (cur.line >= visible.to || cur.line < visible.from)
	        { setTimeout(operation(cm, function () {if (counter == curCount) { extend(e); }}), 150); }
	    } else {
	      var outside = e.clientY < editorSize.top ? -20 : e.clientY > editorSize.bottom ? 20 : 0;
	      if (outside) { setTimeout(operation(cm, function () {
	        if (counter != curCount) { return }
	        display.scroller.scrollTop += outside;
	        extend(e);
	      }), 50); }
	    }
	  }

	  function done(e) {
	    cm.state.selectingText = false;
	    counter = Infinity;
	    e_preventDefault(e);
	    display.input.focus();
	    off(display.wrapper.ownerDocument, "mousemove", move);
	    off(display.wrapper.ownerDocument, "mouseup", up);
	    doc.history.lastSelOrigin = null;
	  }

	  var move = operation(cm, function (e) {
	    if (e.buttons === 0 || !e_button(e)) { done(e); }
	    else { extend(e); }
	  });
	  var up = operation(cm, done);
	  cm.state.selectingText = up;
	  on(display.wrapper.ownerDocument, "mousemove", move);
	  on(display.wrapper.ownerDocument, "mouseup", up);
	}

	// Used when mouse-selecting to adjust the anchor to the proper side
	// of a bidi jump depending on the visual position of the head.
	function bidiSimplify(cm, range$$1) {
	  var anchor = range$$1.anchor;
	  var head = range$$1.head;
	  var anchorLine = getLine(cm.doc, anchor.line);
	  if (cmp(anchor, head) == 0 && anchor.sticky == head.sticky) { return range$$1 }
	  var order = getOrder(anchorLine);
	  if (!order) { return range$$1 }
	  var index = getBidiPartAt(order, anchor.ch, anchor.sticky), part = order[index];
	  if (part.from != anchor.ch && part.to != anchor.ch) { return range$$1 }
	  var boundary = index + ((part.from == anchor.ch) == (part.level != 1) ? 0 : 1);
	  if (boundary == 0 || boundary == order.length) { return range$$1 }

	  // Compute the relative visual position of the head compared to the
	  // anchor (<0 is to the left, >0 to the right)
	  var leftSide;
	  if (head.line != anchor.line) {
	    leftSide = (head.line - anchor.line) * (cm.doc.direction == "ltr" ? 1 : -1) > 0;
	  } else {
	    var headIndex = getBidiPartAt(order, head.ch, head.sticky);
	    var dir = headIndex - index || (head.ch - anchor.ch) * (part.level == 1 ? -1 : 1);
	    if (headIndex == boundary - 1 || headIndex == boundary)
	      { leftSide = dir < 0; }
	    else
	      { leftSide = dir > 0; }
	  }

	  var usePart = order[boundary + (leftSide ? -1 : 0)];
	  var from = leftSide == (usePart.level == 1);
	  var ch = from ? usePart.from : usePart.to, sticky = from ? "after" : "before";
	  return anchor.ch == ch && anchor.sticky == sticky ? range$$1 : new Range(new Pos(anchor.line, ch, sticky), head)
	}


	// Determines whether an event happened in the gutter, and fires the
	// handlers for the corresponding event.
	function gutterEvent(cm, e, type, prevent) {
	  var mX, mY;
	  if (e.touches) {
	    mX = e.touches[0].clientX;
	    mY = e.touches[0].clientY;
	  } else {
	    try { mX = e.clientX; mY = e.clientY; }
	    catch(e) { return false }
	  }
	  if (mX >= Math.floor(cm.display.gutters.getBoundingClientRect().right)) { return false }
	  if (prevent) { e_preventDefault(e); }

	  var display = cm.display;
	  var lineBox = display.lineDiv.getBoundingClientRect();

	  if (mY > lineBox.bottom || !hasHandler(cm, type)) { return e_defaultPrevented(e) }
	  mY -= lineBox.top - display.viewOffset;

	  for (var i = 0; i < cm.options.gutters.length; ++i) {
	    var g = display.gutters.childNodes[i];
	    if (g && g.getBoundingClientRect().right >= mX) {
	      var line = lineAtHeight(cm.doc, mY);
	      var gutter = cm.options.gutters[i];
	      signal(cm, type, cm, line, gutter, e);
	      return e_defaultPrevented(e)
	    }
	  }
	}

	function clickInGutter(cm, e) {
	  return gutterEvent(cm, e, "gutterClick", true)
	}

	// CONTEXT MENU HANDLING

	// To make the context menu work, we need to briefly unhide the
	// textarea (making it as unobtrusive as possible) to let the
	// right-click take effect on it.
	function onContextMenu(cm, e) {
	  if (eventInWidget(cm.display, e) || contextMenuInGutter(cm, e)) { return }
	  if (signalDOMEvent(cm, e, "contextmenu")) { return }
	  cm.display.input.onContextMenu(e);
	}

	function contextMenuInGutter(cm, e) {
	  if (!hasHandler(cm, "gutterContextMenu")) { return false }
	  return gutterEvent(cm, e, "gutterContextMenu", false)
	}

	function themeChanged(cm) {
	  cm.display.wrapper.className = cm.display.wrapper.className.replace(/\s*cm-s-\S+/g, "") +
	    cm.options.theme.replace(/(^|\s)\s*/g, " cm-s-");
	  clearCaches(cm);
	}

	var Init = {toString: function(){return "CodeMirror.Init"}};

	var defaults = {};
	var optionHandlers = {};

	function defineOptions(CodeMirror) {
	  var optionHandlers = CodeMirror.optionHandlers;

	  function option(name, deflt, handle, notOnInit) {
	    CodeMirror.defaults[name] = deflt;
	    if (handle) { optionHandlers[name] =
	      notOnInit ? function (cm, val, old) {if (old != Init) { handle(cm, val, old); }} : handle; }
	  }

	  CodeMirror.defineOption = option;

	  // Passed to option handlers when there is no old value.
	  CodeMirror.Init = Init;

	  // These two are, on init, called from the constructor because they
	  // have to be initialized before the editor can start at all.
	  option("value", "", function (cm, val) { return cm.setValue(val); }, true);
	  option("mode", null, function (cm, val) {
	    cm.doc.modeOption = val;
	    loadMode(cm);
	  }, true);

	  option("indentUnit", 2, loadMode, true);
	  option("indentWithTabs", false);
	  option("smartIndent", true);
	  option("tabSize", 4, function (cm) {
	    resetModeState(cm);
	    clearCaches(cm);
	    regChange(cm);
	  }, true);

	  option("lineSeparator", null, function (cm, val) {
	    cm.doc.lineSep = val;
	    if (!val) { return }
	    var newBreaks = [], lineNo = cm.doc.first;
	    cm.doc.iter(function (line) {
	      for (var pos = 0;;) {
	        var found = line.text.indexOf(val, pos);
	        if (found == -1) { break }
	        pos = found + val.length;
	        newBreaks.push(Pos(lineNo, found));
	      }
	      lineNo++;
	    });
	    for (var i = newBreaks.length - 1; i >= 0; i--)
	      { replaceRange(cm.doc, val, newBreaks[i], Pos(newBreaks[i].line, newBreaks[i].ch + val.length)); }
	  });
	  option("specialChars", /[\u0000-\u001f\u007f-\u009f\u00ad\u061c\u200b-\u200f\u2028\u2029\ufeff]/g, function (cm, val, old) {
	    cm.state.specialChars = new RegExp(val.source + (val.test("\t") ? "" : "|\t"), "g");
	    if (old != Init) { cm.refresh(); }
	  });
	  option("specialCharPlaceholder", defaultSpecialCharPlaceholder, function (cm) { return cm.refresh(); }, true);
	  option("electricChars", true);
	  option("inputStyle", mobile ? "contenteditable" : "textarea", function () {
	    throw new Error("inputStyle can not (yet) be changed in a running editor") // FIXME
	  }, true);
	  option("spellcheck", false, function (cm, val) { return cm.getInputField().spellcheck = val; }, true);
	  option("rtlMoveVisually", !windows);
	  option("wholeLineUpdateBefore", true);

	  option("theme", "default", function (cm) {
	    themeChanged(cm);
	    guttersChanged(cm);
	  }, true);
	  option("keyMap", "default", function (cm, val, old) {
	    var next = getKeyMap(val);
	    var prev = old != Init && getKeyMap(old);
	    if (prev && prev.detach) { prev.detach(cm, next); }
	    if (next.attach) { next.attach(cm, prev || null); }
	  });
	  option("extraKeys", null);
	  option("configureMouse", null);

	  option("lineWrapping", false, wrappingChanged, true);
	  option("gutters", [], function (cm) {
	    setGuttersForLineNumbers(cm.options);
	    guttersChanged(cm);
	  }, true);
	  option("fixedGutter", true, function (cm, val) {
	    cm.display.gutters.style.left = val ? compensateForHScroll(cm.display) + "px" : "0";
	    cm.refresh();
	  }, true);
	  option("coverGutterNextToScrollbar", false, function (cm) { return updateScrollbars(cm); }, true);
	  option("scrollbarStyle", "native", function (cm) {
	    initScrollbars(cm);
	    updateScrollbars(cm);
	    cm.display.scrollbars.setScrollTop(cm.doc.scrollTop);
	    cm.display.scrollbars.setScrollLeft(cm.doc.scrollLeft);
	  }, true);
	  option("lineNumbers", false, function (cm) {
	    setGuttersForLineNumbers(cm.options);
	    guttersChanged(cm);
	  }, true);
	  option("firstLineNumber", 1, guttersChanged, true);
	  option("lineNumberFormatter", function (integer) { return integer; }, guttersChanged, true);
	  option("showCursorWhenSelecting", false, updateSelection, true);

	  option("resetSelectionOnContextMenu", true);
	  option("lineWiseCopyCut", true);
	  option("pasteLinesPerSelection", true);

	  option("readOnly", false, function (cm, val) {
	    if (val == "nocursor") {
	      onBlur(cm);
	      cm.display.input.blur();
	    }
	    cm.display.input.readOnlyChanged(val);
	  });
	  option("disableInput", false, function (cm, val) {if (!val) { cm.display.input.reset(); }}, true);
	  option("dragDrop", true, dragDropChanged);
	  option("allowDropFileTypes", null);

	  option("cursorBlinkRate", 530);
	  option("cursorScrollMargin", 0);
	  option("cursorHeight", 1, updateSelection, true);
	  option("singleCursorHeightPerLine", true, updateSelection, true);
	  option("workTime", 100);
	  option("workDelay", 100);
	  option("flattenSpans", true, resetModeState, true);
	  option("addModeClass", false, resetModeState, true);
	  option("pollInterval", 100);
	  option("undoDepth", 200, function (cm, val) { return cm.doc.history.undoDepth = val; });
	  option("historyEventDelay", 1250);
	  option("viewportMargin", 10, function (cm) { return cm.refresh(); }, true);
	  option("maxHighlightLength", 10000, resetModeState, true);
	  option("moveInputWithCursor", true, function (cm, val) {
	    if (!val) { cm.display.input.resetPosition(); }
	  });

	  option("tabindex", null, function (cm, val) { return cm.display.input.getField().tabIndex = val || ""; });
	  option("autofocus", null);
	  option("direction", "ltr", function (cm, val) { return cm.doc.setDirection(val); }, true);
	  option("phrases", null);
	}

	function guttersChanged(cm) {
	  updateGutters(cm);
	  regChange(cm);
	  alignHorizontally(cm);
	}

	function dragDropChanged(cm, value, old) {
	  var wasOn = old && old != Init;
	  if (!value != !wasOn) {
	    var funcs = cm.display.dragFunctions;
	    var toggle = value ? on : off;
	    toggle(cm.display.scroller, "dragstart", funcs.start);
	    toggle(cm.display.scroller, "dragenter", funcs.enter);
	    toggle(cm.display.scroller, "dragover", funcs.over);
	    toggle(cm.display.scroller, "dragleave", funcs.leave);
	    toggle(cm.display.scroller, "drop", funcs.drop);
	  }
	}

	function wrappingChanged(cm) {
	  if (cm.options.lineWrapping) {
	    addClass(cm.display.wrapper, "CodeMirror-wrap");
	    cm.display.sizer.style.minWidth = "";
	    cm.display.sizerWidth = null;
	  } else {
	    rmClass(cm.display.wrapper, "CodeMirror-wrap");
	    findMaxLine(cm);
	  }
	  estimateLineHeights(cm);
	  regChange(cm);
	  clearCaches(cm);
	  setTimeout(function () { return updateScrollbars(cm); }, 100);
	}

	// A CodeMirror instance represents an editor. This is the object
	// that user code is usually dealing with.

	function CodeMirror$1(place, options) {
	  var this$1 = this;

	  if (!(this instanceof CodeMirror$1)) { return new CodeMirror$1(place, options) }

	  this.options = options = options ? copyObj(options) : {};
	  // Determine effective options based on given values and defaults.
	  copyObj(defaults, options, false);
	  setGuttersForLineNumbers(options);

	  var doc = options.value;
	  if (typeof doc == "string") { doc = new Doc(doc, options.mode, null, options.lineSeparator, options.direction); }
	  else if (options.mode) { doc.modeOption = options.mode; }
	  this.doc = doc;

	  var input = new CodeMirror$1.inputStyles[options.inputStyle](this);
	  var display = this.display = new Display(place, doc, input);
	  display.wrapper.CodeMirror = this;
	  updateGutters(this);
	  themeChanged(this);
	  if (options.lineWrapping)
	    { this.display.wrapper.className += " CodeMirror-wrap"; }
	  initScrollbars(this);

	  this.state = {
	    keyMaps: [],  // stores maps added by addKeyMap
	    overlays: [], // highlighting overlays, as added by addOverlay
	    modeGen: 0,   // bumped when mode/overlay changes, used to invalidate highlighting info
	    overwrite: false,
	    delayingBlurEvent: false,
	    focused: false,
	    suppressEdits: false, // used to disable editing during key handlers when in readOnly mode
	    pasteIncoming: false, cutIncoming: false, // help recognize paste/cut edits in input.poll
	    selectingText: false,
	    draggingText: false,
	    highlight: new Delayed(), // stores highlight worker timeout
	    keySeq: null,  // Unfinished key sequence
	    specialChars: null
	  };

	  if (options.autofocus && !mobile) { display.input.focus(); }

	  // Override magic textarea content restore that IE sometimes does
	  // on our hidden textarea on reload
	  if (ie && ie_version < 11) { setTimeout(function () { return this$1.display.input.reset(true); }, 20); }

	  registerEventHandlers(this);
	  ensureGlobalHandlers();

	  startOperation(this);
	  this.curOp.forceUpdate = true;
	  attachDoc(this, doc);

	  if ((options.autofocus && !mobile) || this.hasFocus())
	    { setTimeout(bind(onFocus, this), 20); }
	  else
	    { onBlur(this); }

	  for (var opt in optionHandlers) { if (optionHandlers.hasOwnProperty(opt))
	    { optionHandlers[opt](this$1, options[opt], Init); } }
	  maybeUpdateLineNumberWidth(this);
	  if (options.finishInit) { options.finishInit(this); }
	  for (var i = 0; i < initHooks.length; ++i) { initHooks[i](this$1); }
	  endOperation(this);
	  // Suppress optimizelegibility in Webkit, since it breaks text
	  // measuring on line wrapping boundaries.
	  if (webkit && options.lineWrapping &&
	      getComputedStyle(display.lineDiv).textRendering == "optimizelegibility")
	    { display.lineDiv.style.textRendering = "auto"; }
	}

	// The default configuration options.
	CodeMirror$1.defaults = defaults;
	// Functions to run when options are changed.
	CodeMirror$1.optionHandlers = optionHandlers;

	// Attach the necessary event handlers when initializing the editor
	function registerEventHandlers(cm) {
	  var d = cm.display;
	  on(d.scroller, "mousedown", operation(cm, onMouseDown));
	  // Older IE's will not fire a second mousedown for a double click
	  if (ie && ie_version < 11)
	    { on(d.scroller, "dblclick", operation(cm, function (e) {
	      if (signalDOMEvent(cm, e)) { return }
	      var pos = posFromMouse(cm, e);
	      if (!pos || clickInGutter(cm, e) || eventInWidget(cm.display, e)) { return }
	      e_preventDefault(e);
	      var word = cm.findWordAt(pos);
	      extendSelection(cm.doc, word.anchor, word.head);
	    })); }
	  else
	    { on(d.scroller, "dblclick", function (e) { return signalDOMEvent(cm, e) || e_preventDefault(e); }); }
	  // Some browsers fire contextmenu *after* opening the menu, at
	  // which point we can't mess with it anymore. Context menu is
	  // handled in onMouseDown for these browsers.
	  if (!captureRightClick) { on(d.scroller, "contextmenu", function (e) { return onContextMenu(cm, e); }); }

	  // Used to suppress mouse event handling when a touch happens
	  var touchFinished, prevTouch = {end: 0};
	  function finishTouch() {
	    if (d.activeTouch) {
	      touchFinished = setTimeout(function () { return d.activeTouch = null; }, 1000);
	      prevTouch = d.activeTouch;
	      prevTouch.end = +new Date;
	    }
	  }
	  function isMouseLikeTouchEvent(e) {
	    if (e.touches.length != 1) { return false }
	    var touch = e.touches[0];
	    return touch.radiusX <= 1 && touch.radiusY <= 1
	  }
	  function farAway(touch, other) {
	    if (other.left == null) { return true }
	    var dx = other.left - touch.left, dy = other.top - touch.top;
	    return dx * dx + dy * dy > 20 * 20
	  }
	  on(d.scroller, "touchstart", function (e) {
	    if (!signalDOMEvent(cm, e) && !isMouseLikeTouchEvent(e) && !clickInGutter(cm, e)) {
	      d.input.ensurePolled();
	      clearTimeout(touchFinished);
	      var now = +new Date;
	      d.activeTouch = {start: now, moved: false,
	                       prev: now - prevTouch.end <= 300 ? prevTouch : null};
	      if (e.touches.length == 1) {
	        d.activeTouch.left = e.touches[0].pageX;
	        d.activeTouch.top = e.touches[0].pageY;
	      }
	    }
	  });
	  on(d.scroller, "touchmove", function () {
	    if (d.activeTouch) { d.activeTouch.moved = true; }
	  });
	  on(d.scroller, "touchend", function (e) {
	    var touch = d.activeTouch;
	    if (touch && !eventInWidget(d, e) && touch.left != null &&
	        !touch.moved && new Date - touch.start < 300) {
	      var pos = cm.coordsChar(d.activeTouch, "page"), range;
	      if (!touch.prev || farAway(touch, touch.prev)) // Single tap
	        { range = new Range(pos, pos); }
	      else if (!touch.prev.prev || farAway(touch, touch.prev.prev)) // Double tap
	        { range = cm.findWordAt(pos); }
	      else // Triple tap
	        { range = new Range(Pos(pos.line, 0), clipPos(cm.doc, Pos(pos.line + 1, 0))); }
	      cm.setSelection(range.anchor, range.head);
	      cm.focus();
	      e_preventDefault(e);
	    }
	    finishTouch();
	  });
	  on(d.scroller, "touchcancel", finishTouch);

	  // Sync scrolling between fake scrollbars and real scrollable
	  // area, ensure viewport is updated when scrolling.
	  on(d.scroller, "scroll", function () {
	    if (d.scroller.clientHeight) {
	      updateScrollTop(cm, d.scroller.scrollTop);
	      setScrollLeft(cm, d.scroller.scrollLeft, true);
	      signal(cm, "scroll", cm);
	    }
	  });

	  // Listen to wheel events in order to try and update the viewport on time.
	  on(d.scroller, "mousewheel", function (e) { return onScrollWheel(cm, e); });
	  on(d.scroller, "DOMMouseScroll", function (e) { return onScrollWheel(cm, e); });

	  // Prevent wrapper from ever scrolling
	  on(d.wrapper, "scroll", function () { return d.wrapper.scrollTop = d.wrapper.scrollLeft = 0; });

	  d.dragFunctions = {
	    enter: function (e) {if (!signalDOMEvent(cm, e)) { e_stop(e); }},
	    over: function (e) {if (!signalDOMEvent(cm, e)) { onDragOver(cm, e); e_stop(e); }},
	    start: function (e) { return onDragStart(cm, e); },
	    drop: operation(cm, onDrop),
	    leave: function (e) {if (!signalDOMEvent(cm, e)) { clearDragCursor(cm); }}
	  };

	  var inp = d.input.getField();
	  on(inp, "keyup", function (e) { return onKeyUp.call(cm, e); });
	  on(inp, "keydown", operation(cm, onKeyDown));
	  on(inp, "keypress", operation(cm, onKeyPress));
	  on(inp, "focus", function (e) { return onFocus(cm, e); });
	  on(inp, "blur", function (e) { return onBlur(cm, e); });
	}

	var initHooks = [];
	CodeMirror$1.defineInitHook = function (f) { return initHooks.push(f); };

	// Indent the given line. The how parameter can be "smart",
	// "add"/null, "subtract", or "prev". When aggressive is false
	// (typically set to true for forced single-line indents), empty
	// lines are not indented, and places where the mode returns Pass
	// are left alone.
	function indentLine(cm, n, how, aggressive) {
	  var doc = cm.doc, state;
	  if (how == null) { how = "add"; }
	  if (how == "smart") {
	    // Fall back to "prev" when the mode doesn't have an indentation
	    // method.
	    if (!doc.mode.indent) { how = "prev"; }
	    else { state = getContextBefore(cm, n).state; }
	  }

	  var tabSize = cm.options.tabSize;
	  var line = getLine(doc, n), curSpace = countColumn(line.text, null, tabSize);
	  if (line.stateAfter) { line.stateAfter = null; }
	  var curSpaceString = line.text.match(/^\s*/)[0], indentation;
	  if (!aggressive && !/\S/.test(line.text)) {
	    indentation = 0;
	    how = "not";
	  } else if (how == "smart") {
	    indentation = doc.mode.indent(state, line.text.slice(curSpaceString.length), line.text);
	    if (indentation == Pass || indentation > 150) {
	      if (!aggressive) { return }
	      how = "prev";
	    }
	  }
	  if (how == "prev") {
	    if (n > doc.first) { indentation = countColumn(getLine(doc, n-1).text, null, tabSize); }
	    else { indentation = 0; }
	  } else if (how == "add") {
	    indentation = curSpace + cm.options.indentUnit;
	  } else if (how == "subtract") {
	    indentation = curSpace - cm.options.indentUnit;
	  } else if (typeof how == "number") {
	    indentation = curSpace + how;
	  }
	  indentation = Math.max(0, indentation);

	  var indentString = "", pos = 0;
	  if (cm.options.indentWithTabs)
	    { for (var i = Math.floor(indentation / tabSize); i; --i) {pos += tabSize; indentString += "\t";} }
	  if (pos < indentation) { indentString += spaceStr(indentation - pos); }

	  if (indentString != curSpaceString) {
	    replaceRange(doc, indentString, Pos(n, 0), Pos(n, curSpaceString.length), "+input");
	    line.stateAfter = null;
	    return true
	  } else {
	    // Ensure that, if the cursor was in the whitespace at the start
	    // of the line, it is moved to the end of that space.
	    for (var i$1 = 0; i$1 < doc.sel.ranges.length; i$1++) {
	      var range = doc.sel.ranges[i$1];
	      if (range.head.line == n && range.head.ch < curSpaceString.length) {
	        var pos$1 = Pos(n, curSpaceString.length);
	        replaceOneSelection(doc, i$1, new Range(pos$1, pos$1));
	        break
	      }
	    }
	  }
	}

	// This will be set to a {lineWise: bool, text: [string]} object, so
	// that, when pasting, we know what kind of selections the copied
	// text was made out of.
	var lastCopied = null;

	function setLastCopied(newLastCopied) {
	  lastCopied = newLastCopied;
	}

	function applyTextInput(cm, inserted, deleted, sel, origin) {
	  var doc = cm.doc;
	  cm.display.shift = false;
	  if (!sel) { sel = doc.sel; }

	  var paste = cm.state.pasteIncoming || origin == "paste";
	  var textLines = splitLinesAuto(inserted), multiPaste = null;
	  // When pasting N lines into N selections, insert one line per selection
	  if (paste && sel.ranges.length > 1) {
	    if (lastCopied && lastCopied.text.join("\n") == inserted) {
	      if (sel.ranges.length % lastCopied.text.length == 0) {
	        multiPaste = [];
	        for (var i = 0; i < lastCopied.text.length; i++)
	          { multiPaste.push(doc.splitLines(lastCopied.text[i])); }
	      }
	    } else if (textLines.length == sel.ranges.length && cm.options.pasteLinesPerSelection) {
	      multiPaste = map(textLines, function (l) { return [l]; });
	    }
	  }

	  var updateInput;
	  // Normal behavior is to insert the new text into every selection
	  for (var i$1 = sel.ranges.length - 1; i$1 >= 0; i$1--) {
	    var range$$1 = sel.ranges[i$1];
	    var from = range$$1.from(), to = range$$1.to();
	    if (range$$1.empty()) {
	      if (deleted && deleted > 0) // Handle deletion
	        { from = Pos(from.line, from.ch - deleted); }
	      else if (cm.state.overwrite && !paste) // Handle overwrite
	        { to = Pos(to.line, Math.min(getLine(doc, to.line).text.length, to.ch + lst(textLines).length)); }
	      else if (lastCopied && lastCopied.lineWise && lastCopied.text.join("\n") == inserted)
	        { from = to = Pos(from.line, 0); }
	    }
	    updateInput = cm.curOp.updateInput;
	    var changeEvent = {from: from, to: to, text: multiPaste ? multiPaste[i$1 % multiPaste.length] : textLines,
	                       origin: origin || (paste ? "paste" : cm.state.cutIncoming ? "cut" : "+input")};
	    makeChange(cm.doc, changeEvent);
	    signalLater(cm, "inputRead", cm, changeEvent);
	  }
	  if (inserted && !paste)
	    { triggerElectric(cm, inserted); }

	  ensureCursorVisible(cm);
	  cm.curOp.updateInput = updateInput;
	  cm.curOp.typing = true;
	  cm.state.pasteIncoming = cm.state.cutIncoming = false;
	}

	function handlePaste(e, cm) {
	  var pasted = e.clipboardData && e.clipboardData.getData("Text");
	  if (pasted) {
	    e.preventDefault();
	    if (!cm.isReadOnly() && !cm.options.disableInput)
	      { runInOp(cm, function () { return applyTextInput(cm, pasted, 0, null, "paste"); }); }
	    return true
	  }
	}

	function triggerElectric(cm, inserted) {
	  // When an 'electric' character is inserted, immediately trigger a reindent
	  if (!cm.options.electricChars || !cm.options.smartIndent) { return }
	  var sel = cm.doc.sel;

	  for (var i = sel.ranges.length - 1; i >= 0; i--) {
	    var range$$1 = sel.ranges[i];
	    if (range$$1.head.ch > 100 || (i && sel.ranges[i - 1].head.line == range$$1.head.line)) { continue }
	    var mode = cm.getModeAt(range$$1.head);
	    var indented = false;
	    if (mode.electricChars) {
	      for (var j = 0; j < mode.electricChars.length; j++)
	        { if (inserted.indexOf(mode.electricChars.charAt(j)) > -1) {
	          indented = indentLine(cm, range$$1.head.line, "smart");
	          break
	        } }
	    } else if (mode.electricInput) {
	      if (mode.electricInput.test(getLine(cm.doc, range$$1.head.line).text.slice(0, range$$1.head.ch)))
	        { indented = indentLine(cm, range$$1.head.line, "smart"); }
	    }
	    if (indented) { signalLater(cm, "electricInput", cm, range$$1.head.line); }
	  }
	}

	function copyableRanges(cm) {
	  var text = [], ranges = [];
	  for (var i = 0; i < cm.doc.sel.ranges.length; i++) {
	    var line = cm.doc.sel.ranges[i].head.line;
	    var lineRange = {anchor: Pos(line, 0), head: Pos(line + 1, 0)};
	    ranges.push(lineRange);
	    text.push(cm.getRange(lineRange.anchor, lineRange.head));
	  }
	  return {text: text, ranges: ranges}
	}

	function disableBrowserMagic(field, spellcheck) {
	  field.setAttribute("autocorrect", "off");
	  field.setAttribute("autocapitalize", "off");
	  field.setAttribute("spellcheck", !!spellcheck);
	}

	function hiddenTextarea() {
	  var te = elt("textarea", null, null, "position: absolute; bottom: -1em; padding: 0; width: 1px; height: 1em; outline: none");
	  var div = elt("div", [te], null, "overflow: hidden; position: relative; width: 3px; height: 0px;");
	  // The textarea is kept positioned near the cursor to prevent the
	  // fact that it'll be scrolled into view on input from scrolling
	  // our fake cursor out of view. On webkit, when wrap=off, paste is
	  // very slow. So make the area wide instead.
	  if (webkit) { te.style.width = "1000px"; }
	  else { te.setAttribute("wrap", "off"); }
	  // If border: 0; -- iOS fails to open keyboard (issue #1287)
	  if (ios) { te.style.border = "1px solid black"; }
	  disableBrowserMagic(te);
	  return div
	}

	// The publicly visible API. Note that methodOp(f) means
	// 'wrap f in an operation, performed on its `this` parameter'.

	// This is not the complete set of editor methods. Most of the
	// methods defined on the Doc type are also injected into
	// CodeMirror.prototype, for backwards compatibility and
	// convenience.

	var addEditorMethods = function(CodeMirror) {
	  var optionHandlers = CodeMirror.optionHandlers;

	  var helpers = CodeMirror.helpers = {};

	  CodeMirror.prototype = {
	    constructor: CodeMirror,
	    focus: function(){window.focus(); this.display.input.focus();},

	    setOption: function(option, value) {
	      var options = this.options, old = options[option];
	      if (options[option] == value && option != "mode") { return }
	      options[option] = value;
	      if (optionHandlers.hasOwnProperty(option))
	        { operation(this, optionHandlers[option])(this, value, old); }
	      signal(this, "optionChange", this, option);
	    },

	    getOption: function(option) {return this.options[option]},
	    getDoc: function() {return this.doc},

	    addKeyMap: function(map$$1, bottom) {
	      this.state.keyMaps[bottom ? "push" : "unshift"](getKeyMap(map$$1));
	    },
	    removeKeyMap: function(map$$1) {
	      var maps = this.state.keyMaps;
	      for (var i = 0; i < maps.length; ++i)
	        { if (maps[i] == map$$1 || maps[i].name == map$$1) {
	          maps.splice(i, 1);
	          return true
	        } }
	    },

	    addOverlay: methodOp(function(spec, options) {
	      var mode = spec.token ? spec : CodeMirror.getMode(this.options, spec);
	      if (mode.startState) { throw new Error("Overlays may not be stateful.") }
	      insertSorted(this.state.overlays,
	                   {mode: mode, modeSpec: spec, opaque: options && options.opaque,
	                    priority: (options && options.priority) || 0},
	                   function (overlay) { return overlay.priority; });
	      this.state.modeGen++;
	      regChange(this);
	    }),
	    removeOverlay: methodOp(function(spec) {
	      var this$1 = this;

	      var overlays = this.state.overlays;
	      for (var i = 0; i < overlays.length; ++i) {
	        var cur = overlays[i].modeSpec;
	        if (cur == spec || typeof spec == "string" && cur.name == spec) {
	          overlays.splice(i, 1);
	          this$1.state.modeGen++;
	          regChange(this$1);
	          return
	        }
	      }
	    }),

	    indentLine: methodOp(function(n, dir, aggressive) {
	      if (typeof dir != "string" && typeof dir != "number") {
	        if (dir == null) { dir = this.options.smartIndent ? "smart" : "prev"; }
	        else { dir = dir ? "add" : "subtract"; }
	      }
	      if (isLine(this.doc, n)) { indentLine(this, n, dir, aggressive); }
	    }),
	    indentSelection: methodOp(function(how) {
	      var this$1 = this;

	      var ranges = this.doc.sel.ranges, end = -1;
	      for (var i = 0; i < ranges.length; i++) {
	        var range$$1 = ranges[i];
	        if (!range$$1.empty()) {
	          var from = range$$1.from(), to = range$$1.to();
	          var start = Math.max(end, from.line);
	          end = Math.min(this$1.lastLine(), to.line - (to.ch ? 0 : 1)) + 1;
	          for (var j = start; j < end; ++j)
	            { indentLine(this$1, j, how); }
	          var newRanges = this$1.doc.sel.ranges;
	          if (from.ch == 0 && ranges.length == newRanges.length && newRanges[i].from().ch > 0)
	            { replaceOneSelection(this$1.doc, i, new Range(from, newRanges[i].to()), sel_dontScroll); }
	        } else if (range$$1.head.line > end) {
	          indentLine(this$1, range$$1.head.line, how, true);
	          end = range$$1.head.line;
	          if (i == this$1.doc.sel.primIndex) { ensureCursorVisible(this$1); }
	        }
	      }
	    }),

	    // Fetch the parser token for a given character. Useful for hacks
	    // that want to inspect the mode state (say, for completion).
	    getTokenAt: function(pos, precise) {
	      return takeToken(this, pos, precise)
	    },

	    getLineTokens: function(line, precise) {
	      return takeToken(this, Pos(line), precise, true)
	    },

	    getTokenTypeAt: function(pos) {
	      pos = clipPos(this.doc, pos);
	      var styles = getLineStyles(this, getLine(this.doc, pos.line));
	      var before = 0, after = (styles.length - 1) / 2, ch = pos.ch;
	      var type;
	      if (ch == 0) { type = styles[2]; }
	      else { for (;;) {
	        var mid = (before + after) >> 1;
	        if ((mid ? styles[mid * 2 - 1] : 0) >= ch) { after = mid; }
	        else if (styles[mid * 2 + 1] < ch) { before = mid + 1; }
	        else { type = styles[mid * 2 + 2]; break }
	      } }
	      var cut = type ? type.indexOf("overlay ") : -1;
	      return cut < 0 ? type : cut == 0 ? null : type.slice(0, cut - 1)
	    },

	    getModeAt: function(pos) {
	      var mode = this.doc.mode;
	      if (!mode.innerMode) { return mode }
	      return CodeMirror.innerMode(mode, this.getTokenAt(pos).state).mode
	    },

	    getHelper: function(pos, type) {
	      return this.getHelpers(pos, type)[0]
	    },

	    getHelpers: function(pos, type) {
	      var this$1 = this;

	      var found = [];
	      if (!helpers.hasOwnProperty(type)) { return found }
	      var help = helpers[type], mode = this.getModeAt(pos);
	      if (typeof mode[type] == "string") {
	        if (help[mode[type]]) { found.push(help[mode[type]]); }
	      } else if (mode[type]) {
	        for (var i = 0; i < mode[type].length; i++) {
	          var val = help[mode[type][i]];
	          if (val) { found.push(val); }
	        }
	      } else if (mode.helperType && help[mode.helperType]) {
	        found.push(help[mode.helperType]);
	      } else if (help[mode.name]) {
	        found.push(help[mode.name]);
	      }
	      for (var i$1 = 0; i$1 < help._global.length; i$1++) {
	        var cur = help._global[i$1];
	        if (cur.pred(mode, this$1) && indexOf(found, cur.val) == -1)
	          { found.push(cur.val); }
	      }
	      return found
	    },

	    getStateAfter: function(line, precise) {
	      var doc = this.doc;
	      line = clipLine(doc, line == null ? doc.first + doc.size - 1: line);
	      return getContextBefore(this, line + 1, precise).state
	    },

	    cursorCoords: function(start, mode) {
	      var pos, range$$1 = this.doc.sel.primary();
	      if (start == null) { pos = range$$1.head; }
	      else if (typeof start == "object") { pos = clipPos(this.doc, start); }
	      else { pos = start ? range$$1.from() : range$$1.to(); }
	      return cursorCoords(this, pos, mode || "page")
	    },

	    charCoords: function(pos, mode) {
	      return charCoords(this, clipPos(this.doc, pos), mode || "page")
	    },

	    coordsChar: function(coords, mode) {
	      coords = fromCoordSystem(this, coords, mode || "page");
	      return coordsChar(this, coords.left, coords.top)
	    },

	    lineAtHeight: function(height, mode) {
	      height = fromCoordSystem(this, {top: height, left: 0}, mode || "page").top;
	      return lineAtHeight(this.doc, height + this.display.viewOffset)
	    },
	    heightAtLine: function(line, mode, includeWidgets) {
	      var end = false, lineObj;
	      if (typeof line == "number") {
	        var last = this.doc.first + this.doc.size - 1;
	        if (line < this.doc.first) { line = this.doc.first; }
	        else if (line > last) { line = last; end = true; }
	        lineObj = getLine(this.doc, line);
	      } else {
	        lineObj = line;
	      }
	      return intoCoordSystem(this, lineObj, {top: 0, left: 0}, mode || "page", includeWidgets || end).top +
	        (end ? this.doc.height - heightAtLine(lineObj) : 0)
	    },

	    defaultTextHeight: function() { return textHeight(this.display) },
	    defaultCharWidth: function() { return charWidth(this.display) },

	    getViewport: function() { return {from: this.display.viewFrom, to: this.display.viewTo}},

	    addWidget: function(pos, node, scroll, vert, horiz) {
	      var display = this.display;
	      pos = cursorCoords(this, clipPos(this.doc, pos));
	      var top = pos.bottom, left = pos.left;
	      node.style.position = "absolute";
	      node.setAttribute("cm-ignore-events", "true");
	      this.display.input.setUneditable(node);
	      display.sizer.appendChild(node);
	      if (vert == "over") {
	        top = pos.top;
	      } else if (vert == "above" || vert == "near") {
	        var vspace = Math.max(display.wrapper.clientHeight, this.doc.height),
	        hspace = Math.max(display.sizer.clientWidth, display.lineSpace.clientWidth);
	        // Default to positioning above (if specified and possible); otherwise default to positioning below
	        if ((vert == 'above' || pos.bottom + node.offsetHeight > vspace) && pos.top > node.offsetHeight)
	          { top = pos.top - node.offsetHeight; }
	        else if (pos.bottom + node.offsetHeight <= vspace)
	          { top = pos.bottom; }
	        if (left + node.offsetWidth > hspace)
	          { left = hspace - node.offsetWidth; }
	      }
	      node.style.top = top + "px";
	      node.style.left = node.style.right = "";
	      if (horiz == "right") {
	        left = display.sizer.clientWidth - node.offsetWidth;
	        node.style.right = "0px";
	      } else {
	        if (horiz == "left") { left = 0; }
	        else if (horiz == "middle") { left = (display.sizer.clientWidth - node.offsetWidth) / 2; }
	        node.style.left = left + "px";
	      }
	      if (scroll)
	        { scrollIntoView(this, {left: left, top: top, right: left + node.offsetWidth, bottom: top + node.offsetHeight}); }
	    },

	    triggerOnKeyDown: methodOp(onKeyDown),
	    triggerOnKeyPress: methodOp(onKeyPress),
	    triggerOnKeyUp: onKeyUp,
	    triggerOnMouseDown: methodOp(onMouseDown),

	    execCommand: function(cmd) {
	      if (commands.hasOwnProperty(cmd))
	        { return commands[cmd].call(null, this) }
	    },

	    triggerElectric: methodOp(function(text) { triggerElectric(this, text); }),

	    findPosH: function(from, amount, unit, visually) {
	      var this$1 = this;

	      var dir = 1;
	      if (amount < 0) { dir = -1; amount = -amount; }
	      var cur = clipPos(this.doc, from);
	      for (var i = 0; i < amount; ++i) {
	        cur = findPosH(this$1.doc, cur, dir, unit, visually);
	        if (cur.hitSide) { break }
	      }
	      return cur
	    },

	    moveH: methodOp(function(dir, unit) {
	      var this$1 = this;

	      this.extendSelectionsBy(function (range$$1) {
	        if (this$1.display.shift || this$1.doc.extend || range$$1.empty())
	          { return findPosH(this$1.doc, range$$1.head, dir, unit, this$1.options.rtlMoveVisually) }
	        else
	          { return dir < 0 ? range$$1.from() : range$$1.to() }
	      }, sel_move);
	    }),

	    deleteH: methodOp(function(dir, unit) {
	      var sel = this.doc.sel, doc = this.doc;
	      if (sel.somethingSelected())
	        { doc.replaceSelection("", null, "+delete"); }
	      else
	        { deleteNearSelection(this, function (range$$1) {
	          var other = findPosH(doc, range$$1.head, dir, unit, false);
	          return dir < 0 ? {from: other, to: range$$1.head} : {from: range$$1.head, to: other}
	        }); }
	    }),

	    findPosV: function(from, amount, unit, goalColumn) {
	      var this$1 = this;

	      var dir = 1, x = goalColumn;
	      if (amount < 0) { dir = -1; amount = -amount; }
	      var cur = clipPos(this.doc, from);
	      for (var i = 0; i < amount; ++i) {
	        var coords = cursorCoords(this$1, cur, "div");
	        if (x == null) { x = coords.left; }
	        else { coords.left = x; }
	        cur = findPosV(this$1, coords, dir, unit);
	        if (cur.hitSide) { break }
	      }
	      return cur
	    },

	    moveV: methodOp(function(dir, unit) {
	      var this$1 = this;

	      var doc = this.doc, goals = [];
	      var collapse = !this.display.shift && !doc.extend && doc.sel.somethingSelected();
	      doc.extendSelectionsBy(function (range$$1) {
	        if (collapse)
	          { return dir < 0 ? range$$1.from() : range$$1.to() }
	        var headPos = cursorCoords(this$1, range$$1.head, "div");
	        if (range$$1.goalColumn != null) { headPos.left = range$$1.goalColumn; }
	        goals.push(headPos.left);
	        var pos = findPosV(this$1, headPos, dir, unit);
	        if (unit == "page" && range$$1 == doc.sel.primary())
	          { addToScrollTop(this$1, charCoords(this$1, pos, "div").top - headPos.top); }
	        return pos
	      }, sel_move);
	      if (goals.length) { for (var i = 0; i < doc.sel.ranges.length; i++)
	        { doc.sel.ranges[i].goalColumn = goals[i]; } }
	    }),

	    // Find the word at the given position (as returned by coordsChar).
	    findWordAt: function(pos) {
	      var doc = this.doc, line = getLine(doc, pos.line).text;
	      var start = pos.ch, end = pos.ch;
	      if (line) {
	        var helper = this.getHelper(pos, "wordChars");
	        if ((pos.sticky == "before" || end == line.length) && start) { --start; } else { ++end; }
	        var startChar = line.charAt(start);
	        var check = isWordChar(startChar, helper)
	          ? function (ch) { return isWordChar(ch, helper); }
	          : /\s/.test(startChar) ? function (ch) { return /\s/.test(ch); }
	          : function (ch) { return (!/\s/.test(ch) && !isWordChar(ch)); };
	        while (start > 0 && check(line.charAt(start - 1))) { --start; }
	        while (end < line.length && check(line.charAt(end))) { ++end; }
	      }
	      return new Range(Pos(pos.line, start), Pos(pos.line, end))
	    },

	    toggleOverwrite: function(value) {
	      if (value != null && value == this.state.overwrite) { return }
	      if (this.state.overwrite = !this.state.overwrite)
	        { addClass(this.display.cursorDiv, "CodeMirror-overwrite"); }
	      else
	        { rmClass(this.display.cursorDiv, "CodeMirror-overwrite"); }

	      signal(this, "overwriteToggle", this, this.state.overwrite);
	    },
	    hasFocus: function() { return this.display.input.getField() == activeElt() },
	    isReadOnly: function() { return !!(this.options.readOnly || this.doc.cantEdit) },

	    scrollTo: methodOp(function (x, y) { scrollToCoords(this, x, y); }),
	    getScrollInfo: function() {
	      var scroller = this.display.scroller;
	      return {left: scroller.scrollLeft, top: scroller.scrollTop,
	              height: scroller.scrollHeight - scrollGap(this) - this.display.barHeight,
	              width: scroller.scrollWidth - scrollGap(this) - this.display.barWidth,
	              clientHeight: displayHeight(this), clientWidth: displayWidth(this)}
	    },

	    scrollIntoView: methodOp(function(range$$1, margin) {
	      if (range$$1 == null) {
	        range$$1 = {from: this.doc.sel.primary().head, to: null};
	        if (margin == null) { margin = this.options.cursorScrollMargin; }
	      } else if (typeof range$$1 == "number") {
	        range$$1 = {from: Pos(range$$1, 0), to: null};
	      } else if (range$$1.from == null) {
	        range$$1 = {from: range$$1, to: null};
	      }
	      if (!range$$1.to) { range$$1.to = range$$1.from; }
	      range$$1.margin = margin || 0;

	      if (range$$1.from.line != null) {
	        scrollToRange(this, range$$1);
	      } else {
	        scrollToCoordsRange(this, range$$1.from, range$$1.to, range$$1.margin);
	      }
	    }),

	    setSize: methodOp(function(width, height) {
	      var this$1 = this;

	      var interpret = function (val) { return typeof val == "number" || /^\d+$/.test(String(val)) ? val + "px" : val; };
	      if (width != null) { this.display.wrapper.style.width = interpret(width); }
	      if (height != null) { this.display.wrapper.style.height = interpret(height); }
	      if (this.options.lineWrapping) { clearLineMeasurementCache(this); }
	      var lineNo$$1 = this.display.viewFrom;
	      this.doc.iter(lineNo$$1, this.display.viewTo, function (line) {
	        if (line.widgets) { for (var i = 0; i < line.widgets.length; i++)
	          { if (line.widgets[i].noHScroll) { regLineChange(this$1, lineNo$$1, "widget"); break } } }
	        ++lineNo$$1;
	      });
	      this.curOp.forceUpdate = true;
	      signal(this, "refresh", this);
	    }),

	    operation: function(f){return runInOp(this, f)},
	    startOperation: function(){return startOperation(this)},
	    endOperation: function(){return endOperation(this)},

	    refresh: methodOp(function() {
	      var oldHeight = this.display.cachedTextHeight;
	      regChange(this);
	      this.curOp.forceUpdate = true;
	      clearCaches(this);
	      scrollToCoords(this, this.doc.scrollLeft, this.doc.scrollTop);
	      updateGutterSpace(this);
	      if (oldHeight == null || Math.abs(oldHeight - textHeight(this.display)) > .5)
	        { estimateLineHeights(this); }
	      signal(this, "refresh", this);
	    }),

	    swapDoc: methodOp(function(doc) {
	      var old = this.doc;
	      old.cm = null;
	      attachDoc(this, doc);
	      clearCaches(this);
	      this.display.input.reset();
	      scrollToCoords(this, doc.scrollLeft, doc.scrollTop);
	      this.curOp.forceScroll = true;
	      signalLater(this, "swapDoc", this, old);
	      return old
	    }),

	    phrase: function(phraseText) {
	      var phrases = this.options.phrases;
	      return phrases && Object.prototype.hasOwnProperty.call(phrases, phraseText) ? phrases[phraseText] : phraseText
	    },

	    getInputField: function(){return this.display.input.getField()},
	    getWrapperElement: function(){return this.display.wrapper},
	    getScrollerElement: function(){return this.display.scroller},
	    getGutterElement: function(){return this.display.gutters}
	  };
	  eventMixin(CodeMirror);

	  CodeMirror.registerHelper = function(type, name, value) {
	    if (!helpers.hasOwnProperty(type)) { helpers[type] = CodeMirror[type] = {_global: []}; }
	    helpers[type][name] = value;
	  };
	  CodeMirror.registerGlobalHelper = function(type, name, predicate, value) {
	    CodeMirror.registerHelper(type, name, value);
	    helpers[type]._global.push({pred: predicate, val: value});
	  };
	};

	// Used for horizontal relative motion. Dir is -1 or 1 (left or
	// right), unit can be "char", "column" (like char, but doesn't
	// cross line boundaries), "word" (across next word), or "group" (to
	// the start of next group of word or non-word-non-whitespace
	// chars). The visually param controls whether, in right-to-left
	// text, direction 1 means to move towards the next index in the
	// string, or towards the character to the right of the current
	// position. The resulting position will have a hitSide=true
	// property if it reached the end of the document.
	function findPosH(doc, pos, dir, unit, visually) {
	  var oldPos = pos;
	  var origDir = dir;
	  var lineObj = getLine(doc, pos.line);
	  function findNextLine() {
	    var l = pos.line + dir;
	    if (l < doc.first || l >= doc.first + doc.size) { return false }
	    pos = new Pos(l, pos.ch, pos.sticky);
	    return lineObj = getLine(doc, l)
	  }
	  function moveOnce(boundToLine) {
	    var next;
	    if (visually) {
	      next = moveVisually(doc.cm, lineObj, pos, dir);
	    } else {
	      next = moveLogically(lineObj, pos, dir);
	    }
	    if (next == null) {
	      if (!boundToLine && findNextLine())
	        { pos = endOfLine(visually, doc.cm, lineObj, pos.line, dir); }
	      else
	        { return false }
	    } else {
	      pos = next;
	    }
	    return true
	  }

	  if (unit == "char") {
	    moveOnce();
	  } else if (unit == "column") {
	    moveOnce(true);
	  } else if (unit == "word" || unit == "group") {
	    var sawType = null, group = unit == "group";
	    var helper = doc.cm && doc.cm.getHelper(pos, "wordChars");
	    for (var first = true;; first = false) {
	      if (dir < 0 && !moveOnce(!first)) { break }
	      var cur = lineObj.text.charAt(pos.ch) || "\n";
	      var type = isWordChar(cur, helper) ? "w"
	        : group && cur == "\n" ? "n"
	        : !group || /\s/.test(cur) ? null
	        : "p";
	      if (group && !first && !type) { type = "s"; }
	      if (sawType && sawType != type) {
	        if (dir < 0) {dir = 1; moveOnce(); pos.sticky = "after";}
	        break
	      }

	      if (type) { sawType = type; }
	      if (dir > 0 && !moveOnce(!first)) { break }
	    }
	  }
	  var result = skipAtomic(doc, pos, oldPos, origDir, true);
	  if (equalCursorPos(oldPos, result)) { result.hitSide = true; }
	  return result
	}

	// For relative vertical movement. Dir may be -1 or 1. Unit can be
	// "page" or "line". The resulting position will have a hitSide=true
	// property if it reached the end of the document.
	function findPosV(cm, pos, dir, unit) {
	  var doc = cm.doc, x = pos.left, y;
	  if (unit == "page") {
	    var pageSize = Math.min(cm.display.wrapper.clientHeight, window.innerHeight || document.documentElement.clientHeight);
	    var moveAmount = Math.max(pageSize - .5 * textHeight(cm.display), 3);
	    y = (dir > 0 ? pos.bottom : pos.top) + dir * moveAmount;

	  } else if (unit == "line") {
	    y = dir > 0 ? pos.bottom + 3 : pos.top - 3;
	  }
	  var target;
	  for (;;) {
	    target = coordsChar(cm, x, y);
	    if (!target.outside) { break }
	    if (dir < 0 ? y <= 0 : y >= doc.height) { target.hitSide = true; break }
	    y += dir * 5;
	  }
	  return target
	}

	// CONTENTEDITABLE INPUT STYLE

	var ContentEditableInput = function(cm) {
	  this.cm = cm;
	  this.lastAnchorNode = this.lastAnchorOffset = this.lastFocusNode = this.lastFocusOffset = null;
	  this.polling = new Delayed();
	  this.composing = null;
	  this.gracePeriod = false;
	  this.readDOMTimeout = null;
	};

	ContentEditableInput.prototype.init = function (display) {
	    var this$1 = this;

	  var input = this, cm = input.cm;
	  var div = input.div = display.lineDiv;
	  disableBrowserMagic(div, cm.options.spellcheck);

	  on(div, "paste", function (e) {
	    if (signalDOMEvent(cm, e) || handlePaste(e, cm)) { return }
	    // IE doesn't fire input events, so we schedule a read for the pasted content in this way
	    if (ie_version <= 11) { setTimeout(operation(cm, function () { return this$1.updateFromDOM(); }), 20); }
	  });

	  on(div, "compositionstart", function (e) {
	    this$1.composing = {data: e.data, done: false};
	  });
	  on(div, "compositionupdate", function (e) {
	    if (!this$1.composing) { this$1.composing = {data: e.data, done: false}; }
	  });
	  on(div, "compositionend", function (e) {
	    if (this$1.composing) {
	      if (e.data != this$1.composing.data) { this$1.readFromDOMSoon(); }
	      this$1.composing.done = true;
	    }
	  });

	  on(div, "touchstart", function () { return input.forceCompositionEnd(); });

	  on(div, "input", function () {
	    if (!this$1.composing) { this$1.readFromDOMSoon(); }
	  });

	  function onCopyCut(e) {
	    if (signalDOMEvent(cm, e)) { return }
	    if (cm.somethingSelected()) {
	      setLastCopied({lineWise: false, text: cm.getSelections()});
	      if (e.type == "cut") { cm.replaceSelection("", null, "cut"); }
	    } else if (!cm.options.lineWiseCopyCut) {
	      return
	    } else {
	      var ranges = copyableRanges(cm);
	      setLastCopied({lineWise: true, text: ranges.text});
	      if (e.type == "cut") {
	        cm.operation(function () {
	          cm.setSelections(ranges.ranges, 0, sel_dontScroll);
	          cm.replaceSelection("", null, "cut");
	        });
	      }
	    }
	    if (e.clipboardData) {
	      e.clipboardData.clearData();
	      var content = lastCopied.text.join("\n");
	      // iOS exposes the clipboard API, but seems to discard content inserted into it
	      e.clipboardData.setData("Text", content);
	      if (e.clipboardData.getData("Text") == content) {
	        e.preventDefault();
	        return
	      }
	    }
	    // Old-fashioned briefly-focus-a-textarea hack
	    var kludge = hiddenTextarea(), te = kludge.firstChild;
	    cm.display.lineSpace.insertBefore(kludge, cm.display.lineSpace.firstChild);
	    te.value = lastCopied.text.join("\n");
	    var hadFocus = document.activeElement;
	    selectInput(te);
	    setTimeout(function () {
	      cm.display.lineSpace.removeChild(kludge);
	      hadFocus.focus();
	      if (hadFocus == div) { input.showPrimarySelection(); }
	    }, 50);
	  }
	  on(div, "copy", onCopyCut);
	  on(div, "cut", onCopyCut);
	};

	ContentEditableInput.prototype.prepareSelection = function () {
	  var result = prepareSelection(this.cm, false);
	  result.focus = this.cm.state.focused;
	  return result
	};

	ContentEditableInput.prototype.showSelection = function (info, takeFocus) {
	  if (!info || !this.cm.display.view.length) { return }
	  if (info.focus || takeFocus) { this.showPrimarySelection(); }
	  this.showMultipleSelections(info);
	};

	ContentEditableInput.prototype.getSelection = function () {
	  return this.cm.display.wrapper.ownerDocument.getSelection()
	};

	ContentEditableInput.prototype.showPrimarySelection = function () {
	  var sel = this.getSelection(), cm = this.cm, prim = cm.doc.sel.primary();
	  var from = prim.from(), to = prim.to();

	  if (cm.display.viewTo == cm.display.viewFrom || from.line >= cm.display.viewTo || to.line < cm.display.viewFrom) {
	    sel.removeAllRanges();
	    return
	  }

	  var curAnchor = domToPos(cm, sel.anchorNode, sel.anchorOffset);
	  var curFocus = domToPos(cm, sel.focusNode, sel.focusOffset);
	  if (curAnchor && !curAnchor.bad && curFocus && !curFocus.bad &&
	      cmp(minPos(curAnchor, curFocus), from) == 0 &&
	      cmp(maxPos(curAnchor, curFocus), to) == 0)
	    { return }

	  var view = cm.display.view;
	  var start = (from.line >= cm.display.viewFrom && posToDOM(cm, from)) ||
	      {node: view[0].measure.map[2], offset: 0};
	  var end = to.line < cm.display.viewTo && posToDOM(cm, to);
	  if (!end) {
	    var measure = view[view.length - 1].measure;
	    var map$$1 = measure.maps ? measure.maps[measure.maps.length - 1] : measure.map;
	    end = {node: map$$1[map$$1.length - 1], offset: map$$1[map$$1.length - 2] - map$$1[map$$1.length - 3]};
	  }

	  if (!start || !end) {
	    sel.removeAllRanges();
	    return
	  }

	  var old = sel.rangeCount && sel.getRangeAt(0), rng;
	  try { rng = range(start.node, start.offset, end.offset, end.node); }
	  catch(e) {} // Our model of the DOM might be outdated, in which case the range we try to set can be impossible
	  if (rng) {
	    if (!gecko && cm.state.focused) {
	      sel.collapse(start.node, start.offset);
	      if (!rng.collapsed) {
	        sel.removeAllRanges();
	        sel.addRange(rng);
	      }
	    } else {
	      sel.removeAllRanges();
	      sel.addRange(rng);
	    }
	    if (old && sel.anchorNode == null) { sel.addRange(old); }
	    else if (gecko) { this.startGracePeriod(); }
	  }
	  this.rememberSelection();
	};

	ContentEditableInput.prototype.startGracePeriod = function () {
	    var this$1 = this;

	  clearTimeout(this.gracePeriod);
	  this.gracePeriod = setTimeout(function () {
	    this$1.gracePeriod = false;
	    if (this$1.selectionChanged())
	      { this$1.cm.operation(function () { return this$1.cm.curOp.selectionChanged = true; }); }
	  }, 20);
	};

	ContentEditableInput.prototype.showMultipleSelections = function (info) {
	  removeChildrenAndAdd(this.cm.display.cursorDiv, info.cursors);
	  removeChildrenAndAdd(this.cm.display.selectionDiv, info.selection);
	};

	ContentEditableInput.prototype.rememberSelection = function () {
	  var sel = this.getSelection();
	  this.lastAnchorNode = sel.anchorNode; this.lastAnchorOffset = sel.anchorOffset;
	  this.lastFocusNode = sel.focusNode; this.lastFocusOffset = sel.focusOffset;
	};

	ContentEditableInput.prototype.selectionInEditor = function () {
	  var sel = this.getSelection();
	  if (!sel.rangeCount) { return false }
	  var node = sel.getRangeAt(0).commonAncestorContainer;
	  return contains(this.div, node)
	};

	ContentEditableInput.prototype.focus = function () {
	  if (this.cm.options.readOnly != "nocursor") {
	    if (!this.selectionInEditor())
	      { this.showSelection(this.prepareSelection(), true); }
	    this.div.focus();
	  }
	};
	ContentEditableInput.prototype.blur = function () { this.div.blur(); };
	ContentEditableInput.prototype.getField = function () { return this.div };

	ContentEditableInput.prototype.supportsTouch = function () { return true };

	ContentEditableInput.prototype.receivedFocus = function () {
	  var input = this;
	  if (this.selectionInEditor())
	    { this.pollSelection(); }
	  else
	    { runInOp(this.cm, function () { return input.cm.curOp.selectionChanged = true; }); }

	  function poll() {
	    if (input.cm.state.focused) {
	      input.pollSelection();
	      input.polling.set(input.cm.options.pollInterval, poll);
	    }
	  }
	  this.polling.set(this.cm.options.pollInterval, poll);
	};

	ContentEditableInput.prototype.selectionChanged = function () {
	  var sel = this.getSelection();
	  return sel.anchorNode != this.lastAnchorNode || sel.anchorOffset != this.lastAnchorOffset ||
	    sel.focusNode != this.lastFocusNode || sel.focusOffset != this.lastFocusOffset
	};

	ContentEditableInput.prototype.pollSelection = function () {
	  if (this.readDOMTimeout != null || this.gracePeriod || !this.selectionChanged()) { return }
	  var sel = this.getSelection(), cm = this.cm;
	  // On Android Chrome (version 56, at least), backspacing into an
	  // uneditable block element will put the cursor in that element,
	  // and then, because it's not editable, hide the virtual keyboard.
	  // Because Android doesn't allow us to actually detect backspace
	  // presses in a sane way, this code checks for when that happens
	  // and simulates a backspace press in this case.
	  if (android && chrome && this.cm.options.gutters.length && isInGutter(sel.anchorNode)) {
	    this.cm.triggerOnKeyDown({type: "keydown", keyCode: 8, preventDefault: Math.abs});
	    this.blur();
	    this.focus();
	    return
	  }
	  if (this.composing) { return }
	  this.rememberSelection();
	  var anchor = domToPos(cm, sel.anchorNode, sel.anchorOffset);
	  var head = domToPos(cm, sel.focusNode, sel.focusOffset);
	  if (anchor && head) { runInOp(cm, function () {
	    setSelection(cm.doc, simpleSelection(anchor, head), sel_dontScroll);
	    if (anchor.bad || head.bad) { cm.curOp.selectionChanged = true; }
	  }); }
	};

	ContentEditableInput.prototype.pollContent = function () {
	  if (this.readDOMTimeout != null) {
	    clearTimeout(this.readDOMTimeout);
	    this.readDOMTimeout = null;
	  }

	  var cm = this.cm, display = cm.display, sel = cm.doc.sel.primary();
	  var from = sel.from(), to = sel.to();
	  if (from.ch == 0 && from.line > cm.firstLine())
	    { from = Pos(from.line - 1, getLine(cm.doc, from.line - 1).length); }
	  if (to.ch == getLine(cm.doc, to.line).text.length && to.line < cm.lastLine())
	    { to = Pos(to.line + 1, 0); }
	  if (from.line < display.viewFrom || to.line > display.viewTo - 1) { return false }

	  var fromIndex, fromLine, fromNode;
	  if (from.line == display.viewFrom || (fromIndex = findViewIndex(cm, from.line)) == 0) {
	    fromLine = lineNo(display.view[0].line);
	    fromNode = display.view[0].node;
	  } else {
	    fromLine = lineNo(display.view[fromIndex].line);
	    fromNode = display.view[fromIndex - 1].node.nextSibling;
	  }
	  var toIndex = findViewIndex(cm, to.line);
	  var toLine, toNode;
	  if (toIndex == display.view.length - 1) {
	    toLine = display.viewTo - 1;
	    toNode = display.lineDiv.lastChild;
	  } else {
	    toLine = lineNo(display.view[toIndex + 1].line) - 1;
	    toNode = display.view[toIndex + 1].node.previousSibling;
	  }

	  if (!fromNode) { return false }
	  var newText = cm.doc.splitLines(domTextBetween(cm, fromNode, toNode, fromLine, toLine));
	  var oldText = getBetween(cm.doc, Pos(fromLine, 0), Pos(toLine, getLine(cm.doc, toLine).text.length));
	  while (newText.length > 1 && oldText.length > 1) {
	    if (lst(newText) == lst(oldText)) { newText.pop(); oldText.pop(); toLine--; }
	    else if (newText[0] == oldText[0]) { newText.shift(); oldText.shift(); fromLine++; }
	    else { break }
	  }

	  var cutFront = 0, cutEnd = 0;
	  var newTop = newText[0], oldTop = oldText[0], maxCutFront = Math.min(newTop.length, oldTop.length);
	  while (cutFront < maxCutFront && newTop.charCodeAt(cutFront) == oldTop.charCodeAt(cutFront))
	    { ++cutFront; }
	  var newBot = lst(newText), oldBot = lst(oldText);
	  var maxCutEnd = Math.min(newBot.length - (newText.length == 1 ? cutFront : 0),
	                           oldBot.length - (oldText.length == 1 ? cutFront : 0));
	  while (cutEnd < maxCutEnd &&
	         newBot.charCodeAt(newBot.length - cutEnd - 1) == oldBot.charCodeAt(oldBot.length - cutEnd - 1))
	    { ++cutEnd; }
	  // Try to move start of change to start of selection if ambiguous
	  if (newText.length == 1 && oldText.length == 1 && fromLine == from.line) {
	    while (cutFront && cutFront > from.ch &&
	           newBot.charCodeAt(newBot.length - cutEnd - 1) == oldBot.charCodeAt(oldBot.length - cutEnd - 1)) {
	      cutFront--;
	      cutEnd++;
	    }
	  }

	  newText[newText.length - 1] = newBot.slice(0, newBot.length - cutEnd).replace(/^\u200b+/, "");
	  newText[0] = newText[0].slice(cutFront).replace(/\u200b+$/, "");

	  var chFrom = Pos(fromLine, cutFront);
	  var chTo = Pos(toLine, oldText.length ? lst(oldText).length - cutEnd : 0);
	  if (newText.length > 1 || newText[0] || cmp(chFrom, chTo)) {
	    replaceRange(cm.doc, newText, chFrom, chTo, "+input");
	    return true
	  }
	};

	ContentEditableInput.prototype.ensurePolled = function () {
	  this.forceCompositionEnd();
	};
	ContentEditableInput.prototype.reset = function () {
	  this.forceCompositionEnd();
	};
	ContentEditableInput.prototype.forceCompositionEnd = function () {
	  if (!this.composing) { return }
	  clearTimeout(this.readDOMTimeout);
	  this.composing = null;
	  this.updateFromDOM();
	  this.div.blur();
	  this.div.focus();
	};
	ContentEditableInput.prototype.readFromDOMSoon = function () {
	    var this$1 = this;

	  if (this.readDOMTimeout != null) { return }
	  this.readDOMTimeout = setTimeout(function () {
	    this$1.readDOMTimeout = null;
	    if (this$1.composing) {
	      if (this$1.composing.done) { this$1.composing = null; }
	      else { return }
	    }
	    this$1.updateFromDOM();
	  }, 80);
	};

	ContentEditableInput.prototype.updateFromDOM = function () {
	    var this$1 = this;

	  if (this.cm.isReadOnly() || !this.pollContent())
	    { runInOp(this.cm, function () { return regChange(this$1.cm); }); }
	};

	ContentEditableInput.prototype.setUneditable = function (node) {
	  node.contentEditable = "false";
	};

	ContentEditableInput.prototype.onKeyPress = function (e) {
	  if (e.charCode == 0 || this.composing) { return }
	  e.preventDefault();
	  if (!this.cm.isReadOnly())
	    { operation(this.cm, applyTextInput)(this.cm, String.fromCharCode(e.charCode == null ? e.keyCode : e.charCode), 0); }
	};

	ContentEditableInput.prototype.readOnlyChanged = function (val) {
	  this.div.contentEditable = String(val != "nocursor");
	};

	ContentEditableInput.prototype.onContextMenu = function () {};
	ContentEditableInput.prototype.resetPosition = function () {};

	ContentEditableInput.prototype.needsContentAttribute = true;

	function posToDOM(cm, pos) {
	  var view = findViewForLine(cm, pos.line);
	  if (!view || view.hidden) { return null }
	  var line = getLine(cm.doc, pos.line);
	  var info = mapFromLineView(view, line, pos.line);

	  var order = getOrder(line, cm.doc.direction), side = "left";
	  if (order) {
	    var partPos = getBidiPartAt(order, pos.ch);
	    side = partPos % 2 ? "right" : "left";
	  }
	  var result = nodeAndOffsetInLineMap(info.map, pos.ch, side);
	  result.offset = result.collapse == "right" ? result.end : result.start;
	  return result
	}

	function isInGutter(node) {
	  for (var scan = node; scan; scan = scan.parentNode)
	    { if (/CodeMirror-gutter-wrapper/.test(scan.className)) { return true } }
	  return false
	}

	function badPos(pos, bad) { if (bad) { pos.bad = true; } return pos }

	function domTextBetween(cm, from, to, fromLine, toLine) {
	  var text = "", closing = false, lineSep = cm.doc.lineSeparator(), extraLinebreak = false;
	  function recognizeMarker(id) { return function (marker) { return marker.id == id; } }
	  function close() {
	    if (closing) {
	      text += lineSep;
	      if (extraLinebreak) { text += lineSep; }
	      closing = extraLinebreak = false;
	    }
	  }
	  function addText(str) {
	    if (str) {
	      close();
	      text += str;
	    }
	  }
	  function walk(node) {
	    if (node.nodeType == 1) {
	      var cmText = node.getAttribute("cm-text");
	      if (cmText) {
	        addText(cmText);
	        return
	      }
	      var markerID = node.getAttribute("cm-marker"), range$$1;
	      if (markerID) {
	        var found = cm.findMarks(Pos(fromLine, 0), Pos(toLine + 1, 0), recognizeMarker(+markerID));
	        if (found.length && (range$$1 = found[0].find(0)))
	          { addText(getBetween(cm.doc, range$$1.from, range$$1.to).join(lineSep)); }
	        return
	      }
	      if (node.getAttribute("contenteditable") == "false") { return }
	      var isBlock = /^(pre|div|p|li|table|br)$/i.test(node.nodeName);
	      if (!/^br$/i.test(node.nodeName) && node.textContent.length == 0) { return }

	      if (isBlock) { close(); }
	      for (var i = 0; i < node.childNodes.length; i++)
	        { walk(node.childNodes[i]); }

	      if (/^(pre|p)$/i.test(node.nodeName)) { extraLinebreak = true; }
	      if (isBlock) { closing = true; }
	    } else if (node.nodeType == 3) {
	      addText(node.nodeValue.replace(/\u200b/g, "").replace(/\u00a0/g, " "));
	    }
	  }
	  for (;;) {
	    walk(from);
	    if (from == to) { break }
	    from = from.nextSibling;
	    extraLinebreak = false;
	  }
	  return text
	}

	function domToPos(cm, node, offset) {
	  var lineNode;
	  if (node == cm.display.lineDiv) {
	    lineNode = cm.display.lineDiv.childNodes[offset];
	    if (!lineNode) { return badPos(cm.clipPos(Pos(cm.display.viewTo - 1)), true) }
	    node = null; offset = 0;
	  } else {
	    for (lineNode = node;; lineNode = lineNode.parentNode) {
	      if (!lineNode || lineNode == cm.display.lineDiv) { return null }
	      if (lineNode.parentNode && lineNode.parentNode == cm.display.lineDiv) { break }
	    }
	  }
	  for (var i = 0; i < cm.display.view.length; i++) {
	    var lineView = cm.display.view[i];
	    if (lineView.node == lineNode)
	      { return locateNodeInLineView(lineView, node, offset) }
	  }
	}

	function locateNodeInLineView(lineView, node, offset) {
	  var wrapper = lineView.text.firstChild, bad = false;
	  if (!node || !contains(wrapper, node)) { return badPos(Pos(lineNo(lineView.line), 0), true) }
	  if (node == wrapper) {
	    bad = true;
	    node = wrapper.childNodes[offset];
	    offset = 0;
	    if (!node) {
	      var line = lineView.rest ? lst(lineView.rest) : lineView.line;
	      return badPos(Pos(lineNo(line), line.text.length), bad)
	    }
	  }

	  var textNode = node.nodeType == 3 ? node : null, topNode = node;
	  if (!textNode && node.childNodes.length == 1 && node.firstChild.nodeType == 3) {
	    textNode = node.firstChild;
	    if (offset) { offset = textNode.nodeValue.length; }
	  }
	  while (topNode.parentNode != wrapper) { topNode = topNode.parentNode; }
	  var measure = lineView.measure, maps = measure.maps;

	  function find(textNode, topNode, offset) {
	    for (var i = -1; i < (maps ? maps.length : 0); i++) {
	      var map$$1 = i < 0 ? measure.map : maps[i];
	      for (var j = 0; j < map$$1.length; j += 3) {
	        var curNode = map$$1[j + 2];
	        if (curNode == textNode || curNode == topNode) {
	          var line = lineNo(i < 0 ? lineView.line : lineView.rest[i]);
	          var ch = map$$1[j] + offset;
	          if (offset < 0 || curNode != textNode) { ch = map$$1[j + (offset ? 1 : 0)]; }
	          return Pos(line, ch)
	        }
	      }
	    }
	  }
	  var found = find(textNode, topNode, offset);
	  if (found) { return badPos(found, bad) }

	  // FIXME this is all really shaky. might handle the few cases it needs to handle, but likely to cause problems
	  for (var after = topNode.nextSibling, dist = textNode ? textNode.nodeValue.length - offset : 0; after; after = after.nextSibling) {
	    found = find(after, after.firstChild, 0);
	    if (found)
	      { return badPos(Pos(found.line, found.ch - dist), bad) }
	    else
	      { dist += after.textContent.length; }
	  }
	  for (var before = topNode.previousSibling, dist$1 = offset; before; before = before.previousSibling) {
	    found = find(before, before.firstChild, -1);
	    if (found)
	      { return badPos(Pos(found.line, found.ch + dist$1), bad) }
	    else
	      { dist$1 += before.textContent.length; }
	  }
	}

	// TEXTAREA INPUT STYLE

	var TextareaInput = function(cm) {
	  this.cm = cm;
	  // See input.poll and input.reset
	  this.prevInput = "";

	  // Flag that indicates whether we expect input to appear real soon
	  // now (after some event like 'keypress' or 'input') and are
	  // polling intensively.
	  this.pollingFast = false;
	  // Self-resetting timeout for the poller
	  this.polling = new Delayed();
	  // Used to work around IE issue with selection being forgotten when focus moves away from textarea
	  this.hasSelection = false;
	  this.composing = null;
	};

	TextareaInput.prototype.init = function (display) {
	    var this$1 = this;

	  var input = this, cm = this.cm;
	  this.createField(display);
	  var te = this.textarea;

	  display.wrapper.insertBefore(this.wrapper, display.wrapper.firstChild);

	  // Needed to hide big blue blinking cursor on Mobile Safari (doesn't seem to work in iOS 8 anymore)
	  if (ios) { te.style.width = "0px"; }

	  on(te, "input", function () {
	    if (ie && ie_version >= 9 && this$1.hasSelection) { this$1.hasSelection = null; }
	    input.poll();
	  });

	  on(te, "paste", function (e) {
	    if (signalDOMEvent(cm, e) || handlePaste(e, cm)) { return }

	    cm.state.pasteIncoming = true;
	    input.fastPoll();
	  });

	  function prepareCopyCut(e) {
	    if (signalDOMEvent(cm, e)) { return }
	    if (cm.somethingSelected()) {
	      setLastCopied({lineWise: false, text: cm.getSelections()});
	    } else if (!cm.options.lineWiseCopyCut) {
	      return
	    } else {
	      var ranges = copyableRanges(cm);
	      setLastCopied({lineWise: true, text: ranges.text});
	      if (e.type == "cut") {
	        cm.setSelections(ranges.ranges, null, sel_dontScroll);
	      } else {
	        input.prevInput = "";
	        te.value = ranges.text.join("\n");
	        selectInput(te);
	      }
	    }
	    if (e.type == "cut") { cm.state.cutIncoming = true; }
	  }
	  on(te, "cut", prepareCopyCut);
	  on(te, "copy", prepareCopyCut);

	  on(display.scroller, "paste", function (e) {
	    if (eventInWidget(display, e) || signalDOMEvent(cm, e)) { return }
	    cm.state.pasteIncoming = true;
	    input.focus();
	  });

	  // Prevent normal selection in the editor (we handle our own)
	  on(display.lineSpace, "selectstart", function (e) {
	    if (!eventInWidget(display, e)) { e_preventDefault(e); }
	  });

	  on(te, "compositionstart", function () {
	    var start = cm.getCursor("from");
	    if (input.composing) { input.composing.range.clear(); }
	    input.composing = {
	      start: start,
	      range: cm.markText(start, cm.getCursor("to"), {className: "CodeMirror-composing"})
	    };
	  });
	  on(te, "compositionend", function () {
	    if (input.composing) {
	      input.poll();
	      input.composing.range.clear();
	      input.composing = null;
	    }
	  });
	};

	TextareaInput.prototype.createField = function (_display) {
	  // Wraps and hides input textarea
	  this.wrapper = hiddenTextarea();
	  // The semihidden textarea that is focused when the editor is
	  // focused, and receives input.
	  this.textarea = this.wrapper.firstChild;
	};

	TextareaInput.prototype.prepareSelection = function () {
	  // Redraw the selection and/or cursor
	  var cm = this.cm, display = cm.display, doc = cm.doc;
	  var result = prepareSelection(cm);

	  // Move the hidden textarea near the cursor to prevent scrolling artifacts
	  if (cm.options.moveInputWithCursor) {
	    var headPos = cursorCoords(cm, doc.sel.primary().head, "div");
	    var wrapOff = display.wrapper.getBoundingClientRect(), lineOff = display.lineDiv.getBoundingClientRect();
	    result.teTop = Math.max(0, Math.min(display.wrapper.clientHeight - 10,
	                                        headPos.top + lineOff.top - wrapOff.top));
	    result.teLeft = Math.max(0, Math.min(display.wrapper.clientWidth - 10,
	                                         headPos.left + lineOff.left - wrapOff.left));
	  }

	  return result
	};

	TextareaInput.prototype.showSelection = function (drawn) {
	  var cm = this.cm, display = cm.display;
	  removeChildrenAndAdd(display.cursorDiv, drawn.cursors);
	  removeChildrenAndAdd(display.selectionDiv, drawn.selection);
	  if (drawn.teTop != null) {
	    this.wrapper.style.top = drawn.teTop + "px";
	    this.wrapper.style.left = drawn.teLeft + "px";
	  }
	};

	// Reset the input to correspond to the selection (or to be empty,
	// when not typing and nothing is selected)
	TextareaInput.prototype.reset = function (typing) {
	  if (this.contextMenuPending || this.composing) { return }
	  var cm = this.cm;
	  if (cm.somethingSelected()) {
	    this.prevInput = "";
	    var content = cm.getSelection();
	    this.textarea.value = content;
	    if (cm.state.focused) { selectInput(this.textarea); }
	    if (ie && ie_version >= 9) { this.hasSelection = content; }
	  } else if (!typing) {
	    this.prevInput = this.textarea.value = "";
	    if (ie && ie_version >= 9) { this.hasSelection = null; }
	  }
	};

	TextareaInput.prototype.getField = function () { return this.textarea };

	TextareaInput.prototype.supportsTouch = function () { return false };

	TextareaInput.prototype.focus = function () {
	  if (this.cm.options.readOnly != "nocursor" && (!mobile || activeElt() != this.textarea)) {
	    try { this.textarea.focus(); }
	    catch (e) {} // IE8 will throw if the textarea is display: none or not in DOM
	  }
	};

	TextareaInput.prototype.blur = function () { this.textarea.blur(); };

	TextareaInput.prototype.resetPosition = function () {
	  this.wrapper.style.top = this.wrapper.style.left = 0;
	};

	TextareaInput.prototype.receivedFocus = function () { this.slowPoll(); };

	// Poll for input changes, using the normal rate of polling. This
	// runs as long as the editor is focused.
	TextareaInput.prototype.slowPoll = function () {
	    var this$1 = this;

	  if (this.pollingFast) { return }
	  this.polling.set(this.cm.options.pollInterval, function () {
	    this$1.poll();
	    if (this$1.cm.state.focused) { this$1.slowPoll(); }
	  });
	};

	// When an event has just come in that is likely to add or change
	// something in the input textarea, we poll faster, to ensure that
	// the change appears on the screen quickly.
	TextareaInput.prototype.fastPoll = function () {
	  var missed = false, input = this;
	  input.pollingFast = true;
	  function p() {
	    var changed = input.poll();
	    if (!changed && !missed) {missed = true; input.polling.set(60, p);}
	    else {input.pollingFast = false; input.slowPoll();}
	  }
	  input.polling.set(20, p);
	};

	// Read input from the textarea, and update the document to match.
	// When something is selected, it is present in the textarea, and
	// selected (unless it is huge, in which case a placeholder is
	// used). When nothing is selected, the cursor sits after previously
	// seen text (can be empty), which is stored in prevInput (we must
	// not reset the textarea when typing, because that breaks IME).
	TextareaInput.prototype.poll = function () {
	    var this$1 = this;

	  var cm = this.cm, input = this.textarea, prevInput = this.prevInput;
	  // Since this is called a *lot*, try to bail out as cheaply as
	  // possible when it is clear that nothing happened. hasSelection
	  // will be the case when there is a lot of text in the textarea,
	  // in which case reading its value would be expensive.
	  if (this.contextMenuPending || !cm.state.focused ||
	      (hasSelection(input) && !prevInput && !this.composing) ||
	      cm.isReadOnly() || cm.options.disableInput || cm.state.keySeq)
	    { return false }

	  var text = input.value;
	  // If nothing changed, bail.
	  if (text == prevInput && !cm.somethingSelected()) { return false }
	  // Work around nonsensical selection resetting in IE9/10, and
	  // inexplicable appearance of private area unicode characters on
	  // some key combos in Mac (#2689).
	  if (ie && ie_version >= 9 && this.hasSelection === text ||
	      mac && /[\uf700-\uf7ff]/.test(text)) {
	    cm.display.input.reset();
	    return false
	  }

	  if (cm.doc.sel == cm.display.selForContextMenu) {
	    var first = text.charCodeAt(0);
	    if (first == 0x200b && !prevInput) { prevInput = "\u200b"; }
	    if (first == 0x21da) { this.reset(); return this.cm.execCommand("undo") }
	  }
	  // Find the part of the input that is actually new
	  var same = 0, l = Math.min(prevInput.length, text.length);
	  while (same < l && prevInput.charCodeAt(same) == text.charCodeAt(same)) { ++same; }

	  runInOp(cm, function () {
	    applyTextInput(cm, text.slice(same), prevInput.length - same,
	                   null, this$1.composing ? "*compose" : null);

	    // Don't leave long text in the textarea, since it makes further polling slow
	    if (text.length > 1000 || text.indexOf("\n") > -1) { input.value = this$1.prevInput = ""; }
	    else { this$1.prevInput = text; }

	    if (this$1.composing) {
	      this$1.composing.range.clear();
	      this$1.composing.range = cm.markText(this$1.composing.start, cm.getCursor("to"),
	                                         {className: "CodeMirror-composing"});
	    }
	  });
	  return true
	};

	TextareaInput.prototype.ensurePolled = function () {
	  if (this.pollingFast && this.poll()) { this.pollingFast = false; }
	};

	TextareaInput.prototype.onKeyPress = function () {
	  if (ie && ie_version >= 9) { this.hasSelection = null; }
	  this.fastPoll();
	};

	TextareaInput.prototype.onContextMenu = function (e) {
	  var input = this, cm = input.cm, display = cm.display, te = input.textarea;
	  var pos = posFromMouse(cm, e), scrollPos = display.scroller.scrollTop;
	  if (!pos || presto) { return } // Opera is difficult.

	  // Reset the current text selection only if the click is done outside of the selection
	  // and 'resetSelectionOnContextMenu' option is true.
	  var reset = cm.options.resetSelectionOnContextMenu;
	  if (reset && cm.doc.sel.contains(pos) == -1)
	    { operation(cm, setSelection)(cm.doc, simpleSelection(pos), sel_dontScroll); }

	  var oldCSS = te.style.cssText, oldWrapperCSS = input.wrapper.style.cssText;
	  input.wrapper.style.cssText = "position: absolute";
	  var wrapperBox = input.wrapper.getBoundingClientRect();
	  te.style.cssText = "position: absolute; width: 30px; height: 30px;\n      top: " + (e.clientY - wrapperBox.top - 5) + "px; left: " + (e.clientX - wrapperBox.left - 5) + "px;\n      z-index: 1000; background: " + (ie ? "rgba(255, 255, 255, .05)" : "transparent") + ";\n      outline: none; border-width: 0; outline: none; overflow: hidden; opacity: .05; filter: alpha(opacity=5);";
	  var oldScrollY;
	  if (webkit) { oldScrollY = window.scrollY; } // Work around Chrome issue (#2712)
	  display.input.focus();
	  if (webkit) { window.scrollTo(null, oldScrollY); }
	  display.input.reset();
	  // Adds "Select all" to context menu in FF
	  if (!cm.somethingSelected()) { te.value = input.prevInput = " "; }
	  input.contextMenuPending = true;
	  display.selForContextMenu = cm.doc.sel;
	  clearTimeout(display.detectingSelectAll);

	  // Select-all will be greyed out if there's nothing to select, so
	  // this adds a zero-width space so that we can later check whether
	  // it got selected.
	  function prepareSelectAllHack() {
	    if (te.selectionStart != null) {
	      var selected = cm.somethingSelected();
	      var extval = "\u200b" + (selected ? te.value : "");
	      te.value = "\u21da"; // Used to catch context-menu undo
	      te.value = extval;
	      input.prevInput = selected ? "" : "\u200b";
	      te.selectionStart = 1; te.selectionEnd = extval.length;
	      // Re-set this, in case some other handler touched the
	      // selection in the meantime.
	      display.selForContextMenu = cm.doc.sel;
	    }
	  }
	  function rehide() {
	    input.contextMenuPending = false;
	    input.wrapper.style.cssText = oldWrapperCSS;
	    te.style.cssText = oldCSS;
	    if (ie && ie_version < 9) { display.scrollbars.setScrollTop(display.scroller.scrollTop = scrollPos); }

	    // Try to detect the user choosing select-all
	    if (te.selectionStart != null) {
	      if (!ie || (ie && ie_version < 9)) { prepareSelectAllHack(); }
	      var i = 0, poll = function () {
	        if (display.selForContextMenu == cm.doc.sel && te.selectionStart == 0 &&
	            te.selectionEnd > 0 && input.prevInput == "\u200b") {
	          operation(cm, selectAll)(cm);
	        } else if (i++ < 10) {
	          display.detectingSelectAll = setTimeout(poll, 500);
	        } else {
	          display.selForContextMenu = null;
	          display.input.reset();
	        }
	      };
	      display.detectingSelectAll = setTimeout(poll, 200);
	    }
	  }

	  if (ie && ie_version >= 9) { prepareSelectAllHack(); }
	  if (captureRightClick) {
	    e_stop(e);
	    var mouseup = function () {
	      off(window, "mouseup", mouseup);
	      setTimeout(rehide, 20);
	    };
	    on(window, "mouseup", mouseup);
	  } else {
	    setTimeout(rehide, 50);
	  }
	};

	TextareaInput.prototype.readOnlyChanged = function (val) {
	  if (!val) { this.reset(); }
	  this.textarea.disabled = val == "nocursor";
	};

	TextareaInput.prototype.setUneditable = function () {};

	TextareaInput.prototype.needsContentAttribute = false;

	function fromTextArea(textarea, options) {
	  options = options ? copyObj(options) : {};
	  options.value = textarea.value;
	  if (!options.tabindex && textarea.tabIndex)
	    { options.tabindex = textarea.tabIndex; }
	  if (!options.placeholder && textarea.placeholder)
	    { options.placeholder = textarea.placeholder; }
	  // Set autofocus to true if this textarea is focused, or if it has
	  // autofocus and no other element is focused.
	  if (options.autofocus == null) {
	    var hasFocus = activeElt();
	    options.autofocus = hasFocus == textarea ||
	      textarea.getAttribute("autofocus") != null && hasFocus == document.body;
	  }

	  function save() {textarea.value = cm.getValue();}

	  var realSubmit;
	  if (textarea.form) {
	    on(textarea.form, "submit", save);
	    // Deplorable hack to make the submit method do the right thing.
	    if (!options.leaveSubmitMethodAlone) {
	      var form = textarea.form;
	      realSubmit = form.submit;
	      try {
	        var wrappedSubmit = form.submit = function () {
	          save();
	          form.submit = realSubmit;
	          form.submit();
	          form.submit = wrappedSubmit;
	        };
	      } catch(e) {}
	    }
	  }

	  options.finishInit = function (cm) {
	    cm.save = save;
	    cm.getTextArea = function () { return textarea; };
	    cm.toTextArea = function () {
	      cm.toTextArea = isNaN; // Prevent this from being ran twice
	      save();
	      textarea.parentNode.removeChild(cm.getWrapperElement());
	      textarea.style.display = "";
	      if (textarea.form) {
	        off(textarea.form, "submit", save);
	        if (typeof textarea.form.submit == "function")
	          { textarea.form.submit = realSubmit; }
	      }
	    };
	  };

	  textarea.style.display = "none";
	  var cm = CodeMirror$1(function (node) { return textarea.parentNode.insertBefore(node, textarea.nextSibling); },
	    options);
	  return cm
	}

	function addLegacyProps(CodeMirror) {
	  CodeMirror.off = off;
	  CodeMirror.on = on;
	  CodeMirror.wheelEventPixels = wheelEventPixels;
	  CodeMirror.Doc = Doc;
	  CodeMirror.splitLines = splitLinesAuto;
	  CodeMirror.countColumn = countColumn;
	  CodeMirror.findColumn = findColumn;
	  CodeMirror.isWordChar = isWordCharBasic;
	  CodeMirror.Pass = Pass;
	  CodeMirror.signal = signal;
	  CodeMirror.Line = Line;
	  CodeMirror.changeEnd = changeEnd;
	  CodeMirror.scrollbarModel = scrollbarModel;
	  CodeMirror.Pos = Pos;
	  CodeMirror.cmpPos = cmp;
	  CodeMirror.modes = modes;
	  CodeMirror.mimeModes = mimeModes;
	  CodeMirror.resolveMode = resolveMode;
	  CodeMirror.getMode = getMode;
	  CodeMirror.modeExtensions = modeExtensions;
	  CodeMirror.extendMode = extendMode;
	  CodeMirror.copyState = copyState;
	  CodeMirror.startState = startState;
	  CodeMirror.innerMode = innerMode;
	  CodeMirror.commands = commands;
	  CodeMirror.keyMap = keyMap;
	  CodeMirror.keyName = keyName;
	  CodeMirror.isModifierKey = isModifierKey;
	  CodeMirror.lookupKey = lookupKey;
	  CodeMirror.normalizeKeyMap = normalizeKeyMap;
	  CodeMirror.StringStream = StringStream;
	  CodeMirror.SharedTextMarker = SharedTextMarker;
	  CodeMirror.TextMarker = TextMarker;
	  CodeMirror.LineWidget = LineWidget;
	  CodeMirror.e_preventDefault = e_preventDefault;
	  CodeMirror.e_stopPropagation = e_stopPropagation;
	  CodeMirror.e_stop = e_stop;
	  CodeMirror.addClass = addClass;
	  CodeMirror.contains = contains;
	  CodeMirror.rmClass = rmClass;
	  CodeMirror.keyNames = keyNames;
	}

	// EDITOR CONSTRUCTOR

	defineOptions(CodeMirror$1);

	addEditorMethods(CodeMirror$1);

	// Set up methods on CodeMirror's prototype to redirect to the editor's document.
	var dontDelegate = "iter insert remove copy getEditor constructor".split(" ");
	for (var prop in Doc.prototype) { if (Doc.prototype.hasOwnProperty(prop) && indexOf(dontDelegate, prop) < 0)
	  { CodeMirror$1.prototype[prop] = (function(method) {
	    return function() {return method.apply(this.doc, arguments)}
	  })(Doc.prototype[prop]); } }

	eventMixin(Doc);

	// INPUT HANDLING

	CodeMirror$1.inputStyles = {"textarea": TextareaInput, "contenteditable": ContentEditableInput};

	// MODE DEFINITION AND QUERYING

	// Extra arguments are stored as the mode's dependencies, which is
	// used by (legacy) mechanisms like loadmode.js to automatically
	// load a mode. (Preferred mechanism is the require/define calls.)
	CodeMirror$1.defineMode = function(name/*, mode, …*/) {
	  if (!CodeMirror$1.defaults.mode && name != "null") { CodeMirror$1.defaults.mode = name; }
	  defineMode.apply(this, arguments);
	};

	CodeMirror$1.defineMIME = defineMIME;

	// Minimal default mode.
	CodeMirror$1.defineMode("null", function () { return ({token: function (stream) { return stream.skipToEnd(); }}); });
	CodeMirror$1.defineMIME("text/plain", "null");

	// EXTENSIONS

	CodeMirror$1.defineExtension = function (name, func) {
	  CodeMirror$1.prototype[name] = func;
	};
	CodeMirror$1.defineDocExtension = function (name, func) {
	  Doc.prototype[name] = func;
	};

	CodeMirror$1.fromTextArea = fromTextArea;

	addLegacyProps(CodeMirror$1);

	CodeMirror$1.version = "5.40.2";

	return CodeMirror$1;

	})));
	});

	//# sourceMappingURL=config.es.js.map

	/**
	 * A streaming, character code-based string reader
	 */
	var StreamReader = function StreamReader(string, start, end) {
		if (end == null && typeof string === 'string') {
			end = string.length;
		}

		this.string = string;
		this.pos = this.start = start || 0;
		this.end = end;
	};

	/**
		 * Returns true only if the stream is at the end of the file.
		 * @returns {Boolean}
		 */
	StreamReader.prototype.eof = function eof () {
		return this.pos >= this.end;
	};

	/**
		 * Creates a new stream instance which is limited to given `start` and `end`
		 * range. E.g. its `eof()` method will look at `end` property, not actual
		 * stream end
		 * @param  {Point} start
		 * @param  {Point} end
		 * @return {StreamReader}
		 */
	StreamReader.prototype.limit = function limit (start, end) {
		return new this.constructor(this.string, start, end);
	};

	/**
		 * Returns the next character code in the stream without advancing it.
		 * Will return NaN at the end of the file.
		 * @returns {Number}
		 */
	StreamReader.prototype.peek = function peek () {
		return this.string.charCodeAt(this.pos);
	};

	/**
		 * Returns the next character in the stream and advances it.
		 * Also returns <code>undefined</code> when no more characters are available.
		 * @returns {Number}
		 */
	StreamReader.prototype.next = function next () {
		if (this.pos < this.string.length) {
			return this.string.charCodeAt(this.pos++);
		}
	};

	/**
		 * `match` can be a character code or a function that takes a character code
		 * and returns a boolean. If the next character in the stream 'matches'
		 * the given argument, it is consumed and returned.
		 * Otherwise, `false` is returned.
		 * @param {Number|Function} match
		 * @returns {Boolean}
		 */
	StreamReader.prototype.eat = function eat (match) {
		var ch = this.peek();
		var ok = typeof match === 'function' ? match(ch) : ch === match;

		if (ok) {
			this.next();
		}

		return ok;
	};

	/**
		 * Repeatedly calls <code>eat</code> with the given argument, until it
		 * fails. Returns <code>true</code> if any characters were eaten.
		 * @param {Object} match
		 * @returns {Boolean}
		 */
	StreamReader.prototype.eatWhile = function eatWhile (match) {
		var start = this.pos;
		while (!this.eof() && this.eat(match)) {}
		return this.pos !== start;
	};

	/**
		 * Backs up the stream n characters. Backing it up further than the
		 * start of the current token will cause things to break, so be careful.
		 * @param {Number} n
		 */
	StreamReader.prototype.backUp = function backUp (n) {
		this.pos -= (n || 1);
	};

	/**
		 * Get the string between the start of the current token and the
		 * current stream position.
		 * @returns {String}
		 */
	StreamReader.prototype.current = function current () {
		return this.substring(this.start, this.pos);
	};

	/**
		 * Returns substring for given range
		 * @param  {Number} start
		 * @param  {Number} [end]
		 * @return {String}
		 */
	StreamReader.prototype.substring = function substring (start, end) {
		return this.string.slice(start, end);
	};

	/**
		 * Creates error object with current stream state
		 * @param {String} message
		 * @return {Error}
		 */
	StreamReader.prototype.error = function error (message) {
		var err = new Error((message + " at char " + (this.pos + 1)));
		err.originalMessage = message;
		err.pos = this.pos;
		err.string = this.string;
		return err;
	};

	/**
	 * Methods for consuming quoted values
	 */

	//# sourceMappingURL=field-parser.es.js.map

	/**
	 * Minimalistic backwards stream reader
	 */

	var code = function (ch) { return ch.charCodeAt(0); };
	var SQUARE_BRACE_L = code('[');
	var SQUARE_BRACE_R = code(']');
	var ROUND_BRACE_L  = code('(');
	var ROUND_BRACE_R  = code(')');
	var CURLY_BRACE_L  = code('{');
	var CURLY_BRACE_R  = code('}');

	var specialChars = new Set('#.*:$-_!@%^+>/'.split('').map(code));
	var bracePairs = new Map()
		.set(SQUARE_BRACE_L, SQUARE_BRACE_R)
		.set(ROUND_BRACE_L,  ROUND_BRACE_R)
		.set(CURLY_BRACE_L,  CURLY_BRACE_R);

	/**
	 * Attribute descriptor of parsed abbreviation node
	 * @param {String} name Attribute name
	 * @param {String} value Attribute value
	 * @param {Object} options Additional custom attribute options
	 * @param {Boolean} options.boolean Attribute is boolean (e.g. name equals value)
	 * @param {Boolean} options.implied Attribute is implied (e.g. must be outputted
	 * only if contains non-null value)
	 */
	var Attribute = function Attribute(name, value, options) {
		this.name = name;
		this.value = value != null ? value : null;
		this.options = options || {};
	};

	/**
		 * Create a copy of current attribute
		 * @return {Attribute}
		 */
	Attribute.prototype.clone = function clone () {
		return new Attribute(this.name, this.value, Object.assign({}, this.options));
	};

	/**
		 * A string representation of current node
		 */
	Attribute.prototype.valueOf = function valueOf () {
		return ((this.name) + "=\"" + (this.value) + "\"");
	};

	/**
	 * A parsed abbreviation AST node. Nodes build up an abbreviation AST tree
	 */
	var Node = function Node(name, attributes) {
		var this$1 = this;

		// own properties
		this.name = name || null;
		this.value = null;
		this.repeat = null;
		this.selfClosing = false;

		this.children = [];

		/** @type {Node} Pointer to parent node */
		this.parent = null;

		/** @type {Node} Pointer to next sibling */
		this.next = null;

		/** @type {Node} Pointer to previous sibling */
		this.previous = null;

		this._attributes = [];

		if (Array.isArray(attributes)) {
			attributes.forEach(function (attr) { return this$1.setAttribute(attr); });
		}
	};

	var prototypeAccessors = { attributes: { configurable: true },attributesMap: { configurable: true },isGroup: { configurable: true },isTextOnly: { configurable: true },firstChild: { configurable: true },lastChild: { configurable: true },childIndex: { configurable: true },nextSibling: { configurable: true },previousSibling: { configurable: true },classList: { configurable: true } };

	/**
		 * Array of current node attributes
		 * @return {Attribute[]} Array of attributes
		 */
	prototypeAccessors.attributes.get = function () {
		return this._attributes;
	};

	/**
		 * A shorthand to retreive node attributes as map
		 * @return {Object}
		 */
	prototypeAccessors.attributesMap.get = function () {
		return this.attributes.reduce(function (out, attr) {
			out[attr.name] = attr.options.boolean ? attr.name : attr.value;
			return out;
		}, {});
	};

	/**
		 * Check if current node is a grouping one, e.g. has no actual representation
		 * and is used for grouping subsequent nodes only
		 * @return {Boolean}
		 */
	prototypeAccessors.isGroup.get = function () {
		return !this.name && !this.value && !this._attributes.length;
	};

	/**
		 * Check if given node is a text-only node, e.g. contains only value
		 * @return {Boolean}
		 */
	prototypeAccessors.isTextOnly.get = function () {
		return !this.name && !!this.value && !this._attributes.length;
	};

	/**
		 * Returns first child node
		 * @return {Node}
		 */
	prototypeAccessors.firstChild.get = function () {
		return this.children[0];
	};

	/**
		 * Returns last child of current node
		 * @return {Node}
		 */
	prototypeAccessors.lastChild.get = function () {
		return this.children[this.children.length - 1];
	};

	/**
		 * Return index of current node in its parent child list
		 * @return {Number} Returns -1 if current node is a root one
		 */
	prototypeAccessors.childIndex.get = function () {
		return this.parent ? this.parent.children.indexOf(this) : -1;
	};

	/**
		 * Returns next sibling of current node
		 * @return {Node}
		 */
	prototypeAccessors.nextSibling.get = function () {
		return this.next;
	};

	/**
		 * Returns previous sibling of current node
		 * @return {Node}
		 */
	prototypeAccessors.previousSibling.get = function () {
		return this.previous;
	};

	/**
		 * Returns array of unique class names in current node
		 * @return {String[]}
		 */
	prototypeAccessors.classList.get = function () {
		var attr = this.getAttribute('class');
		return attr && attr.value
			? attr.value.split(/\s+/g).filter(uniqueClass)
			: [];
	};

	/**
		 * Convenient alias to create a new node instance
		 * @param {String} [name] Node name
		 * @param {Object} [attributes] Attributes hash
		 * @return {Node}
		 */
	Node.prototype.create = function create (name, attributes) {
		return new Node(name, attributes);
	};

	/**
		 * Sets given attribute for current node
		 * @param {String|Object|Attribute} name Attribute name or attribute object
		 * @param {String} [value] Attribute value
		 */
	Node.prototype.setAttribute = function setAttribute (name, value) {
		var attr = createAttribute(name, value);
		var curAttr = this.getAttribute(name);
		if (curAttr) {
			this.replaceAttribute(curAttr, attr);
		} else {
			this._attributes.push(attr);
		}
	};

	/**
		 * Check if attribute with given name exists in node
		 * @param  {String} name
		 * @return {Boolean}
		 */
	Node.prototype.hasAttribute = function hasAttribute (name) {
		return !!this.getAttribute(name);
	};

	/**
		 * Returns attribute object by given name
		 * @param  {String} name
		 * @return {Attribute}
		 */
	Node.prototype.getAttribute = function getAttribute (name) {
		if (typeof name === 'object') {
			name = name.name;
		}

		for (var i = 0; i < this._attributes.length; i++) {
			var attr = this._attributes[i];
			if (attr.name === name) {
				return attr;
			}
		}
	};

	/**
		 * Replaces attribute with new instance
		 * @param {String|Attribute} curAttribute Current attribute name or instance
		 * to replace
		 * @param {String|Object|Attribute} newName New attribute name or attribute object
		 * @param {String} [newValue] New attribute value
		 */
	Node.prototype.replaceAttribute = function replaceAttribute (curAttribute, newName, newValue) {
		if (typeof curAttribute === 'string') {
			curAttribute = this.getAttribute(curAttribute);
		}

		var ix = this._attributes.indexOf(curAttribute);
		if (ix !== -1) {
			this._attributes.splice(ix, 1, createAttribute(newName, newValue));
		}
	};

	/**
		 * Removes attribute with given name
		 * @param  {String|Attribute} attr Atrtibute name or instance
		 */
	Node.prototype.removeAttribute = function removeAttribute (attr) {
		if (typeof attr === 'string') {
			attr = this.getAttribute(attr);
		}

		var ix = this._attributes.indexOf(attr);
		if (ix !== -1) {
			this._attributes.splice(ix, 1);
		}
	};

	/**
		 * Removes all attributes from current node
		 */
	Node.prototype.clearAttributes = function clearAttributes () {
		this._attributes.length = 0;
	};

	/**
		 * Adds given class name to class attribute
		 * @param {String} token Class name token
		 */
	Node.prototype.addClass = function addClass (token) {
		token = normalize(token);

		if (!this.hasAttribute('class')) {
			this.setAttribute('class', token);
		} else if (token && !this.hasClass(token)) {
			this.setAttribute('class', this.classList.concat(token).join(' '));
		}
	};

	/**
		 * Check if current node contains given class name
		 * @param {String} token Class name token
		 * @return {Boolean}
		 */
	Node.prototype.hasClass = function hasClass (token) {
		return this.classList.indexOf(normalize(token)) !== -1;
	};

	/**
		 * Removes given class name from class attribute
		 * @param {String} token Class name token
		 */
	Node.prototype.removeClass = function removeClass (token) {
		token = normalize(token);
		if (this.hasClass(token)) {
			this.setAttribute('class', this.classList.filter(function (name) { return name !== token; }).join(' '));
		}
	};

	/**
		 * Appends child to current node
		 * @param {Node} node
		 */
	Node.prototype.appendChild = function appendChild (node) {
		this.insertAt(node, this.children.length);
	};

	/**
		 * Inserts given `newNode` before `refNode` child node
		 * @param {Node} newNode
		 * @param {Node} refNode
		 */
	Node.prototype.insertBefore = function insertBefore (newNode, refNode) {
		this.insertAt(newNode, this.children.indexOf(refNode));
	};

	/**
		 * Insert given `node` at `pos` position of child list
		 * @param {Node} node
		 * @param {Number} pos
		 */
	Node.prototype.insertAt = function insertAt (node, pos) {
		if (pos < 0 || pos > this.children.length) {
			throw new Error('Unable to insert node: position is out of child list range');
		}

		var prev = this.children[pos - 1];
		var next = this.children[pos];

		node.remove();
		node.parent = this;
		this.children.splice(pos, 0, node);

		if (prev) {
			node.previous = prev;
			prev.next = node;
		}

		if (next) {
			node.next = next;
			next.previous = node;
		}
	};

	/**
		 * Removes given child from current node
		 * @param {Node} node
		 */
	Node.prototype.removeChild = function removeChild (node) {
		var ix = this.children.indexOf(node);
		if (ix !== -1) {
			this.children.splice(ix, 1);
			if (node.previous) {
				node.previous.next = node.next;
			}

			if (node.next) {
				node.next.previous = node.previous;
			}

			node.parent = node.next = node.previous = null;
		}
	};

	/**
		 * Removes current node from its parent
		 */
	Node.prototype.remove = function remove () {
		if (this.parent) {
			this.parent.removeChild(this);
		}
	};

	/**
		 * Creates a detached copy of current node
		 * @param {Boolean} deep Clone node contents as well
		 * @return {Node}
		 */
	Node.prototype.clone = function clone (deep) {
		var clone = new Node(this.name);
		clone.value = this.value;
		clone.selfClosing = this.selfClosing;
		if (this.repeat) {
			clone.repeat = Object.assign({}, this.repeat);
		}

		this._attributes.forEach(function (attr) { return clone.setAttribute(attr.clone()); });

		if (deep) {
			this.children.forEach(function (child) { return clone.appendChild(child.clone(true)); });
		}

		return clone;
	};

	/**
		 * Walks on each descendant node and invokes given `fn` function on it.
		 * The function receives two arguments: the node itself and its depth level
		 * from current node. If function returns `false`, it stops walking
		 * @param {Function} fn
		 */
	Node.prototype.walk = function walk (fn, _level) {
		_level = _level || 0;
		var ctx = this.firstChild;

		while (ctx) {
			// in case if context node will be detached during `fn` call
			var next = ctx.next;

			if (fn(ctx, _level) === false || ctx.walk(fn, _level + 1) === false) {
				return false;
			}

			ctx = next;
		}
	};

	/**
		 * A helper method for transformation chaining: runs given `fn` function on
		 * current node and returns the same node
		 */
	Node.prototype.use = function use (fn) {
			var arguments$1 = arguments;

		var args = [this];
		for (var i = 1; i < arguments.length; i++) {
			args.push(arguments$1[i]);
		}

		fn.apply(null, args);
		return this;
	};

	Node.prototype.toString = function toString () {
			var this$1 = this;

		var attrs = this.attributes.map(function (attr) {
			attr = this$1.getAttribute(attr.name);
			var opt = attr.options;
			var out = "" + (opt && opt.implied ? '!' : '') + (attr.name || '');
			if (opt && opt.boolean) {
				out += '.';
			} else if (attr.value != null) {
				out += "=\"" + (attr.value) + "\"";
			}
			return out;
		});

		var out = "" + (this.name || '');
		if (attrs.length) {
			out += "[" + (attrs.join(' ')) + "]";
		}

		if (this.value != null) {
			out += "{" + (this.value) + "}";
		}

		if (this.selfClosing) {
			out += '/';
		}

		if (this.repeat) {
			out += "*" + (this.repeat.count ? this.repeat.count : '');
			if (this.repeat.value != null) {
				out += "@" + (this.repeat.value);
			}
		}

		return out;
	};

	Object.defineProperties( Node.prototype, prototypeAccessors );

	/**
	 * Attribute factory
	 * @param  {String|Attribute|Object} name  Attribute name or attribute descriptor
	 * @param  {*} value Attribute value
	 * @return {Attribute}
	 */
	function createAttribute(name, value) {
		if (name instanceof Attribute) {
			return name;
		}

		if (typeof name === 'string') {
			return new Attribute(name, value);
		}

		if (name && typeof name === 'object') {
			return new Attribute(name.name, name.value, name.options);
		}
	}

	/**
	 * @param  {String} str
	 * @return {String}
	 */
	function normalize(str) {
		return String(str).trim();
	}

	function uniqueClass(item, i, arr) {
		return item && arr.indexOf(item) === i;
	}

	//# sourceMappingURL=abbreviation.es.js.map

	/**
	 * Replaces all unescaped ${variable} occurances in given parsed abbreviation
	 * `tree` with values provided in `variables` hash. Precede `$` with `\` to
	 * escape it and skip replacement
	 * @param {Node} tree Parsed abbreviation tree
	 * @param {Object} variables Variables values
	 * @return {Node}
	 */

	//# sourceMappingURL=markup-formatters.es.js.map

	/**
	 * A wrapper for holding CSS value
	 */
	var CSSValue = function CSSValue() {
		this.type = 'css-value';
		this.value = [];
	};

	var prototypeAccessors$1 = { size: { configurable: true } };

	prototypeAccessors$1.size.get = function () {
		return this.value.length;
	};

	CSSValue.prototype.add = function add (value) {
		this.value.push(value);
	};

	CSSValue.prototype.has = function has (value) {
		return this.value.indexOf(value) !== -1;
	};

	CSSValue.prototype.toString = function toString () {
		return this.value.join(' ');
	};

	Object.defineProperties( CSSValue.prototype, prototypeAccessors$1 );

	var reProperty = /^([a-z-]+)(?:\s*:\s*([^\n\r]+))?$/;

	var CSSSnippet = function CSSSnippet(key, value) {
		this.key = key;
		this.value = value;
		this.property = null;

		// detect if given snippet is a property
		var m = value && value.match(reProperty);
		if (m) {
			this.property = m[1];
			this.value = m[2];
		}

		this.dependencies = [];
	};

	var prototypeAccessors$2 = { defaultValue: { configurable: true } };

	CSSSnippet.prototype.addDependency = function addDependency (dep) {
		this.dependencies.push(dep);
	};

	prototypeAccessors$2.defaultValue.get = function () {
		return this.value != null ? splitValue(this.value)[0] : null;
	};

	/**
		 * Returns list of unique keywords for current CSS snippet and its dependencies
		 * @return {String[]}
		 */
	CSSSnippet.prototype.keywords = function keywords () {
		var stack = [];
		var keywords = new Set();
		var i = 0, item, candidates;

		if (this.property) {
			// scan valid CSS-properties only
			stack.push(this);
		}

		while (i < stack.length) {
			// NB Keep items in stack instead of push/pop to avoid possible
			// circular references
			item = stack[i++];

			if (item.value) {
				candidates = splitValue(item.value).filter(isKeyword$1);

				// extract possible keywords from snippet value
				for (var j = 0; j < candidates.length; j++) {
					keywords.add(candidates[j].trim());
				}

				// add dependencies into scan stack
				for (var j$1 = 0, deps = item.dependencies; j$1 < deps.length; j$1++) {
					if (stack.indexOf(deps[j$1]) === -1) {
						stack.push(deps[j$1]);
					}
				}
			}
		}

		return Array.from(keywords);
	};

	Object.defineProperties( CSSSnippet.prototype, prototypeAccessors$2 );

	/**
	 * Check if given string is a keyword candidate
	 * @param  {String}  str
	 * @return {Boolean}
	 */
	function isKeyword$1(str) {
		return /^\s*[\w-]+/.test(str);
	}

	function splitValue(value) {
		return String(value).split('|');
	}
	//# sourceMappingURL=css-snippets-resolver.es.js.map

	//# sourceMappingURL=stylesheet-formatters.es.js.map

	var Snippet = function Snippet(key, value) {
	    this.key = key;
	    this.value = value;
	};

	var SnippetsStorage = function SnippetsStorage(data) {
	    this._string = new Map();
	    this._regexp = new Map();
	    this._disabled = false;

	    this.load(data);
	};

	var prototypeAccessors$3 = { disabled: { configurable: true } };

	prototypeAccessors$3.disabled.get = function () {
	    return this._disabled;
	};

	/**
	 * Disables current store. A disabled store always returns `undefined`
	 * on `get()` method
	 */
	SnippetsStorage.prototype.disable = function disable () {
	    this._disabled = true;
	};

	/**
	 * Enables current store.
	 */
	SnippetsStorage.prototype.enable = function enable () {
	    this._disabled = false;
	};

	/**
	 * Registers a new snippet item
	 * @param {String|Regexp} key
	 * @param {String|Function} value
	 */
	SnippetsStorage.prototype.set = function set (key, value) {
	        var this$1 = this;

	    if (typeof key === 'string') {
	        key.split('|').forEach(function (k) { return this$1._string.set(k, new Snippet(k, value)); });
	    } else if (key instanceof RegExp) {
	        this._regexp.set(key, new Snippet(key, value));
	    } else {
	        throw new Error('Unknow snippet key: ' + key);
	    }

	    return this;
	};

	/**
	 * Returns a snippet matching given key. It first tries to find snippet
	 * exact match in a string key map, then tries to match one with regexp key
	 * @param {String} key
	 * @return {Snippet}
	 */
	SnippetsStorage.prototype.get = function get (key) {
	    if (this.disabled) {
	        return undefined;
	    }

	    if (this._string.has(key)) {
	        return this._string.get(key);
	    }

	    var keys = Array.from(this._regexp.keys());
	    for (var i = 0, il = keys.length; i < il; i++) {
	        if (keys[i].test(key)) {
	            return this._regexp.get(keys[i]);
	        }
	    }
	};

	/**
	 * Batch load of snippets data
	 * @param {Object|Map} data
	 */
	SnippetsStorage.prototype.load = function load (data) {
	        var this$1 = this;

	    this.reset();
	    if (data instanceof Map) {
	        data.forEach(function (value, key) { return this$1.set(key, value); });
	    } else if (data && typeof data === 'object') {
	        Object.keys(data).forEach(function (key) { return this$1.set(key, data[key]); });
	    }
	};

	/**
	 * Clears all stored snippets
	 */
	SnippetsStorage.prototype.reset = function reset () {
	    this._string.clear();
	    this._regexp.clear();
	};

	/**
	 * Returns all available snippets from given store
	 */
	SnippetsStorage.prototype.values = function values () {
	    if (this.disabled) {
	        return [];
	    }
	        
	    var string = Array.from(this._string.values());
	    var regexp = Array.from(this._regexp.values());
	    return string.concat(regexp);
	};

	Object.defineProperties( SnippetsStorage.prototype, prototypeAccessors$3 );

	/**
	 * @type {EmmetOutputProfile}
	 */

	//# sourceMappingURL=expand.es.js.map

	var reProperty$1 = /^([a-z\-]+)(?:\s*:\s*([^\n\r]+))?$/;

	var CSSSnippet$1 = function CSSSnippet(key, value) {
		this.key = key;
		this.value = value;
		this.property = null;

		// detect if given snippet is a property
		var m = value && value.match(reProperty$1);
		if (m) {
			this.property = m[1];
			this.value = m[2];
		}

		this.dependencies = [];
	};

	var prototypeAccessors$4 = { defaultValue: { configurable: true } };

	CSSSnippet$1.prototype.addDependency = function addDependency (dep) {
		this.dependencies.push(dep);
	};

	prototypeAccessors$4.defaultValue.get = function () {
		return this.value != null ? splitValue$1(this.value)[0] : null;
	};

	/**
	     * Returns list of unique keywords for current CSS snippet and its dependencies
	     * @return {String[]}
	     */
	CSSSnippet$1.prototype.keywords = function keywords () {
		var stack = [];
		var keywords = new Set();
		var i = 0, item, candidates;

		if (this.property) {
			// scan valid CSS-properties only
			stack.push(this);
		}

		while (i < stack.length) {
			// NB Keep items in stack instead of push/pop to avoid possible
			// circular references
			item = stack[i++];

			if (item.value) {
				candidates = splitValue$1(item.value).filter(isKeyword$2);

				// extract possible keywords from snippet value
				for (var j = 0; j < candidates.length; j++) {
					keywords.add(candidates[j].trim());
				}

				// add dependencies into scan stack
				for (var j$1 = 0, deps = item.dependencies; j$1 < deps.length; j$1++) {
					if (stack.indexOf(deps[j$1]) === -1) {
						stack.push(deps[j$1]);
					}
				}
			}
		}

		return Array.from(keywords);
	};

	Object.defineProperties( CSSSnippet$1.prototype, prototypeAccessors$4 );

	/**
	 * Check if given string is a keyword candidate
	 * @param  {String}  str
	 * @return {Boolean}
	 */
	function isKeyword$2(str) {
		return /^\s*[\w-]+/.test(str);
	}

	function splitValue$1(value) {
		return String(value).split('|');
	}
	//# sourceMappingURL=css-snippets-resolver.es.js.map

	var Node$1 = function Node(stream, type, open, close) {
		this.stream = stream;
		this.type = type;
		this.open = open;
		this.close = close;

		this.children = [];
		this.parent = null;
	};

	var prototypeAccessors$5 = { name: { configurable: true },attributes: { configurable: true },start: { configurable: true },end: { configurable: true },firstChild: { configurable: true },nextSibling: { configurable: true },previousSibling: { configurable: true } };

	/**
		 * Returns node name
		 * @return {String}
		 */
	prototypeAccessors$5.name.get = function () {
		if (this.type === 'tag' && this.open) {
			return this.open && this.open.name && this.open.name.value;
		}

		return '#' + this.type;
	};

	/**
		 * Returns attributes of current node
		 * @return {Array}
		 */
	prototypeAccessors$5.attributes.get = function () {
		return this.open && this.open.attributes;
	};

	/**
		 * Returns node’s start position in stream
		 * @return {*}
		 */
	prototypeAccessors$5.start.get = function () {
		return this.open && this.open.start;
	};

	/**
		 * Returns node’s start position in stream
		 * @return {*}
		 */
	prototypeAccessors$5.end.get = function () {
		return this.close ? this.close.end : this.open && this.open.end;
	};

	prototypeAccessors$5.firstChild.get = function () {
		return this.children[0];
	};

	prototypeAccessors$5.nextSibling.get = function () {
		var ix = this.getIndex();
		return ix !== -1 ? this.parent.children[ix + 1] : null;
	};

	prototypeAccessors$5.previousSibling.get = function () {
		var ix = this.getIndex();
		return ix !== -1 ? this.parent.children[ix - 1] : null;
	};

	/**
		 * Returns current element’s index in parent list of child nodes
		 * @return {Number}
		 */
	Node$1.prototype.getIndex = function getIndex () {
		return this.parent ? this.parent.children.indexOf(this) : -1;
	};

	/**
		 * Adds given node as a child
		 * @param {Node} node
		 * @return {Node} Current node
		 */
	Node$1.prototype.addChild = function addChild (node) {
		this.removeChild(node);
		this.children.push(node);
		node.parent = this;
		return this;
	};

	/**
		 * Removes given node from current node’s child list
		 * @param  {Node} node
		 * @return {Node} Current node
		 */
	Node$1.prototype.removeChild = function removeChild (node) {
		var ix = this.children.indexOf(node);
		if (ix !== -1) {
			this.children.splice(ix, 1);
			node.parent = null;
		}

		return this;
	};

	Object.defineProperties( Node$1.prototype, prototypeAccessors$5 );

	/**
	 * A structure describing text fragment in content stream
	 */
	var Token = function Token(stream, start, end) {
		this.stream = stream;
		this.start = start != null ? start : stream.start;
		this.end   = end   != null ? end   : stream.pos;
		this._value = null;
	};

	var prototypeAccessors$1$1 = { value: { configurable: true } };

	/**
		 * Returns token textual value
		 * NB implemented as getter to reduce unnecessary memory allocations for
		 * strings that not required
		 * @return {String}
		 */
	prototypeAccessors$1$1.value.get = function () {
		if (this._value === null) {
			var start = this.stream.start;
			var end = this.stream.pos;

			this.stream.start = this.start;
			this.stream.pos = this.end;
			this._value = this.stream.current();

			this.stream.start = start;
			this.stream.pos = end;
		}

		return this._value;
	};

	Token.prototype.toString = function toString () {
		return this.value;
	};

	Token.prototype.valueOf = function valueOf () {
		return ((this.value) + " [" + (this.start) + "; " + (this.end) + "]");
	};

	Object.defineProperties( Token.prototype, prototypeAccessors$1$1 );

	/**
	 * Converts given string into array of character codes
	 * @param  {String} str
	 * @return {Number[]}
	 */
	function toCharCodes(str) {
		return str.split('').map(function (ch) { return ch.charCodeAt(0); });
	}

	var open  = toCharCodes('<!--');
	var close = toCharCodes('-->');

	var open$1  = toCharCodes('<![CDATA[');
	var close$1 = toCharCodes(']]>');

	var LINE_END = 10; // \n

	/**
	 * A stream reader for CodeMirror editor
	 */
	var CodeMirrorStreamReader = /*@__PURE__*/(function (StreamReader$$1) {
		function CodeMirrorStreamReader(editor, pos, limit) {
			StreamReader$$1.call(this);
			var CodeMirror = editor.constructor;
			this.editor = editor;
			this.start = this.pos = pos || CodeMirror.Pos(0, 0);

			var lastLine = editor.lastLine();
			this._eof = limit ? limit.to   : CodeMirror.Pos(lastLine, this._lineLength(lastLine));
			this._sof = limit ? limit.from : CodeMirror.Pos(0, 0);
		}

		if ( StreamReader$$1 ) CodeMirrorStreamReader.__proto__ = StreamReader$$1;
		CodeMirrorStreamReader.prototype = Object.create( StreamReader$$1 && StreamReader$$1.prototype );
		CodeMirrorStreamReader.prototype.constructor = CodeMirrorStreamReader;

		/**
		 * Returns true only if the stream is at the beginning of the file.
		 * @returns {Boolean}
		 */
		CodeMirrorStreamReader.prototype.sof = function sof () {
			return comparePos(this.pos, this._sof) <= 0;
		};

		/**
		 * Returns true only if the stream is at the end of the file.
		 * @returns {Boolean}
		 */
		CodeMirrorStreamReader.prototype.eof = function eof () {
			return comparePos(this.pos, this._eof) >= 0;
		};

		/**
		 * Creates a new stream instance which is limited to given `start` and `end`
		 * points for underlying buffer
		 * @param  {CodeMirror.Pos} start
		 * @param  {CodeMirror.Pos} end
		 * @return {CodeMirrorStreamReader}
		 */
		CodeMirrorStreamReader.prototype.limit = function limit (from, to) {
			return new this.constructor(this.editor, from, { from: from, to: to });
		};

		/**
		 * Returns the next character code in the stream without advancing it.
		 * Will return NaN at the end of the file.
		 * @returns {Number}
		 */
		CodeMirrorStreamReader.prototype.peek = function peek () {
			var ref = this.pos;
			var line = ref.line;
			var ch = ref.ch;
			var lineStr = this.editor.getLine(line);
			return ch < lineStr.length ? lineStr.charCodeAt(ch) : LINE_END;
		};

		/**
		 * Returns the next character in the stream and advances it.
		 * Also returns NaN when no more characters are available.
		 * @returns {Number}
		 */
		CodeMirrorStreamReader.prototype.next = function next () {
			if (!this.eof()) {
				var code = this.peek();
				this.pos = Object.assign({}, this.pos, { ch: this.pos.ch + 1 });

				if (this.pos.ch >= this._lineLength(this.pos.line)) {
					this.pos.line++;
					this.pos.ch = 0;
				}

				if (this.eof()) {
					// handle edge case where position can move on next line
					// after EOF
					this.pos = Object.assign({}, this._eof);
				}

				return code;
			}

			return NaN;
		};

		/**
		 * Backs up the stream n characters. Backing it up further than the
		 * start of the current token will cause things to break, so be careful.
		 * @param {Number} n
		 */
		CodeMirrorStreamReader.prototype.backUp = function backUp (n) {
			var CodeMirror = this.editor.constructor;

			var ref = this.pos;
			var line = ref.line;
			var ch = ref.ch;
			ch -= (n || 1);

			while (line >= 0 && ch < 0) {
				line--;
				ch += this._lineLength(line);
			}

			this.pos = line < 0 || ch < 0
				? CodeMirror.Pos(0, 0)
				: CodeMirror.Pos(line, ch);

			return this.peek();
		};

		/**
		 * Get the string between the start of the current token and the
		 * current stream position.
		 * @returns {String}
		 */
		CodeMirrorStreamReader.prototype.current = function current () {
			return this.substring(this.start, this.pos);
		};

		/**
		 * Returns contents for given range
		 * @param  {Point} from
		 * @param  {Point} to
		 * @return {String}
		 */
		CodeMirrorStreamReader.prototype.substring = function substring (from, to) {
			return this.editor.getRange(from, to);
		};

		/**
		 * Creates error object with current stream state
		 * @param {String} message
		 * @return {Error}
		 */
		CodeMirrorStreamReader.prototype.error = function error (message) {
			var err = new Error((message + " at line " + (this.pos.line) + ", column " + (this.pos.ch)));
			err.originalMessage = message;
			err.pos = this.pos;
			err.string = this.string;
			return err;
		};

		/**
		 * Returns length of given line, including line ending
		 * @param  {Number} line
		 * @return {Number}
		 */
		CodeMirrorStreamReader.prototype._lineLength = function _lineLength (line) {
			var isLast = line === this.editor.lastLine();
			return this.editor.getLine(line).length + (isLast ? 0 : 1);
		};

		return CodeMirrorStreamReader;
	}(StreamReader));

	function comparePos(a, b) {
		return a.line - b.line || a.ch - b.ch;
	}
	//# sourceMappingURL=emmet-codemirror-plugin.es.js.map

	var activeLine = createCommonjsModule(function (module, exports) {
	// CodeMirror, copyright (c) by Marijn Haverbeke and others
	// Distributed under an MIT license: https://codemirror.net/LICENSE

	(function(mod) {
	  { mod(codemirror); }
	})(function(CodeMirror) {
	  var WRAP_CLASS = "CodeMirror-activeline";
	  var BACK_CLASS = "CodeMirror-activeline-background";
	  var GUTT_CLASS = "CodeMirror-activeline-gutter";

	  CodeMirror.defineOption("styleActiveLine", false, function(cm, val, old) {
	    var prev = old == CodeMirror.Init ? false : old;
	    if (val == prev) { return }
	    if (prev) {
	      cm.off("beforeSelectionChange", selectionChange);
	      clearActiveLines(cm);
	      delete cm.state.activeLines;
	    }
	    if (val) {
	      cm.state.activeLines = [];
	      updateActiveLines(cm, cm.listSelections());
	      cm.on("beforeSelectionChange", selectionChange);
	    }
	  });

	  function clearActiveLines(cm) {
	    for (var i = 0; i < cm.state.activeLines.length; i++) {
	      cm.removeLineClass(cm.state.activeLines[i], "wrap", WRAP_CLASS);
	      cm.removeLineClass(cm.state.activeLines[i], "background", BACK_CLASS);
	      cm.removeLineClass(cm.state.activeLines[i], "gutter", GUTT_CLASS);
	    }
	  }

	  function sameArray(a, b) {
	    if (a.length != b.length) { return false; }
	    for (var i = 0; i < a.length; i++)
	      { if (a[i] != b[i]) { return false; } }
	    return true;
	  }

	  function updateActiveLines(cm, ranges) {
	    var active = [];
	    for (var i = 0; i < ranges.length; i++) {
	      var range = ranges[i];
	      var option = cm.getOption("styleActiveLine");
	      if (typeof option == "object" && option.nonEmpty ? range.anchor.line != range.head.line : !range.empty())
	        { continue }
	      var line = cm.getLineHandleVisualStart(range.head.line);
	      if (active[active.length - 1] != line) { active.push(line); }
	    }
	    if (sameArray(cm.state.activeLines, active)) { return; }
	    cm.operation(function() {
	      clearActiveLines(cm);
	      for (var i = 0; i < active.length; i++) {
	        cm.addLineClass(active[i], "wrap", WRAP_CLASS);
	        cm.addLineClass(active[i], "background", BACK_CLASS);
	        cm.addLineClass(active[i], "gutter", GUTT_CLASS);
	      }
	      cm.state.activeLines = active;
	    });
	  }

	  function selectionChange(cm, sel) {
	    updateActiveLines(cm, sel.ranges);
	  }
	});
	});

	var matchbrackets = createCommonjsModule(function (module, exports) {
	// CodeMirror, copyright (c) by Marijn Haverbeke and others
	// Distributed under an MIT license: https://codemirror.net/LICENSE

	(function(mod) {
	  { mod(codemirror); }
	})(function(CodeMirror) {
	  var ie_lt8 = /MSIE \d/.test(navigator.userAgent) &&
	    (document.documentMode == null || document.documentMode < 8);

	  var Pos = CodeMirror.Pos;

	  var matching = {"(": ")>", ")": "(<", "[": "]>", "]": "[<", "{": "}>", "}": "{<"};

	  function findMatchingBracket(cm, where, config) {
	    var line = cm.getLineHandle(where.line), pos = where.ch - 1;
	    var afterCursor = config && config.afterCursor;
	    if (afterCursor == null)
	      { afterCursor = /(^| )cm-fat-cursor($| )/.test(cm.getWrapperElement().className); }

	    // A cursor is defined as between two characters, but in in vim command mode
	    // (i.e. not insert mode), the cursor is visually represented as a
	    // highlighted box on top of the 2nd character. Otherwise, we allow matches
	    // from before or after the cursor.
	    var match = (!afterCursor && pos >= 0 && matching[line.text.charAt(pos)]) ||
	        matching[line.text.charAt(++pos)];
	    if (!match) { return null; }
	    var dir = match.charAt(1) == ">" ? 1 : -1;
	    if (config && config.strict && (dir > 0) != (pos == where.ch)) { return null; }
	    var style = cm.getTokenTypeAt(Pos(where.line, pos + 1));

	    var found = scanForBracket(cm, Pos(where.line, pos + (dir > 0 ? 1 : 0)), dir, style || null, config);
	    if (found == null) { return null; }
	    return {from: Pos(where.line, pos), to: found && found.pos,
	            match: found && found.ch == match.charAt(0), forward: dir > 0};
	  }

	  // bracketRegex is used to specify which type of bracket to scan
	  // should be a regexp, e.g. /[[\]]/
	  //
	  // Note: If "where" is on an open bracket, then this bracket is ignored.
	  //
	  // Returns false when no bracket was found, null when it reached
	  // maxScanLines and gave up
	  function scanForBracket(cm, where, dir, style, config) {
	    var maxScanLen = (config && config.maxScanLineLength) || 10000;
	    var maxScanLines = (config && config.maxScanLines) || 1000;

	    var stack = [];
	    var re = config && config.bracketRegex ? config.bracketRegex : /[(){}[\]]/;
	    var lineEnd = dir > 0 ? Math.min(where.line + maxScanLines, cm.lastLine() + 1)
	                          : Math.max(cm.firstLine() - 1, where.line - maxScanLines);
	    for (var lineNo = where.line; lineNo != lineEnd; lineNo += dir) {
	      var line = cm.getLine(lineNo);
	      if (!line) { continue; }
	      var pos = dir > 0 ? 0 : line.length - 1, end = dir > 0 ? line.length : -1;
	      if (line.length > maxScanLen) { continue; }
	      if (lineNo == where.line) { pos = where.ch - (dir < 0 ? 1 : 0); }
	      for (; pos != end; pos += dir) {
	        var ch = line.charAt(pos);
	        if (re.test(ch) && (style === undefined || cm.getTokenTypeAt(Pos(lineNo, pos + 1)) == style)) {
	          var match = matching[ch];
	          if ((match.charAt(1) == ">") == (dir > 0)) { stack.push(ch); }
	          else if (!stack.length) { return {pos: Pos(lineNo, pos), ch: ch}; }
	          else { stack.pop(); }
	        }
	      }
	    }
	    return lineNo - dir == (dir > 0 ? cm.lastLine() : cm.firstLine()) ? false : null;
	  }

	  function matchBrackets(cm, autoclear, config) {
	    // Disable brace matching in long lines, since it'll cause hugely slow updates
	    var maxHighlightLen = cm.state.matchBrackets.maxHighlightLineLength || 1000;
	    var marks = [], ranges = cm.listSelections();
	    for (var i = 0; i < ranges.length; i++) {
	      var match = ranges[i].empty() && findMatchingBracket(cm, ranges[i].head, config);
	      if (match && cm.getLine(match.from.line).length <= maxHighlightLen) {
	        var style = match.match ? "CodeMirror-matchingbracket" : "CodeMirror-nonmatchingbracket";
	        marks.push(cm.markText(match.from, Pos(match.from.line, match.from.ch + 1), {className: style}));
	        if (match.to && cm.getLine(match.to.line).length <= maxHighlightLen)
	          { marks.push(cm.markText(match.to, Pos(match.to.line, match.to.ch + 1), {className: style})); }
	      }
	    }

	    if (marks.length) {
	      // Kludge to work around the IE bug from issue #1193, where text
	      // input stops going to the textare whever this fires.
	      if (ie_lt8 && cm.state.focused) { cm.focus(); }

	      var clear = function() {
	        cm.operation(function() {
	          for (var i = 0; i < marks.length; i++) { marks[i].clear(); }
	        });
	      };
	      if (autoclear) { setTimeout(clear, 800); }
	      else { return clear; }
	    }
	  }

	  function doMatchBrackets(cm) {
	    cm.operation(function() {
	      if (cm.state.matchBrackets.currentlyHighlighted) {
	        cm.state.matchBrackets.currentlyHighlighted();
	        cm.state.matchBrackets.currentlyHighlighted = null;
	      }
	      cm.state.matchBrackets.currentlyHighlighted = matchBrackets(cm, false, cm.state.matchBrackets);
	    });
	  }

	  CodeMirror.defineOption("matchBrackets", false, function(cm, val, old) {
	    if (old && old != CodeMirror.Init) {
	      cm.off("cursorActivity", doMatchBrackets);
	      if (cm.state.matchBrackets && cm.state.matchBrackets.currentlyHighlighted) {
	        cm.state.matchBrackets.currentlyHighlighted();
	        cm.state.matchBrackets.currentlyHighlighted = null;
	      }
	    }
	    if (val) {
	      cm.state.matchBrackets = typeof val == "object" ? val : {};
	      cm.on("cursorActivity", doMatchBrackets);
	    }
	  });

	  CodeMirror.defineExtension("matchBrackets", function() {matchBrackets(this, true);});
	  CodeMirror.defineExtension("findMatchingBracket", function(pos, config, oldConfig){
	    // Backwards-compatibility kludge
	    if (oldConfig || typeof config == "boolean") {
	      if (!oldConfig) {
	        config = config ? {strict: true} : null;
	      } else {
	        oldConfig.strict = config;
	        config = oldConfig;
	      }
	    }
	    return findMatchingBracket(this, pos, config)
	  });
	  CodeMirror.defineExtension("scanForBracket", function(pos, dir, style, config){
	    return scanForBracket(this, pos, dir, style, config);
	  });
	});
	});

	var overlay = createCommonjsModule(function (module, exports) {
	// CodeMirror, copyright (c) by Marijn Haverbeke and others
	// Distributed under an MIT license: https://codemirror.net/LICENSE

	// Utility function that allows modes to be combined. The mode given
	// as the base argument takes care of most of the normal mode
	// functionality, but a second (typically simple) mode is used, which
	// can override the style of text. Both modes get to parse all of the
	// text, but when both assign a non-null style to a piece of code, the
	// overlay wins, unless the combine argument was true and not overridden,
	// or state.overlay.combineTokens was true, in which case the styles are
	// combined.

	(function(mod) {
	  { mod(codemirror); }
	})(function(CodeMirror) {

	CodeMirror.overlayMode = function(base, overlay, combine) {
	  return {
	    startState: function() {
	      return {
	        base: CodeMirror.startState(base),
	        overlay: CodeMirror.startState(overlay),
	        basePos: 0, baseCur: null,
	        overlayPos: 0, overlayCur: null,
	        streamSeen: null
	      };
	    },
	    copyState: function(state) {
	      return {
	        base: CodeMirror.copyState(base, state.base),
	        overlay: CodeMirror.copyState(overlay, state.overlay),
	        basePos: state.basePos, baseCur: null,
	        overlayPos: state.overlayPos, overlayCur: null
	      };
	    },

	    token: function(stream, state) {
	      if (stream != state.streamSeen ||
	          Math.min(state.basePos, state.overlayPos) < stream.start) {
	        state.streamSeen = stream;
	        state.basePos = state.overlayPos = stream.start;
	      }

	      if (stream.start == state.basePos) {
	        state.baseCur = base.token(stream, state.base);
	        state.basePos = stream.pos;
	      }
	      if (stream.start == state.overlayPos) {
	        stream.pos = stream.start;
	        state.overlayCur = overlay.token(stream, state.overlay);
	        state.overlayPos = stream.pos;
	      }
	      stream.pos = Math.min(state.basePos, state.overlayPos);

	      // state.overlay.combineTokens always takes precedence over combine,
	      // unless set to null
	      if (state.overlayCur == null) { return state.baseCur; }
	      else if (state.baseCur != null &&
	               state.overlay.combineTokens ||
	               combine && state.overlay.combineTokens == null)
	        { return state.baseCur + " " + state.overlayCur; }
	      else { return state.overlayCur; }
	    },

	    indent: base.indent && function(state, textAfter) {
	      return base.indent(state.base, textAfter);
	    },
	    electricChars: base.electricChars,

	    innerMode: function(state) { return {state: state.base, mode: base}; },

	    blankLine: function(state) {
	      var baseToken, overlayToken;
	      if (base.blankLine) { baseToken = base.blankLine(state.base); }
	      if (overlay.blankLine) { overlayToken = overlay.blankLine(state.overlay); }

	      return overlayToken == null ?
	        baseToken :
	        (combine && baseToken != null ? baseToken + " " + overlayToken : overlayToken);
	    }
	  };
	};

	});
	});

	var xml = createCommonjsModule(function (module, exports) {
	// CodeMirror, copyright (c) by Marijn Haverbeke and others
	// Distributed under an MIT license: https://codemirror.net/LICENSE

	(function(mod) {
	  { mod(codemirror); }
	})(function(CodeMirror) {

	var htmlConfig = {
	  autoSelfClosers: {'area': true, 'base': true, 'br': true, 'col': true, 'command': true,
	                    'embed': true, 'frame': true, 'hr': true, 'img': true, 'input': true,
	                    'keygen': true, 'link': true, 'meta': true, 'param': true, 'source': true,
	                    'track': true, 'wbr': true, 'menuitem': true},
	  implicitlyClosed: {'dd': true, 'li': true, 'optgroup': true, 'option': true, 'p': true,
	                     'rp': true, 'rt': true, 'tbody': true, 'td': true, 'tfoot': true,
	                     'th': true, 'tr': true},
	  contextGrabbers: {
	    'dd': {'dd': true, 'dt': true},
	    'dt': {'dd': true, 'dt': true},
	    'li': {'li': true},
	    'option': {'option': true, 'optgroup': true},
	    'optgroup': {'optgroup': true},
	    'p': {'address': true, 'article': true, 'aside': true, 'blockquote': true, 'dir': true,
	          'div': true, 'dl': true, 'fieldset': true, 'footer': true, 'form': true,
	          'h1': true, 'h2': true, 'h3': true, 'h4': true, 'h5': true, 'h6': true,
	          'header': true, 'hgroup': true, 'hr': true, 'menu': true, 'nav': true, 'ol': true,
	          'p': true, 'pre': true, 'section': true, 'table': true, 'ul': true},
	    'rp': {'rp': true, 'rt': true},
	    'rt': {'rp': true, 'rt': true},
	    'tbody': {'tbody': true, 'tfoot': true},
	    'td': {'td': true, 'th': true},
	    'tfoot': {'tbody': true},
	    'th': {'td': true, 'th': true},
	    'thead': {'tbody': true, 'tfoot': true},
	    'tr': {'tr': true}
	  },
	  doNotIndent: {"pre": true},
	  allowUnquoted: true,
	  allowMissing: true,
	  caseFold: true
	};

	var xmlConfig = {
	  autoSelfClosers: {},
	  implicitlyClosed: {},
	  contextGrabbers: {},
	  doNotIndent: {},
	  allowUnquoted: false,
	  allowMissing: false,
	  allowMissingTagName: false,
	  caseFold: false
	};

	CodeMirror.defineMode("xml", function(editorConf, config_) {
	  var indentUnit = editorConf.indentUnit;
	  var config = {};
	  var defaults = config_.htmlMode ? htmlConfig : xmlConfig;
	  for (var prop in defaults) { config[prop] = defaults[prop]; }
	  for (var prop in config_) { config[prop] = config_[prop]; }

	  // Return variables for tokenizers
	  var type, setStyle;

	  function inText(stream, state) {
	    function chain(parser) {
	      state.tokenize = parser;
	      return parser(stream, state);
	    }

	    var ch = stream.next();
	    if (ch == "<") {
	      if (stream.eat("!")) {
	        if (stream.eat("[")) {
	          if (stream.match("CDATA[")) { return chain(inBlock("atom", "]]>")); }
	          else { return null; }
	        } else if (stream.match("--")) {
	          return chain(inBlock("comment", "-->"));
	        } else if (stream.match("DOCTYPE", true, true)) {
	          stream.eatWhile(/[\w\._\-]/);
	          return chain(doctype(1));
	        } else {
	          return null;
	        }
	      } else if (stream.eat("?")) {
	        stream.eatWhile(/[\w\._\-]/);
	        state.tokenize = inBlock("meta", "?>");
	        return "meta";
	      } else {
	        type = stream.eat("/") ? "closeTag" : "openTag";
	        state.tokenize = inTag;
	        return "tag bracket";
	      }
	    } else if (ch == "&") {
	      var ok;
	      if (stream.eat("#")) {
	        if (stream.eat("x")) {
	          ok = stream.eatWhile(/[a-fA-F\d]/) && stream.eat(";");
	        } else {
	          ok = stream.eatWhile(/[\d]/) && stream.eat(";");
	        }
	      } else {
	        ok = stream.eatWhile(/[\w\.\-:]/) && stream.eat(";");
	      }
	      return ok ? "atom" : "error";
	    } else {
	      stream.eatWhile(/[^&<]/);
	      return null;
	    }
	  }
	  inText.isInText = true;

	  function inTag(stream, state) {
	    var ch = stream.next();
	    if (ch == ">" || (ch == "/" && stream.eat(">"))) {
	      state.tokenize = inText;
	      type = ch == ">" ? "endTag" : "selfcloseTag";
	      return "tag bracket";
	    } else if (ch == "=") {
	      type = "equals";
	      return null;
	    } else if (ch == "<") {
	      state.tokenize = inText;
	      state.state = baseState;
	      state.tagName = state.tagStart = null;
	      var next = state.tokenize(stream, state);
	      return next ? next + " tag error" : "tag error";
	    } else if (/[\'\"]/.test(ch)) {
	      state.tokenize = inAttribute(ch);
	      state.stringStartCol = stream.column();
	      return state.tokenize(stream, state);
	    } else {
	      stream.match(/^[^\s\u00a0=<>\"\']*[^\s\u00a0=<>\"\'\/]/);
	      return "word";
	    }
	  }

	  function inAttribute(quote) {
	    var closure = function(stream, state) {
	      while (!stream.eol()) {
	        if (stream.next() == quote) {
	          state.tokenize = inTag;
	          break;
	        }
	      }
	      return "string";
	    };
	    closure.isInAttribute = true;
	    return closure;
	  }

	  function inBlock(style, terminator) {
	    return function(stream, state) {
	      while (!stream.eol()) {
	        if (stream.match(terminator)) {
	          state.tokenize = inText;
	          break;
	        }
	        stream.next();
	      }
	      return style;
	    }
	  }

	  function doctype(depth) {
	    return function(stream, state) {
	      var ch;
	      while ((ch = stream.next()) != null) {
	        if (ch == "<") {
	          state.tokenize = doctype(depth + 1);
	          return state.tokenize(stream, state);
	        } else if (ch == ">") {
	          if (depth == 1) {
	            state.tokenize = inText;
	            break;
	          } else {
	            state.tokenize = doctype(depth - 1);
	            return state.tokenize(stream, state);
	          }
	        }
	      }
	      return "meta";
	    };
	  }

	  function Context(state, tagName, startOfLine) {
	    this.prev = state.context;
	    this.tagName = tagName;
	    this.indent = state.indented;
	    this.startOfLine = startOfLine;
	    if (config.doNotIndent.hasOwnProperty(tagName) || (state.context && state.context.noIndent))
	      { this.noIndent = true; }
	  }
	  function popContext(state) {
	    if (state.context) { state.context = state.context.prev; }
	  }
	  function maybePopContext(state, nextTagName) {
	    var parentTagName;
	    while (true) {
	      if (!state.context) {
	        return;
	      }
	      parentTagName = state.context.tagName;
	      if (!config.contextGrabbers.hasOwnProperty(parentTagName) ||
	          !config.contextGrabbers[parentTagName].hasOwnProperty(nextTagName)) {
	        return;
	      }
	      popContext(state);
	    }
	  }

	  function baseState(type, stream, state) {
	    if (type == "openTag") {
	      state.tagStart = stream.column();
	      return tagNameState;
	    } else if (type == "closeTag") {
	      return closeTagNameState;
	    } else {
	      return baseState;
	    }
	  }
	  function tagNameState(type, stream, state) {
	    if (type == "word") {
	      state.tagName = stream.current();
	      setStyle = "tag";
	      return attrState;
	    } else if (config.allowMissingTagName && type == "endTag") {
	      setStyle = "tag bracket";
	      return attrState(type, stream, state);
	    } else {
	      setStyle = "error";
	      return tagNameState;
	    }
	  }
	  function closeTagNameState(type, stream, state) {
	    if (type == "word") {
	      var tagName = stream.current();
	      if (state.context && state.context.tagName != tagName &&
	          config.implicitlyClosed.hasOwnProperty(state.context.tagName))
	        { popContext(state); }
	      if ((state.context && state.context.tagName == tagName) || config.matchClosing === false) {
	        setStyle = "tag";
	        return closeState;
	      } else {
	        setStyle = "tag error";
	        return closeStateErr;
	      }
	    } else if (config.allowMissingTagName && type == "endTag") {
	      setStyle = "tag bracket";
	      return closeState(type, stream, state);
	    } else {
	      setStyle = "error";
	      return closeStateErr;
	    }
	  }

	  function closeState(type, _stream, state) {
	    if (type != "endTag") {
	      setStyle = "error";
	      return closeState;
	    }
	    popContext(state);
	    return baseState;
	  }
	  function closeStateErr(type, stream, state) {
	    setStyle = "error";
	    return closeState(type, stream, state);
	  }

	  function attrState(type, _stream, state) {
	    if (type == "word") {
	      setStyle = "attribute";
	      return attrEqState;
	    } else if (type == "endTag" || type == "selfcloseTag") {
	      var tagName = state.tagName, tagStart = state.tagStart;
	      state.tagName = state.tagStart = null;
	      if (type == "selfcloseTag" ||
	          config.autoSelfClosers.hasOwnProperty(tagName)) {
	        maybePopContext(state, tagName);
	      } else {
	        maybePopContext(state, tagName);
	        state.context = new Context(state, tagName, tagStart == state.indented);
	      }
	      return baseState;
	    }
	    setStyle = "error";
	    return attrState;
	  }
	  function attrEqState(type, stream, state) {
	    if (type == "equals") { return attrValueState; }
	    if (!config.allowMissing) { setStyle = "error"; }
	    return attrState(type, stream, state);
	  }
	  function attrValueState(type, stream, state) {
	    if (type == "string") { return attrContinuedState; }
	    if (type == "word" && config.allowUnquoted) {setStyle = "string"; return attrState;}
	    setStyle = "error";
	    return attrState(type, stream, state);
	  }
	  function attrContinuedState(type, stream, state) {
	    if (type == "string") { return attrContinuedState; }
	    return attrState(type, stream, state);
	  }

	  return {
	    startState: function(baseIndent) {
	      var state = {tokenize: inText,
	                   state: baseState,
	                   indented: baseIndent || 0,
	                   tagName: null, tagStart: null,
	                   context: null};
	      if (baseIndent != null) { state.baseIndent = baseIndent; }
	      return state
	    },

	    token: function(stream, state) {
	      if (!state.tagName && stream.sol())
	        { state.indented = stream.indentation(); }

	      if (stream.eatSpace()) { return null; }
	      type = null;
	      var style = state.tokenize(stream, state);
	      if ((style || type) && style != "comment") {
	        setStyle = null;
	        state.state = state.state(type || style, stream, state);
	        if (setStyle)
	          { style = setStyle == "error" ? style + " error" : setStyle; }
	      }
	      return style;
	    },

	    indent: function(state, textAfter, fullLine) {
	      var context = state.context;
	      // Indent multi-line strings (e.g. css).
	      if (state.tokenize.isInAttribute) {
	        if (state.tagStart == state.indented)
	          { return state.stringStartCol + 1; }
	        else
	          { return state.indented + indentUnit; }
	      }
	      if (context && context.noIndent) { return CodeMirror.Pass; }
	      if (state.tokenize != inTag && state.tokenize != inText)
	        { return fullLine ? fullLine.match(/^(\s*)/)[0].length : 0; }
	      // Indent the starts of attribute names.
	      if (state.tagName) {
	        if (config.multilineTagIndentPastTag !== false)
	          { return state.tagStart + state.tagName.length + 2; }
	        else
	          { return state.tagStart + indentUnit * (config.multilineTagIndentFactor || 1); }
	      }
	      if (config.alignCDATA && /<!\[CDATA\[/.test(textAfter)) { return 0; }
	      var tagAfter = textAfter && /^<(\/)?([\w_:\.-]*)/.exec(textAfter);
	      if (tagAfter && tagAfter[1]) { // Closing tag spotted
	        while (context) {
	          if (context.tagName == tagAfter[2]) {
	            context = context.prev;
	            break;
	          } else if (config.implicitlyClosed.hasOwnProperty(context.tagName)) {
	            context = context.prev;
	          } else {
	            break;
	          }
	        }
	      } else if (tagAfter) { // Opening tag spotted
	        while (context) {
	          var grabbers = config.contextGrabbers[context.tagName];
	          if (grabbers && grabbers.hasOwnProperty(tagAfter[2]))
	            { context = context.prev; }
	          else
	            { break; }
	        }
	      }
	      while (context && context.prev && !context.startOfLine)
	        { context = context.prev; }
	      if (context) { return context.indent + indentUnit; }
	      else { return state.baseIndent || 0; }
	    },

	    electricInput: /<\/[\s\w:]+>$/,
	    blockCommentStart: "<!--",
	    blockCommentEnd: "-->",

	    configuration: config.htmlMode ? "html" : "xml",
	    helperType: config.htmlMode ? "html" : "xml",

	    skipAttribute: function(state) {
	      if (state.state == attrValueState)
	        { state.state = attrState; }
	    }
	  };
	});

	CodeMirror.defineMIME("text/xml", "xml");
	CodeMirror.defineMIME("application/xml", "xml");
	if (!CodeMirror.mimeModes.hasOwnProperty("text/html"))
	  { CodeMirror.defineMIME("text/html", {name: "xml", htmlMode: true}); }

	});
	});

	var javascript = createCommonjsModule(function (module, exports) {
	// CodeMirror, copyright (c) by Marijn Haverbeke and others
	// Distributed under an MIT license: https://codemirror.net/LICENSE

	(function(mod) {
	  { mod(codemirror); }
	})(function(CodeMirror) {

	CodeMirror.defineMode("javascript", function(config, parserConfig) {
	  var indentUnit = config.indentUnit;
	  var statementIndent = parserConfig.statementIndent;
	  var jsonldMode = parserConfig.jsonld;
	  var jsonMode = parserConfig.json || jsonldMode;
	  var isTS = parserConfig.typescript;
	  var wordRE = parserConfig.wordCharacters || /[\w$\xa1-\uffff]/;

	  // Tokenizer

	  var keywords = function(){
	    function kw(type) {return {type: type, style: "keyword"};}
	    var A = kw("keyword a"), B = kw("keyword b"), C = kw("keyword c"), D = kw("keyword d");
	    var operator = kw("operator"), atom = {type: "atom", style: "atom"};

	    return {
	      "if": kw("if"), "while": A, "with": A, "else": B, "do": B, "try": B, "finally": B,
	      "return": D, "break": D, "continue": D, "new": kw("new"), "delete": C, "void": C, "throw": C,
	      "debugger": kw("debugger"), "var": kw("var"), "const": kw("var"), "let": kw("var"),
	      "function": kw("function"), "catch": kw("catch"),
	      "for": kw("for"), "switch": kw("switch"), "case": kw("case"), "default": kw("default"),
	      "in": operator, "typeof": operator, "instanceof": operator,
	      "true": atom, "false": atom, "null": atom, "undefined": atom, "NaN": atom, "Infinity": atom,
	      "this": kw("this"), "class": kw("class"), "super": kw("atom"),
	      "yield": C, "export": kw("export"), "import": kw("import"), "extends": C,
	      "await": C
	    };
	  }();

	  var isOperatorChar = /[+\-*&%=<>!?|~^@]/;
	  var isJsonldKeyword = /^@(context|id|value|language|type|container|list|set|reverse|index|base|vocab|graph)"/;

	  function readRegexp(stream) {
	    var escaped = false, next, inSet = false;
	    while ((next = stream.next()) != null) {
	      if (!escaped) {
	        if (next == "/" && !inSet) { return; }
	        if (next == "[") { inSet = true; }
	        else if (inSet && next == "]") { inSet = false; }
	      }
	      escaped = !escaped && next == "\\";
	    }
	  }

	  // Used as scratch variables to communicate multiple values without
	  // consing up tons of objects.
	  var type, content;
	  function ret(tp, style, cont) {
	    type = tp; content = cont;
	    return style;
	  }
	  function tokenBase(stream, state) {
	    var ch = stream.next();
	    if (ch == '"' || ch == "'") {
	      state.tokenize = tokenString(ch);
	      return state.tokenize(stream, state);
	    } else if (ch == "." && stream.match(/^\d+(?:[eE][+\-]?\d+)?/)) {
	      return ret("number", "number");
	    } else if (ch == "." && stream.match("..")) {
	      return ret("spread", "meta");
	    } else if (/[\[\]{}\(\),;\:\.]/.test(ch)) {
	      return ret(ch);
	    } else if (ch == "=" && stream.eat(">")) {
	      return ret("=>", "operator");
	    } else if (ch == "0" && stream.match(/^(?:x[\da-f]+|o[0-7]+|b[01]+)n?/i)) {
	      return ret("number", "number");
	    } else if (/\d/.test(ch)) {
	      stream.match(/^\d*(?:n|(?:\.\d*)?(?:[eE][+\-]?\d+)?)?/);
	      return ret("number", "number");
	    } else if (ch == "/") {
	      if (stream.eat("*")) {
	        state.tokenize = tokenComment;
	        return tokenComment(stream, state);
	      } else if (stream.eat("/")) {
	        stream.skipToEnd();
	        return ret("comment", "comment");
	      } else if (expressionAllowed(stream, state, 1)) {
	        readRegexp(stream);
	        stream.match(/^\b(([gimyus])(?![gimyus]*\2))+\b/);
	        return ret("regexp", "string-2");
	      } else {
	        stream.eat("=");
	        return ret("operator", "operator", stream.current());
	      }
	    } else if (ch == "`") {
	      state.tokenize = tokenQuasi;
	      return tokenQuasi(stream, state);
	    } else if (ch == "#") {
	      stream.skipToEnd();
	      return ret("error", "error");
	    } else if (isOperatorChar.test(ch)) {
	      if (ch != ">" || !state.lexical || state.lexical.type != ">") {
	        if (stream.eat("=")) {
	          if (ch == "!" || ch == "=") { stream.eat("="); }
	        } else if (/[<>*+\-]/.test(ch)) {
	          stream.eat(ch);
	          if (ch == ">") { stream.eat(ch); }
	        }
	      }
	      return ret("operator", "operator", stream.current());
	    } else if (wordRE.test(ch)) {
	      stream.eatWhile(wordRE);
	      var word = stream.current();
	      if (state.lastType != ".") {
	        if (keywords.propertyIsEnumerable(word)) {
	          var kw = keywords[word];
	          return ret(kw.type, kw.style, word)
	        }
	        if (word == "async" && stream.match(/^(\s|\/\*.*?\*\/)*[\[\(\w]/, false))
	          { return ret("async", "keyword", word) }
	      }
	      return ret("variable", "variable", word)
	    }
	  }

	  function tokenString(quote) {
	    return function(stream, state) {
	      var escaped = false, next;
	      if (jsonldMode && stream.peek() == "@" && stream.match(isJsonldKeyword)){
	        state.tokenize = tokenBase;
	        return ret("jsonld-keyword", "meta");
	      }
	      while ((next = stream.next()) != null) {
	        if (next == quote && !escaped) { break; }
	        escaped = !escaped && next == "\\";
	      }
	      if (!escaped) { state.tokenize = tokenBase; }
	      return ret("string", "string");
	    };
	  }

	  function tokenComment(stream, state) {
	    var maybeEnd = false, ch;
	    while (ch = stream.next()) {
	      if (ch == "/" && maybeEnd) {
	        state.tokenize = tokenBase;
	        break;
	      }
	      maybeEnd = (ch == "*");
	    }
	    return ret("comment", "comment");
	  }

	  function tokenQuasi(stream, state) {
	    var escaped = false, next;
	    while ((next = stream.next()) != null) {
	      if (!escaped && (next == "`" || next == "$" && stream.eat("{"))) {
	        state.tokenize = tokenBase;
	        break;
	      }
	      escaped = !escaped && next == "\\";
	    }
	    return ret("quasi", "string-2", stream.current());
	  }

	  var brackets = "([{}])";
	  // This is a crude lookahead trick to try and notice that we're
	  // parsing the argument patterns for a fat-arrow function before we
	  // actually hit the arrow token. It only works if the arrow is on
	  // the same line as the arguments and there's no strange noise
	  // (comments) in between. Fallback is to only notice when we hit the
	  // arrow, and not declare the arguments as locals for the arrow
	  // body.
	  function findFatArrow(stream, state) {
	    if (state.fatArrowAt) { state.fatArrowAt = null; }
	    var arrow = stream.string.indexOf("=>", stream.start);
	    if (arrow < 0) { return; }

	    if (isTS) { // Try to skip TypeScript return type declarations after the arguments
	      var m = /:\s*(?:\w+(?:<[^>]*>|\[\])?|\{[^}]*\})\s*$/.exec(stream.string.slice(stream.start, arrow));
	      if (m) { arrow = m.index; }
	    }

	    var depth = 0, sawSomething = false;
	    for (var pos = arrow - 1; pos >= 0; --pos) {
	      var ch = stream.string.charAt(pos);
	      var bracket = brackets.indexOf(ch);
	      if (bracket >= 0 && bracket < 3) {
	        if (!depth) { ++pos; break; }
	        if (--depth == 0) { if (ch == "(") { sawSomething = true; } break; }
	      } else if (bracket >= 3 && bracket < 6) {
	        ++depth;
	      } else if (wordRE.test(ch)) {
	        sawSomething = true;
	      } else if (/["'\/]/.test(ch)) {
	        return;
	      } else if (sawSomething && !depth) {
	        ++pos;
	        break;
	      }
	    }
	    if (sawSomething && !depth) { state.fatArrowAt = pos; }
	  }

	  // Parser

	  var atomicTypes = {"atom": true, "number": true, "variable": true, "string": true, "regexp": true, "this": true, "jsonld-keyword": true};

	  function JSLexical(indented, column, type, align, prev, info) {
	    this.indented = indented;
	    this.column = column;
	    this.type = type;
	    this.prev = prev;
	    this.info = info;
	    if (align != null) { this.align = align; }
	  }

	  function inScope(state, varname) {
	    for (var v = state.localVars; v; v = v.next)
	      { if (v.name == varname) { return true; } }
	    for (var cx = state.context; cx; cx = cx.prev) {
	      for (var v = cx.vars; v; v = v.next)
	        { if (v.name == varname) { return true; } }
	    }
	  }

	  function parseJS(state, style, type, content, stream) {
	    var cc = state.cc;
	    // Communicate our context to the combinators.
	    // (Less wasteful than consing up a hundred closures on every call.)
	    cx.state = state; cx.stream = stream; cx.marked = null, cx.cc = cc; cx.style = style;

	    if (!state.lexical.hasOwnProperty("align"))
	      { state.lexical.align = true; }

	    while(true) {
	      var combinator = cc.length ? cc.pop() : jsonMode ? expression : statement;
	      if (combinator(type, content)) {
	        while(cc.length && cc[cc.length - 1].lex)
	          { cc.pop()(); }
	        if (cx.marked) { return cx.marked; }
	        if (type == "variable" && inScope(state, content)) { return "variable-2"; }
	        return style;
	      }
	    }
	  }

	  // Combinator utils

	  var cx = {state: null, column: null, marked: null, cc: null};
	  function pass() {
	    var arguments$1 = arguments;

	    for (var i = arguments.length - 1; i >= 0; i--) { cx.cc.push(arguments$1[i]); }
	  }
	  function cont() {
	    pass.apply(null, arguments);
	    return true;
	  }
	  function inList(name, list) {
	    for (var v = list; v; v = v.next) { if (v.name == name) { return true } }
	    return false;
	  }
	  function register(varname) {
	    var state = cx.state;
	    cx.marked = "def";
	    if (state.context) {
	      if (state.lexical.info == "var" && state.context && state.context.block) {
	        // FIXME function decls are also not block scoped
	        var newContext = registerVarScoped(varname, state.context);
	        if (newContext != null) {
	          state.context = newContext;
	          return
	        }
	      } else if (!inList(varname, state.localVars)) {
	        state.localVars = new Var(varname, state.localVars);
	        return
	      }
	    }
	    // Fall through means this is global
	    if (parserConfig.globalVars && !inList(varname, state.globalVars))
	      { state.globalVars = new Var(varname, state.globalVars); }
	  }
	  function registerVarScoped(varname, context) {
	    if (!context) {
	      return null
	    } else if (context.block) {
	      var inner = registerVarScoped(varname, context.prev);
	      if (!inner) { return null }
	      if (inner == context.prev) { return context }
	      return new Context(inner, context.vars, true)
	    } else if (inList(varname, context.vars)) {
	      return context
	    } else {
	      return new Context(context.prev, new Var(varname, context.vars), false)
	    }
	  }

	  function isModifier(name) {
	    return name == "public" || name == "private" || name == "protected" || name == "abstract" || name == "readonly"
	  }

	  // Combinators

	  function Context(prev, vars, block) { this.prev = prev; this.vars = vars; this.block = block; }
	  function Var(name, next) { this.name = name; this.next = next; }

	  var defaultVars = new Var("this", new Var("arguments", null));
	  function pushcontext() {
	    cx.state.context = new Context(cx.state.context, cx.state.localVars, false);
	    cx.state.localVars = defaultVars;
	  }
	  function pushblockcontext() {
	    cx.state.context = new Context(cx.state.context, cx.state.localVars, true);
	    cx.state.localVars = null;
	  }
	  function popcontext() {
	    cx.state.localVars = cx.state.context.vars;
	    cx.state.context = cx.state.context.prev;
	  }
	  popcontext.lex = true;
	  function pushlex(type, info) {
	    var result = function() {
	      var state = cx.state, indent = state.indented;
	      if (state.lexical.type == "stat") { indent = state.lexical.indented; }
	      else { for (var outer = state.lexical; outer && outer.type == ")" && outer.align; outer = outer.prev)
	        { indent = outer.indented; } }
	      state.lexical = new JSLexical(indent, cx.stream.column(), type, null, state.lexical, info);
	    };
	    result.lex = true;
	    return result;
	  }
	  function poplex() {
	    var state = cx.state;
	    if (state.lexical.prev) {
	      if (state.lexical.type == ")")
	        { state.indented = state.lexical.indented; }
	      state.lexical = state.lexical.prev;
	    }
	  }
	  poplex.lex = true;

	  function expect(wanted) {
	    function exp(type) {
	      if (type == wanted) { return cont(); }
	      else if (wanted == ";" || type == "}" || type == ")" || type == "]") { return pass(); }
	      else { return cont(exp); }
	    }    return exp;
	  }

	  function statement(type, value) {
	    if (type == "var") { return cont(pushlex("vardef", value), vardef, expect(";"), poplex); }
	    if (type == "keyword a") { return cont(pushlex("form"), parenExpr, statement, poplex); }
	    if (type == "keyword b") { return cont(pushlex("form"), statement, poplex); }
	    if (type == "keyword d") { return cx.stream.match(/^\s*$/, false) ? cont() : cont(pushlex("stat"), maybeexpression, expect(";"), poplex); }
	    if (type == "debugger") { return cont(expect(";")); }
	    if (type == "{") { return cont(pushlex("}"), pushblockcontext, block, poplex, popcontext); }
	    if (type == ";") { return cont(); }
	    if (type == "if") {
	      if (cx.state.lexical.info == "else" && cx.state.cc[cx.state.cc.length - 1] == poplex)
	        { cx.state.cc.pop()(); }
	      return cont(pushlex("form"), parenExpr, statement, poplex, maybeelse);
	    }
	    if (type == "function") { return cont(functiondef); }
	    if (type == "for") { return cont(pushlex("form"), forspec, statement, poplex); }
	    if (type == "class" || (isTS && value == "interface")) { cx.marked = "keyword"; return cont(pushlex("form"), className, poplex); }
	    if (type == "variable") {
	      if (isTS && value == "declare") {
	        cx.marked = "keyword";
	        return cont(statement)
	      } else if (isTS && (value == "module" || value == "enum" || value == "type") && cx.stream.match(/^\s*\w/, false)) {
	        cx.marked = "keyword";
	        if (value == "enum") { return cont(enumdef); }
	        else if (value == "type") { return cont(typeexpr, expect("operator"), typeexpr, expect(";")); }
	        else { return cont(pushlex("form"), pattern, expect("{"), pushlex("}"), block, poplex, poplex) }
	      } else if (isTS && value == "namespace") {
	        cx.marked = "keyword";
	        return cont(pushlex("form"), expression, block, poplex)
	      } else if (isTS && value == "abstract") {
	        cx.marked = "keyword";
	        return cont(statement)
	      } else {
	        return cont(pushlex("stat"), maybelabel);
	      }
	    }
	    if (type == "switch") { return cont(pushlex("form"), parenExpr, expect("{"), pushlex("}", "switch"), pushblockcontext,
	                                      block, poplex, poplex, popcontext); }
	    if (type == "case") { return cont(expression, expect(":")); }
	    if (type == "default") { return cont(expect(":")); }
	    if (type == "catch") { return cont(pushlex("form"), pushcontext, maybeCatchBinding, statement, poplex, popcontext); }
	    if (type == "export") { return cont(pushlex("stat"), afterExport, poplex); }
	    if (type == "import") { return cont(pushlex("stat"), afterImport, poplex); }
	    if (type == "async") { return cont(statement) }
	    if (value == "@") { return cont(expression, statement) }
	    return pass(pushlex("stat"), expression, expect(";"), poplex);
	  }
	  function maybeCatchBinding(type) {
	    if (type == "(") { return cont(funarg, expect(")")) }
	  }
	  function expression(type, value) {
	    return expressionInner(type, value, false);
	  }
	  function expressionNoComma(type, value) {
	    return expressionInner(type, value, true);
	  }
	  function parenExpr(type) {
	    if (type != "(") { return pass() }
	    return cont(pushlex(")"), expression, expect(")"), poplex)
	  }
	  function expressionInner(type, value, noComma) {
	    if (cx.state.fatArrowAt == cx.stream.start) {
	      var body = noComma ? arrowBodyNoComma : arrowBody;
	      if (type == "(") { return cont(pushcontext, pushlex(")"), commasep(funarg, ")"), poplex, expect("=>"), body, popcontext); }
	      else if (type == "variable") { return pass(pushcontext, pattern, expect("=>"), body, popcontext); }
	    }

	    var maybeop = noComma ? maybeoperatorNoComma : maybeoperatorComma;
	    if (atomicTypes.hasOwnProperty(type)) { return cont(maybeop); }
	    if (type == "function") { return cont(functiondef, maybeop); }
	    if (type == "class" || (isTS && value == "interface")) { cx.marked = "keyword"; return cont(pushlex("form"), classExpression, poplex); }
	    if (type == "keyword c" || type == "async") { return cont(noComma ? expressionNoComma : expression); }
	    if (type == "(") { return cont(pushlex(")"), maybeexpression, expect(")"), poplex, maybeop); }
	    if (type == "operator" || type == "spread") { return cont(noComma ? expressionNoComma : expression); }
	    if (type == "[") { return cont(pushlex("]"), arrayLiteral, poplex, maybeop); }
	    if (type == "{") { return contCommasep(objprop, "}", null, maybeop); }
	    if (type == "quasi") { return pass(quasi, maybeop); }
	    if (type == "new") { return cont(maybeTarget(noComma)); }
	    if (type == "import") { return cont(expression); }
	    return cont();
	  }
	  function maybeexpression(type) {
	    if (type.match(/[;\}\)\],]/)) { return pass(); }
	    return pass(expression);
	  }

	  function maybeoperatorComma(type, value) {
	    if (type == ",") { return cont(expression); }
	    return maybeoperatorNoComma(type, value, false);
	  }
	  function maybeoperatorNoComma(type, value, noComma) {
	    var me = noComma == false ? maybeoperatorComma : maybeoperatorNoComma;
	    var expr = noComma == false ? expression : expressionNoComma;
	    if (type == "=>") { return cont(pushcontext, noComma ? arrowBodyNoComma : arrowBody, popcontext); }
	    if (type == "operator") {
	      if (/\+\+|--/.test(value) || isTS && value == "!") { return cont(me); }
	      if (isTS && value == "<" && cx.stream.match(/^([^>]|<.*?>)*>\s*\(/, false))
	        { return cont(pushlex(">"), commasep(typeexpr, ">"), poplex, me); }
	      if (value == "?") { return cont(expression, expect(":"), expr); }
	      return cont(expr);
	    }
	    if (type == "quasi") { return pass(quasi, me); }
	    if (type == ";") { return; }
	    if (type == "(") { return contCommasep(expressionNoComma, ")", "call", me); }
	    if (type == ".") { return cont(property, me); }
	    if (type == "[") { return cont(pushlex("]"), maybeexpression, expect("]"), poplex, me); }
	    if (isTS && value == "as") { cx.marked = "keyword"; return cont(typeexpr, me) }
	    if (type == "regexp") {
	      cx.state.lastType = cx.marked = "operator";
	      cx.stream.backUp(cx.stream.pos - cx.stream.start - 1);
	      return cont(expr)
	    }
	  }
	  function quasi(type, value) {
	    if (type != "quasi") { return pass(); }
	    if (value.slice(value.length - 2) != "${") { return cont(quasi); }
	    return cont(expression, continueQuasi);
	  }
	  function continueQuasi(type) {
	    if (type == "}") {
	      cx.marked = "string-2";
	      cx.state.tokenize = tokenQuasi;
	      return cont(quasi);
	    }
	  }
	  function arrowBody(type) {
	    findFatArrow(cx.stream, cx.state);
	    return pass(type == "{" ? statement : expression);
	  }
	  function arrowBodyNoComma(type) {
	    findFatArrow(cx.stream, cx.state);
	    return pass(type == "{" ? statement : expressionNoComma);
	  }
	  function maybeTarget(noComma) {
	    return function(type) {
	      if (type == ".") { return cont(noComma ? targetNoComma : target); }
	      else if (type == "variable" && isTS) { return cont(maybeTypeArgs, noComma ? maybeoperatorNoComma : maybeoperatorComma) }
	      else { return pass(noComma ? expressionNoComma : expression); }
	    };
	  }
	  function target(_, value) {
	    if (value == "target") { cx.marked = "keyword"; return cont(maybeoperatorComma); }
	  }
	  function targetNoComma(_, value) {
	    if (value == "target") { cx.marked = "keyword"; return cont(maybeoperatorNoComma); }
	  }
	  function maybelabel(type) {
	    if (type == ":") { return cont(poplex, statement); }
	    return pass(maybeoperatorComma, expect(";"), poplex);
	  }
	  function property(type) {
	    if (type == "variable") {cx.marked = "property"; return cont();}
	  }
	  function objprop(type, value) {
	    if (type == "async") {
	      cx.marked = "property";
	      return cont(objprop);
	    } else if (type == "variable" || cx.style == "keyword") {
	      cx.marked = "property";
	      if (value == "get" || value == "set") { return cont(getterSetter); }
	      var m; // Work around fat-arrow-detection complication for detecting typescript typed arrow params
	      if (isTS && cx.state.fatArrowAt == cx.stream.start && (m = cx.stream.match(/^\s*:\s*/, false)))
	        { cx.state.fatArrowAt = cx.stream.pos + m[0].length; }
	      return cont(afterprop);
	    } else if (type == "number" || type == "string") {
	      cx.marked = jsonldMode ? "property" : (cx.style + " property");
	      return cont(afterprop);
	    } else if (type == "jsonld-keyword") {
	      return cont(afterprop);
	    } else if (isTS && isModifier(value)) {
	      cx.marked = "keyword";
	      return cont(objprop)
	    } else if (type == "[") {
	      return cont(expression, maybetype, expect("]"), afterprop);
	    } else if (type == "spread") {
	      return cont(expressionNoComma, afterprop);
	    } else if (value == "*") {
	      cx.marked = "keyword";
	      return cont(objprop);
	    } else if (type == ":") {
	      return pass(afterprop)
	    }
	  }
	  function getterSetter(type) {
	    if (type != "variable") { return pass(afterprop); }
	    cx.marked = "property";
	    return cont(functiondef);
	  }
	  function afterprop(type) {
	    if (type == ":") { return cont(expressionNoComma); }
	    if (type == "(") { return pass(functiondef); }
	  }
	  function commasep(what, end, sep) {
	    function proceed(type, value) {
	      if (sep ? sep.indexOf(type) > -1 : type == ",") {
	        var lex = cx.state.lexical;
	        if (lex.info == "call") { lex.pos = (lex.pos || 0) + 1; }
	        return cont(function(type, value) {
	          if (type == end || value == end) { return pass() }
	          return pass(what)
	        }, proceed);
	      }
	      if (type == end || value == end) { return cont(); }
	      return cont(expect(end));
	    }
	    return function(type, value) {
	      if (type == end || value == end) { return cont(); }
	      return pass(what, proceed);
	    };
	  }
	  function contCommasep(what, end, info) {
	    var arguments$1 = arguments;

	    for (var i = 3; i < arguments.length; i++)
	      { cx.cc.push(arguments$1[i]); }
	    return cont(pushlex(end, info), commasep(what, end), poplex);
	  }
	  function block(type) {
	    if (type == "}") { return cont(); }
	    return pass(statement, block);
	  }
	  function maybetype(type, value) {
	    if (isTS) {
	      if (type == ":") { return cont(typeexpr); }
	      if (value == "?") { return cont(maybetype); }
	    }
	  }
	  function mayberettype(type) {
	    if (isTS && type == ":") {
	      if (cx.stream.match(/^\s*\w+\s+is\b/, false)) { return cont(expression, isKW, typeexpr) }
	      else { return cont(typeexpr) }
	    }
	  }
	  function isKW(_, value) {
	    if (value == "is") {
	      cx.marked = "keyword";
	      return cont()
	    }
	  }
	  function typeexpr(type, value) {
	    if (value == "keyof" || value == "typeof") {
	      cx.marked = "keyword";
	      return cont(value == "keyof" ? typeexpr : expressionNoComma)
	    }
	    if (type == "variable" || value == "void") {
	      cx.marked = "type";
	      return cont(afterType)
	    }
	    if (type == "string" || type == "number" || type == "atom") { return cont(afterType); }
	    if (type == "[") { return cont(pushlex("]"), commasep(typeexpr, "]", ","), poplex, afterType) }
	    if (type == "{") { return cont(pushlex("}"), commasep(typeprop, "}", ",;"), poplex, afterType) }
	    if (type == "(") { return cont(commasep(typearg, ")"), maybeReturnType) }
	    if (type == "<") { return cont(commasep(typeexpr, ">"), typeexpr) }
	  }
	  function maybeReturnType(type) {
	    if (type == "=>") { return cont(typeexpr) }
	  }
	  function typeprop(type, value) {
	    if (type == "variable" || cx.style == "keyword") {
	      cx.marked = "property";
	      return cont(typeprop)
	    } else if (value == "?") {
	      return cont(typeprop)
	    } else if (type == ":") {
	      return cont(typeexpr)
	    } else if (type == "[") {
	      return cont(expression, maybetype, expect("]"), typeprop)
	    }
	  }
	  function typearg(type, value) {
	    if (type == "variable" && cx.stream.match(/^\s*[?:]/, false) || value == "?") { return cont(typearg) }
	    if (type == ":") { return cont(typeexpr) }
	    return pass(typeexpr)
	  }
	  function afterType(type, value) {
	    if (value == "<") { return cont(pushlex(">"), commasep(typeexpr, ">"), poplex, afterType) }
	    if (value == "|" || type == "." || value == "&") { return cont(typeexpr) }
	    if (type == "[") { return cont(expect("]"), afterType) }
	    if (value == "extends" || value == "implements") { cx.marked = "keyword"; return cont(typeexpr) }
	  }
	  function maybeTypeArgs(_, value) {
	    if (value == "<") { return cont(pushlex(">"), commasep(typeexpr, ">"), poplex, afterType) }
	  }
	  function typeparam() {
	    return pass(typeexpr, maybeTypeDefault)
	  }
	  function maybeTypeDefault(_, value) {
	    if (value == "=") { return cont(typeexpr) }
	  }
	  function vardef(_, value) {
	    if (value == "enum") {cx.marked = "keyword"; return cont(enumdef)}
	    return pass(pattern, maybetype, maybeAssign, vardefCont);
	  }
	  function pattern(type, value) {
	    if (isTS && isModifier(value)) { cx.marked = "keyword"; return cont(pattern) }
	    if (type == "variable") { register(value); return cont(); }
	    if (type == "spread") { return cont(pattern); }
	    if (type == "[") { return contCommasep(eltpattern, "]"); }
	    if (type == "{") { return contCommasep(proppattern, "}"); }
	  }
	  function proppattern(type, value) {
	    if (type == "variable" && !cx.stream.match(/^\s*:/, false)) {
	      register(value);
	      return cont(maybeAssign);
	    }
	    if (type == "variable") { cx.marked = "property"; }
	    if (type == "spread") { return cont(pattern); }
	    if (type == "}") { return pass(); }
	    return cont(expect(":"), pattern, maybeAssign);
	  }
	  function eltpattern() {
	    return pass(pattern, maybeAssign)
	  }
	  function maybeAssign(_type, value) {
	    if (value == "=") { return cont(expressionNoComma); }
	  }
	  function vardefCont(type) {
	    if (type == ",") { return cont(vardef); }
	  }
	  function maybeelse(type, value) {
	    if (type == "keyword b" && value == "else") { return cont(pushlex("form", "else"), statement, poplex); }
	  }
	  function forspec(type, value) {
	    if (value == "await") { return cont(forspec); }
	    if (type == "(") { return cont(pushlex(")"), forspec1, expect(")"), poplex); }
	  }
	  function forspec1(type) {
	    if (type == "var") { return cont(vardef, expect(";"), forspec2); }
	    if (type == ";") { return cont(forspec2); }
	    if (type == "variable") { return cont(formaybeinof); }
	    return pass(expression, expect(";"), forspec2);
	  }
	  function formaybeinof(_type, value) {
	    if (value == "in" || value == "of") { cx.marked = "keyword"; return cont(expression); }
	    return cont(maybeoperatorComma, forspec2);
	  }
	  function forspec2(type, value) {
	    if (type == ";") { return cont(forspec3); }
	    if (value == "in" || value == "of") { cx.marked = "keyword"; return cont(expression); }
	    return pass(expression, expect(";"), forspec3);
	  }
	  function forspec3(type) {
	    if (type != ")") { cont(expression); }
	  }
	  function functiondef(type, value) {
	    if (value == "*") {cx.marked = "keyword"; return cont(functiondef);}
	    if (type == "variable") {register(value); return cont(functiondef);}
	    if (type == "(") { return cont(pushcontext, pushlex(")"), commasep(funarg, ")"), poplex, mayberettype, statement, popcontext); }
	    if (isTS && value == "<") { return cont(pushlex(">"), commasep(typeparam, ">"), poplex, functiondef) }
	  }
	  function funarg(type, value) {
	    if (value == "@") { cont(expression, funarg); }
	    if (type == "spread") { return cont(funarg); }
	    if (isTS && isModifier(value)) { cx.marked = "keyword"; return cont(funarg); }
	    return pass(pattern, maybetype, maybeAssign);
	  }
	  function classExpression(type, value) {
	    // Class expressions may have an optional name.
	    if (type == "variable") { return className(type, value); }
	    return classNameAfter(type, value);
	  }
	  function className(type, value) {
	    if (type == "variable") {register(value); return cont(classNameAfter);}
	  }
	  function classNameAfter(type, value) {
	    if (value == "<") { return cont(pushlex(">"), commasep(typeparam, ">"), poplex, classNameAfter) }
	    if (value == "extends" || value == "implements" || (isTS && type == ",")) {
	      if (value == "implements") { cx.marked = "keyword"; }
	      return cont(isTS ? typeexpr : expression, classNameAfter);
	    }
	    if (type == "{") { return cont(pushlex("}"), classBody, poplex); }
	  }
	  function classBody(type, value) {
	    if (type == "async" ||
	        (type == "variable" &&
	         (value == "static" || value == "get" || value == "set" || (isTS && isModifier(value))) &&
	         cx.stream.match(/^\s+[\w$\xa1-\uffff]/, false))) {
	      cx.marked = "keyword";
	      return cont(classBody);
	    }
	    if (type == "variable" || cx.style == "keyword") {
	      cx.marked = "property";
	      return cont(isTS ? classfield : functiondef, classBody);
	    }
	    if (type == "[")
	      { return cont(expression, maybetype, expect("]"), isTS ? classfield : functiondef, classBody) }
	    if (value == "*") {
	      cx.marked = "keyword";
	      return cont(classBody);
	    }
	    if (type == ";") { return cont(classBody); }
	    if (type == "}") { return cont(); }
	    if (value == "@") { return cont(expression, classBody) }
	  }
	  function classfield(type, value) {
	    if (value == "?") { return cont(classfield) }
	    if (type == ":") { return cont(typeexpr, maybeAssign) }
	    if (value == "=") { return cont(expressionNoComma) }
	    return pass(functiondef)
	  }
	  function afterExport(type, value) {
	    if (value == "*") { cx.marked = "keyword"; return cont(maybeFrom, expect(";")); }
	    if (value == "default") { cx.marked = "keyword"; return cont(expression, expect(";")); }
	    if (type == "{") { return cont(commasep(exportField, "}"), maybeFrom, expect(";")); }
	    return pass(statement);
	  }
	  function exportField(type, value) {
	    if (value == "as") { cx.marked = "keyword"; return cont(expect("variable")); }
	    if (type == "variable") { return pass(expressionNoComma, exportField); }
	  }
	  function afterImport(type) {
	    if (type == "string") { return cont(); }
	    if (type == "(") { return pass(expression); }
	    return pass(importSpec, maybeMoreImports, maybeFrom);
	  }
	  function importSpec(type, value) {
	    if (type == "{") { return contCommasep(importSpec, "}"); }
	    if (type == "variable") { register(value); }
	    if (value == "*") { cx.marked = "keyword"; }
	    return cont(maybeAs);
	  }
	  function maybeMoreImports(type) {
	    if (type == ",") { return cont(importSpec, maybeMoreImports) }
	  }
	  function maybeAs(_type, value) {
	    if (value == "as") { cx.marked = "keyword"; return cont(importSpec); }
	  }
	  function maybeFrom(_type, value) {
	    if (value == "from") { cx.marked = "keyword"; return cont(expression); }
	  }
	  function arrayLiteral(type) {
	    if (type == "]") { return cont(); }
	    return pass(commasep(expressionNoComma, "]"));
	  }
	  function enumdef() {
	    return pass(pushlex("form"), pattern, expect("{"), pushlex("}"), commasep(enummember, "}"), poplex, poplex)
	  }
	  function enummember() {
	    return pass(pattern, maybeAssign);
	  }

	  function isContinuedStatement(state, textAfter) {
	    return state.lastType == "operator" || state.lastType == "," ||
	      isOperatorChar.test(textAfter.charAt(0)) ||
	      /[,.]/.test(textAfter.charAt(0));
	  }

	  function expressionAllowed(stream, state, backUp) {
	    return state.tokenize == tokenBase &&
	      /^(?:operator|sof|keyword [bcd]|case|new|export|default|spread|[\[{}\(,;:]|=>)$/.test(state.lastType) ||
	      (state.lastType == "quasi" && /\{\s*$/.test(stream.string.slice(0, stream.pos - (backUp || 0))))
	  }

	  // Interface

	  return {
	    startState: function(basecolumn) {
	      var state = {
	        tokenize: tokenBase,
	        lastType: "sof",
	        cc: [],
	        lexical: new JSLexical((basecolumn || 0) - indentUnit, 0, "block", false),
	        localVars: parserConfig.localVars,
	        context: parserConfig.localVars && new Context(null, null, false),
	        indented: basecolumn || 0
	      };
	      if (parserConfig.globalVars && typeof parserConfig.globalVars == "object")
	        { state.globalVars = parserConfig.globalVars; }
	      return state;
	    },

	    token: function(stream, state) {
	      if (stream.sol()) {
	        if (!state.lexical.hasOwnProperty("align"))
	          { state.lexical.align = false; }
	        state.indented = stream.indentation();
	        findFatArrow(stream, state);
	      }
	      if (state.tokenize != tokenComment && stream.eatSpace()) { return null; }
	      var style = state.tokenize(stream, state);
	      if (type == "comment") { return style; }
	      state.lastType = type == "operator" && (content == "++" || content == "--") ? "incdec" : type;
	      return parseJS(state, style, type, content, stream);
	    },

	    indent: function(state, textAfter) {
	      if (state.tokenize == tokenComment) { return CodeMirror.Pass; }
	      if (state.tokenize != tokenBase) { return 0; }
	      var firstChar = textAfter && textAfter.charAt(0), lexical = state.lexical, top;
	      // Kludge to prevent 'maybelse' from blocking lexical scope pops
	      if (!/^\s*else\b/.test(textAfter)) { for (var i = state.cc.length - 1; i >= 0; --i) {
	        var c = state.cc[i];
	        if (c == poplex) { lexical = lexical.prev; }
	        else if (c != maybeelse) { break; }
	      } }
	      while ((lexical.type == "stat" || lexical.type == "form") &&
	             (firstChar == "}" || ((top = state.cc[state.cc.length - 1]) &&
	                                   (top == maybeoperatorComma || top == maybeoperatorNoComma) &&
	                                   !/^[,\.=+\-*:?[\(]/.test(textAfter))))
	        { lexical = lexical.prev; }
	      if (statementIndent && lexical.type == ")" && lexical.prev.type == "stat")
	        { lexical = lexical.prev; }
	      var type = lexical.type, closing = firstChar == type;

	      if (type == "vardef") { return lexical.indented + (state.lastType == "operator" || state.lastType == "," ? lexical.info.length + 1 : 0); }
	      else if (type == "form" && firstChar == "{") { return lexical.indented; }
	      else if (type == "form") { return lexical.indented + indentUnit; }
	      else if (type == "stat")
	        { return lexical.indented + (isContinuedStatement(state, textAfter) ? statementIndent || indentUnit : 0); }
	      else if (lexical.info == "switch" && !closing && parserConfig.doubleIndentSwitch != false)
	        { return lexical.indented + (/^(?:case|default)\b/.test(textAfter) ? indentUnit : 2 * indentUnit); }
	      else if (lexical.align) { return lexical.column + (closing ? 0 : 1); }
	      else { return lexical.indented + (closing ? 0 : indentUnit); }
	    },

	    electricInput: /^\s*(?:case .*?:|default:|\{|\})$/,
	    blockCommentStart: jsonMode ? null : "/*",
	    blockCommentEnd: jsonMode ? null : "*/",
	    blockCommentContinue: jsonMode ? null : " * ",
	    lineComment: jsonMode ? null : "//",
	    fold: "brace",
	    closeBrackets: "()[]{}''\"\"``",

	    helperType: jsonMode ? "json" : "javascript",
	    jsonldMode: jsonldMode,
	    jsonMode: jsonMode,

	    expressionAllowed: expressionAllowed,

	    skipExpression: function(state) {
	      var top = state.cc[state.cc.length - 1];
	      if (top == expression || top == expressionNoComma) { state.cc.pop(); }
	    }
	  };
	});

	CodeMirror.registerHelper("wordChars", "javascript", /[\w$]/);

	CodeMirror.defineMIME("text/javascript", "javascript");
	CodeMirror.defineMIME("text/ecmascript", "javascript");
	CodeMirror.defineMIME("application/javascript", "javascript");
	CodeMirror.defineMIME("application/x-javascript", "javascript");
	CodeMirror.defineMIME("application/ecmascript", "javascript");
	CodeMirror.defineMIME("application/json", {name: "javascript", json: true});
	CodeMirror.defineMIME("application/x-json", {name: "javascript", json: true});
	CodeMirror.defineMIME("application/ld+json", {name: "javascript", jsonld: true});
	CodeMirror.defineMIME("text/typescript", { name: "javascript", typescript: true });
	CodeMirror.defineMIME("application/typescript", { name: "javascript", typescript: true });

	});
	});

	var coffeescript = createCommonjsModule(function (module, exports) {
	// CodeMirror, copyright (c) by Marijn Haverbeke and others
	// Distributed under an MIT license: https://codemirror.net/LICENSE

	/**
	 * Link to the project's GitHub page:
	 * https://github.com/pickhardt/coffeescript-codemirror-mode
	 */
	(function(mod) {
	  { mod(codemirror); }
	})(function(CodeMirror) {

	CodeMirror.defineMode("coffeescript", function(conf, parserConf) {
	  var ERRORCLASS = "error";

	  function wordRegexp(words) {
	    return new RegExp("^((" + words.join(")|(") + "))\\b");
	  }

	  var operators = /^(?:->|=>|\+[+=]?|-[\-=]?|\*[\*=]?|\/[\/=]?|[=!]=|<[><]?=?|>>?=?|%=?|&=?|\|=?|\^=?|\~|!|\?|(or|and|\|\||&&|\?)=)/;
	  var delimiters = /^(?:[()\[\]{},:`=;]|\.\.?\.?)/;
	  var identifiers = /^[_A-Za-z$][_A-Za-z$0-9]*/;
	  var atProp = /^@[_A-Za-z$][_A-Za-z$0-9]*/;

	  var wordOperators = wordRegexp(["and", "or", "not",
	                                  "is", "isnt", "in",
	                                  "instanceof", "typeof"]);
	  var indentKeywords = ["for", "while", "loop", "if", "unless", "else",
	                        "switch", "try", "catch", "finally", "class"];
	  var commonKeywords = ["break", "by", "continue", "debugger", "delete",
	                        "do", "in", "of", "new", "return", "then",
	                        "this", "@", "throw", "when", "until", "extends"];

	  var keywords = wordRegexp(indentKeywords.concat(commonKeywords));

	  indentKeywords = wordRegexp(indentKeywords);


	  var stringPrefixes = /^('{3}|\"{3}|['\"])/;
	  var regexPrefixes = /^(\/{3}|\/)/;
	  var commonConstants = ["Infinity", "NaN", "undefined", "null", "true", "false", "on", "off", "yes", "no"];
	  var constants = wordRegexp(commonConstants);

	  // Tokenizers
	  function tokenBase(stream, state) {
	    // Handle scope changes
	    if (stream.sol()) {
	      if (state.scope.align === null) { state.scope.align = false; }
	      var scopeOffset = state.scope.offset;
	      if (stream.eatSpace()) {
	        var lineOffset = stream.indentation();
	        if (lineOffset > scopeOffset && state.scope.type == "coffee") {
	          return "indent";
	        } else if (lineOffset < scopeOffset) {
	          return "dedent";
	        }
	        return null;
	      } else {
	        if (scopeOffset > 0) {
	          dedent(stream, state);
	        }
	      }
	    }
	    if (stream.eatSpace()) {
	      return null;
	    }

	    var ch = stream.peek();

	    // Handle docco title comment (single line)
	    if (stream.match("####")) {
	      stream.skipToEnd();
	      return "comment";
	    }

	    // Handle multi line comments
	    if (stream.match("###")) {
	      state.tokenize = longComment;
	      return state.tokenize(stream, state);
	    }

	    // Single line comment
	    if (ch === "#") {
	      stream.skipToEnd();
	      return "comment";
	    }

	    // Handle number literals
	    if (stream.match(/^-?[0-9\.]/, false)) {
	      var floatLiteral = false;
	      // Floats
	      if (stream.match(/^-?\d*\.\d+(e[\+\-]?\d+)?/i)) {
	        floatLiteral = true;
	      }
	      if (stream.match(/^-?\d+\.\d*/)) {
	        floatLiteral = true;
	      }
	      if (stream.match(/^-?\.\d+/)) {
	        floatLiteral = true;
	      }

	      if (floatLiteral) {
	        // prevent from getting extra . on 1..
	        if (stream.peek() == "."){
	          stream.backUp(1);
	        }
	        return "number";
	      }
	      // Integers
	      var intLiteral = false;
	      // Hex
	      if (stream.match(/^-?0x[0-9a-f]+/i)) {
	        intLiteral = true;
	      }
	      // Decimal
	      if (stream.match(/^-?[1-9]\d*(e[\+\-]?\d+)?/)) {
	        intLiteral = true;
	      }
	      // Zero by itself with no other piece of number.
	      if (stream.match(/^-?0(?![\dx])/i)) {
	        intLiteral = true;
	      }
	      if (intLiteral) {
	        return "number";
	      }
	    }

	    // Handle strings
	    if (stream.match(stringPrefixes)) {
	      state.tokenize = tokenFactory(stream.current(), false, "string");
	      return state.tokenize(stream, state);
	    }
	    // Handle regex literals
	    if (stream.match(regexPrefixes)) {
	      if (stream.current() != "/" || stream.match(/^.*\//, false)) { // prevent highlight of division
	        state.tokenize = tokenFactory(stream.current(), true, "string-2");
	        return state.tokenize(stream, state);
	      } else {
	        stream.backUp(1);
	      }
	    }



	    // Handle operators and delimiters
	    if (stream.match(operators) || stream.match(wordOperators)) {
	      return "operator";
	    }
	    if (stream.match(delimiters)) {
	      return "punctuation";
	    }

	    if (stream.match(constants)) {
	      return "atom";
	    }

	    if (stream.match(atProp) || state.prop && stream.match(identifiers)) {
	      return "property";
	    }

	    if (stream.match(keywords)) {
	      return "keyword";
	    }

	    if (stream.match(identifiers)) {
	      return "variable";
	    }

	    // Handle non-detected items
	    stream.next();
	    return ERRORCLASS;
	  }

	  function tokenFactory(delimiter, singleline, outclass) {
	    return function(stream, state) {
	      while (!stream.eol()) {
	        stream.eatWhile(/[^'"\/\\]/);
	        if (stream.eat("\\")) {
	          stream.next();
	          if (singleline && stream.eol()) {
	            return outclass;
	          }
	        } else if (stream.match(delimiter)) {
	          state.tokenize = tokenBase;
	          return outclass;
	        } else {
	          stream.eat(/['"\/]/);
	        }
	      }
	      if (singleline) {
	        if (parserConf.singleLineStringErrors) {
	          outclass = ERRORCLASS;
	        } else {
	          state.tokenize = tokenBase;
	        }
	      }
	      return outclass;
	    };
	  }

	  function longComment(stream, state) {
	    while (!stream.eol()) {
	      stream.eatWhile(/[^#]/);
	      if (stream.match("###")) {
	        state.tokenize = tokenBase;
	        break;
	      }
	      stream.eatWhile("#");
	    }
	    return "comment";
	  }

	  function indent(stream, state, type) {
	    type = type || "coffee";
	    var offset = 0, align = false, alignOffset = null;
	    for (var scope = state.scope; scope; scope = scope.prev) {
	      if (scope.type === "coffee" || scope.type == "}") {
	        offset = scope.offset + conf.indentUnit;
	        break;
	      }
	    }
	    if (type !== "coffee") {
	      align = null;
	      alignOffset = stream.column() + stream.current().length;
	    } else if (state.scope.align) {
	      state.scope.align = false;
	    }
	    state.scope = {
	      offset: offset,
	      type: type,
	      prev: state.scope,
	      align: align,
	      alignOffset: alignOffset
	    };
	  }

	  function dedent(stream, state) {
	    if (!state.scope.prev) { return; }
	    if (state.scope.type === "coffee") {
	      var _indent = stream.indentation();
	      var matched = false;
	      for (var scope = state.scope; scope; scope = scope.prev) {
	        if (_indent === scope.offset) {
	          matched = true;
	          break;
	        }
	      }
	      if (!matched) {
	        return true;
	      }
	      while (state.scope.prev && state.scope.offset !== _indent) {
	        state.scope = state.scope.prev;
	      }
	      return false;
	    } else {
	      state.scope = state.scope.prev;
	      return false;
	    }
	  }

	  function tokenLexer(stream, state) {
	    var style = state.tokenize(stream, state);
	    var current = stream.current();

	    // Handle scope changes.
	    if (current === "return") {
	      state.dedent = true;
	    }
	    if (((current === "->" || current === "=>") && stream.eol())
	        || style === "indent") {
	      indent(stream, state);
	    }
	    var delimiter_index = "[({".indexOf(current);
	    if (delimiter_index !== -1) {
	      indent(stream, state, "])}".slice(delimiter_index, delimiter_index+1));
	    }
	    if (indentKeywords.exec(current)){
	      indent(stream, state);
	    }
	    if (current == "then"){
	      dedent(stream, state);
	    }


	    if (style === "dedent") {
	      if (dedent(stream, state)) {
	        return ERRORCLASS;
	      }
	    }
	    delimiter_index = "])}".indexOf(current);
	    if (delimiter_index !== -1) {
	      while (state.scope.type == "coffee" && state.scope.prev)
	        { state.scope = state.scope.prev; }
	      if (state.scope.type == current)
	        { state.scope = state.scope.prev; }
	    }
	    if (state.dedent && stream.eol()) {
	      if (state.scope.type == "coffee" && state.scope.prev)
	        { state.scope = state.scope.prev; }
	      state.dedent = false;
	    }

	    return style;
	  }

	  var external = {
	    startState: function(basecolumn) {
	      return {
	        tokenize: tokenBase,
	        scope: {offset:basecolumn || 0, type:"coffee", prev: null, align: false},
	        prop: false,
	        dedent: 0
	      };
	    },

	    token: function(stream, state) {
	      var fillAlign = state.scope.align === null && state.scope;
	      if (fillAlign && stream.sol()) { fillAlign.align = false; }

	      var style = tokenLexer(stream, state);
	      if (style && style != "comment") {
	        if (fillAlign) { fillAlign.align = true; }
	        state.prop = style == "punctuation" && stream.current() == ".";
	      }

	      return style;
	    },

	    indent: function(state, text) {
	      if (state.tokenize != tokenBase) { return 0; }
	      var scope = state.scope;
	      var closer = text && "])}".indexOf(text.charAt(0)) > -1;
	      if (closer) { while (scope.type == "coffee" && scope.prev) { scope = scope.prev; } }
	      var closes = closer && scope.type === text.charAt(0);
	      if (scope.align)
	        { return scope.alignOffset - (closes ? 1 : 0); }
	      else
	        { return (closes ? scope.prev : scope).offset; }
	    },

	    lineComment: "#",
	    fold: "indent"
	  };
	  return external;
	});

	// IANA registered media type
	// https://www.iana.org/assignments/media-types/
	CodeMirror.defineMIME("application/vnd.coffeescript", "coffeescript");

	CodeMirror.defineMIME("text/x-coffeescript", "coffeescript");
	CodeMirror.defineMIME("text/coffeescript", "coffeescript");

	});
	});

	var css$2 = createCommonjsModule(function (module, exports) {
	// CodeMirror, copyright (c) by Marijn Haverbeke and others
	// Distributed under an MIT license: https://codemirror.net/LICENSE

	(function(mod) {
	  { mod(codemirror); }
	})(function(CodeMirror) {

	CodeMirror.defineMode("css", function(config, parserConfig) {
	  var inline = parserConfig.inline;
	  if (!parserConfig.propertyKeywords) { parserConfig = CodeMirror.resolveMode("text/css"); }

	  var indentUnit = config.indentUnit,
	      tokenHooks = parserConfig.tokenHooks,
	      documentTypes = parserConfig.documentTypes || {},
	      mediaTypes = parserConfig.mediaTypes || {},
	      mediaFeatures = parserConfig.mediaFeatures || {},
	      mediaValueKeywords = parserConfig.mediaValueKeywords || {},
	      propertyKeywords = parserConfig.propertyKeywords || {},
	      nonStandardPropertyKeywords = parserConfig.nonStandardPropertyKeywords || {},
	      fontProperties = parserConfig.fontProperties || {},
	      counterDescriptors = parserConfig.counterDescriptors || {},
	      colorKeywords = parserConfig.colorKeywords || {},
	      valueKeywords = parserConfig.valueKeywords || {},
	      allowNested = parserConfig.allowNested,
	      lineComment = parserConfig.lineComment,
	      supportsAtComponent = parserConfig.supportsAtComponent === true;

	  var type, override;
	  function ret(style, tp) { type = tp; return style; }

	  // Tokenizers

	  function tokenBase(stream, state) {
	    var ch = stream.next();
	    if (tokenHooks[ch]) {
	      var result = tokenHooks[ch](stream, state);
	      if (result !== false) { return result; }
	    }
	    if (ch == "@") {
	      stream.eatWhile(/[\w\\\-]/);
	      return ret("def", stream.current());
	    } else if (ch == "=" || (ch == "~" || ch == "|") && stream.eat("=")) {
	      return ret(null, "compare");
	    } else if (ch == "\"" || ch == "'") {
	      state.tokenize = tokenString(ch);
	      return state.tokenize(stream, state);
	    } else if (ch == "#") {
	      stream.eatWhile(/[\w\\\-]/);
	      return ret("atom", "hash");
	    } else if (ch == "!") {
	      stream.match(/^\s*\w*/);
	      return ret("keyword", "important");
	    } else if (/\d/.test(ch) || ch == "." && stream.eat(/\d/)) {
	      stream.eatWhile(/[\w.%]/);
	      return ret("number", "unit");
	    } else if (ch === "-") {
	      if (/[\d.]/.test(stream.peek())) {
	        stream.eatWhile(/[\w.%]/);
	        return ret("number", "unit");
	      } else if (stream.match(/^-[\w\\\-]+/)) {
	        stream.eatWhile(/[\w\\\-]/);
	        if (stream.match(/^\s*:/, false))
	          { return ret("variable-2", "variable-definition"); }
	        return ret("variable-2", "variable");
	      } else if (stream.match(/^\w+-/)) {
	        return ret("meta", "meta");
	      }
	    } else if (/[,+>*\/]/.test(ch)) {
	      return ret(null, "select-op");
	    } else if (ch == "." && stream.match(/^-?[_a-z][_a-z0-9-]*/i)) {
	      return ret("qualifier", "qualifier");
	    } else if (/[:;{}\[\]\(\)]/.test(ch)) {
	      return ret(null, ch);
	    } else if (((ch == "u" || ch == "U") && stream.match(/rl(-prefix)?\(/i)) ||
	               ((ch == "d" || ch == "D") && stream.match("omain(", true, true)) ||
	               ((ch == "r" || ch == "R") && stream.match("egexp(", true, true))) {
	      stream.backUp(1);
	      state.tokenize = tokenParenthesized;
	      return ret("property", "word");
	    } else if (/[\w\\\-]/.test(ch)) {
	      stream.eatWhile(/[\w\\\-]/);
	      return ret("property", "word");
	    } else {
	      return ret(null, null);
	    }
	  }

	  function tokenString(quote) {
	    return function(stream, state) {
	      var escaped = false, ch;
	      while ((ch = stream.next()) != null) {
	        if (ch == quote && !escaped) {
	          if (quote == ")") { stream.backUp(1); }
	          break;
	        }
	        escaped = !escaped && ch == "\\";
	      }
	      if (ch == quote || !escaped && quote != ")") { state.tokenize = null; }
	      return ret("string", "string");
	    };
	  }

	  function tokenParenthesized(stream, state) {
	    stream.next(); // Must be '('
	    if (!stream.match(/\s*[\"\')]/, false))
	      { state.tokenize = tokenString(")"); }
	    else
	      { state.tokenize = null; }
	    return ret(null, "(");
	  }

	  // Context management

	  function Context(type, indent, prev) {
	    this.type = type;
	    this.indent = indent;
	    this.prev = prev;
	  }

	  function pushContext(state, stream, type, indent) {
	    state.context = new Context(type, stream.indentation() + (indent === false ? 0 : indentUnit), state.context);
	    return type;
	  }

	  function popContext(state) {
	    if (state.context.prev)
	      { state.context = state.context.prev; }
	    return state.context.type;
	  }

	  function pass(type, stream, state) {
	    return states[state.context.type](type, stream, state);
	  }
	  function popAndPass(type, stream, state, n) {
	    for (var i = n || 1; i > 0; i--)
	      { state.context = state.context.prev; }
	    return pass(type, stream, state);
	  }

	  // Parser

	  function wordAsValue(stream) {
	    var word = stream.current().toLowerCase();
	    if (valueKeywords.hasOwnProperty(word))
	      { override = "atom"; }
	    else if (colorKeywords.hasOwnProperty(word))
	      { override = "keyword"; }
	    else
	      { override = "variable"; }
	  }

	  var states = {};

	  states.top = function(type, stream, state) {
	    if (type == "{") {
	      return pushContext(state, stream, "block");
	    } else if (type == "}" && state.context.prev) {
	      return popContext(state);
	    } else if (supportsAtComponent && /@component/i.test(type)) {
	      return pushContext(state, stream, "atComponentBlock");
	    } else if (/^@(-moz-)?document$/i.test(type)) {
	      return pushContext(state, stream, "documentTypes");
	    } else if (/^@(media|supports|(-moz-)?document|import)$/i.test(type)) {
	      return pushContext(state, stream, "atBlock");
	    } else if (/^@(font-face|counter-style)/i.test(type)) {
	      state.stateArg = type;
	      return "restricted_atBlock_before";
	    } else if (/^@(-(moz|ms|o|webkit)-)?keyframes$/i.test(type)) {
	      return "keyframes";
	    } else if (type && type.charAt(0) == "@") {
	      return pushContext(state, stream, "at");
	    } else if (type == "hash") {
	      override = "builtin";
	    } else if (type == "word") {
	      override = "tag";
	    } else if (type == "variable-definition") {
	      return "maybeprop";
	    } else if (type == "interpolation") {
	      return pushContext(state, stream, "interpolation");
	    } else if (type == ":") {
	      return "pseudo";
	    } else if (allowNested && type == "(") {
	      return pushContext(state, stream, "parens");
	    }
	    return state.context.type;
	  };

	  states.block = function(type, stream, state) {
	    if (type == "word") {
	      var word = stream.current().toLowerCase();
	      if (propertyKeywords.hasOwnProperty(word)) {
	        override = "property";
	        return "maybeprop";
	      } else if (nonStandardPropertyKeywords.hasOwnProperty(word)) {
	        override = "string-2";
	        return "maybeprop";
	      } else if (allowNested) {
	        override = stream.match(/^\s*:(?:\s|$)/, false) ? "property" : "tag";
	        return "block";
	      } else {
	        override += " error";
	        return "maybeprop";
	      }
	    } else if (type == "meta") {
	      return "block";
	    } else if (!allowNested && (type == "hash" || type == "qualifier")) {
	      override = "error";
	      return "block";
	    } else {
	      return states.top(type, stream, state);
	    }
	  };

	  states.maybeprop = function(type, stream, state) {
	    if (type == ":") { return pushContext(state, stream, "prop"); }
	    return pass(type, stream, state);
	  };

	  states.prop = function(type, stream, state) {
	    if (type == ";") { return popContext(state); }
	    if (type == "{" && allowNested) { return pushContext(state, stream, "propBlock"); }
	    if (type == "}" || type == "{") { return popAndPass(type, stream, state); }
	    if (type == "(") { return pushContext(state, stream, "parens"); }

	    if (type == "hash" && !/^#([0-9a-fA-f]{3,4}|[0-9a-fA-f]{6}|[0-9a-fA-f]{8})$/.test(stream.current())) {
	      override += " error";
	    } else if (type == "word") {
	      wordAsValue(stream);
	    } else if (type == "interpolation") {
	      return pushContext(state, stream, "interpolation");
	    }
	    return "prop";
	  };

	  states.propBlock = function(type, _stream, state) {
	    if (type == "}") { return popContext(state); }
	    if (type == "word") { override = "property"; return "maybeprop"; }
	    return state.context.type;
	  };

	  states.parens = function(type, stream, state) {
	    if (type == "{" || type == "}") { return popAndPass(type, stream, state); }
	    if (type == ")") { return popContext(state); }
	    if (type == "(") { return pushContext(state, stream, "parens"); }
	    if (type == "interpolation") { return pushContext(state, stream, "interpolation"); }
	    if (type == "word") { wordAsValue(stream); }
	    return "parens";
	  };

	  states.pseudo = function(type, stream, state) {
	    if (type == "meta") { return "pseudo"; }

	    if (type == "word") {
	      override = "variable-3";
	      return state.context.type;
	    }
	    return pass(type, stream, state);
	  };

	  states.documentTypes = function(type, stream, state) {
	    if (type == "word" && documentTypes.hasOwnProperty(stream.current())) {
	      override = "tag";
	      return state.context.type;
	    } else {
	      return states.atBlock(type, stream, state);
	    }
	  };

	  states.atBlock = function(type, stream, state) {
	    if (type == "(") { return pushContext(state, stream, "atBlock_parens"); }
	    if (type == "}" || type == ";") { return popAndPass(type, stream, state); }
	    if (type == "{") { return popContext(state) && pushContext(state, stream, allowNested ? "block" : "top"); }

	    if (type == "interpolation") { return pushContext(state, stream, "interpolation"); }

	    if (type == "word") {
	      var word = stream.current().toLowerCase();
	      if (word == "only" || word == "not" || word == "and" || word == "or")
	        { override = "keyword"; }
	      else if (mediaTypes.hasOwnProperty(word))
	        { override = "attribute"; }
	      else if (mediaFeatures.hasOwnProperty(word))
	        { override = "property"; }
	      else if (mediaValueKeywords.hasOwnProperty(word))
	        { override = "keyword"; }
	      else if (propertyKeywords.hasOwnProperty(word))
	        { override = "property"; }
	      else if (nonStandardPropertyKeywords.hasOwnProperty(word))
	        { override = "string-2"; }
	      else if (valueKeywords.hasOwnProperty(word))
	        { override = "atom"; }
	      else if (colorKeywords.hasOwnProperty(word))
	        { override = "keyword"; }
	      else
	        { override = "error"; }
	    }
	    return state.context.type;
	  };

	  states.atComponentBlock = function(type, stream, state) {
	    if (type == "}")
	      { return popAndPass(type, stream, state); }
	    if (type == "{")
	      { return popContext(state) && pushContext(state, stream, allowNested ? "block" : "top", false); }
	    if (type == "word")
	      { override = "error"; }
	    return state.context.type;
	  };

	  states.atBlock_parens = function(type, stream, state) {
	    if (type == ")") { return popContext(state); }
	    if (type == "{" || type == "}") { return popAndPass(type, stream, state, 2); }
	    return states.atBlock(type, stream, state);
	  };

	  states.restricted_atBlock_before = function(type, stream, state) {
	    if (type == "{")
	      { return pushContext(state, stream, "restricted_atBlock"); }
	    if (type == "word" && state.stateArg == "@counter-style") {
	      override = "variable";
	      return "restricted_atBlock_before";
	    }
	    return pass(type, stream, state);
	  };

	  states.restricted_atBlock = function(type, stream, state) {
	    if (type == "}") {
	      state.stateArg = null;
	      return popContext(state);
	    }
	    if (type == "word") {
	      if ((state.stateArg == "@font-face" && !fontProperties.hasOwnProperty(stream.current().toLowerCase())) ||
	          (state.stateArg == "@counter-style" && !counterDescriptors.hasOwnProperty(stream.current().toLowerCase())))
	        { override = "error"; }
	      else
	        { override = "property"; }
	      return "maybeprop";
	    }
	    return "restricted_atBlock";
	  };

	  states.keyframes = function(type, stream, state) {
	    if (type == "word") { override = "variable"; return "keyframes"; }
	    if (type == "{") { return pushContext(state, stream, "top"); }
	    return pass(type, stream, state);
	  };

	  states.at = function(type, stream, state) {
	    if (type == ";") { return popContext(state); }
	    if (type == "{" || type == "}") { return popAndPass(type, stream, state); }
	    if (type == "word") { override = "tag"; }
	    else if (type == "hash") { override = "builtin"; }
	    return "at";
	  };

	  states.interpolation = function(type, stream, state) {
	    if (type == "}") { return popContext(state); }
	    if (type == "{" || type == ";") { return popAndPass(type, stream, state); }
	    if (type == "word") { override = "variable"; }
	    else if (type != "variable" && type != "(" && type != ")") { override = "error"; }
	    return "interpolation";
	  };

	  return {
	    startState: function(base) {
	      return {tokenize: null,
	              state: inline ? "block" : "top",
	              stateArg: null,
	              context: new Context(inline ? "block" : "top", base || 0, null)};
	    },

	    token: function(stream, state) {
	      if (!state.tokenize && stream.eatSpace()) { return null; }
	      var style = (state.tokenize || tokenBase)(stream, state);
	      if (style && typeof style == "object") {
	        type = style[1];
	        style = style[0];
	      }
	      override = style;
	      if (type != "comment")
	        { state.state = states[state.state](type, stream, state); }
	      return override;
	    },

	    indent: function(state, textAfter) {
	      var cx = state.context, ch = textAfter && textAfter.charAt(0);
	      var indent = cx.indent;
	      if (cx.type == "prop" && (ch == "}" || ch == ")")) { cx = cx.prev; }
	      if (cx.prev) {
	        if (ch == "}" && (cx.type == "block" || cx.type == "top" ||
	                          cx.type == "interpolation" || cx.type == "restricted_atBlock")) {
	          // Resume indentation from parent context.
	          cx = cx.prev;
	          indent = cx.indent;
	        } else if (ch == ")" && (cx.type == "parens" || cx.type == "atBlock_parens") ||
	            ch == "{" && (cx.type == "at" || cx.type == "atBlock")) {
	          // Dedent relative to current context.
	          indent = Math.max(0, cx.indent - indentUnit);
	        }
	      }
	      return indent;
	    },

	    electricChars: "}",
	    blockCommentStart: "/*",
	    blockCommentEnd: "*/",
	    blockCommentContinue: " * ",
	    lineComment: lineComment,
	    fold: "brace"
	  };
	});

	  function keySet(array) {
	    var keys = {};
	    for (var i = 0; i < array.length; ++i) {
	      keys[array[i].toLowerCase()] = true;
	    }
	    return keys;
	  }

	  var documentTypes_ = [
	    "domain", "regexp", "url", "url-prefix"
	  ], documentTypes = keySet(documentTypes_);

	  var mediaTypes_ = [
	    "all", "aural", "braille", "handheld", "print", "projection", "screen",
	    "tty", "tv", "embossed"
	  ], mediaTypes = keySet(mediaTypes_);

	  var mediaFeatures_ = [
	    "width", "min-width", "max-width", "height", "min-height", "max-height",
	    "device-width", "min-device-width", "max-device-width", "device-height",
	    "min-device-height", "max-device-height", "aspect-ratio",
	    "min-aspect-ratio", "max-aspect-ratio", "device-aspect-ratio",
	    "min-device-aspect-ratio", "max-device-aspect-ratio", "color", "min-color",
	    "max-color", "color-index", "min-color-index", "max-color-index",
	    "monochrome", "min-monochrome", "max-monochrome", "resolution",
	    "min-resolution", "max-resolution", "scan", "grid", "orientation",
	    "device-pixel-ratio", "min-device-pixel-ratio", "max-device-pixel-ratio",
	    "pointer", "any-pointer", "hover", "any-hover"
	  ], mediaFeatures = keySet(mediaFeatures_);

	  var mediaValueKeywords_ = [
	    "landscape", "portrait", "none", "coarse", "fine", "on-demand", "hover",
	    "interlace", "progressive"
	  ], mediaValueKeywords = keySet(mediaValueKeywords_);

	  var propertyKeywords_ = [
	    "align-content", "align-items", "align-self", "alignment-adjust",
	    "alignment-baseline", "anchor-point", "animation", "animation-delay",
	    "animation-direction", "animation-duration", "animation-fill-mode",
	    "animation-iteration-count", "animation-name", "animation-play-state",
	    "animation-timing-function", "appearance", "azimuth", "backface-visibility",
	    "background", "background-attachment", "background-blend-mode", "background-clip",
	    "background-color", "background-image", "background-origin", "background-position",
	    "background-repeat", "background-size", "baseline-shift", "binding",
	    "bleed", "bookmark-label", "bookmark-level", "bookmark-state",
	    "bookmark-target", "border", "border-bottom", "border-bottom-color",
	    "border-bottom-left-radius", "border-bottom-right-radius",
	    "border-bottom-style", "border-bottom-width", "border-collapse",
	    "border-color", "border-image", "border-image-outset",
	    "border-image-repeat", "border-image-slice", "border-image-source",
	    "border-image-width", "border-left", "border-left-color",
	    "border-left-style", "border-left-width", "border-radius", "border-right",
	    "border-right-color", "border-right-style", "border-right-width",
	    "border-spacing", "border-style", "border-top", "border-top-color",
	    "border-top-left-radius", "border-top-right-radius", "border-top-style",
	    "border-top-width", "border-width", "bottom", "box-decoration-break",
	    "box-shadow", "box-sizing", "break-after", "break-before", "break-inside",
	    "caption-side", "caret-color", "clear", "clip", "color", "color-profile", "column-count",
	    "column-fill", "column-gap", "column-rule", "column-rule-color",
	    "column-rule-style", "column-rule-width", "column-span", "column-width",
	    "columns", "content", "counter-increment", "counter-reset", "crop", "cue",
	    "cue-after", "cue-before", "cursor", "direction", "display",
	    "dominant-baseline", "drop-initial-after-adjust",
	    "drop-initial-after-align", "drop-initial-before-adjust",
	    "drop-initial-before-align", "drop-initial-size", "drop-initial-value",
	    "elevation", "empty-cells", "fit", "fit-position", "flex", "flex-basis",
	    "flex-direction", "flex-flow", "flex-grow", "flex-shrink", "flex-wrap",
	    "float", "float-offset", "flow-from", "flow-into", "font", "font-feature-settings",
	    "font-family", "font-kerning", "font-language-override", "font-size", "font-size-adjust",
	    "font-stretch", "font-style", "font-synthesis", "font-variant",
	    "font-variant-alternates", "font-variant-caps", "font-variant-east-asian",
	    "font-variant-ligatures", "font-variant-numeric", "font-variant-position",
	    "font-weight", "grid", "grid-area", "grid-auto-columns", "grid-auto-flow",
	    "grid-auto-rows", "grid-column", "grid-column-end", "grid-column-gap",
	    "grid-column-start", "grid-gap", "grid-row", "grid-row-end", "grid-row-gap",
	    "grid-row-start", "grid-template", "grid-template-areas", "grid-template-columns",
	    "grid-template-rows", "hanging-punctuation", "height", "hyphens",
	    "icon", "image-orientation", "image-rendering", "image-resolution",
	    "inline-box-align", "justify-content", "justify-items", "justify-self", "left", "letter-spacing",
	    "line-break", "line-height", "line-stacking", "line-stacking-ruby",
	    "line-stacking-shift", "line-stacking-strategy", "list-style",
	    "list-style-image", "list-style-position", "list-style-type", "margin",
	    "margin-bottom", "margin-left", "margin-right", "margin-top",
	    "marks", "marquee-direction", "marquee-loop",
	    "marquee-play-count", "marquee-speed", "marquee-style", "max-height",
	    "max-width", "min-height", "min-width", "move-to", "nav-down", "nav-index",
	    "nav-left", "nav-right", "nav-up", "object-fit", "object-position",
	    "opacity", "order", "orphans", "outline",
	    "outline-color", "outline-offset", "outline-style", "outline-width",
	    "overflow", "overflow-style", "overflow-wrap", "overflow-x", "overflow-y",
	    "padding", "padding-bottom", "padding-left", "padding-right", "padding-top",
	    "page", "page-break-after", "page-break-before", "page-break-inside",
	    "page-policy", "pause", "pause-after", "pause-before", "perspective",
	    "perspective-origin", "pitch", "pitch-range", "place-content", "place-items", "place-self", "play-during", "position",
	    "presentation-level", "punctuation-trim", "quotes", "region-break-after",
	    "region-break-before", "region-break-inside", "region-fragment",
	    "rendering-intent", "resize", "rest", "rest-after", "rest-before", "richness",
	    "right", "rotation", "rotation-point", "ruby-align", "ruby-overhang",
	    "ruby-position", "ruby-span", "shape-image-threshold", "shape-inside", "shape-margin",
	    "shape-outside", "size", "speak", "speak-as", "speak-header",
	    "speak-numeral", "speak-punctuation", "speech-rate", "stress", "string-set",
	    "tab-size", "table-layout", "target", "target-name", "target-new",
	    "target-position", "text-align", "text-align-last", "text-decoration",
	    "text-decoration-color", "text-decoration-line", "text-decoration-skip",
	    "text-decoration-style", "text-emphasis", "text-emphasis-color",
	    "text-emphasis-position", "text-emphasis-style", "text-height",
	    "text-indent", "text-justify", "text-outline", "text-overflow", "text-shadow",
	    "text-size-adjust", "text-space-collapse", "text-transform", "text-underline-position",
	    "text-wrap", "top", "transform", "transform-origin", "transform-style",
	    "transition", "transition-delay", "transition-duration",
	    "transition-property", "transition-timing-function", "unicode-bidi",
	    "user-select", "vertical-align", "visibility", "voice-balance", "voice-duration",
	    "voice-family", "voice-pitch", "voice-range", "voice-rate", "voice-stress",
	    "voice-volume", "volume", "white-space", "widows", "width", "will-change", "word-break",
	    "word-spacing", "word-wrap", "z-index",
	    // SVG-specific
	    "clip-path", "clip-rule", "mask", "enable-background", "filter", "flood-color",
	    "flood-opacity", "lighting-color", "stop-color", "stop-opacity", "pointer-events",
	    "color-interpolation", "color-interpolation-filters",
	    "color-rendering", "fill", "fill-opacity", "fill-rule", "image-rendering",
	    "marker", "marker-end", "marker-mid", "marker-start", "shape-rendering", "stroke",
	    "stroke-dasharray", "stroke-dashoffset", "stroke-linecap", "stroke-linejoin",
	    "stroke-miterlimit", "stroke-opacity", "stroke-width", "text-rendering",
	    "baseline-shift", "dominant-baseline", "glyph-orientation-horizontal",
	    "glyph-orientation-vertical", "text-anchor", "writing-mode"
	  ], propertyKeywords = keySet(propertyKeywords_);

	  var nonStandardPropertyKeywords_ = [
	    "scrollbar-arrow-color", "scrollbar-base-color", "scrollbar-dark-shadow-color",
	    "scrollbar-face-color", "scrollbar-highlight-color", "scrollbar-shadow-color",
	    "scrollbar-3d-light-color", "scrollbar-track-color", "shape-inside",
	    "searchfield-cancel-button", "searchfield-decoration", "searchfield-results-button",
	    "searchfield-results-decoration", "zoom"
	  ], nonStandardPropertyKeywords = keySet(nonStandardPropertyKeywords_);

	  var fontProperties_ = [
	    "font-family", "src", "unicode-range", "font-variant", "font-feature-settings",
	    "font-stretch", "font-weight", "font-style"
	  ], fontProperties = keySet(fontProperties_);

	  var counterDescriptors_ = [
	    "additive-symbols", "fallback", "negative", "pad", "prefix", "range",
	    "speak-as", "suffix", "symbols", "system"
	  ], counterDescriptors = keySet(counterDescriptors_);

	  var colorKeywords_ = [
	    "aliceblue", "antiquewhite", "aqua", "aquamarine", "azure", "beige",
	    "bisque", "black", "blanchedalmond", "blue", "blueviolet", "brown",
	    "burlywood", "cadetblue", "chartreuse", "chocolate", "coral", "cornflowerblue",
	    "cornsilk", "crimson", "cyan", "darkblue", "darkcyan", "darkgoldenrod",
	    "darkgray", "darkgreen", "darkkhaki", "darkmagenta", "darkolivegreen",
	    "darkorange", "darkorchid", "darkred", "darksalmon", "darkseagreen",
	    "darkslateblue", "darkslategray", "darkturquoise", "darkviolet",
	    "deeppink", "deepskyblue", "dimgray", "dodgerblue", "firebrick",
	    "floralwhite", "forestgreen", "fuchsia", "gainsboro", "ghostwhite",
	    "gold", "goldenrod", "gray", "grey", "green", "greenyellow", "honeydew",
	    "hotpink", "indianred", "indigo", "ivory", "khaki", "lavender",
	    "lavenderblush", "lawngreen", "lemonchiffon", "lightblue", "lightcoral",
	    "lightcyan", "lightgoldenrodyellow", "lightgray", "lightgreen", "lightpink",
	    "lightsalmon", "lightseagreen", "lightskyblue", "lightslategray",
	    "lightsteelblue", "lightyellow", "lime", "limegreen", "linen", "magenta",
	    "maroon", "mediumaquamarine", "mediumblue", "mediumorchid", "mediumpurple",
	    "mediumseagreen", "mediumslateblue", "mediumspringgreen", "mediumturquoise",
	    "mediumvioletred", "midnightblue", "mintcream", "mistyrose", "moccasin",
	    "navajowhite", "navy", "oldlace", "olive", "olivedrab", "orange", "orangered",
	    "orchid", "palegoldenrod", "palegreen", "paleturquoise", "palevioletred",
	    "papayawhip", "peachpuff", "peru", "pink", "plum", "powderblue",
	    "purple", "rebeccapurple", "red", "rosybrown", "royalblue", "saddlebrown",
	    "salmon", "sandybrown", "seagreen", "seashell", "sienna", "silver", "skyblue",
	    "slateblue", "slategray", "snow", "springgreen", "steelblue", "tan",
	    "teal", "thistle", "tomato", "turquoise", "violet", "wheat", "white",
	    "whitesmoke", "yellow", "yellowgreen"
	  ], colorKeywords = keySet(colorKeywords_);

	  var valueKeywords_ = [
	    "above", "absolute", "activeborder", "additive", "activecaption", "afar",
	    "after-white-space", "ahead", "alias", "all", "all-scroll", "alphabetic", "alternate",
	    "always", "amharic", "amharic-abegede", "antialiased", "appworkspace",
	    "arabic-indic", "armenian", "asterisks", "attr", "auto", "auto-flow", "avoid", "avoid-column", "avoid-page",
	    "avoid-region", "background", "backwards", "baseline", "below", "bidi-override", "binary",
	    "bengali", "blink", "block", "block-axis", "bold", "bolder", "border", "border-box",
	    "both", "bottom", "break", "break-all", "break-word", "bullets", "button", "button-bevel",
	    "buttonface", "buttonhighlight", "buttonshadow", "buttontext", "calc", "cambodian",
	    "capitalize", "caps-lock-indicator", "caption", "captiontext", "caret",
	    "cell", "center", "checkbox", "circle", "cjk-decimal", "cjk-earthly-branch",
	    "cjk-heavenly-stem", "cjk-ideographic", "clear", "clip", "close-quote",
	    "col-resize", "collapse", "color", "color-burn", "color-dodge", "column", "column-reverse",
	    "compact", "condensed", "contain", "content", "contents",
	    "content-box", "context-menu", "continuous", "copy", "counter", "counters", "cover", "crop",
	    "cross", "crosshair", "currentcolor", "cursive", "cyclic", "darken", "dashed", "decimal",
	    "decimal-leading-zero", "default", "default-button", "dense", "destination-atop",
	    "destination-in", "destination-out", "destination-over", "devanagari", "difference",
	    "disc", "discard", "disclosure-closed", "disclosure-open", "document",
	    "dot-dash", "dot-dot-dash",
	    "dotted", "double", "down", "e-resize", "ease", "ease-in", "ease-in-out", "ease-out",
	    "element", "ellipse", "ellipsis", "embed", "end", "ethiopic", "ethiopic-abegede",
	    "ethiopic-abegede-am-et", "ethiopic-abegede-gez", "ethiopic-abegede-ti-er",
	    "ethiopic-abegede-ti-et", "ethiopic-halehame-aa-er",
	    "ethiopic-halehame-aa-et", "ethiopic-halehame-am-et",
	    "ethiopic-halehame-gez", "ethiopic-halehame-om-et",
	    "ethiopic-halehame-sid-et", "ethiopic-halehame-so-et",
	    "ethiopic-halehame-ti-er", "ethiopic-halehame-ti-et", "ethiopic-halehame-tig",
	    "ethiopic-numeric", "ew-resize", "exclusion", "expanded", "extends", "extra-condensed",
	    "extra-expanded", "fantasy", "fast", "fill", "fixed", "flat", "flex", "flex-end", "flex-start", "footnotes",
	    "forwards", "from", "geometricPrecision", "georgian", "graytext", "grid", "groove",
	    "gujarati", "gurmukhi", "hand", "hangul", "hangul-consonant", "hard-light", "hebrew",
	    "help", "hidden", "hide", "higher", "highlight", "highlighttext",
	    "hiragana", "hiragana-iroha", "horizontal", "hsl", "hsla", "hue", "icon", "ignore",
	    "inactiveborder", "inactivecaption", "inactivecaptiontext", "infinite",
	    "infobackground", "infotext", "inherit", "initial", "inline", "inline-axis",
	    "inline-block", "inline-flex", "inline-grid", "inline-table", "inset", "inside", "intrinsic", "invert",
	    "italic", "japanese-formal", "japanese-informal", "justify", "kannada",
	    "katakana", "katakana-iroha", "keep-all", "khmer",
	    "korean-hangul-formal", "korean-hanja-formal", "korean-hanja-informal",
	    "landscape", "lao", "large", "larger", "left", "level", "lighter", "lighten",
	    "line-through", "linear", "linear-gradient", "lines", "list-item", "listbox", "listitem",
	    "local", "logical", "loud", "lower", "lower-alpha", "lower-armenian",
	    "lower-greek", "lower-hexadecimal", "lower-latin", "lower-norwegian",
	    "lower-roman", "lowercase", "ltr", "luminosity", "malayalam", "match", "matrix", "matrix3d",
	    "media-controls-background", "media-current-time-display",
	    "media-fullscreen-button", "media-mute-button", "media-play-button",
	    "media-return-to-realtime-button", "media-rewind-button",
	    "media-seek-back-button", "media-seek-forward-button", "media-slider",
	    "media-sliderthumb", "media-time-remaining-display", "media-volume-slider",
	    "media-volume-slider-container", "media-volume-sliderthumb", "medium",
	    "menu", "menulist", "menulist-button", "menulist-text",
	    "menulist-textfield", "menutext", "message-box", "middle", "min-intrinsic",
	    "mix", "mongolian", "monospace", "move", "multiple", "multiply", "myanmar", "n-resize",
	    "narrower", "ne-resize", "nesw-resize", "no-close-quote", "no-drop",
	    "no-open-quote", "no-repeat", "none", "normal", "not-allowed", "nowrap",
	    "ns-resize", "numbers", "numeric", "nw-resize", "nwse-resize", "oblique", "octal", "opacity", "open-quote",
	    "optimizeLegibility", "optimizeSpeed", "oriya", "oromo", "outset",
	    "outside", "outside-shape", "overlay", "overline", "padding", "padding-box",
	    "painted", "page", "paused", "persian", "perspective", "plus-darker", "plus-lighter",
	    "pointer", "polygon", "portrait", "pre", "pre-line", "pre-wrap", "preserve-3d",
	    "progress", "push-button", "radial-gradient", "radio", "read-only",
	    "read-write", "read-write-plaintext-only", "rectangle", "region",
	    "relative", "repeat", "repeating-linear-gradient",
	    "repeating-radial-gradient", "repeat-x", "repeat-y", "reset", "reverse",
	    "rgb", "rgba", "ridge", "right", "rotate", "rotate3d", "rotateX", "rotateY",
	    "rotateZ", "round", "row", "row-resize", "row-reverse", "rtl", "run-in", "running",
	    "s-resize", "sans-serif", "saturation", "scale", "scale3d", "scaleX", "scaleY", "scaleZ", "screen",
	    "scroll", "scrollbar", "scroll-position", "se-resize", "searchfield",
	    "searchfield-cancel-button", "searchfield-decoration",
	    "searchfield-results-button", "searchfield-results-decoration", "self-start", "self-end",
	    "semi-condensed", "semi-expanded", "separate", "serif", "show", "sidama",
	    "simp-chinese-formal", "simp-chinese-informal", "single",
	    "skew", "skewX", "skewY", "skip-white-space", "slide", "slider-horizontal",
	    "slider-vertical", "sliderthumb-horizontal", "sliderthumb-vertical", "slow",
	    "small", "small-caps", "small-caption", "smaller", "soft-light", "solid", "somali",
	    "source-atop", "source-in", "source-out", "source-over", "space", "space-around", "space-between", "space-evenly", "spell-out", "square",
	    "square-button", "start", "static", "status-bar", "stretch", "stroke", "sub",
	    "subpixel-antialiased", "super", "sw-resize", "symbolic", "symbols", "system-ui", "table",
	    "table-caption", "table-cell", "table-column", "table-column-group",
	    "table-footer-group", "table-header-group", "table-row", "table-row-group",
	    "tamil",
	    "telugu", "text", "text-bottom", "text-top", "textarea", "textfield", "thai",
	    "thick", "thin", "threeddarkshadow", "threedface", "threedhighlight",
	    "threedlightshadow", "threedshadow", "tibetan", "tigre", "tigrinya-er",
	    "tigrinya-er-abegede", "tigrinya-et", "tigrinya-et-abegede", "to", "top",
	    "trad-chinese-formal", "trad-chinese-informal", "transform",
	    "translate", "translate3d", "translateX", "translateY", "translateZ",
	    "transparent", "ultra-condensed", "ultra-expanded", "underline", "unset", "up",
	    "upper-alpha", "upper-armenian", "upper-greek", "upper-hexadecimal",
	    "upper-latin", "upper-norwegian", "upper-roman", "uppercase", "urdu", "url",
	    "var", "vertical", "vertical-text", "visible", "visibleFill", "visiblePainted",
	    "visibleStroke", "visual", "w-resize", "wait", "wave", "wider",
	    "window", "windowframe", "windowtext", "words", "wrap", "wrap-reverse", "x-large", "x-small", "xor",
	    "xx-large", "xx-small"
	  ], valueKeywords = keySet(valueKeywords_);

	  var allWords = documentTypes_.concat(mediaTypes_).concat(mediaFeatures_).concat(mediaValueKeywords_)
	    .concat(propertyKeywords_).concat(nonStandardPropertyKeywords_).concat(colorKeywords_)
	    .concat(valueKeywords_);
	  CodeMirror.registerHelper("hintWords", "css", allWords);

	  function tokenCComment(stream, state) {
	    var maybeEnd = false, ch;
	    while ((ch = stream.next()) != null) {
	      if (maybeEnd && ch == "/") {
	        state.tokenize = null;
	        break;
	      }
	      maybeEnd = (ch == "*");
	    }
	    return ["comment", "comment"];
	  }

	  CodeMirror.defineMIME("text/css", {
	    documentTypes: documentTypes,
	    mediaTypes: mediaTypes,
	    mediaFeatures: mediaFeatures,
	    mediaValueKeywords: mediaValueKeywords,
	    propertyKeywords: propertyKeywords,
	    nonStandardPropertyKeywords: nonStandardPropertyKeywords,
	    fontProperties: fontProperties,
	    counterDescriptors: counterDescriptors,
	    colorKeywords: colorKeywords,
	    valueKeywords: valueKeywords,
	    tokenHooks: {
	      "/": function(stream, state) {
	        if (!stream.eat("*")) { return false; }
	        state.tokenize = tokenCComment;
	        return tokenCComment(stream, state);
	      }
	    },
	    name: "css"
	  });

	  CodeMirror.defineMIME("text/x-scss", {
	    mediaTypes: mediaTypes,
	    mediaFeatures: mediaFeatures,
	    mediaValueKeywords: mediaValueKeywords,
	    propertyKeywords: propertyKeywords,
	    nonStandardPropertyKeywords: nonStandardPropertyKeywords,
	    colorKeywords: colorKeywords,
	    valueKeywords: valueKeywords,
	    fontProperties: fontProperties,
	    allowNested: true,
	    lineComment: "//",
	    tokenHooks: {
	      "/": function(stream, state) {
	        if (stream.eat("/")) {
	          stream.skipToEnd();
	          return ["comment", "comment"];
	        } else if (stream.eat("*")) {
	          state.tokenize = tokenCComment;
	          return tokenCComment(stream, state);
	        } else {
	          return ["operator", "operator"];
	        }
	      },
	      ":": function(stream) {
	        if (stream.match(/\s*\{/, false))
	          { return [null, null] }
	        return false;
	      },
	      "$": function(stream) {
	        stream.match(/^[\w-]+/);
	        if (stream.match(/^\s*:/, false))
	          { return ["variable-2", "variable-definition"]; }
	        return ["variable-2", "variable"];
	      },
	      "#": function(stream) {
	        if (!stream.eat("{")) { return false; }
	        return [null, "interpolation"];
	      }
	    },
	    name: "css",
	    helperType: "scss"
	  });

	  CodeMirror.defineMIME("text/x-less", {
	    mediaTypes: mediaTypes,
	    mediaFeatures: mediaFeatures,
	    mediaValueKeywords: mediaValueKeywords,
	    propertyKeywords: propertyKeywords,
	    nonStandardPropertyKeywords: nonStandardPropertyKeywords,
	    colorKeywords: colorKeywords,
	    valueKeywords: valueKeywords,
	    fontProperties: fontProperties,
	    allowNested: true,
	    lineComment: "//",
	    tokenHooks: {
	      "/": function(stream, state) {
	        if (stream.eat("/")) {
	          stream.skipToEnd();
	          return ["comment", "comment"];
	        } else if (stream.eat("*")) {
	          state.tokenize = tokenCComment;
	          return tokenCComment(stream, state);
	        } else {
	          return ["operator", "operator"];
	        }
	      },
	      "@": function(stream) {
	        if (stream.eat("{")) { return [null, "interpolation"]; }
	        if (stream.match(/^(charset|document|font-face|import|(-(moz|ms|o|webkit)-)?keyframes|media|namespace|page|supports)\b/i, false)) { return false; }
	        stream.eatWhile(/[\w\\\-]/);
	        if (stream.match(/^\s*:/, false))
	          { return ["variable-2", "variable-definition"]; }
	        return ["variable-2", "variable"];
	      },
	      "&": function() {
	        return ["atom", "atom"];
	      }
	    },
	    name: "css",
	    helperType: "less"
	  });

	  CodeMirror.defineMIME("text/x-gss", {
	    documentTypes: documentTypes,
	    mediaTypes: mediaTypes,
	    mediaFeatures: mediaFeatures,
	    propertyKeywords: propertyKeywords,
	    nonStandardPropertyKeywords: nonStandardPropertyKeywords,
	    fontProperties: fontProperties,
	    counterDescriptors: counterDescriptors,
	    colorKeywords: colorKeywords,
	    valueKeywords: valueKeywords,
	    supportsAtComponent: true,
	    tokenHooks: {
	      "/": function(stream, state) {
	        if (!stream.eat("*")) { return false; }
	        state.tokenize = tokenCComment;
	        return tokenCComment(stream, state);
	      }
	    },
	    name: "css",
	    helperType: "gss"
	  });

	});
	});

	var sass = createCommonjsModule(function (module, exports) {
	// CodeMirror, copyright (c) by Marijn Haverbeke and others
	// Distributed under an MIT license: https://codemirror.net/LICENSE

	(function(mod) {
	  { mod(codemirror, css$2); }
	})(function(CodeMirror) {

	CodeMirror.defineMode("sass", function(config) {
	  var cssMode = CodeMirror.mimeModes["text/css"];
	  var propertyKeywords = cssMode.propertyKeywords || {},
	      colorKeywords = cssMode.colorKeywords || {},
	      valueKeywords = cssMode.valueKeywords || {},
	      fontProperties = cssMode.fontProperties || {};

	  function tokenRegexp(words) {
	    return new RegExp("^" + words.join("|"));
	  }

	  var keywords = ["true", "false", "null", "auto"];
	  var keywordsRegexp = new RegExp("^" + keywords.join("|"));

	  var operators = ["\\(", "\\)", "=", ">", "<", "==", ">=", "<=", "\\+", "-",
	                   "\\!=", "/", "\\*", "%", "and", "or", "not", ";","\\{","\\}",":"];
	  var opRegexp = tokenRegexp(operators);

	  var pseudoElementsRegexp = /^::?[a-zA-Z_][\w\-]*/;

	  var word;

	  function isEndLine(stream) {
	    return !stream.peek() || stream.match(/\s+$/, false);
	  }

	  function urlTokens(stream, state) {
	    var ch = stream.peek();

	    if (ch === ")") {
	      stream.next();
	      state.tokenizer = tokenBase;
	      return "operator";
	    } else if (ch === "(") {
	      stream.next();
	      stream.eatSpace();

	      return "operator";
	    } else if (ch === "'" || ch === '"') {
	      state.tokenizer = buildStringTokenizer(stream.next());
	      return "string";
	    } else {
	      state.tokenizer = buildStringTokenizer(")", false);
	      return "string";
	    }
	  }
	  function comment(indentation, multiLine) {
	    return function(stream, state) {
	      if (stream.sol() && stream.indentation() <= indentation) {
	        state.tokenizer = tokenBase;
	        return tokenBase(stream, state);
	      }

	      if (multiLine && stream.skipTo("*/")) {
	        stream.next();
	        stream.next();
	        state.tokenizer = tokenBase;
	      } else {
	        stream.skipToEnd();
	      }

	      return "comment";
	    };
	  }

	  function buildStringTokenizer(quote, greedy) {
	    if (greedy == null) { greedy = true; }

	    function stringTokenizer(stream, state) {
	      var nextChar = stream.next();
	      var peekChar = stream.peek();
	      var previousChar = stream.string.charAt(stream.pos-2);

	      var endingString = ((nextChar !== "\\" && peekChar === quote) || (nextChar === quote && previousChar !== "\\"));

	      if (endingString) {
	        if (nextChar !== quote && greedy) { stream.next(); }
	        if (isEndLine(stream)) {
	          state.cursorHalf = 0;
	        }
	        state.tokenizer = tokenBase;
	        return "string";
	      } else if (nextChar === "#" && peekChar === "{") {
	        state.tokenizer = buildInterpolationTokenizer(stringTokenizer);
	        stream.next();
	        return "operator";
	      } else {
	        return "string";
	      }
	    }

	    return stringTokenizer;
	  }

	  function buildInterpolationTokenizer(currentTokenizer) {
	    return function(stream, state) {
	      if (stream.peek() === "}") {
	        stream.next();
	        state.tokenizer = currentTokenizer;
	        return "operator";
	      } else {
	        return tokenBase(stream, state);
	      }
	    };
	  }

	  function indent(state) {
	    if (state.indentCount == 0) {
	      state.indentCount++;
	      var lastScopeOffset = state.scopes[0].offset;
	      var currentOffset = lastScopeOffset + config.indentUnit;
	      state.scopes.unshift({ offset:currentOffset });
	    }
	  }

	  function dedent(state) {
	    if (state.scopes.length == 1) { return; }

	    state.scopes.shift();
	  }

	  function tokenBase(stream, state) {
	    var ch = stream.peek();

	    // Comment
	    if (stream.match("/*")) {
	      state.tokenizer = comment(stream.indentation(), true);
	      return state.tokenizer(stream, state);
	    }
	    if (stream.match("//")) {
	      state.tokenizer = comment(stream.indentation(), false);
	      return state.tokenizer(stream, state);
	    }

	    // Interpolation
	    if (stream.match("#{")) {
	      state.tokenizer = buildInterpolationTokenizer(tokenBase);
	      return "operator";
	    }

	    // Strings
	    if (ch === '"' || ch === "'") {
	      stream.next();
	      state.tokenizer = buildStringTokenizer(ch);
	      return "string";
	    }

	    if(!state.cursorHalf){// state.cursorHalf === 0
	    // first half i.e. before : for key-value pairs
	    // including selectors

	      if (ch === "-") {
	        if (stream.match(/^-\w+-/)) {
	          return "meta";
	        }
	      }

	      if (ch === ".") {
	        stream.next();
	        if (stream.match(/^[\w-]+/)) {
	          indent(state);
	          return "qualifier";
	        } else if (stream.peek() === "#") {
	          indent(state);
	          return "tag";
	        }
	      }

	      if (ch === "#") {
	        stream.next();
	        // ID selectors
	        if (stream.match(/^[\w-]+/)) {
	          indent(state);
	          return "builtin";
	        }
	        if (stream.peek() === "#") {
	          indent(state);
	          return "tag";
	        }
	      }

	      // Variables
	      if (ch === "$") {
	        stream.next();
	        stream.eatWhile(/[\w-]/);
	        return "variable-2";
	      }

	      // Numbers
	      if (stream.match(/^-?[0-9\.]+/))
	        { return "number"; }

	      // Units
	      if (stream.match(/^(px|em|in)\b/))
	        { return "unit"; }

	      if (stream.match(keywordsRegexp))
	        { return "keyword"; }

	      if (stream.match(/^url/) && stream.peek() === "(") {
	        state.tokenizer = urlTokens;
	        return "atom";
	      }

	      if (ch === "=") {
	        // Match shortcut mixin definition
	        if (stream.match(/^=[\w-]+/)) {
	          indent(state);
	          return "meta";
	        }
	      }

	      if (ch === "+") {
	        // Match shortcut mixin definition
	        if (stream.match(/^\+[\w-]+/)){
	          return "variable-3";
	        }
	      }

	      if(ch === "@"){
	        if(stream.match(/@extend/)){
	          if(!stream.match(/\s*[\w]/))
	            { dedent(state); }
	        }
	      }


	      // Indent Directives
	      if (stream.match(/^@(else if|if|media|else|for|each|while|mixin|function)/)) {
	        indent(state);
	        return "def";
	      }

	      // Other Directives
	      if (ch === "@") {
	        stream.next();
	        stream.eatWhile(/[\w-]/);
	        return "def";
	      }

	      if (stream.eatWhile(/[\w-]/)){
	        if(stream.match(/ *: *[\w-\+\$#!\("']/,false)){
	          word = stream.current().toLowerCase();
	          var prop = state.prevProp + "-" + word;
	          if (propertyKeywords.hasOwnProperty(prop)) {
	            return "property";
	          } else if (propertyKeywords.hasOwnProperty(word)) {
	            state.prevProp = word;
	            return "property";
	          } else if (fontProperties.hasOwnProperty(word)) {
	            return "property";
	          }
	          return "tag";
	        }
	        else if(stream.match(/ *:/,false)){
	          indent(state);
	          state.cursorHalf = 1;
	          state.prevProp = stream.current().toLowerCase();
	          return "property";
	        }
	        else if(stream.match(/ *,/,false)){
	          return "tag";
	        }
	        else{
	          indent(state);
	          return "tag";
	        }
	      }

	      if(ch === ":"){
	        if (stream.match(pseudoElementsRegexp)){ // could be a pseudo-element
	          return "variable-3";
	        }
	        stream.next();
	        state.cursorHalf=1;
	        return "operator";
	      }

	    } // cursorHalf===0 ends here
	    else{

	      if (ch === "#") {
	        stream.next();
	        // Hex numbers
	        if (stream.match(/[0-9a-fA-F]{6}|[0-9a-fA-F]{3}/)){
	          if (isEndLine(stream)) {
	            state.cursorHalf = 0;
	          }
	          return "number";
	        }
	      }

	      // Numbers
	      if (stream.match(/^-?[0-9\.]+/)){
	        if (isEndLine(stream)) {
	          state.cursorHalf = 0;
	        }
	        return "number";
	      }

	      // Units
	      if (stream.match(/^(px|em|in)\b/)){
	        if (isEndLine(stream)) {
	          state.cursorHalf = 0;
	        }
	        return "unit";
	      }

	      if (stream.match(keywordsRegexp)){
	        if (isEndLine(stream)) {
	          state.cursorHalf = 0;
	        }
	        return "keyword";
	      }

	      if (stream.match(/^url/) && stream.peek() === "(") {
	        state.tokenizer = urlTokens;
	        if (isEndLine(stream)) {
	          state.cursorHalf = 0;
	        }
	        return "atom";
	      }

	      // Variables
	      if (ch === "$") {
	        stream.next();
	        stream.eatWhile(/[\w-]/);
	        if (isEndLine(stream)) {
	          state.cursorHalf = 0;
	        }
	        return "variable-2";
	      }

	      // bang character for !important, !default, etc.
	      if (ch === "!") {
	        stream.next();
	        state.cursorHalf = 0;
	        return stream.match(/^[\w]+/) ? "keyword": "operator";
	      }

	      if (stream.match(opRegexp)){
	        if (isEndLine(stream)) {
	          state.cursorHalf = 0;
	        }
	        return "operator";
	      }

	      // attributes
	      if (stream.eatWhile(/[\w-]/)) {
	        if (isEndLine(stream)) {
	          state.cursorHalf = 0;
	        }
	        word = stream.current().toLowerCase();
	        if (valueKeywords.hasOwnProperty(word)) {
	          return "atom";
	        } else if (colorKeywords.hasOwnProperty(word)) {
	          return "keyword";
	        } else if (propertyKeywords.hasOwnProperty(word)) {
	          state.prevProp = stream.current().toLowerCase();
	          return "property";
	        } else {
	          return "tag";
	        }
	      }

	      //stream.eatSpace();
	      if (isEndLine(stream)) {
	        state.cursorHalf = 0;
	        return null;
	      }

	    } // else ends here

	    if (stream.match(opRegexp))
	      { return "operator"; }

	    // If we haven't returned by now, we move 1 character
	    // and return an error
	    stream.next();
	    return null;
	  }

	  function tokenLexer(stream, state) {
	    if (stream.sol()) { state.indentCount = 0; }
	    var style = state.tokenizer(stream, state);
	    var current = stream.current();

	    if (current === "@return" || current === "}"){
	      dedent(state);
	    }

	    if (style !== null) {
	      var startOfToken = stream.pos - current.length;

	      var withCurrentIndent = startOfToken + (config.indentUnit * state.indentCount);

	      var newScopes = [];

	      for (var i = 0; i < state.scopes.length; i++) {
	        var scope = state.scopes[i];

	        if (scope.offset <= withCurrentIndent)
	          { newScopes.push(scope); }
	      }

	      state.scopes = newScopes;
	    }


	    return style;
	  }

	  return {
	    startState: function() {
	      return {
	        tokenizer: tokenBase,
	        scopes: [{offset: 0, type: "sass"}],
	        indentCount: 0,
	        cursorHalf: 0,  // cursor half tells us if cursor lies after (1)
	                        // or before (0) colon (well... more or less)
	        definedVars: [],
	        definedMixins: []
	      };
	    },
	    token: function(stream, state) {
	      var style = tokenLexer(stream, state);

	      state.lastToken = { style: style, content: stream.current() };

	      return style;
	    },

	    indent: function(state) {
	      return state.scopes[0].offset;
	    }
	  };
	}, "css");

	CodeMirror.defineMIME("text/x-sass", "sass");

	});
	});

	var stylus = createCommonjsModule(function (module, exports) {
	// CodeMirror, copyright (c) by Marijn Haverbeke and others
	// Distributed under an MIT license: https://codemirror.net/LICENSE

	// Stylus mode created by Dmitry Kiselyov http://git.io/AaRB

	(function(mod) {
	  { mod(codemirror); }
	})(function(CodeMirror) {

	  CodeMirror.defineMode("stylus", function(config) {
	    var indentUnit = config.indentUnit,
	        indentUnitString = '',
	        tagKeywords = keySet(tagKeywords_),
	        tagVariablesRegexp = /^(a|b|i|s|col|em)$/i,
	        propertyKeywords = keySet(propertyKeywords_),
	        nonStandardPropertyKeywords = keySet(nonStandardPropertyKeywords_),
	        valueKeywords = keySet(valueKeywords_),
	        colorKeywords = keySet(colorKeywords_),
	        documentTypes = keySet(documentTypes_),
	        documentTypesRegexp = wordRegexp(documentTypes_),
	        mediaFeatures = keySet(mediaFeatures_),
	        mediaTypes = keySet(mediaTypes_),
	        fontProperties = keySet(fontProperties_),
	        operatorsRegexp = /^\s*([.]{2,3}|&&|\|\||\*\*|[?!=:]?=|[-+*\/%<>]=?|\?:|\~)/,
	        wordOperatorKeywordsRegexp = wordRegexp(wordOperatorKeywords_),
	        blockKeywords = keySet(blockKeywords_),
	        vendorPrefixesRegexp = new RegExp(/^\-(moz|ms|o|webkit)-/i),
	        commonAtoms = keySet(commonAtoms_),
	        firstWordMatch = "",
	        states = {},
	        ch,
	        style,
	        type,
	        override;

	    while (indentUnitString.length < indentUnit) { indentUnitString += ' '; }

	    /**
	     * Tokenizers
	     */
	    function tokenBase(stream, state) {
	      firstWordMatch = stream.string.match(/(^[\w-]+\s*=\s*$)|(^\s*[\w-]+\s*=\s*[\w-])|(^\s*(\.|#|@|\$|\&|\[|\d|\+|::?|\{|\>|~|\/)?\s*[\w-]*([a-z0-9-]|\*|\/\*)(\(|,)?)/);
	      state.context.line.firstWord = firstWordMatch ? firstWordMatch[0].replace(/^\s*/, "") : "";
	      state.context.line.indent = stream.indentation();
	      ch = stream.peek();

	      // Line comment
	      if (stream.match("//")) {
	        stream.skipToEnd();
	        return ["comment", "comment"];
	      }
	      // Block comment
	      if (stream.match("/*")) {
	        state.tokenize = tokenCComment;
	        return tokenCComment(stream, state);
	      }
	      // String
	      if (ch == "\"" || ch == "'") {
	        stream.next();
	        state.tokenize = tokenString(ch);
	        return state.tokenize(stream, state);
	      }
	      // Def
	      if (ch == "@") {
	        stream.next();
	        stream.eatWhile(/[\w\\-]/);
	        return ["def", stream.current()];
	      }
	      // ID selector or Hex color
	      if (ch == "#") {
	        stream.next();
	        // Hex color
	        if (stream.match(/^[0-9a-f]{3}([0-9a-f]([0-9a-f]{2}){0,2})?\b/i)) {
	          return ["atom", "atom"];
	        }
	        // ID selector
	        if (stream.match(/^[a-z][\w-]*/i)) {
	          return ["builtin", "hash"];
	        }
	      }
	      // Vendor prefixes
	      if (stream.match(vendorPrefixesRegexp)) {
	        return ["meta", "vendor-prefixes"];
	      }
	      // Numbers
	      if (stream.match(/^-?[0-9]?\.?[0-9]/)) {
	        stream.eatWhile(/[a-z%]/i);
	        return ["number", "unit"];
	      }
	      // !important|optional
	      if (ch == "!") {
	        stream.next();
	        return [stream.match(/^(important|optional)/i) ? "keyword": "operator", "important"];
	      }
	      // Class
	      if (ch == "." && stream.match(/^\.[a-z][\w-]*/i)) {
	        return ["qualifier", "qualifier"];
	      }
	      // url url-prefix domain regexp
	      if (stream.match(documentTypesRegexp)) {
	        if (stream.peek() == "(") { state.tokenize = tokenParenthesized; }
	        return ["property", "word"];
	      }
	      // Mixins / Functions
	      if (stream.match(/^[a-z][\w-]*\(/i)) {
	        stream.backUp(1);
	        return ["keyword", "mixin"];
	      }
	      // Block mixins
	      if (stream.match(/^(\+|-)[a-z][\w-]*\(/i)) {
	        stream.backUp(1);
	        return ["keyword", "block-mixin"];
	      }
	      // Parent Reference BEM naming
	      if (stream.string.match(/^\s*&/) && stream.match(/^[-_]+[a-z][\w-]*/)) {
	        return ["qualifier", "qualifier"];
	      }
	      // / Root Reference & Parent Reference
	      if (stream.match(/^(\/|&)(-|_|:|\.|#|[a-z])/)) {
	        stream.backUp(1);
	        return ["variable-3", "reference"];
	      }
	      if (stream.match(/^&{1}\s*$/)) {
	        return ["variable-3", "reference"];
	      }
	      // Word operator
	      if (stream.match(wordOperatorKeywordsRegexp)) {
	        return ["operator", "operator"];
	      }
	      // Word
	      if (stream.match(/^\$?[-_]*[a-z0-9]+[\w-]*/i)) {
	        // Variable
	        if (stream.match(/^(\.|\[)[\w-\'\"\]]+/i, false)) {
	          if (!wordIsTag(stream.current())) {
	            stream.match(/\./);
	            return ["variable-2", "variable-name"];
	          }
	        }
	        return ["variable-2", "word"];
	      }
	      // Operators
	      if (stream.match(operatorsRegexp)) {
	        return ["operator", stream.current()];
	      }
	      // Delimiters
	      if (/[:;,{}\[\]\(\)]/.test(ch)) {
	        stream.next();
	        return [null, ch];
	      }
	      // Non-detected items
	      stream.next();
	      return [null, null];
	    }

	    /**
	     * Token comment
	     */
	    function tokenCComment(stream, state) {
	      var maybeEnd = false, ch;
	      while ((ch = stream.next()) != null) {
	        if (maybeEnd && ch == "/") {
	          state.tokenize = null;
	          break;
	        }
	        maybeEnd = (ch == "*");
	      }
	      return ["comment", "comment"];
	    }

	    /**
	     * Token string
	     */
	    function tokenString(quote) {
	      return function(stream, state) {
	        var escaped = false, ch;
	        while ((ch = stream.next()) != null) {
	          if (ch == quote && !escaped) {
	            if (quote == ")") { stream.backUp(1); }
	            break;
	          }
	          escaped = !escaped && ch == "\\";
	        }
	        if (ch == quote || !escaped && quote != ")") { state.tokenize = null; }
	        return ["string", "string"];
	      };
	    }

	    /**
	     * Token parenthesized
	     */
	    function tokenParenthesized(stream, state) {
	      stream.next(); // Must be "("
	      if (!stream.match(/\s*[\"\')]/, false))
	        { state.tokenize = tokenString(")"); }
	      else
	        { state.tokenize = null; }
	      return [null, "("];
	    }

	    /**
	     * Context management
	     */
	    function Context(type, indent, prev, line) {
	      this.type = type;
	      this.indent = indent;
	      this.prev = prev;
	      this.line = line || {firstWord: "", indent: 0};
	    }

	    function pushContext(state, stream, type, indent) {
	      indent = indent >= 0 ? indent : indentUnit;
	      state.context = new Context(type, stream.indentation() + indent, state.context);
	      return type;
	    }

	    function popContext(state, currentIndent) {
	      var contextIndent = state.context.indent - indentUnit;
	      currentIndent = currentIndent || false;
	      state.context = state.context.prev;
	      if (currentIndent) { state.context.indent = contextIndent; }
	      return state.context.type;
	    }

	    function pass(type, stream, state) {
	      return states[state.context.type](type, stream, state);
	    }

	    function popAndPass(type, stream, state, n) {
	      for (var i = n || 1; i > 0; i--)
	        { state.context = state.context.prev; }
	      return pass(type, stream, state);
	    }


	    /**
	     * Parser
	     */
	    function wordIsTag(word) {
	      return word.toLowerCase() in tagKeywords;
	    }

	    function wordIsProperty(word) {
	      word = word.toLowerCase();
	      return word in propertyKeywords || word in fontProperties;
	    }

	    function wordIsBlock(word) {
	      return word.toLowerCase() in blockKeywords;
	    }

	    function wordIsVendorPrefix(word) {
	      return word.toLowerCase().match(vendorPrefixesRegexp);
	    }

	    function wordAsValue(word) {
	      var wordLC = word.toLowerCase();
	      var override = "variable-2";
	      if (wordIsTag(word)) { override = "tag"; }
	      else if (wordIsBlock(word)) { override = "block-keyword"; }
	      else if (wordIsProperty(word)) { override = "property"; }
	      else if (wordLC in valueKeywords || wordLC in commonAtoms) { override = "atom"; }
	      else if (wordLC == "return" || wordLC in colorKeywords) { override = "keyword"; }

	      // Font family
	      else if (word.match(/^[A-Z]/)) { override = "string"; }
	      return override;
	    }

	    function typeIsBlock(type, stream) {
	      return ((endOfLine(stream) && (type == "{" || type == "]" || type == "hash" || type == "qualifier")) || type == "block-mixin");
	    }

	    function typeIsInterpolation(type, stream) {
	      return type == "{" && stream.match(/^\s*\$?[\w-]+/i, false);
	    }

	    function typeIsPseudo(type, stream) {
	      return type == ":" && stream.match(/^[a-z-]+/, false);
	    }

	    function startOfLine(stream) {
	      return stream.sol() || stream.string.match(new RegExp("^\\s*" + escapeRegExp(stream.current())));
	    }

	    function endOfLine(stream) {
	      return stream.eol() || stream.match(/^\s*$/, false);
	    }

	    function firstWordOfLine(line) {
	      var re = /^\s*[-_]*[a-z0-9]+[\w-]*/i;
	      var result = typeof line == "string" ? line.match(re) : line.string.match(re);
	      return result ? result[0].replace(/^\s*/, "") : "";
	    }


	    /**
	     * Block
	     */
	    states.block = function(type, stream, state) {
	      if ((type == "comment" && startOfLine(stream)) ||
	          (type == "," && endOfLine(stream)) ||
	          type == "mixin") {
	        return pushContext(state, stream, "block", 0);
	      }
	      if (typeIsInterpolation(type, stream)) {
	        return pushContext(state, stream, "interpolation");
	      }
	      if (endOfLine(stream) && type == "]") {
	        if (!/^\s*(\.|#|:|\[|\*|&)/.test(stream.string) && !wordIsTag(firstWordOfLine(stream))) {
	          return pushContext(state, stream, "block", 0);
	        }
	      }
	      if (typeIsBlock(type, stream)) {
	        return pushContext(state, stream, "block");
	      }
	      if (type == "}" && endOfLine(stream)) {
	        return pushContext(state, stream, "block", 0);
	      }
	      if (type == "variable-name") {
	        if (stream.string.match(/^\s?\$[\w-\.\[\]\'\"]+$/) || wordIsBlock(firstWordOfLine(stream))) {
	          return pushContext(state, stream, "variableName");
	        }
	        else {
	          return pushContext(state, stream, "variableName", 0);
	        }
	      }
	      if (type == "=") {
	        if (!endOfLine(stream) && !wordIsBlock(firstWordOfLine(stream))) {
	          return pushContext(state, stream, "block", 0);
	        }
	        return pushContext(state, stream, "block");
	      }
	      if (type == "*") {
	        if (endOfLine(stream) || stream.match(/\s*(,|\.|#|\[|:|{)/,false)) {
	          override = "tag";
	          return pushContext(state, stream, "block");
	        }
	      }
	      if (typeIsPseudo(type, stream)) {
	        return pushContext(state, stream, "pseudo");
	      }
	      if (/@(font-face|media|supports|(-moz-)?document)/.test(type)) {
	        return pushContext(state, stream, endOfLine(stream) ? "block" : "atBlock");
	      }
	      if (/@(-(moz|ms|o|webkit)-)?keyframes$/.test(type)) {
	        return pushContext(state, stream, "keyframes");
	      }
	      if (/@extends?/.test(type)) {
	        return pushContext(state, stream, "extend", 0);
	      }
	      if (type && type.charAt(0) == "@") {

	        // Property Lookup
	        if (stream.indentation() > 0 && wordIsProperty(stream.current().slice(1))) {
	          override = "variable-2";
	          return "block";
	        }
	        if (/(@import|@require|@charset)/.test(type)) {
	          return pushContext(state, stream, "block", 0);
	        }
	        return pushContext(state, stream, "block");
	      }
	      if (type == "reference" && endOfLine(stream)) {
	        return pushContext(state, stream, "block");
	      }
	      if (type == "(") {
	        return pushContext(state, stream, "parens");
	      }

	      if (type == "vendor-prefixes") {
	        return pushContext(state, stream, "vendorPrefixes");
	      }
	      if (type == "word") {
	        var word = stream.current();
	        override = wordAsValue(word);

	        if (override == "property") {
	          if (startOfLine(stream)) {
	            return pushContext(state, stream, "block", 0);
	          } else {
	            override = "atom";
	            return "block";
	          }
	        }

	        if (override == "tag") {

	          // tag is a css value
	          if (/embed|menu|pre|progress|sub|table/.test(word)) {
	            if (wordIsProperty(firstWordOfLine(stream))) {
	              override = "atom";
	              return "block";
	            }
	          }

	          // tag is an attribute
	          if (stream.string.match(new RegExp("\\[\\s*" + word + "|" + word +"\\s*\\]"))) {
	            override = "atom";
	            return "block";
	          }

	          // tag is a variable
	          if (tagVariablesRegexp.test(word)) {
	            if ((startOfLine(stream) && stream.string.match(/=/)) ||
	                (!startOfLine(stream) &&
	                 !stream.string.match(/^(\s*\.|#|\&|\[|\/|>|\*)/) &&
	                 !wordIsTag(firstWordOfLine(stream)))) {
	              override = "variable-2";
	              if (wordIsBlock(firstWordOfLine(stream)))  { return "block"; }
	              return pushContext(state, stream, "block", 0);
	            }
	          }

	          if (endOfLine(stream)) { return pushContext(state, stream, "block"); }
	        }
	        if (override == "block-keyword") {
	          override = "keyword";

	          // Postfix conditionals
	          if (stream.current(/(if|unless)/) && !startOfLine(stream)) {
	            return "block";
	          }
	          return pushContext(state, stream, "block");
	        }
	        if (word == "return") { return pushContext(state, stream, "block", 0); }

	        // Placeholder selector
	        if (override == "variable-2" && stream.string.match(/^\s?\$[\w-\.\[\]\'\"]+$/)) {
	          return pushContext(state, stream, "block");
	        }
	      }
	      return state.context.type;
	    };


	    /**
	     * Parens
	     */
	    states.parens = function(type, stream, state) {
	      if (type == "(") { return pushContext(state, stream, "parens"); }
	      if (type == ")") {
	        if (state.context.prev.type == "parens") {
	          return popContext(state);
	        }
	        if ((stream.string.match(/^[a-z][\w-]*\(/i) && endOfLine(stream)) ||
	            wordIsBlock(firstWordOfLine(stream)) ||
	            /(\.|#|:|\[|\*|&|>|~|\+|\/)/.test(firstWordOfLine(stream)) ||
	            (!stream.string.match(/^-?[a-z][\w-\.\[\]\'\"]*\s*=/) &&
	             wordIsTag(firstWordOfLine(stream)))) {
	          return pushContext(state, stream, "block");
	        }
	        if (stream.string.match(/^[\$-]?[a-z][\w-\.\[\]\'\"]*\s*=/) ||
	            stream.string.match(/^\s*(\(|\)|[0-9])/) ||
	            stream.string.match(/^\s+[a-z][\w-]*\(/i) ||
	            stream.string.match(/^\s+[\$-]?[a-z]/i)) {
	          return pushContext(state, stream, "block", 0);
	        }
	        if (endOfLine(stream)) { return pushContext(state, stream, "block"); }
	        else { return pushContext(state, stream, "block", 0); }
	      }
	      if (type && type.charAt(0) == "@" && wordIsProperty(stream.current().slice(1))) {
	        override = "variable-2";
	      }
	      if (type == "word") {
	        var word = stream.current();
	        override = wordAsValue(word);
	        if (override == "tag" && tagVariablesRegexp.test(word)) {
	          override = "variable-2";
	        }
	        if (override == "property" || word == "to") { override = "atom"; }
	      }
	      if (type == "variable-name") {
	        return pushContext(state, stream, "variableName");
	      }
	      if (typeIsPseudo(type, stream)) {
	        return pushContext(state, stream, "pseudo");
	      }
	      return state.context.type;
	    };


	    /**
	     * Vendor prefixes
	     */
	    states.vendorPrefixes = function(type, stream, state) {
	      if (type == "word") {
	        override = "property";
	        return pushContext(state, stream, "block", 0);
	      }
	      return popContext(state);
	    };


	    /**
	     * Pseudo
	     */
	    states.pseudo = function(type, stream, state) {
	      if (!wordIsProperty(firstWordOfLine(stream.string))) {
	        stream.match(/^[a-z-]+/);
	        override = "variable-3";
	        if (endOfLine(stream)) { return pushContext(state, stream, "block"); }
	        return popContext(state);
	      }
	      return popAndPass(type, stream, state);
	    };


	    /**
	     * atBlock
	     */
	    states.atBlock = function(type, stream, state) {
	      if (type == "(") { return pushContext(state, stream, "atBlock_parens"); }
	      if (typeIsBlock(type, stream)) {
	        return pushContext(state, stream, "block");
	      }
	      if (typeIsInterpolation(type, stream)) {
	        return pushContext(state, stream, "interpolation");
	      }
	      if (type == "word") {
	        var word = stream.current().toLowerCase();
	        if (/^(only|not|and|or)$/.test(word))
	          { override = "keyword"; }
	        else if (documentTypes.hasOwnProperty(word))
	          { override = "tag"; }
	        else if (mediaTypes.hasOwnProperty(word))
	          { override = "attribute"; }
	        else if (mediaFeatures.hasOwnProperty(word))
	          { override = "property"; }
	        else if (nonStandardPropertyKeywords.hasOwnProperty(word))
	          { override = "string-2"; }
	        else { override = wordAsValue(stream.current()); }
	        if (override == "tag" && endOfLine(stream)) {
	          return pushContext(state, stream, "block");
	        }
	      }
	      if (type == "operator" && /^(not|and|or)$/.test(stream.current())) {
	        override = "keyword";
	      }
	      return state.context.type;
	    };

	    states.atBlock_parens = function(type, stream, state) {
	      if (type == "{" || type == "}") { return state.context.type; }
	      if (type == ")") {
	        if (endOfLine(stream)) { return pushContext(state, stream, "block"); }
	        else { return pushContext(state, stream, "atBlock"); }
	      }
	      if (type == "word") {
	        var word = stream.current().toLowerCase();
	        override = wordAsValue(word);
	        if (/^(max|min)/.test(word)) { override = "property"; }
	        if (override == "tag") {
	          tagVariablesRegexp.test(word) ? override = "variable-2" : override = "atom";
	        }
	        return state.context.type;
	      }
	      return states.atBlock(type, stream, state);
	    };


	    /**
	     * Keyframes
	     */
	    states.keyframes = function(type, stream, state) {
	      if (stream.indentation() == "0" && ((type == "}" && startOfLine(stream)) || type == "]" || type == "hash"
	                                          || type == "qualifier" || wordIsTag(stream.current()))) {
	        return popAndPass(type, stream, state);
	      }
	      if (type == "{") { return pushContext(state, stream, "keyframes"); }
	      if (type == "}") {
	        if (startOfLine(stream)) { return popContext(state, true); }
	        else { return pushContext(state, stream, "keyframes"); }
	      }
	      if (type == "unit" && /^[0-9]+\%$/.test(stream.current())) {
	        return pushContext(state, stream, "keyframes");
	      }
	      if (type == "word") {
	        override = wordAsValue(stream.current());
	        if (override == "block-keyword") {
	          override = "keyword";
	          return pushContext(state, stream, "keyframes");
	        }
	      }
	      if (/@(font-face|media|supports|(-moz-)?document)/.test(type)) {
	        return pushContext(state, stream, endOfLine(stream) ? "block" : "atBlock");
	      }
	      if (type == "mixin") {
	        return pushContext(state, stream, "block", 0);
	      }
	      return state.context.type;
	    };


	    /**
	     * Interpolation
	     */
	    states.interpolation = function(type, stream, state) {
	      if (type == "{") { popContext(state) && pushContext(state, stream, "block"); }
	      if (type == "}") {
	        if (stream.string.match(/^\s*(\.|#|:|\[|\*|&|>|~|\+|\/)/i) ||
	            (stream.string.match(/^\s*[a-z]/i) && wordIsTag(firstWordOfLine(stream)))) {
	          return pushContext(state, stream, "block");
	        }
	        if (!stream.string.match(/^(\{|\s*\&)/) ||
	            stream.match(/\s*[\w-]/,false)) {
	          return pushContext(state, stream, "block", 0);
	        }
	        return pushContext(state, stream, "block");
	      }
	      if (type == "variable-name") {
	        return pushContext(state, stream, "variableName", 0);
	      }
	      if (type == "word") {
	        override = wordAsValue(stream.current());
	        if (override == "tag") { override = "atom"; }
	      }
	      return state.context.type;
	    };


	    /**
	     * Extend/s
	     */
	    states.extend = function(type, stream, state) {
	      if (type == "[" || type == "=") { return "extend"; }
	      if (type == "]") { return popContext(state); }
	      if (type == "word") {
	        override = wordAsValue(stream.current());
	        return "extend";
	      }
	      return popContext(state);
	    };


	    /**
	     * Variable name
	     */
	    states.variableName = function(type, stream, state) {
	      if (type == "string" || type == "[" || type == "]" || stream.current().match(/^(\.|\$)/)) {
	        if (stream.current().match(/^\.[\w-]+/i)) { override = "variable-2"; }
	        return "variableName";
	      }
	      return popAndPass(type, stream, state);
	    };


	    return {
	      startState: function(base) {
	        return {
	          tokenize: null,
	          state: "block",
	          context: new Context("block", base || 0, null)
	        };
	      },
	      token: function(stream, state) {
	        if (!state.tokenize && stream.eatSpace()) { return null; }
	        style = (state.tokenize || tokenBase)(stream, state);
	        if (style && typeof style == "object") {
	          type = style[1];
	          style = style[0];
	        }
	        override = style;
	        state.state = states[state.state](type, stream, state);
	        return override;
	      },
	      indent: function(state, textAfter, line) {

	        var cx = state.context,
	            ch = textAfter && textAfter.charAt(0),
	            indent = cx.indent,
	            lineFirstWord = firstWordOfLine(textAfter),
	            lineIndent = line.match(/^\s*/)[0].replace(/\t/g, indentUnitString).length,
	            prevLineFirstWord = state.context.prev ? state.context.prev.line.firstWord : "",
	            prevLineIndent = state.context.prev ? state.context.prev.line.indent : lineIndent;

	        if (cx.prev &&
	            (ch == "}" && (cx.type == "block" || cx.type == "atBlock" || cx.type == "keyframes") ||
	             ch == ")" && (cx.type == "parens" || cx.type == "atBlock_parens") ||
	             ch == "{" && (cx.type == "at"))) {
	          indent = cx.indent - indentUnit;
	        } else if (!(/(\})/.test(ch))) {
	          if (/@|\$|\d/.test(ch) ||
	              /^\{/.test(textAfter) ||
	/^\s*\/(\/|\*)/.test(textAfter) ||
	              /^\s*\/\*/.test(prevLineFirstWord) ||
	              /^\s*[\w-\.\[\]\'\"]+\s*(\?|:|\+)?=/i.test(textAfter) ||
	/^(\+|-)?[a-z][\w-]*\(/i.test(textAfter) ||
	/^return/.test(textAfter) ||
	              wordIsBlock(lineFirstWord)) {
	            indent = lineIndent;
	          } else if (/(\.|#|:|\[|\*|&|>|~|\+|\/)/.test(ch) || wordIsTag(lineFirstWord)) {
	            if (/\,\s*$/.test(prevLineFirstWord)) {
	              indent = prevLineIndent;
	            } else if (/^\s+/.test(line) && (/(\.|#|:|\[|\*|&|>|~|\+|\/)/.test(prevLineFirstWord) || wordIsTag(prevLineFirstWord))) {
	              indent = lineIndent <= prevLineIndent ? prevLineIndent : prevLineIndent + indentUnit;
	            } else {
	              indent = lineIndent;
	            }
	          } else if (!/,\s*$/.test(line) && (wordIsVendorPrefix(lineFirstWord) || wordIsProperty(lineFirstWord))) {
	            if (wordIsBlock(prevLineFirstWord)) {
	              indent = lineIndent <= prevLineIndent ? prevLineIndent : prevLineIndent + indentUnit;
	            } else if (/^\{/.test(prevLineFirstWord)) {
	              indent = lineIndent <= prevLineIndent ? lineIndent : prevLineIndent + indentUnit;
	            } else if (wordIsVendorPrefix(prevLineFirstWord) || wordIsProperty(prevLineFirstWord)) {
	              indent = lineIndent >= prevLineIndent ? prevLineIndent : lineIndent;
	            } else if (/^(\.|#|:|\[|\*|&|@|\+|\-|>|~|\/)/.test(prevLineFirstWord) ||
	                      /=\s*$/.test(prevLineFirstWord) ||
	                      wordIsTag(prevLineFirstWord) ||
	                      /^\$[\w-\.\[\]\'\"]/.test(prevLineFirstWord)) {
	              indent = prevLineIndent + indentUnit;
	            } else {
	              indent = lineIndent;
	            }
	          }
	        }
	        return indent;
	      },
	      electricChars: "}",
	      lineComment: "//",
	      fold: "indent"
	    };
	  });

	  // developer.mozilla.org/en-US/docs/Web/HTML/Element
	  var tagKeywords_ = ["a","abbr","address","area","article","aside","audio", "b", "base","bdi", "bdo","bgsound","blockquote","body","br","button","canvas","caption","cite", "code","col","colgroup","data","datalist","dd","del","details","dfn","div", "dl","dt","em","embed","fieldset","figcaption","figure","footer","form","h1", "h2","h3","h4","h5","h6","head","header","hgroup","hr","html","i","iframe", "img","input","ins","kbd","keygen","label","legend","li","link","main","map", "mark","marquee","menu","menuitem","meta","meter","nav","nobr","noframes", "noscript","object","ol","optgroup","option","output","p","param","pre", "progress","q","rp","rt","ruby","s","samp","script","section","select", "small","source","span","strong","style","sub","summary","sup","table","tbody","td","textarea","tfoot","th","thead","time","tr","track", "u","ul","var","video"];

	  // github.com/codemirror/CodeMirror/blob/master/mode/css/css.js
	  var documentTypes_ = ["domain", "regexp", "url", "url-prefix"];
	  var mediaTypes_ = ["all","aural","braille","handheld","print","projection","screen","tty","tv","embossed"];
	  var mediaFeatures_ = ["width","min-width","max-width","height","min-height","max-height","device-width","min-device-width","max-device-width","device-height","min-device-height","max-device-height","aspect-ratio","min-aspect-ratio","max-aspect-ratio","device-aspect-ratio","min-device-aspect-ratio","max-device-aspect-ratio","color","min-color","max-color","color-index","min-color-index","max-color-index","monochrome","min-monochrome","max-monochrome","resolution","min-resolution","max-resolution","scan","grid"];
	  var propertyKeywords_ = ["align-content","align-items","align-self","alignment-adjust","alignment-baseline","anchor-point","animation","animation-delay","animation-direction","animation-duration","animation-fill-mode","animation-iteration-count","animation-name","animation-play-state","animation-timing-function","appearance","azimuth","backface-visibility","background","background-attachment","background-clip","background-color","background-image","background-origin","background-position","background-repeat","background-size","baseline-shift","binding","bleed","bookmark-label","bookmark-level","bookmark-state","bookmark-target","border","border-bottom","border-bottom-color","border-bottom-left-radius","border-bottom-right-radius","border-bottom-style","border-bottom-width","border-collapse","border-color","border-image","border-image-outset","border-image-repeat","border-image-slice","border-image-source","border-image-width","border-left","border-left-color","border-left-style","border-left-width","border-radius","border-right","border-right-color","border-right-style","border-right-width","border-spacing","border-style","border-top","border-top-color","border-top-left-radius","border-top-right-radius","border-top-style","border-top-width","border-width","bottom","box-decoration-break","box-shadow","box-sizing","break-after","break-before","break-inside","caption-side","clear","clip","color","color-profile","column-count","column-fill","column-gap","column-rule","column-rule-color","column-rule-style","column-rule-width","column-span","column-width","columns","content","counter-increment","counter-reset","crop","cue","cue-after","cue-before","cursor","direction","display","dominant-baseline","drop-initial-after-adjust","drop-initial-after-align","drop-initial-before-adjust","drop-initial-before-align","drop-initial-size","drop-initial-value","elevation","empty-cells","fit","fit-position","flex","flex-basis","flex-direction","flex-flow","flex-grow","flex-shrink","flex-wrap","float","float-offset","flow-from","flow-into","font","font-feature-settings","font-family","font-kerning","font-language-override","font-size","font-size-adjust","font-stretch","font-style","font-synthesis","font-variant","font-variant-alternates","font-variant-caps","font-variant-east-asian","font-variant-ligatures","font-variant-numeric","font-variant-position","font-weight","grid","grid-area","grid-auto-columns","grid-auto-flow","grid-auto-position","grid-auto-rows","grid-column","grid-column-end","grid-column-start","grid-row","grid-row-end","grid-row-start","grid-template","grid-template-areas","grid-template-columns","grid-template-rows","hanging-punctuation","height","hyphens","icon","image-orientation","image-rendering","image-resolution","inline-box-align","justify-content","left","letter-spacing","line-break","line-height","line-stacking","line-stacking-ruby","line-stacking-shift","line-stacking-strategy","list-style","list-style-image","list-style-position","list-style-type","margin","margin-bottom","margin-left","margin-right","margin-top","marker-offset","marks","marquee-direction","marquee-loop","marquee-play-count","marquee-speed","marquee-style","max-height","max-width","min-height","min-width","move-to","nav-down","nav-index","nav-left","nav-right","nav-up","object-fit","object-position","opacity","order","orphans","outline","outline-color","outline-offset","outline-style","outline-width","overflow","overflow-style","overflow-wrap","overflow-x","overflow-y","padding","padding-bottom","padding-left","padding-right","padding-top","page","page-break-after","page-break-before","page-break-inside","page-policy","pause","pause-after","pause-before","perspective","perspective-origin","pitch","pitch-range","play-during","position","presentation-level","punctuation-trim","quotes","region-break-after","region-break-before","region-break-inside","region-fragment","rendering-intent","resize","rest","rest-after","rest-before","richness","right","rotation","rotation-point","ruby-align","ruby-overhang","ruby-position","ruby-span","shape-image-threshold","shape-inside","shape-margin","shape-outside","size","speak","speak-as","speak-header","speak-numeral","speak-punctuation","speech-rate","stress","string-set","tab-size","table-layout","target","target-name","target-new","target-position","text-align","text-align-last","text-decoration","text-decoration-color","text-decoration-line","text-decoration-skip","text-decoration-style","text-emphasis","text-emphasis-color","text-emphasis-position","text-emphasis-style","text-height","text-indent","text-justify","text-outline","text-overflow","text-shadow","text-size-adjust","text-space-collapse","text-transform","text-underline-position","text-wrap","top","transform","transform-origin","transform-style","transition","transition-delay","transition-duration","transition-property","transition-timing-function","unicode-bidi","vertical-align","visibility","voice-balance","voice-duration","voice-family","voice-pitch","voice-range","voice-rate","voice-stress","voice-volume","volume","white-space","widows","width","will-change","word-break","word-spacing","word-wrap","z-index","clip-path","clip-rule","mask","enable-background","filter","flood-color","flood-opacity","lighting-color","stop-color","stop-opacity","pointer-events","color-interpolation","color-interpolation-filters","color-rendering","fill","fill-opacity","fill-rule","image-rendering","marker","marker-end","marker-mid","marker-start","shape-rendering","stroke","stroke-dasharray","stroke-dashoffset","stroke-linecap","stroke-linejoin","stroke-miterlimit","stroke-opacity","stroke-width","text-rendering","baseline-shift","dominant-baseline","glyph-orientation-horizontal","glyph-orientation-vertical","text-anchor","writing-mode","font-smoothing","osx-font-smoothing"];
	  var nonStandardPropertyKeywords_ = ["scrollbar-arrow-color","scrollbar-base-color","scrollbar-dark-shadow-color","scrollbar-face-color","scrollbar-highlight-color","scrollbar-shadow-color","scrollbar-3d-light-color","scrollbar-track-color","shape-inside","searchfield-cancel-button","searchfield-decoration","searchfield-results-button","searchfield-results-decoration","zoom"];
	  var fontProperties_ = ["font-family","src","unicode-range","font-variant","font-feature-settings","font-stretch","font-weight","font-style"];
	  var colorKeywords_ = ["aliceblue","antiquewhite","aqua","aquamarine","azure","beige","bisque","black","blanchedalmond","blue","blueviolet","brown","burlywood","cadetblue","chartreuse","chocolate","coral","cornflowerblue","cornsilk","crimson","cyan","darkblue","darkcyan","darkgoldenrod","darkgray","darkgreen","darkkhaki","darkmagenta","darkolivegreen","darkorange","darkorchid","darkred","darksalmon","darkseagreen","darkslateblue","darkslategray","darkturquoise","darkviolet","deeppink","deepskyblue","dimgray","dodgerblue","firebrick","floralwhite","forestgreen","fuchsia","gainsboro","ghostwhite","gold","goldenrod","gray","grey","green","greenyellow","honeydew","hotpink","indianred","indigo","ivory","khaki","lavender","lavenderblush","lawngreen","lemonchiffon","lightblue","lightcoral","lightcyan","lightgoldenrodyellow","lightgray","lightgreen","lightpink","lightsalmon","lightseagreen","lightskyblue","lightslategray","lightsteelblue","lightyellow","lime","limegreen","linen","magenta","maroon","mediumaquamarine","mediumblue","mediumorchid","mediumpurple","mediumseagreen","mediumslateblue","mediumspringgreen","mediumturquoise","mediumvioletred","midnightblue","mintcream","mistyrose","moccasin","navajowhite","navy","oldlace","olive","olivedrab","orange","orangered","orchid","palegoldenrod","palegreen","paleturquoise","palevioletred","papayawhip","peachpuff","peru","pink","plum","powderblue","purple","rebeccapurple","red","rosybrown","royalblue","saddlebrown","salmon","sandybrown","seagreen","seashell","sienna","silver","skyblue","slateblue","slategray","snow","springgreen","steelblue","tan","teal","thistle","tomato","turquoise","violet","wheat","white","whitesmoke","yellow","yellowgreen"];
	  var valueKeywords_ = ["above","absolute","activeborder","additive","activecaption","afar","after-white-space","ahead","alias","all","all-scroll","alphabetic","alternate","always","amharic","amharic-abegede","antialiased","appworkspace","arabic-indic","armenian","asterisks","attr","auto","avoid","avoid-column","avoid-page","avoid-region","background","backwards","baseline","below","bidi-override","binary","bengali","blink","block","block-axis","bold","bolder","border","border-box","both","bottom","break","break-all","break-word","bullets","button","button-bevel","buttonface","buttonhighlight","buttonshadow","buttontext","calc","cambodian","capitalize","caps-lock-indicator","caption","captiontext","caret","cell","center","checkbox","circle","cjk-decimal","cjk-earthly-branch","cjk-heavenly-stem","cjk-ideographic","clear","clip","close-quote","col-resize","collapse","column","compact","condensed","contain","content","contents","content-box","context-menu","continuous","copy","counter","counters","cover","crop","cross","crosshair","currentcolor","cursive","cyclic","dashed","decimal","decimal-leading-zero","default","default-button","destination-atop","destination-in","destination-out","destination-over","devanagari","disc","discard","disclosure-closed","disclosure-open","document","dot-dash","dot-dot-dash","dotted","double","down","e-resize","ease","ease-in","ease-in-out","ease-out","element","ellipse","ellipsis","embed","end","ethiopic","ethiopic-abegede","ethiopic-abegede-am-et","ethiopic-abegede-gez","ethiopic-abegede-ti-er","ethiopic-abegede-ti-et","ethiopic-halehame-aa-er","ethiopic-halehame-aa-et","ethiopic-halehame-am-et","ethiopic-halehame-gez","ethiopic-halehame-om-et","ethiopic-halehame-sid-et","ethiopic-halehame-so-et","ethiopic-halehame-ti-er","ethiopic-halehame-ti-et","ethiopic-halehame-tig","ethiopic-numeric","ew-resize","expanded","extends","extra-condensed","extra-expanded","fantasy","fast","fill","fixed","flat","flex","footnotes","forwards","from","geometricPrecision","georgian","graytext","groove","gujarati","gurmukhi","hand","hangul","hangul-consonant","hebrew","help","hidden","hide","higher","highlight","highlighttext","hiragana","hiragana-iroha","horizontal","hsl","hsla","icon","ignore","inactiveborder","inactivecaption","inactivecaptiontext","infinite","infobackground","infotext","inherit","initial","inline","inline-axis","inline-block","inline-flex","inline-table","inset","inside","intrinsic","invert","italic","japanese-formal","japanese-informal","justify","kannada","katakana","katakana-iroha","keep-all","khmer","korean-hangul-formal","korean-hanja-formal","korean-hanja-informal","landscape","lao","large","larger","left","level","lighter","line-through","linear","linear-gradient","lines","list-item","listbox","listitem","local","logical","loud","lower","lower-alpha","lower-armenian","lower-greek","lower-hexadecimal","lower-latin","lower-norwegian","lower-roman","lowercase","ltr","malayalam","match","matrix","matrix3d","media-controls-background","media-current-time-display","media-fullscreen-button","media-mute-button","media-play-button","media-return-to-realtime-button","media-rewind-button","media-seek-back-button","media-seek-forward-button","media-slider","media-sliderthumb","media-time-remaining-display","media-volume-slider","media-volume-slider-container","media-volume-sliderthumb","medium","menu","menulist","menulist-button","menulist-text","menulist-textfield","menutext","message-box","middle","min-intrinsic","mix","mongolian","monospace","move","multiple","myanmar","n-resize","narrower","ne-resize","nesw-resize","no-close-quote","no-drop","no-open-quote","no-repeat","none","normal","not-allowed","nowrap","ns-resize","numbers","numeric","nw-resize","nwse-resize","oblique","octal","open-quote","optimizeLegibility","optimizeSpeed","oriya","oromo","outset","outside","outside-shape","overlay","overline","padding","padding-box","painted","page","paused","persian","perspective","plus-darker","plus-lighter","pointer","polygon","portrait","pre","pre-line","pre-wrap","preserve-3d","progress","push-button","radial-gradient","radio","read-only","read-write","read-write-plaintext-only","rectangle","region","relative","repeat","repeating-linear-gradient","repeating-radial-gradient","repeat-x","repeat-y","reset","reverse","rgb","rgba","ridge","right","rotate","rotate3d","rotateX","rotateY","rotateZ","round","row-resize","rtl","run-in","running","s-resize","sans-serif","scale","scale3d","scaleX","scaleY","scaleZ","scroll","scrollbar","scroll-position","se-resize","searchfield","searchfield-cancel-button","searchfield-decoration","searchfield-results-button","searchfield-results-decoration","semi-condensed","semi-expanded","separate","serif","show","sidama","simp-chinese-formal","simp-chinese-informal","single","skew","skewX","skewY","skip-white-space","slide","slider-horizontal","slider-vertical","sliderthumb-horizontal","sliderthumb-vertical","slow","small","small-caps","small-caption","smaller","solid","somali","source-atop","source-in","source-out","source-over","space","spell-out","square","square-button","start","static","status-bar","stretch","stroke","sub","subpixel-antialiased","super","sw-resize","symbolic","symbols","table","table-caption","table-cell","table-column","table-column-group","table-footer-group","table-header-group","table-row","table-row-group","tamil","telugu","text","text-bottom","text-top","textarea","textfield","thai","thick","thin","threeddarkshadow","threedface","threedhighlight","threedlightshadow","threedshadow","tibetan","tigre","tigrinya-er","tigrinya-er-abegede","tigrinya-et","tigrinya-et-abegede","to","top","trad-chinese-formal","trad-chinese-informal","translate","translate3d","translateX","translateY","translateZ","transparent","ultra-condensed","ultra-expanded","underline","up","upper-alpha","upper-armenian","upper-greek","upper-hexadecimal","upper-latin","upper-norwegian","upper-roman","uppercase","urdu","url","var","vertical","vertical-text","visible","visibleFill","visiblePainted","visibleStroke","visual","w-resize","wait","wave","wider","window","windowframe","windowtext","words","x-large","x-small","xor","xx-large","xx-small","bicubic","optimizespeed","grayscale","row","row-reverse","wrap","wrap-reverse","column-reverse","flex-start","flex-end","space-between","space-around", "unset"];

	  var wordOperatorKeywords_ = ["in","and","or","not","is not","is a","is","isnt","defined","if unless"],
	      blockKeywords_ = ["for","if","else","unless", "from", "to"],
	      commonAtoms_ = ["null","true","false","href","title","type","not-allowed","readonly","disabled"],
	      commonDef_ = ["@font-face", "@keyframes", "@media", "@viewport", "@page", "@host", "@supports", "@block", "@css"];

	  var hintWords = tagKeywords_.concat(documentTypes_,mediaTypes_,mediaFeatures_,
	                                      propertyKeywords_,nonStandardPropertyKeywords_,
	                                      colorKeywords_,valueKeywords_,fontProperties_,
	                                      wordOperatorKeywords_,blockKeywords_,
	                                      commonAtoms_,commonDef_);

	  function wordRegexp(words) {
	    words = words.sort(function(a,b){return b > a;});
	    return new RegExp("^((" + words.join(")|(") + "))\\b");
	  }

	  function keySet(array) {
	    var keys = {};
	    for (var i = 0; i < array.length; ++i) { keys[array[i]] = true; }
	    return keys;
	  }

	  function escapeRegExp(text) {
	    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
	  }

	  CodeMirror.registerHelper("hintWords", "stylus", hintWords);
	  CodeMirror.defineMIME("text/x-styl", "stylus");
	});
	});

	var htmlmixed = createCommonjsModule(function (module, exports) {
	// CodeMirror, copyright (c) by Marijn Haverbeke and others
	// Distributed under an MIT license: https://codemirror.net/LICENSE

	(function(mod) {
	  { mod(codemirror, xml, javascript, css$2); }
	})(function(CodeMirror) {

	  var defaultTags = {
	    script: [
	      ["lang", /(javascript|babel)/i, "javascript"],
	      ["type", /^(?:text|application)\/(?:x-)?(?:java|ecma)script$|^module$|^$/i, "javascript"],
	      ["type", /./, "text/plain"],
	      [null, null, "javascript"]
	    ],
	    style:  [
	      ["lang", /^css$/i, "css"],
	      ["type", /^(text\/)?(x-)?(stylesheet|css)$/i, "css"],
	      ["type", /./, "text/plain"],
	      [null, null, "css"]
	    ]
	  };

	  function maybeBackup(stream, pat, style) {
	    var cur = stream.current(), close = cur.search(pat);
	    if (close > -1) {
	      stream.backUp(cur.length - close);
	    } else if (cur.match(/<\/?$/)) {
	      stream.backUp(cur.length);
	      if (!stream.match(pat, false)) { stream.match(cur); }
	    }
	    return style;
	  }

	  var attrRegexpCache = {};
	  function getAttrRegexp(attr) {
	    var regexp = attrRegexpCache[attr];
	    if (regexp) { return regexp; }
	    return attrRegexpCache[attr] = new RegExp("\\s+" + attr + "\\s*=\\s*('|\")?([^'\"]+)('|\")?\\s*");
	  }

	  function getAttrValue(text, attr) {
	    var match = text.match(getAttrRegexp(attr));
	    return match ? /^\s*(.*?)\s*$/.exec(match[2])[1] : ""
	  }

	  function getTagRegexp(tagName, anchored) {
	    return new RegExp((anchored ? "^" : "") + "<\/\s*" + tagName + "\s*>", "i");
	  }

	  function addTags(from, to) {
	    for (var tag in from) {
	      var dest = to[tag] || (to[tag] = []);
	      var source = from[tag];
	      for (var i = source.length - 1; i >= 0; i--)
	        { dest.unshift(source[i]); }
	    }
	  }

	  function findMatchingMode(tagInfo, tagText) {
	    for (var i = 0; i < tagInfo.length; i++) {
	      var spec = tagInfo[i];
	      if (!spec[0] || spec[1].test(getAttrValue(tagText, spec[0]))) { return spec[2]; }
	    }
	  }

	  CodeMirror.defineMode("htmlmixed", function (config, parserConfig) {
	    var htmlMode = CodeMirror.getMode(config, {
	      name: "xml",
	      htmlMode: true,
	      multilineTagIndentFactor: parserConfig.multilineTagIndentFactor,
	      multilineTagIndentPastTag: parserConfig.multilineTagIndentPastTag
	    });

	    var tags = {};
	    var configTags = parserConfig && parserConfig.tags, configScript = parserConfig && parserConfig.scriptTypes;
	    addTags(defaultTags, tags);
	    if (configTags) { addTags(configTags, tags); }
	    if (configScript) { for (var i = configScript.length - 1; i >= 0; i--)
	      { tags.script.unshift(["type", configScript[i].matches, configScript[i].mode]); } }

	    function html(stream, state) {
	      var style = htmlMode.token(stream, state.htmlState), tag = /\btag\b/.test(style), tagName;
	      if (tag && !/[<>\s\/]/.test(stream.current()) &&
	          (tagName = state.htmlState.tagName && state.htmlState.tagName.toLowerCase()) &&
	          tags.hasOwnProperty(tagName)) {
	        state.inTag = tagName + " ";
	      } else if (state.inTag && tag && />$/.test(stream.current())) {
	        var inTag = /^([\S]+) (.*)/.exec(state.inTag);
	        state.inTag = null;
	        var modeSpec = stream.current() == ">" && findMatchingMode(tags[inTag[1]], inTag[2]);
	        var mode = CodeMirror.getMode(config, modeSpec);
	        var endTagA = getTagRegexp(inTag[1], true), endTag = getTagRegexp(inTag[1], false);
	        state.token = function (stream, state) {
	          if (stream.match(endTagA, false)) {
	            state.token = html;
	            state.localState = state.localMode = null;
	            return null;
	          }
	          return maybeBackup(stream, endTag, state.localMode.token(stream, state.localState));
	        };
	        state.localMode = mode;
	        state.localState = CodeMirror.startState(mode, htmlMode.indent(state.htmlState, ""));
	      } else if (state.inTag) {
	        state.inTag += stream.current();
	        if (stream.eol()) { state.inTag += " "; }
	      }
	      return style;
	    }
	    return {
	      startState: function () {
	        var state = CodeMirror.startState(htmlMode);
	        return {token: html, inTag: null, localMode: null, localState: null, htmlState: state};
	      },

	      copyState: function (state) {
	        var local;
	        if (state.localState) {
	          local = CodeMirror.copyState(state.localMode, state.localState);
	        }
	        return {token: state.token, inTag: state.inTag,
	                localMode: state.localMode, localState: local,
	                htmlState: CodeMirror.copyState(htmlMode, state.htmlState)};
	      },

	      token: function (stream, state) {
	        return state.token(stream, state);
	      },

	      indent: function (state, textAfter, line) {
	        if (!state.localMode || /^\s*<\//.test(textAfter))
	          { return htmlMode.indent(state.htmlState, textAfter); }
	        else if (state.localMode.indent)
	          { return state.localMode.indent(state.localState, textAfter, line); }
	        else
	          { return CodeMirror.Pass; }
	      },

	      innerMode: function (state) {
	        return {state: state.localState || state.htmlState, mode: state.localMode || htmlMode};
	      }
	    };
	  }, "xml", "javascript", "css");

	  CodeMirror.defineMIME("text/html", "htmlmixed");
	});
	});

	var pug$1 = createCommonjsModule(function (module, exports) {
	// CodeMirror, copyright (c) by Marijn Haverbeke and others
	// Distributed under an MIT license: https://codemirror.net/LICENSE

	(function(mod) {
	  { mod(codemirror, javascript, css$2, htmlmixed); }
	})(function(CodeMirror) {

	CodeMirror.defineMode("pug", function (config) {
	  // token types
	  var KEYWORD = 'keyword';
	  var DOCTYPE = 'meta';
	  var ID = 'builtin';
	  var CLASS = 'qualifier';

	  var ATTRS_NEST = {
	    '{': '}',
	    '(': ')',
	    '[': ']'
	  };

	  var jsMode = CodeMirror.getMode(config, 'javascript');

	  function State() {
	    this.javaScriptLine = false;
	    this.javaScriptLineExcludesColon = false;

	    this.javaScriptArguments = false;
	    this.javaScriptArgumentsDepth = 0;

	    this.isInterpolating = false;
	    this.interpolationNesting = 0;

	    this.jsState = CodeMirror.startState(jsMode);

	    this.restOfLine = '';

	    this.isIncludeFiltered = false;
	    this.isEach = false;

	    this.lastTag = '';
	    this.scriptType = '';

	    // Attributes Mode
	    this.isAttrs = false;
	    this.attrsNest = [];
	    this.inAttributeName = true;
	    this.attributeIsType = false;
	    this.attrValue = '';

	    // Indented Mode
	    this.indentOf = Infinity;
	    this.indentToken = '';

	    this.innerMode = null;
	    this.innerState = null;

	    this.innerModeForLine = false;
	  }
	  /**
	   * Safely copy a state
	   *
	   * @return {State}
	   */
	  State.prototype.copy = function () {
	    var res = new State();
	    res.javaScriptLine = this.javaScriptLine;
	    res.javaScriptLineExcludesColon = this.javaScriptLineExcludesColon;
	    res.javaScriptArguments = this.javaScriptArguments;
	    res.javaScriptArgumentsDepth = this.javaScriptArgumentsDepth;
	    res.isInterpolating = this.isInterpolating;
	    res.interpolationNesting = this.interpolationNesting;

	    res.jsState = CodeMirror.copyState(jsMode, this.jsState);

	    res.innerMode = this.innerMode;
	    if (this.innerMode && this.innerState) {
	      res.innerState = CodeMirror.copyState(this.innerMode, this.innerState);
	    }

	    res.restOfLine = this.restOfLine;

	    res.isIncludeFiltered = this.isIncludeFiltered;
	    res.isEach = this.isEach;
	    res.lastTag = this.lastTag;
	    res.scriptType = this.scriptType;
	    res.isAttrs = this.isAttrs;
	    res.attrsNest = this.attrsNest.slice();
	    res.inAttributeName = this.inAttributeName;
	    res.attributeIsType = this.attributeIsType;
	    res.attrValue = this.attrValue;
	    res.indentOf = this.indentOf;
	    res.indentToken = this.indentToken;

	    res.innerModeForLine = this.innerModeForLine;

	    return res;
	  };

	  function javaScript(stream, state) {
	    if (stream.sol()) {
	      // if javaScriptLine was set at end of line, ignore it
	      state.javaScriptLine = false;
	      state.javaScriptLineExcludesColon = false;
	    }
	    if (state.javaScriptLine) {
	      if (state.javaScriptLineExcludesColon && stream.peek() === ':') {
	        state.javaScriptLine = false;
	        state.javaScriptLineExcludesColon = false;
	        return;
	      }
	      var tok = jsMode.token(stream, state.jsState);
	      if (stream.eol()) { state.javaScriptLine = false; }
	      return tok || true;
	    }
	  }
	  function javaScriptArguments(stream, state) {
	    if (state.javaScriptArguments) {
	      if (state.javaScriptArgumentsDepth === 0 && stream.peek() !== '(') {
	        state.javaScriptArguments = false;
	        return;
	      }
	      if (stream.peek() === '(') {
	        state.javaScriptArgumentsDepth++;
	      } else if (stream.peek() === ')') {
	        state.javaScriptArgumentsDepth--;
	      }
	      if (state.javaScriptArgumentsDepth === 0) {
	        state.javaScriptArguments = false;
	        return;
	      }

	      var tok = jsMode.token(stream, state.jsState);
	      return tok || true;
	    }
	  }

	  function yieldStatement(stream) {
	    if (stream.match(/^yield\b/)) {
	        return 'keyword';
	    }
	  }

	  function doctype(stream) {
	    if (stream.match(/^(?:doctype) *([^\n]+)?/)) {
	        return DOCTYPE;
	    }
	  }

	  function interpolation(stream, state) {
	    if (stream.match('#{')) {
	      state.isInterpolating = true;
	      state.interpolationNesting = 0;
	      return 'punctuation';
	    }
	  }

	  function interpolationContinued(stream, state) {
	    if (state.isInterpolating) {
	      if (stream.peek() === '}') {
	        state.interpolationNesting--;
	        if (state.interpolationNesting < 0) {
	          stream.next();
	          state.isInterpolating = false;
	          return 'punctuation';
	        }
	      } else if (stream.peek() === '{') {
	        state.interpolationNesting++;
	      }
	      return jsMode.token(stream, state.jsState) || true;
	    }
	  }

	  function caseStatement(stream, state) {
	    if (stream.match(/^case\b/)) {
	      state.javaScriptLine = true;
	      return KEYWORD;
	    }
	  }

	  function when(stream, state) {
	    if (stream.match(/^when\b/)) {
	      state.javaScriptLine = true;
	      state.javaScriptLineExcludesColon = true;
	      return KEYWORD;
	    }
	  }

	  function defaultStatement(stream) {
	    if (stream.match(/^default\b/)) {
	      return KEYWORD;
	    }
	  }

	  function extendsStatement(stream, state) {
	    if (stream.match(/^extends?\b/)) {
	      state.restOfLine = 'string';
	      return KEYWORD;
	    }
	  }

	  function append(stream, state) {
	    if (stream.match(/^append\b/)) {
	      state.restOfLine = 'variable';
	      return KEYWORD;
	    }
	  }
	  function prepend(stream, state) {
	    if (stream.match(/^prepend\b/)) {
	      state.restOfLine = 'variable';
	      return KEYWORD;
	    }
	  }
	  function block(stream, state) {
	    if (stream.match(/^block\b *(?:(prepend|append)\b)?/)) {
	      state.restOfLine = 'variable';
	      return KEYWORD;
	    }
	  }

	  function include(stream, state) {
	    if (stream.match(/^include\b/)) {
	      state.restOfLine = 'string';
	      return KEYWORD;
	    }
	  }

	  function includeFiltered(stream, state) {
	    if (stream.match(/^include:([a-zA-Z0-9\-]+)/, false) && stream.match('include')) {
	      state.isIncludeFiltered = true;
	      return KEYWORD;
	    }
	  }

	  function includeFilteredContinued(stream, state) {
	    if (state.isIncludeFiltered) {
	      var tok = filter(stream, state);
	      state.isIncludeFiltered = false;
	      state.restOfLine = 'string';
	      return tok;
	    }
	  }

	  function mixin(stream, state) {
	    if (stream.match(/^mixin\b/)) {
	      state.javaScriptLine = true;
	      return KEYWORD;
	    }
	  }

	  function call(stream, state) {
	    if (stream.match(/^\+([-\w]+)/)) {
	      if (!stream.match(/^\( *[-\w]+ *=/, false)) {
	        state.javaScriptArguments = true;
	        state.javaScriptArgumentsDepth = 0;
	      }
	      return 'variable';
	    }
	    if (stream.match(/^\+#{/, false)) {
	      stream.next();
	      state.mixinCallAfter = true;
	      return interpolation(stream, state);
	    }
	  }
	  function callArguments(stream, state) {
	    if (state.mixinCallAfter) {
	      state.mixinCallAfter = false;
	      if (!stream.match(/^\( *[-\w]+ *=/, false)) {
	        state.javaScriptArguments = true;
	        state.javaScriptArgumentsDepth = 0;
	      }
	      return true;
	    }
	  }

	  function conditional(stream, state) {
	    if (stream.match(/^(if|unless|else if|else)\b/)) {
	      state.javaScriptLine = true;
	      return KEYWORD;
	    }
	  }

	  function each(stream, state) {
	    if (stream.match(/^(- *)?(each|for)\b/)) {
	      state.isEach = true;
	      return KEYWORD;
	    }
	  }
	  function eachContinued(stream, state) {
	    if (state.isEach) {
	      if (stream.match(/^ in\b/)) {
	        state.javaScriptLine = true;
	        state.isEach = false;
	        return KEYWORD;
	      } else if (stream.sol() || stream.eol()) {
	        state.isEach = false;
	      } else if (stream.next()) {
	        while (!stream.match(/^ in\b/, false) && stream.next()){ }
	        return 'variable';
	      }
	    }
	  }

	  function whileStatement(stream, state) {
	    if (stream.match(/^while\b/)) {
	      state.javaScriptLine = true;
	      return KEYWORD;
	    }
	  }

	  function tag(stream, state) {
	    var captures;
	    if (captures = stream.match(/^(\w(?:[-:\w]*\w)?)\/?/)) {
	      state.lastTag = captures[1].toLowerCase();
	      if (state.lastTag === 'script') {
	        state.scriptType = 'application/javascript';
	      }
	      return 'tag';
	    }
	  }

	  function filter(stream, state) {
	    if (stream.match(/^:([\w\-]+)/)) {
	      var innerMode;
	      if (config && config.innerModes) {
	        innerMode = config.innerModes(stream.current().substring(1));
	      }
	      if (!innerMode) {
	        innerMode = stream.current().substring(1);
	      }
	      if (typeof innerMode === 'string') {
	        innerMode = CodeMirror.getMode(config, innerMode);
	      }
	      setInnerMode(stream, state, innerMode);
	      return 'atom';
	    }
	  }

	  function code(stream, state) {
	    if (stream.match(/^(!?=|-)/)) {
	      state.javaScriptLine = true;
	      return 'punctuation';
	    }
	  }

	  function id(stream) {
	    if (stream.match(/^#([\w-]+)/)) {
	      return ID;
	    }
	  }

	  function className(stream) {
	    if (stream.match(/^\.([\w-]+)/)) {
	      return CLASS;
	    }
	  }

	  function attrs(stream, state) {
	    if (stream.peek() == '(') {
	      stream.next();
	      state.isAttrs = true;
	      state.attrsNest = [];
	      state.inAttributeName = true;
	      state.attrValue = '';
	      state.attributeIsType = false;
	      return 'punctuation';
	    }
	  }

	  function attrsContinued(stream, state) {
	    if (state.isAttrs) {
	      if (ATTRS_NEST[stream.peek()]) {
	        state.attrsNest.push(ATTRS_NEST[stream.peek()]);
	      }
	      if (state.attrsNest[state.attrsNest.length - 1] === stream.peek()) {
	        state.attrsNest.pop();
	      } else  if (stream.eat(')')) {
	        state.isAttrs = false;
	        return 'punctuation';
	      }
	      if (state.inAttributeName && stream.match(/^[^=,\)!]+/)) {
	        if (stream.peek() === '=' || stream.peek() === '!') {
	          state.inAttributeName = false;
	          state.jsState = CodeMirror.startState(jsMode);
	          if (state.lastTag === 'script' && stream.current().trim().toLowerCase() === 'type') {
	            state.attributeIsType = true;
	          } else {
	            state.attributeIsType = false;
	          }
	        }
	        return 'attribute';
	      }

	      var tok = jsMode.token(stream, state.jsState);
	      if (state.attributeIsType && tok === 'string') {
	        state.scriptType = stream.current().toString();
	      }
	      if (state.attrsNest.length === 0 && (tok === 'string' || tok === 'variable' || tok === 'keyword')) {
	        try {
	          Function('', 'var x ' + state.attrValue.replace(/,\s*$/, '').replace(/^!/, ''));
	          state.inAttributeName = true;
	          state.attrValue = '';
	          stream.backUp(stream.current().length);
	          return attrsContinued(stream, state);
	        } catch (ex) {
	          //not the end of an attribute
	        }
	      }
	      state.attrValue += stream.current();
	      return tok || true;
	    }
	  }

	  function attributesBlock(stream, state) {
	    if (stream.match(/^&attributes\b/)) {
	      state.javaScriptArguments = true;
	      state.javaScriptArgumentsDepth = 0;
	      return 'keyword';
	    }
	  }

	  function indent(stream) {
	    if (stream.sol() && stream.eatSpace()) {
	      return 'indent';
	    }
	  }

	  function comment(stream, state) {
	    if (stream.match(/^ *\/\/(-)?([^\n]*)/)) {
	      state.indentOf = stream.indentation();
	      state.indentToken = 'comment';
	      return 'comment';
	    }
	  }

	  function colon(stream) {
	    if (stream.match(/^: */)) {
	      return 'colon';
	    }
	  }

	  function text(stream, state) {
	    if (stream.match(/^(?:\| ?| )([^\n]+)/)) {
	      return 'string';
	    }
	    if (stream.match(/^(<[^\n]*)/, false)) {
	      // html string
	      setInnerMode(stream, state, 'htmlmixed');
	      state.innerModeForLine = true;
	      return innerMode(stream, state, true);
	    }
	  }

	  function dot(stream, state) {
	    if (stream.eat('.')) {
	      var innerMode = null;
	      if (state.lastTag === 'script' && state.scriptType.toLowerCase().indexOf('javascript') != -1) {
	        innerMode = state.scriptType.toLowerCase().replace(/"|'/g, '');
	      } else if (state.lastTag === 'style') {
	        innerMode = 'css';
	      }
	      setInnerMode(stream, state, innerMode);
	      return 'dot';
	    }
	  }

	  function fail(stream) {
	    stream.next();
	    return null;
	  }


	  function setInnerMode(stream, state, mode) {
	    mode = CodeMirror.mimeModes[mode] || mode;
	    mode = config.innerModes ? config.innerModes(mode) || mode : mode;
	    mode = CodeMirror.mimeModes[mode] || mode;
	    mode = CodeMirror.getMode(config, mode);
	    state.indentOf = stream.indentation();

	    if (mode && mode.name !== 'null') {
	      state.innerMode = mode;
	    } else {
	      state.indentToken = 'string';
	    }
	  }
	  function innerMode(stream, state, force) {
	    if (stream.indentation() > state.indentOf || (state.innerModeForLine && !stream.sol()) || force) {
	      if (state.innerMode) {
	        if (!state.innerState) {
	          state.innerState = state.innerMode.startState ? CodeMirror.startState(state.innerMode, stream.indentation()) : {};
	        }
	        return stream.hideFirstChars(state.indentOf + 2, function () {
	          return state.innerMode.token(stream, state.innerState) || true;
	        });
	      } else {
	        stream.skipToEnd();
	        return state.indentToken;
	      }
	    } else if (stream.sol()) {
	      state.indentOf = Infinity;
	      state.indentToken = null;
	      state.innerMode = null;
	      state.innerState = null;
	    }
	  }
	  function restOfLine(stream, state) {
	    if (stream.sol()) {
	      // if restOfLine was set at end of line, ignore it
	      state.restOfLine = '';
	    }
	    if (state.restOfLine) {
	      stream.skipToEnd();
	      var tok = state.restOfLine;
	      state.restOfLine = '';
	      return tok;
	    }
	  }


	  function startState() {
	    return new State();
	  }
	  function copyState(state) {
	    return state.copy();
	  }
	  /**
	   * Get the next token in the stream
	   *
	   * @param {Stream} stream
	   * @param {State} state
	   */
	  function nextToken(stream, state) {
	    var tok = innerMode(stream, state)
	      || restOfLine(stream, state)
	      || interpolationContinued(stream, state)
	      || includeFilteredContinued(stream, state)
	      || eachContinued(stream, state)
	      || attrsContinued(stream, state)
	      || javaScript(stream, state)
	      || javaScriptArguments(stream, state)
	      || callArguments(stream, state)

	      || yieldStatement(stream, state)
	      || doctype(stream, state)
	      || interpolation(stream, state)
	      || caseStatement(stream, state)
	      || when(stream, state)
	      || defaultStatement(stream, state)
	      || extendsStatement(stream, state)
	      || append(stream, state)
	      || prepend(stream, state)
	      || block(stream, state)
	      || include(stream, state)
	      || includeFiltered(stream, state)
	      || mixin(stream, state)
	      || call(stream, state)
	      || conditional(stream, state)
	      || each(stream, state)
	      || whileStatement(stream, state)
	      || tag(stream, state)
	      || filter(stream, state)
	      || code(stream, state)
	      || id(stream, state)
	      || className(stream, state)
	      || attrs(stream, state)
	      || attributesBlock(stream, state)
	      || indent(stream, state)
	      || text(stream, state)
	      || comment(stream, state)
	      || colon(stream, state)
	      || dot(stream, state)
	      || fail(stream, state);

	    return tok === true ? null : tok;
	  }
	  return {
	    startState: startState,
	    copyState: copyState,
	    token: nextToken
	  };
	}, 'javascript', 'css', 'htmlmixed');

	CodeMirror.defineMIME('text/x-pug', 'pug');
	CodeMirror.defineMIME('text/x-jade', 'pug');

	});
	});

	var simple = createCommonjsModule(function (module, exports) {
	// CodeMirror, copyright (c) by Marijn Haverbeke and others
	// Distributed under an MIT license: https://codemirror.net/LICENSE

	(function(mod) {
	  { mod(codemirror); }
	})(function(CodeMirror) {

	  CodeMirror.defineSimpleMode = function(name, states) {
	    CodeMirror.defineMode(name, function(config) {
	      return CodeMirror.simpleMode(config, states);
	    });
	  };

	  CodeMirror.simpleMode = function(config, states) {
	    ensureState(states, "start");
	    var states_ = {}, meta = states.meta || {}, hasIndentation = false;
	    for (var state in states) { if (state != meta && states.hasOwnProperty(state)) {
	      var list = states_[state] = [], orig = states[state];
	      for (var i = 0; i < orig.length; i++) {
	        var data = orig[i];
	        list.push(new Rule(data, states));
	        if (data.indent || data.dedent) { hasIndentation = true; }
	      }
	    } }
	    var mode = {
	      startState: function() {
	        return {state: "start", pending: null,
	                local: null, localState: null,
	                indent: hasIndentation ? [] : null};
	      },
	      copyState: function(state) {
	        var s = {state: state.state, pending: state.pending,
	                 local: state.local, localState: null,
	                 indent: state.indent && state.indent.slice(0)};
	        if (state.localState)
	          { s.localState = CodeMirror.copyState(state.local.mode, state.localState); }
	        if (state.stack)
	          { s.stack = state.stack.slice(0); }
	        for (var pers = state.persistentStates; pers; pers = pers.next)
	          { s.persistentStates = {mode: pers.mode,
	                                spec: pers.spec,
	                                state: pers.state == state.localState ? s.localState : CodeMirror.copyState(pers.mode, pers.state),
	                                next: s.persistentStates}; }
	        return s;
	      },
	      token: tokenFunction(states_, config),
	      innerMode: function(state) { return state.local && {mode: state.local.mode, state: state.localState}; },
	      indent: indentFunction(states_, meta)
	    };
	    if (meta) { for (var prop in meta) { if (meta.hasOwnProperty(prop))
	      { mode[prop] = meta[prop]; } } }
	    return mode;
	  };

	  function ensureState(states, name) {
	    if (!states.hasOwnProperty(name))
	      { throw new Error("Undefined state " + name + " in simple mode"); }
	  }

	  function toRegex(val, caret) {
	    if (!val) { return /(?:)/; }
	    var flags = "";
	    if (val instanceof RegExp) {
	      if (val.ignoreCase) { flags = "i"; }
	      val = val.source;
	    } else {
	      val = String(val);
	    }
	    return new RegExp((caret === false ? "" : "^") + "(?:" + val + ")", flags);
	  }

	  function asToken(val) {
	    if (!val) { return null; }
	    if (val.apply) { return val }
	    if (typeof val == "string") { return val.replace(/\./g, " "); }
	    var result = [];
	    for (var i = 0; i < val.length; i++)
	      { result.push(val[i] && val[i].replace(/\./g, " ")); }
	    return result;
	  }

	  function Rule(data, states) {
	    if (data.next || data.push) { ensureState(states, data.next || data.push); }
	    this.regex = toRegex(data.regex);
	    this.token = asToken(data.token);
	    this.data = data;
	  }

	  function tokenFunction(states, config) {
	    return function(stream, state) {
	      if (state.pending) {
	        var pend = state.pending.shift();
	        if (state.pending.length == 0) { state.pending = null; }
	        stream.pos += pend.text.length;
	        return pend.token;
	      }

	      if (state.local) {
	        if (state.local.end && stream.match(state.local.end)) {
	          var tok = state.local.endToken || null;
	          state.local = state.localState = null;
	          return tok;
	        } else {
	          var tok = state.local.mode.token(stream, state.localState), m;
	          if (state.local.endScan && (m = state.local.endScan.exec(stream.current())))
	            { stream.pos = stream.start + m.index; }
	          return tok;
	        }
	      }

	      var curState = states[state.state];
	      for (var i = 0; i < curState.length; i++) {
	        var rule = curState[i];
	        var matches = (!rule.data.sol || stream.sol()) && stream.match(rule.regex);
	        if (matches) {
	          if (rule.data.next) {
	            state.state = rule.data.next;
	          } else if (rule.data.push) {
	            (state.stack || (state.stack = [])).push(state.state);
	            state.state = rule.data.push;
	          } else if (rule.data.pop && state.stack && state.stack.length) {
	            state.state = state.stack.pop();
	          }

	          if (rule.data.mode)
	            { enterLocalMode(config, state, rule.data.mode, rule.token); }
	          if (rule.data.indent)
	            { state.indent.push(stream.indentation() + config.indentUnit); }
	          if (rule.data.dedent)
	            { state.indent.pop(); }
	          var token = rule.token;
	          if (token && token.apply) { token = token(matches); }
	          if (matches.length > 2 && rule.token && typeof rule.token != "string") {
	            state.pending = [];
	            for (var j = 2; j < matches.length; j++)
	              { if (matches[j])
	                { state.pending.push({text: matches[j], token: rule.token[j - 1]}); } }
	            stream.backUp(matches[0].length - (matches[1] ? matches[1].length : 0));
	            return token[0];
	          } else if (token && token.join) {
	            return token[0];
	          } else {
	            return token;
	          }
	        }
	      }
	      stream.next();
	      return null;
	    };
	  }

	  function cmp(a, b) {
	    if (a === b) { return true; }
	    if (!a || typeof a != "object" || !b || typeof b != "object") { return false; }
	    var props = 0;
	    for (var prop in a) { if (a.hasOwnProperty(prop)) {
	      if (!b.hasOwnProperty(prop) || !cmp(a[prop], b[prop])) { return false; }
	      props++;
	    } }
	    for (var prop in b) { if (b.hasOwnProperty(prop)) { props--; } }
	    return props == 0;
	  }

	  function enterLocalMode(config, state, spec, token) {
	    var pers;
	    if (spec.persistent) { for (var p = state.persistentStates; p && !pers; p = p.next)
	      { if (spec.spec ? cmp(spec.spec, p.spec) : spec.mode == p.mode) { pers = p; } } }
	    var mode = pers ? pers.mode : spec.mode || CodeMirror.getMode(config, spec.spec);
	    var lState = pers ? pers.state : CodeMirror.startState(mode);
	    if (spec.persistent && !pers)
	      { state.persistentStates = {mode: mode, spec: spec.spec, state: lState, next: state.persistentStates}; }

	    state.localState = lState;
	    state.local = {mode: mode,
	                   end: spec.end && toRegex(spec.end),
	                   endScan: spec.end && spec.forceEnd !== false && toRegex(spec.end, false),
	                   endToken: token && token.join ? token[token.length - 1] : token};
	  }

	  function indexOf(val, arr) {
	    for (var i = 0; i < arr.length; i++) { if (arr[i] === val) { return true; } }
	  }

	  function indentFunction(states, meta) {
	    return function(state, textAfter, line) {
	      if (state.local && state.local.mode.indent)
	        { return state.local.mode.indent(state.localState, textAfter, line); }
	      if (state.indent == null || state.local || meta.dontIndentStates && indexOf(state.state, meta.dontIndentStates) > -1)
	        { return CodeMirror.Pass; }

	      var pos = state.indent.length - 1, rules = states[state.state];
	      scan: for (;;) {
	        for (var i = 0; i < rules.length; i++) {
	          var rule = rules[i];
	          if (rule.data.dedent && rule.data.dedentIfLineStart !== false) {
	            var m = rule.regex.exec(textAfter);
	            if (m && m[0]) {
	              pos--;
	              if (rule.next || rule.push) { rules = states[rule.next || rule.push]; }
	              textAfter = textAfter.slice(m[0].length);
	              continue scan;
	            }
	          }
	        }
	        break;
	      }
	      return pos < 0 ? 0 : state.indent[pos];
	    };
	  }
	});
	});

	var multiplex = createCommonjsModule(function (module, exports) {
	// CodeMirror, copyright (c) by Marijn Haverbeke and others
	// Distributed under an MIT license: https://codemirror.net/LICENSE

	(function(mod) {
	  { mod(codemirror); }
	})(function(CodeMirror) {

	CodeMirror.multiplexingMode = function(outer /*, others */) {
	  // Others should be {open, close, mode [, delimStyle] [, innerStyle]} objects
	  var others = Array.prototype.slice.call(arguments, 1);

	  function indexOf(string, pattern, from, returnEnd) {
	    if (typeof pattern == "string") {
	      var found = string.indexOf(pattern, from);
	      return returnEnd && found > -1 ? found + pattern.length : found;
	    }
	    var m = pattern.exec(from ? string.slice(from) : string);
	    return m ? m.index + from + (returnEnd ? m[0].length : 0) : -1;
	  }

	  return {
	    startState: function() {
	      return {
	        outer: CodeMirror.startState(outer),
	        innerActive: null,
	        inner: null
	      };
	    },

	    copyState: function(state) {
	      return {
	        outer: CodeMirror.copyState(outer, state.outer),
	        innerActive: state.innerActive,
	        inner: state.innerActive && CodeMirror.copyState(state.innerActive.mode, state.inner)
	      };
	    },

	    token: function(stream, state) {
	      if (!state.innerActive) {
	        var cutOff = Infinity, oldContent = stream.string;
	        for (var i = 0; i < others.length; ++i) {
	          var other = others[i];
	          var found = indexOf(oldContent, other.open, stream.pos);
	          if (found == stream.pos) {
	            if (!other.parseDelimiters) { stream.match(other.open); }
	            state.innerActive = other;

	            // Get the outer indent, making sure to handle CodeMirror.Pass
	            var outerIndent = 0;
	            if (outer.indent) {
	              var possibleOuterIndent = outer.indent(state.outer, "");
	              if (possibleOuterIndent !== CodeMirror.Pass) { outerIndent = possibleOuterIndent; }
	            }

	            state.inner = CodeMirror.startState(other.mode, outerIndent);
	            return other.delimStyle && (other.delimStyle + " " + other.delimStyle + "-open");
	          } else if (found != -1 && found < cutOff) {
	            cutOff = found;
	          }
	        }
	        if (cutOff != Infinity) { stream.string = oldContent.slice(0, cutOff); }
	        var outerToken = outer.token(stream, state.outer);
	        if (cutOff != Infinity) { stream.string = oldContent; }
	        return outerToken;
	      } else {
	        var curInner = state.innerActive, oldContent = stream.string;
	        if (!curInner.close && stream.sol()) {
	          state.innerActive = state.inner = null;
	          return this.token(stream, state);
	        }
	        var found = curInner.close ? indexOf(oldContent, curInner.close, stream.pos, curInner.parseDelimiters) : -1;
	        if (found == stream.pos && !curInner.parseDelimiters) {
	          stream.match(curInner.close);
	          state.innerActive = state.inner = null;
	          return curInner.delimStyle && (curInner.delimStyle + " " + curInner.delimStyle + "-close");
	        }
	        if (found > -1) { stream.string = oldContent.slice(0, found); }
	        var innerToken = curInner.mode.token(stream, state.inner);
	        if (found > -1) { stream.string = oldContent; }

	        if (found == stream.pos && curInner.parseDelimiters)
	          { state.innerActive = state.inner = null; }

	        if (curInner.innerStyle) {
	          if (innerToken) { innerToken = innerToken + " " + curInner.innerStyle; }
	          else { innerToken = curInner.innerStyle; }
	        }

	        return innerToken;
	      }
	    },

	    indent: function(state, textAfter) {
	      var mode = state.innerActive ? state.innerActive.mode : outer;
	      if (!mode.indent) { return CodeMirror.Pass; }
	      return mode.indent(state.innerActive ? state.inner : state.outer, textAfter);
	    },

	    blankLine: function(state) {
	      var mode = state.innerActive ? state.innerActive.mode : outer;
	      if (mode.blankLine) {
	        mode.blankLine(state.innerActive ? state.inner : state.outer);
	      }
	      if (!state.innerActive) {
	        for (var i = 0; i < others.length; ++i) {
	          var other = others[i];
	          if (other.open === "\n") {
	            state.innerActive = other;
	            state.inner = CodeMirror.startState(other.mode, mode.indent ? mode.indent(state.outer, "") : 0);
	          }
	        }
	      } else if (state.innerActive.close === "\n") {
	        state.innerActive = state.inner = null;
	      }
	    },

	    electricChars: outer.electricChars,

	    innerMode: function(state) {
	      return state.inner ? {state: state.inner, mode: state.innerActive.mode} : {state: state.outer, mode: outer};
	    }
	  };
	};

	});
	});

	var handlebars = createCommonjsModule(function (module, exports) {
	// CodeMirror, copyright (c) by Marijn Haverbeke and others
	// Distributed under an MIT license: https://codemirror.net/LICENSE

	(function(mod) {
	  { mod(codemirror, simple, multiplex); }
	})(function(CodeMirror) {

	  CodeMirror.defineSimpleMode("handlebars-tags", {
	    start: [
	      { regex: /\{\{!--/, push: "dash_comment", token: "comment" },
	      { regex: /\{\{!/,   push: "comment", token: "comment" },
	      { regex: /\{\{/,    push: "handlebars", token: "tag" }
	    ],
	    handlebars: [
	      { regex: /\}\}/, pop: true, token: "tag" },

	      // Double and single quotes
	      { regex: /"(?:[^\\"]|\\.)*"?/, token: "string" },
	      { regex: /'(?:[^\\']|\\.)*'?/, token: "string" },

	      // Handlebars keywords
	      { regex: />|[#\/]([A-Za-z_]\w*)/, token: "keyword" },
	      { regex: /(?:else|this)\b/, token: "keyword" },

	      // Numeral
	      { regex: /\d+/i, token: "number" },

	      // Atoms like = and .
	      { regex: /=|~|@|true|false/, token: "atom" },

	      // Paths
	      { regex: /(?:\.\.\/)*(?:[A-Za-z_][\w\.]*)+/, token: "variable-2" }
	    ],
	    dash_comment: [
	      { regex: /--\}\}/, pop: true, token: "comment" },

	      // Commented code
	      { regex: /./, token: "comment"}
	    ],
	    comment: [
	      { regex: /\}\}/, pop: true, token: "comment" },
	      { regex: /./, token: "comment" }
	    ],
	    meta: {
	      blockCommentStart: "{{--",
	      blockCommentEnd: "--}}"
	    }
	  });

	  CodeMirror.defineMode("handlebars", function(config, parserConfig) {
	    var handlebars = CodeMirror.getMode(config, "handlebars-tags");
	    if (!parserConfig || !parserConfig.base) { return handlebars; }
	    return CodeMirror.multiplexingMode(
	      CodeMirror.getMode(config, parserConfig.base),
	      {open: "{{", close: "}}", mode: handlebars, parseDelimiters: true}
	    );
	  });

	  CodeMirror.defineMIME("text/x-handlebars-template", "handlebars");
	});
	});

	var vue = createCommonjsModule(function (module, exports) {
	// CodeMirror, copyright (c) by Marijn Haverbeke and others
	// Distributed under an MIT license: https://codemirror.net/LICENSE

	(function (mod) {
	  {// CommonJS
	    mod(codemirror,
	        overlay,
	        xml,
	        javascript,
	        coffeescript,
	        css$2,
	        sass,
	        stylus,
	        pug$1,
	        handlebars);
	  }
	})(function (CodeMirror) {
	  var tagLanguages = {
	    script: [
	      ["lang", /coffee(script)?/, "coffeescript"],
	      ["type", /^(?:text|application)\/(?:x-)?coffee(?:script)?$/, "coffeescript"],
	      ["lang", /^babel$/, "javascript"],
	      ["type", /^text\/babel$/, "javascript"],
	      ["type", /^text\/ecmascript-\d+$/, "javascript"]
	    ],
	    style: [
	      ["lang", /^stylus$/i, "stylus"],
	      ["lang", /^sass$/i, "sass"],
	      ["lang", /^less$/i, "text/x-less"],
	      ["lang", /^scss$/i, "text/x-scss"],
	      ["type", /^(text\/)?(x-)?styl(us)?$/i, "stylus"],
	      ["type", /^text\/sass/i, "sass"],
	      ["type", /^(text\/)?(x-)?scss$/i, "text/x-scss"],
	      ["type", /^(text\/)?(x-)?less$/i, "text/x-less"]
	    ],
	    template: [
	      ["lang", /^vue-template$/i, "vue"],
	      ["lang", /^pug$/i, "pug"],
	      ["lang", /^handlebars$/i, "handlebars"],
	      ["type", /^(text\/)?(x-)?pug$/i, "pug"],
	      ["type", /^text\/x-handlebars-template$/i, "handlebars"],
	      [null, null, "vue-template"]
	    ]
	  };

	  CodeMirror.defineMode("vue-template", function (config, parserConfig) {
	    var mustacheOverlay = {
	      token: function (stream) {
	        if (stream.match(/^\{\{.*?\}\}/)) { return "meta mustache"; }
	        while (stream.next() && !stream.match("{{", false)) {}
	        return null;
	      }
	    };
	    return CodeMirror.overlayMode(CodeMirror.getMode(config, parserConfig.backdrop || "text/html"), mustacheOverlay);
	  });

	  CodeMirror.defineMode("vue", function (config) {
	    return CodeMirror.getMode(config, {name: "htmlmixed", tags: tagLanguages});
	  }, "htmlmixed", "xml", "javascript", "coffeescript", "css", "sass", "stylus", "pug", "handlebars");

	  CodeMirror.defineMIME("script/x-vue", "vue");
	  CodeMirror.defineMIME("text/x-vue", "vue");
	});
	});

	var eslintLint = createCommonjsModule(function (module, exports) {
	// CodeMirror Lint addon to use ESLint, copyright (c) by Angelo ZERR and others
	// Distributed under an MIT license: http://codemirror.net/LICENSE

	// Depends on eslint.js from https://github.com/eslint/eslint

	//const Linter = require("eslint");
	//import { rules } from "eslint-plugin-vue";
	//var rules = require("eslint-plugin-vue");
	//console.log(rules);
	//const linter = new Linter();

	(function(mod) {
	  { mod(codemirror); }
	})(function(CodeMirror) {

	  function validator(text, options) {
	    if (window.linter == undefined) { return []; }

	    var result = [],
	      config =
	        window.linterDefaultConfig !== undefined
	          ? window.linterDefaultConfig
	          : {};
	    //var linter = new Linter();
	    //Objeto global window.linter carregado antes usando a nova lib eslint-browser que criei

	    var errors = window.linter.verify(text, config, { filename: "foo.js" });

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
	});

	var lint = createCommonjsModule(function (module, exports) {
	// CodeMirror, copyright (c) by Marijn Haverbeke and others
	// Distributed under an MIT license: https://codemirror.net/LICENSE

	(function(mod) {
	  { mod(codemirror); }
	})(function(CodeMirror) {
	  var GUTTER_ID = "CodeMirror-lint-markers";

	  function showTooltip(e, content) {
	    var tt = document.createElement("div");
	    tt.className = "CodeMirror-lint-tooltip";
	    tt.appendChild(content.cloneNode(true));
	    document.body.appendChild(tt);

	    function position(e) {
	      if (!tt.parentNode) { return CodeMirror.off(document, "mousemove", position); }
	      tt.style.top = Math.max(0, e.clientY - tt.offsetHeight - 5) + "px";
	      tt.style.left = (e.clientX + 5) + "px";
	    }
	    CodeMirror.on(document, "mousemove", position);
	    position(e);
	    if (tt.style.opacity != null) { tt.style.opacity = 1; }
	    return tt;
	  }
	  function rm(elt) {
	    if (elt.parentNode) { elt.parentNode.removeChild(elt); }
	  }
	  function hideTooltip(tt) {
	    if (!tt.parentNode) { return; }
	    if (tt.style.opacity == null) { rm(tt); }
	    tt.style.opacity = 0;
	    setTimeout(function() { rm(tt); }, 600);
	  }

	  function showTooltipFor(e, content, node) {
	    var tooltip = showTooltip(e, content);
	    function hide() {
	      CodeMirror.off(node, "mouseout", hide);
	      if (tooltip) { hideTooltip(tooltip); tooltip = null; }
	    }
	    var poll = setInterval(function() {
	      if (tooltip) { for (var n = node;; n = n.parentNode) {
	        if (n && n.nodeType == 11) { n = n.host; }
	        if (n == document.body) { return; }
	        if (!n) { hide(); break; }
	      } }
	      if (!tooltip) { return clearInterval(poll); }
	    }, 400);
	    CodeMirror.on(node, "mouseout", hide);
	  }

	  function LintState(cm, options, hasGutter) {
	    this.marked = [];
	    this.options = options;
	    this.timeout = null;
	    this.hasGutter = hasGutter;
	    this.onMouseOver = function(e) { onMouseOver(cm, e); };
	    this.waitingFor = 0;
	  }

	  function parseOptions(_cm, options) {
	    if (options instanceof Function) { return {getAnnotations: options}; }
	    if (!options || options === true) { options = {}; }
	    return options;
	  }

	  function clearMarks(cm) {
	    var state = cm.state.lint;
	    if (state.hasGutter) { cm.clearGutter(GUTTER_ID); }
	    for (var i = 0; i < state.marked.length; ++i)
	      { state.marked[i].clear(); }
	    state.marked.length = 0;
	  }

	  function makeMarker(labels, severity, multiple, tooltips) {
	    var marker = document.createElement("div"), inner = marker;
	    marker.className = "CodeMirror-lint-marker-" + severity;
	    if (multiple) {
	      inner = marker.appendChild(document.createElement("div"));
	      inner.className = "CodeMirror-lint-marker-multiple";
	    }

	    if (tooltips != false) { CodeMirror.on(inner, "mouseover", function(e) {
	      showTooltipFor(e, labels, inner);
	    }); }

	    return marker;
	  }

	  function getMaxSeverity(a, b) {
	    if (a == "error") { return a; }
	    else { return b; }
	  }

	  function groupByLine(annotations) {
	    var lines = [];
	    for (var i = 0; i < annotations.length; ++i) {
	      var ann = annotations[i], line = ann.from.line;
	      (lines[line] || (lines[line] = [])).push(ann);
	    }
	    return lines;
	  }

	  function annotationTooltip(ann) {
	    var severity = ann.severity;
	    if (!severity) { severity = "error"; }
	    var tip = document.createElement("div");
	    tip.className = "CodeMirror-lint-message-" + severity;
	    if (typeof ann.messageHTML != 'undefined') {
	        tip.innerHTML = ann.messageHTML;
	    } else {
	        tip.appendChild(document.createTextNode(ann.message));
	    }
	    return tip;
	  }

	  function lintAsync(cm, getAnnotations, passOptions) {
	    var state = cm.state.lint;
	    var id = ++state.waitingFor;
	    function abort() {
	      id = -1;
	      cm.off("change", abort);
	    }
	    cm.on("change", abort);
	    getAnnotations(cm.getValue(), function(annotations, arg2) {
	      cm.off("change", abort);
	      if (state.waitingFor != id) { return }
	      if (arg2 && annotations instanceof CodeMirror) { annotations = arg2; }
	      cm.operation(function() {updateLinting(cm, annotations);});
	    }, passOptions, cm);
	  }

	  function startLinting(cm) {
	    var state = cm.state.lint, options = state.options;
	    /*
	     * Passing rules in `options` property prevents JSHint (and other linters) from complaining
	     * about unrecognized rules like `onUpdateLinting`, `delay`, `lintOnChange`, etc.
	     */
	    var passOptions = options.options || options;
	    var getAnnotations = options.getAnnotations || cm.getHelper(CodeMirror.Pos(0, 0), "lint");
	    if (!getAnnotations) { return; }
	    if (options.async || getAnnotations.async) {
	      lintAsync(cm, getAnnotations, passOptions);
	    } else {
	      var annotations = getAnnotations(cm.getValue(), passOptions, cm);
	      if (!annotations) { return; }
	      if (annotations.then) { annotations.then(function(issues) {
	        cm.operation(function() {updateLinting(cm, issues);});
	      }); }
	      else { cm.operation(function() {updateLinting(cm, annotations);}); }
	    }
	  }

	  function updateLinting(cm, annotationsNotSorted) {
	    clearMarks(cm);
	    var state = cm.state.lint, options = state.options;

	    var annotations = groupByLine(annotationsNotSorted);

	    for (var line = 0; line < annotations.length; ++line) {
	      var anns = annotations[line];
	      if (!anns) { continue; }

	      var maxSeverity = null;
	      var tipLabel = state.hasGutter && document.createDocumentFragment();

	      for (var i = 0; i < anns.length; ++i) {
	        var ann = anns[i];
	        var severity = ann.severity;
	        if (!severity) { severity = "error"; }
	        maxSeverity = getMaxSeverity(maxSeverity, severity);

	        if (options.formatAnnotation) { ann = options.formatAnnotation(ann); }
	        if (state.hasGutter) { tipLabel.appendChild(annotationTooltip(ann)); }

	        if (ann.to) { state.marked.push(cm.markText(ann.from, ann.to, {
	          className: "CodeMirror-lint-mark-" + severity,
	          __annotation: ann
	        })); }
	      }

	      if (state.hasGutter)
	        { cm.setGutterMarker(line, GUTTER_ID, makeMarker(tipLabel, maxSeverity, anns.length > 1,
	                                                       state.options.tooltips)); }
	    }
	    if (options.onUpdateLinting) { options.onUpdateLinting(annotationsNotSorted, annotations, cm); }
	  }

	  function onChange(cm) {
	    var state = cm.state.lint;
	    if (!state) { return; }
	    clearTimeout(state.timeout);
	    state.timeout = setTimeout(function(){startLinting(cm);}, state.options.delay || 500);
	  }

	  function popupTooltips(annotations, e) {
	    var target = e.target || e.srcElement;
	    var tooltip = document.createDocumentFragment();
	    for (var i = 0; i < annotations.length; i++) {
	      var ann = annotations[i];
	      tooltip.appendChild(annotationTooltip(ann));
	    }
	    showTooltipFor(e, tooltip, target);
	  }

	  function onMouseOver(cm, e) {
	    var target = e.target || e.srcElement;
	    if (!/\bCodeMirror-lint-mark-/.test(target.className)) { return; }
	    var box = target.getBoundingClientRect(), x = (box.left + box.right) / 2, y = (box.top + box.bottom) / 2;
	    var spans = cm.findMarksAt(cm.coordsChar({left: x, top: y}, "client"));

	    var annotations = [];
	    for (var i = 0; i < spans.length; ++i) {
	      var ann = spans[i].__annotation;
	      if (ann) { annotations.push(ann); }
	    }
	    if (annotations.length) { popupTooltips(annotations, e); }
	  }

	  CodeMirror.defineOption("lint", false, function(cm, val, old) {
	    if (old && old != CodeMirror.Init) {
	      clearMarks(cm);
	      if (cm.state.lint.options.lintOnChange !== false)
	        { cm.off("change", onChange); }
	      CodeMirror.off(cm.getWrapperElement(), "mouseover", cm.state.lint.onMouseOver);
	      clearTimeout(cm.state.lint.timeout);
	      delete cm.state.lint;
	    }

	    if (val) {
	      var gutters = cm.getOption("gutters"), hasLintGutter = false;
	      for (var i = 0; i < gutters.length; ++i) { if (gutters[i] == GUTTER_ID) { hasLintGutter = true; } }
	      var state = cm.state.lint = new LintState(cm, parseOptions(cm, val), hasLintGutter);
	      if (state.options.lintOnChange !== false)
	        { cm.on("change", onChange); }
	      if (state.options.tooltips != false && state.options.tooltips != "gutter")
	        { CodeMirror.on(cm.getWrapperElement(), "mouseover", state.onMouseOver); }

	      startLinting(cm);
	    }
	  });

	  CodeMirror.defineExtension("performLint", function() {
	    if (this.state.lint) { startLinting(this); }
	  });
	});
	});

	var searchcursor = createCommonjsModule(function (module, exports) {
	// CodeMirror, copyright (c) by Marijn Haverbeke and others
	// Distributed under an MIT license: https://codemirror.net/LICENSE

	(function(mod) {
	  { mod(codemirror); }
	})(function(CodeMirror) {
	  var Pos = CodeMirror.Pos;

	  function regexpFlags(regexp) {
	    var flags = regexp.flags;
	    return flags != null ? flags : (regexp.ignoreCase ? "i" : "")
	      + (regexp.global ? "g" : "")
	      + (regexp.multiline ? "m" : "")
	  }

	  function ensureFlags(regexp, flags) {
	    var current = regexpFlags(regexp), target = current;
	    for (var i = 0; i < flags.length; i++) { if (target.indexOf(flags.charAt(i)) == -1)
	      { target += flags.charAt(i); } }
	    return current == target ? regexp : new RegExp(regexp.source, target)
	  }

	  function maybeMultiline(regexp) {
	    return /\\s|\\n|\n|\\W|\\D|\[\^/.test(regexp.source)
	  }

	  function searchRegexpForward(doc, regexp, start) {
	    regexp = ensureFlags(regexp, "g");
	    for (var line = start.line, ch = start.ch, last = doc.lastLine(); line <= last; line++, ch = 0) {
	      regexp.lastIndex = ch;
	      var string = doc.getLine(line), match = regexp.exec(string);
	      if (match)
	        { return {from: Pos(line, match.index),
	                to: Pos(line, match.index + match[0].length),
	                match: match} }
	    }
	  }

	  function searchRegexpForwardMultiline(doc, regexp, start) {
	    if (!maybeMultiline(regexp)) { return searchRegexpForward(doc, regexp, start) }

	    regexp = ensureFlags(regexp, "gm");
	    var string, chunk = 1;
	    for (var line = start.line, last = doc.lastLine(); line <= last;) {
	      // This grows the search buffer in exponentially-sized chunks
	      // between matches, so that nearby matches are fast and don't
	      // require concatenating the whole document (in case we're
	      // searching for something that has tons of matches), but at the
	      // same time, the amount of retries is limited.
	      for (var i = 0; i < chunk; i++) {
	        if (line > last) { break }
	        var curLine = doc.getLine(line++);
	        string = string == null ? curLine : string + "\n" + curLine;
	      }
	      chunk = chunk * 2;
	      regexp.lastIndex = start.ch;
	      var match = regexp.exec(string);
	      if (match) {
	        var before = string.slice(0, match.index).split("\n"), inside = match[0].split("\n");
	        var startLine = start.line + before.length - 1, startCh = before[before.length - 1].length;
	        return {from: Pos(startLine, startCh),
	                to: Pos(startLine + inside.length - 1,
	                        inside.length == 1 ? startCh + inside[0].length : inside[inside.length - 1].length),
	                match: match}
	      }
	    }
	  }

	  function lastMatchIn(string, regexp) {
	    var cutOff = 0, match;
	    for (;;) {
	      regexp.lastIndex = cutOff;
	      var newMatch = regexp.exec(string);
	      if (!newMatch) { return match }
	      match = newMatch;
	      cutOff = match.index + (match[0].length || 1);
	      if (cutOff == string.length) { return match }
	    }
	  }

	  function searchRegexpBackward(doc, regexp, start) {
	    regexp = ensureFlags(regexp, "g");
	    for (var line = start.line, ch = start.ch, first = doc.firstLine(); line >= first; line--, ch = -1) {
	      var string = doc.getLine(line);
	      if (ch > -1) { string = string.slice(0, ch); }
	      var match = lastMatchIn(string, regexp);
	      if (match)
	        { return {from: Pos(line, match.index),
	                to: Pos(line, match.index + match[0].length),
	                match: match} }
	    }
	  }

	  function searchRegexpBackwardMultiline(doc, regexp, start) {
	    regexp = ensureFlags(regexp, "gm");
	    var string, chunk = 1;
	    for (var line = start.line, first = doc.firstLine(); line >= first;) {
	      for (var i = 0; i < chunk; i++) {
	        var curLine = doc.getLine(line--);
	        string = string == null ? curLine.slice(0, start.ch) : curLine + "\n" + string;
	      }
	      chunk *= 2;

	      var match = lastMatchIn(string, regexp);
	      if (match) {
	        var before = string.slice(0, match.index).split("\n"), inside = match[0].split("\n");
	        var startLine = line + before.length, startCh = before[before.length - 1].length;
	        return {from: Pos(startLine, startCh),
	                to: Pos(startLine + inside.length - 1,
	                        inside.length == 1 ? startCh + inside[0].length : inside[inside.length - 1].length),
	                match: match}
	      }
	    }
	  }

	  var doFold, noFold;
	  if (String.prototype.normalize) {
	    doFold = function(str) { return str.normalize("NFD").toLowerCase() };
	    noFold = function(str) { return str.normalize("NFD") };
	  } else {
	    doFold = function(str) { return str.toLowerCase() };
	    noFold = function(str) { return str };
	  }

	  // Maps a position in a case-folded line back to a position in the original line
	  // (compensating for codepoints increasing in number during folding)
	  function adjustPos(orig, folded, pos, foldFunc) {
	    if (orig.length == folded.length) { return pos }
	    for (var min = 0, max = pos + Math.max(0, orig.length - folded.length);;) {
	      if (min == max) { return min }
	      var mid = (min + max) >> 1;
	      var len = foldFunc(orig.slice(0, mid)).length;
	      if (len == pos) { return mid }
	      else if (len > pos) { max = mid; }
	      else { min = mid + 1; }
	    }
	  }

	  function searchStringForward(doc, query, start, caseFold) {
	    // Empty string would match anything and never progress, so we
	    // define it to match nothing instead.
	    if (!query.length) { return null }
	    var fold = caseFold ? doFold : noFold;
	    var lines = fold(query).split(/\r|\n\r?/);

	    search: for (var line = start.line, ch = start.ch, last = doc.lastLine() + 1 - lines.length; line <= last; line++, ch = 0) {
	      var orig = doc.getLine(line).slice(ch), string = fold(orig);
	      if (lines.length == 1) {
	        var found = string.indexOf(lines[0]);
	        if (found == -1) { continue search }
	        var start = adjustPos(orig, string, found, fold) + ch;
	        return {from: Pos(line, adjustPos(orig, string, found, fold) + ch),
	                to: Pos(line, adjustPos(orig, string, found + lines[0].length, fold) + ch)}
	      } else {
	        var cutFrom = string.length - lines[0].length;
	        if (string.slice(cutFrom) != lines[0]) { continue search }
	        for (var i = 1; i < lines.length - 1; i++)
	          { if (fold(doc.getLine(line + i)) != lines[i]) { continue search } }
	        var end = doc.getLine(line + lines.length - 1), endString = fold(end), lastLine = lines[lines.length - 1];
	        if (endString.slice(0, lastLine.length) != lastLine) { continue search }
	        return {from: Pos(line, adjustPos(orig, string, cutFrom, fold) + ch),
	                to: Pos(line + lines.length - 1, adjustPos(end, endString, lastLine.length, fold))}
	      }
	    }
	  }

	  function searchStringBackward(doc, query, start, caseFold) {
	    if (!query.length) { return null }
	    var fold = caseFold ? doFold : noFold;
	    var lines = fold(query).split(/\r|\n\r?/);

	    search: for (var line = start.line, ch = start.ch, first = doc.firstLine() - 1 + lines.length; line >= first; line--, ch = -1) {
	      var orig = doc.getLine(line);
	      if (ch > -1) { orig = orig.slice(0, ch); }
	      var string = fold(orig);
	      if (lines.length == 1) {
	        var found = string.lastIndexOf(lines[0]);
	        if (found == -1) { continue search }
	        return {from: Pos(line, adjustPos(orig, string, found, fold)),
	                to: Pos(line, adjustPos(orig, string, found + lines[0].length, fold))}
	      } else {
	        var lastLine = lines[lines.length - 1];
	        if (string.slice(0, lastLine.length) != lastLine) { continue search }
	        for (var i = 1, start = line - lines.length + 1; i < lines.length - 1; i++)
	          { if (fold(doc.getLine(start + i)) != lines[i]) { continue search } }
	        var top = doc.getLine(line + 1 - lines.length), topString = fold(top);
	        if (topString.slice(topString.length - lines[0].length) != lines[0]) { continue search }
	        return {from: Pos(line + 1 - lines.length, adjustPos(top, topString, top.length - lines[0].length, fold)),
	                to: Pos(line, adjustPos(orig, string, lastLine.length, fold))}
	      }
	    }
	  }

	  function SearchCursor(doc, query, pos, options) {
	    this.atOccurrence = false;
	    this.doc = doc;
	    pos = pos ? doc.clipPos(pos) : Pos(0, 0);
	    this.pos = {from: pos, to: pos};

	    var caseFold;
	    if (typeof options == "object") {
	      caseFold = options.caseFold;
	    } else { // Backwards compat for when caseFold was the 4th argument
	      caseFold = options;
	      options = null;
	    }

	    if (typeof query == "string") {
	      if (caseFold == null) { caseFold = false; }
	      this.matches = function(reverse, pos) {
	        return (reverse ? searchStringBackward : searchStringForward)(doc, query, pos, caseFold)
	      };
	    } else {
	      query = ensureFlags(query, "gm");
	      if (!options || options.multiline !== false)
	        { this.matches = function(reverse, pos) {
	          return (reverse ? searchRegexpBackwardMultiline : searchRegexpForwardMultiline)(doc, query, pos)
	        }; }
	      else
	        { this.matches = function(reverse, pos) {
	          return (reverse ? searchRegexpBackward : searchRegexpForward)(doc, query, pos)
	        }; }
	    }
	  }

	  SearchCursor.prototype = {
	    findNext: function() {return this.find(false)},
	    findPrevious: function() {return this.find(true)},

	    find: function(reverse) {
	      var result = this.matches(reverse, this.doc.clipPos(reverse ? this.pos.from : this.pos.to));

	      // Implements weird auto-growing behavior on null-matches for
	      // backwards-compatiblity with the vim code (unfortunately)
	      while (result && CodeMirror.cmpPos(result.from, result.to) == 0) {
	        if (reverse) {
	          if (result.from.ch) { result.from = Pos(result.from.line, result.from.ch - 1); }
	          else if (result.from.line == this.doc.firstLine()) { result = null; }
	          else { result = this.matches(reverse, this.doc.clipPos(Pos(result.from.line - 1))); }
	        } else {
	          if (result.to.ch < this.doc.getLine(result.to.line).length) { result.to = Pos(result.to.line, result.to.ch + 1); }
	          else if (result.to.line == this.doc.lastLine()) { result = null; }
	          else { result = this.matches(reverse, Pos(result.to.line + 1, 0)); }
	        }
	      }

	      if (result) {
	        this.pos = result;
	        this.atOccurrence = true;
	        return this.pos.match || true
	      } else {
	        var end = Pos(reverse ? this.doc.firstLine() : this.doc.lastLine() + 1, 0);
	        this.pos = {from: end, to: end};
	        return this.atOccurrence = false
	      }
	    },

	    from: function() {if (this.atOccurrence) { return this.pos.from }},
	    to: function() {if (this.atOccurrence) { return this.pos.to }},

	    replace: function(newText, origin) {
	      if (!this.atOccurrence) { return }
	      var lines = CodeMirror.splitLines(newText);
	      this.doc.replaceRange(lines, this.pos.from, this.pos.to, origin);
	      this.pos.to = Pos(this.pos.from.line + lines.length - 1,
	                        lines[lines.length - 1].length + (lines.length == 1 ? this.pos.from.ch : 0));
	    }
	  };

	  CodeMirror.defineExtension("getSearchCursor", function(query, pos, caseFold) {
	    return new SearchCursor(this.doc, query, pos, caseFold)
	  });
	  CodeMirror.defineDocExtension("getSearchCursor", function(query, pos, caseFold) {
	    return new SearchCursor(this, query, pos, caseFold)
	  });

	  CodeMirror.defineExtension("selectMatches", function(query, caseFold) {
	    var ranges = [];
	    var cur = this.getSearchCursor(query, this.getCursor("from"), caseFold);
	    while (cur.findNext()) {
	      if (CodeMirror.cmpPos(cur.to(), this.getCursor("to")) > 0) { break }
	      ranges.push({anchor: cur.from(), head: cur.to()});
	    }
	    if (ranges.length)
	      { this.setSelections(ranges, 0); }
	  });
	});
	});

	var dialog = createCommonjsModule(function (module, exports) {
	// CodeMirror, copyright (c) by Marijn Haverbeke and others
	// Distributed under an MIT license: https://codemirror.net/LICENSE

	// Open simple dialogs on top of an editor. Relies on dialog.css.

	(function(mod) {
	  { mod(codemirror); }
	})(function(CodeMirror) {
	  function dialogDiv(cm, template, bottom) {
	    var wrap = cm.getWrapperElement();
	    var dialog;
	    dialog = wrap.appendChild(document.createElement("div"));
	    if (bottom)
	      { dialog.className = "CodeMirror-dialog CodeMirror-dialog-bottom"; }
	    else
	      { dialog.className = "CodeMirror-dialog CodeMirror-dialog-top"; }

	    if (typeof template == "string") {
	      dialog.innerHTML = template;
	    } else { // Assuming it's a detached DOM element.
	      dialog.appendChild(template);
	    }
	    CodeMirror.addClass(wrap, 'dialog-opened');
	    return dialog;
	  }

	  function closeNotification(cm, newVal) {
	    if (cm.state.currentNotificationClose)
	      { cm.state.currentNotificationClose(); }
	    cm.state.currentNotificationClose = newVal;
	  }

	  CodeMirror.defineExtension("openDialog", function(template, callback, options) {
	    if (!options) { options = {}; }

	    closeNotification(this, null);

	    var dialog = dialogDiv(this, template, options.bottom);
	    var closed = false, me = this;
	    function close(newVal) {
	      if (typeof newVal == 'string') {
	        inp.value = newVal;
	      } else {
	        if (closed) { return; }
	        closed = true;
	        CodeMirror.rmClass(dialog.parentNode, 'dialog-opened');
	        dialog.parentNode.removeChild(dialog);
	        me.focus();

	        if (options.onClose) { options.onClose(dialog); }
	      }
	    }

	    var inp = dialog.getElementsByTagName("input")[0], button;
	    if (inp) {
	      inp.focus();

	      if (options.value) {
	        inp.value = options.value;
	        if (options.selectValueOnOpen !== false) {
	          inp.select();
	        }
	      }

	      if (options.onInput)
	        { CodeMirror.on(inp, "input", function(e) { options.onInput(e, inp.value, close);}); }
	      if (options.onKeyUp)
	        { CodeMirror.on(inp, "keyup", function(e) {options.onKeyUp(e, inp.value, close);}); }

	      CodeMirror.on(inp, "keydown", function(e) {
	        if (options && options.onKeyDown && options.onKeyDown(e, inp.value, close)) { return; }
	        if (e.keyCode == 27 || (options.closeOnEnter !== false && e.keyCode == 13)) {
	          inp.blur();
	          CodeMirror.e_stop(e);
	          close();
	        }
	        if (e.keyCode == 13) { callback(inp.value, e); }
	      });

	      if (options.closeOnBlur !== false) { CodeMirror.on(inp, "blur", close); }
	    } else if (button = dialog.getElementsByTagName("button")[0]) {
	      CodeMirror.on(button, "click", function() {
	        close();
	        me.focus();
	      });

	      if (options.closeOnBlur !== false) { CodeMirror.on(button, "blur", close); }

	      button.focus();
	    }
	    return close;
	  });

	  CodeMirror.defineExtension("openConfirm", function(template, callbacks, options) {
	    closeNotification(this, null);
	    var dialog = dialogDiv(this, template, options && options.bottom);
	    var buttons = dialog.getElementsByTagName("button");
	    var closed = false, me = this, blurring = 1;
	    function close() {
	      if (closed) { return; }
	      closed = true;
	      CodeMirror.rmClass(dialog.parentNode, 'dialog-opened');
	      dialog.parentNode.removeChild(dialog);
	      me.focus();
	    }
	    buttons[0].focus();
	    for (var i = 0; i < buttons.length; ++i) {
	      var b = buttons[i];
	      (function(callback) {
	        CodeMirror.on(b, "click", function(e) {
	          CodeMirror.e_preventDefault(e);
	          close();
	          if (callback) { callback(me); }
	        });
	      })(callbacks[i]);
	      CodeMirror.on(b, "blur", function() {
	        --blurring;
	        setTimeout(function() { if (blurring <= 0) { close(); } }, 200);
	      });
	      CodeMirror.on(b, "focus", function() { ++blurring; });
	    }
	  });

	  /*
	   * openNotification
	   * Opens a notification, that can be closed with an optional timer
	   * (default 5000ms timer) and always closes on click.
	   *
	   * If a notification is opened while another is opened, it will close the
	   * currently opened one and open the new one immediately.
	   */
	  CodeMirror.defineExtension("openNotification", function(template, options) {
	    closeNotification(this, close);
	    var dialog = dialogDiv(this, template, options && options.bottom);
	    var closed = false, doneTimer;
	    var duration = options && typeof options.duration !== "undefined" ? options.duration : 5000;

	    function close() {
	      if (closed) { return; }
	      closed = true;
	      clearTimeout(doneTimer);
	      CodeMirror.rmClass(dialog.parentNode, 'dialog-opened');
	      dialog.parentNode.removeChild(dialog);
	    }

	    CodeMirror.on(dialog, 'click', function(e) {
	      CodeMirror.e_preventDefault(e);
	      close();
	    });

	    if (duration)
	      { doneTimer = setTimeout(close, duration); }

	    return close;
	  });
	});
	});

	var search$1 = createCommonjsModule(function (module, exports) {
	// CodeMirror, copyright (c) by Marijn Haverbeke and others
	// Distributed under an MIT license: https://codemirror.net/LICENSE

	// Define search commands. Depends on dialog.js or another
	// implementation of the openDialog method.

	// Replace works a little oddly -- it will do the replace on the next
	// Ctrl-G (or whatever is bound to findNext) press. You prevent a
	// replace by making sure the match is no longer selected when hitting
	// Ctrl-G.

	(function(mod) {
	  { mod(codemirror, searchcursor, dialog); }
	})(function(CodeMirror) {

	  function searchOverlay(query, caseInsensitive) {
	    if (typeof query == "string")
	      { query = new RegExp(query.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&"), caseInsensitive ? "gi" : "g"); }
	    else if (!query.global)
	      { query = new RegExp(query.source, query.ignoreCase ? "gi" : "g"); }

	    return {token: function(stream) {
	      query.lastIndex = stream.pos;
	      var match = query.exec(stream.string);
	      if (match && match.index == stream.pos) {
	        stream.pos += match[0].length || 1;
	        return "searching";
	      } else if (match) {
	        stream.pos = match.index;
	      } else {
	        stream.skipToEnd();
	      }
	    }};
	  }

	  function SearchState() {
	    this.posFrom = this.posTo = this.lastQuery = this.query = null;
	    this.overlay = null;
	  }

	  function getSearchState(cm) {
	    return cm.state.search || (cm.state.search = new SearchState());
	  }

	  function queryCaseInsensitive(query) {
	    return typeof query == "string" && query == query.toLowerCase();
	  }

	  function getSearchCursor(cm, query, pos) {
	    // Heuristic: if the query string is all lowercase, do a case insensitive search.
	    return cm.getSearchCursor(query, pos, {caseFold: queryCaseInsensitive(query), multiline: true});
	  }

	  function persistentDialog(cm, text, deflt, onEnter, onKeyDown) {
	    cm.openDialog(text, onEnter, {
	      value: deflt,
	      selectValueOnOpen: true,
	      closeOnEnter: false,
	      onClose: function() { clearSearch(cm); },
	      onKeyDown: onKeyDown
	    });
	  }

	  function dialog$$1(cm, text, shortText, deflt, f) {
	    if (cm.openDialog) { cm.openDialog(text, f, {value: deflt, selectValueOnOpen: true}); }
	    else { f(prompt(shortText, deflt)); }
	  }

	  function confirmDialog(cm, text, shortText, fs) {
	    if (cm.openConfirm) { cm.openConfirm(text, fs); }
	    else if (confirm(shortText)) { fs[0](); }
	  }

	  function parseString(string) {
	    return string.replace(/\\(.)/g, function(_, ch) {
	      if (ch == "n") { return "\n" }
	      if (ch == "r") { return "\r" }
	      return ch
	    })
	  }

	  function parseQuery(query) {
	    var isRE = query.match(/^\/(.*)\/([a-z]*)$/);
	    if (isRE) {
	      try { query = new RegExp(isRE[1], isRE[2].indexOf("i") == -1 ? "" : "i"); }
	      catch(e) {} // Not a regular expression after all, do a string search
	    } else {
	      query = parseString(query);
	    }
	    if (typeof query == "string" ? query == "" : query.test(""))
	      { query = /x^/; }
	    return query;
	  }

	  function startSearch(cm, state, query) {
	    state.queryText = query;
	    state.query = parseQuery(query);
	    cm.removeOverlay(state.overlay, queryCaseInsensitive(state.query));
	    state.overlay = searchOverlay(state.query, queryCaseInsensitive(state.query));
	    cm.addOverlay(state.overlay);
	    if (cm.showMatchesOnScrollbar) {
	      if (state.annotate) { state.annotate.clear(); state.annotate = null; }
	      state.annotate = cm.showMatchesOnScrollbar(state.query, queryCaseInsensitive(state.query));
	    }
	  }

	  function doSearch(cm, rev, persistent, immediate) {
	    var state = getSearchState(cm);
	    if (state.query) { return findNext(cm, rev); }
	    var q = cm.getSelection() || state.lastQuery;
	    if (q instanceof RegExp && q.source == "x^") { q = null; }
	    if (persistent && cm.openDialog) {
	      var hiding = null;
	      var searchNext = function(query, event) {
	        CodeMirror.e_stop(event);
	        if (!query) { return; }
	        if (query != state.queryText) {
	          startSearch(cm, state, query);
	          state.posFrom = state.posTo = cm.getCursor();
	        }
	        if (hiding) { hiding.style.opacity = 1; }
	        findNext(cm, event.shiftKey, function(_, to) {
	          var dialog$$1;
	          if (to.line < 3 && document.querySelector &&
	              (dialog$$1 = cm.display.wrapper.querySelector(".CodeMirror-dialog")) &&
	              dialog$$1.getBoundingClientRect().bottom - 4 > cm.cursorCoords(to, "window").top)
	            { (hiding = dialog$$1).style.opacity = .4; }
	        });
	      };
	      persistentDialog(cm, getQueryDialog(cm), q, searchNext, function(event, query) {
	        var keyName = CodeMirror.keyName(event);
	        var extra = cm.getOption('extraKeys'), cmd = (extra && extra[keyName]) || CodeMirror.keyMap[cm.getOption("keyMap")][keyName];
	        if (cmd == "findNext" || cmd == "findPrev" ||
	          cmd == "findPersistentNext" || cmd == "findPersistentPrev") {
	          CodeMirror.e_stop(event);
	          startSearch(cm, getSearchState(cm), query);
	          cm.execCommand(cmd);
	        } else if (cmd == "find" || cmd == "findPersistent") {
	          CodeMirror.e_stop(event);
	          searchNext(query, event);
	        }
	      });
	      if (immediate && q) {
	        startSearch(cm, state, q);
	        findNext(cm, rev);
	      }
	    } else {
	      dialog$$1(cm, getQueryDialog(cm), "Search for:", q, function(query) {
	        if (query && !state.query) { cm.operation(function() {
	          startSearch(cm, state, query);
	          state.posFrom = state.posTo = cm.getCursor();
	          findNext(cm, rev);
	        }); }
	      });
	    }
	  }

	  function findNext(cm, rev, callback) {cm.operation(function() {
	    var state = getSearchState(cm);
	    var cursor = getSearchCursor(cm, state.query, rev ? state.posFrom : state.posTo);
	    if (!cursor.find(rev)) {
	      cursor = getSearchCursor(cm, state.query, rev ? CodeMirror.Pos(cm.lastLine()) : CodeMirror.Pos(cm.firstLine(), 0));
	      if (!cursor.find(rev)) { return; }
	    }
	    cm.setSelection(cursor.from(), cursor.to());
	    cm.scrollIntoView({from: cursor.from(), to: cursor.to()}, 20);
	    state.posFrom = cursor.from(); state.posTo = cursor.to();
	    if (callback) { callback(cursor.from(), cursor.to()); }
	  });}

	  function clearSearch(cm) {cm.operation(function() {
	    var state = getSearchState(cm);
	    state.lastQuery = state.query;
	    if (!state.query) { return; }
	    state.query = state.queryText = null;
	    cm.removeOverlay(state.overlay);
	    if (state.annotate) { state.annotate.clear(); state.annotate = null; }
	  });}


	  function getQueryDialog(cm)  {
	    return '<span class="CodeMirror-search-label">' + cm.phrase("Search:") + '</span> <input type="text" style="width: 10em" class="CodeMirror-search-field"/> <span style="color: #888" class="CodeMirror-search-hint">' + cm.phrase("(Use /re/ syntax for regexp search)") + '</span>';
	  }
	  function getReplaceQueryDialog(cm) {
	    return ' <input type="text" style="width: 10em" class="CodeMirror-search-field"/> <span style="color: #888" class="CodeMirror-search-hint">' + cm.phrase("(Use /re/ syntax for regexp search)") + '</span>';
	  }
	  function getReplacementQueryDialog(cm) {
	    return '<span class="CodeMirror-search-label">' + cm.phrase("With:") + '</span> <input type="text" style="width: 10em" class="CodeMirror-search-field"/>';
	  }
	  function getDoReplaceConfirm(cm) {
	    return '<span class="CodeMirror-search-label">' + cm.phrase("Replace?") + '</span> <button>' + cm.phrase("Yes") + '</button> <button>' + cm.phrase("No") + '</button> <button>' + cm.phrase("All") + '</button> <button>' + cm.phrase("Stop") + '</button> ';
	  }

	  function replaceAll(cm, query, text) {
	    cm.operation(function() {
	      for (var cursor = getSearchCursor(cm, query); cursor.findNext();) {
	        if (typeof query != "string") {
	          var match = cm.getRange(cursor.from(), cursor.to()).match(query);
	          cursor.replace(text.replace(/\$(\d)/g, function(_, i) {return match[i];}));
	        } else { cursor.replace(text); }
	      }
	    });
	  }

	  function replace(cm, all) {
	    if (cm.getOption("readOnly")) { return; }
	    var query = cm.getSelection() || getSearchState(cm).lastQuery;
	    var dialogText = '<span class="CodeMirror-search-label">' + (all ? cm.phrase("Replace all:") : cm.phrase("Replace:")) + '</span>';
	    dialog$$1(cm, dialogText + getReplaceQueryDialog(cm), dialogText, query, function(query) {
	      if (!query) { return; }
	      query = parseQuery(query);
	      dialog$$1(cm, getReplacementQueryDialog(cm), cm.phrase("Replace with:"), "", function(text) {
	        text = parseString(text);
	        if (all) {
	          replaceAll(cm, query, text);
	        } else {
	          clearSearch(cm);
	          var cursor = getSearchCursor(cm, query, cm.getCursor("from"));
	          var advance = function() {
	            var start = cursor.from(), match;
	            if (!(match = cursor.findNext())) {
	              cursor = getSearchCursor(cm, query);
	              if (!(match = cursor.findNext()) ||
	                  (start && cursor.from().line == start.line && cursor.from().ch == start.ch)) { return; }
	            }
	            cm.setSelection(cursor.from(), cursor.to());
	            cm.scrollIntoView({from: cursor.from(), to: cursor.to()});
	            confirmDialog(cm, getDoReplaceConfirm(cm), cm.phrase("Replace?"),
	                          [function() {doReplace(match);}, advance,
	                           function() {replaceAll(cm, query, text);}]);
	          };
	          var doReplace = function(match) {
	            cursor.replace(typeof query == "string" ? text :
	                           text.replace(/\$(\d)/g, function(_, i) {return match[i];}));
	            advance();
	          };
	          advance();
	        }
	      });
	    });
	  }

	  CodeMirror.commands.find = function(cm) {clearSearch(cm); doSearch(cm);};
	  CodeMirror.commands.findPersistent = function(cm) {clearSearch(cm); doSearch(cm, false, true);};
	  CodeMirror.commands.findPersistentNext = function(cm) {doSearch(cm, false, true, true);};
	  CodeMirror.commands.findPersistentPrev = function(cm) {doSearch(cm, true, true, true);};
	  CodeMirror.commands.findNext = doSearch;
	  CodeMirror.commands.findPrev = function(cm) {doSearch(cm, true);};
	  CodeMirror.commands.clearSearch = clearSearch;
	  CodeMirror.commands.replace = replace;
	  CodeMirror.commands.replaceAll = function(cm) {replace(cm, true);};
	});
	});

	var jumpToLine = createCommonjsModule(function (module, exports) {
	// CodeMirror, copyright (c) by Marijn Haverbeke and others
	// Distributed under an MIT license: https://codemirror.net/LICENSE

	// Defines jumpToLine command. Uses dialog.js if present.

	(function(mod) {
	  { mod(codemirror, dialog); }
	})(function(CodeMirror) {

	  function dialog$$1(cm, text, shortText, deflt, f) {
	    if (cm.openDialog) { cm.openDialog(text, f, {value: deflt, selectValueOnOpen: true}); }
	    else { f(prompt(shortText, deflt)); }
	  }

	  function getJumpDialog(cm) {
	    return cm.phrase("Jump to line:") + ' <input type="text" style="width: 10em" class="CodeMirror-search-field"/> <span style="color: #888" class="CodeMirror-search-hint">' + cm.phrase("(Use line:column or scroll% syntax)") + '</span>';
	  }

	  function interpretLine(cm, string) {
	    var num = Number(string);
	    if (/^[-+]/.test(string)) { return cm.getCursor().line + num }
	    else { return num - 1 }
	  }

	  CodeMirror.commands.jumpToLine = function(cm) {
	    var cur = cm.getCursor();
	    dialog$$1(cm, getJumpDialog(cm), cm.phrase("Jump to line:"), (cur.line + 1) + ":" + cur.ch, function(posStr) {
	      if (!posStr) { return; }

	      var match;
	      if (match = /^\s*([\+\-]?\d+)\s*\:\s*(\d+)\s*$/.exec(posStr)) {
	        cm.setCursor(interpretLine(cm, match[1]), Number(match[2]));
	      } else if (match = /^\s*([\+\-]?\d+(\.\d+)?)\%\s*/.exec(posStr)) {
	        var line = Math.round(cm.lineCount() * Number(match[1]) / 100);
	        if (/^[-+]/.test(match[1])) { line = cur.line + line + 1; }
	        cm.setCursor(line - 1, cur.ch);
	      } else if (match = /^\s*\:?\s*([\+\-]?\d+)\s*/.exec(posStr)) {
	        cm.setCursor(interpretLine(cm, match[1]), cur.ch);
	      }
	    });
	  };

	  CodeMirror.keyMap["default"]["Alt-G"] = "jumpToLine";
	});
	});

	/* eslint-disable no-undefined,no-param-reassign,no-shadow */

	/**
	 * Throttle execution of a function. Especially useful for rate limiting
	 * execution of handlers on events like resize and scroll.
	 *
	 * @param  {Number}    delay          A zero-or-greater delay in milliseconds. For event callbacks, values around 100 or 250 (or even higher) are most useful.
	 * @param  {Boolean}   [noTrailing]   Optional, defaults to false. If noTrailing is true, callback will only execute every `delay` milliseconds while the
	 *                                    throttled-function is being called. If noTrailing is false or unspecified, callback will be executed one final time
	 *                                    after the last throttled-function call. (After the throttled-function has not been called for `delay` milliseconds,
	 *                                    the internal counter is reset)
	 * @param  {Function}  callback       A function to be executed after delay milliseconds. The `this` context and all arguments are passed through, as-is,
	 *                                    to `callback` when the throttled-function is executed.
	 * @param  {Boolean}   [debounceMode] If `debounceMode` is true (at begin), schedule `clear` to execute after `delay` ms. If `debounceMode` is false (at end),
	 *                                    schedule `callback` to execute after `delay` ms.
	 *
	 * @return {Function}  A new, throttled, function.
	 */
	function throttle ( delay, noTrailing, callback, debounceMode ) {

		/*
		 * After wrapper has stopped being called, this timeout ensures that
		 * `callback` is executed at the proper times in `throttle` and `end`
		 * debounce modes.
		 */
		var timeoutID;

		// Keep track of the last time `callback` was executed.
		var lastExec = 0;

		// `noTrailing` defaults to falsy.
		if ( typeof noTrailing !== 'boolean' ) {
			debounceMode = callback;
			callback = noTrailing;
			noTrailing = undefined;
		}

		/*
		 * The `wrapper` function encapsulates all of the throttling / debouncing
		 * functionality and when executed will limit the rate at which `callback`
		 * is executed.
		 */
		function wrapper () {

			var self = this;
			var elapsed = Number(new Date()) - lastExec;
			var args = arguments;

			// Execute `callback` and update the `lastExec` timestamp.
			function exec () {
				lastExec = Number(new Date());
				callback.apply(self, args);
			}

			/*
			 * If `debounceMode` is true (at begin) this is used to clear the flag
			 * to allow future `callback` executions.
			 */
			function clear () {
				timeoutID = undefined;
			}

			if ( debounceMode && !timeoutID ) {
				/*
				 * Since `wrapper` is being called for the first time and
				 * `debounceMode` is true (at begin), execute `callback`.
				 */
				exec();
			}

			// Clear any existing timeout.
			if ( timeoutID ) {
				clearTimeout(timeoutID);
			}

			if ( debounceMode === undefined && elapsed > delay ) {
				/*
				 * In throttle mode, if `delay` time has been exceeded, execute
				 * `callback`.
				 */
				exec();

			} else if ( noTrailing !== true ) {
				/*
				 * In trailing throttle mode, since `delay` time has not been
				 * exceeded, schedule `callback` to execute `delay` ms after most
				 * recent execution.
				 *
				 * If `debounceMode` is true (at begin), schedule `clear` to execute
				 * after `delay` ms.
				 *
				 * If `debounceMode` is false (at end), schedule `callback` to
				 * execute after `delay` ms.
				 */
				timeoutID = setTimeout(debounceMode ? clear : exec, debounceMode === undefined ? delay - elapsed : delay);
			}

		}

		// Return the wrapper function.
		return wrapper;

	}

	/* eslint-disable no-undefined */

	/**
	 * Debounce execution of a function. Debouncing, unlike throttling,
	 * guarantees that a function is only executed a single time, either at the
	 * very beginning of a series of calls, or at the very end.
	 *
	 * @param  {Number}   delay         A zero-or-greater delay in milliseconds. For event callbacks, values around 100 or 250 (or even higher) are most useful.
	 * @param  {Boolean}  [atBegin]     Optional, defaults to false. If atBegin is false or unspecified, callback will only be executed `delay` milliseconds
	 *                                  after the last debounced-function call. If atBegin is true, callback will be executed only at the first debounced-function call.
	 *                                  (After the throttled-function has not been called for `delay` milliseconds, the internal counter is reset).
	 * @param  {Function} callback      A function to be executed after delay milliseconds. The `this` context and all arguments are passed through, as-is,
	 *                                  to `callback` when the debounced-function is executed.
	 *
	 * @return {Function} A new, debounced function.
	 */
	function debounce ( delay, atBegin, callback ) {
		return callback === undefined ? throttle(delay, atBegin, false) : throttle(delay, callback, atBegin !== false);
	}

	var isAbsoluteUrl = function (url) {
		if (typeof url !== 'string') {
			throw new TypeError('Expected a string');
		}

		return /^[a-z][a-z0-9+.-]*:/.test(url);
	};

	/*
	object-assign
	(c) Sindre Sorhus
	@license MIT
	*/
	/* eslint-disable no-unused-vars */
	var getOwnPropertySymbols = Object.getOwnPropertySymbols;
	var hasOwnProperty = Object.prototype.hasOwnProperty;
	var propIsEnumerable = Object.prototype.propertyIsEnumerable;

	function toObject(val) {
		if (val === null || val === undefined) {
			throw new TypeError('Object.assign cannot be called with null or undefined');
		}

		return Object(val);
	}

	function shouldUseNative() {
		try {
			if (!Object.assign) {
				return false;
			}

			// Detect buggy property enumeration order in older V8 versions.

			// https://bugs.chromium.org/p/v8/issues/detail?id=4118
			var test1 = new String('abc');  // eslint-disable-line no-new-wrappers
			test1[5] = 'de';
			if (Object.getOwnPropertyNames(test1)[0] === '5') {
				return false;
			}

			// https://bugs.chromium.org/p/v8/issues/detail?id=3056
			var test2 = {};
			for (var i = 0; i < 10; i++) {
				test2['_' + String.fromCharCode(i)] = i;
			}
			var order2 = Object.getOwnPropertyNames(test2).map(function (n) {
				return test2[n];
			});
			if (order2.join('') !== '0123456789') {
				return false;
			}

			// https://bugs.chromium.org/p/v8/issues/detail?id=3056
			var test3 = {};
			'abcdefghijklmnopqrst'.split('').forEach(function (letter) {
				test3[letter] = letter;
			});
			if (Object.keys(Object.assign({}, test3)).join('') !==
					'abcdefghijklmnopqrst') {
				return false;
			}

			return true;
		} catch (err) {
			// We don't expect any of the above to throw, but better to be safe.
			return false;
		}
	}

	var objectAssign = shouldUseNative() ? Object.assign : function (target, source) {
		var arguments$1 = arguments;

		var from;
		var to = toObject(target);
		var symbols;

		for (var s = 1; s < arguments.length; s++) {
			from = Object(arguments$1[s]);

			for (var key in from) {
				if (hasOwnProperty.call(from, key)) {
					to[key] = from[key];
				}
			}

			if (getOwnPropertySymbols) {
				symbols = getOwnPropertySymbols(from);
				for (var i = 0; i < symbols.length; i++) {
					if (propIsEnumerable.call(from, symbols[i])) {
						to[symbols[i]] = from[symbols[i]];
					}
				}
			}
		}

		return to;
	};

	var API = 'https://text.cinwell.com';

	function downloadURL(hash) {
	  return (API + "/" + hash);
	}

	//

	var script = {
	  data: function () { return ({
	    code: ""
	  }); },
	  props: ["mode", "elementName", "label"],

	  computed: {
	    upperLabel: function upperLabel() {
	      return this.label.toUpperCase();
	    },
	    elementId: function elementId() {
	      return this.elementName +'-text-area';
	    }
	  },
	  methods: {
	    getFileContent: function getFileContent(filename) {
	      this.$toasted.show("Loading file...");

	      var url;
	      if (/^\w+$/.test(filename)) {
	        url = downloadURL(filename);
	      } else if (isAbsoluteUrl(filename)) {
	        url = filename;
	      } else if (/^[\w-]+\.\w+/.test(filename)) {
	        url = "//" + filename;
	      } else {
	        // convert url to github raw url
	        var repo = filename.match(
	          /^([^\/]+\/[^\/]+)(\/blob\/([\w-]+))?(\S+)$/
	        );
	        url = "//raw.githubusercontent.com/" + (repo[1]) + "/" + (repo[3] || "master") + (repo[4]);
	      }

	      if (/github\.com\//.test(url)) {
	        url = url
	          .replace(/github\.com\//, "raw.githubusercontent.com/")
	          .replace(/\/blob\//, "/");
	      }

	      try {
	        var result = fetch(url);

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

	  mounted: function mounted() {
	    var this$1 = this;

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

	    var editor = codemirror.fromTextArea(this.$refs.textarea, {
	      mode: modeParams[this.mode].editorMode,
	      theme: "lucario",
	      value: "<template></template>",
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
	          Tab: function (cm) { return cm.execCommand("indentMore"); },
	          "Shift-Tab": function (cm) { return cm.execCommand("indentLess"); },
	        Enter: "emmetInsertLineBreak"
	      }
	    });
	    editor.setSize("100%", "calc(100% - 32px)");

	    editor.on(
	      "change",
	      debounce(200, function () {
	        this$1.$emit("change", editor.getValue());
	      })
	    );

	    var value;
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

	/* script */
	            var __vue_script__ = script;
	            
	/* template */
	var __vue_render__ = function() {
	  var _vm = this;
	  var _h = _vm.$createElement;
	  var _c = _vm._self._c || _h;
	  return _c("div", { staticClass: "editor" }, [
	    _vm._v(" " + _vm._s(_vm.upperLabel) + "\n  "),
	    _c("textarea", {
	      ref: "textarea",
	      staticClass: "editor",
	      attrs: { name: _vm.elementName, id: _vm.elementId }
	    })
	  ])
	};
	var __vue_staticRenderFns__ = [];
	__vue_render__._withStripped = true;

	  /* style */
	  var __vue_inject_styles__ = function (inject) {
	    if (!inject) { return }
	    inject("data-v-ccd190a6_0", { source: "\n.editor[data-v-ccd190a6] .CodeMirror {\n  border: 1px solid #000;\n  height: 100%;\n  line-height: 1.2rem;\n}\n", map: {"version":3,"sources":["D:\\Users\\eu\\Dropbox\\EasyPHP-5.3.6.0\\www\\vuep/D:\\Users\\eu\\Dropbox\\EasyPHP-5.3.6.0\\www\\vuep/D:\\Users\\eu\\Dropbox\\EasyPHP-5.3.6.0\\www\\vuep\\src\\components\\editor.vue","editor.vue"],"names":[],"mappings":";AAuLA;EACA,uBAAA;EACA,aAAA;EACA,oBAAA;CCtLC","file":"editor.vue","sourcesContent":[null,".editor >>> .CodeMirror {\n  border: 1px solid #000;\n  height: 100%;\n  line-height: 1.2rem;\n}\n"]}, media: undefined });

	  };
	  /* scoped */
	  var __vue_scope_id__ = "data-v-ccd190a6";
	  /* module identifier */
	  var __vue_module_identifier__ = undefined;
	  /* functional template */
	  var __vue_is_functional_template__ = false;
	  /* component normalizer */
	  function __vue_normalize__(
	    template, style, script$$1,
	    scope, functional, moduleIdentifier,
	    createInjector, createInjectorSSR
	  ) {
	    var component = (typeof script$$1 === 'function' ? script$$1.options : script$$1) || {};

	    // For security concerns, we use only base name in production mode.
	    component.__file = "D:\\Users\\eu\\Dropbox\\EasyPHP-5.3.6.0\\www\\vuep\\src\\components\\editor.vue";

	    if (!component.render) {
	      component.render = template.render;
	      component.staticRenderFns = template.staticRenderFns;
	      component._compiled = true;

	      if (functional) { component.functional = true; }
	    }

	    component._scopeId = scope;

	    {
	      var hook;
	      if (style) {
	        hook = function(context) {
	          style.call(this, createInjector(context));
	        };
	      }

	      if (hook !== undefined) {
	        if (component.functional) {
	          // register for functional component in vue file
	          var originalRender = component.render;
	          component.render = function renderWithStyleInjection(h, context) {
	            hook.call(context);
	            return originalRender(h, context)
	          };
	        } else {
	          // inject component registration as beforeCreate hook
	          var existing = component.beforeCreate;
	          component.beforeCreate = existing ? [].concat(existing, hook) : [hook];
	        }
	      }
	    }

	    return component
	  }
	  /* style inject */
	  function __vue_create_injector__() {
	    var head = document.head || document.getElementsByTagName('head')[0];
	    var styles = __vue_create_injector__.styles || (__vue_create_injector__.styles = {});
	    var isOldIE =
	      typeof navigator !== 'undefined' &&
	      /msie [6-9]\\b/.test(navigator.userAgent.toLowerCase());

	    return function addStyle(id, css) {
	      if (document.querySelector('style[data-vue-ssr-id~="' + id + '"]')) { return } // SSR styles are present.

	      var group = isOldIE ? css.media || 'default' : id;
	      var style = styles[group] || (styles[group] = { ids: [], parts: [], element: undefined });

	      if (!style.ids.includes(id)) {
	        var code = css.source;
	        var index = style.ids.length;

	        style.ids.push(id);

	        if (isOldIE) {
	          style.element = style.element || document.querySelector('style[data-group=' + group + ']');
	        }

	        if (!style.element) {
	          var el = style.element = document.createElement('style');
	          el.type = 'text/css';

	          if (css.media) { el.setAttribute('media', css.media); }
	          if (isOldIE) {
	            el.setAttribute('data-group', group);
	            el.setAttribute('data-next-index', '0');
	          }

	          head.appendChild(el);
	        }

	        if (isOldIE) {
	          index = parseInt(style.element.getAttribute('data-next-index'));
	          style.element.setAttribute('data-next-index', index + 1);
	        }

	        if (style.element.styleSheet) {
	          style.parts.push(code);
	          style.element.styleSheet.cssText = style.parts
	            .filter(Boolean)
	            .join('\n');
	        } else {
	          var textNode = document.createTextNode(code);
	          var nodes = style.element.childNodes;
	          if (nodes[index]) { style.element.removeChild(nodes[index]); }
	          if (nodes.length) { style.element.insertBefore(textNode, nodes[index]); }
	          else { style.element.appendChild(textNode); }
	        }
	      }
	    }
	  }
	  /* style inject SSR */
	  

	  
	  var Editor = __vue_normalize__(
	    { render: __vue_render__, staticRenderFns: __vue_staticRenderFns__ },
	    __vue_inject_styles__,
	    __vue_script__,
	    __vue_scope_id__,
	    __vue_is_functional_template__,
	    __vue_module_identifier__,
	    __vue_create_injector__,
	    undefined
	  );

	/**
	 * From: https://github.com/egoist/codepan/blob/2c22bb3d7a7a4e31fd99fc640d320f7ec24d2951/src/utils/iframe.js
	 */
	var Iframe = function Iframe(ref) {
	  var el = ref.el;
	  var sandboxAttributes = ref.sandboxAttributes; if ( sandboxAttributes === void 0 ) sandboxAttributes = [];

	  if (!el) {
	    throw new Error('Expect "el" to mount iframe to!');
	  }
	  this.$el = el;
	  this.sandboxAttributes = sandboxAttributes;
	};

	Iframe.prototype.setHTML = function setHTML (obj) {
	  var html;

	  if (typeof obj === 'string') {
	    html = obj;
	  } else {
	    var head = obj.head; if ( head === void 0 ) head = '';
	      var body = obj.body; if ( body === void 0 ) body = '';
	    html = "<!DOCTYPE html><html><head>" + head + "</head><body>" + body + "</body></html>";
	  }

	  var iframe = this.createIframe();

	  this.$el.parentNode.replaceChild(iframe, this.$el);
	  iframe.contentWindow.document.open();
	  iframe.contentWindow.document.write(html);
	  iframe.contentWindow.document.close();

	  this.$el = iframe;
	};

	Iframe.prototype.createIframe = function createIframe () {
	  var iframe = document.createElement('iframe');
	  iframe.setAttribute('sandbox', this.sandboxAttributes.join(' '));
	  iframe.setAttribute('scrolling', 'yes');
	  iframe.style.width = '100%';
	  iframe.style.height = '100%';
	  iframe.style.border = '0';
	  html = "<!DOCTYPE html><html><head></head><body><div id=\"app\"></div></body></html>";
	 // iframe.contentWindow.document.write(html);
	  iframe.contentWindow.document.open();
	  iframe.contentWindow.document.write(html);
	  iframe.contentWindow.document.close();
	  this.$el.parentNode.replaceChild(iframe, this.$el);
	  this.$el = iframe;

	  return iframe;
	};

	//


	var script$1 = {
	  props: ['iframe', 'complexPreviewUrl'],

	  mounted: function mounted() {
	    /*this.iframe = createIframe({
	      el: this.$refs.iframe,
	      sandboxAttributes
	    });*/

	   //const     html = `<!DOCTYPE html><html><head></head><body><div id="app"></div></body></html>`;
	    
	    var iframe$$1 = document.getElementById(this.iframe);

	   iframe$$1.setAttribute('scrolling', 'yes');
	    iframe$$1.style.width = '100%';
	    iframe$$1.style.height = '100%';
	    iframe$$1.style.border = '0';
	    iframe$$1.style.display = 'block';
	    iframe$$1.style.paddingBottom = '40px';
	    iframe$$1.style.marginTop = '20px';
	    //console.log($(iframe).contents().find("html").html());
	   // var htmlCopy = $(iframe).contents().find("html").html();
	   if(this.complexPreviewUrl == ''){
	    var htmlCopy  = decodeURI(iframe$$1.getAttribute("data-html")); //Busca o html inicial via attribute para evitar reload duplicado

	    this.$el.parentNode.replaceChild(iframe$$1, this.$el); //Isso gera um reload no iframe e cancela qualquer requisição que ainda não tenha sido finalizada
	     //console.log($(iframe).contents().find("html").html());
	        //  console.log(this.$el);
	    //Exeplo se o iframe busca arquivos externos, estes podem não ser cancelados 
	    


	    iframe$$1.contentWindow.document.open();
	    iframe$$1.contentWindow.document.write(htmlCopy);
	    iframe$$1.contentWindow.document.close();

	    }
	    else{
	          this.$el.parentNode.replaceChild(iframe$$1, this.$el); //Isso gera um reload no iframe e cancela qualquer requisição que ainda não tenha sido finalizada
	          iframe$$1.src = this.complexPreviewUrl;
	    }


	   
	  },
	  created: function created(){

	  },


	};

	/* script */
	            var __vue_script__$1 = script$1;
	            
	/* template */
	var __vue_render__$1 = function() {
	  var _vm = this;
	  var _h = _vm.$createElement;
	  var _c = _vm._self._c || _h;
	  return _c("div", { staticClass: "preview" }, [_c("div", { ref: "iframe" })])
	};
	var __vue_staticRenderFns__$1 = [];
	__vue_render__$1._withStripped = true;

	  /* style */
	  var __vue_inject_styles__$1 = undefined;
	  /* scoped */
	  var __vue_scope_id__$1 = "data-v-1b317f2e";
	  /* module identifier */
	  var __vue_module_identifier__$1 = undefined;
	  /* functional template */
	  var __vue_is_functional_template__$1 = false;
	  /* component normalizer */
	  function __vue_normalize__$1(
	    template, style, script,
	    scope, functional, moduleIdentifier,
	    createInjector, createInjectorSSR
	  ) {
	    var component = (typeof script === 'function' ? script.options : script) || {};

	    // For security concerns, we use only base name in production mode.
	    component.__file = "D:\\Users\\eu\\Dropbox\\EasyPHP-5.3.6.0\\www\\vuep\\src\\components\\preview.vue";

	    if (!component.render) {
	      component.render = template.render;
	      component.staticRenderFns = template.staticRenderFns;
	      component._compiled = true;

	      if (functional) { component.functional = true; }
	    }

	    component._scopeId = scope;

	    return component
	  }
	  /* style inject */
	  
	  /* style inject SSR */
	  

	  
	  var Preview = __vue_normalize__$1(
	    { render: __vue_render__$1, staticRenderFns: __vue_staticRenderFns__$1 },
	    __vue_inject_styles__$1,
	    __vue_script__$1,
	    __vue_scope_id__$1,
	    __vue_is_functional_template__$1,
	    __vue_module_identifier__$1,
	    undefined,
	    undefined
	  );

	var browser = createCommonjsModule(function (module, exports) {
	(function (global, factory) {
		factory(exports);
	}(commonjsGlobal, (function (exports) {
	var splitRE = /\r?\n/g;
	var emptyRE = /^\s*$/;
	var needFixRE = /^(\r?\n)*[\t\s]/;

	var deIndent = function deindent (str) {
	  if (!needFixRE.test(str)) {
	    return str
	  }
	  var lines = str.split(splitRE);
	  var min = Infinity;
	  var type, cur, c;
	  for (var i = 0; i < lines.length; i++) {
	    var line = lines[i];
	    if (!emptyRE.test(line)) {
	      if (!type) {
	        c = line.charAt(0);
	        if (c === ' ' || c === '\t') {
	          type = c;
	          cur = count(line, type);
	          if (cur < min) {
	            min = cur;
	          }
	        } else {
	          return str
	        }
	      } else {
	        cur = count(line, type);
	        if (cur < min) {
	          min = cur;
	        }
	      }
	    }
	  }
	  return lines.map(function (line) {
	    return line.slice(min)
	  }).join('\n')
	};

	function count (line, type) {
	  var i = 0;
	  while (line.charAt(i) === type) {
	    i++;
	  }
	  return i
	}

	/*  */

	var emptyObject = Object.freeze({});

	// these helpers produces better vm code in JS engines due to their
	// explicitness and function inlining
	function isUndef (v) {
	  return v === undefined || v === null
	}







	/**
	 * Check if value is primitive
	 */
	function isPrimitive (value) {
	  return (
	    typeof value === 'string' ||
	    typeof value === 'number' ||
	    // $flow-disable-line
	    typeof value === 'symbol' ||
	    typeof value === 'boolean'
	  )
	}

	/**
	 * Quick object check - this is primarily used to tell
	 * Objects from primitive values when we know the value
	 * is a JSON-compliant type.
	 */
	function isObject (obj) {
	  return obj !== null && typeof obj === 'object'
	}

	/**
	 * Get the raw type string of a value e.g. [object Object]
	 */
	var _toString = Object.prototype.toString;

	function toRawType (value) {
	  return _toString.call(value).slice(8, -1)
	}

	/**
	 * Strict object type check. Only returns true
	 * for plain JavaScript objects.
	 */
	function isPlainObject (obj) {
	  return _toString.call(obj) === '[object Object]'
	}



	/**
	 * Check if val is a valid array index.
	 */
	function isValidArrayIndex (val) {
	  var n = parseFloat(String(val));
	  return n >= 0 && Math.floor(n) === n && isFinite(val)
	}

	/**
	 * Convert a value to a string that is actually rendered.
	 */


	/**
	 * Convert a input value to a number for persistence.
	 * If the conversion fails, return original string.
	 */


	/**
	 * Make a map and return a function for checking if a key
	 * is in that map.
	 */
	function makeMap (
	  str,
	  expectsLowerCase
	) {
	  var map = Object.create(null);
	  var list = str.split(',');
	  for (var i = 0; i < list.length; i++) {
	    map[list[i]] = true;
	  }
	  return expectsLowerCase
	    ? function (val) { return map[val.toLowerCase()]; }
	    : function (val) { return map[val]; }
	}

	/**
	 * Check if a tag is a built-in tag.
	 */
	var isBuiltInTag = makeMap('slot,component', true);

	/**
	 * Check if a attribute is a reserved attribute.
	 */
	var isReservedAttribute = makeMap('key,ref,slot,slot-scope,is');

	/**
	 * Remove an item from an array
	 */
	function remove (arr, item) {
	  if (arr.length) {
	    var index = arr.indexOf(item);
	    if (index > -1) {
	      return arr.splice(index, 1)
	    }
	  }
	}

	/**
	 * Check whether the object has the property.
	 */
	var hasOwnProperty = Object.prototype.hasOwnProperty;
	function hasOwn (obj, key) {
	  return hasOwnProperty.call(obj, key)
	}

	/**
	 * Create a cached version of a pure function.
	 */
	function cached (fn) {
	  var cache = Object.create(null);
	  return (function cachedFn (str) {
	    var hit = cache[str];
	    return hit || (cache[str] = fn(str))
	  })
	}

	/**
	 * Camelize a hyphen-delimited string.
	 */
	var camelizeRE = /-(\w)/g;
	var camelize = cached(function (str) {
	  return str.replace(camelizeRE, function (_, c) { return c ? c.toUpperCase() : ''; })
	});

	/**
	 * Capitalize a string.
	 */




	/**
	 * Simple bind polyfill for environments that do not support it... e.g.
	 * PhantomJS 1.x. Technically we don't need this anymore since native bind is
	 * now more performant in most browsers, but removing it would be breaking for
	 * code that was able to run in PhantomJS 1.x, so this must be kept for
	 * backwards compatibility.
	 */

	/* istanbul ignore next */
	function polyfillBind (fn, ctx) {
	  function boundFn (a) {
	    var l = arguments.length;
	    return l
	      ? l > 1
	        ? fn.apply(ctx, arguments)
	        : fn.call(ctx, a)
	      : fn.call(ctx)
	  }

	  boundFn._length = fn.length;
	  return boundFn
	}

	function nativeBind (fn, ctx) {
	  return fn.bind(ctx)
	}

	var bind = Function.prototype.bind
	  ? nativeBind
	  : polyfillBind;

	/**
	 * Convert an Array-like object to a real Array.
	 */


	/**
	 * Mix properties into target object.
	 */
	function extend (to, _from) {
	  for (var key in _from) {
	    to[key] = _from[key];
	  }
	  return to
	}

	/**
	 * Merge an Array of Objects into a single Object.
	 */


	/**
	 * Perform no operation.
	 * Stubbing args to make Flow happy without leaving useless transpiled code
	 * with ...rest (https://flow.org/blog/2017/05/07/Strict-Function-Call-Arity/)
	 */
	function noop (a, b, c) {}

	/**
	 * Always return false.
	 */
	var no = function (a, b, c) { return false; };

	/**
	 * Return same value
	 */
	var identity = function (_) { return _; };

	/**
	 * Generate a static keys string from compiler modules.
	 */
	function genStaticKeys (modules) {
	  return modules.reduce(function (keys, m) {
	    return keys.concat(m.staticKeys || [])
	  }, []).join(',')
	}

	/**
	 * Check if two values are loosely equal - that is,
	 * if they are plain objects, do they have the same shape?
	 */




	/**
	 * Ensure a function is called only once.
	 */

	/*  */

	var isUnaryTag = makeMap(
	  'area,base,br,col,embed,frame,hr,img,input,isindex,keygen,' +
	  'link,meta,param,source,track,wbr'
	);

	// Elements that you can, intentionally, leave open
	// (and which close themselves)
	var canBeLeftOpenTag = makeMap(
	  'colgroup,dd,dt,li,options,p,td,tfoot,th,thead,tr,source'
	);

	// HTML5 tags https://html.spec.whatwg.org/multipage/indices.html#elements-3
	// Phrasing Content https://html.spec.whatwg.org/multipage/dom.html#phrasing-content
	var isNonPhrasingTag = makeMap(
	  'address,article,aside,base,blockquote,body,caption,col,colgroup,dd,' +
	  'details,dialog,div,dl,dt,fieldset,figcaption,figure,footer,form,' +
	  'h1,h2,h3,h4,h5,h6,head,header,hgroup,hr,html,legend,li,menuitem,meta,' +
	  'optgroup,option,param,rp,rt,source,style,summary,tbody,td,tfoot,th,thead,' +
	  'title,tr,track'
	);

	/**
	 * Not type-checking this file because it's mostly vendor code.
	 */

	/*!
	 * HTML Parser By John Resig (ejohn.org)
	 * Modified by Juriy "kangax" Zaytsev
	 * Original code by Erik Arvidsson, Mozilla Public License
	 * http://erik.eae.net/simplehtmlparser/simplehtmlparser.js
	 */

	// Regular Expressions for parsing tags and attributes
	var attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/;
	// could use https://www.w3.org/TR/1999/REC-xml-names-19990114/#NT-QName
	// but for Vue templates we can enforce a simple charset
	var ncname = '[a-zA-Z_][\\w\\-\\.]*';
	var qnameCapture = "((?:" + ncname + "\\:)?" + ncname + ")";
	var startTagOpen = new RegExp(("^<" + qnameCapture));
	var startTagClose = /^\s*(\/?)>/;
	var endTag = new RegExp(("^<\\/" + qnameCapture + "[^>]*>"));
	var doctype = /^<!DOCTYPE [^>]+>/i;
	// #7298: escape - to avoid being pased as HTML comment when inlined in page
	var comment = /^<!\--/;
	var conditionalComment = /^<!\[/;

	var IS_REGEX_CAPTURING_BROKEN = false;
	'x'.replace(/x(.)?/g, function (m, g) {
	  IS_REGEX_CAPTURING_BROKEN = g === '';
	});

	// Special Elements (can contain anything)
	var isPlainTextElement = makeMap('script,style,textarea', true);
	var reCache = {};

	var decodingMap = {
	  '&lt;': '<',
	  '&gt;': '>',
	  '&quot;': '"',
	  '&amp;': '&',
	  '&#10;': '\n',
	  '&#9;': '\t'
	};
	var encodedAttr = /&(?:lt|gt|quot|amp);/g;
	var encodedAttrWithNewLines = /&(?:lt|gt|quot|amp|#10|#9);/g;

	// #5992
	var isIgnoreNewlineTag = makeMap('pre,textarea', true);
	var shouldIgnoreFirstNewline = function (tag, html) { return tag && isIgnoreNewlineTag(tag) && html[0] === '\n'; };

	function decodeAttr (value, shouldDecodeNewlines) {
	  var re = shouldDecodeNewlines ? encodedAttrWithNewLines : encodedAttr;
	  return value.replace(re, function (match) { return decodingMap[match]; })
	}

	function parseHTML (html, options) {
	  var stack = [];
	  var expectHTML = options.expectHTML;
	  var isUnaryTag$$1 = options.isUnaryTag || no;
	  var canBeLeftOpenTag$$1 = options.canBeLeftOpenTag || no;
	  var index = 0;
	  var last, lastTag;
	  while (html) {
	    last = html;
	    // Make sure we're not in a plaintext content element like script/style
	    if (!lastTag || !isPlainTextElement(lastTag)) {
	      var textEnd = html.indexOf('<');
	      if (textEnd === 0) {
	        // Comment:
	        if (comment.test(html)) {
	          var commentEnd = html.indexOf('-->');

	          if (commentEnd >= 0) {
	            if (options.shouldKeepComment) {
	              options.comment(html.substring(4, commentEnd));
	            }
	            advance(commentEnd + 3);
	            continue
	          }
	        }

	        // http://en.wikipedia.org/wiki/Conditional_comment#Downlevel-revealed_conditional_comment
	        if (conditionalComment.test(html)) {
	          var conditionalEnd = html.indexOf(']>');

	          if (conditionalEnd >= 0) {
	            advance(conditionalEnd + 2);
	            continue
	          }
	        }

	        // Doctype:
	        var doctypeMatch = html.match(doctype);
	        if (doctypeMatch) {
	          advance(doctypeMatch[0].length);
	          continue
	        }

	        // End tag:
	        var endTagMatch = html.match(endTag);
	        if (endTagMatch) {
	          var curIndex = index;
	          advance(endTagMatch[0].length);
	          parseEndTag(endTagMatch[1], curIndex, index);
	          continue
	        }

	        // Start tag:
	        var startTagMatch = parseStartTag();
	        if (startTagMatch) {
	          handleStartTag(startTagMatch);
	          if (shouldIgnoreFirstNewline(lastTag, html)) {
	            advance(1);
	          }
	          continue
	        }
	      }

	      var text = (void 0), rest = (void 0), next = (void 0);
	      if (textEnd >= 0) {
	        rest = html.slice(textEnd);
	        while (
	          !endTag.test(rest) &&
	          !startTagOpen.test(rest) &&
	          !comment.test(rest) &&
	          !conditionalComment.test(rest)
	        ) {
	          // < in plain text, be forgiving and treat it as text
	          next = rest.indexOf('<', 1);
	          if (next < 0) { break }
	          textEnd += next;
	          rest = html.slice(textEnd);
	        }
	        text = html.substring(0, textEnd);
	        advance(textEnd);
	      }

	      if (textEnd < 0) {
	        text = html;
	        html = '';
	      }

	      if (options.chars && text) {
	        options.chars(text);
	      }
	    } else {
	      var endTagLength = 0;
	      var stackedTag = lastTag.toLowerCase();
	      var reStackedTag = reCache[stackedTag] || (reCache[stackedTag] = new RegExp('([\\s\\S]*?)(</' + stackedTag + '[^>]*>)', 'i'));
	      var rest$1 = html.replace(reStackedTag, function (all, text, endTag) {
	        endTagLength = endTag.length;
	        if (!isPlainTextElement(stackedTag) && stackedTag !== 'noscript') {
	          text = text
	            .replace(/<!\--([\s\S]*?)-->/g, '$1') // #7298
	            .replace(/<!\[CDATA\[([\s\S]*?)]]>/g, '$1');
	        }
	        if (shouldIgnoreFirstNewline(stackedTag, text)) {
	          text = text.slice(1);
	        }
	        if (options.chars) {
	          options.chars(text);
	        }
	        return ''
	      });
	      index += html.length - rest$1.length;
	      html = rest$1;
	      parseEndTag(stackedTag, index - endTagLength, index);
	    }

	    if (html === last) {
	      options.chars && options.chars(html);
	      if (!stack.length && options.warn) {
	        options.warn(("Mal-formatted tag at end of template: \"" + html + "\""));
	      }
	      break
	    }
	  }

	  // Clean up any remaining tags
	  parseEndTag();

	  function advance (n) {
	    index += n;
	    html = html.substring(n);
	  }

	  function parseStartTag () {
	    var start = html.match(startTagOpen);
	    if (start) {
	      var match = {
	        tagName: start[1],
	        attrs: [],
	        start: index
	      };
	      advance(start[0].length);
	      var end, attr;
	      while (!(end = html.match(startTagClose)) && (attr = html.match(attribute))) {
	        advance(attr[0].length);
	        match.attrs.push(attr);
	      }
	      if (end) {
	        match.unarySlash = end[1];
	        advance(end[0].length);
	        match.end = index;
	        return match
	      }
	    }
	  }

	  function handleStartTag (match) {
	    var tagName = match.tagName;
	    var unarySlash = match.unarySlash;

	    if (expectHTML) {
	      if (lastTag === 'p' && isNonPhrasingTag(tagName)) {
	        parseEndTag(lastTag);
	      }
	      if (canBeLeftOpenTag$$1(tagName) && lastTag === tagName) {
	        parseEndTag(tagName);
	      }
	    }

	    var unary = isUnaryTag$$1(tagName) || !!unarySlash;

	    var l = match.attrs.length;
	    var attrs = new Array(l);
	    for (var i = 0; i < l; i++) {
	      var args = match.attrs[i];
	      // hackish work around FF bug https://bugzilla.mozilla.org/show_bug.cgi?id=369778
	      if (IS_REGEX_CAPTURING_BROKEN && args[0].indexOf('""') === -1) {
	        if (args[3] === '') { delete args[3]; }
	        if (args[4] === '') { delete args[4]; }
	        if (args[5] === '') { delete args[5]; }
	      }
	      var value = args[3] || args[4] || args[5] || '';
	      var shouldDecodeNewlines = tagName === 'a' && args[1] === 'href'
	        ? options.shouldDecodeNewlinesForHref
	        : options.shouldDecodeNewlines;
	      attrs[i] = {
	        name: args[1],
	        value: decodeAttr(value, shouldDecodeNewlines)
	      };
	    }

	    if (!unary) {
	      stack.push({ tag: tagName, lowerCasedTag: tagName.toLowerCase(), attrs: attrs });
	      lastTag = tagName;
	    }

	    if (options.start) {
	      options.start(tagName, attrs, unary, match.start, match.end);
	    }
	  }

	  function parseEndTag (tagName, start, end) {
	    var pos, lowerCasedTagName;
	    if (start == null) { start = index; }
	    if (end == null) { end = index; }

	    if (tagName) {
	      lowerCasedTagName = tagName.toLowerCase();
	    }

	    // Find the closest opened tag of the same type
	    if (tagName) {
	      for (pos = stack.length - 1; pos >= 0; pos--) {
	        if (stack[pos].lowerCasedTag === lowerCasedTagName) {
	          break
	        }
	      }
	    } else {
	      // If no tag name is provided, clean shop
	      pos = 0;
	    }

	    if (pos >= 0) {
	      // Close all the open elements, up the stack
	      for (var i = stack.length - 1; i >= pos; i--) {
	        if (i > pos || !tagName &&
	          options.warn
	        ) {
	          options.warn(
	            ("tag <" + (stack[i].tag) + "> has no matching end tag.")
	          );
	        }
	        if (options.end) {
	          options.end(stack[i].tag, start, end);
	        }
	      }

	      // Remove the open elements from the stack
	      stack.length = pos;
	      lastTag = pos && stack[pos - 1].tag;
	    } else if (lowerCasedTagName === 'br') {
	      if (options.start) {
	        options.start(tagName, [], true, start, end);
	      }
	    } else if (lowerCasedTagName === 'p') {
	      if (options.start) {
	        options.start(tagName, [], false, start, end);
	      }
	      if (options.end) {
	        options.end(tagName, start, end);
	      }
	    }
	  }
	}

	/*  */

	var splitRE$1 = /\r?\n/g;
	var replaceRE = /./g;
	var isSpecialTag = makeMap('script,style,template', true);



	/**
	 * Parse a single-file component (*.vue) file into an SFC Descriptor Object.
	 */
	function parseComponent (
	  content,
	  options
	) {
	  if ( options === void 0 ) { options = {}; }

	  var sfc = {
	    template: null,
	    script: null,
	    styles: [],
	    customBlocks: []
	  };
	  var depth = 0;
	  var currentBlock = null;

	  function start (
	    tag,
	    attrs,
	    unary,
	    start,
	    end
	  ) {
	    if (depth === 0) {
	      currentBlock = {
	        type: tag,
	        content: '',
	        start: end,
	        attrs: attrs.reduce(function (cumulated, ref) {
	          var name = ref.name;
	          var value = ref.value;

	          cumulated[name] = value || true;
	          return cumulated
	        }, {})
	      };
	      if (isSpecialTag(tag)) {
	        checkAttrs(currentBlock, attrs);
	        if (tag === 'style') {
	          sfc.styles.push(currentBlock);
	        } else {
	          sfc[tag] = currentBlock;
	        }
	      } else { // custom blocks
	        sfc.customBlocks.push(currentBlock);
	      }
	    }
	    if (!unary) {
	      depth++;
	    }
	  }

	  function checkAttrs (block, attrs) {
	    for (var i = 0; i < attrs.length; i++) {
	      var attr = attrs[i];
	      if (attr.name === 'lang') {
	        block.lang = attr.value;
	      }
	      if (attr.name === 'scoped') {
	        block.scoped = true;
	      }
	      if (attr.name === 'module') {
	        block.module = attr.value || true;
	      }
	      if (attr.name === 'src') {
	        block.src = attr.value;
	      }
	    }
	  }

	  function end (tag, start, end) {
	    if (depth === 1 && currentBlock) {
	      currentBlock.end = start;
	      var text = deIndent(content.slice(currentBlock.start, currentBlock.end));
	      // pad content so that linters and pre-processors can output correct
	      // line numbers in errors and warnings
	      if (currentBlock.type !== 'template' && options.pad) {
	        text = padContent(currentBlock, options.pad) + text;
	      }
	      currentBlock.content = text;
	      currentBlock = null;
	    }
	    depth--;
	  }

	  function padContent (block, pad) {
	    if (pad === 'space') {
	      return content.slice(0, block.start).replace(replaceRE, ' ')
	    } else {
	      var offset = content.slice(0, block.start).split(splitRE$1).length;
	      var padChar = block.type === 'script' && !block.lang
	        ? '//\n'
	        : '\n';
	      return Array(offset).join(padChar)
	    }
	  }

	  parseHTML(content, {
	    start: start,
	    end: end
	  });

	  return sfc
	}

	/*  */

	/**
	 * Check if a string starts with $ or _
	 */


	/**
	 * Define a property.
	 */
	function def (obj, key, val, enumerable) {
	  Object.defineProperty(obj, key, {
	    value: val,
	    enumerable: !!enumerable,
	    writable: true,
	    configurable: true
	  });
	}

	/*  */

	// can we use __proto__?
	var hasProto = '__proto__' in {};

	// Browser environment sniffing
	var inBrowser = typeof window !== 'undefined';
	var inWeex = typeof WXEnvironment !== 'undefined' && !!WXEnvironment.platform;
	var weexPlatform = inWeex && WXEnvironment.platform.toLowerCase();
	var UA = inBrowser && window.navigator.userAgent.toLowerCase();
	var isIE = UA && /msie|trident/.test(UA);
	var isIE9 = UA && UA.indexOf('msie 9.0') > 0;
	var isEdge = UA && UA.indexOf('edge/') > 0;
	var isAndroid = (UA && UA.indexOf('android') > 0) || (weexPlatform === 'android');
	var isIOS = (UA && /iphone|ipad|ipod|ios/.test(UA)) || (weexPlatform === 'ios');
	var isChrome = UA && /chrome\/\d+/.test(UA) && !isEdge;

	// Firefox has a "watch" function on Object.prototype...
	var nativeWatch = ({}).watch;


	if (inBrowser) {
	  try {
	    var opts = {};
	    Object.defineProperty(opts, 'passive', ({
	      get: function get () {
	        /* istanbul ignore next */
	        
	      }
	    })); // https://github.com/facebook/flow/issues/285
	    window.addEventListener('test-passive', null, opts);
	  } catch (e) {}
	}

	// this needs to be lazy-evaled because vue may be required before
	// vue-server-renderer can set VUE_ENV
	var _isServer;
	var isServerRendering = function () {
	  if (_isServer === undefined) {
	    /* istanbul ignore if */
	    if (!inBrowser && !inWeex && typeof commonjsGlobal !== 'undefined') {
	      // detect presence of vue-server-renderer and avoid
	      // Webpack shimming the process
	      _isServer = commonjsGlobal['process'].env.VUE_ENV === 'server';
	    } else {
	      _isServer = false;
	    }
	  }
	  return _isServer
	};

	// detect devtools
	var devtools = inBrowser && window.__VUE_DEVTOOLS_GLOBAL_HOOK__;

	/* istanbul ignore next */
	function isNative (Ctor) {
	  return typeof Ctor === 'function' && /native code/.test(Ctor.toString())
	}

	var hasSymbol =
	  typeof Symbol !== 'undefined' && isNative(Symbol) &&
	  typeof Reflect !== 'undefined' && isNative(Reflect.ownKeys);

	/* istanbul ignore if */ // $flow-disable-line
	if (typeof Set !== 'undefined' && isNative(Set)) ;

	var ASSET_TYPES = [
	  'component',
	  'directive',
	  'filter'
	];

	var LIFECYCLE_HOOKS = [
	  'beforeCreate',
	  'created',
	  'beforeMount',
	  'mounted',
	  'beforeUpdate',
	  'updated',
	  'beforeDestroy',
	  'destroyed',
	  'activated',
	  'deactivated',
	  'errorCaptured'
	];

	/*  */

	var config = ({
	  /**
	   * Option merge strategies (used in core/util/options)
	   */
	  // $flow-disable-line
	  optionMergeStrategies: Object.create(null),

	  /**
	   * Whether to suppress warnings.
	   */
	  silent: false,

	  /**
	   * Show production mode tip message on boot?
	   */
	  productionTip: "development" !== 'production',

	  /**
	   * Whether to enable devtools
	   */
	  devtools: "development" !== 'production',

	  /**
	   * Whether to record perf
	   */
	  performance: false,

	  /**
	   * Error handler for watcher errors
	   */
	  errorHandler: null,

	  /**
	   * Warn handler for watcher warns
	   */
	  warnHandler: null,

	  /**
	   * Ignore certain custom elements
	   */
	  ignoredElements: [],

	  /**
	   * Custom user key aliases for v-on
	   */
	  // $flow-disable-line
	  keyCodes: Object.create(null),

	  /**
	   * Check if a tag is reserved so that it cannot be registered as a
	   * component. This is platform-dependent and may be overwritten.
	   */
	  isReservedTag: no,

	  /**
	   * Check if an attribute is reserved so that it cannot be used as a component
	   * prop. This is platform-dependent and may be overwritten.
	   */
	  isReservedAttr: no,

	  /**
	   * Check if a tag is an unknown element.
	   * Platform-dependent.
	   */
	  isUnknownElement: no,

	  /**
	   * Get the namespace of an element
	   */
	  getTagNamespace: noop,

	  /**
	   * Parse the real tag name for the specific platform.
	   */
	  parsePlatformTagName: identity,

	  /**
	   * Check if an attribute must be bound using property, e.g. value
	   * Platform-dependent.
	   */
	  mustUseProp: no,

	  /**
	   * Exposed for legacy reasons
	   */
	  _lifecycleHooks: LIFECYCLE_HOOKS
	});

	/*  */

	var warn = noop;
	var tip = noop;
	var generateComponentTrace = (noop); // work around flow check
	var formatComponentName = (noop);

	{
	  var hasConsole = typeof console !== 'undefined';
	  var classifyRE = /(?:^|[-_])(\w)/g;
	  var classify = function (str) { return str
	    .replace(classifyRE, function (c) { return c.toUpperCase(); })
	    .replace(/[-_]/g, ''); };

	  warn = function (msg, vm) {
	    var trace = vm ? generateComponentTrace(vm) : '';

	    if (hasConsole && (!config.silent)) {
	      console.error(("[Vue warn]: " + msg + trace));
	    }
	  };

	  tip = function (msg, vm) {
	    if (hasConsole && (!config.silent)) {
	      console.warn("[Vue tip]: " + msg + (
	        vm ? generateComponentTrace(vm) : ''
	      ));
	    }
	  };

	  formatComponentName = function (vm, includeFile) {
	    if (vm.$root === vm) {
	      return '<Root>'
	    }
	    var options = typeof vm === 'function' && vm.cid != null
	      ? vm.options
	      : vm._isVue
	        ? vm.$options || vm.constructor.options
	        : vm || {};
	    var name = options.name || options._componentTag;
	    var file = options.__file;
	    if (!name && file) {
	      var match = file.match(/([^/\\]+)\.vue$/);
	      name = match && match[1];
	    }

	    return (
	      (name ? ("<" + (classify(name)) + ">") : "<Anonymous>") +
	      (file && includeFile !== false ? (" at " + file) : '')
	    )
	  };

	  var repeat = function (str, n) {
	    var res = '';
	    while (n) {
	      if (n % 2 === 1) { res += str; }
	      if (n > 1) { str += str; }
	      n >>= 1;
	    }
	    return res
	  };

	  generateComponentTrace = function (vm) {
	    if (vm._isVue && vm.$parent) {
	      var tree = [];
	      var currentRecursiveSequence = 0;
	      while (vm) {
	        if (tree.length > 0) {
	          var last = tree[tree.length - 1];
	          if (last.constructor === vm.constructor) {
	            currentRecursiveSequence++;
	            vm = vm.$parent;
	            continue
	          } else if (currentRecursiveSequence > 0) {
	            tree[tree.length - 1] = [last, currentRecursiveSequence];
	            currentRecursiveSequence = 0;
	          }
	        }
	        tree.push(vm);
	        vm = vm.$parent;
	      }
	      return '\n\nfound in\n\n' + tree
	        .map(function (vm, i) { return ("" + (i === 0 ? '---> ' : repeat(' ', 5 + i * 2)) + (Array.isArray(vm)
	            ? ((formatComponentName(vm[0])) + "... (" + (vm[1]) + " recursive calls)")
	            : formatComponentName(vm))); })
	        .join('\n')
	    } else {
	      return ("\n\n(found in " + (formatComponentName(vm)) + ")")
	    }
	  };
	}

	/*  */


	var uid = 0;

	/**
	 * A dep is an observable that can have multiple
	 * directives subscribing to it.
	 */
	var Dep = function Dep () {
	  this.id = uid++;
	  this.subs = [];
	};

	Dep.prototype.addSub = function addSub (sub) {
	  this.subs.push(sub);
	};

	Dep.prototype.removeSub = function removeSub (sub) {
	  remove(this.subs, sub);
	};

	Dep.prototype.depend = function depend () {
	  if (Dep.target) {
	    Dep.target.addDep(this);
	  }
	};

	Dep.prototype.notify = function notify () {
	  // stabilize the subscriber list first
	  var subs = this.subs.slice();
	  for (var i = 0, l = subs.length; i < l; i++) {
	    subs[i].update();
	  }
	};

	// the current target watcher being evaluated.
	// this is globally unique because there could be only one
	// watcher being evaluated at any time.
	Dep.target = null;

	/*  */

	var VNode = function VNode (
	  tag,
	  data,
	  children,
	  text,
	  elm,
	  context,
	  componentOptions,
	  asyncFactory
	) {
	  this.tag = tag;
	  this.data = data;
	  this.children = children;
	  this.text = text;
	  this.elm = elm;
	  this.ns = undefined;
	  this.context = context;
	  this.fnContext = undefined;
	  this.fnOptions = undefined;
	  this.fnScopeId = undefined;
	  this.key = data && data.key;
	  this.componentOptions = componentOptions;
	  this.componentInstance = undefined;
	  this.parent = undefined;
	  this.raw = false;
	  this.isStatic = false;
	  this.isRootInsert = true;
	  this.isComment = false;
	  this.isCloned = false;
	  this.isOnce = false;
	  this.asyncFactory = asyncFactory;
	  this.asyncMeta = undefined;
	  this.isAsyncPlaceholder = false;
	};

	var prototypeAccessors = { child: { configurable: true } };

	// DEPRECATED: alias for componentInstance for backwards compat.
	/* istanbul ignore next */
	prototypeAccessors.child.get = function () {
	  return this.componentInstance
	};

	Object.defineProperties( VNode.prototype, prototypeAccessors );





	// optimized shallow clone
	// used for static nodes and slot nodes because they may be reused across
	// multiple renders, cloning them avoids errors when DOM manipulations rely
	// on their elm reference.

	/*
	 * not type checking this file because flow doesn't play well with
	 * dynamically accessing methods on Array prototype
	 */

	var arrayProto = Array.prototype;
	var arrayMethods = Object.create(arrayProto);

	var methodsToPatch = [
	  'push',
	  'pop',
	  'shift',
	  'unshift',
	  'splice',
	  'sort',
	  'reverse'
	];

	/**
	 * Intercept mutating methods and emit events
	 */
	methodsToPatch.forEach(function (method) {
	  // cache original method
	  var original = arrayProto[method];
	  def(arrayMethods, method, function mutator () {
	    var arguments$1 = arguments;

	    var args = [], len = arguments.length;
	    while ( len-- ) { args[ len ] = arguments$1[ len ]; }

	    var result = original.apply(this, args);
	    var ob = this.__ob__;
	    var inserted;
	    switch (method) {
	      case 'push':
	      case 'unshift':
	        inserted = args;
	        break
	      case 'splice':
	        inserted = args.slice(2);
	        break
	    }
	    if (inserted) { ob.observeArray(inserted); }
	    // notify change
	    ob.dep.notify();
	    return result
	  });
	});

	/*  */

	var arrayKeys = Object.getOwnPropertyNames(arrayMethods);



	/**
	 * Observer class that is attached to each observed
	 * object. Once attached, the observer converts the target
	 * object's property keys into getter/setters that
	 * collect dependencies and dispatch updates.
	 */
	var Observer = function Observer (value) {
	  this.value = value;
	  this.dep = new Dep();
	  this.vmCount = 0;
	  def(value, '__ob__', this);
	  if (Array.isArray(value)) {
	    var augment = hasProto
	      ? protoAugment
	      : copyAugment;
	    augment(value, arrayMethods, arrayKeys);
	    this.observeArray(value);
	  } else {
	    this.walk(value);
	  }
	};

	/**
	 * Walk through each property and convert them into
	 * getter/setters. This method should only be called when
	 * value type is Object.
	 */
	Observer.prototype.walk = function walk (obj) {
	  var keys = Object.keys(obj);
	  for (var i = 0; i < keys.length; i++) {
	    defineReactive(obj, keys[i]);
	  }
	};

	/**
	 * Observe a list of Array items.
	 */
	Observer.prototype.observeArray = function observeArray (items) {
	  for (var i = 0, l = items.length; i < l; i++) {
	    observe(items[i]);
	  }
	};

	// helpers

	/**
	 * Augment an target Object or Array by intercepting
	 * the prototype chain using __proto__
	 */
	function protoAugment (target, src, keys) {
	  /* eslint-disable no-proto */
	  target.__proto__ = src;
	  /* eslint-enable no-proto */
	}

	/**
	 * Augment an target Object or Array by defining
	 * hidden properties.
	 */
	/* istanbul ignore next */
	function copyAugment (target, src, keys) {
	  for (var i = 0, l = keys.length; i < l; i++) {
	    var key = keys[i];
	    def(target, key, src[key]);
	  }
	}

	/**
	 * Attempt to create an observer instance for a value,
	 * returns the new observer if successfully observed,
	 * or the existing observer if the value already has one.
	 */
	function observe (value, asRootData) {
	  if (!isObject(value) || value instanceof VNode) {
	    return
	  }
	  var ob;
	  if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
	    ob = value.__ob__;
	  } else if (
	    !isServerRendering() &&
	    (Array.isArray(value) || isPlainObject(value)) &&
	    Object.isExtensible(value) &&
	    !value._isVue
	  ) {
	    ob = new Observer(value);
	  }
	  if (asRootData && ob) {
	    ob.vmCount++;
	  }
	  return ob
	}

	/**
	 * Define a reactive property on an Object.
	 */
	function defineReactive (
	  obj,
	  key,
	  val,
	  customSetter,
	  shallow
	) {
	  var dep = new Dep();

	  var property = Object.getOwnPropertyDescriptor(obj, key);
	  if (property && property.configurable === false) {
	    return
	  }

	  // cater for pre-defined getter/setters
	  var getter = property && property.get;
	  if (!getter && arguments.length === 2) {
	    val = obj[key];
	  }
	  var setter = property && property.set;

	  var childOb = !shallow && observe(val);
	  Object.defineProperty(obj, key, {
	    enumerable: true,
	    configurable: true,
	    get: function reactiveGetter () {
	      var value = getter ? getter.call(obj) : val;
	      if (Dep.target) {
	        dep.depend();
	        if (childOb) {
	          childOb.dep.depend();
	          if (Array.isArray(value)) {
	            dependArray(value);
	          }
	        }
	      }
	      return value
	    },
	    set: function reactiveSetter (newVal) {
	      var value = getter ? getter.call(obj) : val;
	      /* eslint-disable no-self-compare */
	      if (newVal === value || (newVal !== newVal && value !== value)) {
	        return
	      }
	      /* eslint-enable no-self-compare */
	      if (customSetter) {
	        customSetter();
	      }
	      if (setter) {
	        setter.call(obj, newVal);
	      } else {
	        val = newVal;
	      }
	      childOb = !shallow && observe(newVal);
	      dep.notify();
	    }
	  });
	}

	/**
	 * Set a property on an object. Adds the new property and
	 * triggers change notification if the property doesn't
	 * already exist.
	 */
	function set (target, key, val) {
	  if (isUndef(target) || isPrimitive(target)
	  ) {
	    warn(("Cannot set reactive property on undefined, null, or primitive value: " + ((target))));
	  }
	  if (Array.isArray(target) && isValidArrayIndex(key)) {
	    target.length = Math.max(target.length, key);
	    target.splice(key, 1, val);
	    return val
	  }
	  if (key in target && !(key in Object.prototype)) {
	    target[key] = val;
	    return val
	  }
	  var ob = (target).__ob__;
	  if (target._isVue || (ob && ob.vmCount)) {
	    warn(
	      'Avoid adding reactive properties to a Vue instance or its root $data ' +
	      'at runtime - declare it upfront in the data option.'
	    );
	    return val
	  }
	  if (!ob) {
	    target[key] = val;
	    return val
	  }
	  defineReactive(ob.value, key, val);
	  ob.dep.notify();
	  return val
	}

	/**
	 * Delete a property and trigger change if necessary.
	 */


	/**
	 * Collect dependencies on array elements when the array is touched, since
	 * we cannot intercept array element access like property getters.
	 */
	function dependArray (value) {
	  for (var e = (void 0), i = 0, l = value.length; i < l; i++) {
	    e = value[i];
	    e && e.__ob__ && e.__ob__.dep.depend();
	    if (Array.isArray(e)) {
	      dependArray(e);
	    }
	  }
	}

	/*  */

	/**
	 * Option overwriting strategies are functions that handle
	 * how to merge a parent option value and a child option
	 * value into the final value.
	 */
	var strats = config.optionMergeStrategies;

	/**
	 * Options with restrictions
	 */
	{
	  strats.el = strats.propsData = function (parent, child, vm, key) {
	    if (!vm) {
	      warn(
	        "option \"" + key + "\" can only be used during instance " +
	        'creation with the `new` keyword.'
	      );
	    }
	    return defaultStrat(parent, child)
	  };
	}

	/**
	 * Helper that recursively merges two data objects together.
	 */
	function mergeData (to, from) {
	  if (!from) { return to }
	  var key, toVal, fromVal;
	  var keys = Object.keys(from);
	  for (var i = 0; i < keys.length; i++) {
	    key = keys[i];
	    toVal = to[key];
	    fromVal = from[key];
	    if (!hasOwn(to, key)) {
	      set(to, key, fromVal);
	    } else if (isPlainObject(toVal) && isPlainObject(fromVal)) {
	      mergeData(toVal, fromVal);
	    }
	  }
	  return to
	}

	/**
	 * Data
	 */
	function mergeDataOrFn (
	  parentVal,
	  childVal,
	  vm
	) {
	  if (!vm) {
	    // in a Vue.extend merge, both should be functions
	    if (!childVal) {
	      return parentVal
	    }
	    if (!parentVal) {
	      return childVal
	    }
	    // when parentVal & childVal are both present,
	    // we need to return a function that returns the
	    // merged result of both functions... no need to
	    // check if parentVal is a function here because
	    // it has to be a function to pass previous merges.
	    return function mergedDataFn () {
	      return mergeData(
	        typeof childVal === 'function' ? childVal.call(this, this) : childVal,
	        typeof parentVal === 'function' ? parentVal.call(this, this) : parentVal
	      )
	    }
	  } else {
	    return function mergedInstanceDataFn () {
	      // instance merge
	      var instanceData = typeof childVal === 'function'
	        ? childVal.call(vm, vm)
	        : childVal;
	      var defaultData = typeof parentVal === 'function'
	        ? parentVal.call(vm, vm)
	        : parentVal;
	      if (instanceData) {
	        return mergeData(instanceData, defaultData)
	      } else {
	        return defaultData
	      }
	    }
	  }
	}

	strats.data = function (
	  parentVal,
	  childVal,
	  vm
	) {
	  if (!vm) {
	    if (childVal && typeof childVal !== 'function') {
	      warn(
	        'The "data" option should be a function ' +
	        'that returns a per-instance value in component ' +
	        'definitions.',
	        vm
	      );

	      return parentVal
	    }
	    return mergeDataOrFn(parentVal, childVal)
	  }

	  return mergeDataOrFn(parentVal, childVal, vm)
	};

	/**
	 * Hooks and props are merged as arrays.
	 */
	function mergeHook (
	  parentVal,
	  childVal
	) {
	  return childVal
	    ? parentVal
	      ? parentVal.concat(childVal)
	      : Array.isArray(childVal)
	        ? childVal
	        : [childVal]
	    : parentVal
	}

	LIFECYCLE_HOOKS.forEach(function (hook) {
	  strats[hook] = mergeHook;
	});

	/**
	 * Assets
	 *
	 * When a vm is present (instance creation), we need to do
	 * a three-way merge between constructor options, instance
	 * options and parent options.
	 */
	function mergeAssets (
	  parentVal,
	  childVal,
	  vm,
	  key
	) {
	  var res = Object.create(parentVal || null);
	  if (childVal) {
	    assertObjectType(key, childVal, vm);
	    return extend(res, childVal)
	  } else {
	    return res
	  }
	}

	ASSET_TYPES.forEach(function (type) {
	  strats[type + 's'] = mergeAssets;
	});

	/**
	 * Watchers.
	 *
	 * Watchers hashes should not overwrite one
	 * another, so we merge them as arrays.
	 */
	strats.watch = function (
	  parentVal,
	  childVal,
	  vm,
	  key
	) {
	  // work around Firefox's Object.prototype.watch...
	  if (parentVal === nativeWatch) { parentVal = undefined; }
	  if (childVal === nativeWatch) { childVal = undefined; }
	  /* istanbul ignore if */
	  if (!childVal) { return Object.create(parentVal || null) }
	  {
	    assertObjectType(key, childVal, vm);
	  }
	  if (!parentVal) { return childVal }
	  var ret = {};
	  extend(ret, parentVal);
	  for (var key$1 in childVal) {
	    var parent = ret[key$1];
	    var child = childVal[key$1];
	    if (parent && !Array.isArray(parent)) {
	      parent = [parent];
	    }
	    ret[key$1] = parent
	      ? parent.concat(child)
	      : Array.isArray(child) ? child : [child];
	  }
	  return ret
	};

	/**
	 * Other object hashes.
	 */
	strats.props =
	strats.methods =
	strats.inject =
	strats.computed = function (
	  parentVal,
	  childVal,
	  vm,
	  key
	) {
	  if (childVal && "development" !== 'production') {
	    assertObjectType(key, childVal, vm);
	  }
	  if (!parentVal) { return childVal }
	  var ret = Object.create(null);
	  extend(ret, parentVal);
	  if (childVal) { extend(ret, childVal); }
	  return ret
	};
	strats.provide = mergeDataOrFn;

	/**
	 * Default strategy.
	 */
	var defaultStrat = function (parentVal, childVal) {
	  return childVal === undefined
	    ? parentVal
	    : childVal
	};



	function assertObjectType (name, value, vm) {
	  if (!isPlainObject(value)) {
	    warn(
	      "Invalid value for option \"" + name + "\": expected an Object, " +
	      "but got " + (toRawType(value)) + ".",
	      vm
	    );
	  }
	}

	/**
	 * Merge two option objects into a new one.
	 * Core utility used in both instantiation and inheritance.
	 */


	/**
	 * Resolve an asset.
	 * This function is used because child instances need access
	 * to assets defined in its ancestor chain.
	 */

	/*  */

	/*  */

	/*  */
	/* globals MessageChannel */

	var callbacks = [];
	function flushCallbacks () {
	  var copies = callbacks.slice(0);
	  callbacks.length = 0;
	  for (var i = 0; i < copies.length; i++) {
	    copies[i]();
	  }
	}

	// Determine (macro) task defer implementation.
	// Technically setImmediate should be the ideal choice, but it's only available
	// in IE. The only polyfill that consistently queues the callback after all DOM
	// events triggered in the same loop is by using MessageChannel.
	/* istanbul ignore if */
	if (typeof setImmediate !== 'undefined' && isNative(setImmediate)) ; else if (typeof MessageChannel !== 'undefined' && (
	  isNative(MessageChannel) ||
	  // PhantomJS
	  MessageChannel.toString() === '[object MessageChannelConstructor]'
	)) {
	  var channel = new MessageChannel();
	  channel.port1.onmessage = flushCallbacks;
	  
	}

	// Determine microtask defer implementation.
	/* istanbul ignore next, $flow-disable-line */
	if (typeof Promise !== 'undefined' && isNative(Promise)) ;

	/**
	 * Wrap a function so that if any code inside triggers state change,
	 * the changes are queued using a (macro) task instead of a microtask.
	 */

	/*  */

	/*  */

	// these are reserved for web because they are directly compiled away
	// during template compilation
	var isReservedAttr = makeMap('style,class');

	// attributes that should be using props for binding
	var acceptValue = makeMap('input,textarea,option,select,progress');
	var mustUseProp = function (tag, type, attr) {
	  return (
	    (attr === 'value' && acceptValue(tag)) && type !== 'button' ||
	    (attr === 'selected' && tag === 'option') ||
	    (attr === 'checked' && tag === 'input') ||
	    (attr === 'muted' && tag === 'video')
	  )
	};

	var isEnumeratedAttr = makeMap('contenteditable,draggable,spellcheck');

	var isBooleanAttr = makeMap(
	  'allowfullscreen,async,autofocus,autoplay,checked,compact,controls,declare,' +
	  'default,defaultchecked,defaultmuted,defaultselected,defer,disabled,' +
	  'enabled,formnovalidate,hidden,indeterminate,inert,ismap,itemscope,loop,multiple,' +
	  'muted,nohref,noresize,noshade,novalidate,nowrap,open,pauseonexit,readonly,' +
	  'required,reversed,scoped,seamless,selected,sortable,translate,' +
	  'truespeed,typemustmatch,visible'
	);

	/*  */

	/*  */



	var isHTMLTag = makeMap(
	  'html,body,base,head,link,meta,style,title,' +
	  'address,article,aside,footer,header,h1,h2,h3,h4,h5,h6,hgroup,nav,section,' +
	  'div,dd,dl,dt,figcaption,figure,picture,hr,img,li,main,ol,p,pre,ul,' +
	  'a,b,abbr,bdi,bdo,br,cite,code,data,dfn,em,i,kbd,mark,q,rp,rt,rtc,ruby,' +
	  's,samp,small,span,strong,sub,sup,time,u,var,wbr,area,audio,map,track,video,' +
	  'embed,object,param,source,canvas,script,noscript,del,ins,' +
	  'caption,col,colgroup,table,thead,tbody,td,th,tr,' +
	  'button,datalist,fieldset,form,input,label,legend,meter,optgroup,option,' +
	  'output,progress,select,textarea,' +
	  'details,dialog,menu,menuitem,summary,' +
	  'content,element,shadow,template,blockquote,iframe,tfoot'
	);

	// this map is intentionally selective, only covering SVG elements that may
	// contain child elements.
	var isSVG = makeMap(
	  'svg,animate,circle,clippath,cursor,defs,desc,ellipse,filter,font-face,' +
	  'foreignObject,g,glyph,image,line,marker,mask,missing-glyph,path,pattern,' +
	  'polygon,polyline,rect,switch,symbol,text,textpath,tspan,use,view',
	  true
	);

	var isPreTag = function (tag) { return tag === 'pre'; };

	var isReservedTag = function (tag) {
	  return isHTMLTag(tag) || isSVG(tag)
	};

	function getTagNamespace (tag) {
	  if (isSVG(tag)) {
	    return 'svg'
	  }
	  // basic support for MathML
	  // note it doesn't support other MathML elements being component roots
	  if (tag === 'math') {
	    return 'math'
	  }
	}



	var isTextInputType = makeMap('text,number,password,search,email,tel,url');

	/*  */

	/**
	 * Query an element selector if it's not an element already.
	 */

	/*  */

	var validDivisionCharRE = /[\w).+\-_$\]]/;

	function parseFilters (exp) {
	  var inSingle = false;
	  var inDouble = false;
	  var inTemplateString = false;
	  var inRegex = false;
	  var curly = 0;
	  var square = 0;
	  var paren = 0;
	  var lastFilterIndex = 0;
	  var c, prev, i, expression, filters;

	  for (i = 0; i < exp.length; i++) {
	    prev = c;
	    c = exp.charCodeAt(i);
	    if (inSingle) {
	      if (c === 0x27 && prev !== 0x5C) { inSingle = false; }
	    } else if (inDouble) {
	      if (c === 0x22 && prev !== 0x5C) { inDouble = false; }
	    } else if (inTemplateString) {
	      if (c === 0x60 && prev !== 0x5C) { inTemplateString = false; }
	    } else if (inRegex) {
	      if (c === 0x2f && prev !== 0x5C) { inRegex = false; }
	    } else if (
	      c === 0x7C && // pipe
	      exp.charCodeAt(i + 1) !== 0x7C &&
	      exp.charCodeAt(i - 1) !== 0x7C &&
	      !curly && !square && !paren
	    ) {
	      if (expression === undefined) {
	        // first filter, end of expression
	        lastFilterIndex = i + 1;
	        expression = exp.slice(0, i).trim();
	      } else {
	        pushFilter();
	      }
	    } else {
	      switch (c) {
	        case 0x22: inDouble = true; break         // "
	        case 0x27: inSingle = true; break         // '
	        case 0x60: inTemplateString = true; break // `
	        case 0x28: paren++; break                 // (
	        case 0x29: paren--; break                 // )
	        case 0x5B: square++; break                // [
	        case 0x5D: square--; break                // ]
	        case 0x7B: curly++; break                 // {
	        case 0x7D: curly--; break                 // }
	      }
	      if (c === 0x2f) { // /
	        var j = i - 1;
	        var p = (void 0);
	        // find first non-whitespace prev char
	        for (; j >= 0; j--) {
	          p = exp.charAt(j);
	          if (p !== ' ') { break }
	        }
	        if (!p || !validDivisionCharRE.test(p)) {
	          inRegex = true;
	        }
	      }
	    }
	  }

	  if (expression === undefined) {
	    expression = exp.slice(0, i).trim();
	  } else if (lastFilterIndex !== 0) {
	    pushFilter();
	  }

	  function pushFilter () {
	    (filters || (filters = [])).push(exp.slice(lastFilterIndex, i).trim());
	    lastFilterIndex = i + 1;
	  }

	  if (filters) {
	    for (i = 0; i < filters.length; i++) {
	      expression = wrapFilter(expression, filters[i]);
	    }
	  }

	  return expression
	}

	function wrapFilter (exp, filter) {
	  var i = filter.indexOf('(');
	  if (i < 0) {
	    // _f: resolveFilter
	    return ("_f(\"" + filter + "\")(" + exp + ")")
	  } else {
	    var name = filter.slice(0, i);
	    var args = filter.slice(i + 1);
	    return ("_f(\"" + name + "\")(" + exp + (args !== ')' ? ',' + args : args))
	  }
	}

	/*  */

	var defaultTagRE = /\{\{((?:.|\n)+?)\}\}/g;
	var regexEscapeRE = /[-.*+?^${}()|[\]\/\\]/g;

	var buildRegex = cached(function (delimiters) {
	  var open = delimiters[0].replace(regexEscapeRE, '\\$&');
	  var close = delimiters[1].replace(regexEscapeRE, '\\$&');
	  return new RegExp(open + '((?:.|\\n)+?)' + close, 'g')
	});



	function parseText (
	  text,
	  delimiters
	) {
	  var tagRE = delimiters ? buildRegex(delimiters) : defaultTagRE;
	  if (!tagRE.test(text)) {
	    return
	  }
	  var tokens = [];
	  var rawTokens = [];
	  var lastIndex = tagRE.lastIndex = 0;
	  var match, index, tokenValue;
	  while ((match = tagRE.exec(text))) {
	    index = match.index;
	    // push text token
	    if (index > lastIndex) {
	      rawTokens.push(tokenValue = text.slice(lastIndex, index));
	      tokens.push(JSON.stringify(tokenValue));
	    }
	    // tag token
	    var exp = parseFilters(match[1].trim());
	    tokens.push(("_s(" + exp + ")"));
	    rawTokens.push({ '@binding': exp });
	    lastIndex = index + match[0].length;
	  }
	  if (lastIndex < text.length) {
	    rawTokens.push(tokenValue = text.slice(lastIndex));
	    tokens.push(JSON.stringify(tokenValue));
	  }
	  return {
	    expression: tokens.join('+'),
	    tokens: rawTokens
	  }
	}

	/*  */

	function baseWarn (msg) {
	  console.error(("[Vue compiler]: " + msg));
	}

	function pluckModuleFunction (
	  modules,
	  key
	) {
	  return modules
	    ? modules.map(function (m) { return m[key]; }).filter(function (_) { return _; })
	    : []
	}

	function addProp (el, name, value) {
	  (el.props || (el.props = [])).push({ name: name, value: value });
	  el.plain = false;
	}

	function addAttr (el, name, value) {
	  (el.attrs || (el.attrs = [])).push({ name: name, value: value });
	  el.plain = false;
	}

	// add a raw attr (use this in preTransforms)
	function addRawAttr (el, name, value) {
	  el.attrsMap[name] = value;
	  el.attrsList.push({ name: name, value: value });
	}

	function addDirective (
	  el,
	  name,
	  rawName,
	  value,
	  arg,
	  modifiers
	) {
	  (el.directives || (el.directives = [])).push({ name: name, rawName: rawName, value: value, arg: arg, modifiers: modifiers });
	  el.plain = false;
	}

	function addHandler (
	  el,
	  name,
	  value,
	  modifiers,
	  important,
	  warn
	) {
	  modifiers = modifiers || emptyObject;
	  // warn prevent and passive modifier
	  /* istanbul ignore if */
	  if (
	    warn &&
	    modifiers.prevent && modifiers.passive
	  ) {
	    warn(
	      'passive and prevent can\'t be used together. ' +
	      'Passive handler can\'t prevent default event.'
	    );
	  }

	  // check capture modifier
	  if (modifiers.capture) {
	    delete modifiers.capture;
	    name = '!' + name; // mark the event as captured
	  }
	  if (modifiers.once) {
	    delete modifiers.once;
	    name = '~' + name; // mark the event as once
	  }
	  /* istanbul ignore if */
	  if (modifiers.passive) {
	    delete modifiers.passive;
	    name = '&' + name; // mark the event as passive
	  }

	  // normalize click.right and click.middle since they don't actually fire
	  // this is technically browser-specific, but at least for now browsers are
	  // the only target envs that have right/middle clicks.
	  if (name === 'click') {
	    if (modifiers.right) {
	      name = 'contextmenu';
	      delete modifiers.right;
	    } else if (modifiers.middle) {
	      name = 'mouseup';
	    }
	  }

	  var events;
	  if (modifiers.native) {
	    delete modifiers.native;
	    events = el.nativeEvents || (el.nativeEvents = {});
	  } else {
	    events = el.events || (el.events = {});
	  }

	  var newHandler = {
	    value: value.trim()
	  };
	  if (modifiers !== emptyObject) {
	    newHandler.modifiers = modifiers;
	  }

	  var handlers = events[name];
	  /* istanbul ignore if */
	  if (Array.isArray(handlers)) {
	    important ? handlers.unshift(newHandler) : handlers.push(newHandler);
	  } else if (handlers) {
	    events[name] = important ? [newHandler, handlers] : [handlers, newHandler];
	  } else {
	    events[name] = newHandler;
	  }

	  el.plain = false;
	}

	function getBindingAttr (
	  el,
	  name,
	  getStatic
	) {
	  var dynamicValue =
	    getAndRemoveAttr(el, ':' + name) ||
	    getAndRemoveAttr(el, 'v-bind:' + name);
	  if (dynamicValue != null) {
	    return parseFilters(dynamicValue)
	  } else if (getStatic !== false) {
	    var staticValue = getAndRemoveAttr(el, name);
	    if (staticValue != null) {
	      return JSON.stringify(staticValue)
	    }
	  }
	}

	// note: this only removes the attr from the Array (attrsList) so that it
	// doesn't get processed by processAttrs.
	// By default it does NOT remove it from the map (attrsMap) because the map is
	// needed during codegen.
	function getAndRemoveAttr (
	  el,
	  name,
	  removeFromMap
	) {
	  var val;
	  if ((val = el.attrsMap[name]) != null) {
	    var list = el.attrsList;
	    for (var i = 0, l = list.length; i < l; i++) {
	      if (list[i].name === name) {
	        list.splice(i, 1);
	        break
	      }
	    }
	  }
	  if (removeFromMap) {
	    delete el.attrsMap[name];
	  }
	  return val
	}

	/*  */

	function transformNode (el, options) {
	  var warn = options.warn || baseWarn;
	  var staticClass = getAndRemoveAttr(el, 'class');
	  if (staticClass) {
	    var res = parseText(staticClass, options.delimiters);
	    if (res) {
	      warn(
	        "class=\"" + staticClass + "\": " +
	        'Interpolation inside attributes has been removed. ' +
	        'Use v-bind or the colon shorthand instead. For example, ' +
	        'instead of <div class="{{ val }}">, use <div :class="val">.'
	      );
	    }
	  }
	  if (staticClass) {
	    el.staticClass = JSON.stringify(staticClass);
	  }
	  var classBinding = getBindingAttr(el, 'class', false /* getStatic */);
	  if (classBinding) {
	    el.classBinding = classBinding;
	  }
	}

	function genData (el) {
	  var data = '';
	  if (el.staticClass) {
	    data += "staticClass:" + (el.staticClass) + ",";
	  }
	  if (el.classBinding) {
	    data += "class:" + (el.classBinding) + ",";
	  }
	  return data
	}

	var klass = {
	  staticKeys: ['staticClass'],
	  transformNode: transformNode,
	  genData: genData
	};

	/*  */

	var parseStyleText = cached(function (cssText) {
	  var res = {};
	  var listDelimiter = /;(?![^(]*\))/g;
	  var propertyDelimiter = /:(.+)/;
	  cssText.split(listDelimiter).forEach(function (item) {
	    if (item) {
	      var tmp = item.split(propertyDelimiter);
	      tmp.length > 1 && (res[tmp[0].trim()] = tmp[1].trim());
	    }
	  });
	  return res
	});

	// normalize possible array / string values into Object


	/**
	 * parent component style should be after child's
	 * so that parent component's style could override it
	 */

	/*  */

	function transformNode$1 (el, options) {
	  var warn = options.warn || baseWarn;
	  var staticStyle = getAndRemoveAttr(el, 'style');
	  if (staticStyle) {
	    /* istanbul ignore if */
	    {
	      var res = parseText(staticStyle, options.delimiters);
	      if (res) {
	        warn(
	          "style=\"" + staticStyle + "\": " +
	          'Interpolation inside attributes has been removed. ' +
	          'Use v-bind or the colon shorthand instead. For example, ' +
	          'instead of <div style="{{ val }}">, use <div :style="val">.'
	        );
	      }
	    }
	    el.staticStyle = JSON.stringify(parseStyleText(staticStyle));
	  }

	  var styleBinding = getBindingAttr(el, 'style', false /* getStatic */);
	  if (styleBinding) {
	    el.styleBinding = styleBinding;
	  }
	}

	function genData$1 (el) {
	  var data = '';
	  if (el.staticStyle) {
	    data += "staticStyle:" + (el.staticStyle) + ",";
	  }
	  if (el.styleBinding) {
	    data += "style:(" + (el.styleBinding) + "),";
	  }
	  return data
	}

	var style = {
	  staticKeys: ['staticStyle'],
	  transformNode: transformNode$1,
	  genData: genData$1
	};

	var commonjsGlobal$$1 = typeof window !== 'undefined' ? window : typeof commonjsGlobal !== 'undefined' ? commonjsGlobal : typeof self !== 'undefined' ? self : {};





	function createCommonjsModule$$1(fn, module) {
		return module = { exports: {} }, fn(module, module.exports), module.exports;
	}

	var he = createCommonjsModule$$1(function (module, exports) {
	/*! https://mths.be/he v1.1.1 by @mathias | MIT license */
	(function(root) {

		// Detect free variables `exports`.
		var freeExports = exports;

		// Detect free variable `module`.
		var freeModule = module &&
			module.exports == freeExports && module;

		// Detect free variable `global`, from Node.js or Browserified code,
		// and use it as `root`.
		var freeGlobal = typeof commonjsGlobal$$1 == 'object' && commonjsGlobal$$1;
		if (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal) {
			root = freeGlobal;
		}

		/*--------------------------------------------------------------------------*/

		// All astral symbols.
		var regexAstralSymbols = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g;
		// All ASCII symbols (not just printable ASCII) except those listed in the
		// first column of the overrides table.
		// https://html.spec.whatwg.org/multipage/syntax.html#table-charref-overrides
		var regexAsciiWhitelist = /[\x01-\x7F]/g;
		// All BMP symbols that are not ASCII newlines, printable ASCII symbols, or
		// code points listed in the first column of the overrides table on
		// https://html.spec.whatwg.org/multipage/syntax.html#table-charref-overrides.
		var regexBmpWhitelist = /[\x01-\t\x0B\f\x0E-\x1F\x7F\x81\x8D\x8F\x90\x9D\xA0-\uFFFF]/g;

		var regexEncodeNonAscii = /<\u20D2|=\u20E5|>\u20D2|\u205F\u200A|\u219D\u0338|\u2202\u0338|\u2220\u20D2|\u2229\uFE00|\u222A\uFE00|\u223C\u20D2|\u223D\u0331|\u223E\u0333|\u2242\u0338|\u224B\u0338|\u224D\u20D2|\u224E\u0338|\u224F\u0338|\u2250\u0338|\u2261\u20E5|\u2264\u20D2|\u2265\u20D2|\u2266\u0338|\u2267\u0338|\u2268\uFE00|\u2269\uFE00|\u226A\u0338|\u226A\u20D2|\u226B\u0338|\u226B\u20D2|\u227F\u0338|\u2282\u20D2|\u2283\u20D2|\u228A\uFE00|\u228B\uFE00|\u228F\u0338|\u2290\u0338|\u2293\uFE00|\u2294\uFE00|\u22B4\u20D2|\u22B5\u20D2|\u22D8\u0338|\u22D9\u0338|\u22DA\uFE00|\u22DB\uFE00|\u22F5\u0338|\u22F9\u0338|\u2933\u0338|\u29CF\u0338|\u29D0\u0338|\u2A6D\u0338|\u2A70\u0338|\u2A7D\u0338|\u2A7E\u0338|\u2AA1\u0338|\u2AA2\u0338|\u2AAC\uFE00|\u2AAD\uFE00|\u2AAF\u0338|\u2AB0\u0338|\u2AC5\u0338|\u2AC6\u0338|\u2ACB\uFE00|\u2ACC\uFE00|\u2AFD\u20E5|[\xA0-\u0113\u0116-\u0122\u0124-\u012B\u012E-\u014D\u0150-\u017E\u0192\u01B5\u01F5\u0237\u02C6\u02C7\u02D8-\u02DD\u0311\u0391-\u03A1\u03A3-\u03A9\u03B1-\u03C9\u03D1\u03D2\u03D5\u03D6\u03DC\u03DD\u03F0\u03F1\u03F5\u03F6\u0401-\u040C\u040E-\u044F\u0451-\u045C\u045E\u045F\u2002-\u2005\u2007-\u2010\u2013-\u2016\u2018-\u201A\u201C-\u201E\u2020-\u2022\u2025\u2026\u2030-\u2035\u2039\u203A\u203E\u2041\u2043\u2044\u204F\u2057\u205F-\u2063\u20AC\u20DB\u20DC\u2102\u2105\u210A-\u2113\u2115-\u211E\u2122\u2124\u2127-\u2129\u212C\u212D\u212F-\u2131\u2133-\u2138\u2145-\u2148\u2153-\u215E\u2190-\u219B\u219D-\u21A7\u21A9-\u21AE\u21B0-\u21B3\u21B5-\u21B7\u21BA-\u21DB\u21DD\u21E4\u21E5\u21F5\u21FD-\u2205\u2207-\u2209\u220B\u220C\u220F-\u2214\u2216-\u2218\u221A\u221D-\u2238\u223A-\u2257\u2259\u225A\u225C\u225F-\u2262\u2264-\u228B\u228D-\u229B\u229D-\u22A5\u22A7-\u22B0\u22B2-\u22BB\u22BD-\u22DB\u22DE-\u22E3\u22E6-\u22F7\u22F9-\u22FE\u2305\u2306\u2308-\u2310\u2312\u2313\u2315\u2316\u231C-\u231F\u2322\u2323\u232D\u232E\u2336\u233D\u233F\u237C\u23B0\u23B1\u23B4-\u23B6\u23DC-\u23DF\u23E2\u23E7\u2423\u24C8\u2500\u2502\u250C\u2510\u2514\u2518\u251C\u2524\u252C\u2534\u253C\u2550-\u256C\u2580\u2584\u2588\u2591-\u2593\u25A1\u25AA\u25AB\u25AD\u25AE\u25B1\u25B3-\u25B5\u25B8\u25B9\u25BD-\u25BF\u25C2\u25C3\u25CA\u25CB\u25EC\u25EF\u25F8-\u25FC\u2605\u2606\u260E\u2640\u2642\u2660\u2663\u2665\u2666\u266A\u266D-\u266F\u2713\u2717\u2720\u2736\u2758\u2772\u2773\u27C8\u27C9\u27E6-\u27ED\u27F5-\u27FA\u27FC\u27FF\u2902-\u2905\u290C-\u2913\u2916\u2919-\u2920\u2923-\u292A\u2933\u2935-\u2939\u293C\u293D\u2945\u2948-\u294B\u294E-\u2976\u2978\u2979\u297B-\u297F\u2985\u2986\u298B-\u2996\u299A\u299C\u299D\u29A4-\u29B7\u29B9\u29BB\u29BC\u29BE-\u29C5\u29C9\u29CD-\u29D0\u29DC-\u29DE\u29E3-\u29E5\u29EB\u29F4\u29F6\u2A00-\u2A02\u2A04\u2A06\u2A0C\u2A0D\u2A10-\u2A17\u2A22-\u2A27\u2A29\u2A2A\u2A2D-\u2A31\u2A33-\u2A3C\u2A3F\u2A40\u2A42-\u2A4D\u2A50\u2A53-\u2A58\u2A5A-\u2A5D\u2A5F\u2A66\u2A6A\u2A6D-\u2A75\u2A77-\u2A9A\u2A9D-\u2AA2\u2AA4-\u2AB0\u2AB3-\u2AC8\u2ACB\u2ACC\u2ACF-\u2ADB\u2AE4\u2AE6-\u2AE9\u2AEB-\u2AF3\u2AFD\uFB00-\uFB04]|\uD835[\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDCCF\uDD04\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDD6B]/g;
		var encodeMap = {'\xAD':'shy','\u200C':'zwnj','\u200D':'zwj','\u200E':'lrm','\u2063':'ic','\u2062':'it','\u2061':'af','\u200F':'rlm','\u200B':'ZeroWidthSpace','\u2060':'NoBreak','\u0311':'DownBreve','\u20DB':'tdot','\u20DC':'DotDot','\t':'Tab','\n':'NewLine','\u2008':'puncsp','\u205F':'MediumSpace','\u2009':'thinsp','\u200A':'hairsp','\u2004':'emsp13','\u2002':'ensp','\u2005':'emsp14','\u2003':'emsp','\u2007':'numsp','\xA0':'nbsp','\u205F\u200A':'ThickSpace','\u203E':'oline','_':'lowbar','\u2010':'dash','\u2013':'ndash','\u2014':'mdash','\u2015':'horbar',',':'comma',';':'semi','\u204F':'bsemi',':':'colon','\u2A74':'Colone','!':'excl','\xA1':'iexcl','?':'quest','\xBF':'iquest','.':'period','\u2025':'nldr','\u2026':'mldr','\xB7':'middot','\'':'apos','\u2018':'lsquo','\u2019':'rsquo','\u201A':'sbquo','\u2039':'lsaquo','\u203A':'rsaquo','"':'quot','\u201C':'ldquo','\u201D':'rdquo','\u201E':'bdquo','\xAB':'laquo','\xBB':'raquo','(':'lpar',')':'rpar','[':'lsqb',']':'rsqb','{':'lcub','}':'rcub','\u2308':'lceil','\u2309':'rceil','\u230A':'lfloor','\u230B':'rfloor','\u2985':'lopar','\u2986':'ropar','\u298B':'lbrke','\u298C':'rbrke','\u298D':'lbrkslu','\u298E':'rbrksld','\u298F':'lbrksld','\u2990':'rbrkslu','\u2991':'langd','\u2992':'rangd','\u2993':'lparlt','\u2994':'rpargt','\u2995':'gtlPar','\u2996':'ltrPar','\u27E6':'lobrk','\u27E7':'robrk','\u27E8':'lang','\u27E9':'rang','\u27EA':'Lang','\u27EB':'Rang','\u27EC':'loang','\u27ED':'roang','\u2772':'lbbrk','\u2773':'rbbrk','\u2016':'Vert','\xA7':'sect','\xB6':'para','@':'commat','*':'ast','/':'sol','undefined':null,'&':'amp','#':'num','%':'percnt','\u2030':'permil','\u2031':'pertenk','\u2020':'dagger','\u2021':'Dagger','\u2022':'bull','\u2043':'hybull','\u2032':'prime','\u2033':'Prime','\u2034':'tprime','\u2057':'qprime','\u2035':'bprime','\u2041':'caret','`':'grave','\xB4':'acute','\u02DC':'tilde','^':'Hat','\xAF':'macr','\u02D8':'breve','\u02D9':'dot','\xA8':'die','\u02DA':'ring','\u02DD':'dblac','\xB8':'cedil','\u02DB':'ogon','\u02C6':'circ','\u02C7':'caron','\xB0':'deg','\xA9':'copy','\xAE':'reg','\u2117':'copysr','\u2118':'wp','\u211E':'rx','\u2127':'mho','\u2129':'iiota','\u2190':'larr','\u219A':'nlarr','\u2192':'rarr','\u219B':'nrarr','\u2191':'uarr','\u2193':'darr','\u2194':'harr','\u21AE':'nharr','\u2195':'varr','\u2196':'nwarr','\u2197':'nearr','\u2198':'searr','\u2199':'swarr','\u219D':'rarrw','\u219D\u0338':'nrarrw','\u219E':'Larr','\u219F':'Uarr','\u21A0':'Rarr','\u21A1':'Darr','\u21A2':'larrtl','\u21A3':'rarrtl','\u21A4':'mapstoleft','\u21A5':'mapstoup','\u21A6':'map','\u21A7':'mapstodown','\u21A9':'larrhk','\u21AA':'rarrhk','\u21AB':'larrlp','\u21AC':'rarrlp','\u21AD':'harrw','\u21B0':'lsh','\u21B1':'rsh','\u21B2':'ldsh','\u21B3':'rdsh','\u21B5':'crarr','\u21B6':'cularr','\u21B7':'curarr','\u21BA':'olarr','\u21BB':'orarr','\u21BC':'lharu','\u21BD':'lhard','\u21BE':'uharr','\u21BF':'uharl','\u21C0':'rharu','\u21C1':'rhard','\u21C2':'dharr','\u21C3':'dharl','\u21C4':'rlarr','\u21C5':'udarr','\u21C6':'lrarr','\u21C7':'llarr','\u21C8':'uuarr','\u21C9':'rrarr','\u21CA':'ddarr','\u21CB':'lrhar','\u21CC':'rlhar','\u21D0':'lArr','\u21CD':'nlArr','\u21D1':'uArr','\u21D2':'rArr','\u21CF':'nrArr','\u21D3':'dArr','\u21D4':'iff','\u21CE':'nhArr','\u21D5':'vArr','\u21D6':'nwArr','\u21D7':'neArr','\u21D8':'seArr','\u21D9':'swArr','\u21DA':'lAarr','\u21DB':'rAarr','\u21DD':'zigrarr','\u21E4':'larrb','\u21E5':'rarrb','\u21F5':'duarr','\u21FD':'loarr','\u21FE':'roarr','\u21FF':'hoarr','\u2200':'forall','\u2201':'comp','\u2202':'part','\u2202\u0338':'npart','\u2203':'exist','\u2204':'nexist','\u2205':'empty','\u2207':'Del','\u2208':'in','\u2209':'notin','\u220B':'ni','\u220C':'notni','\u03F6':'bepsi','\u220F':'prod','\u2210':'coprod','\u2211':'sum','+':'plus','\xB1':'pm','\xF7':'div','\xD7':'times','<':'lt','\u226E':'nlt','<\u20D2':'nvlt','=':'equals','\u2260':'ne','=\u20E5':'bne','\u2A75':'Equal','>':'gt','\u226F':'ngt','>\u20D2':'nvgt','\xAC':'not','|':'vert','\xA6':'brvbar','\u2212':'minus','\u2213':'mp','\u2214':'plusdo','\u2044':'frasl','\u2216':'setmn','\u2217':'lowast','\u2218':'compfn','\u221A':'Sqrt','\u221D':'prop','\u221E':'infin','\u221F':'angrt','\u2220':'ang','\u2220\u20D2':'nang','\u2221':'angmsd','\u2222':'angsph','\u2223':'mid','\u2224':'nmid','\u2225':'par','\u2226':'npar','\u2227':'and','\u2228':'or','\u2229':'cap','\u2229\uFE00':'caps','\u222A':'cup','\u222A\uFE00':'cups','\u222B':'int','\u222C':'Int','\u222D':'tint','\u2A0C':'qint','\u222E':'oint','\u222F':'Conint','\u2230':'Cconint','\u2231':'cwint','\u2232':'cwconint','\u2233':'awconint','\u2234':'there4','\u2235':'becaus','\u2236':'ratio','\u2237':'Colon','\u2238':'minusd','\u223A':'mDDot','\u223B':'homtht','\u223C':'sim','\u2241':'nsim','\u223C\u20D2':'nvsim','\u223D':'bsim','\u223D\u0331':'race','\u223E':'ac','\u223E\u0333':'acE','\u223F':'acd','\u2240':'wr','\u2242':'esim','\u2242\u0338':'nesim','\u2243':'sime','\u2244':'nsime','\u2245':'cong','\u2247':'ncong','\u2246':'simne','\u2248':'ap','\u2249':'nap','\u224A':'ape','\u224B':'apid','\u224B\u0338':'napid','\u224C':'bcong','\u224D':'CupCap','\u226D':'NotCupCap','\u224D\u20D2':'nvap','\u224E':'bump','\u224E\u0338':'nbump','\u224F':'bumpe','\u224F\u0338':'nbumpe','\u2250':'doteq','\u2250\u0338':'nedot','\u2251':'eDot','\u2252':'efDot','\u2253':'erDot','\u2254':'colone','\u2255':'ecolon','\u2256':'ecir','\u2257':'cire','\u2259':'wedgeq','\u225A':'veeeq','\u225C':'trie','\u225F':'equest','\u2261':'equiv','\u2262':'nequiv','\u2261\u20E5':'bnequiv','\u2264':'le','\u2270':'nle','\u2264\u20D2':'nvle','\u2265':'ge','\u2271':'nge','\u2265\u20D2':'nvge','\u2266':'lE','\u2266\u0338':'nlE','\u2267':'gE','\u2267\u0338':'ngE','\u2268\uFE00':'lvnE','\u2268':'lnE','\u2269':'gnE','\u2269\uFE00':'gvnE','\u226A':'ll','\u226A\u0338':'nLtv','\u226A\u20D2':'nLt','\u226B':'gg','\u226B\u0338':'nGtv','\u226B\u20D2':'nGt','\u226C':'twixt','\u2272':'lsim','\u2274':'nlsim','\u2273':'gsim','\u2275':'ngsim','\u2276':'lg','\u2278':'ntlg','\u2277':'gl','\u2279':'ntgl','\u227A':'pr','\u2280':'npr','\u227B':'sc','\u2281':'nsc','\u227C':'prcue','\u22E0':'nprcue','\u227D':'sccue','\u22E1':'nsccue','\u227E':'prsim','\u227F':'scsim','\u227F\u0338':'NotSucceedsTilde','\u2282':'sub','\u2284':'nsub','\u2282\u20D2':'vnsub','\u2283':'sup','\u2285':'nsup','\u2283\u20D2':'vnsup','\u2286':'sube','\u2288':'nsube','\u2287':'supe','\u2289':'nsupe','\u228A\uFE00':'vsubne','\u228A':'subne','\u228B\uFE00':'vsupne','\u228B':'supne','\u228D':'cupdot','\u228E':'uplus','\u228F':'sqsub','\u228F\u0338':'NotSquareSubset','\u2290':'sqsup','\u2290\u0338':'NotSquareSuperset','\u2291':'sqsube','\u22E2':'nsqsube','\u2292':'sqsupe','\u22E3':'nsqsupe','\u2293':'sqcap','\u2293\uFE00':'sqcaps','\u2294':'sqcup','\u2294\uFE00':'sqcups','\u2295':'oplus','\u2296':'ominus','\u2297':'otimes','\u2298':'osol','\u2299':'odot','\u229A':'ocir','\u229B':'oast','\u229D':'odash','\u229E':'plusb','\u229F':'minusb','\u22A0':'timesb','\u22A1':'sdotb','\u22A2':'vdash','\u22AC':'nvdash','\u22A3':'dashv','\u22A4':'top','\u22A5':'bot','\u22A7':'models','\u22A8':'vDash','\u22AD':'nvDash','\u22A9':'Vdash','\u22AE':'nVdash','\u22AA':'Vvdash','\u22AB':'VDash','\u22AF':'nVDash','\u22B0':'prurel','\u22B2':'vltri','\u22EA':'nltri','\u22B3':'vrtri','\u22EB':'nrtri','\u22B4':'ltrie','\u22EC':'nltrie','\u22B4\u20D2':'nvltrie','\u22B5':'rtrie','\u22ED':'nrtrie','\u22B5\u20D2':'nvrtrie','\u22B6':'origof','\u22B7':'imof','\u22B8':'mumap','\u22B9':'hercon','\u22BA':'intcal','\u22BB':'veebar','\u22BD':'barvee','\u22BE':'angrtvb','\u22BF':'lrtri','\u22C0':'Wedge','\u22C1':'Vee','\u22C2':'xcap','\u22C3':'xcup','\u22C4':'diam','\u22C5':'sdot','\u22C6':'Star','\u22C7':'divonx','\u22C8':'bowtie','\u22C9':'ltimes','\u22CA':'rtimes','\u22CB':'lthree','\u22CC':'rthree','\u22CD':'bsime','\u22CE':'cuvee','\u22CF':'cuwed','\u22D0':'Sub','\u22D1':'Sup','\u22D2':'Cap','\u22D3':'Cup','\u22D4':'fork','\u22D5':'epar','\u22D6':'ltdot','\u22D7':'gtdot','\u22D8':'Ll','\u22D8\u0338':'nLl','\u22D9':'Gg','\u22D9\u0338':'nGg','\u22DA\uFE00':'lesg','\u22DA':'leg','\u22DB':'gel','\u22DB\uFE00':'gesl','\u22DE':'cuepr','\u22DF':'cuesc','\u22E6':'lnsim','\u22E7':'gnsim','\u22E8':'prnsim','\u22E9':'scnsim','\u22EE':'vellip','\u22EF':'ctdot','\u22F0':'utdot','\u22F1':'dtdot','\u22F2':'disin','\u22F3':'isinsv','\u22F4':'isins','\u22F5':'isindot','\u22F5\u0338':'notindot','\u22F6':'notinvc','\u22F7':'notinvb','\u22F9':'isinE','\u22F9\u0338':'notinE','\u22FA':'nisd','\u22FB':'xnis','\u22FC':'nis','\u22FD':'notnivc','\u22FE':'notnivb','\u2305':'barwed','\u2306':'Barwed','\u230C':'drcrop','\u230D':'dlcrop','\u230E':'urcrop','\u230F':'ulcrop','\u2310':'bnot','\u2312':'profline','\u2313':'profsurf','\u2315':'telrec','\u2316':'target','\u231C':'ulcorn','\u231D':'urcorn','\u231E':'dlcorn','\u231F':'drcorn','\u2322':'frown','\u2323':'smile','\u232D':'cylcty','\u232E':'profalar','\u2336':'topbot','\u233D':'ovbar','\u233F':'solbar','\u237C':'angzarr','\u23B0':'lmoust','\u23B1':'rmoust','\u23B4':'tbrk','\u23B5':'bbrk','\u23B6':'bbrktbrk','\u23DC':'OverParenthesis','\u23DD':'UnderParenthesis','\u23DE':'OverBrace','\u23DF':'UnderBrace','\u23E2':'trpezium','\u23E7':'elinters','\u2423':'blank','\u2500':'boxh','\u2502':'boxv','\u250C':'boxdr','\u2510':'boxdl','\u2514':'boxur','\u2518':'boxul','\u251C':'boxvr','\u2524':'boxvl','\u252C':'boxhd','\u2534':'boxhu','\u253C':'boxvh','\u2550':'boxH','\u2551':'boxV','\u2552':'boxdR','\u2553':'boxDr','\u2554':'boxDR','\u2555':'boxdL','\u2556':'boxDl','\u2557':'boxDL','\u2558':'boxuR','\u2559':'boxUr','\u255A':'boxUR','\u255B':'boxuL','\u255C':'boxUl','\u255D':'boxUL','\u255E':'boxvR','\u255F':'boxVr','\u2560':'boxVR','\u2561':'boxvL','\u2562':'boxVl','\u2563':'boxVL','\u2564':'boxHd','\u2565':'boxhD','\u2566':'boxHD','\u2567':'boxHu','\u2568':'boxhU','\u2569':'boxHU','\u256A':'boxvH','\u256B':'boxVh','\u256C':'boxVH','\u2580':'uhblk','\u2584':'lhblk','\u2588':'block','\u2591':'blk14','\u2592':'blk12','\u2593':'blk34','\u25A1':'squ','\u25AA':'squf','\u25AB':'EmptyVerySmallSquare','\u25AD':'rect','\u25AE':'marker','\u25B1':'fltns','\u25B3':'xutri','\u25B4':'utrif','\u25B5':'utri','\u25B8':'rtrif','\u25B9':'rtri','\u25BD':'xdtri','\u25BE':'dtrif','\u25BF':'dtri','\u25C2':'ltrif','\u25C3':'ltri','\u25CA':'loz','\u25CB':'cir','\u25EC':'tridot','\u25EF':'xcirc','\u25F8':'ultri','\u25F9':'urtri','\u25FA':'lltri','\u25FB':'EmptySmallSquare','\u25FC':'FilledSmallSquare','\u2605':'starf','\u2606':'star','\u260E':'phone','\u2640':'female','\u2642':'male','\u2660':'spades','\u2663':'clubs','\u2665':'hearts','\u2666':'diams','\u266A':'sung','\u2713':'check','\u2717':'cross','\u2720':'malt','\u2736':'sext','\u2758':'VerticalSeparator','\u27C8':'bsolhsub','\u27C9':'suphsol','\u27F5':'xlarr','\u27F6':'xrarr','\u27F7':'xharr','\u27F8':'xlArr','\u27F9':'xrArr','\u27FA':'xhArr','\u27FC':'xmap','\u27FF':'dzigrarr','\u2902':'nvlArr','\u2903':'nvrArr','\u2904':'nvHarr','\u2905':'Map','\u290C':'lbarr','\u290D':'rbarr','\u290E':'lBarr','\u290F':'rBarr','\u2910':'RBarr','\u2911':'DDotrahd','\u2912':'UpArrowBar','\u2913':'DownArrowBar','\u2916':'Rarrtl','\u2919':'latail','\u291A':'ratail','\u291B':'lAtail','\u291C':'rAtail','\u291D':'larrfs','\u291E':'rarrfs','\u291F':'larrbfs','\u2920':'rarrbfs','\u2923':'nwarhk','\u2924':'nearhk','\u2925':'searhk','\u2926':'swarhk','\u2927':'nwnear','\u2928':'toea','\u2929':'tosa','\u292A':'swnwar','\u2933':'rarrc','\u2933\u0338':'nrarrc','\u2935':'cudarrr','\u2936':'ldca','\u2937':'rdca','\u2938':'cudarrl','\u2939':'larrpl','\u293C':'curarrm','\u293D':'cularrp','\u2945':'rarrpl','\u2948':'harrcir','\u2949':'Uarrocir','\u294A':'lurdshar','\u294B':'ldrushar','\u294E':'LeftRightVector','\u294F':'RightUpDownVector','\u2950':'DownLeftRightVector','\u2951':'LeftUpDownVector','\u2952':'LeftVectorBar','\u2953':'RightVectorBar','\u2954':'RightUpVectorBar','\u2955':'RightDownVectorBar','\u2956':'DownLeftVectorBar','\u2957':'DownRightVectorBar','\u2958':'LeftUpVectorBar','\u2959':'LeftDownVectorBar','\u295A':'LeftTeeVector','\u295B':'RightTeeVector','\u295C':'RightUpTeeVector','\u295D':'RightDownTeeVector','\u295E':'DownLeftTeeVector','\u295F':'DownRightTeeVector','\u2960':'LeftUpTeeVector','\u2961':'LeftDownTeeVector','\u2962':'lHar','\u2963':'uHar','\u2964':'rHar','\u2965':'dHar','\u2966':'luruhar','\u2967':'ldrdhar','\u2968':'ruluhar','\u2969':'rdldhar','\u296A':'lharul','\u296B':'llhard','\u296C':'rharul','\u296D':'lrhard','\u296E':'udhar','\u296F':'duhar','\u2970':'RoundImplies','\u2971':'erarr','\u2972':'simrarr','\u2973':'larrsim','\u2974':'rarrsim','\u2975':'rarrap','\u2976':'ltlarr','\u2978':'gtrarr','\u2979':'subrarr','\u297B':'suplarr','\u297C':'lfisht','\u297D':'rfisht','\u297E':'ufisht','\u297F':'dfisht','\u299A':'vzigzag','\u299C':'vangrt','\u299D':'angrtvbd','\u29A4':'ange','\u29A5':'range','\u29A6':'dwangle','\u29A7':'uwangle','\u29A8':'angmsdaa','\u29A9':'angmsdab','\u29AA':'angmsdac','\u29AB':'angmsdad','\u29AC':'angmsdae','\u29AD':'angmsdaf','\u29AE':'angmsdag','\u29AF':'angmsdah','\u29B0':'bemptyv','\u29B1':'demptyv','\u29B2':'cemptyv','\u29B3':'raemptyv','\u29B4':'laemptyv','\u29B5':'ohbar','\u29B6':'omid','\u29B7':'opar','\u29B9':'operp','\u29BB':'olcross','\u29BC':'odsold','\u29BE':'olcir','\u29BF':'ofcir','\u29C0':'olt','\u29C1':'ogt','\u29C2':'cirscir','\u29C3':'cirE','\u29C4':'solb','\u29C5':'bsolb','\u29C9':'boxbox','\u29CD':'trisb','\u29CE':'rtriltri','\u29CF':'LeftTriangleBar','\u29CF\u0338':'NotLeftTriangleBar','\u29D0':'RightTriangleBar','\u29D0\u0338':'NotRightTriangleBar','\u29DC':'iinfin','\u29DD':'infintie','\u29DE':'nvinfin','\u29E3':'eparsl','\u29E4':'smeparsl','\u29E5':'eqvparsl','\u29EB':'lozf','\u29F4':'RuleDelayed','\u29F6':'dsol','\u2A00':'xodot','\u2A01':'xoplus','\u2A02':'xotime','\u2A04':'xuplus','\u2A06':'xsqcup','\u2A0D':'fpartint','\u2A10':'cirfnint','\u2A11':'awint','\u2A12':'rppolint','\u2A13':'scpolint','\u2A14':'npolint','\u2A15':'pointint','\u2A16':'quatint','\u2A17':'intlarhk','\u2A22':'pluscir','\u2A23':'plusacir','\u2A24':'simplus','\u2A25':'plusdu','\u2A26':'plussim','\u2A27':'plustwo','\u2A29':'mcomma','\u2A2A':'minusdu','\u2A2D':'loplus','\u2A2E':'roplus','\u2A2F':'Cross','\u2A30':'timesd','\u2A31':'timesbar','\u2A33':'smashp','\u2A34':'lotimes','\u2A35':'rotimes','\u2A36':'otimesas','\u2A37':'Otimes','\u2A38':'odiv','\u2A39':'triplus','\u2A3A':'triminus','\u2A3B':'tritime','\u2A3C':'iprod','\u2A3F':'amalg','\u2A40':'capdot','\u2A42':'ncup','\u2A43':'ncap','\u2A44':'capand','\u2A45':'cupor','\u2A46':'cupcap','\u2A47':'capcup','\u2A48':'cupbrcap','\u2A49':'capbrcup','\u2A4A':'cupcup','\u2A4B':'capcap','\u2A4C':'ccups','\u2A4D':'ccaps','\u2A50':'ccupssm','\u2A53':'And','\u2A54':'Or','\u2A55':'andand','\u2A56':'oror','\u2A57':'orslope','\u2A58':'andslope','\u2A5A':'andv','\u2A5B':'orv','\u2A5C':'andd','\u2A5D':'ord','\u2A5F':'wedbar','\u2A66':'sdote','\u2A6A':'simdot','\u2A6D':'congdot','\u2A6D\u0338':'ncongdot','\u2A6E':'easter','\u2A6F':'apacir','\u2A70':'apE','\u2A70\u0338':'napE','\u2A71':'eplus','\u2A72':'pluse','\u2A73':'Esim','\u2A77':'eDDot','\u2A78':'equivDD','\u2A79':'ltcir','\u2A7A':'gtcir','\u2A7B':'ltquest','\u2A7C':'gtquest','\u2A7D':'les','\u2A7D\u0338':'nles','\u2A7E':'ges','\u2A7E\u0338':'nges','\u2A7F':'lesdot','\u2A80':'gesdot','\u2A81':'lesdoto','\u2A82':'gesdoto','\u2A83':'lesdotor','\u2A84':'gesdotol','\u2A85':'lap','\u2A86':'gap','\u2A87':'lne','\u2A88':'gne','\u2A89':'lnap','\u2A8A':'gnap','\u2A8B':'lEg','\u2A8C':'gEl','\u2A8D':'lsime','\u2A8E':'gsime','\u2A8F':'lsimg','\u2A90':'gsiml','\u2A91':'lgE','\u2A92':'glE','\u2A93':'lesges','\u2A94':'gesles','\u2A95':'els','\u2A96':'egs','\u2A97':'elsdot','\u2A98':'egsdot','\u2A99':'el','\u2A9A':'eg','\u2A9D':'siml','\u2A9E':'simg','\u2A9F':'simlE','\u2AA0':'simgE','\u2AA1':'LessLess','\u2AA1\u0338':'NotNestedLessLess','\u2AA2':'GreaterGreater','\u2AA2\u0338':'NotNestedGreaterGreater','\u2AA4':'glj','\u2AA5':'gla','\u2AA6':'ltcc','\u2AA7':'gtcc','\u2AA8':'lescc','\u2AA9':'gescc','\u2AAA':'smt','\u2AAB':'lat','\u2AAC':'smte','\u2AAC\uFE00':'smtes','\u2AAD':'late','\u2AAD\uFE00':'lates','\u2AAE':'bumpE','\u2AAF':'pre','\u2AAF\u0338':'npre','\u2AB0':'sce','\u2AB0\u0338':'nsce','\u2AB3':'prE','\u2AB4':'scE','\u2AB5':'prnE','\u2AB6':'scnE','\u2AB7':'prap','\u2AB8':'scap','\u2AB9':'prnap','\u2ABA':'scnap','\u2ABB':'Pr','\u2ABC':'Sc','\u2ABD':'subdot','\u2ABE':'supdot','\u2ABF':'subplus','\u2AC0':'supplus','\u2AC1':'submult','\u2AC2':'supmult','\u2AC3':'subedot','\u2AC4':'supedot','\u2AC5':'subE','\u2AC5\u0338':'nsubE','\u2AC6':'supE','\u2AC6\u0338':'nsupE','\u2AC7':'subsim','\u2AC8':'supsim','\u2ACB\uFE00':'vsubnE','\u2ACB':'subnE','\u2ACC\uFE00':'vsupnE','\u2ACC':'supnE','\u2ACF':'csub','\u2AD0':'csup','\u2AD1':'csube','\u2AD2':'csupe','\u2AD3':'subsup','\u2AD4':'supsub','\u2AD5':'subsub','\u2AD6':'supsup','\u2AD7':'suphsub','\u2AD8':'supdsub','\u2AD9':'forkv','\u2ADA':'topfork','\u2ADB':'mlcp','\u2AE4':'Dashv','\u2AE6':'Vdashl','\u2AE7':'Barv','\u2AE8':'vBar','\u2AE9':'vBarv','\u2AEB':'Vbar','\u2AEC':'Not','\u2AED':'bNot','\u2AEE':'rnmid','\u2AEF':'cirmid','\u2AF0':'midcir','\u2AF1':'topcir','\u2AF2':'nhpar','\u2AF3':'parsim','\u2AFD':'parsl','\u2AFD\u20E5':'nparsl','\u266D':'flat','\u266E':'natur','\u266F':'sharp','\xA4':'curren','\xA2':'cent','$':'dollar','\xA3':'pound','\xA5':'yen','\u20AC':'euro','\xB9':'sup1','\xBD':'half','\u2153':'frac13','\xBC':'frac14','\u2155':'frac15','\u2159':'frac16','\u215B':'frac18','\xB2':'sup2','\u2154':'frac23','\u2156':'frac25','\xB3':'sup3','\xBE':'frac34','\u2157':'frac35','\u215C':'frac38','\u2158':'frac45','\u215A':'frac56','\u215D':'frac58','\u215E':'frac78','\uD835\uDCB6':'ascr','\uD835\uDD52':'aopf','\uD835\uDD1E':'afr','\uD835\uDD38':'Aopf','\uD835\uDD04':'Afr','\uD835\uDC9C':'Ascr','\xAA':'ordf','\xE1':'aacute','\xC1':'Aacute','\xE0':'agrave','\xC0':'Agrave','\u0103':'abreve','\u0102':'Abreve','\xE2':'acirc','\xC2':'Acirc','\xE5':'aring','\xC5':'angst','\xE4':'auml','\xC4':'Auml','\xE3':'atilde','\xC3':'Atilde','\u0105':'aogon','\u0104':'Aogon','\u0101':'amacr','\u0100':'Amacr','\xE6':'aelig','\xC6':'AElig','\uD835\uDCB7':'bscr','\uD835\uDD53':'bopf','\uD835\uDD1F':'bfr','\uD835\uDD39':'Bopf','\u212C':'Bscr','\uD835\uDD05':'Bfr','\uD835\uDD20':'cfr','\uD835\uDCB8':'cscr','\uD835\uDD54':'copf','\u212D':'Cfr','\uD835\uDC9E':'Cscr','\u2102':'Copf','\u0107':'cacute','\u0106':'Cacute','\u0109':'ccirc','\u0108':'Ccirc','\u010D':'ccaron','\u010C':'Ccaron','\u010B':'cdot','\u010A':'Cdot','\xE7':'ccedil','\xC7':'Ccedil','\u2105':'incare','\uD835\uDD21':'dfr','\u2146':'dd','\uD835\uDD55':'dopf','\uD835\uDCB9':'dscr','\uD835\uDC9F':'Dscr','\uD835\uDD07':'Dfr','\u2145':'DD','\uD835\uDD3B':'Dopf','\u010F':'dcaron','\u010E':'Dcaron','\u0111':'dstrok','\u0110':'Dstrok','\xF0':'eth','\xD0':'ETH','\u2147':'ee','\u212F':'escr','\uD835\uDD22':'efr','\uD835\uDD56':'eopf','\u2130':'Escr','\uD835\uDD08':'Efr','\uD835\uDD3C':'Eopf','\xE9':'eacute','\xC9':'Eacute','\xE8':'egrave','\xC8':'Egrave','\xEA':'ecirc','\xCA':'Ecirc','\u011B':'ecaron','\u011A':'Ecaron','\xEB':'euml','\xCB':'Euml','\u0117':'edot','\u0116':'Edot','\u0119':'eogon','\u0118':'Eogon','\u0113':'emacr','\u0112':'Emacr','\uD835\uDD23':'ffr','\uD835\uDD57':'fopf','\uD835\uDCBB':'fscr','\uD835\uDD09':'Ffr','\uD835\uDD3D':'Fopf','\u2131':'Fscr','\uFB00':'fflig','\uFB03':'ffilig','\uFB04':'ffllig','\uFB01':'filig','fj':'fjlig','\uFB02':'fllig','\u0192':'fnof','\u210A':'gscr','\uD835\uDD58':'gopf','\uD835\uDD24':'gfr','\uD835\uDCA2':'Gscr','\uD835\uDD3E':'Gopf','\uD835\uDD0A':'Gfr','\u01F5':'gacute','\u011F':'gbreve','\u011E':'Gbreve','\u011D':'gcirc','\u011C':'Gcirc','\u0121':'gdot','\u0120':'Gdot','\u0122':'Gcedil','\uD835\uDD25':'hfr','\u210E':'planckh','\uD835\uDCBD':'hscr','\uD835\uDD59':'hopf','\u210B':'Hscr','\u210C':'Hfr','\u210D':'Hopf','\u0125':'hcirc','\u0124':'Hcirc','\u210F':'hbar','\u0127':'hstrok','\u0126':'Hstrok','\uD835\uDD5A':'iopf','\uD835\uDD26':'ifr','\uD835\uDCBE':'iscr','\u2148':'ii','\uD835\uDD40':'Iopf','\u2110':'Iscr','\u2111':'Im','\xED':'iacute','\xCD':'Iacute','\xEC':'igrave','\xCC':'Igrave','\xEE':'icirc','\xCE':'Icirc','\xEF':'iuml','\xCF':'Iuml','\u0129':'itilde','\u0128':'Itilde','\u0130':'Idot','\u012F':'iogon','\u012E':'Iogon','\u012B':'imacr','\u012A':'Imacr','\u0133':'ijlig','\u0132':'IJlig','\u0131':'imath','\uD835\uDCBF':'jscr','\uD835\uDD5B':'jopf','\uD835\uDD27':'jfr','\uD835\uDCA5':'Jscr','\uD835\uDD0D':'Jfr','\uD835\uDD41':'Jopf','\u0135':'jcirc','\u0134':'Jcirc','\u0237':'jmath','\uD835\uDD5C':'kopf','\uD835\uDCC0':'kscr','\uD835\uDD28':'kfr','\uD835\uDCA6':'Kscr','\uD835\uDD42':'Kopf','\uD835\uDD0E':'Kfr','\u0137':'kcedil','\u0136':'Kcedil','\uD835\uDD29':'lfr','\uD835\uDCC1':'lscr','\u2113':'ell','\uD835\uDD5D':'lopf','\u2112':'Lscr','\uD835\uDD0F':'Lfr','\uD835\uDD43':'Lopf','\u013A':'lacute','\u0139':'Lacute','\u013E':'lcaron','\u013D':'Lcaron','\u013C':'lcedil','\u013B':'Lcedil','\u0142':'lstrok','\u0141':'Lstrok','\u0140':'lmidot','\u013F':'Lmidot','\uD835\uDD2A':'mfr','\uD835\uDD5E':'mopf','\uD835\uDCC2':'mscr','\uD835\uDD10':'Mfr','\uD835\uDD44':'Mopf','\u2133':'Mscr','\uD835\uDD2B':'nfr','\uD835\uDD5F':'nopf','\uD835\uDCC3':'nscr','\u2115':'Nopf','\uD835\uDCA9':'Nscr','\uD835\uDD11':'Nfr','\u0144':'nacute','\u0143':'Nacute','\u0148':'ncaron','\u0147':'Ncaron','\xF1':'ntilde','\xD1':'Ntilde','\u0146':'ncedil','\u0145':'Ncedil','\u2116':'numero','\u014B':'eng','\u014A':'ENG','\uD835\uDD60':'oopf','\uD835\uDD2C':'ofr','\u2134':'oscr','\uD835\uDCAA':'Oscr','\uD835\uDD12':'Ofr','\uD835\uDD46':'Oopf','\xBA':'ordm','\xF3':'oacute','\xD3':'Oacute','\xF2':'ograve','\xD2':'Ograve','\xF4':'ocirc','\xD4':'Ocirc','\xF6':'ouml','\xD6':'Ouml','\u0151':'odblac','\u0150':'Odblac','\xF5':'otilde','\xD5':'Otilde','\xF8':'oslash','\xD8':'Oslash','\u014D':'omacr','\u014C':'Omacr','\u0153':'oelig','\u0152':'OElig','\uD835\uDD2D':'pfr','\uD835\uDCC5':'pscr','\uD835\uDD61':'popf','\u2119':'Popf','\uD835\uDD13':'Pfr','\uD835\uDCAB':'Pscr','\uD835\uDD62':'qopf','\uD835\uDD2E':'qfr','\uD835\uDCC6':'qscr','\uD835\uDCAC':'Qscr','\uD835\uDD14':'Qfr','\u211A':'Qopf','\u0138':'kgreen','\uD835\uDD2F':'rfr','\uD835\uDD63':'ropf','\uD835\uDCC7':'rscr','\u211B':'Rscr','\u211C':'Re','\u211D':'Ropf','\u0155':'racute','\u0154':'Racute','\u0159':'rcaron','\u0158':'Rcaron','\u0157':'rcedil','\u0156':'Rcedil','\uD835\uDD64':'sopf','\uD835\uDCC8':'sscr','\uD835\uDD30':'sfr','\uD835\uDD4A':'Sopf','\uD835\uDD16':'Sfr','\uD835\uDCAE':'Sscr','\u24C8':'oS','\u015B':'sacute','\u015A':'Sacute','\u015D':'scirc','\u015C':'Scirc','\u0161':'scaron','\u0160':'Scaron','\u015F':'scedil','\u015E':'Scedil','\xDF':'szlig','\uD835\uDD31':'tfr','\uD835\uDCC9':'tscr','\uD835\uDD65':'topf','\uD835\uDCAF':'Tscr','\uD835\uDD17':'Tfr','\uD835\uDD4B':'Topf','\u0165':'tcaron','\u0164':'Tcaron','\u0163':'tcedil','\u0162':'Tcedil','\u2122':'trade','\u0167':'tstrok','\u0166':'Tstrok','\uD835\uDCCA':'uscr','\uD835\uDD66':'uopf','\uD835\uDD32':'ufr','\uD835\uDD4C':'Uopf','\uD835\uDD18':'Ufr','\uD835\uDCB0':'Uscr','\xFA':'uacute','\xDA':'Uacute','\xF9':'ugrave','\xD9':'Ugrave','\u016D':'ubreve','\u016C':'Ubreve','\xFB':'ucirc','\xDB':'Ucirc','\u016F':'uring','\u016E':'Uring','\xFC':'uuml','\xDC':'Uuml','\u0171':'udblac','\u0170':'Udblac','\u0169':'utilde','\u0168':'Utilde','\u0173':'uogon','\u0172':'Uogon','\u016B':'umacr','\u016A':'Umacr','\uD835\uDD33':'vfr','\uD835\uDD67':'vopf','\uD835\uDCCB':'vscr','\uD835\uDD19':'Vfr','\uD835\uDD4D':'Vopf','\uD835\uDCB1':'Vscr','\uD835\uDD68':'wopf','\uD835\uDCCC':'wscr','\uD835\uDD34':'wfr','\uD835\uDCB2':'Wscr','\uD835\uDD4E':'Wopf','\uD835\uDD1A':'Wfr','\u0175':'wcirc','\u0174':'Wcirc','\uD835\uDD35':'xfr','\uD835\uDCCD':'xscr','\uD835\uDD69':'xopf','\uD835\uDD4F':'Xopf','\uD835\uDD1B':'Xfr','\uD835\uDCB3':'Xscr','\uD835\uDD36':'yfr','\uD835\uDCCE':'yscr','\uD835\uDD6A':'yopf','\uD835\uDCB4':'Yscr','\uD835\uDD1C':'Yfr','\uD835\uDD50':'Yopf','\xFD':'yacute','\xDD':'Yacute','\u0177':'ycirc','\u0176':'Ycirc','\xFF':'yuml','\u0178':'Yuml','\uD835\uDCCF':'zscr','\uD835\uDD37':'zfr','\uD835\uDD6B':'zopf','\u2128':'Zfr','\u2124':'Zopf','\uD835\uDCB5':'Zscr','\u017A':'zacute','\u0179':'Zacute','\u017E':'zcaron','\u017D':'Zcaron','\u017C':'zdot','\u017B':'Zdot','\u01B5':'imped','\xFE':'thorn','\xDE':'THORN','\u0149':'napos','\u03B1':'alpha','\u0391':'Alpha','\u03B2':'beta','\u0392':'Beta','\u03B3':'gamma','\u0393':'Gamma','\u03B4':'delta','\u0394':'Delta','\u03B5':'epsi','\u03F5':'epsiv','\u0395':'Epsilon','\u03DD':'gammad','\u03DC':'Gammad','\u03B6':'zeta','\u0396':'Zeta','\u03B7':'eta','\u0397':'Eta','\u03B8':'theta','\u03D1':'thetav','\u0398':'Theta','\u03B9':'iota','\u0399':'Iota','\u03BA':'kappa','\u03F0':'kappav','\u039A':'Kappa','\u03BB':'lambda','\u039B':'Lambda','\u03BC':'mu','\xB5':'micro','\u039C':'Mu','\u03BD':'nu','\u039D':'Nu','\u03BE':'xi','\u039E':'Xi','\u03BF':'omicron','\u039F':'Omicron','\u03C0':'pi','\u03D6':'piv','\u03A0':'Pi','\u03C1':'rho','\u03F1':'rhov','\u03A1':'Rho','\u03C3':'sigma','\u03A3':'Sigma','\u03C2':'sigmaf','\u03C4':'tau','\u03A4':'Tau','\u03C5':'upsi','\u03A5':'Upsilon','\u03D2':'Upsi','\u03C6':'phi','\u03D5':'phiv','\u03A6':'Phi','\u03C7':'chi','\u03A7':'Chi','\u03C8':'psi','\u03A8':'Psi','\u03C9':'omega','\u03A9':'ohm','\u0430':'acy','\u0410':'Acy','\u0431':'bcy','\u0411':'Bcy','\u0432':'vcy','\u0412':'Vcy','\u0433':'gcy','\u0413':'Gcy','\u0453':'gjcy','\u0403':'GJcy','\u0434':'dcy','\u0414':'Dcy','\u0452':'djcy','\u0402':'DJcy','\u0435':'iecy','\u0415':'IEcy','\u0451':'iocy','\u0401':'IOcy','\u0454':'jukcy','\u0404':'Jukcy','\u0436':'zhcy','\u0416':'ZHcy','\u0437':'zcy','\u0417':'Zcy','\u0455':'dscy','\u0405':'DScy','\u0438':'icy','\u0418':'Icy','\u0456':'iukcy','\u0406':'Iukcy','\u0457':'yicy','\u0407':'YIcy','\u0439':'jcy','\u0419':'Jcy','\u0458':'jsercy','\u0408':'Jsercy','\u043A':'kcy','\u041A':'Kcy','\u045C':'kjcy','\u040C':'KJcy','\u043B':'lcy','\u041B':'Lcy','\u0459':'ljcy','\u0409':'LJcy','\u043C':'mcy','\u041C':'Mcy','\u043D':'ncy','\u041D':'Ncy','\u045A':'njcy','\u040A':'NJcy','\u043E':'ocy','\u041E':'Ocy','\u043F':'pcy','\u041F':'Pcy','\u0440':'rcy','\u0420':'Rcy','\u0441':'scy','\u0421':'Scy','\u0442':'tcy','\u0422':'Tcy','\u045B':'tshcy','\u040B':'TSHcy','\u0443':'ucy','\u0423':'Ucy','\u045E':'ubrcy','\u040E':'Ubrcy','\u0444':'fcy','\u0424':'Fcy','\u0445':'khcy','\u0425':'KHcy','\u0446':'tscy','\u0426':'TScy','\u0447':'chcy','\u0427':'CHcy','\u045F':'dzcy','\u040F':'DZcy','\u0448':'shcy','\u0428':'SHcy','\u0449':'shchcy','\u0429':'SHCHcy','\u044A':'hardcy','\u042A':'HARDcy','\u044B':'ycy','\u042B':'Ycy','\u044C':'softcy','\u042C':'SOFTcy','\u044D':'ecy','\u042D':'Ecy','\u044E':'yucy','\u042E':'YUcy','\u044F':'yacy','\u042F':'YAcy','\u2135':'aleph','\u2136':'beth','\u2137':'gimel','\u2138':'daleth'};

		var regexEscape = /["&'<>`]/g;
		var escapeMap = {
			'"': '&quot;',
			'&': '&amp;',
			'\'': '&#x27;',
			'<': '&lt;',
			// See https://mathiasbynens.be/notes/ambiguous-ampersands: in HTML, the
			// following is not strictly necessary unless it’s part of a tag or an
			// unquoted attribute value. We’re only escaping it to support those
			// situations, and for XML support.
			'>': '&gt;',
			// In Internet Explorer ≤ 8, the backtick character can be used
			// to break out of (un)quoted attribute values or HTML comments.
			// See http://html5sec.org/#102, http://html5sec.org/#108, and
			// http://html5sec.org/#133.
			'`': '&#x60;'
		};

		var regexInvalidEntity = /&#(?:[xX][^a-fA-F0-9]|[^0-9xX])/;
		var regexInvalidRawCodePoint = /[\0-\x08\x0B\x0E-\x1F\x7F-\x9F\uFDD0-\uFDEF\uFFFE\uFFFF]|[\uD83F\uD87F\uD8BF\uD8FF\uD93F\uD97F\uD9BF\uD9FF\uDA3F\uDA7F\uDABF\uDAFF\uDB3F\uDB7F\uDBBF\uDBFF][\uDFFE\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/;
		var regexDecode = /&#([0-9]+)(;?)|&#[xX]([a-fA-F0-9]+)(;?)|&([0-9a-zA-Z]+);|&(Aacute|Agrave|Atilde|Ccedil|Eacute|Egrave|Iacute|Igrave|Ntilde|Oacute|Ograve|Oslash|Otilde|Uacute|Ugrave|Yacute|aacute|agrave|atilde|brvbar|ccedil|curren|divide|eacute|egrave|frac12|frac14|frac34|iacute|igrave|iquest|middot|ntilde|oacute|ograve|oslash|otilde|plusmn|uacute|ugrave|yacute|AElig|Acirc|Aring|Ecirc|Icirc|Ocirc|THORN|Ucirc|acirc|acute|aelig|aring|cedil|ecirc|icirc|iexcl|laquo|micro|ocirc|pound|raquo|szlig|thorn|times|ucirc|Auml|COPY|Euml|Iuml|Ouml|QUOT|Uuml|auml|cent|copy|euml|iuml|macr|nbsp|ordf|ordm|ouml|para|quot|sect|sup1|sup2|sup3|uuml|yuml|AMP|ETH|REG|amp|deg|eth|not|reg|shy|uml|yen|GT|LT|gt|lt)([=a-zA-Z0-9])?/g;
		var decodeMap = {'aacute':'\xE1','Aacute':'\xC1','abreve':'\u0103','Abreve':'\u0102','ac':'\u223E','acd':'\u223F','acE':'\u223E\u0333','acirc':'\xE2','Acirc':'\xC2','acute':'\xB4','acy':'\u0430','Acy':'\u0410','aelig':'\xE6','AElig':'\xC6','af':'\u2061','afr':'\uD835\uDD1E','Afr':'\uD835\uDD04','agrave':'\xE0','Agrave':'\xC0','alefsym':'\u2135','aleph':'\u2135','alpha':'\u03B1','Alpha':'\u0391','amacr':'\u0101','Amacr':'\u0100','amalg':'\u2A3F','amp':'&','AMP':'&','and':'\u2227','And':'\u2A53','andand':'\u2A55','andd':'\u2A5C','andslope':'\u2A58','andv':'\u2A5A','ang':'\u2220','ange':'\u29A4','angle':'\u2220','angmsd':'\u2221','angmsdaa':'\u29A8','angmsdab':'\u29A9','angmsdac':'\u29AA','angmsdad':'\u29AB','angmsdae':'\u29AC','angmsdaf':'\u29AD','angmsdag':'\u29AE','angmsdah':'\u29AF','angrt':'\u221F','angrtvb':'\u22BE','angrtvbd':'\u299D','angsph':'\u2222','angst':'\xC5','angzarr':'\u237C','aogon':'\u0105','Aogon':'\u0104','aopf':'\uD835\uDD52','Aopf':'\uD835\uDD38','ap':'\u2248','apacir':'\u2A6F','ape':'\u224A','apE':'\u2A70','apid':'\u224B','apos':'\'','ApplyFunction':'\u2061','approx':'\u2248','approxeq':'\u224A','aring':'\xE5','Aring':'\xC5','ascr':'\uD835\uDCB6','Ascr':'\uD835\uDC9C','Assign':'\u2254','ast':'*','asymp':'\u2248','asympeq':'\u224D','atilde':'\xE3','Atilde':'\xC3','auml':'\xE4','Auml':'\xC4','awconint':'\u2233','awint':'\u2A11','backcong':'\u224C','backepsilon':'\u03F6','backprime':'\u2035','backsim':'\u223D','backsimeq':'\u22CD','Backslash':'\u2216','Barv':'\u2AE7','barvee':'\u22BD','barwed':'\u2305','Barwed':'\u2306','barwedge':'\u2305','bbrk':'\u23B5','bbrktbrk':'\u23B6','bcong':'\u224C','bcy':'\u0431','Bcy':'\u0411','bdquo':'\u201E','becaus':'\u2235','because':'\u2235','Because':'\u2235','bemptyv':'\u29B0','bepsi':'\u03F6','bernou':'\u212C','Bernoullis':'\u212C','beta':'\u03B2','Beta':'\u0392','beth':'\u2136','between':'\u226C','bfr':'\uD835\uDD1F','Bfr':'\uD835\uDD05','bigcap':'\u22C2','bigcirc':'\u25EF','bigcup':'\u22C3','bigodot':'\u2A00','bigoplus':'\u2A01','bigotimes':'\u2A02','bigsqcup':'\u2A06','bigstar':'\u2605','bigtriangledown':'\u25BD','bigtriangleup':'\u25B3','biguplus':'\u2A04','bigvee':'\u22C1','bigwedge':'\u22C0','bkarow':'\u290D','blacklozenge':'\u29EB','blacksquare':'\u25AA','blacktriangle':'\u25B4','blacktriangledown':'\u25BE','blacktriangleleft':'\u25C2','blacktriangleright':'\u25B8','blank':'\u2423','blk12':'\u2592','blk14':'\u2591','blk34':'\u2593','block':'\u2588','bne':'=\u20E5','bnequiv':'\u2261\u20E5','bnot':'\u2310','bNot':'\u2AED','bopf':'\uD835\uDD53','Bopf':'\uD835\uDD39','bot':'\u22A5','bottom':'\u22A5','bowtie':'\u22C8','boxbox':'\u29C9','boxdl':'\u2510','boxdL':'\u2555','boxDl':'\u2556','boxDL':'\u2557','boxdr':'\u250C','boxdR':'\u2552','boxDr':'\u2553','boxDR':'\u2554','boxh':'\u2500','boxH':'\u2550','boxhd':'\u252C','boxhD':'\u2565','boxHd':'\u2564','boxHD':'\u2566','boxhu':'\u2534','boxhU':'\u2568','boxHu':'\u2567','boxHU':'\u2569','boxminus':'\u229F','boxplus':'\u229E','boxtimes':'\u22A0','boxul':'\u2518','boxuL':'\u255B','boxUl':'\u255C','boxUL':'\u255D','boxur':'\u2514','boxuR':'\u2558','boxUr':'\u2559','boxUR':'\u255A','boxv':'\u2502','boxV':'\u2551','boxvh':'\u253C','boxvH':'\u256A','boxVh':'\u256B','boxVH':'\u256C','boxvl':'\u2524','boxvL':'\u2561','boxVl':'\u2562','boxVL':'\u2563','boxvr':'\u251C','boxvR':'\u255E','boxVr':'\u255F','boxVR':'\u2560','bprime':'\u2035','breve':'\u02D8','Breve':'\u02D8','brvbar':'\xA6','bscr':'\uD835\uDCB7','Bscr':'\u212C','bsemi':'\u204F','bsim':'\u223D','bsime':'\u22CD','bsol':'\\','bsolb':'\u29C5','bsolhsub':'\u27C8','bull':'\u2022','bullet':'\u2022','bump':'\u224E','bumpe':'\u224F','bumpE':'\u2AAE','bumpeq':'\u224F','Bumpeq':'\u224E','cacute':'\u0107','Cacute':'\u0106','cap':'\u2229','Cap':'\u22D2','capand':'\u2A44','capbrcup':'\u2A49','capcap':'\u2A4B','capcup':'\u2A47','capdot':'\u2A40','CapitalDifferentialD':'\u2145','caps':'\u2229\uFE00','caret':'\u2041','caron':'\u02C7','Cayleys':'\u212D','ccaps':'\u2A4D','ccaron':'\u010D','Ccaron':'\u010C','ccedil':'\xE7','Ccedil':'\xC7','ccirc':'\u0109','Ccirc':'\u0108','Cconint':'\u2230','ccups':'\u2A4C','ccupssm':'\u2A50','cdot':'\u010B','Cdot':'\u010A','cedil':'\xB8','Cedilla':'\xB8','cemptyv':'\u29B2','cent':'\xA2','centerdot':'\xB7','CenterDot':'\xB7','cfr':'\uD835\uDD20','Cfr':'\u212D','chcy':'\u0447','CHcy':'\u0427','check':'\u2713','checkmark':'\u2713','chi':'\u03C7','Chi':'\u03A7','cir':'\u25CB','circ':'\u02C6','circeq':'\u2257','circlearrowleft':'\u21BA','circlearrowright':'\u21BB','circledast':'\u229B','circledcirc':'\u229A','circleddash':'\u229D','CircleDot':'\u2299','circledR':'\xAE','circledS':'\u24C8','CircleMinus':'\u2296','CirclePlus':'\u2295','CircleTimes':'\u2297','cire':'\u2257','cirE':'\u29C3','cirfnint':'\u2A10','cirmid':'\u2AEF','cirscir':'\u29C2','ClockwiseContourIntegral':'\u2232','CloseCurlyDoubleQuote':'\u201D','CloseCurlyQuote':'\u2019','clubs':'\u2663','clubsuit':'\u2663','colon':':','Colon':'\u2237','colone':'\u2254','Colone':'\u2A74','coloneq':'\u2254','comma':',','commat':'@','comp':'\u2201','compfn':'\u2218','complement':'\u2201','complexes':'\u2102','cong':'\u2245','congdot':'\u2A6D','Congruent':'\u2261','conint':'\u222E','Conint':'\u222F','ContourIntegral':'\u222E','copf':'\uD835\uDD54','Copf':'\u2102','coprod':'\u2210','Coproduct':'\u2210','copy':'\xA9','COPY':'\xA9','copysr':'\u2117','CounterClockwiseContourIntegral':'\u2233','crarr':'\u21B5','cross':'\u2717','Cross':'\u2A2F','cscr':'\uD835\uDCB8','Cscr':'\uD835\uDC9E','csub':'\u2ACF','csube':'\u2AD1','csup':'\u2AD0','csupe':'\u2AD2','ctdot':'\u22EF','cudarrl':'\u2938','cudarrr':'\u2935','cuepr':'\u22DE','cuesc':'\u22DF','cularr':'\u21B6','cularrp':'\u293D','cup':'\u222A','Cup':'\u22D3','cupbrcap':'\u2A48','cupcap':'\u2A46','CupCap':'\u224D','cupcup':'\u2A4A','cupdot':'\u228D','cupor':'\u2A45','cups':'\u222A\uFE00','curarr':'\u21B7','curarrm':'\u293C','curlyeqprec':'\u22DE','curlyeqsucc':'\u22DF','curlyvee':'\u22CE','curlywedge':'\u22CF','curren':'\xA4','curvearrowleft':'\u21B6','curvearrowright':'\u21B7','cuvee':'\u22CE','cuwed':'\u22CF','cwconint':'\u2232','cwint':'\u2231','cylcty':'\u232D','dagger':'\u2020','Dagger':'\u2021','daleth':'\u2138','darr':'\u2193','dArr':'\u21D3','Darr':'\u21A1','dash':'\u2010','dashv':'\u22A3','Dashv':'\u2AE4','dbkarow':'\u290F','dblac':'\u02DD','dcaron':'\u010F','Dcaron':'\u010E','dcy':'\u0434','Dcy':'\u0414','dd':'\u2146','DD':'\u2145','ddagger':'\u2021','ddarr':'\u21CA','DDotrahd':'\u2911','ddotseq':'\u2A77','deg':'\xB0','Del':'\u2207','delta':'\u03B4','Delta':'\u0394','demptyv':'\u29B1','dfisht':'\u297F','dfr':'\uD835\uDD21','Dfr':'\uD835\uDD07','dHar':'\u2965','dharl':'\u21C3','dharr':'\u21C2','DiacriticalAcute':'\xB4','DiacriticalDot':'\u02D9','DiacriticalDoubleAcute':'\u02DD','DiacriticalGrave':'`','DiacriticalTilde':'\u02DC','diam':'\u22C4','diamond':'\u22C4','Diamond':'\u22C4','diamondsuit':'\u2666','diams':'\u2666','die':'\xA8','DifferentialD':'\u2146','digamma':'\u03DD','disin':'\u22F2','div':'\xF7','divide':'\xF7','divideontimes':'\u22C7','divonx':'\u22C7','djcy':'\u0452','DJcy':'\u0402','dlcorn':'\u231E','dlcrop':'\u230D','dollar':'$','dopf':'\uD835\uDD55','Dopf':'\uD835\uDD3B','dot':'\u02D9','Dot':'\xA8','DotDot':'\u20DC','doteq':'\u2250','doteqdot':'\u2251','DotEqual':'\u2250','dotminus':'\u2238','dotplus':'\u2214','dotsquare':'\u22A1','doublebarwedge':'\u2306','DoubleContourIntegral':'\u222F','DoubleDot':'\xA8','DoubleDownArrow':'\u21D3','DoubleLeftArrow':'\u21D0','DoubleLeftRightArrow':'\u21D4','DoubleLeftTee':'\u2AE4','DoubleLongLeftArrow':'\u27F8','DoubleLongLeftRightArrow':'\u27FA','DoubleLongRightArrow':'\u27F9','DoubleRightArrow':'\u21D2','DoubleRightTee':'\u22A8','DoubleUpArrow':'\u21D1','DoubleUpDownArrow':'\u21D5','DoubleVerticalBar':'\u2225','downarrow':'\u2193','Downarrow':'\u21D3','DownArrow':'\u2193','DownArrowBar':'\u2913','DownArrowUpArrow':'\u21F5','DownBreve':'\u0311','downdownarrows':'\u21CA','downharpoonleft':'\u21C3','downharpoonright':'\u21C2','DownLeftRightVector':'\u2950','DownLeftTeeVector':'\u295E','DownLeftVector':'\u21BD','DownLeftVectorBar':'\u2956','DownRightTeeVector':'\u295F','DownRightVector':'\u21C1','DownRightVectorBar':'\u2957','DownTee':'\u22A4','DownTeeArrow':'\u21A7','drbkarow':'\u2910','drcorn':'\u231F','drcrop':'\u230C','dscr':'\uD835\uDCB9','Dscr':'\uD835\uDC9F','dscy':'\u0455','DScy':'\u0405','dsol':'\u29F6','dstrok':'\u0111','Dstrok':'\u0110','dtdot':'\u22F1','dtri':'\u25BF','dtrif':'\u25BE','duarr':'\u21F5','duhar':'\u296F','dwangle':'\u29A6','dzcy':'\u045F','DZcy':'\u040F','dzigrarr':'\u27FF','eacute':'\xE9','Eacute':'\xC9','easter':'\u2A6E','ecaron':'\u011B','Ecaron':'\u011A','ecir':'\u2256','ecirc':'\xEA','Ecirc':'\xCA','ecolon':'\u2255','ecy':'\u044D','Ecy':'\u042D','eDDot':'\u2A77','edot':'\u0117','eDot':'\u2251','Edot':'\u0116','ee':'\u2147','efDot':'\u2252','efr':'\uD835\uDD22','Efr':'\uD835\uDD08','eg':'\u2A9A','egrave':'\xE8','Egrave':'\xC8','egs':'\u2A96','egsdot':'\u2A98','el':'\u2A99','Element':'\u2208','elinters':'\u23E7','ell':'\u2113','els':'\u2A95','elsdot':'\u2A97','emacr':'\u0113','Emacr':'\u0112','empty':'\u2205','emptyset':'\u2205','EmptySmallSquare':'\u25FB','emptyv':'\u2205','EmptyVerySmallSquare':'\u25AB','emsp':'\u2003','emsp13':'\u2004','emsp14':'\u2005','eng':'\u014B','ENG':'\u014A','ensp':'\u2002','eogon':'\u0119','Eogon':'\u0118','eopf':'\uD835\uDD56','Eopf':'\uD835\uDD3C','epar':'\u22D5','eparsl':'\u29E3','eplus':'\u2A71','epsi':'\u03B5','epsilon':'\u03B5','Epsilon':'\u0395','epsiv':'\u03F5','eqcirc':'\u2256','eqcolon':'\u2255','eqsim':'\u2242','eqslantgtr':'\u2A96','eqslantless':'\u2A95','Equal':'\u2A75','equals':'=','EqualTilde':'\u2242','equest':'\u225F','Equilibrium':'\u21CC','equiv':'\u2261','equivDD':'\u2A78','eqvparsl':'\u29E5','erarr':'\u2971','erDot':'\u2253','escr':'\u212F','Escr':'\u2130','esdot':'\u2250','esim':'\u2242','Esim':'\u2A73','eta':'\u03B7','Eta':'\u0397','eth':'\xF0','ETH':'\xD0','euml':'\xEB','Euml':'\xCB','euro':'\u20AC','excl':'!','exist':'\u2203','Exists':'\u2203','expectation':'\u2130','exponentiale':'\u2147','ExponentialE':'\u2147','fallingdotseq':'\u2252','fcy':'\u0444','Fcy':'\u0424','female':'\u2640','ffilig':'\uFB03','fflig':'\uFB00','ffllig':'\uFB04','ffr':'\uD835\uDD23','Ffr':'\uD835\uDD09','filig':'\uFB01','FilledSmallSquare':'\u25FC','FilledVerySmallSquare':'\u25AA','fjlig':'fj','flat':'\u266D','fllig':'\uFB02','fltns':'\u25B1','fnof':'\u0192','fopf':'\uD835\uDD57','Fopf':'\uD835\uDD3D','forall':'\u2200','ForAll':'\u2200','fork':'\u22D4','forkv':'\u2AD9','Fouriertrf':'\u2131','fpartint':'\u2A0D','frac12':'\xBD','frac13':'\u2153','frac14':'\xBC','frac15':'\u2155','frac16':'\u2159','frac18':'\u215B','frac23':'\u2154','frac25':'\u2156','frac34':'\xBE','frac35':'\u2157','frac38':'\u215C','frac45':'\u2158','frac56':'\u215A','frac58':'\u215D','frac78':'\u215E','frasl':'\u2044','frown':'\u2322','fscr':'\uD835\uDCBB','Fscr':'\u2131','gacute':'\u01F5','gamma':'\u03B3','Gamma':'\u0393','gammad':'\u03DD','Gammad':'\u03DC','gap':'\u2A86','gbreve':'\u011F','Gbreve':'\u011E','Gcedil':'\u0122','gcirc':'\u011D','Gcirc':'\u011C','gcy':'\u0433','Gcy':'\u0413','gdot':'\u0121','Gdot':'\u0120','ge':'\u2265','gE':'\u2267','gel':'\u22DB','gEl':'\u2A8C','geq':'\u2265','geqq':'\u2267','geqslant':'\u2A7E','ges':'\u2A7E','gescc':'\u2AA9','gesdot':'\u2A80','gesdoto':'\u2A82','gesdotol':'\u2A84','gesl':'\u22DB\uFE00','gesles':'\u2A94','gfr':'\uD835\uDD24','Gfr':'\uD835\uDD0A','gg':'\u226B','Gg':'\u22D9','ggg':'\u22D9','gimel':'\u2137','gjcy':'\u0453','GJcy':'\u0403','gl':'\u2277','gla':'\u2AA5','glE':'\u2A92','glj':'\u2AA4','gnap':'\u2A8A','gnapprox':'\u2A8A','gne':'\u2A88','gnE':'\u2269','gneq':'\u2A88','gneqq':'\u2269','gnsim':'\u22E7','gopf':'\uD835\uDD58','Gopf':'\uD835\uDD3E','grave':'`','GreaterEqual':'\u2265','GreaterEqualLess':'\u22DB','GreaterFullEqual':'\u2267','GreaterGreater':'\u2AA2','GreaterLess':'\u2277','GreaterSlantEqual':'\u2A7E','GreaterTilde':'\u2273','gscr':'\u210A','Gscr':'\uD835\uDCA2','gsim':'\u2273','gsime':'\u2A8E','gsiml':'\u2A90','gt':'>','Gt':'\u226B','GT':'>','gtcc':'\u2AA7','gtcir':'\u2A7A','gtdot':'\u22D7','gtlPar':'\u2995','gtquest':'\u2A7C','gtrapprox':'\u2A86','gtrarr':'\u2978','gtrdot':'\u22D7','gtreqless':'\u22DB','gtreqqless':'\u2A8C','gtrless':'\u2277','gtrsim':'\u2273','gvertneqq':'\u2269\uFE00','gvnE':'\u2269\uFE00','Hacek':'\u02C7','hairsp':'\u200A','half':'\xBD','hamilt':'\u210B','hardcy':'\u044A','HARDcy':'\u042A','harr':'\u2194','hArr':'\u21D4','harrcir':'\u2948','harrw':'\u21AD','Hat':'^','hbar':'\u210F','hcirc':'\u0125','Hcirc':'\u0124','hearts':'\u2665','heartsuit':'\u2665','hellip':'\u2026','hercon':'\u22B9','hfr':'\uD835\uDD25','Hfr':'\u210C','HilbertSpace':'\u210B','hksearow':'\u2925','hkswarow':'\u2926','hoarr':'\u21FF','homtht':'\u223B','hookleftarrow':'\u21A9','hookrightarrow':'\u21AA','hopf':'\uD835\uDD59','Hopf':'\u210D','horbar':'\u2015','HorizontalLine':'\u2500','hscr':'\uD835\uDCBD','Hscr':'\u210B','hslash':'\u210F','hstrok':'\u0127','Hstrok':'\u0126','HumpDownHump':'\u224E','HumpEqual':'\u224F','hybull':'\u2043','hyphen':'\u2010','iacute':'\xED','Iacute':'\xCD','ic':'\u2063','icirc':'\xEE','Icirc':'\xCE','icy':'\u0438','Icy':'\u0418','Idot':'\u0130','iecy':'\u0435','IEcy':'\u0415','iexcl':'\xA1','iff':'\u21D4','ifr':'\uD835\uDD26','Ifr':'\u2111','igrave':'\xEC','Igrave':'\xCC','ii':'\u2148','iiiint':'\u2A0C','iiint':'\u222D','iinfin':'\u29DC','iiota':'\u2129','ijlig':'\u0133','IJlig':'\u0132','Im':'\u2111','imacr':'\u012B','Imacr':'\u012A','image':'\u2111','ImaginaryI':'\u2148','imagline':'\u2110','imagpart':'\u2111','imath':'\u0131','imof':'\u22B7','imped':'\u01B5','Implies':'\u21D2','in':'\u2208','incare':'\u2105','infin':'\u221E','infintie':'\u29DD','inodot':'\u0131','int':'\u222B','Int':'\u222C','intcal':'\u22BA','integers':'\u2124','Integral':'\u222B','intercal':'\u22BA','Intersection':'\u22C2','intlarhk':'\u2A17','intprod':'\u2A3C','InvisibleComma':'\u2063','InvisibleTimes':'\u2062','iocy':'\u0451','IOcy':'\u0401','iogon':'\u012F','Iogon':'\u012E','iopf':'\uD835\uDD5A','Iopf':'\uD835\uDD40','iota':'\u03B9','Iota':'\u0399','iprod':'\u2A3C','iquest':'\xBF','iscr':'\uD835\uDCBE','Iscr':'\u2110','isin':'\u2208','isindot':'\u22F5','isinE':'\u22F9','isins':'\u22F4','isinsv':'\u22F3','isinv':'\u2208','it':'\u2062','itilde':'\u0129','Itilde':'\u0128','iukcy':'\u0456','Iukcy':'\u0406','iuml':'\xEF','Iuml':'\xCF','jcirc':'\u0135','Jcirc':'\u0134','jcy':'\u0439','Jcy':'\u0419','jfr':'\uD835\uDD27','Jfr':'\uD835\uDD0D','jmath':'\u0237','jopf':'\uD835\uDD5B','Jopf':'\uD835\uDD41','jscr':'\uD835\uDCBF','Jscr':'\uD835\uDCA5','jsercy':'\u0458','Jsercy':'\u0408','jukcy':'\u0454','Jukcy':'\u0404','kappa':'\u03BA','Kappa':'\u039A','kappav':'\u03F0','kcedil':'\u0137','Kcedil':'\u0136','kcy':'\u043A','Kcy':'\u041A','kfr':'\uD835\uDD28','Kfr':'\uD835\uDD0E','kgreen':'\u0138','khcy':'\u0445','KHcy':'\u0425','kjcy':'\u045C','KJcy':'\u040C','kopf':'\uD835\uDD5C','Kopf':'\uD835\uDD42','kscr':'\uD835\uDCC0','Kscr':'\uD835\uDCA6','lAarr':'\u21DA','lacute':'\u013A','Lacute':'\u0139','laemptyv':'\u29B4','lagran':'\u2112','lambda':'\u03BB','Lambda':'\u039B','lang':'\u27E8','Lang':'\u27EA','langd':'\u2991','langle':'\u27E8','lap':'\u2A85','Laplacetrf':'\u2112','laquo':'\xAB','larr':'\u2190','lArr':'\u21D0','Larr':'\u219E','larrb':'\u21E4','larrbfs':'\u291F','larrfs':'\u291D','larrhk':'\u21A9','larrlp':'\u21AB','larrpl':'\u2939','larrsim':'\u2973','larrtl':'\u21A2','lat':'\u2AAB','latail':'\u2919','lAtail':'\u291B','late':'\u2AAD','lates':'\u2AAD\uFE00','lbarr':'\u290C','lBarr':'\u290E','lbbrk':'\u2772','lbrace':'{','lbrack':'[','lbrke':'\u298B','lbrksld':'\u298F','lbrkslu':'\u298D','lcaron':'\u013E','Lcaron':'\u013D','lcedil':'\u013C','Lcedil':'\u013B','lceil':'\u2308','lcub':'{','lcy':'\u043B','Lcy':'\u041B','ldca':'\u2936','ldquo':'\u201C','ldquor':'\u201E','ldrdhar':'\u2967','ldrushar':'\u294B','ldsh':'\u21B2','le':'\u2264','lE':'\u2266','LeftAngleBracket':'\u27E8','leftarrow':'\u2190','Leftarrow':'\u21D0','LeftArrow':'\u2190','LeftArrowBar':'\u21E4','LeftArrowRightArrow':'\u21C6','leftarrowtail':'\u21A2','LeftCeiling':'\u2308','LeftDoubleBracket':'\u27E6','LeftDownTeeVector':'\u2961','LeftDownVector':'\u21C3','LeftDownVectorBar':'\u2959','LeftFloor':'\u230A','leftharpoondown':'\u21BD','leftharpoonup':'\u21BC','leftleftarrows':'\u21C7','leftrightarrow':'\u2194','Leftrightarrow':'\u21D4','LeftRightArrow':'\u2194','leftrightarrows':'\u21C6','leftrightharpoons':'\u21CB','leftrightsquigarrow':'\u21AD','LeftRightVector':'\u294E','LeftTee':'\u22A3','LeftTeeArrow':'\u21A4','LeftTeeVector':'\u295A','leftthreetimes':'\u22CB','LeftTriangle':'\u22B2','LeftTriangleBar':'\u29CF','LeftTriangleEqual':'\u22B4','LeftUpDownVector':'\u2951','LeftUpTeeVector':'\u2960','LeftUpVector':'\u21BF','LeftUpVectorBar':'\u2958','LeftVector':'\u21BC','LeftVectorBar':'\u2952','leg':'\u22DA','lEg':'\u2A8B','leq':'\u2264','leqq':'\u2266','leqslant':'\u2A7D','les':'\u2A7D','lescc':'\u2AA8','lesdot':'\u2A7F','lesdoto':'\u2A81','lesdotor':'\u2A83','lesg':'\u22DA\uFE00','lesges':'\u2A93','lessapprox':'\u2A85','lessdot':'\u22D6','lesseqgtr':'\u22DA','lesseqqgtr':'\u2A8B','LessEqualGreater':'\u22DA','LessFullEqual':'\u2266','LessGreater':'\u2276','lessgtr':'\u2276','LessLess':'\u2AA1','lesssim':'\u2272','LessSlantEqual':'\u2A7D','LessTilde':'\u2272','lfisht':'\u297C','lfloor':'\u230A','lfr':'\uD835\uDD29','Lfr':'\uD835\uDD0F','lg':'\u2276','lgE':'\u2A91','lHar':'\u2962','lhard':'\u21BD','lharu':'\u21BC','lharul':'\u296A','lhblk':'\u2584','ljcy':'\u0459','LJcy':'\u0409','ll':'\u226A','Ll':'\u22D8','llarr':'\u21C7','llcorner':'\u231E','Lleftarrow':'\u21DA','llhard':'\u296B','lltri':'\u25FA','lmidot':'\u0140','Lmidot':'\u013F','lmoust':'\u23B0','lmoustache':'\u23B0','lnap':'\u2A89','lnapprox':'\u2A89','lne':'\u2A87','lnE':'\u2268','lneq':'\u2A87','lneqq':'\u2268','lnsim':'\u22E6','loang':'\u27EC','loarr':'\u21FD','lobrk':'\u27E6','longleftarrow':'\u27F5','Longleftarrow':'\u27F8','LongLeftArrow':'\u27F5','longleftrightarrow':'\u27F7','Longleftrightarrow':'\u27FA','LongLeftRightArrow':'\u27F7','longmapsto':'\u27FC','longrightarrow':'\u27F6','Longrightarrow':'\u27F9','LongRightArrow':'\u27F6','looparrowleft':'\u21AB','looparrowright':'\u21AC','lopar':'\u2985','lopf':'\uD835\uDD5D','Lopf':'\uD835\uDD43','loplus':'\u2A2D','lotimes':'\u2A34','lowast':'\u2217','lowbar':'_','LowerLeftArrow':'\u2199','LowerRightArrow':'\u2198','loz':'\u25CA','lozenge':'\u25CA','lozf':'\u29EB','lpar':'(','lparlt':'\u2993','lrarr':'\u21C6','lrcorner':'\u231F','lrhar':'\u21CB','lrhard':'\u296D','lrm':'\u200E','lrtri':'\u22BF','lsaquo':'\u2039','lscr':'\uD835\uDCC1','Lscr':'\u2112','lsh':'\u21B0','Lsh':'\u21B0','lsim':'\u2272','lsime':'\u2A8D','lsimg':'\u2A8F','lsqb':'[','lsquo':'\u2018','lsquor':'\u201A','lstrok':'\u0142','Lstrok':'\u0141','lt':'<','Lt':'\u226A','LT':'<','ltcc':'\u2AA6','ltcir':'\u2A79','ltdot':'\u22D6','lthree':'\u22CB','ltimes':'\u22C9','ltlarr':'\u2976','ltquest':'\u2A7B','ltri':'\u25C3','ltrie':'\u22B4','ltrif':'\u25C2','ltrPar':'\u2996','lurdshar':'\u294A','luruhar':'\u2966','lvertneqq':'\u2268\uFE00','lvnE':'\u2268\uFE00','macr':'\xAF','male':'\u2642','malt':'\u2720','maltese':'\u2720','map':'\u21A6','Map':'\u2905','mapsto':'\u21A6','mapstodown':'\u21A7','mapstoleft':'\u21A4','mapstoup':'\u21A5','marker':'\u25AE','mcomma':'\u2A29','mcy':'\u043C','Mcy':'\u041C','mdash':'\u2014','mDDot':'\u223A','measuredangle':'\u2221','MediumSpace':'\u205F','Mellintrf':'\u2133','mfr':'\uD835\uDD2A','Mfr':'\uD835\uDD10','mho':'\u2127','micro':'\xB5','mid':'\u2223','midast':'*','midcir':'\u2AF0','middot':'\xB7','minus':'\u2212','minusb':'\u229F','minusd':'\u2238','minusdu':'\u2A2A','MinusPlus':'\u2213','mlcp':'\u2ADB','mldr':'\u2026','mnplus':'\u2213','models':'\u22A7','mopf':'\uD835\uDD5E','Mopf':'\uD835\uDD44','mp':'\u2213','mscr':'\uD835\uDCC2','Mscr':'\u2133','mstpos':'\u223E','mu':'\u03BC','Mu':'\u039C','multimap':'\u22B8','mumap':'\u22B8','nabla':'\u2207','nacute':'\u0144','Nacute':'\u0143','nang':'\u2220\u20D2','nap':'\u2249','napE':'\u2A70\u0338','napid':'\u224B\u0338','napos':'\u0149','napprox':'\u2249','natur':'\u266E','natural':'\u266E','naturals':'\u2115','nbsp':'\xA0','nbump':'\u224E\u0338','nbumpe':'\u224F\u0338','ncap':'\u2A43','ncaron':'\u0148','Ncaron':'\u0147','ncedil':'\u0146','Ncedil':'\u0145','ncong':'\u2247','ncongdot':'\u2A6D\u0338','ncup':'\u2A42','ncy':'\u043D','Ncy':'\u041D','ndash':'\u2013','ne':'\u2260','nearhk':'\u2924','nearr':'\u2197','neArr':'\u21D7','nearrow':'\u2197','nedot':'\u2250\u0338','NegativeMediumSpace':'\u200B','NegativeThickSpace':'\u200B','NegativeThinSpace':'\u200B','NegativeVeryThinSpace':'\u200B','nequiv':'\u2262','nesear':'\u2928','nesim':'\u2242\u0338','NestedGreaterGreater':'\u226B','NestedLessLess':'\u226A','NewLine':'\n','nexist':'\u2204','nexists':'\u2204','nfr':'\uD835\uDD2B','Nfr':'\uD835\uDD11','nge':'\u2271','ngE':'\u2267\u0338','ngeq':'\u2271','ngeqq':'\u2267\u0338','ngeqslant':'\u2A7E\u0338','nges':'\u2A7E\u0338','nGg':'\u22D9\u0338','ngsim':'\u2275','ngt':'\u226F','nGt':'\u226B\u20D2','ngtr':'\u226F','nGtv':'\u226B\u0338','nharr':'\u21AE','nhArr':'\u21CE','nhpar':'\u2AF2','ni':'\u220B','nis':'\u22FC','nisd':'\u22FA','niv':'\u220B','njcy':'\u045A','NJcy':'\u040A','nlarr':'\u219A','nlArr':'\u21CD','nldr':'\u2025','nle':'\u2270','nlE':'\u2266\u0338','nleftarrow':'\u219A','nLeftarrow':'\u21CD','nleftrightarrow':'\u21AE','nLeftrightarrow':'\u21CE','nleq':'\u2270','nleqq':'\u2266\u0338','nleqslant':'\u2A7D\u0338','nles':'\u2A7D\u0338','nless':'\u226E','nLl':'\u22D8\u0338','nlsim':'\u2274','nlt':'\u226E','nLt':'\u226A\u20D2','nltri':'\u22EA','nltrie':'\u22EC','nLtv':'\u226A\u0338','nmid':'\u2224','NoBreak':'\u2060','NonBreakingSpace':'\xA0','nopf':'\uD835\uDD5F','Nopf':'\u2115','not':'\xAC','Not':'\u2AEC','NotCongruent':'\u2262','NotCupCap':'\u226D','NotDoubleVerticalBar':'\u2226','NotElement':'\u2209','NotEqual':'\u2260','NotEqualTilde':'\u2242\u0338','NotExists':'\u2204','NotGreater':'\u226F','NotGreaterEqual':'\u2271','NotGreaterFullEqual':'\u2267\u0338','NotGreaterGreater':'\u226B\u0338','NotGreaterLess':'\u2279','NotGreaterSlantEqual':'\u2A7E\u0338','NotGreaterTilde':'\u2275','NotHumpDownHump':'\u224E\u0338','NotHumpEqual':'\u224F\u0338','notin':'\u2209','notindot':'\u22F5\u0338','notinE':'\u22F9\u0338','notinva':'\u2209','notinvb':'\u22F7','notinvc':'\u22F6','NotLeftTriangle':'\u22EA','NotLeftTriangleBar':'\u29CF\u0338','NotLeftTriangleEqual':'\u22EC','NotLess':'\u226E','NotLessEqual':'\u2270','NotLessGreater':'\u2278','NotLessLess':'\u226A\u0338','NotLessSlantEqual':'\u2A7D\u0338','NotLessTilde':'\u2274','NotNestedGreaterGreater':'\u2AA2\u0338','NotNestedLessLess':'\u2AA1\u0338','notni':'\u220C','notniva':'\u220C','notnivb':'\u22FE','notnivc':'\u22FD','NotPrecedes':'\u2280','NotPrecedesEqual':'\u2AAF\u0338','NotPrecedesSlantEqual':'\u22E0','NotReverseElement':'\u220C','NotRightTriangle':'\u22EB','NotRightTriangleBar':'\u29D0\u0338','NotRightTriangleEqual':'\u22ED','NotSquareSubset':'\u228F\u0338','NotSquareSubsetEqual':'\u22E2','NotSquareSuperset':'\u2290\u0338','NotSquareSupersetEqual':'\u22E3','NotSubset':'\u2282\u20D2','NotSubsetEqual':'\u2288','NotSucceeds':'\u2281','NotSucceedsEqual':'\u2AB0\u0338','NotSucceedsSlantEqual':'\u22E1','NotSucceedsTilde':'\u227F\u0338','NotSuperset':'\u2283\u20D2','NotSupersetEqual':'\u2289','NotTilde':'\u2241','NotTildeEqual':'\u2244','NotTildeFullEqual':'\u2247','NotTildeTilde':'\u2249','NotVerticalBar':'\u2224','npar':'\u2226','nparallel':'\u2226','nparsl':'\u2AFD\u20E5','npart':'\u2202\u0338','npolint':'\u2A14','npr':'\u2280','nprcue':'\u22E0','npre':'\u2AAF\u0338','nprec':'\u2280','npreceq':'\u2AAF\u0338','nrarr':'\u219B','nrArr':'\u21CF','nrarrc':'\u2933\u0338','nrarrw':'\u219D\u0338','nrightarrow':'\u219B','nRightarrow':'\u21CF','nrtri':'\u22EB','nrtrie':'\u22ED','nsc':'\u2281','nsccue':'\u22E1','nsce':'\u2AB0\u0338','nscr':'\uD835\uDCC3','Nscr':'\uD835\uDCA9','nshortmid':'\u2224','nshortparallel':'\u2226','nsim':'\u2241','nsime':'\u2244','nsimeq':'\u2244','nsmid':'\u2224','nspar':'\u2226','nsqsube':'\u22E2','nsqsupe':'\u22E3','nsub':'\u2284','nsube':'\u2288','nsubE':'\u2AC5\u0338','nsubset':'\u2282\u20D2','nsubseteq':'\u2288','nsubseteqq':'\u2AC5\u0338','nsucc':'\u2281','nsucceq':'\u2AB0\u0338','nsup':'\u2285','nsupe':'\u2289','nsupE':'\u2AC6\u0338','nsupset':'\u2283\u20D2','nsupseteq':'\u2289','nsupseteqq':'\u2AC6\u0338','ntgl':'\u2279','ntilde':'\xF1','Ntilde':'\xD1','ntlg':'\u2278','ntriangleleft':'\u22EA','ntrianglelefteq':'\u22EC','ntriangleright':'\u22EB','ntrianglerighteq':'\u22ED','nu':'\u03BD','Nu':'\u039D','num':'#','numero':'\u2116','numsp':'\u2007','nvap':'\u224D\u20D2','nvdash':'\u22AC','nvDash':'\u22AD','nVdash':'\u22AE','nVDash':'\u22AF','nvge':'\u2265\u20D2','nvgt':'>\u20D2','nvHarr':'\u2904','nvinfin':'\u29DE','nvlArr':'\u2902','nvle':'\u2264\u20D2','nvlt':'<\u20D2','nvltrie':'\u22B4\u20D2','nvrArr':'\u2903','nvrtrie':'\u22B5\u20D2','nvsim':'\u223C\u20D2','nwarhk':'\u2923','nwarr':'\u2196','nwArr':'\u21D6','nwarrow':'\u2196','nwnear':'\u2927','oacute':'\xF3','Oacute':'\xD3','oast':'\u229B','ocir':'\u229A','ocirc':'\xF4','Ocirc':'\xD4','ocy':'\u043E','Ocy':'\u041E','odash':'\u229D','odblac':'\u0151','Odblac':'\u0150','odiv':'\u2A38','odot':'\u2299','odsold':'\u29BC','oelig':'\u0153','OElig':'\u0152','ofcir':'\u29BF','ofr':'\uD835\uDD2C','Ofr':'\uD835\uDD12','ogon':'\u02DB','ograve':'\xF2','Ograve':'\xD2','ogt':'\u29C1','ohbar':'\u29B5','ohm':'\u03A9','oint':'\u222E','olarr':'\u21BA','olcir':'\u29BE','olcross':'\u29BB','oline':'\u203E','olt':'\u29C0','omacr':'\u014D','Omacr':'\u014C','omega':'\u03C9','Omega':'\u03A9','omicron':'\u03BF','Omicron':'\u039F','omid':'\u29B6','ominus':'\u2296','oopf':'\uD835\uDD60','Oopf':'\uD835\uDD46','opar':'\u29B7','OpenCurlyDoubleQuote':'\u201C','OpenCurlyQuote':'\u2018','operp':'\u29B9','oplus':'\u2295','or':'\u2228','Or':'\u2A54','orarr':'\u21BB','ord':'\u2A5D','order':'\u2134','orderof':'\u2134','ordf':'\xAA','ordm':'\xBA','origof':'\u22B6','oror':'\u2A56','orslope':'\u2A57','orv':'\u2A5B','oS':'\u24C8','oscr':'\u2134','Oscr':'\uD835\uDCAA','oslash':'\xF8','Oslash':'\xD8','osol':'\u2298','otilde':'\xF5','Otilde':'\xD5','otimes':'\u2297','Otimes':'\u2A37','otimesas':'\u2A36','ouml':'\xF6','Ouml':'\xD6','ovbar':'\u233D','OverBar':'\u203E','OverBrace':'\u23DE','OverBracket':'\u23B4','OverParenthesis':'\u23DC','par':'\u2225','para':'\xB6','parallel':'\u2225','parsim':'\u2AF3','parsl':'\u2AFD','part':'\u2202','PartialD':'\u2202','pcy':'\u043F','Pcy':'\u041F','percnt':'%','period':'.','permil':'\u2030','perp':'\u22A5','pertenk':'\u2031','pfr':'\uD835\uDD2D','Pfr':'\uD835\uDD13','phi':'\u03C6','Phi':'\u03A6','phiv':'\u03D5','phmmat':'\u2133','phone':'\u260E','pi':'\u03C0','Pi':'\u03A0','pitchfork':'\u22D4','piv':'\u03D6','planck':'\u210F','planckh':'\u210E','plankv':'\u210F','plus':'+','plusacir':'\u2A23','plusb':'\u229E','pluscir':'\u2A22','plusdo':'\u2214','plusdu':'\u2A25','pluse':'\u2A72','PlusMinus':'\xB1','plusmn':'\xB1','plussim':'\u2A26','plustwo':'\u2A27','pm':'\xB1','Poincareplane':'\u210C','pointint':'\u2A15','popf':'\uD835\uDD61','Popf':'\u2119','pound':'\xA3','pr':'\u227A','Pr':'\u2ABB','prap':'\u2AB7','prcue':'\u227C','pre':'\u2AAF','prE':'\u2AB3','prec':'\u227A','precapprox':'\u2AB7','preccurlyeq':'\u227C','Precedes':'\u227A','PrecedesEqual':'\u2AAF','PrecedesSlantEqual':'\u227C','PrecedesTilde':'\u227E','preceq':'\u2AAF','precnapprox':'\u2AB9','precneqq':'\u2AB5','precnsim':'\u22E8','precsim':'\u227E','prime':'\u2032','Prime':'\u2033','primes':'\u2119','prnap':'\u2AB9','prnE':'\u2AB5','prnsim':'\u22E8','prod':'\u220F','Product':'\u220F','profalar':'\u232E','profline':'\u2312','profsurf':'\u2313','prop':'\u221D','Proportion':'\u2237','Proportional':'\u221D','propto':'\u221D','prsim':'\u227E','prurel':'\u22B0','pscr':'\uD835\uDCC5','Pscr':'\uD835\uDCAB','psi':'\u03C8','Psi':'\u03A8','puncsp':'\u2008','qfr':'\uD835\uDD2E','Qfr':'\uD835\uDD14','qint':'\u2A0C','qopf':'\uD835\uDD62','Qopf':'\u211A','qprime':'\u2057','qscr':'\uD835\uDCC6','Qscr':'\uD835\uDCAC','quaternions':'\u210D','quatint':'\u2A16','quest':'?','questeq':'\u225F','quot':'"','QUOT':'"','rAarr':'\u21DB','race':'\u223D\u0331','racute':'\u0155','Racute':'\u0154','radic':'\u221A','raemptyv':'\u29B3','rang':'\u27E9','Rang':'\u27EB','rangd':'\u2992','range':'\u29A5','rangle':'\u27E9','raquo':'\xBB','rarr':'\u2192','rArr':'\u21D2','Rarr':'\u21A0','rarrap':'\u2975','rarrb':'\u21E5','rarrbfs':'\u2920','rarrc':'\u2933','rarrfs':'\u291E','rarrhk':'\u21AA','rarrlp':'\u21AC','rarrpl':'\u2945','rarrsim':'\u2974','rarrtl':'\u21A3','Rarrtl':'\u2916','rarrw':'\u219D','ratail':'\u291A','rAtail':'\u291C','ratio':'\u2236','rationals':'\u211A','rbarr':'\u290D','rBarr':'\u290F','RBarr':'\u2910','rbbrk':'\u2773','rbrace':'}','rbrack':']','rbrke':'\u298C','rbrksld':'\u298E','rbrkslu':'\u2990','rcaron':'\u0159','Rcaron':'\u0158','rcedil':'\u0157','Rcedil':'\u0156','rceil':'\u2309','rcub':'}','rcy':'\u0440','Rcy':'\u0420','rdca':'\u2937','rdldhar':'\u2969','rdquo':'\u201D','rdquor':'\u201D','rdsh':'\u21B3','Re':'\u211C','real':'\u211C','realine':'\u211B','realpart':'\u211C','reals':'\u211D','rect':'\u25AD','reg':'\xAE','REG':'\xAE','ReverseElement':'\u220B','ReverseEquilibrium':'\u21CB','ReverseUpEquilibrium':'\u296F','rfisht':'\u297D','rfloor':'\u230B','rfr':'\uD835\uDD2F','Rfr':'\u211C','rHar':'\u2964','rhard':'\u21C1','rharu':'\u21C0','rharul':'\u296C','rho':'\u03C1','Rho':'\u03A1','rhov':'\u03F1','RightAngleBracket':'\u27E9','rightarrow':'\u2192','Rightarrow':'\u21D2','RightArrow':'\u2192','RightArrowBar':'\u21E5','RightArrowLeftArrow':'\u21C4','rightarrowtail':'\u21A3','RightCeiling':'\u2309','RightDoubleBracket':'\u27E7','RightDownTeeVector':'\u295D','RightDownVector':'\u21C2','RightDownVectorBar':'\u2955','RightFloor':'\u230B','rightharpoondown':'\u21C1','rightharpoonup':'\u21C0','rightleftarrows':'\u21C4','rightleftharpoons':'\u21CC','rightrightarrows':'\u21C9','rightsquigarrow':'\u219D','RightTee':'\u22A2','RightTeeArrow':'\u21A6','RightTeeVector':'\u295B','rightthreetimes':'\u22CC','RightTriangle':'\u22B3','RightTriangleBar':'\u29D0','RightTriangleEqual':'\u22B5','RightUpDownVector':'\u294F','RightUpTeeVector':'\u295C','RightUpVector':'\u21BE','RightUpVectorBar':'\u2954','RightVector':'\u21C0','RightVectorBar':'\u2953','ring':'\u02DA','risingdotseq':'\u2253','rlarr':'\u21C4','rlhar':'\u21CC','rlm':'\u200F','rmoust':'\u23B1','rmoustache':'\u23B1','rnmid':'\u2AEE','roang':'\u27ED','roarr':'\u21FE','robrk':'\u27E7','ropar':'\u2986','ropf':'\uD835\uDD63','Ropf':'\u211D','roplus':'\u2A2E','rotimes':'\u2A35','RoundImplies':'\u2970','rpar':')','rpargt':'\u2994','rppolint':'\u2A12','rrarr':'\u21C9','Rrightarrow':'\u21DB','rsaquo':'\u203A','rscr':'\uD835\uDCC7','Rscr':'\u211B','rsh':'\u21B1','Rsh':'\u21B1','rsqb':']','rsquo':'\u2019','rsquor':'\u2019','rthree':'\u22CC','rtimes':'\u22CA','rtri':'\u25B9','rtrie':'\u22B5','rtrif':'\u25B8','rtriltri':'\u29CE','RuleDelayed':'\u29F4','ruluhar':'\u2968','rx':'\u211E','sacute':'\u015B','Sacute':'\u015A','sbquo':'\u201A','sc':'\u227B','Sc':'\u2ABC','scap':'\u2AB8','scaron':'\u0161','Scaron':'\u0160','sccue':'\u227D','sce':'\u2AB0','scE':'\u2AB4','scedil':'\u015F','Scedil':'\u015E','scirc':'\u015D','Scirc':'\u015C','scnap':'\u2ABA','scnE':'\u2AB6','scnsim':'\u22E9','scpolint':'\u2A13','scsim':'\u227F','scy':'\u0441','Scy':'\u0421','sdot':'\u22C5','sdotb':'\u22A1','sdote':'\u2A66','searhk':'\u2925','searr':'\u2198','seArr':'\u21D8','searrow':'\u2198','sect':'\xA7','semi':';','seswar':'\u2929','setminus':'\u2216','setmn':'\u2216','sext':'\u2736','sfr':'\uD835\uDD30','Sfr':'\uD835\uDD16','sfrown':'\u2322','sharp':'\u266F','shchcy':'\u0449','SHCHcy':'\u0429','shcy':'\u0448','SHcy':'\u0428','ShortDownArrow':'\u2193','ShortLeftArrow':'\u2190','shortmid':'\u2223','shortparallel':'\u2225','ShortRightArrow':'\u2192','ShortUpArrow':'\u2191','shy':'\xAD','sigma':'\u03C3','Sigma':'\u03A3','sigmaf':'\u03C2','sigmav':'\u03C2','sim':'\u223C','simdot':'\u2A6A','sime':'\u2243','simeq':'\u2243','simg':'\u2A9E','simgE':'\u2AA0','siml':'\u2A9D','simlE':'\u2A9F','simne':'\u2246','simplus':'\u2A24','simrarr':'\u2972','slarr':'\u2190','SmallCircle':'\u2218','smallsetminus':'\u2216','smashp':'\u2A33','smeparsl':'\u29E4','smid':'\u2223','smile':'\u2323','smt':'\u2AAA','smte':'\u2AAC','smtes':'\u2AAC\uFE00','softcy':'\u044C','SOFTcy':'\u042C','sol':'/','solb':'\u29C4','solbar':'\u233F','sopf':'\uD835\uDD64','Sopf':'\uD835\uDD4A','spades':'\u2660','spadesuit':'\u2660','spar':'\u2225','sqcap':'\u2293','sqcaps':'\u2293\uFE00','sqcup':'\u2294','sqcups':'\u2294\uFE00','Sqrt':'\u221A','sqsub':'\u228F','sqsube':'\u2291','sqsubset':'\u228F','sqsubseteq':'\u2291','sqsup':'\u2290','sqsupe':'\u2292','sqsupset':'\u2290','sqsupseteq':'\u2292','squ':'\u25A1','square':'\u25A1','Square':'\u25A1','SquareIntersection':'\u2293','SquareSubset':'\u228F','SquareSubsetEqual':'\u2291','SquareSuperset':'\u2290','SquareSupersetEqual':'\u2292','SquareUnion':'\u2294','squarf':'\u25AA','squf':'\u25AA','srarr':'\u2192','sscr':'\uD835\uDCC8','Sscr':'\uD835\uDCAE','ssetmn':'\u2216','ssmile':'\u2323','sstarf':'\u22C6','star':'\u2606','Star':'\u22C6','starf':'\u2605','straightepsilon':'\u03F5','straightphi':'\u03D5','strns':'\xAF','sub':'\u2282','Sub':'\u22D0','subdot':'\u2ABD','sube':'\u2286','subE':'\u2AC5','subedot':'\u2AC3','submult':'\u2AC1','subne':'\u228A','subnE':'\u2ACB','subplus':'\u2ABF','subrarr':'\u2979','subset':'\u2282','Subset':'\u22D0','subseteq':'\u2286','subseteqq':'\u2AC5','SubsetEqual':'\u2286','subsetneq':'\u228A','subsetneqq':'\u2ACB','subsim':'\u2AC7','subsub':'\u2AD5','subsup':'\u2AD3','succ':'\u227B','succapprox':'\u2AB8','succcurlyeq':'\u227D','Succeeds':'\u227B','SucceedsEqual':'\u2AB0','SucceedsSlantEqual':'\u227D','SucceedsTilde':'\u227F','succeq':'\u2AB0','succnapprox':'\u2ABA','succneqq':'\u2AB6','succnsim':'\u22E9','succsim':'\u227F','SuchThat':'\u220B','sum':'\u2211','Sum':'\u2211','sung':'\u266A','sup':'\u2283','Sup':'\u22D1','sup1':'\xB9','sup2':'\xB2','sup3':'\xB3','supdot':'\u2ABE','supdsub':'\u2AD8','supe':'\u2287','supE':'\u2AC6','supedot':'\u2AC4','Superset':'\u2283','SupersetEqual':'\u2287','suphsol':'\u27C9','suphsub':'\u2AD7','suplarr':'\u297B','supmult':'\u2AC2','supne':'\u228B','supnE':'\u2ACC','supplus':'\u2AC0','supset':'\u2283','Supset':'\u22D1','supseteq':'\u2287','supseteqq':'\u2AC6','supsetneq':'\u228B','supsetneqq':'\u2ACC','supsim':'\u2AC8','supsub':'\u2AD4','supsup':'\u2AD6','swarhk':'\u2926','swarr':'\u2199','swArr':'\u21D9','swarrow':'\u2199','swnwar':'\u292A','szlig':'\xDF','Tab':'\t','target':'\u2316','tau':'\u03C4','Tau':'\u03A4','tbrk':'\u23B4','tcaron':'\u0165','Tcaron':'\u0164','tcedil':'\u0163','Tcedil':'\u0162','tcy':'\u0442','Tcy':'\u0422','tdot':'\u20DB','telrec':'\u2315','tfr':'\uD835\uDD31','Tfr':'\uD835\uDD17','there4':'\u2234','therefore':'\u2234','Therefore':'\u2234','theta':'\u03B8','Theta':'\u0398','thetasym':'\u03D1','thetav':'\u03D1','thickapprox':'\u2248','thicksim':'\u223C','ThickSpace':'\u205F\u200A','thinsp':'\u2009','ThinSpace':'\u2009','thkap':'\u2248','thksim':'\u223C','thorn':'\xFE','THORN':'\xDE','tilde':'\u02DC','Tilde':'\u223C','TildeEqual':'\u2243','TildeFullEqual':'\u2245','TildeTilde':'\u2248','times':'\xD7','timesb':'\u22A0','timesbar':'\u2A31','timesd':'\u2A30','tint':'\u222D','toea':'\u2928','top':'\u22A4','topbot':'\u2336','topcir':'\u2AF1','topf':'\uD835\uDD65','Topf':'\uD835\uDD4B','topfork':'\u2ADA','tosa':'\u2929','tprime':'\u2034','trade':'\u2122','TRADE':'\u2122','triangle':'\u25B5','triangledown':'\u25BF','triangleleft':'\u25C3','trianglelefteq':'\u22B4','triangleq':'\u225C','triangleright':'\u25B9','trianglerighteq':'\u22B5','tridot':'\u25EC','trie':'\u225C','triminus':'\u2A3A','TripleDot':'\u20DB','triplus':'\u2A39','trisb':'\u29CD','tritime':'\u2A3B','trpezium':'\u23E2','tscr':'\uD835\uDCC9','Tscr':'\uD835\uDCAF','tscy':'\u0446','TScy':'\u0426','tshcy':'\u045B','TSHcy':'\u040B','tstrok':'\u0167','Tstrok':'\u0166','twixt':'\u226C','twoheadleftarrow':'\u219E','twoheadrightarrow':'\u21A0','uacute':'\xFA','Uacute':'\xDA','uarr':'\u2191','uArr':'\u21D1','Uarr':'\u219F','Uarrocir':'\u2949','ubrcy':'\u045E','Ubrcy':'\u040E','ubreve':'\u016D','Ubreve':'\u016C','ucirc':'\xFB','Ucirc':'\xDB','ucy':'\u0443','Ucy':'\u0423','udarr':'\u21C5','udblac':'\u0171','Udblac':'\u0170','udhar':'\u296E','ufisht':'\u297E','ufr':'\uD835\uDD32','Ufr':'\uD835\uDD18','ugrave':'\xF9','Ugrave':'\xD9','uHar':'\u2963','uharl':'\u21BF','uharr':'\u21BE','uhblk':'\u2580','ulcorn':'\u231C','ulcorner':'\u231C','ulcrop':'\u230F','ultri':'\u25F8','umacr':'\u016B','Umacr':'\u016A','uml':'\xA8','UnderBar':'_','UnderBrace':'\u23DF','UnderBracket':'\u23B5','UnderParenthesis':'\u23DD','Union':'\u22C3','UnionPlus':'\u228E','uogon':'\u0173','Uogon':'\u0172','uopf':'\uD835\uDD66','Uopf':'\uD835\uDD4C','uparrow':'\u2191','Uparrow':'\u21D1','UpArrow':'\u2191','UpArrowBar':'\u2912','UpArrowDownArrow':'\u21C5','updownarrow':'\u2195','Updownarrow':'\u21D5','UpDownArrow':'\u2195','UpEquilibrium':'\u296E','upharpoonleft':'\u21BF','upharpoonright':'\u21BE','uplus':'\u228E','UpperLeftArrow':'\u2196','UpperRightArrow':'\u2197','upsi':'\u03C5','Upsi':'\u03D2','upsih':'\u03D2','upsilon':'\u03C5','Upsilon':'\u03A5','UpTee':'\u22A5','UpTeeArrow':'\u21A5','upuparrows':'\u21C8','urcorn':'\u231D','urcorner':'\u231D','urcrop':'\u230E','uring':'\u016F','Uring':'\u016E','urtri':'\u25F9','uscr':'\uD835\uDCCA','Uscr':'\uD835\uDCB0','utdot':'\u22F0','utilde':'\u0169','Utilde':'\u0168','utri':'\u25B5','utrif':'\u25B4','uuarr':'\u21C8','uuml':'\xFC','Uuml':'\xDC','uwangle':'\u29A7','vangrt':'\u299C','varepsilon':'\u03F5','varkappa':'\u03F0','varnothing':'\u2205','varphi':'\u03D5','varpi':'\u03D6','varpropto':'\u221D','varr':'\u2195','vArr':'\u21D5','varrho':'\u03F1','varsigma':'\u03C2','varsubsetneq':'\u228A\uFE00','varsubsetneqq':'\u2ACB\uFE00','varsupsetneq':'\u228B\uFE00','varsupsetneqq':'\u2ACC\uFE00','vartheta':'\u03D1','vartriangleleft':'\u22B2','vartriangleright':'\u22B3','vBar':'\u2AE8','Vbar':'\u2AEB','vBarv':'\u2AE9','vcy':'\u0432','Vcy':'\u0412','vdash':'\u22A2','vDash':'\u22A8','Vdash':'\u22A9','VDash':'\u22AB','Vdashl':'\u2AE6','vee':'\u2228','Vee':'\u22C1','veebar':'\u22BB','veeeq':'\u225A','vellip':'\u22EE','verbar':'|','Verbar':'\u2016','vert':'|','Vert':'\u2016','VerticalBar':'\u2223','VerticalLine':'|','VerticalSeparator':'\u2758','VerticalTilde':'\u2240','VeryThinSpace':'\u200A','vfr':'\uD835\uDD33','Vfr':'\uD835\uDD19','vltri':'\u22B2','vnsub':'\u2282\u20D2','vnsup':'\u2283\u20D2','vopf':'\uD835\uDD67','Vopf':'\uD835\uDD4D','vprop':'\u221D','vrtri':'\u22B3','vscr':'\uD835\uDCCB','Vscr':'\uD835\uDCB1','vsubne':'\u228A\uFE00','vsubnE':'\u2ACB\uFE00','vsupne':'\u228B\uFE00','vsupnE':'\u2ACC\uFE00','Vvdash':'\u22AA','vzigzag':'\u299A','wcirc':'\u0175','Wcirc':'\u0174','wedbar':'\u2A5F','wedge':'\u2227','Wedge':'\u22C0','wedgeq':'\u2259','weierp':'\u2118','wfr':'\uD835\uDD34','Wfr':'\uD835\uDD1A','wopf':'\uD835\uDD68','Wopf':'\uD835\uDD4E','wp':'\u2118','wr':'\u2240','wreath':'\u2240','wscr':'\uD835\uDCCC','Wscr':'\uD835\uDCB2','xcap':'\u22C2','xcirc':'\u25EF','xcup':'\u22C3','xdtri':'\u25BD','xfr':'\uD835\uDD35','Xfr':'\uD835\uDD1B','xharr':'\u27F7','xhArr':'\u27FA','xi':'\u03BE','Xi':'\u039E','xlarr':'\u27F5','xlArr':'\u27F8','xmap':'\u27FC','xnis':'\u22FB','xodot':'\u2A00','xopf':'\uD835\uDD69','Xopf':'\uD835\uDD4F','xoplus':'\u2A01','xotime':'\u2A02','xrarr':'\u27F6','xrArr':'\u27F9','xscr':'\uD835\uDCCD','Xscr':'\uD835\uDCB3','xsqcup':'\u2A06','xuplus':'\u2A04','xutri':'\u25B3','xvee':'\u22C1','xwedge':'\u22C0','yacute':'\xFD','Yacute':'\xDD','yacy':'\u044F','YAcy':'\u042F','ycirc':'\u0177','Ycirc':'\u0176','ycy':'\u044B','Ycy':'\u042B','yen':'\xA5','yfr':'\uD835\uDD36','Yfr':'\uD835\uDD1C','yicy':'\u0457','YIcy':'\u0407','yopf':'\uD835\uDD6A','Yopf':'\uD835\uDD50','yscr':'\uD835\uDCCE','Yscr':'\uD835\uDCB4','yucy':'\u044E','YUcy':'\u042E','yuml':'\xFF','Yuml':'\u0178','zacute':'\u017A','Zacute':'\u0179','zcaron':'\u017E','Zcaron':'\u017D','zcy':'\u0437','Zcy':'\u0417','zdot':'\u017C','Zdot':'\u017B','zeetrf':'\u2128','ZeroWidthSpace':'\u200B','zeta':'\u03B6','Zeta':'\u0396','zfr':'\uD835\uDD37','Zfr':'\u2128','zhcy':'\u0436','ZHcy':'\u0416','zigrarr':'\u21DD','zopf':'\uD835\uDD6B','Zopf':'\u2124','zscr':'\uD835\uDCCF','Zscr':'\uD835\uDCB5','zwj':'\u200D','zwnj':'\u200C'};
		var decodeMapLegacy = {'aacute':'\xE1','Aacute':'\xC1','acirc':'\xE2','Acirc':'\xC2','acute':'\xB4','aelig':'\xE6','AElig':'\xC6','agrave':'\xE0','Agrave':'\xC0','amp':'&','AMP':'&','aring':'\xE5','Aring':'\xC5','atilde':'\xE3','Atilde':'\xC3','auml':'\xE4','Auml':'\xC4','brvbar':'\xA6','ccedil':'\xE7','Ccedil':'\xC7','cedil':'\xB8','cent':'\xA2','copy':'\xA9','COPY':'\xA9','curren':'\xA4','deg':'\xB0','divide':'\xF7','eacute':'\xE9','Eacute':'\xC9','ecirc':'\xEA','Ecirc':'\xCA','egrave':'\xE8','Egrave':'\xC8','eth':'\xF0','ETH':'\xD0','euml':'\xEB','Euml':'\xCB','frac12':'\xBD','frac14':'\xBC','frac34':'\xBE','gt':'>','GT':'>','iacute':'\xED','Iacute':'\xCD','icirc':'\xEE','Icirc':'\xCE','iexcl':'\xA1','igrave':'\xEC','Igrave':'\xCC','iquest':'\xBF','iuml':'\xEF','Iuml':'\xCF','laquo':'\xAB','lt':'<','LT':'<','macr':'\xAF','micro':'\xB5','middot':'\xB7','nbsp':'\xA0','not':'\xAC','ntilde':'\xF1','Ntilde':'\xD1','oacute':'\xF3','Oacute':'\xD3','ocirc':'\xF4','Ocirc':'\xD4','ograve':'\xF2','Ograve':'\xD2','ordf':'\xAA','ordm':'\xBA','oslash':'\xF8','Oslash':'\xD8','otilde':'\xF5','Otilde':'\xD5','ouml':'\xF6','Ouml':'\xD6','para':'\xB6','plusmn':'\xB1','pound':'\xA3','quot':'"','QUOT':'"','raquo':'\xBB','reg':'\xAE','REG':'\xAE','sect':'\xA7','shy':'\xAD','sup1':'\xB9','sup2':'\xB2','sup3':'\xB3','szlig':'\xDF','thorn':'\xFE','THORN':'\xDE','times':'\xD7','uacute':'\xFA','Uacute':'\xDA','ucirc':'\xFB','Ucirc':'\xDB','ugrave':'\xF9','Ugrave':'\xD9','uml':'\xA8','uuml':'\xFC','Uuml':'\xDC','yacute':'\xFD','Yacute':'\xDD','yen':'\xA5','yuml':'\xFF'};
		var decodeMapNumeric = {'0':'\uFFFD','128':'\u20AC','130':'\u201A','131':'\u0192','132':'\u201E','133':'\u2026','134':'\u2020','135':'\u2021','136':'\u02C6','137':'\u2030','138':'\u0160','139':'\u2039','140':'\u0152','142':'\u017D','145':'\u2018','146':'\u2019','147':'\u201C','148':'\u201D','149':'\u2022','150':'\u2013','151':'\u2014','152':'\u02DC','153':'\u2122','154':'\u0161','155':'\u203A','156':'\u0153','158':'\u017E','159':'\u0178'};
		var invalidReferenceCodePoints = [1,2,3,4,5,6,7,8,11,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,127,128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,64976,64977,64978,64979,64980,64981,64982,64983,64984,64985,64986,64987,64988,64989,64990,64991,64992,64993,64994,64995,64996,64997,64998,64999,65000,65001,65002,65003,65004,65005,65006,65007,65534,65535,131070,131071,196606,196607,262142,262143,327678,327679,393214,393215,458750,458751,524286,524287,589822,589823,655358,655359,720894,720895,786430,786431,851966,851967,917502,917503,983038,983039,1048574,1048575,1114110,1114111];

		/*--------------------------------------------------------------------------*/

		var stringFromCharCode = String.fromCharCode;

		var object = {};
		var hasOwnProperty = object.hasOwnProperty;
		var has = function(object, propertyName) {
			return hasOwnProperty.call(object, propertyName);
		};

		var contains = function(array, value) {
			var index = -1;
			var length = array.length;
			while (++index < length) {
				if (array[index] == value) {
					return true;
				}
			}
			return false;
		};

		var merge = function(options, defaults) {
			if (!options) {
				return defaults;
			}
			var result = {};
			var key;
			for (key in defaults) {
				// A `hasOwnProperty` check is not needed here, since only recognized
				// option names are used anyway. Any others are ignored.
				result[key] = has(options, key) ? options[key] : defaults[key];
			}
			return result;
		};

		// Modified version of `ucs2encode`; see https://mths.be/punycode.
		var codePointToSymbol = function(codePoint, strict) {
			var output = '';
			if ((codePoint >= 0xD800 && codePoint <= 0xDFFF) || codePoint > 0x10FFFF) {
				// See issue #4:
				// “Otherwise, if the number is in the range 0xD800 to 0xDFFF or is
				// greater than 0x10FFFF, then this is a parse error. Return a U+FFFD
				// REPLACEMENT CHARACTER.”
				if (strict) {
					parseError('character reference outside the permissible Unicode range');
				}
				return '\uFFFD';
			}
			if (has(decodeMapNumeric, codePoint)) {
				if (strict) {
					parseError('disallowed character reference');
				}
				return decodeMapNumeric[codePoint];
			}
			if (strict && contains(invalidReferenceCodePoints, codePoint)) {
				parseError('disallowed character reference');
			}
			if (codePoint > 0xFFFF) {
				codePoint -= 0x10000;
				output += stringFromCharCode(codePoint >>> 10 & 0x3FF | 0xD800);
				codePoint = 0xDC00 | codePoint & 0x3FF;
			}
			output += stringFromCharCode(codePoint);
			return output;
		};

		var hexEscape = function(codePoint) {
			return '&#x' + codePoint.toString(16).toUpperCase() + ';';
		};

		var decEscape = function(codePoint) {
			return '&#' + codePoint + ';';
		};

		var parseError = function(message) {
			throw Error('Parse error: ' + message);
		};

		/*--------------------------------------------------------------------------*/

		var encode = function(string, options) {
			options = merge(options, encode.options);
			var strict = options.strict;
			if (strict && regexInvalidRawCodePoint.test(string)) {
				parseError('forbidden code point');
			}
			var encodeEverything = options.encodeEverything;
			var useNamedReferences = options.useNamedReferences;
			var allowUnsafeSymbols = options.allowUnsafeSymbols;
			var escapeCodePoint = options.decimal ? decEscape : hexEscape;

			var escapeBmpSymbol = function(symbol) {
				return escapeCodePoint(symbol.charCodeAt(0));
			};

			if (encodeEverything) {
				// Encode ASCII symbols.
				string = string.replace(regexAsciiWhitelist, function(symbol) {
					// Use named references if requested & possible.
					if (useNamedReferences && has(encodeMap, symbol)) {
						return '&' + encodeMap[symbol] + ';';
					}
					return escapeBmpSymbol(symbol);
				});
				// Shorten a few escapes that represent two symbols, of which at least one
				// is within the ASCII range.
				if (useNamedReferences) {
					string = string
						.replace(/&gt;\u20D2/g, '&nvgt;')
						.replace(/&lt;\u20D2/g, '&nvlt;')
						.replace(/&#x66;&#x6A;/g, '&fjlig;');
				}
				// Encode non-ASCII symbols.
				if (useNamedReferences) {
					// Encode non-ASCII symbols that can be replaced with a named reference.
					string = string.replace(regexEncodeNonAscii, function(string) {
						// Note: there is no need to check `has(encodeMap, string)` here.
						return '&' + encodeMap[string] + ';';
					});
				}
				// Note: any remaining non-ASCII symbols are handled outside of the `if`.
			} else if (useNamedReferences) {
				// Apply named character references.
				// Encode `<>"'&` using named character references.
				if (!allowUnsafeSymbols) {
					string = string.replace(regexEscape, function(string) {
						return '&' + encodeMap[string] + ';'; // no need to check `has()` here
					});
				}
				// Shorten escapes that represent two symbols, of which at least one is
				// `<>"'&`.
				string = string
					.replace(/&gt;\u20D2/g, '&nvgt;')
					.replace(/&lt;\u20D2/g, '&nvlt;');
				// Encode non-ASCII symbols that can be replaced with a named reference.
				string = string.replace(regexEncodeNonAscii, function(string) {
					// Note: there is no need to check `has(encodeMap, string)` here.
					return '&' + encodeMap[string] + ';';
				});
			} else if (!allowUnsafeSymbols) {
				// Encode `<>"'&` using hexadecimal escapes, now that they’re not handled
				// using named character references.
				string = string.replace(regexEscape, escapeBmpSymbol);
			}
			return string
				// Encode astral symbols.
				.replace(regexAstralSymbols, function($0) {
					// https://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
					var high = $0.charCodeAt(0);
					var low = $0.charCodeAt(1);
					var codePoint = (high - 0xD800) * 0x400 + low - 0xDC00 + 0x10000;
					return escapeCodePoint(codePoint);
				})
				// Encode any remaining BMP symbols that are not printable ASCII symbols
				// using a hexadecimal escape.
				.replace(regexBmpWhitelist, escapeBmpSymbol);
		};
		// Expose default options (so they can be overridden globally).
		encode.options = {
			'allowUnsafeSymbols': false,
			'encodeEverything': false,
			'strict': false,
			'useNamedReferences': false,
			'decimal' : false
		};

		var decode = function(html, options) {
			options = merge(options, decode.options);
			var strict = options.strict;
			if (strict && regexInvalidEntity.test(html)) {
				parseError('malformed character reference');
			}
			return html.replace(regexDecode, function($0, $1, $2, $3, $4, $5, $6, $7) {
				var codePoint;
				var semicolon;
				var decDigits;
				var hexDigits;
				var reference;
				var next;
				if ($1) {
					// Decode decimal escapes, e.g. `&#119558;`.
					decDigits = $1;
					semicolon = $2;
					if (strict && !semicolon) {
						parseError('character reference was not terminated by a semicolon');
					}
					codePoint = parseInt(decDigits, 10);
					return codePointToSymbol(codePoint, strict);
				}
				if ($3) {
					// Decode hexadecimal escapes, e.g. `&#x1D306;`.
					hexDigits = $3;
					semicolon = $4;
					if (strict && !semicolon) {
						parseError('character reference was not terminated by a semicolon');
					}
					codePoint = parseInt(hexDigits, 16);
					return codePointToSymbol(codePoint, strict);
				}
				if ($5) {
					// Decode named character references with trailing `;`, e.g. `&copy;`.
					reference = $5;
					if (has(decodeMap, reference)) {
						return decodeMap[reference];
					} else {
						// Ambiguous ampersand. https://mths.be/notes/ambiguous-ampersands
						if (strict) {
							parseError(
								'named character reference was not terminated by a semicolon'
							);
						}
						return $0;
					}
				}
				// If we’re still here, it’s a legacy reference for sure. No need for an
				// extra `if` check.
				// Decode named character references without trailing `;`, e.g. `&amp`
				// This is only a parse error if it gets converted to `&`, or if it is
				// followed by `=` in an attribute context.
				reference = $6;
				next = $7;
				if (next && options.isAttributeValue) {
					if (strict && next == '=') {
						parseError('`&` did not start a character reference');
					}
					return $0;
				} else {
					if (strict) {
						parseError(
							'named character reference was not terminated by a semicolon'
						);
					}
					// Note: there is no need to check `has(decodeMapLegacy, reference)`.
					return decodeMapLegacy[reference] + (next || '');
				}
			});
		};
		// Expose default options (so they can be overridden globally).
		decode.options = {
			'isAttributeValue': false,
			'strict': false
		};

		var escape = function(string) {
			return string.replace(regexEscape, function($0) {
				// Note: there is no need to check `has(escapeMap, $0)` here.
				return escapeMap[$0];
			});
		};

		/*--------------------------------------------------------------------------*/

		var he = {
			'version': '1.1.1',
			'encode': encode,
			'decode': decode,
			'escape': escape,
			'unescape': decode
		};

		// Some AMD build optimizers, like r.js, check for specific condition patterns
		// like the following:
		if (freeExports && !freeExports.nodeType) {
			if (freeModule) { // in Node.js, io.js, or RingoJS v0.8.0+
				freeModule.exports = he;
			} else { // in Narwhal or RingoJS v0.7.0-
				for (var key in he) {
					has(he, key) && (freeExports[key] = he[key]);
				}
			}
		} else { // in Rhino or a web browser
			root.he = he;
		}

	}(commonjsGlobal$$1));
	});

	/*  */

	/**
	 * Cross-platform code generation for component v-model
	 */
	function genComponentModel (
	  el,
	  value,
	  modifiers
	) {
	  var ref = modifiers || {};
	  var number = ref.number;
	  var trim = ref.trim;

	  var baseValueExpression = '$$v';
	  var valueExpression = baseValueExpression;
	  if (trim) {
	    valueExpression =
	      "(typeof " + baseValueExpression + " === 'string'" +
	      "? " + baseValueExpression + ".trim()" +
	      ": " + baseValueExpression + ")";
	  }
	  if (number) {
	    valueExpression = "_n(" + valueExpression + ")";
	  }
	  var assignment = genAssignmentCode(value, valueExpression);

	  el.model = {
	    value: ("(" + value + ")"),
	    expression: ("\"" + value + "\""),
	    callback: ("function (" + baseValueExpression + ") {" + assignment + "}")
	  };
	}

	/**
	 * Cross-platform codegen helper for generating v-model value assignment code.
	 */
	function genAssignmentCode (
	  value,
	  assignment
	) {
	  var res = parseModel(value);
	  if (res.key === null) {
	    return (value + "=" + assignment)
	  } else {
	    return ("$set(" + (res.exp) + ", " + (res.key) + ", " + assignment + ")")
	  }
	}

	/**
	 * Parse a v-model expression into a base path and a final key segment.
	 * Handles both dot-path and possible square brackets.
	 *
	 * Possible cases:
	 *
	 * - test
	 * - test[key]
	 * - test[test1[key]]
	 * - test["a"][key]
	 * - xxx.test[a[a].test1[key]]
	 * - test.xxx.a["asa"][test1[key]]
	 *
	 */

	var len;
	var str;
	var chr;
	var index;
	var expressionPos;
	var expressionEndPos;



	function parseModel (val) {
	  // Fix https://github.com/vuejs/vue/pull/7730
	  // allow v-model="obj.val " (trailing whitespace)
	  val = val.trim();
	  len = val.length;

	  if (val.indexOf('[') < 0 || val.lastIndexOf(']') < len - 1) {
	    index = val.lastIndexOf('.');
	    if (index > -1) {
	      return {
	        exp: val.slice(0, index),
	        key: '"' + val.slice(index + 1) + '"'
	      }
	    } else {
	      return {
	        exp: val,
	        key: null
	      }
	    }
	  }

	  str = val;
	  index = expressionPos = expressionEndPos = 0;

	  while (!eof()) {
	    chr = next();
	    /* istanbul ignore if */
	    if (isStringStart(chr)) {
	      parseString(chr);
	    } else if (chr === 0x5B) {
	      parseBracket(chr);
	    }
	  }

	  return {
	    exp: val.slice(0, expressionPos),
	    key: val.slice(expressionPos + 1, expressionEndPos)
	  }
	}

	function next () {
	  return str.charCodeAt(++index)
	}

	function eof () {
	  return index >= len
	}

	function isStringStart (chr) {
	  return chr === 0x22 || chr === 0x27
	}

	function parseBracket (chr) {
	  var inBracket = 1;
	  expressionPos = index;
	  while (!eof()) {
	    chr = next();
	    if (isStringStart(chr)) {
	      parseString(chr);
	      continue
	    }
	    if (chr === 0x5B) { inBracket++; }
	    if (chr === 0x5D) { inBracket--; }
	    if (inBracket === 0) {
	      expressionEndPos = index;
	      break
	    }
	  }
	}

	function parseString (chr) {
	  var stringQuote = chr;
	  while (!eof()) {
	    chr = next();
	    if (chr === stringQuote) {
	      break
	    }
	  }
	}

	/*  */

	var onRE = /^@|^v-on:/;
	var dirRE = /^v-|^@|^:/;
	var forAliasRE = /([^]*?)\s+(?:in|of)\s+([^]*)/;
	var forIteratorRE = /,([^,\}\]]*)(?:,([^,\}\]]*))?$/;
	var stripParensRE = /^\(|\)$/g;

	var argRE = /:(.*)$/;
	var bindRE = /^:|^v-bind:/;
	var modifierRE = /\.[^.]+/g;

	var decodeHTMLCached = cached(he.decode);

	// configurable state
	var warn$1;
	var delimiters;
	var transforms;
	var preTransforms;
	var postTransforms;
	var platformIsPreTag;
	var platformMustUseProp;
	var platformGetTagNamespace;



	function createASTElement (
	  tag,
	  attrs,
	  parent
	) {
	  return {
	    type: 1,
	    tag: tag,
	    attrsList: attrs,
	    attrsMap: makeAttrsMap(attrs),
	    parent: parent,
	    children: []
	  }
	}

	/**
	 * Convert HTML string to AST.
	 */
	function parse (
	  template,
	  options
	) {
	  warn$1 = options.warn || baseWarn;

	  platformIsPreTag = options.isPreTag || no;
	  platformMustUseProp = options.mustUseProp || no;
	  platformGetTagNamespace = options.getTagNamespace || no;

	  transforms = pluckModuleFunction(options.modules, 'transformNode');
	  preTransforms = pluckModuleFunction(options.modules, 'preTransformNode');
	  postTransforms = pluckModuleFunction(options.modules, 'postTransformNode');

	  delimiters = options.delimiters;

	  var stack = [];
	  var preserveWhitespace = options.preserveWhitespace !== false;
	  var root;
	  var currentParent;
	  var inVPre = false;
	  var inPre = false;
	  var warned = false;

	  function warnOnce (msg) {
	    if (!warned) {
	      warned = true;
	      warn$1(msg);
	    }
	  }

	  function closeElement (element) {
	    // check pre state
	    if (element.pre) {
	      inVPre = false;
	    }
	    if (platformIsPreTag(element.tag)) {
	      inPre = false;
	    }
	    // apply post-transforms
	    for (var i = 0; i < postTransforms.length; i++) {
	      postTransforms[i](element, options);
	    }
	  }

	  parseHTML(template, {
	    warn: warn$1,
	    expectHTML: options.expectHTML,
	    isUnaryTag: options.isUnaryTag,
	    canBeLeftOpenTag: options.canBeLeftOpenTag,
	    shouldDecodeNewlines: options.shouldDecodeNewlines,
	    shouldDecodeNewlinesForHref: options.shouldDecodeNewlinesForHref,
	    shouldKeepComment: options.comments,
	    start: function start (tag, attrs, unary) {
	      // check namespace.
	      // inherit parent ns if there is one
	      var ns = (currentParent && currentParent.ns) || platformGetTagNamespace(tag);

	      // handle IE svg bug
	      /* istanbul ignore if */
	      if (isIE && ns === 'svg') {
	        attrs = guardIESVGBug(attrs);
	      }

	      var element = createASTElement(tag, attrs, currentParent);
	      if (ns) {
	        element.ns = ns;
	      }

	      if (isForbiddenTag(element) && !isServerRendering()) {
	        element.forbidden = true;
	        warn$1(
	          'Templates should only be responsible for mapping the state to the ' +
	          'UI. Avoid placing tags with side-effects in your templates, such as ' +
	          "<" + tag + ">" + ', as they will not be parsed.'
	        );
	      }

	      // apply pre-transforms
	      for (var i = 0; i < preTransforms.length; i++) {
	        element = preTransforms[i](element, options) || element;
	      }

	      if (!inVPre) {
	        processPre(element);
	        if (element.pre) {
	          inVPre = true;
	        }
	      }
	      if (platformIsPreTag(element.tag)) {
	        inPre = true;
	      }
	      if (inVPre) {
	        processRawAttrs(element);
	      } else if (!element.processed) {
	        // structural directives
	        processFor(element);
	        processIf(element);
	        processOnce(element);
	        // element-scope stuff
	        processElement(element, options);
	      }

	      function checkRootConstraints (el) {
	        {
	          if (el.tag === 'slot' || el.tag === 'template') {
	            warnOnce(
	              "Cannot use <" + (el.tag) + "> as component root element because it may " +
	              'contain multiple nodes.'
	            );
	          }
	          if (el.attrsMap.hasOwnProperty('v-for')) {
	            warnOnce(
	              'Cannot use v-for on stateful component root element because ' +
	              'it renders multiple elements.'
	            );
	          }
	        }
	      }

	      // tree management
	      if (!root) {
	        root = element;
	        checkRootConstraints(root);
	      } else if (!stack.length) {
	        // allow root elements with v-if, v-else-if and v-else
	        if (root.if && (element.elseif || element.else)) {
	          checkRootConstraints(element);
	          addIfCondition(root, {
	            exp: element.elseif,
	            block: element
	          });
	        } else {
	          warnOnce(
	            "Component template should contain exactly one root element. " +
	            "If you are using v-if on multiple elements, " +
	            "use v-else-if to chain them instead."
	          );
	        }
	      }
	      if (currentParent && !element.forbidden) {
	        if (element.elseif || element.else) {
	          processIfConditions(element, currentParent);
	        } else if (element.slotScope) { // scoped slot
	          currentParent.plain = false;
	          var name = element.slotTarget || '"default"';(currentParent.scopedSlots || (currentParent.scopedSlots = {}))[name] = element;
	        } else {
	          currentParent.children.push(element);
	          element.parent = currentParent;
	        }
	      }
	      if (!unary) {
	        currentParent = element;
	        stack.push(element);
	      } else {
	        closeElement(element);
	      }
	    },

	    end: function end () {
	      // remove trailing whitespace
	      var element = stack[stack.length - 1];
	      var lastNode = element.children[element.children.length - 1];
	      if (lastNode && lastNode.type === 3 && lastNode.text === ' ' && !inPre) {
	        element.children.pop();
	      }
	      // pop stack
	      stack.length -= 1;
	      currentParent = stack[stack.length - 1];
	      closeElement(element);
	    },

	    chars: function chars (text) {
	      if (!currentParent) {
	        {
	          if (text === template) {
	            warnOnce(
	              'Component template requires a root element, rather than just text.'
	            );
	          } else if ((text = text.trim())) {
	            warnOnce(
	              ("text \"" + text + "\" outside root element will be ignored.")
	            );
	          }
	        }
	        return
	      }
	      // IE textarea placeholder bug
	      /* istanbul ignore if */
	      if (isIE &&
	        currentParent.tag === 'textarea' &&
	        currentParent.attrsMap.placeholder === text
	      ) {
	        return
	      }
	      var children = currentParent.children;
	      text = inPre || text.trim()
	        ? isTextTag(currentParent) ? text : decodeHTMLCached(text)
	        // only preserve whitespace if its not right after a starting tag
	        : preserveWhitespace && children.length ? ' ' : '';
	      if (text) {
	        var res;
	        if (!inVPre && text !== ' ' && (res = parseText(text, delimiters))) {
	          children.push({
	            type: 2,
	            expression: res.expression,
	            tokens: res.tokens,
	            text: text
	          });
	        } else if (text !== ' ' || !children.length || children[children.length - 1].text !== ' ') {
	          children.push({
	            type: 3,
	            text: text
	          });
	        }
	      }
	    },
	    comment: function comment (text) {
	      currentParent.children.push({
	        type: 3,
	        text: text,
	        isComment: true
	      });
	    }
	  });
	  return root
	}

	function processPre (el) {
	  if (getAndRemoveAttr(el, 'v-pre') != null) {
	    el.pre = true;
	  }
	}

	function processRawAttrs (el) {
	  var l = el.attrsList.length;
	  if (l) {
	    var attrs = el.attrs = new Array(l);
	    for (var i = 0; i < l; i++) {
	      attrs[i] = {
	        name: el.attrsList[i].name,
	        value: JSON.stringify(el.attrsList[i].value)
	      };
	    }
	  } else if (!el.pre) {
	    // non root node in pre blocks with no attributes
	    el.plain = true;
	  }
	}

	function processElement (element, options) {
	  processKey(element);

	  // determine whether this is a plain element after
	  // removing structural attributes
	  element.plain = !element.key && !element.attrsList.length;

	  processRef(element);
	  processSlot(element);
	  processComponent(element);
	  for (var i = 0; i < transforms.length; i++) {
	    element = transforms[i](element, options) || element;
	  }
	  processAttrs(element);
	}

	function processKey (el) {
	  var exp = getBindingAttr(el, 'key');
	  if (exp) {
	    if (el.tag === 'template') {
	      warn$1("<template> cannot be keyed. Place the key on real elements instead.");
	    }
	    el.key = exp;
	  }
	}

	function processRef (el) {
	  var ref = getBindingAttr(el, 'ref');
	  if (ref) {
	    el.ref = ref;
	    el.refInFor = checkInFor(el);
	  }
	}

	function processFor (el) {
	  var exp;
	  if ((exp = getAndRemoveAttr(el, 'v-for'))) {
	    var res = parseFor(exp);
	    if (res) {
	      extend(el, res);
	    } else {
	      warn$1(
	        ("Invalid v-for expression: " + exp)
	      );
	    }
	  }
	}



	function parseFor (exp) {
	  var inMatch = exp.match(forAliasRE);
	  if (!inMatch) { return }
	  var res = {};
	  res.for = inMatch[2].trim();
	  var alias = inMatch[1].trim().replace(stripParensRE, '');
	  var iteratorMatch = alias.match(forIteratorRE);
	  if (iteratorMatch) {
	    res.alias = alias.replace(forIteratorRE, '');
	    res.iterator1 = iteratorMatch[1].trim();
	    if (iteratorMatch[2]) {
	      res.iterator2 = iteratorMatch[2].trim();
	    }
	  } else {
	    res.alias = alias;
	  }
	  return res
	}

	function processIf (el) {
	  var exp = getAndRemoveAttr(el, 'v-if');
	  if (exp) {
	    el.if = exp;
	    addIfCondition(el, {
	      exp: exp,
	      block: el
	    });
	  } else {
	    if (getAndRemoveAttr(el, 'v-else') != null) {
	      el.else = true;
	    }
	    var elseif = getAndRemoveAttr(el, 'v-else-if');
	    if (elseif) {
	      el.elseif = elseif;
	    }
	  }
	}

	function processIfConditions (el, parent) {
	  var prev = findPrevElement(parent.children);
	  if (prev && prev.if) {
	    addIfCondition(prev, {
	      exp: el.elseif,
	      block: el
	    });
	  } else {
	    warn$1(
	      "v-" + (el.elseif ? ('else-if="' + el.elseif + '"') : 'else') + " " +
	      "used on element <" + (el.tag) + "> without corresponding v-if."
	    );
	  }
	}

	function findPrevElement (children) {
	  var i = children.length;
	  while (i--) {
	    if (children[i].type === 1) {
	      return children[i]
	    } else {
	      if (children[i].text !== ' ') {
	        warn$1(
	          "text \"" + (children[i].text.trim()) + "\" between v-if and v-else(-if) " +
	          "will be ignored."
	        );
	      }
	      children.pop();
	    }
	  }
	}

	function addIfCondition (el, condition) {
	  if (!el.ifConditions) {
	    el.ifConditions = [];
	  }
	  el.ifConditions.push(condition);
	}

	function processOnce (el) {
	  var once$$1 = getAndRemoveAttr(el, 'v-once');
	  if (once$$1 != null) {
	    el.once = true;
	  }
	}

	function processSlot (el) {
	  if (el.tag === 'slot') {
	    el.slotName = getBindingAttr(el, 'name');
	    if (el.key) {
	      warn$1(
	        "`key` does not work on <slot> because slots are abstract outlets " +
	        "and can possibly expand into multiple elements. " +
	        "Use the key on a wrapping element instead."
	      );
	    }
	  } else {
	    var slotScope;
	    if (el.tag === 'template') {
	      slotScope = getAndRemoveAttr(el, 'scope');
	      /* istanbul ignore if */
	      if (slotScope) {
	        warn$1(
	          "the \"scope\" attribute for scoped slots have been deprecated and " +
	          "replaced by \"slot-scope\" since 2.5. The new \"slot-scope\" attribute " +
	          "can also be used on plain elements in addition to <template> to " +
	          "denote scoped slots.",
	          true
	        );
	      }
	      el.slotScope = slotScope || getAndRemoveAttr(el, 'slot-scope');
	    } else if ((slotScope = getAndRemoveAttr(el, 'slot-scope'))) {
	      /* istanbul ignore if */
	      if (el.attrsMap['v-for']) {
	        warn$1(
	          "Ambiguous combined usage of slot-scope and v-for on <" + (el.tag) + "> " +
	          "(v-for takes higher priority). Use a wrapper <template> for the " +
	          "scoped slot to make it clearer.",
	          true
	        );
	      }
	      el.slotScope = slotScope;
	    }
	    var slotTarget = getBindingAttr(el, 'slot');
	    if (slotTarget) {
	      el.slotTarget = slotTarget === '""' ? '"default"' : slotTarget;
	      // preserve slot as an attribute for native shadow DOM compat
	      // only for non-scoped slots.
	      if (el.tag !== 'template' && !el.slotScope) {
	        addAttr(el, 'slot', slotTarget);
	      }
	    }
	  }
	}

	function processComponent (el) {
	  var binding;
	  if ((binding = getBindingAttr(el, 'is'))) {
	    el.component = binding;
	  }
	  if (getAndRemoveAttr(el, 'inline-template') != null) {
	    el.inlineTemplate = true;
	  }
	}

	function processAttrs (el) {
	  var list = el.attrsList;
	  var i, l, name, rawName, value, modifiers, isProp;
	  for (i = 0, l = list.length; i < l; i++) {
	    name = rawName = list[i].name;
	    value = list[i].value;
	    if (dirRE.test(name)) {
	      // mark element as dynamic
	      el.hasBindings = true;
	      // modifiers
	      modifiers = parseModifiers(name);
	      if (modifiers) {
	        name = name.replace(modifierRE, '');
	      }
	      if (bindRE.test(name)) { // v-bind
	        name = name.replace(bindRE, '');
	        value = parseFilters(value);
	        isProp = false;
	        if (modifiers) {
	          if (modifiers.prop) {
	            isProp = true;
	            name = camelize(name);
	            if (name === 'innerHtml') { name = 'innerHTML'; }
	          }
	          if (modifiers.camel) {
	            name = camelize(name);
	          }
	          if (modifiers.sync) {
	            addHandler(
	              el,
	              ("update:" + (camelize(name))),
	              genAssignmentCode(value, "$event")
	            );
	          }
	        }
	        if (isProp || (
	          !el.component && platformMustUseProp(el.tag, el.attrsMap.type, name)
	        )) {
	          addProp(el, name, value);
	        } else {
	          addAttr(el, name, value);
	        }
	      } else if (onRE.test(name)) { // v-on
	        name = name.replace(onRE, '');
	        addHandler(el, name, value, modifiers, false, warn$1);
	      } else { // normal directives
	        name = name.replace(dirRE, '');
	        // parse arg
	        var argMatch = name.match(argRE);
	        var arg = argMatch && argMatch[1];
	        if (arg) {
	          name = name.slice(0, -(arg.length + 1));
	        }
	        addDirective(el, name, rawName, value, arg, modifiers);
	        if (name === 'model') {
	          checkForAliasModel(el, value);
	        }
	      }
	    } else {
	      // literal attribute
	      {
	        var res = parseText(value, delimiters);
	        if (res) {
	          warn$1(
	            name + "=\"" + value + "\": " +
	            'Interpolation inside attributes has been removed. ' +
	            'Use v-bind or the colon shorthand instead. For example, ' +
	            'instead of <div id="{{ val }}">, use <div :id="val">.'
	          );
	        }
	      }
	      addAttr(el, name, JSON.stringify(value));
	      // #6887 firefox doesn't update muted state if set via attribute
	      // even immediately after element creation
	      if (!el.component &&
	          name === 'muted' &&
	          platformMustUseProp(el.tag, el.attrsMap.type, name)) {
	        addProp(el, name, 'true');
	      }
	    }
	  }
	}

	function checkInFor (el) {
	  var parent = el;
	  while (parent) {
	    if (parent.for !== undefined) {
	      return true
	    }
	    parent = parent.parent;
	  }
	  return false
	}

	function parseModifiers (name) {
	  var match = name.match(modifierRE);
	  if (match) {
	    var ret = {};
	    match.forEach(function (m) { ret[m.slice(1)] = true; });
	    return ret
	  }
	}

	function makeAttrsMap (attrs) {
	  var map = {};
	  for (var i = 0, l = attrs.length; i < l; i++) {
	    if (
	      map[attrs[i].name] && !isIE && !isEdge
	    ) {
	      warn$1('duplicate attribute: ' + attrs[i].name);
	    }
	    map[attrs[i].name] = attrs[i].value;
	  }
	  return map
	}

	// for script (e.g. type="x/template") or style, do not decode content
	function isTextTag (el) {
	  return el.tag === 'script' || el.tag === 'style'
	}

	function isForbiddenTag (el) {
	  return (
	    el.tag === 'style' ||
	    (el.tag === 'script' && (
	      !el.attrsMap.type ||
	      el.attrsMap.type === 'text/javascript'
	    ))
	  )
	}

	var ieNSBug = /^xmlns:NS\d+/;
	var ieNSPrefix = /^NS\d+:/;

	/* istanbul ignore next */
	function guardIESVGBug (attrs) {
	  var res = [];
	  for (var i = 0; i < attrs.length; i++) {
	    var attr = attrs[i];
	    if (!ieNSBug.test(attr.name)) {
	      attr.name = attr.name.replace(ieNSPrefix, '');
	      res.push(attr);
	    }
	  }
	  return res
	}

	function checkForAliasModel (el, value) {
	  var _el = el;
	  while (_el) {
	    if (_el.for && _el.alias === value) {
	      warn$1(
	        "<" + (el.tag) + " v-model=\"" + value + "\">: " +
	        "You are binding v-model directly to a v-for iteration alias. " +
	        "This will not be able to modify the v-for source array because " +
	        "writing to the alias is like modifying a function local variable. " +
	        "Consider using an array of objects and use v-model on an object property instead."
	      );
	    }
	    _el = _el.parent;
	  }
	}

	/*  */

	/**
	 * Expand input[v-model] with dyanmic type bindings into v-if-else chains
	 * Turn this:
	 *   <input v-model="data[type]" :type="type">
	 * into this:
	 *   <input v-if="type === 'checkbox'" type="checkbox" v-model="data[type]">
	 *   <input v-else-if="type === 'radio'" type="radio" v-model="data[type]">
	 *   <input v-else :type="type" v-model="data[type]">
	 */

	function preTransformNode (el, options) {
	  if (el.tag === 'input') {
	    var map = el.attrsMap;
	    if (!map['v-model']) {
	      return
	    }

	    var typeBinding;
	    if (map[':type'] || map['v-bind:type']) {
	      typeBinding = getBindingAttr(el, 'type');
	    }
	    if (!map.type && !typeBinding && map['v-bind']) {
	      typeBinding = "(" + (map['v-bind']) + ").type";
	    }

	    if (typeBinding) {
	      var ifCondition = getAndRemoveAttr(el, 'v-if', true);
	      var ifConditionExtra = ifCondition ? ("&&(" + ifCondition + ")") : "";
	      var hasElse = getAndRemoveAttr(el, 'v-else', true) != null;
	      var elseIfCondition = getAndRemoveAttr(el, 'v-else-if', true);
	      // 1. checkbox
	      var branch0 = cloneASTElement(el);
	      // process for on the main node
	      processFor(branch0);
	      addRawAttr(branch0, 'type', 'checkbox');
	      processElement(branch0, options);
	      branch0.processed = true; // prevent it from double-processed
	      branch0.if = "(" + typeBinding + ")==='checkbox'" + ifConditionExtra;
	      addIfCondition(branch0, {
	        exp: branch0.if,
	        block: branch0
	      });
	      // 2. add radio else-if condition
	      var branch1 = cloneASTElement(el);
	      getAndRemoveAttr(branch1, 'v-for', true);
	      addRawAttr(branch1, 'type', 'radio');
	      processElement(branch1, options);
	      addIfCondition(branch0, {
	        exp: "(" + typeBinding + ")==='radio'" + ifConditionExtra,
	        block: branch1
	      });
	      // 3. other
	      var branch2 = cloneASTElement(el);
	      getAndRemoveAttr(branch2, 'v-for', true);
	      addRawAttr(branch2, ':type', typeBinding);
	      processElement(branch2, options);
	      addIfCondition(branch0, {
	        exp: ifCondition,
	        block: branch2
	      });

	      if (hasElse) {
	        branch0.else = true;
	      } else if (elseIfCondition) {
	        branch0.elseif = elseIfCondition;
	      }

	      return branch0
	    }
	  }
	}

	function cloneASTElement (el) {
	  return createASTElement(el.tag, el.attrsList.slice(), el.parent)
	}

	var model = {
	  preTransformNode: preTransformNode
	};

	var modules = [
	  klass,
	  style,
	  model
	];

	/*  */

	var warn$2;

	// in some cases, the event used has to be determined at runtime
	// so we used some reserved tokens during compile.
	var RANGE_TOKEN = '__r';


	function model$1 (
	  el,
	  dir,
	  _warn
	) {
	  warn$2 = _warn;
	  var value = dir.value;
	  var modifiers = dir.modifiers;
	  var tag = el.tag;
	  var type = el.attrsMap.type;

	  {
	    // inputs with type="file" are read only and setting the input's
	    // value will throw an error.
	    if (tag === 'input' && type === 'file') {
	      warn$2(
	        "<" + (el.tag) + " v-model=\"" + value + "\" type=\"file\">:\n" +
	        "File inputs are read only. Use a v-on:change listener instead."
	      );
	    }
	  }

	  if (el.component) {
	    genComponentModel(el, value, modifiers);
	    // component v-model doesn't need extra runtime
	    return false
	  } else if (tag === 'select') {
	    genSelect(el, value, modifiers);
	  } else if (tag === 'input' && type === 'checkbox') {
	    genCheckboxModel(el, value, modifiers);
	  } else if (tag === 'input' && type === 'radio') {
	    genRadioModel(el, value, modifiers);
	  } else if (tag === 'input' || tag === 'textarea') {
	    genDefaultModel(el, value, modifiers);
	  } else {
	    genComponentModel(el, value, modifiers);
	    // component v-model doesn't need extra runtime
	    return false
	  }

	  // ensure runtime directive metadata
	  return true
	}

	function genCheckboxModel (
	  el,
	  value,
	  modifiers
	) {
	  var number = modifiers && modifiers.number;
	  var valueBinding = getBindingAttr(el, 'value') || 'null';
	  var trueValueBinding = getBindingAttr(el, 'true-value') || 'true';
	  var falseValueBinding = getBindingAttr(el, 'false-value') || 'false';
	  addProp(el, 'checked',
	    "Array.isArray(" + value + ")" +
	    "?_i(" + value + "," + valueBinding + ")>-1" + (
	      trueValueBinding === 'true'
	        ? (":(" + value + ")")
	        : (":_q(" + value + "," + trueValueBinding + ")")
	    )
	  );
	  addHandler(el, 'change',
	    "var $$a=" + value + "," +
	        '$$el=$event.target,' +
	        "$$c=$$el.checked?(" + trueValueBinding + "):(" + falseValueBinding + ");" +
	    'if(Array.isArray($$a)){' +
	      "var $$v=" + (number ? '_n(' + valueBinding + ')' : valueBinding) + "," +
	          '$$i=_i($$a,$$v);' +
	      "if($$el.checked){$$i<0&&(" + (genAssignmentCode(value, '$$a.concat([$$v])')) + ")}" +
	      "else{$$i>-1&&(" + (genAssignmentCode(value, '$$a.slice(0,$$i).concat($$a.slice($$i+1))')) + ")}" +
	    "}else{" + (genAssignmentCode(value, '$$c')) + "}",
	    null, true
	  );
	}

	function genRadioModel (
	  el,
	  value,
	  modifiers
	) {
	  var number = modifiers && modifiers.number;
	  var valueBinding = getBindingAttr(el, 'value') || 'null';
	  valueBinding = number ? ("_n(" + valueBinding + ")") : valueBinding;
	  addProp(el, 'checked', ("_q(" + value + "," + valueBinding + ")"));
	  addHandler(el, 'change', genAssignmentCode(value, valueBinding), null, true);
	}

	function genSelect (
	  el,
	  value,
	  modifiers
	) {
	  var number = modifiers && modifiers.number;
	  var selectedVal = "Array.prototype.filter" +
	    ".call($event.target.options,function(o){return o.selected})" +
	    ".map(function(o){var val = \"_value\" in o ? o._value : o.value;" +
	    "return " + (number ? '_n(val)' : 'val') + "})";

	  var assignment = '$event.target.multiple ? $$selectedVal : $$selectedVal[0]';
	  var code = "var $$selectedVal = " + selectedVal + ";";
	  code = code + " " + (genAssignmentCode(value, assignment));
	  addHandler(el, 'change', code, null, true);
	}

	function genDefaultModel (
	  el,
	  value,
	  modifiers
	) {
	  var type = el.attrsMap.type;

	  // warn if v-bind:value conflicts with v-model
	  // except for inputs with v-bind:type
	  {
	    var value$1 = el.attrsMap['v-bind:value'] || el.attrsMap[':value'];
	    var typeBinding = el.attrsMap['v-bind:type'] || el.attrsMap[':type'];
	    if (value$1 && !typeBinding) {
	      var binding = el.attrsMap['v-bind:value'] ? 'v-bind:value' : ':value';
	      warn$2(
	        binding + "=\"" + value$1 + "\" conflicts with v-model on the same element " +
	        'because the latter already expands to a value binding internally'
	      );
	    }
	  }

	  var ref = modifiers || {};
	  var lazy = ref.lazy;
	  var number = ref.number;
	  var trim = ref.trim;
	  var needCompositionGuard = !lazy && type !== 'range';
	  var event = lazy
	    ? 'change'
	    : type === 'range'
	      ? RANGE_TOKEN
	      : 'input';

	  var valueExpression = '$event.target.value';
	  if (trim) {
	    valueExpression = "$event.target.value.trim()";
	  }
	  if (number) {
	    valueExpression = "_n(" + valueExpression + ")";
	  }

	  var code = genAssignmentCode(value, valueExpression);
	  if (needCompositionGuard) {
	    code = "if($event.target.composing)return;" + code;
	  }

	  addProp(el, 'value', ("(" + value + ")"));
	  addHandler(el, event, code, null, true);
	  if (trim || number) {
	    addHandler(el, 'blur', '$forceUpdate()');
	  }
	}

	/*  */

	function text (el, dir) {
	  if (dir.value) {
	    addProp(el, 'textContent', ("_s(" + (dir.value) + ")"));
	  }
	}

	/*  */

	function html (el, dir) {
	  if (dir.value) {
	    addProp(el, 'innerHTML', ("_s(" + (dir.value) + ")"));
	  }
	}

	var directives = {
	  model: model$1,
	  text: text,
	  html: html
	};

	/*  */

	var baseOptions = {
	  expectHTML: true,
	  modules: modules,
	  directives: directives,
	  isPreTag: isPreTag,
	  isUnaryTag: isUnaryTag,
	  mustUseProp: mustUseProp,
	  canBeLeftOpenTag: canBeLeftOpenTag,
	  isReservedTag: isReservedTag,
	  getTagNamespace: getTagNamespace,
	  staticKeys: genStaticKeys(modules)
	};

	/*  */

	var isStaticKey;
	var isPlatformReservedTag;

	var genStaticKeysCached = cached(genStaticKeys$1);

	/**
	 * Goal of the optimizer: walk the generated template AST tree
	 * and detect sub-trees that are purely static, i.e. parts of
	 * the DOM that never needs to change.
	 *
	 * Once we detect these sub-trees, we can:
	 *
	 * 1. Hoist them into constants, so that we no longer need to
	 *    create fresh nodes for them on each re-render;
	 * 2. Completely skip them in the patching process.
	 */
	function optimize (root, options) {
	  if (!root) { return }
	  isStaticKey = genStaticKeysCached(options.staticKeys || '');
	  isPlatformReservedTag = options.isReservedTag || no;
	  // first pass: mark all non-static nodes.
	  markStatic(root);
	  // second pass: mark static roots.
	  markStaticRoots(root, false);
	}

	function genStaticKeys$1 (keys) {
	  return makeMap(
	    'type,tag,attrsList,attrsMap,plain,parent,children,attrs' +
	    (keys ? ',' + keys : '')
	  )
	}

	function markStatic (node) {
	  node.static = isStatic(node);
	  if (node.type === 1) {
	    // do not make component slot content static. this avoids
	    // 1. components not able to mutate slot nodes
	    // 2. static slot content fails for hot-reloading
	    if (
	      !isPlatformReservedTag(node.tag) &&
	      node.tag !== 'slot' &&
	      node.attrsMap['inline-template'] == null
	    ) {
	      return
	    }
	    for (var i = 0, l = node.children.length; i < l; i++) {
	      var child = node.children[i];
	      markStatic(child);
	      if (!child.static) {
	        node.static = false;
	      }
	    }
	    if (node.ifConditions) {
	      for (var i$1 = 1, l$1 = node.ifConditions.length; i$1 < l$1; i$1++) {
	        var block = node.ifConditions[i$1].block;
	        markStatic(block);
	        if (!block.static) {
	          node.static = false;
	        }
	      }
	    }
	  }
	}

	function markStaticRoots (node, isInFor) {
	  if (node.type === 1) {
	    if (node.static || node.once) {
	      node.staticInFor = isInFor;
	    }
	    // For a node to qualify as a static root, it should have children that
	    // are not just static text. Otherwise the cost of hoisting out will
	    // outweigh the benefits and it's better off to just always render it fresh.
	    if (node.static && node.children.length && !(
	      node.children.length === 1 &&
	      node.children[0].type === 3
	    )) {
	      node.staticRoot = true;
	      return
	    } else {
	      node.staticRoot = false;
	    }
	    if (node.children) {
	      for (var i = 0, l = node.children.length; i < l; i++) {
	        markStaticRoots(node.children[i], isInFor || !!node.for);
	      }
	    }
	    if (node.ifConditions) {
	      for (var i$1 = 1, l$1 = node.ifConditions.length; i$1 < l$1; i$1++) {
	        markStaticRoots(node.ifConditions[i$1].block, isInFor);
	      }
	    }
	  }
	}

	function isStatic (node) {
	  if (node.type === 2) { // expression
	    return false
	  }
	  if (node.type === 3) { // text
	    return true
	  }
	  return !!(node.pre || (
	    !node.hasBindings && // no dynamic bindings
	    !node.if && !node.for && // not v-if or v-for or v-else
	    !isBuiltInTag(node.tag) && // not a built-in
	    isPlatformReservedTag(node.tag) && // not a component
	    !isDirectChildOfTemplateFor(node) &&
	    Object.keys(node).every(isStaticKey)
	  ))
	}

	function isDirectChildOfTemplateFor (node) {
	  while (node.parent) {
	    node = node.parent;
	    if (node.tag !== 'template') {
	      return false
	    }
	    if (node.for) {
	      return true
	    }
	  }
	  return false
	}

	/*  */

	var fnExpRE = /^([\w$_]+|\([^)]*?\))\s*=>|^function\s*\(/;
	var simplePathRE = /^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*|\['[^']*?']|\["[^"]*?"]|\[\d+]|\[[A-Za-z_$][\w$]*])*$/;

	// KeyboardEvent.keyCode aliases
	var keyCodes = {
	  esc: 27,
	  tab: 9,
	  enter: 13,
	  space: 32,
	  up: 38,
	  left: 37,
	  right: 39,
	  down: 40,
	  'delete': [8, 46]
	};

	// KeyboardEvent.key aliases
	var keyNames = {
	  esc: 'Escape',
	  tab: 'Tab',
	  enter: 'Enter',
	  space: ' ',
	  // #7806: IE11 uses key names without `Arrow` prefix for arrow keys.
	  up: ['Up', 'ArrowUp'],
	  left: ['Left', 'ArrowLeft'],
	  right: ['Right', 'ArrowRight'],
	  down: ['Down', 'ArrowDown'],
	  'delete': ['Backspace', 'Delete']
	};

	// #4868: modifiers that prevent the execution of the listener
	// need to explicitly return null so that we can determine whether to remove
	// the listener for .once
	var genGuard = function (condition) { return ("if(" + condition + ")return null;"); };

	var modifierCode = {
	  stop: '$event.stopPropagation();',
	  prevent: '$event.preventDefault();',
	  self: genGuard("$event.target !== $event.currentTarget"),
	  ctrl: genGuard("!$event.ctrlKey"),
	  shift: genGuard("!$event.shiftKey"),
	  alt: genGuard("!$event.altKey"),
	  meta: genGuard("!$event.metaKey"),
	  left: genGuard("'button' in $event && $event.button !== 0"),
	  middle: genGuard("'button' in $event && $event.button !== 1"),
	  right: genGuard("'button' in $event && $event.button !== 2")
	};

	function genHandlers (
	  events,
	  isNative,
	  warn
	) {
	  var res = isNative ? 'nativeOn:{' : 'on:{';
	  for (var name in events) {
	    res += "\"" + name + "\":" + (genHandler(name, events[name])) + ",";
	  }
	  return res.slice(0, -1) + '}'
	}

	function genHandler (
	  name,
	  handler
	) {
	  if (!handler) {
	    return 'function(){}'
	  }

	  if (Array.isArray(handler)) {
	    return ("[" + (handler.map(function (handler) { return genHandler(name, handler); }).join(',')) + "]")
	  }

	  var isMethodPath = simplePathRE.test(handler.value);
	  var isFunctionExpression = fnExpRE.test(handler.value);

	  if (!handler.modifiers) {
	    if (isMethodPath || isFunctionExpression) {
	      return handler.value
	    }
	    /* istanbul ignore if */
	    return ("function($event){" + (handler.value) + "}") // inline statement
	  } else {
	    var code = '';
	    var genModifierCode = '';
	    var keys = [];
	    for (var key in handler.modifiers) {
	      if (modifierCode[key]) {
	        genModifierCode += modifierCode[key];
	        // left/right
	        if (keyCodes[key]) {
	          keys.push(key);
	        }
	      } else if (key === 'exact') {
	        var modifiers = (handler.modifiers);
	        genModifierCode += genGuard(
	          ['ctrl', 'shift', 'alt', 'meta']
	            .filter(function (keyModifier) { return !modifiers[keyModifier]; })
	            .map(function (keyModifier) { return ("$event." + keyModifier + "Key"); })
	            .join('||')
	        );
	      } else {
	        keys.push(key);
	      }
	    }
	    if (keys.length) {
	      code += genKeyFilter(keys);
	    }
	    // Make sure modifiers like prevent and stop get executed after key filtering
	    if (genModifierCode) {
	      code += genModifierCode;
	    }
	    var handlerCode = isMethodPath
	      ? ("return " + (handler.value) + "($event)")
	      : isFunctionExpression
	        ? ("return (" + (handler.value) + ")($event)")
	        : handler.value;
	    /* istanbul ignore if */
	    return ("function($event){" + code + handlerCode + "}")
	  }
	}

	function genKeyFilter (keys) {
	  return ("if(!('button' in $event)&&" + (keys.map(genFilterCode).join('&&')) + ")return null;")
	}

	function genFilterCode (key) {
	  var keyVal = parseInt(key, 10);
	  if (keyVal) {
	    return ("$event.keyCode!==" + keyVal)
	  }
	  var keyCode = keyCodes[key];
	  var keyName = keyNames[key];
	  return (
	    "_k($event.keyCode," +
	    (JSON.stringify(key)) + "," +
	    (JSON.stringify(keyCode)) + "," +
	    "$event.key," +
	    "" + (JSON.stringify(keyName)) +
	    ")"
	  )
	}

	/*  */

	function on (el, dir) {
	  if (dir.modifiers) {
	    warn("v-on without argument does not support modifiers.");
	  }
	  el.wrapListeners = function (code) { return ("_g(" + code + "," + (dir.value) + ")"); };
	}

	/*  */

	function bind$1 (el, dir) {
	  el.wrapData = function (code) {
	    return ("_b(" + code + ",'" + (el.tag) + "'," + (dir.value) + "," + (dir.modifiers && dir.modifiers.prop ? 'true' : 'false') + (dir.modifiers && dir.modifiers.sync ? ',true' : '') + ")")
	  };
	}

	/*  */

	var baseDirectives = {
	  on: on,
	  bind: bind$1,
	  cloak: noop
	};

	/*  */

	var CodegenState = function CodegenState (options) {
	  this.options = options;
	  this.warn = options.warn || baseWarn;
	  this.transforms = pluckModuleFunction(options.modules, 'transformCode');
	  this.dataGenFns = pluckModuleFunction(options.modules, 'genData');
	  this.directives = extend(extend({}, baseDirectives), options.directives);
	  var isReservedTag = options.isReservedTag || no;
	  this.maybeComponent = function (el) { return !isReservedTag(el.tag); };
	  this.onceId = 0;
	  this.staticRenderFns = [];
	};



	function generate (
	  ast,
	  options
	) {
	  var state = new CodegenState(options);
	  var code = ast ? genElement(ast, state) : '_c("div")';
	  return {
	    render: ("with(this){return " + code + "}"),
	    staticRenderFns: state.staticRenderFns
	  }
	}

	function genElement (el, state) {
	  if (el.staticRoot && !el.staticProcessed) {
	    return genStatic(el, state)
	  } else if (el.once && !el.onceProcessed) {
	    return genOnce(el, state)
	  } else if (el.for && !el.forProcessed) {
	    return genFor(el, state)
	  } else if (el.if && !el.ifProcessed) {
	    return genIf(el, state)
	  } else if (el.tag === 'template' && !el.slotTarget) {
	    return genChildren(el, state) || 'void 0'
	  } else if (el.tag === 'slot') {
	    return genSlot(el, state)
	  } else {
	    // component or element
	    var code;
	    if (el.component) {
	      code = genComponent(el.component, el, state);
	    } else {
	      var data = el.plain ? undefined : genData$2(el, state);

	      var children = el.inlineTemplate ? null : genChildren(el, state, true);
	      code = "_c('" + (el.tag) + "'" + (data ? ("," + data) : '') + (children ? ("," + children) : '') + ")";
	    }
	    // module transforms
	    for (var i = 0; i < state.transforms.length; i++) {
	      code = state.transforms[i](el, code);
	    }
	    return code
	  }
	}

	// hoist static sub-trees out
	function genStatic (el, state) {
	  el.staticProcessed = true;
	  state.staticRenderFns.push(("with(this){return " + (genElement(el, state)) + "}"));
	  return ("_m(" + (state.staticRenderFns.length - 1) + (el.staticInFor ? ',true' : '') + ")")
	}

	// v-once
	function genOnce (el, state) {
	  el.onceProcessed = true;
	  if (el.if && !el.ifProcessed) {
	    return genIf(el, state)
	  } else if (el.staticInFor) {
	    var key = '';
	    var parent = el.parent;
	    while (parent) {
	      if (parent.for) {
	        key = parent.key;
	        break
	      }
	      parent = parent.parent;
	    }
	    if (!key) {
	      state.warn(
	        "v-once can only be used inside v-for that is keyed. "
	      );
	      return genElement(el, state)
	    }
	    return ("_o(" + (genElement(el, state)) + "," + (state.onceId++) + "," + key + ")")
	  } else {
	    return genStatic(el, state)
	  }
	}

	function genIf (
	  el,
	  state,
	  altGen,
	  altEmpty
	) {
	  el.ifProcessed = true; // avoid recursion
	  return genIfConditions(el.ifConditions.slice(), state, altGen, altEmpty)
	}

	function genIfConditions (
	  conditions,
	  state,
	  altGen,
	  altEmpty
	) {
	  if (!conditions.length) {
	    return altEmpty || '_e()'
	  }

	  var condition = conditions.shift();
	  if (condition.exp) {
	    return ("(" + (condition.exp) + ")?" + (genTernaryExp(condition.block)) + ":" + (genIfConditions(conditions, state, altGen, altEmpty)))
	  } else {
	    return ("" + (genTernaryExp(condition.block)))
	  }

	  // v-if with v-once should generate code like (a)?_m(0):_m(1)
	  function genTernaryExp (el) {
	    return altGen
	      ? altGen(el, state)
	      : el.once
	        ? genOnce(el, state)
	        : genElement(el, state)
	  }
	}

	function genFor (
	  el,
	  state,
	  altGen,
	  altHelper
	) {
	  var exp = el.for;
	  var alias = el.alias;
	  var iterator1 = el.iterator1 ? ("," + (el.iterator1)) : '';
	  var iterator2 = el.iterator2 ? ("," + (el.iterator2)) : '';

	  if (state.maybeComponent(el) &&
	    el.tag !== 'slot' &&
	    el.tag !== 'template' &&
	    !el.key
	  ) {
	    state.warn(
	      "<" + (el.tag) + " v-for=\"" + alias + " in " + exp + "\">: component lists rendered with " +
	      "v-for should have explicit keys. " +
	      "See https://vuejs.org/guide/list.html#key for more info.",
	      true /* tip */
	    );
	  }

	  el.forProcessed = true; // avoid recursion
	  return (altHelper || '_l') + "((" + exp + ")," +
	    "function(" + alias + iterator1 + iterator2 + "){" +
	      "return " + ((altGen || genElement)(el, state)) +
	    '})'
	}

	function genData$2 (el, state) {
	  var data = '{';

	  // directives first.
	  // directives may mutate the el's other properties before they are generated.
	  var dirs = genDirectives(el, state);
	  if (dirs) { data += dirs + ','; }

	  // key
	  if (el.key) {
	    data += "key:" + (el.key) + ",";
	  }
	  // ref
	  if (el.ref) {
	    data += "ref:" + (el.ref) + ",";
	  }
	  if (el.refInFor) {
	    data += "refInFor:true,";
	  }
	  // pre
	  if (el.pre) {
	    data += "pre:true,";
	  }
	  // record original tag name for components using "is" attribute
	  if (el.component) {
	    data += "tag:\"" + (el.tag) + "\",";
	  }
	  // module data generation functions
	  for (var i = 0; i < state.dataGenFns.length; i++) {
	    data += state.dataGenFns[i](el);
	  }
	  // attributes
	  if (el.attrs) {
	    data += "attrs:{" + (genProps(el.attrs)) + "},";
	  }
	  // DOM props
	  if (el.props) {
	    data += "domProps:{" + (genProps(el.props)) + "},";
	  }
	  // event handlers
	  if (el.events) {
	    data += (genHandlers(el.events, false, state.warn)) + ",";
	  }
	  if (el.nativeEvents) {
	    data += (genHandlers(el.nativeEvents, true, state.warn)) + ",";
	  }
	  // slot target
	  // only for non-scoped slots
	  if (el.slotTarget && !el.slotScope) {
	    data += "slot:" + (el.slotTarget) + ",";
	  }
	  // scoped slots
	  if (el.scopedSlots) {
	    data += (genScopedSlots(el.scopedSlots, state)) + ",";
	  }
	  // component v-model
	  if (el.model) {
	    data += "model:{value:" + (el.model.value) + ",callback:" + (el.model.callback) + ",expression:" + (el.model.expression) + "},";
	  }
	  // inline-template
	  if (el.inlineTemplate) {
	    var inlineTemplate = genInlineTemplate(el, state);
	    if (inlineTemplate) {
	      data += inlineTemplate + ",";
	    }
	  }
	  data = data.replace(/,$/, '') + '}';
	  // v-bind data wrap
	  if (el.wrapData) {
	    data = el.wrapData(data);
	  }
	  // v-on data wrap
	  if (el.wrapListeners) {
	    data = el.wrapListeners(data);
	  }
	  return data
	}

	function genDirectives (el, state) {
	  var dirs = el.directives;
	  if (!dirs) { return }
	  var res = 'directives:[';
	  var hasRuntime = false;
	  var i, l, dir, needRuntime;
	  for (i = 0, l = dirs.length; i < l; i++) {
	    dir = dirs[i];
	    needRuntime = true;
	    var gen = state.directives[dir.name];
	    if (gen) {
	      // compile-time directive that manipulates AST.
	      // returns true if it also needs a runtime counterpart.
	      needRuntime = !!gen(el, dir, state.warn);
	    }
	    if (needRuntime) {
	      hasRuntime = true;
	      res += "{name:\"" + (dir.name) + "\",rawName:\"" + (dir.rawName) + "\"" + (dir.value ? (",value:(" + (dir.value) + "),expression:" + (JSON.stringify(dir.value))) : '') + (dir.arg ? (",arg:\"" + (dir.arg) + "\"") : '') + (dir.modifiers ? (",modifiers:" + (JSON.stringify(dir.modifiers))) : '') + "},";
	    }
	  }
	  if (hasRuntime) {
	    return res.slice(0, -1) + ']'
	  }
	}

	function genInlineTemplate (el, state) {
	  var ast = el.children[0];
	  if (el.children.length !== 1 || ast.type !== 1) {
	    state.warn('Inline-template components must have exactly one child element.');
	  }
	  if (ast.type === 1) {
	    var inlineRenderFns = generate(ast, state.options);
	    return ("inlineTemplate:{render:function(){" + (inlineRenderFns.render) + "},staticRenderFns:[" + (inlineRenderFns.staticRenderFns.map(function (code) { return ("function(){" + code + "}"); }).join(',')) + "]}")
	  }
	}

	function genScopedSlots (
	  slots,
	  state
	) {
	  return ("scopedSlots:_u([" + (Object.keys(slots).map(function (key) {
	      return genScopedSlot(key, slots[key], state)
	    }).join(',')) + "])")
	}

	function genScopedSlot (
	  key,
	  el,
	  state
	) {
	  if (el.for && !el.forProcessed) {
	    return genForScopedSlot(key, el, state)
	  }
	  var fn = "function(" + (String(el.slotScope)) + "){" +
	    "return " + (el.tag === 'template'
	      ? el.if
	        ? ((el.if) + "?" + (genChildren(el, state) || 'undefined') + ":undefined")
	        : genChildren(el, state) || 'undefined'
	      : genElement(el, state)) + "}";
	  return ("{key:" + key + ",fn:" + fn + "}")
	}

	function genForScopedSlot (
	  key,
	  el,
	  state
	) {
	  var exp = el.for;
	  var alias = el.alias;
	  var iterator1 = el.iterator1 ? ("," + (el.iterator1)) : '';
	  var iterator2 = el.iterator2 ? ("," + (el.iterator2)) : '';
	  el.forProcessed = true; // avoid recursion
	  return "_l((" + exp + ")," +
	    "function(" + alias + iterator1 + iterator2 + "){" +
	      "return " + (genScopedSlot(key, el, state)) +
	    '})'
	}

	function genChildren (
	  el,
	  state,
	  checkSkip,
	  altGenElement,
	  altGenNode
	) {
	  var children = el.children;
	  if (children.length) {
	    var el$1 = children[0];
	    // optimize single v-for
	    if (children.length === 1 &&
	      el$1.for &&
	      el$1.tag !== 'template' &&
	      el$1.tag !== 'slot'
	    ) {
	      return (altGenElement || genElement)(el$1, state)
	    }
	    var normalizationType = checkSkip
	      ? getNormalizationType(children, state.maybeComponent)
	      : 0;
	    var gen = altGenNode || genNode;
	    return ("[" + (children.map(function (c) { return gen(c, state); }).join(',')) + "]" + (normalizationType ? ("," + normalizationType) : ''))
	  }
	}

	// determine the normalization needed for the children array.
	// 0: no normalization needed
	// 1: simple normalization needed (possible 1-level deep nested array)
	// 2: full normalization needed
	function getNormalizationType (
	  children,
	  maybeComponent
	) {
	  var res = 0;
	  for (var i = 0; i < children.length; i++) {
	    var el = children[i];
	    if (el.type !== 1) {
	      continue
	    }
	    if (needsNormalization(el) ||
	        (el.ifConditions && el.ifConditions.some(function (c) { return needsNormalization(c.block); }))) {
	      res = 2;
	      break
	    }
	    if (maybeComponent(el) ||
	        (el.ifConditions && el.ifConditions.some(function (c) { return maybeComponent(c.block); }))) {
	      res = 1;
	    }
	  }
	  return res
	}

	function needsNormalization (el) {
	  return el.for !== undefined || el.tag === 'template' || el.tag === 'slot'
	}

	function genNode (node, state) {
	  if (node.type === 1) {
	    return genElement(node, state)
	  } if (node.type === 3 && node.isComment) {
	    return genComment(node)
	  } else {
	    return genText(node)
	  }
	}

	function genText (text) {
	  return ("_v(" + (text.type === 2
	    ? text.expression // no need for () because already wrapped in _s()
	    : transformSpecialNewlines(JSON.stringify(text.text))) + ")")
	}

	function genComment (comment) {
	  return ("_e(" + (JSON.stringify(comment.text)) + ")")
	}

	function genSlot (el, state) {
	  var slotName = el.slotName || '"default"';
	  var children = genChildren(el, state);
	  var res = "_t(" + slotName + (children ? ("," + children) : '');
	  var attrs = el.attrs && ("{" + (el.attrs.map(function (a) { return ((camelize(a.name)) + ":" + (a.value)); }).join(',')) + "}");
	  var bind$$1 = el.attrsMap['v-bind'];
	  if ((attrs || bind$$1) && !children) {
	    res += ",null";
	  }
	  if (attrs) {
	    res += "," + attrs;
	  }
	  if (bind$$1) {
	    res += (attrs ? '' : ',null') + "," + bind$$1;
	  }
	  return res + ')'
	}

	// componentName is el.component, take it as argument to shun flow's pessimistic refinement
	function genComponent (
	  componentName,
	  el,
	  state
	) {
	  var children = el.inlineTemplate ? null : genChildren(el, state, true);
	  return ("_c(" + componentName + "," + (genData$2(el, state)) + (children ? ("," + children) : '') + ")")
	}

	function genProps (props) {
	  var res = '';
	  for (var i = 0; i < props.length; i++) {
	    var prop = props[i];
	    /* istanbul ignore if */
	    {
	      res += "\"" + (prop.name) + "\":" + (transformSpecialNewlines(prop.value)) + ",";
	    }
	  }
	  return res.slice(0, -1)
	}

	// #3895, #4268
	function transformSpecialNewlines (text) {
	  return text
	    .replace(/\u2028/g, '\\u2028')
	    .replace(/\u2029/g, '\\u2029')
	}

	/*  */

	// these keywords should not appear inside expressions, but operators like
	// typeof, instanceof and in are allowed
	var prohibitedKeywordRE = new RegExp('\\b' + (
	  'do,if,for,let,new,try,var,case,else,with,await,break,catch,class,const,' +
	  'super,throw,while,yield,delete,export,import,return,switch,default,' +
	  'extends,finally,continue,debugger,function,arguments'
	).split(',').join('\\b|\\b') + '\\b');

	// these unary operators should not be used as property/method names
	var unaryOperatorsRE = new RegExp('\\b' + (
	  'delete,typeof,void'
	).split(',').join('\\s*\\([^\\)]*\\)|\\b') + '\\s*\\([^\\)]*\\)');

	// strip strings in expressions
	var stripStringRE = /'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*\$\{|\}(?:[^`\\]|\\.)*`|`(?:[^`\\]|\\.)*`/g;

	// detect problematic expressions in a template
	function detectErrors (ast) {
	  var errors = [];
	  if (ast) {
	    checkNode(ast, errors);
	  }
	  return errors
	}

	function checkNode (node, errors) {
	  if (node.type === 1) {
	    for (var name in node.attrsMap) {
	      if (dirRE.test(name)) {
	        var value = node.attrsMap[name];
	        if (value) {
	          if (name === 'v-for') {
	            checkFor(node, ("v-for=\"" + value + "\""), errors);
	          } else if (onRE.test(name)) {
	            checkEvent(value, (name + "=\"" + value + "\""), errors);
	          } else {
	            checkExpression(value, (name + "=\"" + value + "\""), errors);
	          }
	        }
	      }
	    }
	    if (node.children) {
	      for (var i = 0; i < node.children.length; i++) {
	        checkNode(node.children[i], errors);
	      }
	    }
	  } else if (node.type === 2) {
	    checkExpression(node.expression, node.text, errors);
	  }
	}

	function checkEvent (exp, text, errors) {
	  var stipped = exp.replace(stripStringRE, '');
	  var keywordMatch = stipped.match(unaryOperatorsRE);
	  if (keywordMatch && stipped.charAt(keywordMatch.index - 1) !== '$') {
	    errors.push(
	      "avoid using JavaScript unary operator as property name: " +
	      "\"" + (keywordMatch[0]) + "\" in expression " + (text.trim())
	    );
	  }
	  checkExpression(exp, text, errors);
	}

	function checkFor (node, text, errors) {
	  checkExpression(node.for || '', text, errors);
	  checkIdentifier(node.alias, 'v-for alias', text, errors);
	  checkIdentifier(node.iterator1, 'v-for iterator', text, errors);
	  checkIdentifier(node.iterator2, 'v-for iterator', text, errors);
	}

	function checkIdentifier (
	  ident,
	  type,
	  text,
	  errors
	) {
	  if (typeof ident === 'string') {
	    try {
	      new Function(("var " + ident + "=_"));
	    } catch (e) {
	      errors.push(("invalid " + type + " \"" + ident + "\" in expression: " + (text.trim())));
	    }
	  }
	}

	function checkExpression (exp, text, errors) {
	  try {
	    new Function(("return " + exp));
	  } catch (e) {
	    var keywordMatch = exp.replace(stripStringRE, '').match(prohibitedKeywordRE);
	    if (keywordMatch) {
	      errors.push(
	        "avoid using JavaScript keyword as property name: " +
	        "\"" + (keywordMatch[0]) + "\"\n  Raw expression: " + (text.trim())
	      );
	    } else {
	      errors.push(
	        "invalid expression: " + (e.message) + " in\n\n" +
	        "    " + exp + "\n\n" +
	        "  Raw expression: " + (text.trim()) + "\n"
	      );
	    }
	  }
	}

	/*  */

	function createFunction (code, errors) {
	  try {
	    return new Function(code)
	  } catch (err) {
	    errors.push({ err: err, code: code });
	    return noop
	  }
	}

	function createCompileToFunctionFn (compile) {
	  var cache = Object.create(null);

	  return function compileToFunctions (
	    template,
	    options,
	    vm
	  ) {
	    options = extend({}, options);
	    var warn$$1 = options.warn || warn;
	    delete options.warn;

	    /* istanbul ignore if */
	    {
	      // detect possible CSP restriction
	      try {
	        new Function('return 1');
	      } catch (e) {
	        if (e.toString().match(/unsafe-eval|CSP/)) {
	          warn$$1(
	            'It seems you are using the standalone build of Vue.js in an ' +
	            'environment with Content Security Policy that prohibits unsafe-eval. ' +
	            'The template compiler cannot work in this environment. Consider ' +
	            'relaxing the policy to allow unsafe-eval or pre-compiling your ' +
	            'templates into render functions.'
	          );
	        }
	      }
	    }

	    // check cache
	    var key = options.delimiters
	      ? String(options.delimiters) + template
	      : template;
	    if (cache[key]) {
	      return cache[key]
	    }

	    // compile
	    var compiled = compile(template, options);

	    // check compilation errors/tips
	    {
	      if (compiled.errors && compiled.errors.length) {
	        warn$$1(
	          "Error compiling template:\n\n" + template + "\n\n" +
	          compiled.errors.map(function (e) { return ("- " + e); }).join('\n') + '\n',
	          vm
	        );
	      }
	      if (compiled.tips && compiled.tips.length) {
	        compiled.tips.forEach(function (msg) { return tip(msg, vm); });
	      }
	    }

	    // turn code into functions
	    var res = {};
	    var fnGenErrors = [];
	    res.render = createFunction(compiled.render, fnGenErrors);
	    res.staticRenderFns = compiled.staticRenderFns.map(function (code) {
	      return createFunction(code, fnGenErrors)
	    });

	    // check function generation errors.
	    // this should only happen if there is a bug in the compiler itself.
	    // mostly for codegen development use
	    /* istanbul ignore if */
	    {
	      if ((!compiled.errors || !compiled.errors.length) && fnGenErrors.length) {
	        warn$$1(
	          "Failed to generate render function:\n\n" +
	          fnGenErrors.map(function (ref) {
	            var err = ref.err;
	            var code = ref.code;

	            return ((err.toString()) + " in\n\n" + code + "\n");
	        }).join('\n'),
	          vm
	        );
	      }
	    }

	    return (cache[key] = res)
	  }
	}

	/*  */

	function createCompilerCreator (baseCompile) {
	  return function createCompiler (baseOptions) {
	    function compile (
	      template,
	      options
	    ) {
	      var finalOptions = Object.create(baseOptions);
	      var errors = [];
	      var tips = [];
	      finalOptions.warn = function (msg, tip) {
	        (tip ? tips : errors).push(msg);
	      };

	      if (options) {
	        // merge custom modules
	        if (options.modules) {
	          finalOptions.modules =
	            (baseOptions.modules || []).concat(options.modules);
	        }
	        // merge custom directives
	        if (options.directives) {
	          finalOptions.directives = extend(
	            Object.create(baseOptions.directives || null),
	            options.directives
	          );
	        }
	        // copy other options
	        for (var key in options) {
	          if (key !== 'modules' && key !== 'directives') {
	            finalOptions[key] = options[key];
	          }
	        }
	      }

	      var compiled = baseCompile(template, finalOptions);
	      {
	        errors.push.apply(errors, detectErrors(compiled.ast));
	      }
	      compiled.errors = errors;
	      compiled.tips = tips;
	      return compiled
	    }

	    return {
	      compile: compile,
	      compileToFunctions: createCompileToFunctionFn(compile)
	    }
	  }
	}

	/*  */

	// `createCompilerCreator` allows creating compilers that use alternative
	// parser/optimizer/codegen, e.g the SSR optimizing compiler.
	// Here we just export a default compiler using the default parts.
	var createCompiler = createCompilerCreator(function baseCompile (
	  template,
	  options
	) {
	  var ast = parse(template.trim(), options);
	  if (options.optimize !== false) {
	    optimize(ast, options);
	  }
	  var code = generate(ast, options);
	  return {
	    ast: ast,
	    render: code.render,
	    staticRenderFns: code.staticRenderFns
	  }
	});

	/*  */

	var ref = createCompiler(baseOptions);
	var compile = ref.compile;
	var compileToFunctions = ref.compileToFunctions;

	/*  */

	var isAttr = makeMap(
	  'accept,accept-charset,accesskey,action,align,alt,async,autocomplete,' +
	  'autofocus,autoplay,autosave,bgcolor,border,buffered,challenge,charset,' +
	  'checked,cite,class,code,codebase,color,cols,colspan,content,http-equiv,' +
	  'name,contenteditable,contextmenu,controls,coords,data,datetime,default,' +
	  'defer,dir,dirname,disabled,download,draggable,dropzone,enctype,method,for,' +
	  'form,formaction,headers,height,hidden,high,href,hreflang,http-equiv,' +
	  'icon,id,ismap,itemprop,keytype,kind,label,lang,language,list,loop,low,' +
	  'manifest,max,maxlength,media,method,GET,POST,min,multiple,email,file,' +
	  'muted,name,novalidate,open,optimum,pattern,ping,placeholder,poster,' +
	  'preload,radiogroup,readonly,rel,required,reversed,rows,rowspan,sandbox,' +
	  'scope,scoped,seamless,selected,shape,size,type,text,password,sizes,span,' +
	  'spellcheck,src,srcdoc,srclang,srcset,start,step,style,summary,tabindex,' +
	  'target,title,type,usemap,value,width,wrap'
	);



	/* istanbul ignore next */
	var isRenderableAttr = function (name) {
	  return (
	    isAttr(name) ||
	    name.indexOf('data-') === 0 ||
	    name.indexOf('aria-') === 0
	  )
	};
	var propsToAttrMap = {
	  acceptCharset: 'accept-charset',
	  className: 'class',
	  htmlFor: 'for',
	  httpEquiv: 'http-equiv'
	};

	var ESC = {
	  '<': '&lt;',
	  '>': '&gt;',
	  '"': '&quot;',
	  '&': '&amp;'
	};

	function escape (s) {
	  return s.replace(/[<>"&]/g, escapeChar)
	}

	function escapeChar (a) {
	  return ESC[a] || a
	}

	/*  */

	var plainStringRE = /^"(?:[^"\\]|\\.)*"$|^'(?:[^'\\]|\\.)*'$/;

	// let the model AST transform translate v-model into appropriate
	// props bindings
	function applyModelTransform (el, state) {
	  if (el.directives) {
	    for (var i = 0; i < el.directives.length; i++) {
	      var dir = el.directives[i];
	      if (dir.name === 'model') {
	        state.directives.model(el, dir, state.warn);
	        // remove value for textarea as its converted to text
	        if (el.tag === 'textarea' && el.props) {
	          el.props = el.props.filter(function (p) { return p.name !== 'value'; });
	        }
	        break
	      }
	    }
	  }
	}

	function genAttrSegments (
	  attrs
	) {
	  return attrs.map(function (ref) {
	    var name = ref.name;
	    var value = ref.value;

	    return genAttrSegment(name, value);
	  })
	}

	function genDOMPropSegments (
	  props,
	  attrs
	) {
	  var segments = [];
	  props.forEach(function (ref) {
	    var name = ref.name;
	    var value = ref.value;

	    name = propsToAttrMap[name] || name.toLowerCase();
	    if (isRenderableAttr(name) &&
	      !(attrs && attrs.some(function (a) { return a.name === name; }))
	    ) {
	      segments.push(genAttrSegment(name, value));
	    }
	  });
	  return segments
	}

	function genAttrSegment (name, value) {
	  if (plainStringRE.test(value)) {
	    // force double quote
	    value = value.replace(/^'|'$/g, '"');
	    // force enumerated attr to "true"
	    if (isEnumeratedAttr(name) && value !== "\"false\"") {
	      value = "\"true\"";
	    }
	    return {
	      type: RAW,
	      value: isBooleanAttr(name)
	        ? (" " + name + "=\"" + name + "\"")
	        : value === '""'
	          ? (" " + name)
	          : (" " + name + "=\"" + (JSON.parse(value)) + "\"")
	    }
	  } else {
	    return {
	      type: EXPRESSION,
	      value: ("_ssrAttr(" + (JSON.stringify(name)) + "," + value + ")")
	    }
	  }
	}

	function genClassSegments (
	  staticClass,
	  classBinding
	) {
	  if (staticClass && !classBinding) {
	    return [{ type: RAW, value: (" class=" + staticClass) }]
	  } else {
	    return [{
	      type: EXPRESSION,
	      value: ("_ssrClass(" + (staticClass || 'null') + "," + (classBinding || 'null') + ")")
	    }]
	  }
	}

	function genStyleSegments (
	  staticStyle,
	  parsedStaticStyle,
	  styleBinding,
	  vShowExpression
	) {
	  if (staticStyle && !styleBinding && !vShowExpression) {
	    return [{ type: RAW, value: (" style=" + (JSON.stringify(staticStyle))) }]
	  } else {
	    return [{
	      type: EXPRESSION,
	      value: ("_ssrStyle(" + (parsedStaticStyle || 'null') + "," + (styleBinding || 'null') + ", " + (vShowExpression
	          ? ("{ display: (" + vShowExpression + ") ? '' : 'none' }")
	          : 'null') + ")")
	    }]
	  }
	}

	/*  */

	/**
	 * In SSR, the vdom tree is generated only once and never patched, so
	 * we can optimize most element / trees into plain string render functions.
	 * The SSR optimizer walks the AST tree to detect optimizable elements and trees.
	 *
	 * The criteria for SSR optimizability is quite a bit looser than static tree
	 * detection (which is designed for client re-render). In SSR we bail only for
	 * components/slots/custom directives.
	 */

	// optimizability constants
	var optimizability = {
	  FALSE: 0,    // whole sub tree un-optimizable
	  FULL: 1,     // whole sub tree optimizable
	  SELF: 2,     // self optimizable but has some un-optimizable children
	  CHILDREN: 3, // self un-optimizable but have fully optimizable children
	  PARTIAL: 4   // self un-optimizable with some un-optimizable children
	};

	var isPlatformReservedTag$1;

	function optimize$1 (root, options) {
	  if (!root) { return }
	  isPlatformReservedTag$1 = options.isReservedTag || no;
	  walk(root, true);
	}

	function walk (node, isRoot) {
	  if (isUnOptimizableTree(node)) {
	    node.ssrOptimizability = optimizability.FALSE;
	    return
	  }
	  // root node or nodes with custom directives should always be a VNode
	  var selfUnoptimizable = isRoot || hasCustomDirective(node);
	  var check = function (child) {
	    if (child.ssrOptimizability !== optimizability.FULL) {
	      node.ssrOptimizability = selfUnoptimizable
	        ? optimizability.PARTIAL
	        : optimizability.SELF;
	    }
	  };
	  if (selfUnoptimizable) {
	    node.ssrOptimizability = optimizability.CHILDREN;
	  }
	  if (node.type === 1) {
	    for (var i = 0, l = node.children.length; i < l; i++) {
	      var child = node.children[i];
	      walk(child);
	      check(child);
	    }
	    if (node.ifConditions) {
	      for (var i$1 = 1, l$1 = node.ifConditions.length; i$1 < l$1; i$1++) {
	        var block = node.ifConditions[i$1].block;
	        walk(block, isRoot);
	        check(block);
	      }
	    }
	    if (node.ssrOptimizability == null ||
	      (!isRoot && (node.attrsMap['v-html'] || node.attrsMap['v-text']))
	    ) {
	      node.ssrOptimizability = optimizability.FULL;
	    } else {
	      node.children = optimizeSiblings(node);
	    }
	  } else {
	    node.ssrOptimizability = optimizability.FULL;
	  }
	}

	function optimizeSiblings (el) {
	  var children = el.children;
	  var optimizedChildren = [];

	  var currentOptimizableGroup = [];
	  var pushGroup = function () {
	    if (currentOptimizableGroup.length) {
	      optimizedChildren.push({
	        type: 1,
	        parent: el,
	        tag: 'template',
	        attrsList: [],
	        attrsMap: {},
	        children: currentOptimizableGroup,
	        ssrOptimizability: optimizability.FULL
	      });
	    }
	    currentOptimizableGroup = [];
	  };

	  for (var i = 0; i < children.length; i++) {
	    var c = children[i];
	    if (c.ssrOptimizability === optimizability.FULL) {
	      currentOptimizableGroup.push(c);
	    } else {
	      // wrap fully-optimizable adjacent siblings inside a template tag
	      // so that they can be optimized into a single ssrNode by codegen
	      pushGroup();
	      optimizedChildren.push(c);
	    }
	  }
	  pushGroup();
	  return optimizedChildren
	}

	function isUnOptimizableTree (node) {
	  if (node.type === 2 || node.type === 3) { // text or expression
	    return false
	  }
	  return (
	    isBuiltInTag(node.tag) || // built-in (slot, component)
	    !isPlatformReservedTag$1(node.tag) || // custom component
	    !!node.component || // "is" component
	    isSelectWithModel(node) // <select v-model> requires runtime inspection
	  )
	}

	var isBuiltInDir = makeMap('text,html,show,on,bind,model,pre,cloak,once');

	function hasCustomDirective (node) {
	  return (
	    node.type === 1 &&
	    node.directives &&
	    node.directives.some(function (d) { return !isBuiltInDir(d.name); })
	  )
	}

	// <select v-model> cannot be optimized because it requires a runtime check
	// to determine proper selected option
	function isSelectWithModel (node) {
	  return (
	    node.type === 1 &&
	    node.tag === 'select' &&
	    node.directives != null &&
	    node.directives.some(function (d) { return d.name === 'model'; })
	  )
	}

	/*  */

	// The SSR codegen is essentially extending the default codegen to handle
	// SSR-optimizable nodes and turn them into string render fns. In cases where
	// a node is not optimizable it simply falls back to the default codegen.

	// segment types
	var RAW = 0;
	var INTERPOLATION = 1;
	var EXPRESSION = 2;

	function generate$1 (
	  ast,
	  options
	) {
	  var state = new CodegenState(options);
	  var code = ast ? genSSRElement(ast, state) : '_c("div")';
	  return {
	    render: ("with(this){return " + code + "}"),
	    staticRenderFns: state.staticRenderFns
	  }
	}

	function genSSRElement (el, state) {
	  if (el.for && !el.forProcessed) {
	    return genFor(el, state, genSSRElement)
	  } else if (el.if && !el.ifProcessed) {
	    return genIf(el, state, genSSRElement)
	  } else if (el.tag === 'template' && !el.slotTarget) {
	    return el.ssrOptimizability === optimizability.FULL
	      ? genChildrenAsStringNode(el, state)
	      : genSSRChildren(el, state) || 'void 0'
	  }

	  switch (el.ssrOptimizability) {
	    case optimizability.FULL:
	      // stringify whole tree
	      return genStringElement(el, state)
	    case optimizability.SELF:
	      // stringify self and check children
	      return genStringElementWithChildren(el, state)
	    case optimizability.CHILDREN:
	      // generate self as VNode and stringify children
	      return genNormalElement(el, state, true)
	    case optimizability.PARTIAL:
	      // generate self as VNode and check children
	      return genNormalElement(el, state, false)
	    default:
	      // bail whole tree
	      return genElement(el, state)
	  }
	}

	function genNormalElement (el, state, stringifyChildren) {
	  var data = el.plain ? undefined : genData$2(el, state);
	  var children = stringifyChildren
	    ? ("[" + (genChildrenAsStringNode(el, state)) + "]")
	    : genSSRChildren(el, state, true);
	  return ("_c('" + (el.tag) + "'" + (data ? ("," + data) : '') + (children ? ("," + children) : '') + ")")
	}

	function genSSRChildren (el, state, checkSkip) {
	  return genChildren(el, state, checkSkip, genSSRElement, genSSRNode)
	}

	function genSSRNode (el, state) {
	  return el.type === 1
	    ? genSSRElement(el, state)
	    : genText(el)
	}

	function genChildrenAsStringNode (el, state) {
	  return el.children.length
	    ? ("_ssrNode(" + (flattenSegments(childrenToSegments(el, state))) + ")")
	    : ''
	}

	function genStringElement (el, state) {
	  return ("_ssrNode(" + (elementToString(el, state)) + ")")
	}

	function genStringElementWithChildren (el, state) {
	  var children = genSSRChildren(el, state, true);
	  return ("_ssrNode(" + (flattenSegments(elementToOpenTagSegments(el, state))) + ",\"</" + (el.tag) + ">\"" + (children ? ("," + children) : '') + ")")
	}

	function elementToString (el, state) {
	  return ("(" + (flattenSegments(elementToSegments(el, state))) + ")")
	}

	function elementToSegments (el, state) {
	  // v-for / v-if
	  if (el.for && !el.forProcessed) {
	    el.forProcessed = true;
	    return [{
	      type: EXPRESSION,
	      value: genFor(el, state, elementToString, '_ssrList')
	    }]
	  } else if (el.if && !el.ifProcessed) {
	    el.ifProcessed = true;
	    return [{
	      type: EXPRESSION,
	      value: genIf(el, state, elementToString, '"<!---->"')
	    }]
	  } else if (el.tag === 'template') {
	    return childrenToSegments(el, state)
	  }

	  var openSegments = elementToOpenTagSegments(el, state);
	  var childrenSegments = childrenToSegments(el, state);
	  var ref = state.options;
	  var isUnaryTag = ref.isUnaryTag;
	  var close = (isUnaryTag && isUnaryTag(el.tag))
	    ? []
	    : [{ type: RAW, value: ("</" + (el.tag) + ">") }];
	  return openSegments.concat(childrenSegments, close)
	}

	function elementToOpenTagSegments (el, state) {
	  applyModelTransform(el, state);
	  var binding;
	  var segments = [{ type: RAW, value: ("<" + (el.tag)) }];
	  // attrs
	  if (el.attrs) {
	    segments.push.apply(segments, genAttrSegments(el.attrs));
	  }
	  // domProps
	  if (el.props) {
	    segments.push.apply(segments, genDOMPropSegments(el.props, el.attrs));
	  }
	  // v-bind="object"
	  if ((binding = el.attrsMap['v-bind'])) {
	    segments.push({ type: EXPRESSION, value: ("_ssrAttrs(" + binding + ")") });
	  }
	  // v-bind.prop="object"
	  if ((binding = el.attrsMap['v-bind.prop'])) {
	    segments.push({ type: EXPRESSION, value: ("_ssrDOMProps(" + binding + ")") });
	  }
	  // class
	  if (el.staticClass || el.classBinding) {
	    segments.push.apply(
	      segments,
	      genClassSegments(el.staticClass, el.classBinding)
	    );
	  }
	  // style & v-show
	  if (el.staticStyle || el.styleBinding || el.attrsMap['v-show']) {
	    segments.push.apply(
	      segments,
	      genStyleSegments(
	        el.attrsMap.style,
	        el.staticStyle,
	        el.styleBinding,
	        el.attrsMap['v-show']
	      )
	    );
	  }
	  // _scopedId
	  if (state.options.scopeId) {
	    segments.push({ type: RAW, value: (" " + (state.options.scopeId)) });
	  }
	  segments.push({ type: RAW, value: ">" });
	  return segments
	}

	function childrenToSegments (el, state) {
	  var binding;
	  if ((binding = el.attrsMap['v-html'])) {
	    return [{ type: EXPRESSION, value: ("_s(" + binding + ")") }]
	  }
	  if ((binding = el.attrsMap['v-text'])) {
	    return [{ type: INTERPOLATION, value: ("_s(" + binding + ")") }]
	  }
	  if (el.tag === 'textarea' && (binding = el.attrsMap['v-model'])) {
	    return [{ type: INTERPOLATION, value: ("_s(" + binding + ")") }]
	  }
	  return el.children
	    ? nodesToSegments(el.children, state)
	    : []
	}

	function nodesToSegments (
	  children,
	  state
	) {
	  var segments = [];
	  for (var i = 0; i < children.length; i++) {
	    var c = children[i];
	    if (c.type === 1) {
	      segments.push.apply(segments, elementToSegments(c, state));
	    } else if (c.type === 2) {
	      segments.push({ type: INTERPOLATION, value: c.expression });
	    } else if (c.type === 3) {
	      segments.push({ type: RAW, value: escape(c.text) });
	    }
	  }
	  return segments
	}

	function flattenSegments (segments) {
	  var mergedSegments = [];
	  var textBuffer = '';

	  var pushBuffer = function () {
	    if (textBuffer) {
	      mergedSegments.push(JSON.stringify(textBuffer));
	      textBuffer = '';
	    }
	  };

	  for (var i = 0; i < segments.length; i++) {
	    var s = segments[i];
	    if (s.type === RAW) {
	      textBuffer += s.value;
	    } else if (s.type === INTERPOLATION) {
	      pushBuffer();
	      mergedSegments.push(("_ssrEscape(" + (s.value) + ")"));
	    } else if (s.type === EXPRESSION) {
	      pushBuffer();
	      mergedSegments.push(("(" + (s.value) + ")"));
	    }
	  }
	  pushBuffer();

	  return mergedSegments.join('+')
	}

	/*  */

	var createCompiler$1 = createCompilerCreator(function baseCompile (
	  template,
	  options
	) {
	  var ast = parse(template.trim(), options);
	  optimize$1(ast, options);
	  var code = generate$1(ast, options);
	  return {
	    ast: ast,
	    render: code.render,
	    staticRenderFns: code.staticRenderFns
	  }
	});

	/*  */

	var ref$1 = createCompiler$1(baseOptions);
	var compile$1 = ref$1.compile;
	var compileToFunctions$1 = ref$1.compileToFunctions;

	/*  */

	exports.parseComponent = parseComponent;
	exports.compile = compile;
	exports.compileToFunctions = compileToFunctions;
	exports.ssrCompile = compile$1;
	exports.ssrCompileToFunctions = compileToFunctions$1;

	Object.defineProperty(exports, '__esModule', { value: true });

	})));
	});

	unwrapExports(browser);
	var browser_1 = browser.parseComponent;

	//

	var script$2 = {
	  name: 'vuep',
	  components: {
	    Editor: Editor,
	    Preview: Preview,
	    
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

	  mounted: function mounted(){


	      //
	      //for(var i in this.layoutConfig){

	      //}
	      this.initialized = true;


	  },
	 created: function created(){
	     this.code_html  = document.getElementById(this.elInputHtml).value;
	     this.code_css  = document.getElementById(this.elInputCss).value;
	     this.code_js  = document.getElementById(this.elInputJs).value;
	    

	    if(this.layout == null || this.layout.length == 0)
	        { this.layout = [   
	          {"x":0,"y":3,"w":5,"h":2,"i":"0", "mode": "html", "elementName": this.elInputHtml},
	          {"x":5,"y":3,"w":5,"h":2,"i":"1",  "mode": "js", "elementName": this.elInputJs},
	          {"x":10,"y":3,"w":2,"h":2,"i":"2",  "mode": "css", "elementName": this.elInputCss},
	          {"x":0,"y":0,"w":12,"h":3,"i":"3",  "mode": "preview"} ]; }



	  },

	  data: function () { return ({
	    initialized: false,
	    preview: '',
	    code: '',
	    code_html : '',
	    code_js: '',
	    code_css: '',
	    layoutConfig: []
	  }); },

	  methods: {
	      layoutUpdatedEvent: function(newLayout){
	        //console.log("Updated layout: ", newLayout)
	        if(this.$bus != null){
	          this.$bus.$emit('layout-updated-event', newLayout);
	        }
	      },
	      change: function change(code, mode){
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
	      changeHtml: function changeHtml(code) {
	        this.code_html = code;
	        document.getElementById(this.elInputHtml).value = code; //Atualiza o input hidden tbm
	        this.compile();

	      },
	      changeCss: function changeCss(code) {
	        this.code_css = code;
	        document.getElementById(this.elInputCss).value = code; //Atualiza o input hidden tbm
	        this.compile();

	      },
	      changeJs: function changeJs(code) {
	        this.code_js = code;
	        document.getElementById(this.elInputJs).value = code; //Atualiza o input hidden tbm
	        this.compile();

	      },
	    compile: function compile() {
	   
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
	              function (App) {
	                var component =     new Vue({
	                  render: function (h) { return h(App); },
	                }).$mount();

	                if(innerDoc.body != null){ //<Ja carregou todo o iframe

	                  innerDoc.body.innerHTML = "";
	                  innerDoc.body.appendChild(component.$el);
	                }

	            }
	        );


	        }

	        return;
	    }




	  }
	};

	/* script */
	            var __vue_script__$2 = script$2;
	            
	/* template */
	var __vue_render__$2 = function() {
	  var _vm = this;
	  var _h = _vm.$createElement;
	  var _c = _vm._self._c || _h;
	  return _c("section", { staticClass: "app" }, [
	    _vm._e(),
	    _vm._v(" "),
	    _c(
	      "main",
	      { staticClass: "main" },
	      [
	        _c(
	          "grid-layout",
	          {
	            attrs: {
	              layout: _vm.layout,
	              "col-num": 12,
	              "row-height": 100,
	              "is-draggable": true,
	              "is-resizable": true,
	              "is-mirrored": false,
	              "vertical-compact": false,
	              margin: [10, 10],
	              "use-css-transforms": false
	            },
	            on: { "layout-updated": _vm.layoutUpdatedEvent }
	          },
	          _vm._l(_vm.layout, function(item) {
	            return _c(
	              "grid-item",
	              {
	                key: item.i,
	                attrs: {
	                  x: item.x,
	                  y: item.y,
	                  w: item.w,
	                  h: item.h,
	                  i: item.i,
	                  "drag-ignore-from": ".CodeMirror"
	                }
	              },
	              [
	                item["mode"] != "preview"
	                  ? _c("editor", {
	                      staticClass: "panel",
	                      attrs: {
	                        data: item,
	                        mode: item.mode,
	                        "element-name": item["elementName"],
	                        label: item["mode"]
	                      },
	                      on: {
	                        change: function($event) {
	                          _vm.change($event, item["mode"]);
	                        }
	                      }
	                    })
	                  : _vm._e(),
	                _vm._v(" "),
	                item["mode"] == "preview"
	                  ? _c("preview", {
	                      staticClass: "panel",
	                      attrs: {
	                        value: _vm.preview,
	                        iframe: _vm.iframe,
	                        complexPreviewUrl: _vm.complexPreviewUrl
	                      }
	                    })
	                  : _vm._e()
	              ],
	              1
	            )
	          })
	        )
	      ],
	      1
	    )
	  ])
	};
	var __vue_staticRenderFns__$2 = [
	  function() {
	    var _vm = this;
	    var _h = _vm.$createElement;
	    var _c = _vm._self._c || _h;
	    return _c("ul", { staticClass: "list" }, [
	      _c("li", [
	        _c(
	          "a",
	          {
	            attrs: {
	              target: "_blank",
	              href: "//github.com/qingwei-li/vuep.run"
	            }
	          },
	          [_vm._v("GitHub")]
	        )
	      ])
	    ])
	  }
	];
	__vue_render__$2._withStripped = true;

	  /* style */
	  var __vue_inject_styles__$2 = function (inject) {
	    if (!inject) { return }
	    inject("data-v-4a56685f_0", { source: "\n.main {\n  display: flex;\n}\n.vue-grid-layout {\n  width: 100%;\n}\n.vue-grid-layout .panel {\n  height: 100%;\n  padding-top: 20px;\n}\n", map: {"version":3,"sources":["D:\\Users\\eu\\Dropbox\\EasyPHP-5.3.6.0\\www\\vuep/D:\\Users\\eu\\Dropbox\\EasyPHP-5.3.6.0\\www\\vuep/D:\\Users\\eu\\Dropbox\\EasyPHP-5.3.6.0\\www\\vuep\\src\\components\\playground.vue","playground.vue"],"names":[],"mappings":";AA6MA;EACA,cAAA;CC5MC;AD8MD;EACA,YAAA;CC5MC;AD8MD;EACA,aAAA;EACA,kBAAA;CC5MC","file":"playground.vue","sourcesContent":[null,".main {\n  display: flex;\n}\n.vue-grid-layout {\n  width: 100%;\n}\n.vue-grid-layout .panel {\n  height: 100%;\n  padding-top: 20px;\n}\n"]}, media: undefined });

	  };
	  /* scoped */
	  var __vue_scope_id__$2 = undefined;
	  /* module identifier */
	  var __vue_module_identifier__$2 = undefined;
	  /* functional template */
	  var __vue_is_functional_template__$2 = false;
	  /* component normalizer */
	  function __vue_normalize__$2(
	    template, style, script,
	    scope, functional, moduleIdentifier,
	    createInjector, createInjectorSSR
	  ) {
	    var component = (typeof script === 'function' ? script.options : script) || {};

	    // For security concerns, we use only base name in production mode.
	    component.__file = "D:\\Users\\eu\\Dropbox\\EasyPHP-5.3.6.0\\www\\vuep\\src\\components\\playground.vue";

	    if (!component.render) {
	      component.render = template.render;
	      component.staticRenderFns = template.staticRenderFns;
	      component._compiled = true;

	      if (functional) { component.functional = true; }
	    }

	    component._scopeId = scope;

	    {
	      var hook;
	      if (style) {
	        hook = function(context) {
	          style.call(this, createInjector(context));
	        };
	      }

	      if (hook !== undefined) {
	        if (component.functional) {
	          // register for functional component in vue file
	          var originalRender = component.render;
	          component.render = function renderWithStyleInjection(h, context) {
	            hook.call(context);
	            return originalRender(h, context)
	          };
	        } else {
	          // inject component registration as beforeCreate hook
	          var existing = component.beforeCreate;
	          component.beforeCreate = existing ? [].concat(existing, hook) : [hook];
	        }
	      }
	    }

	    return component
	  }
	  /* style inject */
	  function __vue_create_injector__$1() {
	    var head = document.head || document.getElementsByTagName('head')[0];
	    var styles = __vue_create_injector__$1.styles || (__vue_create_injector__$1.styles = {});
	    var isOldIE =
	      typeof navigator !== 'undefined' &&
	      /msie [6-9]\\b/.test(navigator.userAgent.toLowerCase());

	    return function addStyle(id, css) {
	      if (document.querySelector('style[data-vue-ssr-id~="' + id + '"]')) { return } // SSR styles are present.

	      var group = isOldIE ? css.media || 'default' : id;
	      var style = styles[group] || (styles[group] = { ids: [], parts: [], element: undefined });

	      if (!style.ids.includes(id)) {
	        var code = css.source;
	        var index = style.ids.length;

	        style.ids.push(id);

	        if (isOldIE) {
	          style.element = style.element || document.querySelector('style[data-group=' + group + ']');
	        }

	        if (!style.element) {
	          var el = style.element = document.createElement('style');
	          el.type = 'text/css';

	          if (css.media) { el.setAttribute('media', css.media); }
	          if (isOldIE) {
	            el.setAttribute('data-group', group);
	            el.setAttribute('data-next-index', '0');
	          }

	          head.appendChild(el);
	        }

	        if (isOldIE) {
	          index = parseInt(style.element.getAttribute('data-next-index'));
	          style.element.setAttribute('data-next-index', index + 1);
	        }

	        if (style.element.styleSheet) {
	          style.parts.push(code);
	          style.element.styleSheet.cssText = style.parts
	            .filter(Boolean)
	            .join('\n');
	        } else {
	          var textNode = document.createTextNode(code);
	          var nodes = style.element.childNodes;
	          if (nodes[index]) { style.element.removeChild(nodes[index]); }
	          if (nodes.length) { style.element.insertBefore(textNode, nodes[index]); }
	          else { style.element.appendChild(textNode); }
	        }
	      }
	    }
	  }
	  /* style inject SSR */
	  

	  
	  var Vuep = __vue_normalize__$2(
	    { render: __vue_render__$2, staticRenderFns: __vue_staticRenderFns__$2 },
	    __vue_inject_styles__$2,
	    __vue_script__$2,
	    __vue_scope_id__$2,
	    __vue_is_functional_template__$2,
	    __vue_module_identifier__$2,
	    __vue_create_injector__$1,
	    undefined
	  );

	var vueToasted_min = createCommonjsModule(function (module, exports) {
	!function(t,e){{ module.exports=e(); }}(commonjsGlobal,function(){return function(t){function e(r){if(n[r]){ return n[r].exports; }var i=n[r]={i:r,l:!1,exports:{}};return t[r].call(i.exports,i,i.exports,e),i.l=!0,i.exports}var n={};return e.m=t,e.c=n,e.i=function(t){return t},e.d=function(t,n,r){e.o(t,n)||Object.defineProperty(t,n,{configurable:!1,enumerable:!0,get:r});},e.n=function(t){var n=t&&t.__esModule?function(){return t.default}:function(){return t};return e.d(n,"a",n),n},e.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},e.p="/dist/",e(e.s=6)}([function(t,e,n){function r(){d=!1;}function i(t){if(!t){ return void(f!==m&&(f=m,r())); }if(t!==f){if(t.length!==m.length){ throw new Error("Custom alphabet for shortid must be "+m.length+" unique characters. You submitted "+t.length+" characters: "+t); }var e=t.split("").filter(function(t,e,n){return e!==n.lastIndexOf(t)});if(e.length){ throw new Error("Custom alphabet for shortid must be "+m.length+" unique characters. These characters were not unique: "+e.join(", ")); }f=t,r();}}function o(t){return i(t),f}function a(t){h.seed(t),p!==t&&(r(),p=t);}function s(){f||i(m);for(var t,e=f.split(""),n=[],r=h.nextValue();e.length>0;){ r=h.nextValue(),t=Math.floor(r*e.length),n.push(e.splice(t,1)[0]); }return n.join("")}function c(){return d||(d=s())}function u(t){return c()[t]}function l(){return f||m}var f,p,d,h=n(19),m="0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-";t.exports={get:l,characters:o,seed:a,lookup:u,shuffled:c};},function(t,e,n){var r=n(5),i=n.n(r);e.a={animateIn:function(t){i()({targets:t,translateY:"-35px",opacity:1,duration:300,easing:"easeOutCubic"});},animateOut:function(t,e){i()({targets:t,opacity:0,marginTop:"-40px",duration:300,easing:"easeOutExpo",complete:e});},animateOutBottom:function(t,e){i()({targets:t,opacity:0,marginBottom:"-40px",duration:300,easing:"easeOutExpo",complete:e});},animateReset:function(t){i()({targets:t,left:0,opacity:1,duration:300,easing:"easeOutExpo"});},animatePanning:function(t,e,n){i()({targets:t,duration:10,easing:"easeOutQuad",left:e,opacity:n});},animatePanEnd:function(t,e){i()({targets:t,opacity:0,duration:300,easing:"easeOutExpo",complete:e});},clearAnimation:function(t){var e=i.a.timeline();t.forEach(function(t){e.add({targets:t.el,opacity:0,right:"-40px",duration:300,offset:"-=150",easing:"easeOutExpo",complete:function(){t.remove();}});});}};},function(t,e,n){t.exports=n(16);},function(t,e,n){n.d(e,"a",function(){return s});var r=n(8),i=n(1),o="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},a=n(2);n(11).polyfill();var s=function t(e){var n=this;return this.id=a.generate(),this.options=e,this.cached_options={},this.global={},this.groups=[],this.toasts=[],u(this),this.group=function(e){e||(e={}),e.globalToasts||(e.globalToasts={}),Object.assign(e.globalToasts,n.global);var r=new t(e);return n.groups.push(r),r},this.register=function(t,e,r){return r=r||{},l(n,t,e,r)},this.show=function(t,e){return c(n,t,e)},this.success=function(t,e){return e=e||{},e.type="success",c(n,t,e)},this.info=function(t,e){return e=e||{},e.type="info",c(n,t,e)},this.error=function(t,e){return e=e||{},e.type="error",c(n,t,e)},this.remove=function(t){n.toasts=n.toasts.filter(function(e){return e.el.hash!==t.hash}),t.parentNode&&t.parentNode.removeChild(t);},this.clear=function(t){return i.a.clearAnimation(n.toasts,function(){t&&t();}),n.toasts=[],!0},this},c=function(t,e,i){i=i||{};var a=null;if("object"!==(void 0===i?"undefined":o(i))){ return console.error("Options should be a type of object. given : "+i),null; }t.options.singleton&&t.toasts.length>0&&(t.cached_options=i,t.toasts[t.toasts.length-1].goAway(0));var s=Object.assign({},t.options);return Object.assign(s,i),a=n.i(r.a)(t,e,s),t.toasts.push(a),a},u=function(t){var e=t.options.globalToasts,n=function(e,n){return "string"==typeof n&&t[n]?t[n].apply(t,[e,{}]):c(t,e,n)};e&&(t.global={},Object.keys(e).forEach(function(r){t.global[r]=function(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};return e[r].apply(null,[t,n])};}));},l=function(t,e,n,r){t.options.globalToasts||(t.options.globalToasts={}),t.options.globalToasts[e]=function(t,e){var i=null;return "string"==typeof n&&(i=n),"function"==typeof n&&(i=n(t)),e(i,r)},u(t);};},function(t,e,n){n(22);var r=n(21)(null,null,null,null);t.exports=r.exports;},function(t,e,n){(function(n){var r,i,o,a={scope:{}};a.defineProperty="function"==typeof Object.defineProperties?Object.defineProperty:function(t,e,n){if(n.get||n.set){ throw new TypeError("ES3 does not support getters and setters."); }t!=Array.prototype&&t!=Object.prototype&&(t[e]=n.value);},a.getGlobal=function(t){return "undefined"!=typeof window&&window===t?t:void 0!==n&&null!=n?n:t},a.global=a.getGlobal(this),a.SYMBOL_PREFIX="jscomp_symbol_",a.initSymbol=function(){a.initSymbol=function(){},a.global.Symbol||(a.global.Symbol=a.Symbol);},a.symbolCounter_=0,a.Symbol=function(t){return a.SYMBOL_PREFIX+(t||"")+a.symbolCounter_++},a.initSymbolIterator=function(){a.initSymbol();var t=a.global.Symbol.iterator;t||(t=a.global.Symbol.iterator=a.global.Symbol("iterator")),"function"!=typeof Array.prototype[t]&&a.defineProperty(Array.prototype,t,{configurable:!0,writable:!0,value:function(){return a.arrayIterator(this)}}),a.initSymbolIterator=function(){};},a.arrayIterator=function(t){var e=0;return a.iteratorPrototype(function(){return e<t.length?{done:!1,value:t[e++]}:{done:!0}})},a.iteratorPrototype=function(t){return a.initSymbolIterator(),t={next:t},t[a.global.Symbol.iterator]=function(){return this},t},a.array=a.array||{},a.iteratorFromArray=function(t,e){a.initSymbolIterator(),t instanceof String&&(t+="");var n=0,r={next:function(){if(n<t.length){var i=n++;return {value:e(i,t[i]),done:!1}}return r.next=function(){return {done:!0,value:void 0}},r.next()}};return r[Symbol.iterator]=function(){return r},r},a.polyfill=function(t,e,n,r){if(e){for(n=a.global,t=t.split("."),r=0;r<t.length-1;r++){var i=t[r];i in n||(n[i]={}),n=n[i];}t=t[t.length-1],r=n[t],e=e(r),e!=r&&null!=e&&a.defineProperty(n,t,{configurable:!0,writable:!0,value:e});}},a.polyfill("Array.prototype.keys",function(t){return t||function(){return a.iteratorFromArray(this,function(t){return t})}},"es6-impl","es3");var s=this;!function(n,a){i=[],r=a,void 0!==(o="function"==typeof r?r.apply(e,i):r)&&(t.exports=o);}(0,function(){function t(t){if(!R.col(t)){ try{return document.querySelectorAll(t)}catch(t){} }}function e(t,e){for(var n=t.length,r=2<=arguments.length?arguments[1]:void 0,i=[],o=0;o<n;o++){ if(o in t){var a=t[o];e.call(r,a,o,t)&&i.push(a);} }return i}function n(t){return t.reduce(function(t,e){return t.concat(R.arr(e)?n(e):e)},[])}function r(e){return R.arr(e)?e:(R.str(e)&&(e=t(e)||e),e instanceof NodeList||e instanceof HTMLCollection?[].slice.call(e):[e])}function i(t,e){return t.some(function(t){return t===e})}function o(t){var e,n={};for(e in t){ n[e]=t[e]; }return n}function a(t,e){var n,r=o(t);for(n in t){ r[n]=e.hasOwnProperty(n)?e[n]:t[n]; }return r}function c(t,e){var n,r=o(t);for(n in e){ r[n]=R.und(t[n])?e[n]:t[n]; }return r}function u(t){t=t.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i,function(t,e,n,r){return e+e+n+n+r+r});var e=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(t);t=parseInt(e[1],16);var n=parseInt(e[2],16),e=parseInt(e[3],16);return "rgba("+t+","+n+","+e+",1)"}function l(t){function e(t,e,n){return 0>n&&(n+=1),1<n&&--n,n<1/6?t+6*(e-t)*n:.5>n?e:n<2/3?t+(e-t)*(2/3-n)*6:t}var n=/hsl\((\d+),\s*([\d.]+)%,\s*([\d.]+)%\)/g.exec(t)||/hsla\((\d+),\s*([\d.]+)%,\s*([\d.]+)%,\s*([\d.]+)\)/g.exec(t);t=parseInt(n[1])/360;var r=parseInt(n[2])/100,i=parseInt(n[3])/100,n=n[4]||1;if(0==r){ i=r=t=i; }else{var o=.5>i?i*(1+r):i+r-i*r,a=2*i-o,i=e(a,o,t+1/3),r=e(a,o,t);t=e(a,o,t-1/3);}return "rgba("+255*i+","+255*r+","+255*t+","+n+")"}function f(t){if(t=/([\+\-]?[0-9#\.]+)(%|px|pt|em|rem|in|cm|mm|ex|ch|pc|vw|vh|vmin|vmax|deg|rad|turn)?$/.exec(t)){ return t[2] }}function p(t){return -1<t.indexOf("translate")||"perspective"===t?"px":-1<t.indexOf("rotate")||-1<t.indexOf("skew")?"deg":void 0}function d(t,e){return R.fnc(t)?t(e.target,e.id,e.total):t}function h(t,e){if(e in t.style){ return getComputedStyle(t).getPropertyValue(e.replace(/([a-z])([A-Z])/g,"$1-$2").toLowerCase())||"0" }}function m(t,e){return R.dom(t)&&i(D,e)?"transform":R.dom(t)&&(t.getAttribute(e)||R.svg(t)&&t[e])?"attribute":R.dom(t)&&"transform"!==e&&h(t,e)?"css":null!=t[e]?"object":void 0}function v(t,n){var r=p(n),r=-1<n.indexOf("scale")?1:0+r;if(!(t=t.style.transform)){ return r; }for(var i=[],o=[],a=[],s=/(\w+)\((.+?)\)/g;i=s.exec(t);){ o.push(i[1]),a.push(i[2]); }return t=e(a,function(t,e){return o[e]===n}),t.length?t[0]:r}function g(t,e){switch(m(t,e)){case"transform":return v(t,e);case"css":return h(t,e);case"attribute":return t.getAttribute(e)}return t[e]||0}function y(t,e){var n=/^(\*=|\+=|-=)/.exec(t);if(!n){ return t; }var r=f(t)||0;switch(e=parseFloat(e),t=parseFloat(t.replace(n[0],"")),n[0][0]){case"+":return e+t+r;case"-":return e-t+r;case"*":return e*t+r}}function b(t,e){return Math.sqrt(Math.pow(e.x-t.x,2)+Math.pow(e.y-t.y,2))}function x(t){t=t.points;for(var e,n=0,r=0;r<t.numberOfItems;r++){var i=t.getItem(r);0<r&&(n+=b(e,i)),e=i;}return n}function T(t){if(t.getTotalLength){ return t.getTotalLength(); }switch(t.tagName.toLowerCase()){case"circle":return 2*Math.PI*t.getAttribute("r");case"rect":return 2*t.getAttribute("width")+2*t.getAttribute("height");case"line":return b({x:t.getAttribute("x1"),y:t.getAttribute("y1")},{x:t.getAttribute("x2"),y:t.getAttribute("y2")});case"polyline":return x(t);case"polygon":var e=t.points;return x(t)+b(e.getItem(e.numberOfItems-1),e.getItem(0))}}function w(t,e){function n(n){return n=void 0===n?0:n,t.el.getPointAtLength(1<=e+n?e+n:0)}var r=n(),i=n(-1),o=n(1);switch(t.property){case"x":return r.x;case"y":return r.y;case"angle":return 180*Math.atan2(o.y-i.y,o.x-i.x)/Math.PI}}function E(t,e){var n,r=/-?\d*\.?\d+/g;if(n=R.pth(t)?t.totalLength:t,R.col(n)){ if(R.rgb(n)){var i=/rgb\((\d+,\s*[\d]+,\s*[\d]+)\)/g.exec(n);n=i?"rgba("+i[1]+",1)":n;}else { n=R.hex(n)?u(n):R.hsl(n)?l(n):void 0; } }else { i=(i=f(n))?n.substr(0,n.length-i.length):n,n=e&&!/\s/g.test(n)?i+e:i; }return n+="",{original:n,numbers:n.match(r)?n.match(r).map(Number):[0],strings:R.str(t)||e?n.split(r):[]}}function C(t){return t=t?n(R.arr(t)?t.map(r):r(t)):[],e(t,function(t,e,n){return n.indexOf(t)===e})}function S(t){var e=C(t);return e.map(function(t,n){return {target:t,id:n,total:e.length}})}function O(t,e){var n=o(e);if(R.arr(t)){var i=t.length;2!==i||R.obj(t[0])?R.fnc(e.duration)||(n.duration=e.duration/i):t={value:t};}return r(t).map(function(t,n){return n=n?0:e.delay,t=R.obj(t)&&!R.pth(t)?t:{value:t},R.und(t.delay)&&(t.delay=n),t}).map(function(t){return c(t,n)})}function A(t,e){var n,r={};for(n in t){var i=d(t[n],e);R.arr(i)&&(i=i.map(function(t){return d(t,e)}),1===i.length&&(i=i[0])),r[n]=i;}return r.duration=parseFloat(r.duration),r.delay=parseFloat(r.delay),r}function I(t){return R.arr(t)?F.apply(this,t):z[t]}function M(t,e){var n;return t.tweens.map(function(r){r=A(r,e);var i=r.value,o=g(e.target,t.name),a=n?n.to.original:o,a=R.arr(i)?i[0]:a,s=y(R.arr(i)?i[1]:i,a),o=f(s)||f(a)||f(o);return r.from=E(a,o),r.to=E(s,o),r.start=n?n.end:t.offset,r.end=r.start+r.delay+r.duration,r.easing=I(r.easing),r.elasticity=(1e3-Math.min(Math.max(r.elasticity,1),999))/1e3,r.isPath=R.pth(i),r.isColor=R.col(r.from.original),r.isColor&&(r.round=1),n=r})}function P(t,r){return e(n(t.map(function(t){return r.map(function(e){var n=m(t.target,e.name);if(n){var r=M(e,t);e={type:n,property:e.name,animatable:t,tweens:r,duration:r[r.length-1].end,delay:r[0].delay};}else { e=void 0; }return e})})),function(t){return !R.und(t)})}function L(t,e,n,r){var i="delay"===t;return e.length?(i?Math.min:Math.max).apply(Math,e.map(function(e){return e[t]})):i?r.delay:n.offset+r.delay+r.duration}function k(t){var e,n=a(_,t),r=a(X,t),i=S(t.targets),o=[],s=c(n,r);for(e in t){ s.hasOwnProperty(e)||"targets"===e||o.push({name:e,offset:s.offset,tweens:O(t[e],r)}); }return t=P(i,o),c(n,{children:[],animatables:i,animations:t,duration:L("duration",t,n,r),delay:L("delay",t,n,r)})}function j(t){function n(){return window.Promise&&new Promise(function(t){return f=t})}function r(t){return d.reversed?d.duration-t:t}function i(t){for(var n=0,r={},i=d.animations,o=i.length;n<o;){var a=i[n],s=a.animatable,c=a.tweens,u=c.length-1,l=c[u];u&&(l=e(c,function(e){return t<e.end})[0]||l);for(var c=Math.min(Math.max(t-l.start-l.delay,0),l.duration)/l.duration,f=isNaN(c)?1:l.easing(c,l.elasticity),c=l.to.strings,p=l.round,u=[],m=void 0,m=l.to.numbers.length,v=0;v<m;v++){var g=void 0,g=l.to.numbers[v],y=l.from.numbers[v],g=l.isPath?w(l.value,f*g):y+f*(g-y);p&&(l.isColor&&2<v||(g=Math.round(g*p)/p)),u.push(g);}if(l=c.length){ for(m=c[0],f=0;f<l;f++){ p=c[f+1],v=u[f],isNaN(v)||(m=p?m+(v+p):m+(v+" ")); } }else { m=u[0]; }Y[a.type](s.target,a.property,m,r,s.id),a.currentValue=m,n++;}if(n=Object.keys(r).length){ for(i=0;i<n;i++){ N||(N=h(document.body,"transform")?"transform":"-webkit-transform"),d.animatables[i].target.style[N]=r[i].join(" "); } }d.currentTime=t,d.progress=t/d.duration*100;}function o(t){d[t]&&d[t](d);}function a(){d.remaining&&!0!==d.remaining&&d.remaining--;}function s(t){var e=d.duration,s=d.offset,h=s+d.delay,m=d.currentTime,v=d.reversed,g=r(t);if(d.children.length){var y=d.children,b=y.length;if(g>=d.currentTime){ for(var x=0;x<b;x++){ y[x].seek(g); } }else { for(;b--;){ y[b].seek(g); } }}(g>=h||!e)&&(d.began||(d.began=!0,o("begin")),o("run")),g>s&&g<e?i(g):(g<=s&&0!==m&&(i(0),v&&a()),(g>=e&&m!==e||!e)&&(i(e),v||a())),o("update"),t>=e&&(d.remaining?(u=c,"alternate"===d.direction&&(d.reversed=!d.reversed)):(d.pause(),d.completed||(d.completed=!0,o("complete"),"Promise"in window&&(f(),p=n()))),l=0);}t=void 0===t?{}:t;var c,u,l=0,f=null,p=n(),d=k(t);return d.reset=function(){var t=d.direction,e=d.loop;for(d.currentTime=0,d.progress=0,d.paused=!0,d.began=!1,d.completed=!1,d.reversed="reverse"===t,d.remaining="alternate"===t&&1===e?2:e,i(0),t=d.children.length;t--;){ d.children[t].reset(); }},d.tick=function(t){c=t,u||(u=c),s((l+c-u)*j.speed);},d.seek=function(t){s(r(t));},d.pause=function(){var t=q.indexOf(d);-1<t&&q.splice(t,1),d.paused=!0;},d.play=function(){d.paused&&(d.paused=!1,u=0,l=r(d.currentTime),q.push(d),H||V());},d.reverse=function(){d.reversed=!d.reversed,u=0,l=r(d.currentTime);},d.restart=function(){d.pause(),d.reset(),d.play();},d.finished=p,d.reset(),d.autoplay&&d.play(),d}var N,_={update:void 0,begin:void 0,run:void 0,complete:void 0,loop:1,direction:"normal",autoplay:!0,offset:0},X={duration:1e3,delay:0,easing:"easeOutElastic",elasticity:500,round:0},D="translateX translateY translateZ rotate rotateX rotateY rotateZ scale scaleX scaleY scaleZ skewX skewY perspective".split(" "),R={arr:function(t){return Array.isArray(t)},obj:function(t){return -1<Object.prototype.toString.call(t).indexOf("Object")},pth:function(t){return R.obj(t)&&t.hasOwnProperty("totalLength")},svg:function(t){return t instanceof SVGElement},dom:function(t){return t.nodeType||R.svg(t)},str:function(t){return "string"==typeof t},fnc:function(t){return "function"==typeof t},und:function(t){return void 0===t},hex:function(t){return /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(t)},rgb:function(t){return /^rgb/.test(t)},hsl:function(t){return /^hsl/.test(t)},col:function(t){return R.hex(t)||R.rgb(t)||R.hsl(t)}},F=function(){function t(t,e,n){return (((1-3*n+3*e)*t+(3*n-6*e))*t+3*e)*t}return function(e,n,r,i){if(0<=e&&1>=e&&0<=r&&1>=r){var o=new Float32Array(11);if(e!==n||r!==i){ for(var a=0;11>a;++a){ o[a]=t(.1*a,e,r); } }return function(a){if(e===n&&r===i){ return a; }if(0===a){ return 0; }if(1===a){ return 1; }for(var s=0,c=1;10!==c&&o[c]<=a;++c){ s+=.1; }--c;var c=s+(a-o[c])/(o[c+1]-o[c])*.1,u=3*(1-3*r+3*e)*c*c+2*(3*r-6*e)*c+3*e;if(.001<=u){for(s=0;4>s&&0!==(u=3*(1-3*r+3*e)*c*c+2*(3*r-6*e)*c+3*e);++s){ var l=t(c,e,r)-a,c=c-l/u; }a=c;}else if(0===u){ a=c; }else{var c=s,s=s+.1,f=0;do{l=c+(s-c)/2,u=t(l,e,r)-a,0<u?s=l:c=l;}while(1e-7<Math.abs(u)&&10>++f);a=l;}return t(a,n,i)}}}}(),z=function(){function t(t,e){return 0===t||1===t?t:-Math.pow(2,10*(t-1))*Math.sin(2*(t-1-e/(2*Math.PI)*Math.asin(1))*Math.PI/e)}var e,n="Quad Cubic Quart Quint Sine Expo Circ Back Elastic".split(" "),r={In:[[.55,.085,.68,.53],[.55,.055,.675,.19],[.895,.03,.685,.22],[.755,.05,.855,.06],[.47,0,.745,.715],[.95,.05,.795,.035],[.6,.04,.98,.335],[.6,-.28,.735,.045],t],Out:[[.25,.46,.45,.94],[.215,.61,.355,1],[.165,.84,.44,1],[.23,1,.32,1],[.39,.575,.565,1],[.19,1,.22,1],[.075,.82,.165,1],[.175,.885,.32,1.275],function(e,n){return 1-t(1-e,n)}],InOut:[[.455,.03,.515,.955],[.645,.045,.355,1],[.77,0,.175,1],[.86,0,.07,1],[.445,.05,.55,.95],[1,0,0,1],[.785,.135,.15,.86],[.68,-.55,.265,1.55],function(e,n){return .5>e?t(2*e,n)/2:1-t(-2*e+2,n)/2}]},i={linear:F(.25,.25,.75,.75)},o={};for(e in r){ o.type=e,r[o.type].forEach(function(t){return function(e,r){i["ease"+t.type+n[r]]=R.fnc(e)?e:F.apply(s,e);}}(o)),o={type:o.type}; }return i}(),Y={css:function(t,e,n){return t.style[e]=n},attribute:function(t,e,n){return t.setAttribute(e,n)},object:function(t,e,n){return t[e]=n},transform:function(t,e,n,r,i){r[i]||(r[i]=[]),r[i].push(e+"("+n+")");}},q=[],H=0,V=function(){function t(){H=requestAnimationFrame(e);}function e(e){var n=q.length;if(n){for(var r=0;r<n;){ q[r]&&q[r].tick(e),r++; }t();}else { cancelAnimationFrame(H),H=0; }}return t}();return j.version="2.2.0",j.speed=1,j.running=q,j.remove=function(t){t=C(t);for(var e=q.length;e--;){ for(var n=q[e],r=n.animations,o=r.length;o--;){ i(t,r[o].animatable.target)&&(r.splice(o,1),r.length||n.pause()); } }},j.getValue=g,j.path=function(e,n){var r=R.str(e)?t(e)[0]:e,i=n||100;return function(t){return {el:r,property:t,totalLength:T(r)*(i/100)}}},j.setDashoffset=function(t){var e=T(t);return t.setAttribute("stroke-dasharray",e),e},j.bezier=F,j.easings=z,j.timeline=function(t){var e=j(t);return e.pause(),e.duration=0,e.add=function(n){return e.children.forEach(function(t){t.began=!0,t.completed=!0;}),r(n).forEach(function(n){var r=c(n,a(X,t||{}));r.targets=r.targets||t.targets,n=e.duration;var i=r.offset;r.autoplay=!1,r.direction=e.direction,r.offset=R.und(i)?n:y(i,n),e.began=!0,e.completed=!0,e.seek(r.offset),r=j(r),r.began=!0,r.completed=!0,r.duration>n&&(e.duration=r.duration),e.children.push(r);}),e.seek(0),e.reset(),e.autoplay&&e.restart(),e},e},j.random=function(t,e){return Math.floor(Math.random()*(e-t+1))+t},j});}).call(e,n(25));},function(t,e,n){Object.defineProperty(e,"__esModule",{value:!0});var r=n(3),i=n(4),o=n.n(i),a={install:function(t,e){e||(e={});var n=new r.a(e);t.component("toasted",o.a),t.toasted=t.prototype.$toasted=n;}};"undefined"!=typeof window&&window.Vue&&(window.Toasted=a),e.default=a;},function(t,e,n){n.d(e,"a",function(){return c});var r=n(1),i=this,o="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},a=function(t,e,n){return setTimeout(function(){if(n.cached_options.position&&n.cached_options.position.includes("bottom")){ return void r.a.animateOutBottom(t,function(){n.remove(t);}); }r.a.animateOut(t,function(){n.remove(t);});},e),!0},s=function(t,e){return ("object"===("undefined"==typeof HTMLElement?"undefined":o(HTMLElement))?e instanceof HTMLElement:e&&"object"===(void 0===e?"undefined":o(e))&&null!==e&&1===e.nodeType&&"string"==typeof e.nodeName)?t.appendChild(e):t.innerHTML=e,i},c=function(t,e){var n=!1;return {el:t,text:function(e){return s(t,e),this},goAway:function(){var r=arguments.length>0&&void 0!==arguments[0]?arguments[0]:800;return n=!0,a(t,r,e)},remove:function(){e.remove(t);},disposed:function(){return n}}};},function(t,e,n){var r=n(12),i=n.n(r),o=n(1),a=n(7),s="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},c=n(2),u={},l=null,f=function(t){return t.className=t.className||null,t.onComplete=t.onComplete||null,t.position=t.position||"top-right",t.duration=t.duration||null,t.theme=t.theme||"primary",t.type=t.type||"default",t.containerClass=t.containerClass||null,t.fullWidth=t.fullWidth||!1,t.icon=t.icon||null,t.action=t.action||null,t.fitToScreen=t.fitToScreen||null,t.closeOnSwipe=void 0===t.closeOnSwipe||t.closeOnSwipe,t.iconPack=t.iconPack||"material",t.className&&"string"==typeof t.className&&(t.className=t.className.split(" ")),t.className||(t.className=[]),t.theme&&t.className.push(t.theme.trim()),t.type&&t.className.push(t.type),t.containerClass&&"string"==typeof t.containerClass&&(t.containerClass=t.containerClass.split(" ")),t.containerClass||(t.containerClass=[]),t.position&&t.containerClass.push(t.position.trim()),t.fullWidth&&t.containerClass.push("full-width"),t.fitToScreen&&t.containerClass.push("fit-to-screen"),u=t,t},p=function(t,e){var r=document.createElement("div");if(r.classList.add("toasted"),r.hash=c.generate(),e.className&&e.className.forEach(function(t){r.classList.add(t);}),("object"===("undefined"==typeof HTMLElement?"undefined":s(HTMLElement))?t instanceof HTMLElement:t&&"object"===(void 0===t?"undefined":s(t))&&null!==t&&1===t.nodeType&&"string"==typeof t.nodeName)?r.appendChild(t):r.innerHTML=t,d(e,r),e.closeOnSwipe){var u=new i.a(r,{prevent_default:!1});u.on("pan",function(t){var e=t.deltaX;r.classList.contains("panning")||r.classList.add("panning");var n=1-Math.abs(e/80);n<0&&(n=0),o.a.animatePanning(r,e,n);}),u.on("panend",function(t){var n=t.deltaX;Math.abs(n)>80?o.a.animatePanEnd(r,function(){"function"==typeof e.onComplete&&e.onComplete(),r.parentNode&&l.remove(r);}):(r.classList.remove("panning"),o.a.animateReset(r));});}if(Array.isArray(e.action)){ e.action.forEach(function(t){var e=m(t,n.i(a.a)(r,l));e&&r.appendChild(e);}); }else if("object"===s(e.action)){var f=m(e.action,n.i(a.a)(r,l));f&&r.appendChild(f);}return r},d=function(t,e){if(t.icon){var n=document.createElement("i");switch(t.iconPack){case"fontawesome":n.classList.add("fa");var r=t.icon.name?t.icon.name:t.icon;r.includes("fa-")?n.classList.add(r.trim()):n.classList.add("fa-"+r.trim());break;case"mdi":n.classList.add("mdi");var i=t.icon.name?t.icon.name:t.icon;i.includes("mdi-")?n.classList.add(i.trim()):n.classList.add("mdi-"+i.trim());break;case"custom-class":var o=t.icon.name?t.icon.name:t.icon;"string"==typeof o?o.split(" ").forEach(function(t){n.classList.add(t);}):Array.isArray(o)&&o.forEach(function(t){n.classList.add(t.trim());});break;default:n.classList.add("material-icons"),n.textContent=t.icon.name?t.icon.name:t.icon;}t.icon.after&&n.classList.add("after"),h(t,n,e);}},h=function(t,e,n){t.icon&&(t.icon.after&&t.icon.name?n.appendChild(e):(t.icon.name,n.insertBefore(e,n.firstChild)));},m=function(t,e){if(!t){ return null; }var n=document.createElement("a");if(n.classList.add("action"),n.classList.add("ripple"),t.text&&(n.text=t.text),t.href&&(n.href=t.href),t.icon){n.classList.add("icon");var r=document.createElement("i");switch(u.iconPack){case"fontawesome":r.classList.add("fa"),t.icon.includes("fa-")?r.classList.add(t.icon.trim()):r.classList.add("fa-"+t.icon.trim());break;case"mdi":r.classList.add("mdi"),t.icon.includes("mdi-")?r.classList.add(t.icon.trim()):r.classList.add("mdi-"+t.icon.trim());break;case"custom-class":"string"==typeof t.icon?t.icon.split(" ").forEach(function(t){n.classList.add(t);}):Array.isArray(t.icon)&&t.icon.forEach(function(t){n.classList.add(t.trim());});break;default:r.classList.add("material-icons"),r.textContent=t.icon;}n.appendChild(r);}return t.class&&("string"==typeof t.class?t.class.split(" ").forEach(function(t){n.classList.add(t);}):Array.isArray(t.class)&&t.class.forEach(function(t){n.classList.add(t.trim());})),t.push&&n.addEventListener("click",function(n){if(n.preventDefault(),!u.router){ return void console.warn("[vue-toasted] : Vue Router instance is not attached. please check the docs"); }u.router.push(t.push),t.push.dontClose||e.goAway(0);}),t.onClick&&"function"==typeof t.onClick&&n.addEventListener("click",function(n){t.onClick&&(n.preventDefault(),t.onClick(n,e));}),n};e.a=function(t,e,r){l=t,r=f(r);var i=document.getElementById(l.id);null===i&&(i=document.createElement("div"),i.id=l.id,document.body.appendChild(i)),r.containerClass.unshift("toasted-container"),i.className!==r.containerClass.join(" ")&&(i.className="",r.containerClass.forEach(function(t){i.classList.add(t);}));var s=p(e,r);e&&i.appendChild(s),s.style.opacity=0,o.a.animateIn(s);var c=r.duration,u=void 0;return null!==c&&(u=setInterval(function(){null===s.parentNode&&window.clearInterval(u),s.classList.contains("panning")||(c-=20),c<=0&&(o.a.animateOut(s,function(){"function"==typeof r.onComplete&&r.onComplete(),s.parentNode&&l.remove(s);}),window.clearInterval(u));},20)),n.i(a.a)(s,l)};},function(t,e,n){e=t.exports=n(10)(),e.push([t.i,".toasted{padding:0 20px}.toasted.rounded{border-radius:24px}.toasted.primary{border-radius:2px;min-height:38px;line-height:1.1em;background-color:#353535;padding:0 20px;font-size:15px;font-weight:300;color:#fff;box-shadow:0 1px 3px rgba(0,0,0,.12),0 1px 2px rgba(0,0,0,.24)}.toasted.primary.success{background:#4caf50}.toasted.primary.error{background:#f44336}.toasted.primary.info{background:#3f51b5}.toasted.primary .action{color:#a1c2fa}.toasted.bubble{border-radius:30px;min-height:38px;line-height:1.1em;background-color:#ff7043;padding:0 20px;font-size:15px;font-weight:300;color:#fff;box-shadow:0 1px 3px rgba(0,0,0,.12),0 1px 2px rgba(0,0,0,.24)}.toasted.bubble.success{background:#4caf50}.toasted.bubble.error{background:#f44336}.toasted.bubble.info{background:#3f51b5}.toasted.bubble .action{color:#8e2b0c}.toasted.outline{border-radius:30px;min-height:38px;line-height:1.1em;background-color:#fff;border:1px solid #676767;padding:0 20px;font-size:15px;color:#676767;box-shadow:0 1px 3px rgba(0,0,0,.12),0 1px 2px rgba(0,0,0,.24);font-weight:700}.toasted.outline.success{color:#4caf50;border-color:#4caf50}.toasted.outline.error{color:#f44336;border-color:#f44336}.toasted.outline.info{color:#3f51b5;border-color:#3f51b5}.toasted.outline .action{color:#607d8b}.toasted-container{position:fixed;z-index:10000}.toasted-container,.toasted-container.full-width{display:-ms-flexbox;display:flex;-ms-flex-direction:column;flex-direction:column}.toasted-container.full-width{max-width:86%;width:100%}.toasted-container.full-width.fit-to-screen{min-width:100%}.toasted-container.full-width.fit-to-screen .toasted:first-child{margin-top:0}.toasted-container.full-width.fit-to-screen.top-right{top:0;right:0}.toasted-container.full-width.fit-to-screen.top-left{top:0;left:0}.toasted-container.full-width.fit-to-screen.top-center{top:0;left:0;-webkit-transform:translateX(0);transform:translateX(0)}.toasted-container.full-width.fit-to-screen.bottom-right{right:0;bottom:0}.toasted-container.full-width.fit-to-screen.bottom-left{left:0;bottom:0}.toasted-container.full-width.fit-to-screen.bottom-center{left:0;bottom:0;-webkit-transform:translateX(0);transform:translateX(0)}.toasted-container.top-right{top:10%;right:7%}.toasted-container.top-left{top:10%;left:7%}.toasted-container.top-center{top:10%;left:50%;-webkit-transform:translateX(-50%);transform:translateX(-50%)}.toasted-container.bottom-right{right:5%;bottom:7%}.toasted-container.bottom-left{left:5%;bottom:7%}.toasted-container.bottom-center{left:50%;-webkit-transform:translateX(-50%);transform:translateX(-50%);bottom:7%}.toasted-container.bottom-left .toasted,.toasted-container.top-left .toasted{float:left}.toasted-container.bottom-right .toasted,.toasted-container.top-right .toasted{float:right}.toasted-container .toasted{top:35px;width:auto;clear:both;margin-top:10px;position:relative;max-width:100%;height:auto;word-break:normal;display:-ms-flexbox;display:flex;-ms-flex-align:center;align-items:center;-ms-flex-pack:justify;justify-content:space-between;box-sizing:inherit}.toasted-container .toasted .fa,.toasted-container .toasted .material-icons,.toasted-container .toasted .mdi{margin-right:.5rem;margin-left:-.4rem}.toasted-container .toasted .fa.after,.toasted-container .toasted .material-icons.after,.toasted-container .toasted .mdi.after{margin-left:.5rem;margin-right:-.4rem}.toasted-container .toasted .action{text-decoration:none;font-size:.8rem;padding:8px;margin:5px -7px 5px 7px;border-radius:3px;text-transform:uppercase;letter-spacing:.03em;font-weight:600;cursor:pointer}.toasted-container .toasted .action.icon{padding:4px;display:-ms-flexbox;display:flex;-ms-flex-align:center;align-items:center;-ms-flex-pack:center;justify-content:center}.toasted-container .toasted .action.icon .fa,.toasted-container .toasted .action.icon .material-icons,.toasted-container .toasted .action.icon .mdi{margin-right:0;margin-left:4px}.toasted-container .toasted .action.icon:hover{text-decoration:none}.toasted-container .toasted .action:hover{text-decoration:underline}@media only screen and (max-width:600px){#toasted-container{min-width:100%}#toasted-container .toasted:first-child{margin-top:0}#toasted-container.top-right{top:0;right:0}#toasted-container.top-left{top:0;left:0}#toasted-container.top-center{top:0;left:0;-webkit-transform:translateX(0);transform:translateX(0)}#toasted-container.bottom-right{right:0;bottom:0}#toasted-container.bottom-left{left:0;bottom:0}#toasted-container.bottom-center{left:0;bottom:0;-webkit-transform:translateX(0);transform:translateX(0)}#toasted-container.bottom-center,#toasted-container.top-center{-ms-flex-align:stretch!important;align-items:stretch!important}#toasted-container.bottom-left .toasted,#toasted-container.bottom-right .toasted,#toasted-container.top-left .toasted,#toasted-container.top-right .toasted{float:none}#toasted-container .toasted{border-radius:0}}",""]);},function(t,e){t.exports=function(){var t=[];return t.toString=function(){for(var t=[],e=0;e<this.length;e++){var n=this[e];n[2]?t.push("@media "+n[2]+"{"+n[1]+"}"):t.push(n[1]);}return t.join("")},t.i=function(e,n){"string"==typeof e&&(e=[[null,e,""]]);for(var r={},i=0;i<this.length;i++){var o=this[i][0];"number"==typeof o&&(r[o]=!0);}for(i=0;i<e.length;i++){var a=e[i];"number"==typeof a[0]&&r[a[0]]||(n&&!a[2]?a[2]=n:n&&(a[2]="("+a[2]+") and ("+n+")"),t.push(a));}},t};},function(t,e,n){function r(t,e){
	var arguments$1 = arguments;
	if(void 0===t||null===t){ throw new TypeError("Cannot convert first argument to object"); }for(var n=Object(t),r=1;r<arguments.length;r++){var i=arguments$1[r];if(void 0!==i&&null!==i){ for(var o=Object.keys(Object(i)),a=0,s=o.length;a<s;a++){var c=o[a],u=Object.getOwnPropertyDescriptor(i,c);void 0!==u&&u.enumerable&&(n[c]=i[c]);} }}return n}function i(){Object.assign||Object.defineProperty(Object,"assign",{enumerable:!1,configurable:!0,writable:!0,value:r});}t.exports={assign:r,polyfill:i};},function(t,e,n){var r;!function(i,o,a,s){function c(t,e,n){return setTimeout(d(t,n),e)}function u(t,e,n){return !!Array.isArray(t)&&(l(t,n[e],n),!0)}function l(t,e,n){var r;if(t){ if(t.forEach){ t.forEach(e,n); }else if(t.length!==s){ for(r=0;r<t.length;){ e.call(n,t[r],r,t),r++; } }else { for(r in t){ t.hasOwnProperty(r)&&e.call(n,t[r],r,t); } } }}function f(t,e,n){var r="DEPRECATED METHOD: "+e+"\n"+n+" AT \n";return function(){var e=new Error("get-stack-trace"),n=e&&e.stack?e.stack.replace(/^[^\(]+?[\n$]/gm,"").replace(/^\s+at\s+/gm,"").replace(/^Object.<anonymous>\s*\(/gm,"{anonymous}()@"):"Unknown Stack Trace",o=i.console&&(i.console.warn||i.console.log);return o&&o.call(i.console,r,n),t.apply(this,arguments)}}function p(t,e,n){var r,i=e.prototype;r=t.prototype=Object.create(i),r.constructor=t,r._super=i,n&&ht(r,n);}function d(t,e){return function(){return t.apply(e,arguments)}}function h(t,e){return typeof t==gt?t.apply(e?e[0]||s:s,e):t}function m(t,e){return t===s?e:t}function v(t,e,n){l(x(e),function(e){t.addEventListener(e,n,!1);});}function g(t,e,n){l(x(e),function(e){t.removeEventListener(e,n,!1);});}function y(t,e){for(;t;){if(t==e){ return !0; }t=t.parentNode;}return !1}function b(t,e){return t.indexOf(e)>-1}function x(t){return t.trim().split(/\s+/g)}function T(t,e,n){if(t.indexOf&&!n){ return t.indexOf(e); }for(var r=0;r<t.length;){if(n&&t[r][n]==e||!n&&t[r]===e){ return r; }r++;}return -1}function w(t){return Array.prototype.slice.call(t,0)}function E(t,e,n){for(var r=[],i=[],o=0;o<t.length;){var a=e?t[o][e]:t[o];T(i,a)<0&&r.push(t[o]),i[o]=a,o++;}return n&&(r=e?r.sort(function(t,n){return t[e]>n[e]}):r.sort()),r}function C(t,e){for(var n,r,i=e[0].toUpperCase()+e.slice(1),o=0;o<mt.length;){if(n=mt[o],(r=n?n+i:e)in t){ return r; }o++;}return s}function S(){return Et++}function O(t){var e=t.ownerDocument||t;return e.defaultView||e.parentWindow||i}function A(t,e){var n=this;this.manager=t,this.callback=e,this.element=t.element,this.target=t.options.inputTarget,this.domHandler=function(e){h(t.options.enable,[t])&&n.handler(e);},this.init();}function I(t){var e=t.options.inputClass;return new(e||(Ot?q:At?W:St?B:Y))(t,M)}function M(t,e,n){var r=n.pointers.length,i=n.changedPointers.length,o=e&Mt&&r-i==0,a=e&(Lt|kt)&&r-i==0;n.isFirst=!!o,n.isFinal=!!a,o&&(t.session={}),n.eventType=e,P(t,n),t.emit("hammer.input",n),t.recognize(n),t.session.prevInput=n;}function P(t,e){var n=t.session,r=e.pointers,i=r.length;n.firstInput||(n.firstInput=j(e)),i>1&&!n.firstMultiple?n.firstMultiple=j(e):1===i&&(n.firstMultiple=!1);var o=n.firstInput,a=n.firstMultiple,s=a?a.center:o.center,c=e.center=N(r);e.timeStamp=xt(),e.deltaTime=e.timeStamp-o.timeStamp,e.angle=R(s,c),e.distance=D(s,c),L(n,e),e.offsetDirection=X(e.deltaX,e.deltaY);var u=_(e.deltaTime,e.deltaX,e.deltaY);e.overallVelocityX=u.x,e.overallVelocityY=u.y,e.overallVelocity=bt(u.x)>bt(u.y)?u.x:u.y,e.scale=a?z(a.pointers,r):1,e.rotation=a?F(a.pointers,r):0,e.maxPointers=n.prevInput?e.pointers.length>n.prevInput.maxPointers?e.pointers.length:n.prevInput.maxPointers:e.pointers.length,k(n,e);var l=t.element;y(e.srcEvent.target,l)&&(l=e.srcEvent.target),e.target=l;}function L(t,e){var n=e.center,r=t.offsetDelta||{},i=t.prevDelta||{},o=t.prevInput||{};e.eventType!==Mt&&o.eventType!==Lt||(i=t.prevDelta={x:o.deltaX||0,y:o.deltaY||0},r=t.offsetDelta={x:n.x,y:n.y}),e.deltaX=i.x+(n.x-r.x),e.deltaY=i.y+(n.y-r.y);}function k(t,e){var n,r,i,o,a=t.lastInterval||e,c=e.timeStamp-a.timeStamp;if(e.eventType!=kt&&(c>It||a.velocity===s)){var u=e.deltaX-a.deltaX,l=e.deltaY-a.deltaY,f=_(c,u,l);r=f.x,i=f.y,n=bt(f.x)>bt(f.y)?f.x:f.y,o=X(u,l),t.lastInterval=e;}else { n=a.velocity,r=a.velocityX,i=a.velocityY,o=a.direction; }e.velocity=n,e.velocityX=r,e.velocityY=i,e.direction=o;}function j(t){for(var e=[],n=0;n<t.pointers.length;){ e[n]={clientX:yt(t.pointers[n].clientX),clientY:yt(t.pointers[n].clientY)},n++; }return {timeStamp:xt(),pointers:e,center:N(e),deltaX:t.deltaX,deltaY:t.deltaY}}function N(t){var e=t.length;if(1===e){ return {x:yt(t[0].clientX),y:yt(t[0].clientY)}; }for(var n=0,r=0,i=0;i<e;){ n+=t[i].clientX,r+=t[i].clientY,i++; }return {x:yt(n/e),y:yt(r/e)}}function _(t,e,n){return {x:e/t||0,y:n/t||0}}function X(t,e){return t===e?jt:bt(t)>=bt(e)?t<0?Nt:_t:e<0?Xt:Dt}function D(t,e,n){n||(n=Yt);var r=e[n[0]]-t[n[0]],i=e[n[1]]-t[n[1]];return Math.sqrt(r*r+i*i)}function R(t,e,n){n||(n=Yt);var r=e[n[0]]-t[n[0]],i=e[n[1]]-t[n[1]];return 180*Math.atan2(i,r)/Math.PI}function F(t,e){return R(e[1],e[0],qt)+R(t[1],t[0],qt)}function z(t,e){return D(e[0],e[1],qt)/D(t[0],t[1],qt)}function Y(){this.evEl=Vt,this.evWin=Wt,this.pressed=!1,A.apply(this,arguments);}function q(){this.evEl=$t,this.evWin=Gt,A.apply(this,arguments),this.store=this.manager.session.pointerEvents=[];}function H(){this.evTarget=Qt,this.evWin=Jt,this.started=!1,A.apply(this,arguments);}function V(t,e){var n=w(t.touches),r=w(t.changedTouches);return e&(Lt|kt)&&(n=E(n.concat(r),"identifier",!0)),[n,r]}function W(){this.evTarget=te,this.targetIds={},A.apply(this,arguments);}function U(t,e){var n=w(t.touches),r=this.targetIds;if(e&(Mt|Pt)&&1===n.length){ return r[n[0].identifier]=!0,[n,n]; }var i,o,a=w(t.changedTouches),s=[],c=this.target;if(o=n.filter(function(t){return y(t.target,c)}),e===Mt){ for(i=0;i<o.length;){ r[o[i].identifier]=!0,i++; } }for(i=0;i<a.length;){ r[a[i].identifier]&&s.push(a[i]),e&(Lt|kt)&&delete r[a[i].identifier],i++; }return s.length?[E(o.concat(s),"identifier",!0),s]:void 0}function B(){A.apply(this,arguments);var t=d(this.handler,this);this.touch=new W(this.manager,t),this.mouse=new Y(this.manager,t),this.primaryTouch=null,this.lastTouches=[];}function $(t,e){t&Mt?(this.primaryTouch=e.changedPointers[0].identifier,G.call(this,e)):t&(Lt|kt)&&G.call(this,e);}function G(t){var e=t.changedPointers[0];if(e.identifier===this.primaryTouch){var n={x:e.clientX,y:e.clientY};this.lastTouches.push(n);var r=this.lastTouches,i=function(){var t=r.indexOf(n);t>-1&&r.splice(t,1);};setTimeout(i,ee);}}function Z(t){for(var e=t.srcEvent.clientX,n=t.srcEvent.clientY,r=0;r<this.lastTouches.length;r++){var i=this.lastTouches[r],o=Math.abs(e-i.x),a=Math.abs(n-i.y);if(o<=ne&&a<=ne){ return !0 }}return !1}function Q(t,e){this.manager=t,this.set(e);}function J(t){if(b(t,se)){ return se; }var e=b(t,ce),n=b(t,ue);return e&&n?se:e||n?e?ce:ue:b(t,ae)?ae:oe}function K(t){this.options=ht({},this.defaults,t||{}),this.id=S(),this.manager=null,this.options.enable=m(this.options.enable,!0),this.state=fe,this.simultaneous={},this.requireFail=[];}function tt(t){return t&ve?"cancel":t&he?"end":t&de?"move":t&pe?"start":""}function et(t){return t==Dt?"down":t==Xt?"up":t==Nt?"left":t==_t?"right":""}function nt(t,e){var n=e.manager;return n?n.get(t):t}function rt(){K.apply(this,arguments);}function it(){rt.apply(this,arguments),this.pX=null,this.pY=null;}function ot(){rt.apply(this,arguments);}function at(){K.apply(this,arguments),this._timer=null,this._input=null;}function st(){rt.apply(this,arguments);}function ct(){rt.apply(this,arguments);}function ut(){K.apply(this,arguments),this.pTime=!1,this.pCenter=!1,this._timer=null,this._input=null,this.count=0;}function lt(t,e){return e=e||{},e.recognizers=m(e.recognizers,lt.defaults.preset),new ft(t,e)}function ft(t,e){this.options=ht({},lt.defaults,e||{}),this.options.inputTarget=this.options.inputTarget||t,this.handlers={},this.session={},this.recognizers=[],this.oldCssProps={},this.element=t,this.input=I(this),this.touchAction=new Q(this,this.options.touchAction),pt(this,!0),l(this.options.recognizers,function(t){var e=this.add(new t[0](t[1]));t[2]&&e.recognizeWith(t[2]),t[3]&&e.requireFailure(t[3]);},this);}function pt(t,e){var n=t.element;if(n.style){var r;l(t.options.cssProps,function(i,o){r=C(n.style,o),e?(t.oldCssProps[r]=n.style[r],n.style[r]=i):n.style[r]=t.oldCssProps[r]||"";}),e||(t.oldCssProps={});}}function dt(t,e){var n=o.createEvent("Event");n.initEvent(t,!0,!0),n.gesture=e,e.target.dispatchEvent(n);}var ht,mt=["","webkit","Moz","MS","ms","o"],vt=o.createElement("div"),gt="function",yt=Math.round,bt=Math.abs,xt=Date.now;ht="function"!=typeof Object.assign?function(t){
	var arguments$1 = arguments;
	if(t===s||null===t){ throw new TypeError("Cannot convert undefined or null to object"); }for(var e=Object(t),n=1;n<arguments.length;n++){var r=arguments$1[n];if(r!==s&&null!==r){ for(var i in r){ r.hasOwnProperty(i)&&(e[i]=r[i]); } }}return e}:Object.assign;var Tt=f(function(t,e,n){for(var r=Object.keys(e),i=0;i<r.length;){ (!n||n&&t[r[i]]===s)&&(t[r[i]]=e[r[i]]),i++; }return t},"extend","Use `assign`."),wt=f(function(t,e){return Tt(t,e,!0)},"merge","Use `assign`."),Et=1,Ct=/mobile|tablet|ip(ad|hone|od)|android/i,St="ontouchstart"in i,Ot=C(i,"PointerEvent")!==s,At=St&&Ct.test(navigator.userAgent),It=25,Mt=1,Pt=2,Lt=4,kt=8,jt=1,Nt=2,_t=4,Xt=8,Dt=16,Rt=Nt|_t,Ft=Xt|Dt,zt=Rt|Ft,Yt=["x","y"],qt=["clientX","clientY"];A.prototype={handler:function(){},init:function(){this.evEl&&v(this.element,this.evEl,this.domHandler),this.evTarget&&v(this.target,this.evTarget,this.domHandler),this.evWin&&v(O(this.element),this.evWin,this.domHandler);},destroy:function(){this.evEl&&g(this.element,this.evEl,this.domHandler),this.evTarget&&g(this.target,this.evTarget,this.domHandler),this.evWin&&g(O(this.element),this.evWin,this.domHandler);}};var Ht={mousedown:Mt,mousemove:Pt,mouseup:Lt},Vt="mousedown",Wt="mousemove mouseup";p(Y,A,{handler:function(t){var e=Ht[t.type];e&Mt&&0===t.button&&(this.pressed=!0),e&Pt&&1!==t.which&&(e=Lt),this.pressed&&(e&Lt&&(this.pressed=!1),this.callback(this.manager,e,{pointers:[t],changedPointers:[t],pointerType:"mouse",srcEvent:t}));}});var Ut={pointerdown:Mt,pointermove:Pt,pointerup:Lt,pointercancel:kt,pointerout:kt},Bt={2:"touch",3:"pen",4:"mouse",5:"kinect"},$t="pointerdown",Gt="pointermove pointerup pointercancel";i.MSPointerEvent&&!i.PointerEvent&&($t="MSPointerDown",Gt="MSPointerMove MSPointerUp MSPointerCancel"),p(q,A,{handler:function(t){var e=this.store,n=!1,r=t.type.toLowerCase().replace("ms",""),i=Ut[r],o=Bt[t.pointerType]||t.pointerType,a="touch"==o,s=T(e,t.pointerId,"pointerId");i&Mt&&(0===t.button||a)?s<0&&(e.push(t),s=e.length-1):i&(Lt|kt)&&(n=!0),s<0||(e[s]=t,this.callback(this.manager,i,{pointers:e,changedPointers:[t],pointerType:o,srcEvent:t}),n&&e.splice(s,1));}});var Zt={touchstart:Mt,touchmove:Pt,touchend:Lt,touchcancel:kt},Qt="touchstart",Jt="touchstart touchmove touchend touchcancel";p(H,A,{handler:function(t){var e=Zt[t.type];if(e===Mt&&(this.started=!0),this.started){var n=V.call(this,t,e);e&(Lt|kt)&&n[0].length-n[1].length==0&&(this.started=!1),this.callback(this.manager,e,{pointers:n[0],changedPointers:n[1],pointerType:"touch",srcEvent:t});}}});var Kt={touchstart:Mt,touchmove:Pt,touchend:Lt,touchcancel:kt},te="touchstart touchmove touchend touchcancel";p(W,A,{handler:function(t){var e=Kt[t.type],n=U.call(this,t,e);n&&this.callback(this.manager,e,{pointers:n[0],changedPointers:n[1],pointerType:"touch",srcEvent:t});}});var ee=2500,ne=25;p(B,A,{handler:function(t,e,n){var r="touch"==n.pointerType,i="mouse"==n.pointerType;if(!(i&&n.sourceCapabilities&&n.sourceCapabilities.firesTouchEvents)){if(r){ $.call(this,e,n); }else if(i&&Z.call(this,n)){ return; }this.callback(t,e,n);}},destroy:function(){this.touch.destroy(),this.mouse.destroy();}});var re=C(vt.style,"touchAction"),ie=re!==s,oe="auto",ae="manipulation",se="none",ce="pan-x",ue="pan-y",le=function(){if(!ie){ return !1; }var t={},e=i.CSS&&i.CSS.supports;return ["auto","manipulation","pan-y","pan-x","pan-x pan-y","none"].forEach(function(n){t[n]=!e||i.CSS.supports("touch-action",n);}),t}();Q.prototype={set:function(t){"compute"==t&&(t=this.compute()),ie&&this.manager.element.style&&le[t]&&(this.manager.element.style[re]=t),this.actions=t.toLowerCase().trim();},update:function(){this.set(this.manager.options.touchAction);},compute:function(){var t=[];return l(this.manager.recognizers,function(e){h(e.options.enable,[e])&&(t=t.concat(e.getTouchAction()));}),J(t.join(" "))},preventDefaults:function(t){var e=t.srcEvent,n=t.offsetDirection;if(this.manager.session.prevented){ return void e.preventDefault(); }var r=this.actions,i=b(r,se)&&!le[se],o=b(r,ue)&&!le[ue],a=b(r,ce)&&!le[ce];if(i){var s=1===t.pointers.length,c=t.distance<2,u=t.deltaTime<250;if(s&&c&&u){ return }}return a&&o?void 0:i||o&&n&Rt||a&&n&Ft?this.preventSrc(e):void 0},preventSrc:function(t){this.manager.session.prevented=!0,t.preventDefault();}};var fe=1,pe=2,de=4,he=8,me=he,ve=16;K.prototype={defaults:{},set:function(t){return ht(this.options,t),this.manager&&this.manager.touchAction.update(),this},recognizeWith:function(t){if(u(t,"recognizeWith",this)){ return this; }var e=this.simultaneous;return t=nt(t,this),e[t.id]||(e[t.id]=t,t.recognizeWith(this)),this},dropRecognizeWith:function(t){return u(t,"dropRecognizeWith",this)?this:(t=nt(t,this),delete this.simultaneous[t.id],this)},requireFailure:function(t){if(u(t,"requireFailure",this)){ return this; }var e=this.requireFail;return t=nt(t,this),-1===T(e,t)&&(e.push(t),t.requireFailure(this)),this},dropRequireFailure:function(t){if(u(t,"dropRequireFailure",this)){ return this; }t=nt(t,this);var e=T(this.requireFail,t);return e>-1&&this.requireFail.splice(e,1),this},hasRequireFailures:function(){return this.requireFail.length>0},canRecognizeWith:function(t){return !!this.simultaneous[t.id]},emit:function(t){function e(e){n.manager.emit(e,t);}var n=this,r=this.state;r<he&&e(n.options.event+tt(r)),e(n.options.event),t.additionalEvent&&e(t.additionalEvent),r>=he&&e(n.options.event+tt(r));},tryEmit:function(t){if(this.canEmit()){ return this.emit(t); }this.state=32;},canEmit:function(){for(var t=0;t<this.requireFail.length;){if(!(this.requireFail[t].state&(32|fe))){ return !1; }t++;}return !0},recognize:function(t){var e=ht({},t);if(!h(this.options.enable,[this,e])){ return this.reset(),void(this.state=32); }this.state&(me|ve|32)&&(this.state=fe),this.state=this.process(e),this.state&(pe|de|he|ve)&&this.tryEmit(e);},process:function(t){},getTouchAction:function(){},reset:function(){}},p(rt,K,{defaults:{pointers:1},attrTest:function(t){var e=this.options.pointers;return 0===e||t.pointers.length===e},process:function(t){var e=this.state,n=t.eventType,r=e&(pe|de),i=this.attrTest(t);return r&&(n&kt||!i)?e|ve:r||i?n&Lt?e|he:e&pe?e|de:pe:32}}),p(it,rt,{defaults:{event:"pan",threshold:10,pointers:1,direction:zt},getTouchAction:function(){var t=this.options.direction,e=[];return t&Rt&&e.push(ue),t&Ft&&e.push(ce),e},directionTest:function(t){var e=this.options,n=!0,r=t.distance,i=t.direction,o=t.deltaX,a=t.deltaY;return i&e.direction||(e.direction&Rt?(i=0===o?jt:o<0?Nt:_t,n=o!=this.pX,r=Math.abs(t.deltaX)):(i=0===a?jt:a<0?Xt:Dt,n=a!=this.pY,r=Math.abs(t.deltaY))),t.direction=i,n&&r>e.threshold&&i&e.direction},attrTest:function(t){return rt.prototype.attrTest.call(this,t)&&(this.state&pe||!(this.state&pe)&&this.directionTest(t))},emit:function(t){this.pX=t.deltaX,this.pY=t.deltaY;var e=et(t.direction);e&&(t.additionalEvent=this.options.event+e),this._super.emit.call(this,t);}}),p(ot,rt,{defaults:{event:"pinch",threshold:0,pointers:2},getTouchAction:function(){return [se]},attrTest:function(t){return this._super.attrTest.call(this,t)&&(Math.abs(t.scale-1)>this.options.threshold||this.state&pe)},emit:function(t){if(1!==t.scale){var e=t.scale<1?"in":"out";t.additionalEvent=this.options.event+e;}this._super.emit.call(this,t);}}),p(at,K,{defaults:{event:"press",pointers:1,time:251,threshold:9},getTouchAction:function(){return [oe]},process:function(t){var e=this.options,n=t.pointers.length===e.pointers,r=t.distance<e.threshold,i=t.deltaTime>e.time;if(this._input=t,!r||!n||t.eventType&(Lt|kt)&&!i){ this.reset(); }else if(t.eventType&Mt){ this.reset(),this._timer=c(function(){this.state=me,this.tryEmit();},e.time,this); }else if(t.eventType&Lt){ return me; }return 32},reset:function(){clearTimeout(this._timer);},emit:function(t){this.state===me&&(t&&t.eventType&Lt?this.manager.emit(this.options.event+"up",t):(this._input.timeStamp=xt(),this.manager.emit(this.options.event,this._input)));}}),p(st,rt,{defaults:{event:"rotate",threshold:0,pointers:2},getTouchAction:function(){return [se]},attrTest:function(t){return this._super.attrTest.call(this,t)&&(Math.abs(t.rotation)>this.options.threshold||this.state&pe)}}),p(ct,rt,{defaults:{event:"swipe",threshold:10,velocity:.3,direction:Rt|Ft,pointers:1},getTouchAction:function(){return it.prototype.getTouchAction.call(this)},attrTest:function(t){var e,n=this.options.direction;return n&(Rt|Ft)?e=t.overallVelocity:n&Rt?e=t.overallVelocityX:n&Ft&&(e=t.overallVelocityY),this._super.attrTest.call(this,t)&&n&t.offsetDirection&&t.distance>this.options.threshold&&t.maxPointers==this.options.pointers&&bt(e)>this.options.velocity&&t.eventType&Lt},emit:function(t){var e=et(t.offsetDirection);e&&this.manager.emit(this.options.event+e,t),this.manager.emit(this.options.event,t);}}),p(ut,K,{defaults:{event:"tap",pointers:1,taps:1,interval:300,time:250,threshold:9,posThreshold:10},getTouchAction:function(){return [ae]},process:function(t){var e=this.options,n=t.pointers.length===e.pointers,r=t.distance<e.threshold,i=t.deltaTime<e.time;if(this.reset(),t.eventType&Mt&&0===this.count){ return this.failTimeout(); }if(r&&i&&n){if(t.eventType!=Lt){ return this.failTimeout(); }var o=!this.pTime||t.timeStamp-this.pTime<e.interval,a=!this.pCenter||D(this.pCenter,t.center)<e.posThreshold;this.pTime=t.timeStamp,this.pCenter=t.center,a&&o?this.count+=1:this.count=1,this._input=t;if(0===this.count%e.taps){ return this.hasRequireFailures()?(this._timer=c(function(){this.state=me,this.tryEmit();},e.interval,this),pe):me }}return 32},failTimeout:function(){return this._timer=c(function(){this.state=32;},this.options.interval,this),32},reset:function(){clearTimeout(this._timer);},emit:function(){this.state==me&&(this._input.tapCount=this.count,this.manager.emit(this.options.event,this._input));}}),lt.VERSION="2.0.7",lt.defaults={domEvents:!1,touchAction:"compute",enable:!0,inputTarget:null,inputClass:null,preset:[[st,{enable:!1}],[ot,{enable:!1},["rotate"]],[ct,{direction:Rt}],[it,{direction:Rt},["swipe"]],[ut],[ut,{event:"doubletap",taps:2},["tap"]],[at]],cssProps:{userSelect:"none",touchSelect:"none",touchCallout:"none",contentZooming:"none",userDrag:"none",tapHighlightColor:"rgba(0,0,0,0)"}};ft.prototype={set:function(t){return ht(this.options,t),t.touchAction&&this.touchAction.update(),t.inputTarget&&(this.input.destroy(),this.input.target=t.inputTarget,this.input.init()),this},stop:function(t){this.session.stopped=t?2:1;},recognize:function(t){var e=this.session;if(!e.stopped){this.touchAction.preventDefaults(t);var n,r=this.recognizers,i=e.curRecognizer;(!i||i&&i.state&me)&&(i=e.curRecognizer=null);for(var o=0;o<r.length;){ n=r[o],2===e.stopped||i&&n!=i&&!n.canRecognizeWith(i)?n.reset():n.recognize(t),!i&&n.state&(pe|de|he)&&(i=e.curRecognizer=n),o++; }}},get:function(t){if(t instanceof K){ return t; }for(var e=this.recognizers,n=0;n<e.length;n++){ if(e[n].options.event==t){ return e[n]; } }return null},add:function(t){if(u(t,"add",this)){ return this; }var e=this.get(t.options.event);return e&&this.remove(e),this.recognizers.push(t),t.manager=this,this.touchAction.update(),t},remove:function(t){if(u(t,"remove",this)){ return this; }if(t=this.get(t)){var e=this.recognizers,n=T(e,t);-1!==n&&(e.splice(n,1),this.touchAction.update());}return this},on:function(t,e){if(t!==s&&e!==s){var n=this.handlers;return l(x(t),function(t){n[t]=n[t]||[],n[t].push(e);}),this}},off:function(t,e){if(t!==s){var n=this.handlers;return l(x(t),function(t){e?n[t]&&n[t].splice(T(n[t],e),1):delete n[t];}),this}},emit:function(t,e){this.options.domEvents&&dt(t,e);var n=this.handlers[t]&&this.handlers[t].slice();if(n&&n.length){e.type=t,e.preventDefault=function(){e.srcEvent.preventDefault();};for(var r=0;r<n.length;){ n[r](e),r++; }}},destroy:function(){this.element&&pt(this,!1),this.handlers={},this.session={},this.input.destroy(),this.element=null;}},ht(lt,{INPUT_START:Mt,INPUT_MOVE:Pt,INPUT_END:Lt,INPUT_CANCEL:kt,STATE_POSSIBLE:fe,STATE_BEGAN:pe,STATE_CHANGED:de,STATE_ENDED:he,STATE_RECOGNIZED:me,STATE_CANCELLED:ve,STATE_FAILED:32,DIRECTION_NONE:jt,DIRECTION_LEFT:Nt,DIRECTION_RIGHT:_t,DIRECTION_UP:Xt,DIRECTION_DOWN:Dt,DIRECTION_HORIZONTAL:Rt,DIRECTION_VERTICAL:Ft,DIRECTION_ALL:zt,Manager:ft,Input:A,TouchAction:Q,TouchInput:W,MouseInput:Y,PointerEventInput:q,TouchMouseInput:B,SingleTouchInput:H,Recognizer:K,AttrRecognizer:rt,Tap:ut,Pan:it,Swipe:ct,Pinch:ot,Rotate:st,Press:at,on:v,off:g,each:l,merge:wt,extend:Tt,assign:ht,inherit:p,bindFn:d,prefixed:C}),(void 0!==i?i:"undefined"!=typeof self?self:{}).Hammer=lt,(r=function(){return lt}.call(e,n,e,t))!==s&&(t.exports=r);}(window,document);},function(t,e){t.exports=function(t,e,n){for(var r=(2<<Math.log(e.length-1)/Math.LN2)-1,i=Math.ceil(1.6*r*n/e.length),o="";;){ for(var a=t(i),s=0;s<i;s++){var c=a[s]&r;if(e[c]&&(o+=e[c],o.length===n)){ return o }} }};},function(t,e,n){function r(t){var e="",n=Math.floor(.001*(Date.now()-s));return n===o?i++:(i=0,o=n),e+=a(c),e+=a(t),i>0&&(e+=a(i)),e+=a(n)}var i,o,a=n(15),s=(n(0),1459707606518),c=6;t.exports=r;},function(t,e,n){function r(t){for(var e,n=0,r="";!e;){ r+=a(o,i.get(),1),e=t<Math.pow(16,n+1),n++; }return r}var i=n(0),o=n(18),a=n(13);t.exports=r;},function(t,e,n){function r(e){return s.seed(e),t.exports}function i(e){return l=e,t.exports}function o(t){return void 0!==t&&s.characters(t),s.shuffled()}function a(){return c(l)}var s=n(0),c=n(14),u=n(17),l=n(20)||0;t.exports=a,t.exports.generate=a,t.exports.seed=r,t.exports.worker=i,t.exports.characters=o,t.exports.isValid=u;},function(t,e,n){function r(t){return !(!t||"string"!=typeof t||t.length<6)&&!new RegExp("[^"+i.get().replace(/[|\\{}()[\]^$+*?.-]/g,"\\$&")+"]").test(t)}var i=n(0);t.exports=r;},function(t,e,n){var r,i="object"==typeof window&&(window.crypto||window.msCrypto);r=i&&i.getRandomValues?function(t){return i.getRandomValues(new Uint8Array(t))}:function(t){for(var e=[],n=0;n<t;n++){ e.push(Math.floor(256*Math.random())); }return e},t.exports=r;},function(t,e,n){function r(){return (o=(9301*o+49297)%233280)/233280}function i(t){o=t;}var o=1;t.exports={nextValue:r,seed:i};},function(t,e,n){t.exports=0;},function(t,e){t.exports=function(t,e,n,r){var i,o=t=t||{},a=typeof t.default;"object"!==a&&"function"!==a||(i=t,o=t.default);var s="function"==typeof o?o.options:o;if(e&&(s.render=e.render,s.staticRenderFns=e.staticRenderFns),n&&(s._scopeId=n),r){var c=Object.create(s.computed||null);Object.keys(r).forEach(function(t){var e=r[t];c[t]=function(){return e};}),s.computed=c;}return {esModule:i,exports:o,options:s}};},function(t,e,n){var r=n(9);"string"==typeof r&&(r=[[t.i,r,""]]),r.locals&&(t.exports=r.locals);n(23)("02af2e15",r,!0,{});},function(t,e,n){function r(t){for(var e=0;e<t.length;e++){var n=t[e],r=l[n.id];if(r){r.refs++;for(var i=0;i<r.parts.length;i++){ r.parts[i](n.parts[i]); }for(;i<n.parts.length;i++){ r.parts.push(o(n.parts[i])); }r.parts.length>n.parts.length&&(r.parts.length=n.parts.length);}else{for(var a=[],i=0;i<n.parts.length;i++){ a.push(o(n.parts[i])); }l[n.id]={id:n.id,refs:1,parts:a};}}}function i(){var t=document.createElement("style");return t.type="text/css",f.appendChild(t),t}function o(t){var e,n,r=document.querySelector("style["+g+'~="'+t.id+'"]');if(r){if(h){ return m; }r.parentNode.removeChild(r);}if(y){var o=d++;r=p||(p=i()),e=a.bind(null,r,o,!1),n=a.bind(null,r,o,!0);}else { r=i(),e=s.bind(null,r),n=function(){r.parentNode.removeChild(r);}; }return e(t),function(r){if(r){if(r.css===t.css&&r.media===t.media&&r.sourceMap===t.sourceMap){ return; }e(t=r);}else { n(); }}}function a(t,e,n,r){var i=n?"":r.css;if(t.styleSheet){ t.styleSheet.cssText=b(e,i); }else{var o=document.createTextNode(i),a=t.childNodes;a[e]&&t.removeChild(a[e]),a.length?t.insertBefore(o,a[e]):t.appendChild(o);}}function s(t,e){var n=e.css,r=e.media,i=e.sourceMap;if(r&&t.setAttribute("media",r),v.ssrId&&t.setAttribute(g,e.id),i&&(n+="\n/*# sourceURL="+i.sources[0]+" */",n+="\n/*# sourceMappingURL=data:application/json;base64,"+btoa(unescape(encodeURIComponent(JSON.stringify(i))))+" */"),t.styleSheet){ t.styleSheet.cssText=n; }else{for(;t.firstChild;){ t.removeChild(t.firstChild); }t.appendChild(document.createTextNode(n));}}var c="undefined"!=typeof document;if("undefined"!=typeof DEBUG&&DEBUG&&!c){ throw new Error("vue-style-loader cannot be used in a non-browser environment. Use { target: 'node' } in your Webpack config to indicate a server-rendering environment."); }var u=n(24),l={},f=c&&(document.head||document.getElementsByTagName("head")[0]),p=null,d=0,h=!1,m=function(){},v=null,g="data-vue-ssr-id",y="undefined"!=typeof navigator&&/msie [6-9]\b/.test(navigator.userAgent.toLowerCase());t.exports=function(t,e,n,i){h=n,v=i||{};var o=u(t,e);return r(o),function(e){for(var n=[],i=0;i<o.length;i++){var a=o[i],s=l[a.id];s.refs--,n.push(s);}e?(o=u(t,e),r(o)):o=[];for(var i=0;i<n.length;i++){var s=n[i];if(0===s.refs){for(var c=0;c<s.parts.length;c++){ s.parts[c](); }delete l[s.id];}}}};var b=function(){var t=[];return function(e,n){return t[e]=n,t.filter(Boolean).join("\n")}}();},function(t,e){t.exports=function(t,e){for(var n=[],r={},i=0;i<e.length;i++){var o=e[i],a=o[0],s=o[1],c=o[2],u=o[3],l={id:t+":"+i,css:s,media:c,sourceMap:u};r[a]?r[a].parts.push(l):n.push(r[a]={id:a,parts:[l]});}return n};},function(t,e){var n;n=function(){return this}();try{n=n||Function("return this")()||(0, eval)("this");}catch(t){"object"==typeof window&&(n=window);}t.exports=n;}])});
	});

	var toasted = unwrapExports(vueToasted_min);

	Vuep.config = function(opts) {
	  Vuep.props.options.default = function () { return opts; };
	};

	function install(Vue, opts) {
	  Vuep.config(opts);
	  Vue.component(Vuep.name, Vuep);
	  Vue.use(toasted);
	  //Vue.component(VueGridLayout.GridLayout.name, VueGridLayout.GridLayout)
	  //Vue.component(VueGridLayout.GridItem.name, VueGridLayout.GridItem)
	}

	Vuep.install = install;

	if (typeof Vue !== "undefined") {
	  Vue.use(install); // eslint-disable-line
	}

	return Vuep;

}(Vue));
