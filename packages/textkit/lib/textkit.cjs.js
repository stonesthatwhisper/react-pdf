'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var fns = require('@react-pdf/fns');
var _extends = require('@babel/runtime/helpers/extends');
var _objectWithoutPropertiesLoose = require('@babel/runtime/helpers/objectWithoutPropertiesLoose');
var _createForOfIteratorHelperLoose = require('@babel/runtime/helpers/createForOfIteratorHelperLoose');
var unicode = require('unicode-properties');
var hyphen = require('hyphen');
var pattern = require('hyphen/patterns/en-us');

function _interopDefaultLegacy(e) {
  return e && typeof e === 'object' && 'default' in e ? e : { default: e };
}

var _extends__default = /*#__PURE__*/ _interopDefaultLegacy(_extends);
var _objectWithoutPropertiesLoose__default = /*#__PURE__*/ _interopDefaultLegacy(
  _objectWithoutPropertiesLoose,
);
var _createForOfIteratorHelperLoose__default = /*#__PURE__*/ _interopDefaultLegacy(
  _createForOfIteratorHelperLoose,
);
var unicode__default = /*#__PURE__*/ _interopDefaultLegacy(unicode);
var hyphen__default = /*#__PURE__*/ _interopDefaultLegacy(hyphen);
var pattern__default = /*#__PURE__*/ _interopDefaultLegacy(pattern);

/**
 * Create attributed string from text fragments
 *
 * @param  {Array}  fragments
 * @return {Object} attributed string
 */
var fromFragments = function fromFragments(fragments) {
  var offset = 0;
  var string = '';
  var runs = [];
  fragments.forEach(function(fragment) {
    string += fragment.string;
    runs.push({
      start: offset,
      end: offset + fragment.string.length,
      attributes: fragment.attributes || {},
    });
    offset += fragment.string.length;
  });
  return {
    string: string,
    runs: runs,
  };
};

/**
 * Default word hyphenation engine used when no one provided.
 * Does not perform word hyphenation at all
 *
 * @param  {String} word
 * @return {Array} same word
 */

var defaultHyphenationEngine = function defaultHyphenationEngine(word) {
  return [word];
};
/**
 * Wrap words of attribute string
 *
 * @param  {Object} layout engines
 * @param  {Object}  layout options
 * @param  {Object}  attributed string
 * @return {Object} attributed string including syllables
 */

var wrapWords = function wrapWords(engines, options) {
  if (engines === void 0) {
    engines = {};
  }

  if (options === void 0) {
    options = {};
  }

  return function(attributedString) {
    var _engines$wordHyphenat, _engines;

    var syllables = [];
    var fragments = [];
    var hyphenateWord =
      options.hyphenationCallback ||
      ((_engines$wordHyphenat = (_engines = engines).wordHyphenation) ===
        null || _engines$wordHyphenat === void 0
        ? void 0
        : _engines$wordHyphenat.call(_engines, options)) ||
      defaultHyphenationEngine;

    for (var i = 0; i < attributedString.runs.length; i += 1) {
      var string = '';
      var run = attributedString.runs[i];
      var words = attributedString.string
        .slice(run.start, run.end)
        .split(/([ ]+)/g)
        .filter(Boolean);

      for (var j = 0; j < words.length; j += 1) {
        var word = words[j];
        var parts = hyphenateWord(word);
        syllables.push.apply(syllables, parts);
        string += parts.join('');
      }

      fragments.push({
        string: string,
        attributes: run.attributes,
      });
    }

    return _extends__default['default']({}, fromFragments(fragments), {
      syllables: syllables,
    });
  };
};

/**
 * Clone rect
 *
 * @param  {Object}  rect
 * @return {Object} cloned rect
 */
var copy = function copy(rect) {
  return Object.assign({}, rect);
};

var partition = function partition(rect, height) {
  var a = Object.assign({}, rect, {
    height: height,
  });
  var b = Object.assign({}, rect, {
    y: rect.y + height,
    height: rect.height - height,
  });
  return [a, b];
};

/**
 * Crop upper section of rect
 *
 * @param  {Object}  rect
 * @return {Object} cropped rect
 */

var crop = function crop(height, rect) {
  var _partition = partition(rect, height),
    result = _partition[1];

  return result;
};

/**
 * Get paragraph block height
 *
 * @param  {Object}  paragraph block
 * @return {number} paragraph block height
 */
var height$2 = function height(paragraph) {
  return paragraph.reduce(function(acc, block) {
    return acc + block.box.height;
  }, 0);
};

/**
 * Calculate run scale
 *
 * @param  {Object}  run
 * @return {number} scale
 */
var calculateScale = function calculateScale(run) {
  var _attributes$font;

  var attributes = run.attributes || {};
  var fontSize = attributes.fontSize || 12;
  var unitsPerEm =
    (_attributes$font = attributes.font) === null || _attributes$font === void 0
      ? void 0
      : _attributes$font.unitsPerEm;
  return unitsPerEm ? fontSize / unitsPerEm : 0;
};
/**
 * Get run scale
 *
 * @param  {Object}  run
 * @return {number} scale
 */

var scale = function scale(run) {
  var _run$attributes;

  return (
    ((_run$attributes = run.attributes) === null || _run$attributes === void 0
      ? void 0
      : _run$attributes.scale) || calculateScale(run)
  );
};

/**
 * Get ligature offset by index
 *
 * Ex. ffi ligature
 *
 *   glyphs:         l  o  f  f  i  m
 *   glyphIndices:   0  1  2  2  2  3
 *   offset:         0  0  0  1  2  0
 *
 * @param  {number}  index
 * @param  {Object}  run
 * @return {number} ligature offset
 */
var offset = function offset(index, run) {
  if (!run) return 0;
  var glyphIndices = run.glyphIndices || [];
  var value = glyphIndices[index];
  return glyphIndices.slice(0, index).filter(function(i) {
    return i === value;
  }).length;
};

/**
 * Get run font
 *
 * @param  {Object}  run
 * @return {Object} font
 */
var getFont = function getFont(run) {
  var _run$attributes;

  return (
    ((_run$attributes = run.attributes) === null || _run$attributes === void 0
      ? void 0
      : _run$attributes.font) || null
  );
};

/**
 * Slice glyph between codePoints range
 * Util for breaking ligatures
 *
 * @param  {number}  start code point index
 * @param  {number}  end code point index
 * @param  {Object}  font to generate new glyph
 * @param  {Object} glyph to be sliced
 * @return {Array} sliced glyph parts
 */
var slice$2 = function slice(start, end, font, glyph) {
  if (!glyph) return [];
  if (start === end) return [];
  if (start === 0 && end === glyph.codePoints.length) return [glyph];
  var codePoints = glyph.codePoints.slice(start, end);
  var string = String.fromCodePoint.apply(String, codePoints);
  return font ? font.layout(string).glyphs : [glyph];
};

/**
 * Return glyph index at string index, if glyph indices present.
 * Otherwise return string index
 *
 * @param  {number}  string index
 * @param  {Object}  run
 * @return {number}  glyph index
 */

var glyphIndexAt = function glyphIndexAt(index, run) {
  var _run$glyphIndices;

  var result =
    run === null || run === void 0
      ? void 0
      : (_run$glyphIndices = run.glyphIndices) === null ||
        _run$glyphIndices === void 0
      ? void 0
      : _run$glyphIndices[index];
  return fns.isNil(result) ? index : result;
};

/**
 * Returns new array starting with zero, and keeping same relation between consecutive values
 *
 * @param  {Array[number]}  list
 * @return {boolean} normalized array
 */
var normalize = function normalize(array) {
  var head = array[0];
  return array.map(function(value) {
    return value - head;
  });
};

/**
 * Slice run between glyph indices range
 *
 * @param  {number}  start glyph index
 * @param  {number}  end glyph index
 * @param  {Object}  run
 * @return {Object} sliced run
 */

var slice$1 = function slice(start, end, run) {
  var _run$glyphs, _run$glyphs2;

  var runScale = scale(run);
  var font = getFont(run); // Get glyph start and end indices

  var startIndex = glyphIndexAt(start, run);
  var endIndex = glyphIndexAt(end, run); // Get start and end glyph

  var startGlyph =
    (_run$glyphs = run.glyphs) === null || _run$glyphs === void 0
      ? void 0
      : _run$glyphs[startIndex];
  var endGlyph =
    (_run$glyphs2 = run.glyphs) === null || _run$glyphs2 === void 0
      ? void 0
      : _run$glyphs2[endIndex]; // Get start ligature chunks (if any)

  var startOffset = offset(start, run);
  var startGlyphs =
    startOffset > 0 ? slice$2(startOffset, Infinity, font, startGlyph) : []; // Get end ligature chunks (if any)

  var endOffset = offset(end, run);
  var endGlyphs = slice$2(0, endOffset, font, endGlyph); // Compute new glyphs

  var sliceStart = startIndex + Math.min(1, startOffset);
  var glyphs = (run.glyphs || []).slice(sliceStart, endIndex); // Compute new positions

  var glyphPosition = function glyphPosition(g) {
    return {
      xAdvance: g.advanceWidth * runScale,
    };
  };

  var startPositions = startGlyphs.map(glyphPosition);
  var positions = (run.positions || []).slice(sliceStart, endIndex);
  var endPositions = endGlyphs.map(glyphPosition);
  return Object.assign({}, run, {
    start: run.start + start,
    end: Math.min(run.end, run.start + end),
    glyphIndices: normalize((run.glyphIndices || []).slice(start, end)),
    glyphs: [startGlyphs, glyphs, endGlyphs].flat(),
    positions: [startPositions, positions, endPositions].flat(),
  });
};

/**
 * Get run index that contains passed index
 *
 * @param  {number}  char index
 * @param  {Array}  runs array
 * @return {Array} run index
 */
var runIndexAt$1 = function runIndexAt(n, runs) {
  if (!runs) return -1;
  return runs.findIndex(function(run) {
    return run.start <= n && n < run.end;
  });
};

/**
 * Filter runs contained between start and end
 *
 * @param  {number}  start
 * @param  {number}  end
 * @param  {Array}  runs
 * @return {boolean} filtered runs
 */

var filter = function filter(start, end, runs) {
  var startIndex = runIndexAt$1(start, runs);
  var endIndex = Math.max(runIndexAt$1(end - 1, runs), startIndex);
  return runs.slice(startIndex, endIndex + 1);
};

/**
 * Subtract scalar to run
 *
 * @param  {number}  scalar
 * @param  {Object}  run
 * @return {Object} subtracted run
 */
var subtract = function subtract(n, run) {
  var start = run.start - n;
  var end = run.end - n;
  return Object.assign({}, run, {
    start: start,
    end: end,
  });
};

/**
 * Slice array of runs
 *
 * @param  {number}  start offset
 * @param  {number}  end offset
 * @param  {Array}  runs
 * @return {Array} sliced runs
 */

var sliceRuns = function sliceRuns(start, end, runs) {
  var sliceFirstRun = function sliceFirstRun(a) {
    return slice$1(start - a.start, end - a.start, a);
  };

  var sliceLastRun = function sliceLastRun(a) {
    return slice$1(0, end - a.start, a);
  };

  return runs.map(function(run, i) {
    var result = run;
    var isFirst = i === 0;
    var isLast = !isFirst && i === runs.length - 1;
    if (isFirst) result = sliceFirstRun(run);
    if (isLast) result = sliceLastRun(run);
    return subtract(start, result);
  });
};
/**
 * Slice attributed string between two indices
 *
 * @param  {number}  start offset
 * @param  {number}  end offset
 * @param  {Object}  attributedString
 * @return {Object} attributedString
 */

var slice = function slice(start, end, attributedString) {
  if (attributedString.string.length === 0) return attributedString;
  var string = attributedString.string.slice(start, end);
  var filteredRuns = filter(start, end, attributedString.runs);
  var slicedRuns = sliceRuns(start, end, filteredRuns);
  return Object.assign({}, attributedString, {
    string: string,
    runs: slicedRuns,
  });
};

var findCharIndex = function findCharIndex(string) {
  return string.search(/\S/g);
};

var findLastCharIndex = function findLastCharIndex(string) {
  var match = string.match(/\S/g);
  return match ? string.lastIndexOf(match[match.length - 1]) : -1;
};
/**
 * Removes (strips) whitespace from both ends of the attributted string.
 *
 * @param  {Object}  attributedString
 * @return {Object} attributedString
 */

var trim = function trim(attributedString) {
  var start = findCharIndex(attributedString.string);
  var end = findLastCharIndex(attributedString.string);
  return slice(start, end + 1, attributedString);
};

/**
 * Returns empty run
 *
 * @return {Object} empty run
 */
var empty$1 = function empty() {
  return {
    start: 0,
    end: 0,
    glyphIndices: [],
    glyphs: [],
    positions: [],
    attributes: {},
  };
};

var isNumber = function isNumber(value) {
  return typeof value === 'number';
};

/**
 * Append glyph indices with given length
 *
 * Ex. appendIndices(3, [0, 1, 2, 2]) => [0, 1, 2, 2, 3, 3, 3]
 *
 * @param  {number}  length
 * @param  {Array}  glyph indices
 * @return {Array}  extended glyph indices
 */

var appendIndices = function appendIndices(length, indices) {
  var lastIndex = fns.last(indices);
  var value = fns.isNil(lastIndex) ? 0 : lastIndex + 1;
  var newIndices = Array(length).fill(value);
  return indices.concat(newIndices);
};

/**
 * Get glyph for a given code point
 *
 * @param  {number}  codePoint
 * @param  {Object}  font
 * @return {Object}  glyph
 * */
var fromCodePoint = function fromCodePoint(value, font) {
  return font && value ? font.glyphForCodePoint(value) : null;
};

/**
 * Append glyph to run
 *
 * @param  {Object}  glyph
 * @param  {Object}  run
 * @return {Object} run with glyph
 */

var appendGlyph = function appendGlyph(glyph, run) {
  var _glyph$codePoints;

  var glyphLength =
    ((_glyph$codePoints = glyph.codePoints) === null ||
    _glyph$codePoints === void 0
      ? void 0
      : _glyph$codePoints.length) || 0;
  var end = run.end + glyphLength;
  var glyphs = run.glyphs.concat(glyph);
  var glyphIndices = appendIndices(glyphLength, run.glyphIndices);
  if (!run.positions)
    return Object.assign({}, run, {
      end: end,
      glyphs: glyphs,
      glyphIndices: glyphIndices,
    });
  var positions = run.positions.concat({
    xAdvance: glyph.advanceWidth * scale(run),
  });
  return Object.assign({}, run, {
    end: end,
    glyphs: glyphs,
    glyphIndices: glyphIndices,
    positions: positions,
  });
};
/**
 * Append glyph or code point to run
 *
 * @param  {Object | number}  glyph | codePoint
 * @param  {Object}  run
 * @return {Object} run with glyph
 */

var append$1 = function append(value, run) {
  if (!value) return run;
  var font = getFont(run);
  var glyph = isNumber(value) ? fromCodePoint(value, font) : value;
  return appendGlyph(glyph, run);
};

/**
 * Get string from array of code points
 *
 * @param {Array} code points
 * @return {String} string
 */
var stringFromCodePoints = function stringFromCodePoints(codePoints) {
  return String.fromCodePoint.apply(String, codePoints);
};

/**
 * Append glyph into last run of attributed string
 *
 * @param {Object} glyph
 * @param {Object} attributed string
 * @return {Object} attributed string with new glyph
 */

var append = function append(glyph, attributedString) {
  var codePoints =
    (glyph === null || glyph === void 0 ? void 0 : glyph.codePoints) || [];
  var codePointsString = stringFromCodePoints(codePoints);
  var string = attributedString.string + codePointsString;
  var firstRuns = attributedString.runs.slice(0, -1);
  var lastRun = fns.last(attributedString.runs) || empty$1();
  var runs = firstRuns.concat(append$1(glyph, lastRun));
  return Object.assign({}, attributedString, {
    string: string,
    runs: runs,
  });
};

var ELLIPSIS_UNICODE = 8230;
var ELLIPSIS_STRING = String.fromCharCode(ELLIPSIS_UNICODE);
/**
 * Get ellipsis codepoint. This may be different in standard and embedded fonts
 *
 * @param  {number}  font
 * @return {Object} ellipsis codepoint
 */

var getEllipsisCodePoint = function getEllipsisCodePoint(font) {
  if (!font.encode) return ELLIPSIS_UNICODE;

  var _font$encode = font.encode(ELLIPSIS_STRING),
    codePoints = _font$encode[0];

  return parseInt(codePoints[0], 16);
};
/**
 * Trucante block with ellipsis
 *
 * @param  {number}  lines quantity
 * @param  {Object}  paragraph block
 * @return {Object} sliced paragraph block
 */

var truncate = function truncate(block) {
  var _last, _last2, _last2$attributes;

  var runs =
    ((_last = fns.last(block)) === null || _last === void 0
      ? void 0
      : _last.runs) || [];
  var font =
    (_last2 = fns.last(runs)) === null || _last2 === void 0
      ? void 0
      : (_last2$attributes = _last2.attributes) === null ||
        _last2$attributes === void 0
      ? void 0
      : _last2$attributes.font;

  if (font) {
    var _Object$assign;

    var index = block.length - 1;
    var codePoint = getEllipsisCodePoint(font);
    var glyph = font.glyphForCodePoint(codePoint);
    var lastBlock = append(glyph, trim(block[index]));
    return Object.assign(
      [],
      block,
      ((_Object$assign = {}),
      (_Object$assign[index] = lastBlock),
      _Object$assign),
    );
  }

  return block;
};

/**
 * Omit attribute from run
 *
 * @param  {Object}  run
 * @return {Object} run without ommited attribute
 */
var omit = function omit(value, run) {
  var attributes = Object.assign({}, run.attributes);
  delete attributes[value];
  return Object.assign({}, run, {
    attributes: attributes,
  });
};

/**
 * Get run ascent
 *
 * @param  {Object}  run
 * @return {boolean} ascent
 */

var ascent$1 = function ascent(run) {
  var _run$attributes,
    _run$attributes$attac,
    _run$attributes2,
    _run$attributes2$font;

  var attachmentHeight =
    ((_run$attributes = run.attributes) === null || _run$attributes === void 0
      ? void 0
      : (_run$attributes$attac = _run$attributes.attachment) === null ||
        _run$attributes$attac === void 0
      ? void 0
      : _run$attributes$attac.height) || 0;
  var fontAscent =
    ((_run$attributes2 = run.attributes) === null || _run$attributes2 === void 0
      ? void 0
      : (_run$attributes2$font = _run$attributes2.font) === null ||
        _run$attributes2$font === void 0
      ? void 0
      : _run$attributes2$font.ascent) || 0;
  return Math.max(attachmentHeight, fontAscent * scale(run));
};

/**
 * Get run descent
 *
 * @param  {Object}  run
 * @return {number} descent
 */

var descent = function descent(run) {
  var _run$attributes, _run$attributes$font;

  var fontDescent =
    ((_run$attributes = run.attributes) === null || _run$attributes === void 0
      ? void 0
      : (_run$attributes$font = _run$attributes.font) === null ||
        _run$attributes$font === void 0
      ? void 0
      : _run$attributes$font.descent) || 0;
  return scale(run) * fontDescent;
};

/**
 * Get run lineGap
 *
 * @param  {Object}  run
 * @return {number} lineGap
 */

var lineGap = function lineGap(run) {
  var _run$attributes, _run$attributes$font;

  return (
    (((_run$attributes = run.attributes) === null || _run$attributes === void 0
      ? void 0
      : (_run$attributes$font = _run$attributes.font) === null ||
        _run$attributes$font === void 0
      ? void 0
      : _run$attributes$font.lineGap) || 0) * scale(run)
  );
};

/**
 * Get run height
 *
 * @param  {Object}  run
 * @return {number} height
 */

var height$1 = function height(run) {
  var _run$attributes;

  var lineHeight =
    (_run$attributes = run.attributes) === null || _run$attributes === void 0
      ? void 0
      : _run$attributes.lineHeight;
  return lineHeight || lineGap(run) + ascent$1(run) - descent(run);
};

/**
 * Returns attributed string height
 *
 * @param {Object} attributed string
 * @return {number} height
 */

var height = function height(attributeString) {
  var reducer = function reducer(acc, run) {
    return Math.max(acc, height$1(run));
  };

  return attributeString.runs.reduce(reducer, 0);
};

/**
 * Checks if two rects intersect each other
 *
 * @param {Rect} a
 * @param {Rect} b
 * @returns {Boolean} rects intersects
 */
var intersects = function intersects(a, b) {
  var x = Math.max(a.x, b.x);
  var num1 = Math.min(a.x + a.width, b.x + b.width);
  var y = Math.max(a.y, b.y);
  var num2 = Math.min(a.y + a.height, b.y + b.height);
  return num1 >= x && num2 >= y;
};

var _excluded = ['excludeRects'];

var getLineFragment = function getLineFragment(lineRect, excludeRect) {
  if (!intersects(excludeRect, lineRect)) return [lineRect];
  var eStart = excludeRect.x;
  var eEnd = excludeRect.x + excludeRect.width;
  var lStart = lineRect.x;
  var lEnd = lineRect.x + lineRect.width;
  var a = Object.assign({}, lineRect, {
    width: eStart - lStart,
  });
  var b = Object.assign({}, lineRect, {
    x: eEnd,
    width: lEnd - eEnd,
  });
  return [a, b].filter(function(r) {
    return r.width > 0;
  });
};

var getLineFragments = function getLineFragments(rect, excludeRects) {
  var fragments = [rect];

  var _loop = function _loop(i) {
    var excludeRect = excludeRects[i];
    fragments = fragments.reduce(function(acc, fragment) {
      var pieces = getLineFragment(fragment, excludeRect);
      return acc.concat(pieces);
    }, []);
  };

  for (var i = 0; i < excludeRects.length; i += 1) {
    _loop(i);
  }

  return fragments;
};

var generateLineRects = function generateLineRects(container, height) {
  var excludeRects = container.excludeRects,
    rect = _objectWithoutPropertiesLoose__default['default'](
      container,
      _excluded,
    );

  if (!excludeRects) return [rect];
  var lineRects = [];
  var maxY = Math.max.apply(
    Math,
    excludeRects.map(function(r) {
      return r.y + r.height;
    }),
  );
  var currentRect = rect;

  while (currentRect.y < maxY) {
    var _partition = partition(currentRect, height),
      lineRect = _partition[0],
      rest = _partition[1];

    var lineRectFragments = getLineFragments(lineRect, excludeRects);
    currentRect = rest;
    lineRects.push.apply(lineRects, lineRectFragments);
  }

  return [].concat(lineRects, [currentRect]);
};

var ATTACHMENT_CODE$1 = '\uFFFC'; // 65532

/**
 * Remove attachment attribute if no char present
 *
 * @param  {Object} attributed string
 * @return {Object} attributed string
 */

var purgeAttachments = function purgeAttachments(attributedString) {
  var shouldPurge = !attributedString.string.includes(ATTACHMENT_CODE$1);
  if (!shouldPurge) return attributedString;
  var runs = attributedString.runs.map(function(run) {
    return omit('attachment', run);
  });
  return Object.assign({}, attributedString, {
    runs: runs,
  });
};
/**
 * Layout paragraphs inside rectangle
 *
 * @param  {Object} rect
 * @param  {Array} attributed strings
 * @return {Object} layout blocks
 */

var layoutLines = function layoutLines(rects, lines, indent) {
  var rect = rects.shift();
  var currentY = rect.y;
  return lines.map(function(line, i) {
    var _line$runs, _line$runs$;

    var lineIndent = i === 0 ? indent : 0;
    var style =
      ((_line$runs = line.runs) === null || _line$runs === void 0
        ? void 0
        : (_line$runs$ = _line$runs[0]) === null || _line$runs$ === void 0
        ? void 0
        : _line$runs$.attributes) || {};
    var height$1 = Math.max(height(line), style.lineHeight);

    if (currentY + height$1 > rect.y + rect.height && rects.length > 0) {
      rect = rects.shift();
      currentY = rect.y;
    }

    var newLine = Object.assign({}, line);
    delete newLine.syllables;
    newLine.box = {
      x: rect.x + lineIndent,
      y: currentY,
      width: rect.width - lineIndent,
      height: height$1,
    };
    currentY += height$1;
    return purgeAttachments(newLine);
  });
};
/**
 * Performs line breaking and layout
 *
 * @param  {Object} engines
 * @param  {Object}  layout options
 * @param  {Object} rect
 * @param  {Object} attributed string
 * @return {Object} layout block
 */

var layoutParagraph = function layoutParagraph(engines, options) {
  return function(container, paragraph) {
    var _paragraph$runs, _paragraph$runs$, _paragraph$runs$$attr;

    var height$1 = height(paragraph);
    var indent =
      ((_paragraph$runs = paragraph.runs) === null || _paragraph$runs === void 0
        ? void 0
        : (_paragraph$runs$ = _paragraph$runs[0]) === null ||
          _paragraph$runs$ === void 0
        ? void 0
        : (_paragraph$runs$$attr = _paragraph$runs$.attributes) === null ||
          _paragraph$runs$$attr === void 0
        ? void 0
        : _paragraph$runs$$attr.indent) || 0;
    var rects = generateLineRects(container, height$1);
    var availableWidths = rects.map(function(r) {
      return r.width;
    });
    availableWidths[0] -= indent;
    var lines = engines.linebreaker(options)(paragraph, availableWidths);
    return layoutLines(rects, lines, indent);
  };
};

/**
 * Slice block at given height
 *
 * @param  {number}  height
 * @param  {Object}  paragraph block
 * @return {number} sliced paragraph block
 */
var sliceAtHeight = function sliceAtHeight(height, block) {
  var newBlock = [];
  var counter = 0;

  for (var i = 0; i < block.length; i += 1) {
    var line = block[i];
    counter += line.box.height;

    if (counter < height) {
      newBlock.push(line);
    } else {
      break;
    }
  }

  return newBlock;
};

/**
 * Layout paragraphs inside container until it does not
 * fit anymore, performing line wrapping in the process.
 *
 * @param  {Object}  engines
 * @param  {Object}  layout options
 * @param  {Object}  container rect
 * @param  {Object}  attributed strings (paragraphs)
 * @return {Array} paragraph blocks
 */

var typesetter = function typesetter(engines, options, container) {
  return function(attributedStrings) {
    var blocks = [];
    var paragraphs = [].concat(attributedStrings);
    var layoutBlock = layoutParagraph(engines, options);
    var maxLines = fns.isNil(container.maxLines)
      ? Infinity
      : container.maxLines;
    var truncateEllipsis = container.truncateMode === 'ellipsis';
    var linesCount = maxLines;
    var paragraphRect = copy(container);
    var nextParagraph = paragraphs.shift();

    while (linesCount > 0 && nextParagraph) {
      var block = layoutBlock(paragraphRect, nextParagraph);
      var slicedBlock = block.slice(0, linesCount);
      var linesHeight = height$2(slicedBlock);
      var shouldTruncate =
        truncateEllipsis && block.length !== slicedBlock.length;
      linesCount -= slicedBlock.length;

      if (paragraphRect.height >= linesHeight) {
        blocks.push(shouldTruncate ? truncate(slicedBlock) : slicedBlock);
        paragraphRect = crop(linesHeight, paragraphRect);
        nextParagraph = paragraphs.shift();
      } else {
        blocks.push(truncate(sliceAtHeight(paragraphRect.height, slicedBlock)));
        break;
      }
    }

    return blocks;
  };
};

var DUMMY_CODEPOINT = 123;
/**
 * Resolve string indices based on glyphs code points
 *
 * @param  {Array}  glyphs
 * @return {Array} glyph indices
 */

var resolve = function resolve(glyphs) {
  if (glyphs === void 0) {
    glyphs = [];
  }

  return glyphs.reduce(function(acc, glyph) {
    var codePoints = (glyph === null || glyph === void 0
      ? void 0
      : glyph.codePoints) || [DUMMY_CODEPOINT];
    if (acc.length === 0)
      return codePoints.map(function() {
        return 0;
      });
    var last = acc[acc.length - 1];
    var next = codePoints.map(function() {
      return last + 1;
    });
    return [].concat(acc, next);
  }, []);
};

var getCharacterSpacing = function getCharacterSpacing(run) {
  var _run$attributes;

  return (
    ((_run$attributes = run.attributes) === null || _run$attributes === void 0
      ? void 0
      : _run$attributes.characterSpacing) || 0
  );
};
/**
 * Scale run positions
 *
 * @param  {Object}  run
 * @param  {Array}  positions
 * @return {Array} scaled positions
 */

var scalePositions = function scalePositions(run, positions) {
  var runScale = scale(run);
  var characterSpacing = getCharacterSpacing(run);
  return positions.map(function(position, i) {
    var isLast = i === positions.length;
    var xSpacing = isLast ? 0 : characterSpacing;
    return Object.assign({}, position, {
      xAdvance: position.xAdvance * runScale + xSpacing,
      yAdvance: position.yAdvance * runScale,
      xOffset: position.xOffset * runScale,
      yOffset: position.yOffset * runScale,
    });
  });
};
/**
 * Create glyph run
 *
 * @param  {String}  string
 * @param  {Object}  run
 * @return {Object}  glyph run
 */

var layoutRun = function layoutRun(string) {
  return function(run) {
    var start = run.start,
      end = run.end,
      _run$attributes2 = run.attributes,
      attributes = _run$attributes2 === void 0 ? {} : _run$attributes2;
    var font = attributes.font;
    if (!font)
      return _extends__default['default']({}, run, {
        glyphs: [],
        glyphIndices: [],
        positions: [],
      });
    var runString = string.slice(start, end);
    var glyphRun = font.layout(runString);
    var positions = scalePositions(run, glyphRun.positions);
    var glyphIndices = resolve(glyphRun.glyphs);
    return _extends__default['default']({}, run, {
      positions: positions,
      glyphIndices: glyphIndices,
      glyphs: glyphRun.glyphs,
    });
  };
};
/**
 * Generate glyphs for single attributed string
 *
 * @param  {Object}  layout engines
 * @param  {Object}  layout options
 * @param  {Array}  attributed strings
 * @return {Array} attributed string with glyphs
 */

var generateGlyphs = function generateGlyphs() {
  return function(attributedString) {
    var runs = attributedString.runs.map(layoutRun(attributedString.string));
    return Object.assign({}, attributedString, {
      runs: runs,
    });
  };
};

/**
 * Resolves yOffset for run
 *
 * @param  {Object}  run
 * @return {Object} run
 */
var resolveRunYOffset = function resolveRunYOffset(run) {
  var _run$attributes, _run$attributes$font, _run$attributes2;

  if (!run.positions) return run;
  var unitsPerEm =
    ((_run$attributes = run.attributes) === null || _run$attributes === void 0
      ? void 0
      : (_run$attributes$font = _run$attributes.font) === null ||
        _run$attributes$font === void 0
      ? void 0
      : _run$attributes$font.unitsPerEm) || 0;
  var yOffset =
    (((_run$attributes2 = run.attributes) === null ||
    _run$attributes2 === void 0
      ? void 0
      : _run$attributes2.yOffset) || 0) * unitsPerEm;
  var positions = run.positions.map(function(p) {
    return Object.assign({}, p, {
      yOffset: yOffset,
    });
  });
  return Object.assign({}, run, {
    positions: positions,
  });
};
/**
 * Resolves yOffset for multiple paragraphs
 *
 * @param  {Object} layout engines
 * @param  {Object}  layout options
 * @param  {Array}  attributed strings (paragraphs)
 * @return {Array} attributed strings (paragraphs)
 */

var resolveYOffset = function resolveYOffset() {
  return function(attributedString) {
    var runs = attributedString.runs.map(resolveRunYOffset);
    return Object.assign({}, attributedString, {
      runs: runs,
    });
  };
};

/**
 * Sort runs in ascending order
 *
 * @param  {Array}  runs
 * @return {Array} sorted runs
 */
var sort = function sort(runs) {
  return runs.sort(function(a, b) {
    return a.start - b.start || a.end - b.end;
  });
};

/**
 * Is run empty (start === end)
 *
 * @param  {Object}  run
 * @return {Object} is run empty
 */
var isEmpty = function isEmpty(run) {
  return run.start === run.end;
};

var sortPoints = function sortPoints(a, b) {
  return a[1] - b[1] || a[3] - b[3];
};

var generatePoints = function generatePoints(runs) {
  var result = runs.reduce(function(acc, run, i) {
    return acc.concat([
      ['start', run.start, run.attributes, i],
      ['end', run.end, run.attributes, i],
    ]);
  }, []);
  return result.sort(sortPoints);
};

var mergeRuns = function mergeRuns(runs) {
  return runs.reduce(function(acc, run) {
    var attributes = Object.assign({}, acc.attributes, run.attributes);
    return Object.assign({}, run, {
      attributes: attributes,
    });
  }, {});
};

var groupEmptyRuns = function groupEmptyRuns(runs) {
  var groups = runs.reduce(function(acc, run) {
    if (!acc[run.start]) acc[run.start] = [];
    acc[run.start].push(run);
    return acc;
  }, {});
  return Object.values(groups);
};

var flattenEmptyRuns = function flattenEmptyRuns(runs) {
  return groupEmptyRuns(runs).map(mergeRuns);
};

var flattenRegularRuns = function flattenRegularRuns(runs) {
  var res = [];
  var points = generatePoints(runs);
  var start = -1;
  var attrs = {};
  var stack = [];

  for (var i = 0; i < points.length; i += 1) {
    var _points$i = points[i],
      type = _points$i[0],
      offset = _points$i[1],
      attributes = _points$i[2];

    if (start !== -1 && start < offset) {
      res.push({
        start: start,
        end: offset,
        attributes: attrs,
      });
    }

    if (type === 'start') {
      stack.push(attributes);
      attrs = Object.assign({}, attrs, attributes);
    } else {
      attrs = {};

      for (var j = 0; j < stack.length; j += 1) {
        if (stack[j] === attributes) {
          // eslint-disable-next-line no-plusplus
          stack.splice(j--, 1);
        } else {
          attrs = Object.assign({}, attrs, stack[j]);
        }
      }
    }

    start = offset;
  }

  return res;
};
/**
 * Flatten many runs
 *
 * @param  {Array}  runs
 * @return {Array} flatten runs
 */

var flatten = function flatten(runs) {
  if (runs === void 0) {
    runs = [];
  }

  var emptyRuns = flattenEmptyRuns(
    runs.filter(function(run) {
      return isEmpty(run);
    }),
  );
  var regularRuns = flattenRegularRuns(
    runs.filter(function(run) {
      return !isEmpty(run);
    }),
  );
  return sort(emptyRuns.concat(regularRuns));
};

/**
 * Returns empty attributed string
 *
 * @return {Object} empty attributed string
 */
var empty = function empty() {
  return {
    string: '',
    runs: [],
  };
};

var omitFont = function omitFont(attributedString) {
  var runs = attributedString.runs.map(function(run) {
    return omit('font', run);
  });
  return Object.assign({}, attributedString, {
    runs: runs,
  });
};
/**
 * Performs font substitution and script itemization on attributed string
 *
 * @param  {Object}  engines
 * @param  {Object}  layout options
 * @param  {Object}  attributed string
 * @return {Object} processed attributed string
 */

var preprocessRuns = function preprocessRuns(engines, options) {
  return function(attributedString) {
    if (fns.isNil(attributedString)) return empty();
    var string = attributedString.string;
    var fontSubstitution = engines.fontSubstitution,
      scriptItemizer = engines.scriptItemizer;

    var _omitFont = omitFont(attributedString),
      omittedFontRuns = _omitFont.runs;

    var _fontSubstitution = fontSubstitution(options)(attributedString),
      substitutedRuns = _fontSubstitution.runs;

    var _scriptItemizer = scriptItemizer(options)(attributedString),
      itemizationRuns = _scriptItemizer.runs;

    var runs = substitutedRuns.concat(itemizationRuns).concat(omittedFontRuns);
    return {
      string: string,
      runs: flatten(runs),
    };
  };
};

/**
 * Get attributed string start value
 *
 * @param  {Object}  attributed string
 * @return {number} start
 */
var start = function start(attributedString) {
  var runs = attributedString.runs;
  return runs.length === 0 ? 0 : runs[0].start;
};

/**
 * Get attributed string end value
 *
 * @param  {Object}  attributed string
 * @return {number} end
 */

var end = function end(attributedString) {
  var runs = attributedString.runs;
  return runs.length === 0 ? 0 : fns.last(runs).end;
};

/**
 * Get attributed string length
 *
 * @param  {Object}  glyph string
 * @return {number} end
 */

var length$1 = function length(attributedString) {
  return end(attributedString) - start(attributedString);
};

/**
 * Breaks attributed string into paragraphs
 *
 * @param  {Object}  engines
 * @param  {Object}  layout options
 * @param  {Object}  attributed string
 * @return {Array} attributed string array
 */

var splitParagraphs = function splitParagraphs() {
  return function(attributedString) {
    var res = [];
    var start = 0;
    var breakPoint = attributedString.string.indexOf('\n') + 1;

    while (breakPoint > 0) {
      res.push(slice(start, breakPoint, attributedString));
      start = breakPoint;
      breakPoint = attributedString.string.indexOf('\n', breakPoint) + 1;
    }

    if (start === 0) {
      res.push(attributedString);
    } else if (start < attributedString.string.length) {
      res.push(slice(start, length$1(attributedString), attributedString));
    }

    return res;
  };
};

/**
 * Return positions advance width
 *
 * @param  {Object}  positions
 * @return {number} advance width
 */
var advanceWidth$2 = function advanceWidth(positions) {
  return positions.reduce(function(acc, pos) {
    return acc + (pos.xAdvance || 0);
  }, 0);
};

/**
 * Return run advance width
 *
 * @param  {Object}  run
 * @return {number} advance width
 */

var advanceWidth$1 = function advanceWidth(run) {
  return advanceWidth$2(run.positions || []);
};

/**
 * Returns attributed string advancewidth
 *
 * @param {Object} attributed string
 * @return {number} advance width
 */

var advanceWidth = function advanceWidth(attributeString) {
  var reducer = function reducer(acc, run) {
    return acc + advanceWidth$1(run);
  };

  return attributeString.runs.reduce(reducer, 0);
};

var WHITE_SPACES_CODE = 32;
/**
 * Check if glyph is white space
 *
 * @param  {Object}  glyph
 * @return {Boolean}  is white space
 * */

var isWhiteSpace = function isWhiteSpace(glyph) {
  var codePoints =
    (glyph === null || glyph === void 0 ? void 0 : glyph.codePoints) || [];
  return codePoints.includes(WHITE_SPACES_CODE);
};

/**
 * Get white space leading positions
 *
 * @param  {Object}  run
 * @return {Array} white space leading positions
 */

var leadingPositions = function leadingPositions(run) {
  var glyphs = run.glyphs || [];
  var positions = run.positions || [];
  var leadingWhitespaces = glyphs.findIndex(function(g) {
    return !isWhiteSpace(g);
  });
  return positions.slice(0, leadingWhitespaces);
};
/**
 * Get run leading white space offset
 *
 * @param  {Object}  run
 * @return {number} leading white space offset
 */

var leadingOffset$1 = function leadingOffset(run) {
  var positions = leadingPositions(run);
  return positions.reduce(function(acc, pos) {
    return acc + (pos.xAdvance || 0);
  }, 0);
};

/**
 * Get attributed string leading white space offset
 *
 * @param  {Object}  attributed string
 * @return {number} leading white space offset
 */

var leadingOffset = function leadingOffset(attributedString) {
  var runs = attributedString.runs || [];
  return leadingOffset$1(runs[0]);
};

var reverse = function reverse(array) {
  return [].concat(array).reverse();
};
/**
 * Get white space trailing positions
 *
 * @param  {Object}  run
 * @return {Array} white space trailing positions
 */

var trailingPositions = function trailingPositions(run) {
  var glyphs = reverse(run.glyphs || []);
  var positions = reverse(run.positions || []);
  var leadingWhitespaces = glyphs.findIndex(function(g) {
    return !isWhiteSpace(g);
  });
  return positions.slice(0, leadingWhitespaces);
};
/**
 * Get run trailing white space offset
 *
 * @param  {Object}  run
 * @return {number} trailing white space offset
 */

var trailingOffset$1 = function trailingOffset(run) {
  var positions = trailingPositions(run);
  return positions.reduce(function(acc, pos) {
    return acc + (pos.xAdvance || 0);
  }, 0);
};

/**
 * Get attributed string trailing white space offset
 *
 * @param  {Object}  attributed string
 * @return {number} trailing white space offset
 */

var trailingOffset = function trailingOffset(attributedString) {
  var runs = attributedString.runs || [];
  return trailingOffset$1(fns.last(runs));
};

/**
 * Drop last char of run
 *
 * @param  {Object}  run
 * @return {boolean} run without last char
 */

var dropLast$1 = function dropLast(run) {
  return slice$1(0, run.end - run.start - 1, run);
};

/**
 * Drop last glyph
 *
 * @param {Object} attributed string
 * @return {Object} attributed string with new glyph
 */

var dropLast = function dropLast(attributeString) {
  var string = fns.dropLast(attributeString.string);
  var runs = fns.adjust(-1, dropLast$1, attributeString.runs);
  return Object.assign({}, attributeString, {
    string: string,
    runs: runs,
  });
};

var ALIGNMENT_FACTORS = {
  center: 0.5,
  right: 1,
};
/**
 * Remove new line char at the end of line if present
 *
 * @param  {Object}  line
 * @return {Object} line
 */

var removeNewLine = function removeNewLine(line) {
  return fns.last(line.string) === '\n' ? dropLast(line) : line;
};

var getOverflowLeft = function getOverflowLeft(line) {
  return leadingOffset(line) + (line.overflowLeft || 0);
};

var getOverflowRight = function getOverflowRight(line) {
  return trailingOffset(line) + (line.overflowRight || 0);
};
/**
 * Ignore whitespace at the start and end of a line for alignment
 *
 * @param  {Object}  line
 * @return {Object} line
 */

var adjustOverflow = function adjustOverflow(line) {
  var overflowLeft = getOverflowLeft(line);
  var overflowRight = getOverflowRight(line);
  var x = line.box.x - overflowLeft;
  var width = line.box.width + overflowLeft + overflowRight;
  var box = Object.assign({}, line.box, {
    x: x,
    width: width,
  });
  return Object.assign({}, line, {
    box: box,
    overflowLeft: overflowLeft,
    overflowRight: overflowRight,
  });
};
/**
 * Performs line justification by calling appropiate engine
 *
 * @param  {Object}  engines
 * @param  {Object}  layout options
 * @param  {string}  text align
 * @param  {Object}  line
 * @return {Object} line
 */

var justifyLine$1 = function justifyLine(engines, options, align) {
  return function(line) {
    var lineWidth = advanceWidth(line);
    var alignFactor = ALIGNMENT_FACTORS[align] || 0;
    var remainingWidth = Math.max(0, line.box.width - lineWidth);
    var shouldJustify = align === 'justify' || lineWidth > line.box.width;
    var x = line.box.x + remainingWidth * alignFactor;
    var box = Object.assign({}, line.box, {
      x: x,
    });
    var newLine = Object.assign({}, line, {
      box: box,
    });
    return shouldJustify ? engines.justification(options)(newLine) : newLine;
  };
};

var finalizeLine = function finalizeLine(line) {
  var lineAscent = 0;
  var lineDescent = 0;
  var lineHeight = 0;
  var lineXAdvance = 0;
  var runs = line.runs.map(function(run) {
    var height = height$1(run);
    var ascent = ascent$1(run);
    var descent$1 = descent(run);
    var xAdvance = advanceWidth$1(run);
    lineHeight = Math.max(lineHeight, height);
    lineAscent = Math.max(lineAscent, ascent);
    lineDescent = Math.max(lineDescent, descent$1);
    lineXAdvance += xAdvance;
    return Object.assign({}, run, {
      height: height,
      ascent: ascent,
      descent: descent$1,
      xAdvance: xAdvance,
    });
  });
  return Object.assign({}, line, {
    runs: runs,
    height: lineHeight,
    ascent: lineAscent,
    descent: lineDescent,
    xAdvance: lineXAdvance,
  });
};
/**
 * Finalize line by performing line justification
 * and text decoration (using appropiate engines)
 *
 * @param  {Object}  engines
 * @param  {Object}  layout options
 * @param  {Object}  line
 * @param  {number}  line index
 * @param  {Array}  total lines
 * @return {Object} line
 */

var finalizeBlock = function finalizeBlock(engines, options) {
  if (engines === void 0) {
    engines = {};
  }

  return function(line, i, lines) {
    var _line$runs, _line$runs$;

    var isLastFragment = i === lines.length - 1;
    var style =
      ((_line$runs = line.runs) === null || _line$runs === void 0
        ? void 0
        : (_line$runs$ = _line$runs[0]) === null || _line$runs$ === void 0
        ? void 0
        : _line$runs$.attributes) || {};
    var align = isLastFragment ? style.alignLastLine : style.align;
    return fns.compose(
      finalizeLine,
      engines.textDecoration(options),
      justifyLine$1(engines, options, align),
      adjustOverflow,
      removeNewLine,
    )(line);
  };
};
/**
 * Finalize line block by performing line justification
 * and text decoration (using appropiate engines)
 *
 * @param  {Object}  engines
 * @param  {Object}  layout options
 * @param  {Array}  line blocks
 * @return {Array} line blocks
 */

var finalizeFragments = function finalizeFragments(engines, options) {
  return function(blocks) {
    var blockFinalizer = finalizeBlock(engines, options);
    return blocks.map(function(block) {
      return block.map(blockFinalizer);
    });
  };
};

var ATTACHMENT_CODE = 0xfffc; // 65532

var isReplaceGlyph = function isReplaceGlyph(glyph) {
  return glyph.codePoints.includes(ATTACHMENT_CODE);
};
/**
 * Resolve attachments of run
 *
 * @param  {Object}  run
 * @return {Object} run
 */

var resolveRunAttachments = function resolveRunAttachments(run) {
  var _run$attributes;

  if (!run.positions) return run;
  var glyphs = run.glyphs || [];
  var attachment =
    ((_run$attributes = run.attributes) === null || _run$attributes === void 0
      ? void 0
      : _run$attributes.attachment) || {};
  var positions = run.positions.map(function(position, i) {
    var glyph = glyphs[i];

    if (attachment && attachment.width && isReplaceGlyph(glyph)) {
      return Object.assign({}, position, {
        xAdvance: attachment.width,
      });
    }

    return Object.assign({}, position);
  });
  return Object.assign({}, run, {
    positions: positions,
  });
};
/**
 * Resolve attachments for multiple paragraphs
 *
 * @param  {Object} layout engines
 * @param  {Object}  layout options
 * @param  {Array}  attributed strings (paragraphs)
 * @return {Array} attributed strings (paragraphs)
 */

var resolveAttachments = function resolveAttachments() {
  return function(attributedString) {
    var runs = attributedString.runs.map(resolveRunAttachments);
    return Object.assign({}, attributedString, {
      runs: runs,
    });
  };
};

var applyAttributes = function applyAttributes(a) {
  return {
    align: a.align || 'left',
    alignLastLine:
      a.alignLastLine || (a.align === 'justify' ? 'left' : a.align || 'left'),
    attachment: a.attachment || null,
    backgroundColor: a.backgroundColor || null,
    bidiLevel: a.bidiLevel || null,
    bullet: a.bullet || null,
    characterSpacing: a.characterSpacing || 0,
    color: a.color || 'black',
    features: a.features || [],
    fill: a.fill !== false,
    font: a.font || null,
    fontSize: a.fontSize || 12,
    hangingPunctuation: a.hangingPunctuation || false,
    hyphenationFactor: a.hyphenationFactor || 0,
    indent: a.indent || 0,
    justificationFactor: a.justificationFactor || 1,
    lineHeight: a.lineHeight || null,
    lineSpacing: a.lineSpacing || 0,
    link: a.link || null,
    marginLeft: a.marginLeft || a.margin || 0,
    marginRight: a.marginRight || a.margin || 0,
    opacity: a.opacity,
    paddingTop: a.paddingTop || a.padding || 0,
    paragraphSpacing: a.paragraphSpacing || 0,
    underline: a.underline || false,
    underlineColor: a.underlineColor || a.color || 'black',
    underlineStyle: a.underlineStyle || 'solid',
    script: a.script || null,
    shrinkFactor: a.shrinkFactor || 0,
    strike: a.strike || false,
    strikeColor: a.strikeColor || a.color || 'black',
    strikeStyle: a.strikeStyle || 'solid',
    stroke: a.stroke || false,
    wordSpacing: a.wordSpacing || 0,
    yOffset: a.yOffset || 0,
  };
};
/**
 * Apply default style to run
 *
 * @param  {Object}  run
 * @return {Object} run with styles
 */

var applyRunStyles = function applyRunStyles(run) {
  var attributes = applyAttributes(run.attributes);
  return Object.assign({}, run, {
    attributes: attributes,
  });
};
/**
 * Apply default attributes for an attributed string
 *
 * @param  {Object}  engines
 * @param  {Object}  layout options
 * @param  {Object}  attributed string
 * @return {Object} attributed string
 */

var applyDefaultStyles = function applyDefaultStyles() {
  return function(attributedString) {
    var string = attributedString.string || '';
    var runs = (attributedString.runs || []).map(applyRunStyles);
    return {
      string: string,
      runs: runs,
    };
  };
};

/**
 * A LayoutEngine is the main object that performs text layout.
 * It accepts an AttributedString and a Container object
 * to layout text into, and uses several helper objects to perform
 * various layout tasks. These objects can be overridden to customize
 * layout behavior.
 *
 * @param  {Object}  engines
 * @param  {Object}  attributed string
 * @param  {Object}  container rect
 * @param  {Object}  layout options
 * @return {Array} paragraph blocks
 */

var layoutEngine = function layoutEngine(engines) {
  return function(attributedString, container, options) {
    if (options === void 0) {
      options = {};
    }

    var processParagraph = fns.compose(
      resolveYOffset(),
      resolveAttachments(),
      generateGlyphs(),
      wrapWords(engines, options),
    );

    var processParagraphs = function processParagraphs(paragraphs) {
      return paragraphs.map(processParagraph);
    };

    return fns.compose(
      finalizeFragments(engines, options),
      typesetter(engines, options, container),
      processParagraphs,
      splitParagraphs(),
      preprocessRuns(engines, options),
      applyDefaultStyles(),
    )(attributedString);
  };
};

/* eslint-disable no-plusplus */
var INFINITY = 10000;

var getNextBreakpoint = function getNextBreakpoint(
  subnodes,
  widths,
  lineNumber,
) {
  var position = null;
  var minimumBadness = Infinity;
  var sum = {
    width: 0,
    stretch: 0,
    shrink: 0,
  };
  var lineLength = widths[Math.min(lineNumber, widths.length - 1)];

  var calculateRatio = function calculateRatio(node) {
    if (sum.width < lineLength) {
      return sum.stretch - node.stretch > 0
        ? (lineLength - sum.width) / sum.stretch
        : INFINITY;
    }

    if (sum.width > lineLength) {
      return sum.shrink - node.shrink > 0
        ? (lineLength - sum.width) / sum.shrink
        : INFINITY;
    }

    return 0;
  };

  for (var i = 0; i < subnodes.length; i += 1) {
    var node = subnodes[i];

    if (node.type === 'box') {
      sum.width += node.width;
    } else if (node.type === 'glue') {
      sum.width += node.width;
      sum.stretch += node.stretch;
      sum.shrink += node.shrink;
    }

    if (sum.width - sum.shrink > lineLength) {
      if (position === null) {
        var j = i === 0 ? i + 1 : i;

        while (
          j < subnodes.length &&
          (subnodes[j].type === 'glue' || subnodes[j].type === 'penalty')
        ) {
          j++;
        }

        position = j - 1;
      }

      break;
    }

    if (node.type === 'penalty' || node.type === 'glue') {
      var ratio = calculateRatio(node);
      var penalty = node.type === 'penalty' ? node.penalty : 0;
      var badness = 100 * Math.pow(Math.abs(ratio), 3) + penalty;

      if (minimumBadness >= badness) {
        position = i;
        minimumBadness = badness;
      }
    }
  }

  return sum.width - sum.shrink > lineLength ? position : null;
};

var applyBestFit = function applyBestFit(nodes, widths) {
  var count = 0;
  var lineNumber = 0;
  var subnodes = nodes;
  var breakpoints = [
    {
      position: 0,
    },
  ];

  while (subnodes.length > 0) {
    var breakpoint = getNextBreakpoint(subnodes, widths, lineNumber);

    if (breakpoint !== null) {
      count += breakpoint;
      breakpoints.push({
        position: count,
      });
      subnodes = subnodes.slice(breakpoint + 1, subnodes.length);
      count++;
      lineNumber++;
    } else {
      subnodes = [];
    }
  }

  return breakpoints;
};

/* eslint-disable no-param-reassign */

/* eslint-disable max-classes-per-file */
var Node = /*#__PURE__*/ (function() {
  function Node(data) {
    this.prev = null;
    this.next = null;
    this.data = data;
  }

  var _proto = Node.prototype;

  _proto.toString = function toString() {
    return this.data.toString();
  };

  return Node;
})();

var LinkedList = /*#__PURE__*/ (function() {
  function LinkedList() {
    this.head = null;
    this.tail = null;
    this.listSize = 0;
  }

  var _proto2 = LinkedList.prototype;

  _proto2.isLinked = function isLinked(node) {
    return !(
      (node &&
        node.prev === null &&
        node.next === null &&
        this.tail !== node &&
        this.head !== node) ||
      this.isEmpty()
    );
  };

  _proto2.size = function size() {
    return this.listSize;
  };

  _proto2.isEmpty = function isEmpty() {
    return this.listSize === 0;
  };

  _proto2.first = function first() {
    return this.head;
  };

  _proto2.last = function last() {
    return this.last;
  };

  _proto2.toString = function toString() {
    return this.toArray().toString();
  };

  _proto2.toArray = function toArray() {
    var node = this.head;
    var result = [];

    while (node !== null) {
      result.push(node);
      node = node.next;
    }

    return result;
  };

  _proto2.forEach = function forEach(fun) {
    var node = this.head;

    while (node !== null) {
      fun(node);
      node = node.next;
    }
  };

  _proto2.contains = function contains(n) {
    var node = this.head;

    if (!this.isLinked(n)) {
      return false;
    }

    while (node !== null) {
      if (node === n) {
        return true;
      }

      node = node.next;
    }

    return false;
  };

  _proto2.at = function at(i) {
    var node = this.head;
    var index = 0;

    if (i >= this.listLength || i < 0) {
      return null;
    }

    while (node !== null) {
      if (i === index) {
        return node;
      }

      node = node.next;
      index += 1;
    }

    return null;
  };

  _proto2.insertAfter = function insertAfter(node, newNode) {
    if (!this.isLinked(node)) {
      return this;
    }

    newNode.prev = node;
    newNode.next = node.next;

    if (node.next === null) {
      this.tail = newNode;
    } else {
      node.next.prev = newNode;
    }

    node.next = newNode;
    this.listSize += 1;
    return this;
  };

  _proto2.insertBefore = function insertBefore(node, newNode) {
    if (!this.isLinked(node)) {
      return this;
    }

    newNode.prev = node.prev;
    newNode.next = node;

    if (node.prev === null) {
      this.head = newNode;
    } else {
      node.prev.next = newNode;
    }

    node.prev = newNode;
    this.listSize += 1;
    return this;
  };

  _proto2.push = function push(node) {
    if (this.head === null) {
      this.unshift(node);
    } else {
      this.insertAfter(this.tail, node);
    }

    return this;
  };

  _proto2.unshift = function unshift(node) {
    if (this.head === null) {
      this.head = node;
      this.tail = node;
      node.prev = null;
      node.next = null;
      this.listSize += 1;
    } else {
      this.insertBefore(this.head, node);
    }

    return this;
  };

  _proto2.remove = function remove(node) {
    if (!this.isLinked(node)) {
      return this;
    }

    if (node.prev === null) {
      this.head = node.next;
    } else {
      node.prev.next = node.next;
    }

    if (node.next === null) {
      this.tail = node.prev;
    } else {
      node.next.prev = node.prev;
    }

    this.listSize -= 1;
    return this;
  };

  _proto2.pop = function pop() {
    var node = this.tail;
    this.tail.prev.next = null;
    this.tail = this.tail.prev;
    this.listSize -= 1;
    node.prev = null;
    node.next = null;
    return node;
  };

  _proto2.shift = function shift() {
    var node = this.head;
    this.head.next.prev = null;
    this.head = this.head.next;
    this.listSize -= 1;
    node.prev = null;
    node.next = null;
    return node;
  };

  return LinkedList;
})();

LinkedList.Node = Node;

/* eslint-disable no-restricted-properties */
/**
 * @preserve Knuth and Plass line breaking algorithm in JavaScript
 *
 * Licensed under the new BSD License.
 * Copyright 2009-2010, Bram Stein
 * All rights reserved.
 */

var linebreak = function linebreak(nodes, lines, settings) {
  var options = {
    demerits: {
      line: (settings && settings.demerits && settings.demerits.line) || 10,
      flagged:
        (settings && settings.demerits && settings.demerits.flagged) || 100,
      fitness:
        (settings && settings.demerits && settings.demerits.fitness) || 3000,
    },
    tolerance: (settings && settings.tolerance) || 3,
  };
  var activeNodes = new LinkedList();
  var sum = {
    width: 0,
    stretch: 0,
    shrink: 0,
  };
  var lineLengths = lines;
  var breaks = [];
  var tmp = {
    data: {
      demerits: Infinity,
    },
  };

  function breakpoint(
    position,
    demerits,
    ratio,
    line,
    fitnessClass,
    totals,
    previous,
  ) {
    return {
      position: position,
      demerits: demerits,
      ratio: ratio,
      line: line,
      fitnessClass: fitnessClass,
      totals: totals || {
        width: 0,
        stretch: 0,
        shrink: 0,
      },
      previous: previous,
    };
  }

  function computeCost(start, end, active, currentLine) {
    var width = sum.width - active.totals.width;
    var stretch = 0;
    var shrink = 0; // If the current line index is within the list of linelengths, use it, otherwise use
    // the last line length of the list.

    var lineLength =
      currentLine < lineLengths.length
        ? lineLengths[currentLine - 1]
        : lineLengths[lineLengths.length - 1];

    if (nodes[end].type === 'penalty') {
      width += nodes[end].width;
    }

    if (width < lineLength) {
      // Calculate the stretch ratio
      stretch = sum.stretch - active.totals.stretch;

      if (stretch > 0) {
        return (lineLength - width) / stretch;
      }

      return linebreak.infinity;
    }

    if (width > lineLength) {
      // Calculate the shrink ratio
      shrink = sum.shrink - active.totals.shrink;

      if (shrink > 0) {
        return (lineLength - width) / shrink;
      }

      return linebreak.infinity;
    } // perfect match

    return 0;
  } // Add width, stretch and shrink values from the current
  // break point up to the next box or forced penalty.

  function computeSum(breakPointIndex) {
    var result = {
      width: sum.width,
      stretch: sum.stretch,
      shrink: sum.shrink,
    };

    for (var i = breakPointIndex; i < nodes.length; i += 1) {
      if (nodes[i].type === 'glue') {
        result.width += nodes[i].width;
        result.stretch += nodes[i].stretch;
        result.shrink += nodes[i].shrink;
      } else if (
        nodes[i].type === 'box' ||
        (nodes[i].type === 'penalty' &&
          nodes[i].penalty === -linebreak.infinity &&
          i > breakPointIndex)
      ) {
        break;
      }
    }

    return result;
  } // The main loop of the algorithm
  // eslint-disable-next-line no-shadow

  function mainLoop(node, index, nodes) {
    var active = activeNodes.first();
    var next = null;
    var ratio = 0;
    var demerits = 0;
    var candidates = [];
    var badness;
    var currentLine = 0;
    var tmpSum;
    var currentClass = 0;
    var fitnessClass;
    var candidate;
    var newNode; // The inner loop iterates through all the active nodes with line < currentLine and then
    // breaks out to insert the new active node candidates before looking at the next active
    // nodes for the next lines. The result of this is that the active node list is always
    // sorted by line number.

    while (active !== null) {
      candidates = [
        {
          demerits: Infinity,
        },
        {
          demerits: Infinity,
        },
        {
          demerits: Infinity,
        },
        {
          demerits: Infinity,
        },
      ]; // Iterate through the linked list of active nodes to find new potential active nodes
      // and deactivate current active nodes.

      while (active !== null) {
        next = active.next;
        currentLine = active.data.line + 1;
        ratio = computeCost(
          active.data.position,
          index,
          active.data,
          currentLine,
        ); // Deactive nodes when the distance between the current active node and the
        // current node becomes too large (i.e. it exceeds the stretch limit and the stretch
        // ratio becomes negative) or when the current node is a forced break (i.e. the end
        // of the paragraph when we want to remove all active nodes, but possibly have a final
        // candidate active node---if the paragraph can be set using the given tolerance value.)

        if (
          ratio < -1 ||
          (node.type === 'penalty' && node.penalty === -linebreak.infinity)
        ) {
          activeNodes.remove(active);
        } // If the ratio is within the valid range of -1 <= ratio <= tolerance calculate the
        // total demerits and record a candidate active node.

        if (ratio >= -1 && ratio <= options.tolerance) {
          badness = 100 * Math.pow(Math.abs(ratio), 3); // Positive penalty

          if (node.type === 'penalty' && node.penalty >= 0) {
            demerits =
              Math.pow(options.demerits.line + badness, 2) +
              Math.pow(node.penalty, 2); // Negative penalty but not a forced break
          } else if (
            node.type === 'penalty' &&
            node.penalty !== -linebreak.infinity
          ) {
            demerits =
              Math.pow(options.demerits.line + badness, 2) -
              Math.pow(node.penalty, 2); // All other cases
          } else {
            demerits = Math.pow(options.demerits.line + badness, 2);
          }

          if (
            node.type === 'penalty' &&
            nodes[active.data.position].type === 'penalty'
          ) {
            demerits +=
              options.demerits.flagged *
              node.flagged *
              nodes[active.data.position].flagged;
          } // Calculate the fitness class for this candidate active node.

          if (ratio < -0.5) {
            currentClass = 0;
          } else if (ratio <= 0.5) {
            currentClass = 1;
          } else if (ratio <= 1) {
            currentClass = 2;
          } else {
            currentClass = 3;
          } // Add a fitness penalty to the demerits if the fitness classes of two adjacent lines
          // differ too much.

          if (Math.abs(currentClass - active.data.fitnessClass) > 1) {
            demerits += options.demerits.fitness;
          } // Add the total demerits of the active node to get the total demerits of this candidate node.

          demerits += active.data.demerits; // Only store the best candidate for each fitness class

          if (demerits < candidates[currentClass].demerits) {
            candidates[currentClass] = {
              active: active,
              demerits: demerits,
              ratio: ratio,
            };
          }
        }

        active = next; // Stop iterating through active nodes to insert new candidate active nodes in the active list
        // before moving on to the active nodes for the next line.
        // TODO: The Knuth and Plass paper suggests a conditional for currentLine < j0. This means paragraphs
        // with identical line lengths will not be sorted by line number. Find out if that is a desirable outcome.
        // For now I left this out, as it only adds minimal overhead to the algorithm and keeping the active node
        // list sorted has a higher priority.

        if (active !== null && active.data.line >= currentLine) {
          break;
        }
      }

      tmpSum = computeSum(index);

      for (
        fitnessClass = 0;
        fitnessClass < candidates.length;
        fitnessClass += 1
      ) {
        candidate = candidates[fitnessClass];

        if (candidate.demerits < Infinity) {
          newNode = new LinkedList.Node(
            breakpoint(
              index,
              candidate.demerits,
              candidate.ratio,
              candidate.active.data.line + 1,
              fitnessClass,
              tmpSum,
              candidate.active,
            ),
          );

          if (active !== null) {
            activeNodes.insertBefore(active, newNode);
          } else {
            activeNodes.push(newNode);
          }
        }
      }
    }
  } // Add an active node for the start of the paragraph.

  activeNodes.push(
    new LinkedList.Node(breakpoint(0, 0, 0, 0, 0, undefined, null)),
  ); // eslint-disable-next-line no-shadow

  nodes.forEach(function(node, index, nodes) {
    if (node.type === 'box') {
      sum.width += node.width;
    } else if (node.type === 'glue') {
      if (index > 0 && nodes[index - 1].type === 'box') {
        mainLoop(node, index, nodes);
      }

      sum.width += node.width;
      sum.stretch += node.stretch;
      sum.shrink += node.shrink;
    } else if (node.type === 'penalty' && node.penalty !== linebreak.infinity) {
      mainLoop(node, index, nodes);
    }
  });

  if (activeNodes.size() !== 0) {
    // Find the best active node (the one with the least total demerits.)
    activeNodes.forEach(function(node) {
      if (node.data.demerits < tmp.data.demerits) {
        tmp = node;
      }
    });

    while (tmp !== null) {
      breaks.push({
        position: tmp.data.position,
        ratio: tmp.data.ratio,
      });
      tmp = tmp.data.previous;
    }

    return breaks.reverse();
  }

  return [];
};

linebreak.infinity = 10000;

linebreak.glue = function(width, value, stretch, shrink) {
  return {
    type: 'glue',
    value: value,
    width: width,
    stretch: stretch,
    shrink: shrink,
  };
};

linebreak.box = function(width, value, hyphenated) {
  if (hyphenated === void 0) {
    hyphenated = false;
  }

  return {
    type: 'box',
    width: width,
    value: value,
    hyphenated: hyphenated,
  };
};

linebreak.penalty = function(width, penalty, flagged) {
  return {
    type: 'penalty',
    width: width,
    penalty: penalty,
    flagged: flagged,
  };
};

/**
 * Add scalar to run
 *
 * @param  {number}  scalar
 * @param  {Object}  run
 * @return {Object} added run
 */
var add = function add(n, run) {
  var start = run.start + n;
  var end = run.end + n;
  return Object.assign({}, run, {
    start: start,
    end: end,
  });
};

/**
 * Get run length
 *
 * @param  {Object}  run
 * @return {number} length
 */
var length = function length(run) {
  return run.end - run.start;
};

/**
 * Concats two runs into one
 *
 * @param  {Object}  first run
 * @param  {Object}  second run
 * @return {Object}  concatenated run
 */

var concat = function concat(runA, runB) {
  var end = runA.end + length(runB);
  var glyphs = (runA.glyphs || []).concat(runB.glyphs || []);
  var positions = (runA.positions || []).concat(runB.positions || []);
  var attributes = Object.assign({}, runA.attributes, runB.attributes);
  var runAIndices = runA.glyphIndices || [];
  var runALastIndex = fns.last(runAIndices) || 0;
  var runBIndices = (runB.glyphIndices || []).map(function(i) {
    return i + runALastIndex + 1;
  });
  var glyphIndices = normalize(runAIndices.concat(runBIndices));
  return Object.assign({}, runA, {
    end: end,
    glyphs: glyphs,
    positions: positions,
    attributes: attributes,
    glyphIndices: glyphIndices,
  });
};

/**
 * Insert glyph to run in the given index
 *
 * @param  {number}  string index
 * @param  {Object}  glyph
 * @param  {Object}  run
 * @return {Object}  run with glyph
 */

var insertGlyph$1 = function insertGlyph(index, glyph, run) {
  if (!glyph) return run; // Split resolves ligature splitting in case new glyph breaks some

  var leadingRun = slice$1(0, index, run);
  var trailingRun = slice$1(index, Infinity, run);
  return concat(append$1(glyph, leadingRun), trailingRun);
};
/**
 * Insert either glyph or code point to run in the given index
 *
 * @param  {number}  string index
 * @param  {Object | number}  glyph | codePoint
 * @param  {Object}  run
 * @return {Object}  run with glyph
 */

var insert = function insert(index, value, run) {
  var font = getFont(run);
  var glyph = isNumber(value) ? fromCodePoint(value, font) : value;
  return insertGlyph$1(index, glyph, run);
};

/**
 * Get run index at char index
 *
 * @param  {number}  char index
 * @param  {Object}  attributedString
 * @return {number} run index
 */

var runIndexAt = function runIndexAt(n, string) {
  return runIndexAt$1(n, string.runs);
};

/**
 * Insert glyph into attributed string
 *
 * @param {number} index
 * @param {Object} glyph
 * @param {Object} attributed string
 * @return {Object} attributed string with new glyph
 */

var insertGlyph = function insertGlyph(index, glyph, attributedString) {
  var runIndex = runIndexAt(index, attributedString); // Add glyph to the end if run index invalid

  if (runIndex === -1) return append(glyph, attributedString);
  var codePoints =
    (glyph === null || glyph === void 0 ? void 0 : glyph.codePoints) || [];
  var string =
    attributedString.string.slice(0, index) +
    stringFromCodePoints(codePoints) +
    attributedString.string.slice(index);
  var runs = attributedString.runs.map(function(run, i) {
    if (i === runIndex) return insert(index - run.start, glyph, run);
    if (i > runIndex) return add(codePoints.length, run);
    return run;
  });
  return Object.assign({}, attributedString, {
    string: string,
    runs: runs,
  });
};

/**
 * Advance width between two string indices
 *
 * @param  {number}  start glyph index
 * @param  {number}  end glyph index
 * @param  {Object}  run
 * @return {Object} advanced width run
 */

var advanceWidthBetween$1 = function advanceWidthBetween(start, end, run) {
  var runStart = run.start || 0;
  var glyphStartIndex = Math.max(0, glyphIndexAt(start - runStart, run));
  var glyphEndIndex = Math.max(0, glyphIndexAt(end - runStart, run));
  var positions = (run.positions || []).slice(glyphStartIndex, glyphEndIndex);
  return advanceWidth$2(positions);
};

/**
 * Advance width between start and end
 * Does not consider ligature splitting for the moment.
 * Check performance impact on supporting this
 *
 * @param  {number}  start offset
 * @param  {number}  end offset
 * @param  {Object}  attributedString
 * @return {number} advance width
 */

var advanceWidthBetween = function advanceWidthBetween(
  start,
  end,
  attributedString,
) {
  var runs = filter(start, end, attributedString.runs);
  return runs.reduce(function(acc, run) {
    return acc + advanceWidthBetween$1(start, end, run);
  }, 0);
};

var HYPHEN = 0x002d;
var TOLERANCE_STEPS = 5;
var TOLERANCE_LIMIT = 50;
var opts = {
  width: 3,
  stretch: 6,
  shrink: 9,
};
/**
 * Slice attributed string to many lines
 *
 * @param {Object} attributed string
 * @param  {Array}  nodes
 * @param  {Array}  breaks
 * @return {Array} attributed strings
 */

var breakLines = function breakLines(string, nodes, breaks) {
  var start = 0;
  var end = null;
  var lines = breaks.reduce(function(acc, breakPoint) {
    var node = nodes[breakPoint.position];
    var prevNode = nodes[breakPoint.position - 1]; // Last breakpoint corresponds to K&P mandatory final glue

    if (breakPoint.position === nodes.length - 1) return acc;
    var line;

    if (node.type === 'penalty') {
      end = prevNode.value.end;
      line = slice(start, end, string);
      line = insertGlyph(line.length, HYPHEN, line);
    } else {
      end = node.value.end;
      line = slice(start, end, string);
    }

    start = end;
    return [].concat(acc, [line]);
  }, []); // Last line

  lines.push(slice(start, string.string.length, string));
  return lines;
};
/**
 * Return Knuth & Plass nodes based on line and previously calculated syllables
 *
 * @param {Object} attributed string
 * @param  {Object}  attributed string
 * @param  {Object}  layout options
 * @return {Array} attributed strings
 */

var getNodes = function getNodes(attributedString, _ref, options) {
  var align = _ref.align;
  var start = 0;
  var hyphenWidth = 5;
  var syllables = attributedString.syllables;
  var hyphenPenalty =
    options.hyphenationPenalty || (align === 'justify' ? 100 : 600);
  var result = syllables.reduce(function(acc, s, index) {
    var width = advanceWidthBetween(start, start + s.length, attributedString);

    if (s.trim() === '') {
      var stretch = (width * opts.width) / opts.stretch;
      var shrink = (width * opts.width) / opts.shrink;
      var value = {
        start: start,
        end: start + s.length,
      };
      acc.push(linebreak.glue(width, value, stretch, shrink));
    } else {
      var hyphenated = syllables[index + 1] !== ' ';
      var _value = {
        start: start,
        end: start + s.length,
      };
      acc.push(linebreak.box(width, _value, hyphenated));

      if (syllables[index + 1] && hyphenated) {
        acc.push(linebreak.penalty(hyphenWidth, hyphenPenalty, 1));
      }
    }

    start += s.length;
    return acc;
  }, []);
  result.push(linebreak.glue(0, null, linebreak.infinity, 0));
  result.push(linebreak.penalty(0, -linebreak.infinity, 1));
  return result;
};

var getStyles = function getStyles(attributedString) {
  var _attributedString$run, _attributedString$run2;

  return (
    ((_attributedString$run = attributedString.runs) === null ||
    _attributedString$run === void 0
      ? void 0
      : (_attributedString$run2 = _attributedString$run[0]) === null ||
        _attributedString$run2 === void 0
      ? void 0
      : _attributedString$run2.attributes) || {}
  );
};
/**
 * Performs Knuth & Plass line breaking algorithm
 * Fallbacks to best fit algorithm if latter not successful
 *
 * @param  {Object}  layout options
 * @param  {Object}  attributed string
 * @param {Object} attributed string
 * @return {Array} attributed strings
 */

var linebreaker = function linebreaker(options) {
  return function(attributedString, availableWidths) {
    var tolerance = options.tolerance || 4;
    var style = getStyles(attributedString);
    var nodes = getNodes(attributedString, style, options);
    var breaks = linebreak(nodes, availableWidths, {
      tolerance: tolerance,
    }); // Try again with a higher tolerance if the line breaking failed.

    while (breaks.length === 0 && tolerance < TOLERANCE_LIMIT) {
      tolerance += TOLERANCE_STEPS;
      breaks = linebreak(nodes, availableWidths, {
        tolerance: tolerance,
      });
    }

    if (
      breaks.length === 0 ||
      (breaks.length === 1 && breaks[0].position === 0)
    ) {
      breaks = applyBestFit(nodes, availableWidths);
    }

    return breakLines(attributedString, nodes, breaks.slice(1));
  };
};

var WHITESPACE_PRIORITY = 1;
var LETTER_PRIORITY = 2;
var EXPAND_WHITESPACE_FACTOR = {
  before: 0.5,
  after: 0.5,
  priority: WHITESPACE_PRIORITY,
  unconstrained: false,
};
var EXPAND_CHAR_FACTOR = {
  before: 0.14453125,
  // 37/256
  after: 0.14453125,
  priority: LETTER_PRIORITY,
  unconstrained: false,
};
var SHRINK_WHITESPACE_FACTOR = {
  before: -0.04296875,
  // -11/256
  after: -0.04296875,
  priority: WHITESPACE_PRIORITY,
  unconstrained: false,
};
var SHRINK_CHAR_FACTOR = {
  before: -0.04296875,
  after: -0.04296875,
  priority: LETTER_PRIORITY,
  unconstrained: false,
};

var getCharFactor = function getCharFactor(direction, options) {
  var expandCharFactor = options.expandCharFactor || {};
  var shrinkCharFactor = options.shrinkCharFactor || {};
  return direction === 'GROW'
    ? Object.assign({}, EXPAND_CHAR_FACTOR, expandCharFactor)
    : Object.assign({}, SHRINK_CHAR_FACTOR, shrinkCharFactor);
};

var getWhitespaceFactor = function getWhitespaceFactor(direction, options) {
  var expandWhitespaceFactor = options.expandWhitespaceFactor || {};
  var shrinkWhitespaceFactor = options.shrinkWhitespaceFactor || {};
  return direction === 'GROW'
    ? Object.assign({}, EXPAND_WHITESPACE_FACTOR, expandWhitespaceFactor)
    : Object.assign({}, SHRINK_WHITESPACE_FACTOR, shrinkWhitespaceFactor);
};

var factor = function factor(direction, options) {
  return function(glyphs) {
    var charFactor = getCharFactor(direction, options);
    var whitespaceFactor = getWhitespaceFactor(direction, options);
    var factors = [];

    for (var index = 0; index < glyphs.length; index += 1) {
      var f = void 0;
      var glyph = glyphs[index];

      if (isWhiteSpace(glyph)) {
        f = Object.assign({}, whitespaceFactor);

        if (index === glyphs.length - 1) {
          f.before = 0;

          if (index > 0) {
            factors[index - 1].after = 0;
          }
        }
      } else if (glyph.isMark && index > 0) {
        f = Object.assign({}, factors[index - 1]);
        f.before = 0;
        factors[index - 1].after = 0;
      } else {
        f = Object.assign({}, charFactor);
      }

      factors.push(f);
    }

    return factors;
  };
};

var getFactors = function getFactors(gap, line, options) {
  var direction = gap > 0 ? 'GROW' : 'SHRINK';
  var getFactor = factor(direction, options);
  var factors = line.runs.reduce(function(acc, run) {
    return acc.concat(getFactor(run.glyphs));
  }, []);
  factors[0].before = 0;
  factors[factors.length - 1].after = 0;
  return factors;
};

/* eslint-disable no-multi-assign */
var KASHIDA_PRIORITY = 0;
var NULL_PRIORITY = 3;

var getDistances = function getDistances(gap, factors) {
  var total = 0;
  var priorities = [];
  var unconstrained = [];

  for (
    var _priority = KASHIDA_PRIORITY;
    _priority <= NULL_PRIORITY;
    _priority += 1
  ) {
    priorities[_priority] = unconstrained[_priority] = 0;
  } // sum the factors at each priority

  for (var j = 0; j < factors.length; j += 1) {
    var f = factors[j];
    var sum = f.before + f.after;
    total += sum;
    priorities[f.priority] += sum;

    if (f.unconstrained) {
      unconstrained[f.priority] += sum;
    }
  } // choose the priorities that need to be applied

  var highestPriority = -1;
  var highestPrioritySum = 0;
  var remainingGap = gap;
  var priority;

  for (priority = KASHIDA_PRIORITY; priority <= NULL_PRIORITY; priority += 1) {
    var prioritySum = priorities[priority];

    if (prioritySum !== 0) {
      if (highestPriority === -1) {
        highestPriority = priority;
        highestPrioritySum = prioritySum;
      } // if this priority covers the remaining gap, we're done

      if (Math.abs(remainingGap) <= Math.abs(prioritySum)) {
        priorities[priority] = remainingGap / prioritySum;
        unconstrained[priority] = 0;
        remainingGap = 0;
        break;
      } // mark that we need to use 100% of the adjustment from
      // this priority, and subtract the space that it consumes

      priorities[priority] = 1;
      remainingGap -= prioritySum; // if this priority has unconstrained glyphs, let them consume the remaining space

      if (unconstrained[priority] !== 0) {
        unconstrained[priority] = remainingGap / unconstrained[priority];
        remainingGap = 0;
        break;
      }
    }
  } // zero out remaining priorities (if any)

  for (var p = priority + 1; p <= NULL_PRIORITY; p += 1) {
    priorities[p] = 0;
    unconstrained[p] = 0;
  } // if there is still space left over, assign it to the highest priority that we saw.
  // this violates their factors, but it only happens in extreme cases

  if (remainingGap > 0 && highestPriority > -1) {
    priorities[highestPriority] =
      (highestPrioritySum + (gap - total)) / highestPrioritySum;
  } // create and return an array of distances to add to each glyph's advance

  var distances = [];

  for (var index = 0; index < factors.length; index += 1) {
    // the distance to add to this glyph is the sum of the space to add
    // after this glyph, and the space to add before the next glyph
    var _f = factors[index];
    var next = factors[index + 1];
    var dist = _f.after * priorities[_f.priority];

    if (next) {
      dist += next.before * priorities[next.priority];
    } // if this glyph is unconstrained, add the unconstrained distance as well

    if (_f.unconstrained) {
      dist += _f.after * unconstrained[_f.priority];

      if (next) {
        dist += next.before * unconstrained[next.priority];
      }
    }

    distances.push(dist);
  }

  return distances;
};

/**
 * Adjust run positions by given distances
 *
 * @param {Array} distances
 * @param {Object} line
 * @returns {Object} line
 */

var justifyLine = function justifyLine(distances, line) {
  var index = 0;

  for (
    var _iterator = _createForOfIteratorHelperLoose__default['default'](
        line.runs,
      ),
      _step;
    !(_step = _iterator()).done;

  ) {
    var run = _step.value;

    for (
      var _iterator2 = _createForOfIteratorHelperLoose__default['default'](
          run.positions,
        ),
        _step2;
      !(_step2 = _iterator2()).done;

    ) {
      var position = _step2.value;
      position.xAdvance += distances[index++];
    }
  }

  return line;
};
/**
 * A JustificationEngine is used by a Typesetter to perform line fragment
 * justification. This implementation is based on a description of Apple's
 * justification algorithm from a PDF in the Apple Font Tools package.
 *
 * //TODO: Make it immutable
 *
 * @param {Object} layout options
 * @param {Object} line
 * @returns {Object} line
 */

var justification = function justification(options) {
  return function(line) {
    var gap = line.box.width - advanceWidth(line);
    if (gap === 0) return; // Exact fit

    var factors = getFactors(gap, line, options);
    var distances = getDistances(gap, factors);
    return justifyLine(distances, line);
  };
};

/**
 * Returns attributed string ascent
 *
 * @param {Object} attributed string
 * @return {number} ascent
 */

var ascent = function ascent(attributeString) {
  var reducer = function reducer(acc, run) {
    return Math.max(acc, ascent$1(run));
  };

  return attributeString.runs.reduce(reducer, 0);
};

/* eslint-disable no-param-reassign */

var BASE_FONT_SIZE = 12;
/**
 * A TextDecorationEngine is used by a Typesetter to generate
 * DecorationLines for a line fragment, including underlines
 * and strikes.
 */

var textDecoration = function textDecoration() {
  return function(lineFragment) {
    var x = lineFragment.overflowLeft || 0;
    var overflowRight = lineFragment.overflowRight || 0;
    var maxX = advanceWidth(lineFragment) - overflowRight;
    lineFragment.decorationLines = [];

    for (var i = 0; i < lineFragment.runs.length; i += 1) {
      var run = lineFragment.runs[i];
      var width = Math.min(maxX - x, advanceWidth$1(run));
      var thickness = Math.max(
        0.5,
        Math.floor(run.attributes.fontSize / BASE_FONT_SIZE),
      );

      if (run.attributes.underline) {
        var rect = {
          x: x,
          y: ascent(lineFragment) + thickness * 2,
          width: width,
          height: thickness,
        };
        var line = {
          rect: rect,
          opacity: run.attributes.opacity,
          color: run.attributes.underlineColor || 'black',
          style: run.attributes.underlineStyle || 'solid',
        };
        lineFragment.decorationLines.push(line);
      }

      if (run.attributes.strike) {
        var y = ascent(lineFragment) - ascent$1(run) / 3;
        var _rect = {
          x: x,
          y: y,
          width: width,
          height: thickness,
        };
        var _line = {
          rect: _rect,
          opacity: run.attributes.opacity,
          color: run.attributes.strikeColor || 'black',
          style: run.attributes.strikeStyle || 'solid',
        };
        lineFragment.decorationLines.push(_line);
      }

      x += width;
    }

    return lineFragment;
  };
};

var ignoredScripts = ['Common', 'Inherited', 'Unknown'];
/**
 * Resolves unicode script in runs, grouping equal runs together
 *
 * @param  {Object}  layout options
 * @param  {Object}  attributed string
 * @return {Object} attributed string
 */

var scriptItemizer = function scriptItemizer() {
  return function(attributedString) {
    var string = attributedString.string;
    var lastScript = 'Unknown';
    var lastIndex = 0;
    var index = 0;
    var res = [];
    if (!string) return empty();

    for (var i = 0; i < string.length; i += 1) {
      var char = string[i];
      var codePoint = char.codePointAt();
      var script = unicode__default['default'].getScript(codePoint);

      if (script !== lastScript && !ignoredScripts.includes(script)) {
        if (lastScript !== 'Unknown') {
          res.push({
            start: lastIndex,
            end: index,
            attributes: {
              script: lastScript,
            },
          });
        }

        lastIndex = index;
        lastScript = script;
      }

      index += char.length;
    }

    if (lastIndex < string.length) {
      res.push({
        start: lastIndex,
        end: string.length,
        attributes: {
          script: lastScript,
        },
      });
    }

    return {
      string: string,
      runs: res,
    };
  };
};

var SOFT_HYPHEN = '\xAD';
var hyphenator = hyphen__default['default'](pattern__default['default']);

var splitHyphen = function splitHyphen(word) {
  return word.split(SOFT_HYPHEN);
};

var cache = {};

var getParts = function getParts(word) {
  var base = word.includes(SOFT_HYPHEN) ? word : hyphenator(word);
  return splitHyphen(base);
};

var wordHyphenation = function wordHyphenation() {
  return function(word) {
    var cacheKey = '_' + word;
    if (fns.isNil(word)) return [];
    if (cache[cacheKey]) return cache[cacheKey];
    cache[cacheKey] = getParts(word);
    return cache[cacheKey];
  };
};

var getFontSize = function getFontSize(value) {
  return value.attributes.fontSize || 12;
};
/**
 * Resolve font runs in an AttributedString, grouping equal
 * runs and performing font substitution where necessary.
 *
 * @param  {Object}  layout options
 * @param  {Object}  attributed string
 * @return {Object} attributed string
 */

var fontSubstitution = function fontSubstitution() {
  return function(attributedString) {
    var string = attributedString.string,
      runs = attributedString.runs;
    var lastFont = null;
    var lastIndex = 0;
    var index = 0;
    var res = [];
    if (!string) return empty();

    for (
      var _iterator = _createForOfIteratorHelperLoose__default['default'](runs),
        _step;
      !(_step = _iterator()).done;

    ) {
      var run = _step.value;

      var _fontSize = getFontSize(run);

      var defaultFont = run.attributes.font;

      if (string.length === 0) {
        res.push({
          start: 0,
          end: 0,
          attributes: {
            font: defaultFont,
          },
        });
        break;
      }

      for (
        var _iterator2 = _createForOfIteratorHelperLoose__default['default'](
            string.slice(run.start, run.end),
          ),
          _step2;
        !(_step2 = _iterator2()).done;

      ) {
        var char = _step2.value;
        var font = defaultFont;

        if (font !== lastFont) {
          if (lastFont) {
            res.push({
              start: lastIndex,
              end: index,
              attributes: {
                font: lastFont,
                scale: lastFont ? _fontSize / lastFont.unitsPerEm : 0,
              },
            });
          }

          lastFont = font;
          lastIndex = index;
        }

        index += char.length;
      }
    }

    if (lastIndex < string.length) {
      var fontSize = getFontSize(fns.last(runs));
      res.push({
        start: lastIndex,
        end: string.length,
        attributes: {
          font: lastFont,
          scale: lastFont ? fontSize / lastFont.unitsPerEm : 0,
        },
      });
    }

    return {
      string: string,
      runs: res,
    };
  };
};

exports['default'] = layoutEngine;
exports.fontSubstitution = fontSubstitution;
exports.justification = justification;
exports.linebreaker = linebreaker;
exports.scriptItemizer = scriptItemizer;
exports.textDecoration = textDecoration;
exports.wordHyphenation = wordHyphenation;
