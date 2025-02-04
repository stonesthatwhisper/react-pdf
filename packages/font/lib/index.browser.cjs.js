'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var _asyncToGenerator = require('@babel/runtime/helpers/asyncToGenerator');
var _extends = require('@babel/runtime/helpers/extends');
var _regeneratorRuntime = require('@babel/runtime/regenerator');
var _objectWithoutPropertiesLoose = require('@babel/runtime/helpers/objectWithoutPropertiesLoose');
require('is-url');
var fetch = require('cross-fetch');
var fontkit = require('fontkit');

function _interopDefaultLegacy(e) {
  return e && typeof e === 'object' && 'default' in e ? e : { default: e };
}

function _interopNamespace(e) {
  if (e && e.__esModule) return e;
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function(k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(
          n,
          k,
          d.get
            ? d
            : {
                enumerable: true,
                get: function() {
                  return e[k];
                },
              },
        );
      }
    });
  }
  n['default'] = e;
  return Object.freeze(n);
}

var _asyncToGenerator__default = /*#__PURE__*/ _interopDefaultLegacy(
  _asyncToGenerator,
);
var _extends__default = /*#__PURE__*/ _interopDefaultLegacy(_extends);
var _regeneratorRuntime__default = /*#__PURE__*/ _interopDefaultLegacy(
  _regeneratorRuntime,
);
var _objectWithoutPropertiesLoose__default = /*#__PURE__*/ _interopDefaultLegacy(
  _objectWithoutPropertiesLoose,
);
var fetch__default = /*#__PURE__*/ _interopDefaultLegacy(fetch);
var fontkit__namespace = /*#__PURE__*/ _interopNamespace(fontkit);

var _excluded = ['src', 'fontWeight', 'fontStyle'];
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

var fetchFont = /*#__PURE__*/ (function() {
  var _ref = _asyncToGenerator__default['default'](
    /*#__PURE__*/ _regeneratorRuntime__default['default'].mark(function _callee(
      src,
      options,
    ) {
      var response, data;
      return _regeneratorRuntime__default['default'].wrap(function _callee$(
        _context,
      ) {
        while (1) {
          switch ((_context.prev = _context.next)) {
            case 0:
              _context.next = 2;
              return fetch__default['default'](src, options);

            case 2:
              response = _context.sent;
              _context.next = 5;
              return response.arrayBuffer();

            case 5:
              data = _context.sent;
              return _context.abrupt('return', new Uint8Array(data));

            case 7:
            case 'end':
              return _context.stop();
          }
        }
      },
      _callee);
    }),
  );

  return function fetchFont(_x, _x2) {
    return _ref.apply(this, arguments);
  };
})();

var isDataUrl = function isDataUrl(dataUrl) {
  var header = dataUrl.split(',')[0];
  var hasDataPrefix = header.substring(0, 5) === 'data:';
  var hasBase64Prefix = header.split(';')[1] === 'base64';
  return hasDataPrefix && hasBase64Prefix;
};

var resolveFontWeight = function resolveFontWeight(value) {
  return typeof value === 'string' ? FONT_WEIGHTS[value] : value;
};

var sortByFontWeight = function sortByFontWeight(a, b) {
  return a.fontWeight - b.fontWeight;
};

var FontSource = /*#__PURE__*/ (function() {
  function FontSource(src, fontFamily, fontStyle, fontWeight, options) {
    this.src = src;
    this.fontFamily = fontFamily;
    this.fontStyle = fontStyle || 'normal';
    this.fontWeight = fontWeight || 400;
    this.data = null;
    this.options = options;
    this.loadResultPromise = null;
  }

  var _proto = FontSource.prototype;

  _proto._load = /*#__PURE__*/ (function() {
    var _load2 = _asyncToGenerator__default['default'](
      /*#__PURE__*/ _regeneratorRuntime__default['default'].mark(
        function _callee2() {
          var postscriptName,
            raw,
            uint8Array,
            _this$options,
            headers,
            body,
            _this$options$method,
            method,
            data;

          return _regeneratorRuntime__default['default'].wrap(
            function _callee2$(_context2) {
              while (1) {
                switch ((_context2.prev = _context2.next)) {
                  case 0:
                    postscriptName = this.options.postscriptName;

                    if (!isDataUrl(this.src)) {
                      _context2.next = 7;
                      break;
                    }

                    raw = this.src.split(',')[1];
                    uint8Array = new Uint8Array(
                      atob(raw)
                        .split('')
                        .map(function(c) {
                          return c.charCodeAt(0);
                        }),
                    );
                    this.data = fontkit__namespace.create(
                      uint8Array,
                      postscriptName,
                    );
                    _context2.next = 19;
                    break;

                  case 7:
                    (_this$options = this.options),
                      (headers = _this$options.headers),
                      (body = _this$options.body),
                      (_this$options$method = _this$options.method),
                      (method =
                        _this$options$method === void 0
                          ? 'GET'
                          : _this$options$method);
                    _context2.next = 11;
                    return fetchFont(this.src, {
                      method: method,
                      body: body,
                      headers: headers,
                    });

                  case 11:
                    data = _context2.sent;
                    this.data = fontkit__namespace.create(data, postscriptName);
                    _context2.next = 19;
                    break;

                  case 15: {
                    _context2.next = 19;
                    break;
                  }

                  case 18:
                    this.data = _context2.sent;

                  case 19:
                  case 'end':
                    return _context2.stop();
                }
              }
            },
            _callee2,
            this,
          );
        },
      ),
    );

    function _load() {
      return _load2.apply(this, arguments);
    }

    return _load;
  })();

  _proto.load = /*#__PURE__*/ (function() {
    var _load3 = _asyncToGenerator__default['default'](
      /*#__PURE__*/ _regeneratorRuntime__default['default'].mark(
        function _callee3() {
          return _regeneratorRuntime__default['default'].wrap(
            function _callee3$(_context3) {
              while (1) {
                switch ((_context3.prev = _context3.next)) {
                  case 0:
                    if (this.loadResultPromise === null) {
                      this.loadResultPromise = this._load();
                    }

                    return _context3.abrupt('return', this.loadResultPromise);

                  case 2:
                  case 'end':
                    return _context3.stop();
                }
              }
            },
            _callee3,
            this,
          );
        },
      ),
    );

    function load() {
      return _load3.apply(this, arguments);
    }

    return load;
  })();

  return FontSource;
})();

var Font = /*#__PURE__*/ (function() {
  Font.create = function create(family) {
    return new Font(family);
  };

  function Font(family) {
    this.family = family;
    this.sources = [];
  }

  var _proto2 = Font.prototype;

  _proto2.register = function register(_ref2) {
    var src = _ref2.src,
      fontWeight = _ref2.fontWeight,
      fontStyle = _ref2.fontStyle,
      options = _objectWithoutPropertiesLoose__default['default'](
        _ref2,
        _excluded,
      );

    var numericFontWeight = resolveFontWeight(fontWeight);
    this.sources.push(
      new FontSource(src, this.family, fontStyle, numericFontWeight, options),
    );
  };

  _proto2.resolve = function resolve(descriptor) {
    var _descriptor$fontWeigh = descriptor.fontWeight,
      fontWeight =
        _descriptor$fontWeigh === void 0 ? 400 : _descriptor$fontWeigh,
      _descriptor$fontStyle = descriptor.fontStyle,
      fontStyle =
        _descriptor$fontStyle === void 0 ? 'normal' : _descriptor$fontStyle;
    var styleSources = this.sources.filter(function(s) {
      return s.fontStyle === fontStyle;
    }); // Weight resolution. https://developer.mozilla.org/en-US/docs/Web/CSS/font-weight#Fallback_weights

    var exactFit = styleSources.find(function(s) {
      return s.fontWeight === fontWeight;
    });
    if (exactFit) return exactFit;
    var res;

    if (fontWeight >= 400 && fontWeight <= 500) {
      var leftOffset = styleSources.filter(function(s) {
        return s.fontWeight <= fontWeight;
      });
      var rightOffset = styleSources.filter(function(s) {
        return s.fontWeight > 500;
      });
      var fit = styleSources.filter(function(s) {
        return s.fontWeight >= fontWeight && s.fontWeight < 500;
      });
      res = fit[0] || leftOffset[leftOffset.length - 1] || rightOffset[0];
    }

    var lt = styleSources
      .filter(function(s) {
        return s.fontWeight < fontWeight;
      })
      .sort(sortByFontWeight);
    var gt = styleSources
      .filter(function(s) {
        return s.fontWeight > fontWeight;
      })
      .sort(sortByFontWeight);

    if (fontWeight < 400) {
      res = lt[lt.length - 1] || gt[0];
    }

    if (fontWeight > 500) {
      res = gt[0] || lt[lt.length - 1];
    }

    if (!res) {
      throw new Error(
        'Could not resolve font for ' +
          this.family +
          ', fontWeight ' +
          fontWeight,
      );
    }

    return res;
  };

  return Font;
})();

var standard = [
  'Courier',
  'Courier-Bold',
  'Courier-Oblique',
  'Courier-BoldOblique',
  'Helvetica',
  'Helvetica-Bold',
  'Helvetica-Oblique',
  'Helvetica-BoldOblique',
  'Times-Roman',
  'Times-Bold',
  'Times-Italic',
  'Times-BoldItalic',
];

function FontStore() {
  var _this = this;

  var fonts = {};
  var emojiSource = null;
  var hyphenationCallback = null;

  this.register = function(data) {
    var family = data.family;

    if (!fonts[family]) {
      fonts[family] = Font.create(family);
    } // Bulk loading

    if (data.fonts) {
      for (var i = 0; i < data.fonts.length; i += 1) {
        fonts[family].register(
          _extends__default['default'](
            {
              family: family,
            },
            data.fonts[i],
          ),
        );
      }
    } else {
      fonts[family].register(data);
    }
  };

  this.registerEmojiSource = function(_ref) {
    var url = _ref.url,
      _ref$format = _ref.format,
      format = _ref$format === void 0 ? 'png' : _ref$format;
    emojiSource = {
      url: url,
      format: format,
    };
  };

  this.registerHyphenationCallback = function(callback) {
    hyphenationCallback = callback;
  };

  this.getFont = function(descriptor) {
    var fontFamily = descriptor.fontFamily;
    var isStandard = standard.includes(fontFamily);
    if (isStandard) return null;

    if (!fonts[fontFamily]) {
      throw new Error(
        'Font family not registered: ' +
          fontFamily +
          '. Please register it calling Font.register() method.',
      );
    }

    return fonts[fontFamily].resolve(descriptor);
  };

  this.load = /*#__PURE__*/ (function() {
    var _ref2 = _asyncToGenerator__default['default'](
      /*#__PURE__*/ _regeneratorRuntime__default['default'].mark(
        function _callee(descriptor) {
          var fontFamily, isStandard, f;
          return _regeneratorRuntime__default['default'].wrap(function _callee$(
            _context,
          ) {
            while (1) {
              switch ((_context.prev = _context.next)) {
                case 0:
                  fontFamily = descriptor.fontFamily;
                  isStandard = standard.includes(fontFamily);

                  if (!isStandard) {
                    _context.next = 4;
                    break;
                  }

                  return _context.abrupt('return');

                case 4:
                  f = _this.getFont(descriptor); // We cache the font to avoid fetching it many times

                  _context.next = 7;
                  return f.load();

                case 7:
                case 'end':
                  return _context.stop();
              }
            }
          },
          _callee);
        },
      ),
    );

    return function(_x) {
      return _ref2.apply(this, arguments);
    };
  })();

  this.reset = function() {
    var keys = Object.keys(fonts);

    for (var i = 0; i < keys.length; i += 1) {
      var key = keys[i];
      fonts[key].data = null;
    }
  };

  this.clear = function() {
    fonts = {};
  };

  this.getRegisteredFonts = function() {
    return fonts;
  };

  this.getEmojiSource = function() {
    return emojiSource;
  };

  this.getHyphenationCallback = function() {
    return hyphenationCallback;
  };

  this.getRegisteredFontFamilies = function() {
    return Object.keys(fonts);
  };
}

exports['default'] = FontStore;
