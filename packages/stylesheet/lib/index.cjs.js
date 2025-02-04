'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var fns = require('@react-pdf/fns');
var parse$1 = require('postcss-value-parser/lib/parse');
var parseUnit = require('postcss-value-parser/lib/unit');
var hlsToHex = require('hsl-to-hex');
var colorString = require('color-string');
var _extends = require('@babel/runtime/helpers/extends');
var matchMedia = require('media-engine');

function _interopDefaultLegacy(e) {
  return e && typeof e === 'object' && 'default' in e ? e : { default: e };
}

var parse__default = /*#__PURE__*/ _interopDefaultLegacy(parse$1);
var parseUnit__default = /*#__PURE__*/ _interopDefaultLegacy(parseUnit);
var hlsToHex__default = /*#__PURE__*/ _interopDefaultLegacy(hlsToHex);
var colorString__default = /*#__PURE__*/ _interopDefaultLegacy(colorString);
var _extends__default = /*#__PURE__*/ _interopDefaultLegacy(_extends);
var matchMedia__default = /*#__PURE__*/ _interopDefaultLegacy(matchMedia);

var flexDefaults = [1, 1, 0];

var expandFlex = function expandFlex(key, value) {
  var matches = ('' + value).split(' ');
  var flexGrow = matches[0] || flexDefaults[0];
  var flexShrink = matches[1] || flexDefaults[1];
  var flexBasis = matches[2] || flexDefaults[2];
  return {
    flexGrow: flexGrow,
    flexShrink: flexShrink,
    flexBasis: flexBasis,
  };
};

/* eslint-disable no-plusplus */
var BOX_MODEL_UNITS = 'px,in,mm,cm,pt,%,vw,vh';

var logError = function logError(style, value) {
  console.error(
    '\n    @react-pdf/stylesheet parsing error:\n\n    ' +
      style +
      ': ' +
      value +
      ',\n    ' +
      ' '.repeat(style.length + 2) +
      '^\n    Unsupported ' +
      style +
      ' value format\n  ',
  );
};

var expandBoxModel = function expandBoxModel(_temp) {
  var _ref = _temp === void 0 ? {} : _temp,
    expandsTo = _ref.expandsTo,
    _ref$maxValues = _ref.maxValues,
    maxValues = _ref$maxValues === void 0 ? 1 : _ref$maxValues,
    _ref$autoSupported = _ref.autoSupported,
    autoSupported = _ref$autoSupported === void 0 ? false : _ref$autoSupported;

  return function(model, value) {
    var _ref2;

    var nodes = parse__default['default']('' + value);
    var parts = [];

    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i]; // value contains `calc`, `url` or other css function
      // `,`, `/` or strings that unsupported by margin and padding

      if (
        node.type === 'function' ||
        node.type === 'string' ||
        node.type === 'div'
      ) {
        logError(model, value);
        return {};
      }

      if (node.type === 'word') {
        if (node.value === 'auto' && autoSupported) {
          parts.push(node.value);
        } else {
          var result = parseUnit__default['default'](node.value); // when unit isn't specified this condition is true

          if (result && BOX_MODEL_UNITS.includes(result.unit)) {
            parts.push(node.value);
          } else {
            logError(model, value);
            return {};
          }
        }
      }
    } // checks that we have enough parsed values

    if (parts.length > maxValues) {
      logError(model, value);
      return {};
    }

    var first = parts[0];

    if (expandsTo) {
      var second = parts[1] || parts[0];
      var third = parts[2] || parts[0];
      var fourth = parts[3] || parts[1] || parts[0];
      return expandsTo({
        first: first,
        second: second,
        third: third,
        fourth: fourth,
      });
    }

    return (_ref2 = {}), (_ref2[model] = first), _ref2;
  };
};

var processMargin = expandBoxModel({
  expandsTo: function expandsTo(_ref) {
    var first = _ref.first,
      second = _ref.second,
      third = _ref.third,
      fourth = _ref.fourth;
    return {
      marginTop: first,
      marginRight: second,
      marginBottom: third,
      marginLeft: fourth,
    };
  },
  maxValues: 4,
  autoSupported: true,
});
var processMarginVertical = expandBoxModel({
  expandsTo: function expandsTo(_ref2) {
    var first = _ref2.first,
      second = _ref2.second;
    return {
      marginTop: first,
      marginBottom: second,
    };
  },
  maxValues: 2,
  autoSupported: true,
});
var processMarginHorizontal = expandBoxModel({
  expandsTo: function expandsTo(_ref3) {
    var first = _ref3.first,
      second = _ref3.second;
    return {
      marginRight: first,
      marginLeft: second,
    };
  },
  maxValues: 2,
  autoSupported: true,
});
var processMarginSingle = expandBoxModel({
  autoSupported: true,
});

var BORDER_SHORTHAND_REGEX = /(-?\d+(\.\d+)?(px|in|mm|cm|pt|vw|vh|px)?)\s(\S+)\s(.+)/;

var matchBorderShorthand = function matchBorderShorthand(value) {
  return value.match(BORDER_SHORTHAND_REGEX) || [];
};

var expandBorders = function expandBorders(key, value) {
  var match = matchBorderShorthand('' + value);

  if (match) {
    var color = match[5] || value;
    var style = match[4] || value;
    var width = match[1] || value;

    if (key.match(/(Top|Right|Bottom|Left)$/)) {
      var _ref;

      return (
        (_ref = {}),
        (_ref[key + 'Color'] = color),
        (_ref[key + 'Style'] = style),
        (_ref[key + 'Width'] = width),
        _ref
      );
    }

    if (key.match(/Color$/)) {
      return {
        borderTopColor: color,
        borderRightColor: color,
        borderBottomColor: color,
        borderLeftColor: color,
      };
    }

    if (key.match(/Style$/)) {
      return {
        borderTopStyle: style,
        borderRightStyle: style,
        borderBottomStyle: style,
        borderLeftStyle: style,
      };
    }

    if (key.match(/Width$/)) {
      return {
        borderTopWidth: width,
        borderRightWidth: width,
        borderBottomWidth: width,
        borderLeftWidth: width,
      };
    }

    if (key.match(/Radius$/)) {
      return {
        borderTopLeftRadius: value,
        borderTopRightRadius: value,
        borderBottomRightRadius: value,
        borderBottomLeftRadius: value,
      };
    }

    return {
      borderTopColor: color,
      borderTopStyle: style,
      borderTopWidth: width,
      borderRightColor: color,
      borderRightStyle: style,
      borderRightWidth: width,
      borderBottomColor: color,
      borderBottomStyle: style,
      borderBottomWidth: width,
      borderLeftColor: color,
      borderLeftStyle: style,
      borderLeftWidth: width,
    };
  }

  return value;
};

var processPadding = expandBoxModel({
  expandsTo: function expandsTo(_ref) {
    var first = _ref.first,
      second = _ref.second,
      third = _ref.third,
      fourth = _ref.fourth;
    return {
      paddingTop: first,
      paddingRight: second,
      paddingBottom: third,
      paddingLeft: fourth,
    };
  },
  maxValues: 4,
});
var processPaddingVertical = expandBoxModel({
  expandsTo: function expandsTo(_ref2) {
    var first = _ref2.first,
      second = _ref2.second;
    return {
      paddingTop: first,
      paddingBottom: second,
    };
  },
  maxValues: 2,
});
var processPaddingHorizontal = expandBoxModel({
  expandsTo: function expandsTo(_ref3) {
    var first = _ref3.first,
      second = _ref3.second;
    return {
      paddingRight: first,
      paddingLeft: second,
    };
  },
  maxValues: 2,
});
var processPaddingSingle = expandBoxModel();

var expandObjectPosition = function expandObjectPosition(key, value) {
  var match = ('' + value).split(' ');
  return {
    objectPositionX:
      (match === null || match === void 0 ? void 0 : match[0]) || value,
    objectPositionY:
      (match === null || match === void 0 ? void 0 : match[1]) || value,
  };
};

var Y_AXIS_SHORTHANDS = {
  top: true,
  bottom: true,
};

var sortTransformOriginPair = function sortTransformOriginPair(a, b) {
  if (Y_AXIS_SHORTHANDS[a]) return 1;
  if (Y_AXIS_SHORTHANDS[b]) return -1;
  return 0;
};

var getTransformOriginPair = function getTransformOriginPair(values) {
  if (!values || values.length === 0) return ['center', 'center'];
  var pair = values.length === 1 ? [values[0], 'center'] : values;
  return pair.sort(sortTransformOriginPair);
}; // Transforms shorthand transformOrigin values

var expandTransformOrigin = function expandTransformOrigin(key, value) {
  var match = ('' + value).split(' ');
  var pair = getTransformOriginPair(match);
  return {
    transformOriginX: pair[0],
    transformOriginY: pair[1],
  };
};

var shorthands = {
  flex: expandFlex,
  margin: processMargin,
  marginHorizontal: processMarginHorizontal,
  marginVertical: processMarginVertical,
  marginTop: processMarginSingle,
  marginRight: processMarginSingle,
  marginBottom: processMarginSingle,
  marginLeft: processMarginSingle,
  padding: processPadding,
  paddingHorizontal: processPaddingHorizontal,
  paddingVertical: processPaddingVertical,
  paddingTop: processPaddingSingle,
  paddingRight: processPaddingSingle,
  paddingBottom: processPaddingSingle,
  paddingLeft: processPaddingSingle,
  border: expandBorders,
  borderTop: expandBorders,
  borderRight: expandBorders,
  borderBottom: expandBorders,
  borderLeft: expandBorders,
  borderColor: expandBorders,
  borderRadius: expandBorders,
  borderStyle: expandBorders,
  borderWidth: expandBorders,
  objectPosition: expandObjectPosition,
  transformOrigin: expandTransformOrigin,
};
/**
 * Transforms style key-value
 *
 * @param {String} key style key
 * @param {String} value style value
 * @returns {String | Number} transformed style values
 */

var expandStyle = function expandStyle(key, value) {
  var _ref;

  return shorthands[key]
    ? shorthands[key](key, value)
    : ((_ref = {}), (_ref[key] = value), _ref);
};
/**
 * Expand the shorthand properties.
 *
 * @param { Object } style object
 * @returns { Object } expanded style object
 */

var expand = function expand(style) {
  if (!style) return style;
  var propsArray = Object.keys(style);
  var resolvedStyle = {};

  for (var i = 0; i < propsArray.length; i += 1) {
    var key = propsArray[i];
    var value = style[key];
    var extended = expandStyle(key, value);
    var keys = Object.keys(extended);

    for (var j = 0; j < keys.length; j += 1) {
      var propName = keys[j];
      var propValue = extended[propName];
      resolvedStyle[propName] = propValue;
    }
  }

  return resolvedStyle;
};

/**
 * Remove nil values from array
 *
 * @param {Array} array
 * @returns {Array} array without nils
 */

var compact = function compact(array) {
  return array.filter(Boolean);
};
/**
 * Merges style objects array
 *
 * @param {Array} style objects array
 * @returns {Object} merged style object
 */

var mergeStyles = function mergeStyles(styles) {
  return styles.reduce(function(acc, style) {
    var s = Array.isArray(style) ? flatten(style) : style;
    Object.keys(s).forEach(function(key) {
      if (s[key] !== null && s[key] !== undefined) {
        acc[key] = s[key];
      }
    });
    return acc;
  }, {});
};
/**
 * Flattens an array of style objects, into one aggregated style object.
 *
 * @param {Array} style objects array
 * @returns {Object} flatted style object
 */

var flatten = fns.compose(mergeStyles, compact, fns.castArray);

/**
 * Parses scalar value in value and unit pairs
 *
 * @param {String} scalar value
 * @returns {Object} parsed value
 */
var parseValue = function parseValue(value) {
  var match = /^(-?\d*\.?\d+)(in|mm|cm|pt|vh|vw|px)?$/g.exec(value);
  return match
    ? {
        value: parseFloat(match[1], 10),
        unit: match[2] || 'pt',
      }
    : {
        value: value,
        unit: undefined,
      };
};
/**
 * Transform given scalar value
 *
 * @param {Object} container
 * @param {String} styles value
 * @returns {Object} transformed value
 */

var transformUnit = function transformUnit(container, value) {
  var scalar = parseValue(value);
  var dpi = container.dpi || 72;
  var mmFactor = (1 / 25.4) * dpi;
  var cmFactor = (1 / 2.54) * dpi;

  switch (scalar.unit) {
    case 'in':
      return scalar.value * dpi;

    case 'mm':
      return scalar.value * mmFactor;

    case 'cm':
      return scalar.value * cmFactor;

    case 'vh':
      return scalar.value * (container.height / 100);

    case 'vw':
      return scalar.value * (container.width / 100);

    default:
      return scalar.value;
  }
};

var isRgb = function isRgb(value) {
  return /rgba?/g.test(value);
};

var isHsl = function isHsl(value) {
  return /hsla?/g.test(value);
};
/**
 * Transform rgb color to hexa
 *
 * @param {String} styles value
 * @returns {Object} transformed value
 */

var parseRgb = function parseRgb(value) {
  var rgb = colorString__default['default'].get.rgb(value);
  return colorString__default['default'].to.hex(rgb);
};
/**
 * Transform Hsl color to hexa
 *
 * @param {String} styles value
 * @returns {Object} transformed value
 */

var parseHsl = function parseHsl(value) {
  var hsl = colorString__default['default'].get.hsl(value).map(Math.round);
  var hex = hlsToHex__default['default'].apply(void 0, hsl);
  return hex.toUpperCase();
};
/**
 * Transform given color to hexa
 *
 * @param {String} styles value
 * @returns {Object} transformed value
 */

var transformColor = function transformColor(value) {
  if (isRgb(value)) return parseRgb(value);
  if (isHsl(value)) return parseHsl(value);
  return value;
};

var parse = function parse(transformString) {
  var transforms = transformString.trim().split(/\) |\)/); // Handle "initial", "inherit", "unset".

  if (transforms.length === 1) {
    return [[transforms[0], true]];
  }

  var parsed = [];

  for (var i = 0; i < transforms.length; i += 1) {
    var transform = transforms[i];

    if (transform) {
      var _transform$split = transform.split('('),
        name = _transform$split[0],
        rawValue = _transform$split[1];

      var splitChar = rawValue.indexOf(',') >= 0 ? ',' : ' ';
      var value = rawValue.split(splitChar).map(function(val) {
        return val.trim();
      });
      parsed.push({
        operation: name,
        value: value,
      });
    }
  }

  return parsed;
};

var parseAngle = function parseAngle(value) {
  var unitsRegexp = /(-?\d*\.?\d*)(\w*)?/i;

  var _unitsRegexp$exec = unitsRegexp.exec(value),
    angle = _unitsRegexp$exec[1],
    unit = _unitsRegexp$exec[2];

  var number = Number.parseFloat(angle);
  return unit === 'rad' ? (number * 180) / Math.PI : number;
};

var normalizeTransformOperation = function normalizeTransformOperation(_ref) {
  var operation = _ref.operation,
    value = _ref.value;

  switch (operation) {
    case 'scale': {
      var _value$map = value.map(function(num) {
          return Number.parseFloat(num);
        }),
        scaleX = _value$map[0],
        _value$map$ = _value$map[1],
        scaleY = _value$map$ === void 0 ? scaleX : _value$map$;

      return {
        operation: 'scale',
        value: [scaleX, scaleY],
      };
    }

    case 'scaleX': {
      return {
        operation: 'scale',
        value: [Number.parseFloat(value), 1],
      };
    }

    case 'scaleY': {
      return {
        operation: 'scale',
        value: [1, Number.parseFloat(value)],
      };
    }

    case 'rotate': {
      return {
        operation: 'rotate',
        value: [parseAngle(value)],
      };
    }

    case 'translate': {
      return {
        operation: 'translate',
        value: value.map(function(num) {
          return Number.parseFloat(num);
        }),
      };
    }

    case 'translateX': {
      return {
        operation: 'translate',
        value: [Number.parseFloat(value), 0],
      };
    }

    case 'translateY': {
      return {
        operation: 'translate',
        value: [0, Number.parseFloat(value)],
      };
    }

    case 'skew': {
      return {
        operation: 'skew',
        value: value.map(parseAngle),
      };
    }

    case 'skewX': {
      return {
        operation: 'skew',
        value: [parseAngle(value), 0],
      };
    }

    case 'skewY': {
      return {
        operation: 'skew',
        value: [0, parseAngle(value)],
      };
    }

    default: {
      return {
        operation: operation,
        value: value.map(function(num) {
          return Number.parseFloat(num);
        }),
      };
    }
  }
};

var normalize = function normalize(operations) {
  return operations.map(function(operation) {
    return normalizeTransformOperation(operation);
  });
};

var processTransform = function processTransform(value) {
  if (typeof value !== 'string') return value;
  return normalize(parse(value));
};

var FONT_WEIGHTS = {
  thin: 100,
  hairline: 100,
  ultralight: 200,
  extralight: 200,
  light: 300,
  normal: 400,
  medium: 500,
  semibold: 600,
  demibold: 600,
  bold: 700,
  ultrabold: 800,
  extrabold: 800,
  heavy: 900,
  black: 900,
};

var processFontWeight = function processFontWeight(value) {
  if (!value) return FONT_WEIGHTS.normal;
  if (typeof value === 'number') return value;
  var lv = value.toLowerCase();
  if (FONT_WEIGHTS[lv]) return FONT_WEIGHTS[lv];
  return value;
};

var matchNumber = function matchNumber(value) {
  return typeof value === 'string' && /^-?\d*\.?\d*$/.test(value);
};

var castFloat = function castFloat(value) {
  if (typeof value !== 'string') return value;
  if (matchNumber(value)) return parseFloat(value, 10);
  return value;
};

var offsetKeyword = function offsetKeyword(value) {
  switch (value) {
    case 'top':
    case 'left':
      return '0%';

    case 'right':
    case 'bottom':
      return '100%';

    case 'center':
      return '50%';

    default:
      return null;
  }
};

var transformObjectPosition = function transformObjectPosition(value) {
  return offsetKeyword(value) || castFloat(value);
};

var transformTransformOrigin = function transformTransformOrigin(value) {
  return offsetKeyword(value) || castFloat(value);
};

var handlers = {
  transform: processTransform,
  fontWeight: processFontWeight,
  objectPositionX: transformObjectPosition,
  objectPositionY: transformObjectPosition,
  transformOriginX: transformTransformOrigin,
  transformOriginY: transformTransformOrigin,
};

var transformStyle = function transformStyle(key, value, container) {
  var result = handlers[key] ? handlers[key](value) : value;
  return transformColor(transformUnit(container, castFloat(result)));
};
/**
 * Transform styles values
 *
 * @param {Object} styles object
 * @returns {Object} transformed styles
 */

var transform = function transform(container) {
  return function(style) {
    if (!style) return style;
    var propsArray = Object.keys(style);
    var resolvedStyle = {};

    for (var i = 0; i < propsArray.length; i += 1) {
      var key = propsArray[i];
      var value = style[key];
      var transformed = transformStyle(key, value, container);
      resolvedStyle[key] = transformed;
    }

    return resolvedStyle;
  };
};

/**
 * Resolves media queries in styles object
 *
 * @param {Object} container
 * @param {Object} styles object
 */

var resolveMediaQueries = function resolveMediaQueries(container, styles) {
  return Object.keys(styles).reduce(function(acc, key) {
    var _extends2;

    if (/@media/.test(key)) {
      var _matchMedia;

      return _extends__default['default'](
        {},
        acc,
        matchMedia__default['default'](
          ((_matchMedia = {}), (_matchMedia[key] = styles[key]), _matchMedia),
          container,
        ),
      );
    }

    return _extends__default['default'](
      {},
      acc,
      ((_extends2 = {}), (_extends2[key] = styles[key]), _extends2),
    );
  }, {});
};

/**
 * Resolves styles
 *
 * @param {Object} container
 * @param {Object} style object
 * @returns {Object} resolved style object
 */

var resolveStyles = function resolveStyles(container, style) {
  var computeMediaQueries = function computeMediaQueries(value) {
    return resolveMediaQueries(container, value);
  };

  return fns.compose(
    transform(container),
    expand,
    computeMediaQueries,
    flatten,
  )(style);
}; // Utils exported for SVG processing

exports['default'] = resolveStyles;
exports.flatten = flatten;
exports.processTransform = processTransform;
exports.transformColor = transformColor;
