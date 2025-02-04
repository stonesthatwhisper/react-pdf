import _inheritsLoose from '@babel/runtime/helpers/inheritsLoose';
import stream from 'stream';
import _assertThisInitialized from '@babel/runtime/helpers/assertThisInitialized';
import zlib from 'zlib';
import _createForOfIteratorHelperLoose from '@babel/runtime/helpers/createForOfIteratorHelperLoose';
import CryptoJS from 'crypto-js/md5';
import * as fontkit from 'fontkit';
import fs from 'fs';
import PNG from '@react-pdf/png-js';
import _extends from '@babel/runtime/helpers/extends';

var PDFReference = /*#__PURE__*/ (function(_stream$Writable) {
  _inheritsLoose(PDFReference, _stream$Writable);

  function PDFReference(document, id, data) {
    var _this;

    _this =
      _stream$Writable.call(this, {
        decodeStrings: false
      }) || this;
    _this.finalize = _this.finalize.bind(_assertThisInitialized(_this));
    _this.document = document;
    _this.id = id;

    if (data == null) {
      data = {};
    }

    _this.data = data;
    _this.gen = 0;
    _this.deflate = null;
    _this.compress = _this.document.compress && !_this.data.Filter;
    _this.uncompressedLength = 0;
    _this.chunks = [];
    return _this;
  }

  var _proto = PDFReference.prototype;

  _proto.initDeflate = function initDeflate() {
    var _this2 = this;

    this.data.Filter = 'FlateDecode';
    this.deflate = zlib.createDeflate();
    this.deflate.on('data', function(chunk) {
      _this2.chunks.push(chunk);

      return (_this2.data.Length += chunk.length);
    });
    return this.deflate.on('end', this.finalize);
  };

  _proto._write = function _write(chunk, encoding, callback) {
    if (!(chunk instanceof Uint8Array)) {
      chunk = Buffer.from(chunk + '\n', 'binary');
    }

    this.uncompressedLength += chunk.length;

    if (this.data.Length == null) {
      this.data.Length = 0;
    }

    if (this.compress) {
      if (!this.deflate) {
        this.initDeflate();
      }

      this.deflate.write(chunk);
    } else {
      this.chunks.push(chunk);
      this.data.Length += chunk.length;
    }

    return callback();
  };

  _proto.end = function end() {
    _stream$Writable.prototype.end.apply(this, arguments);

    if (this.deflate) {
      return this.deflate.end();
    }

    return this.finalize();
  };

  _proto.finalize = function finalize() {
    this.offset = this.document._offset;

    this.document._write(this.id + ' ' + this.gen + ' obj');

    this.document._write(PDFObject$1.convert(this.data));

    if (this.chunks.length) {
      this.document._write('stream');

      for (
        var _i = 0, _Array$from = Array.from(this.chunks);
        _i < _Array$from.length;
        _i++
      ) {
        var chunk = _Array$from[_i];

        this.document._write(chunk);
      }

      this.chunks.length = 0; // free up memory

      this.document._write('\nendstream');
    }

    this.document._write('endobj');

    return this.document._refEnd(this);
  };

  _proto.toString = function toString() {
    return this.id + ' ' + this.gen + ' R';
  };

  return PDFReference;
})(stream.Writable);

var PDFTree = /*#__PURE__*/ (function() {
  function PDFTree(options) {
    if (options === void 0) {
      options = {};
    }

    this._items = {}; // disable /Limits output for this tree

    this.limits = typeof options.limits === 'boolean' ? options.limits : true;
  }

  var _proto = PDFTree.prototype;

  _proto.add = function add(key, val) {
    return (this._items[key] = val);
  };

  _proto.get = function get(key) {
    return this._items[key];
  };

  _proto.toString = function toString() {
    var _this = this;

    // Needs to be sorted by key
    var sortedKeys = Object.keys(this._items).sort(function(a, b) {
      return _this._compareKeys(a, b);
    });
    var out = ['<<'];

    if (this.limits && sortedKeys.length > 1) {
      var first = sortedKeys[0];
      var last = sortedKeys[sortedKeys.length - 1];
      out.push(
        '  /Limits ' +
          PDFObject$1.convert([this._dataForKey(first), this._dataForKey(last)])
      );
    }

    out.push('  /' + this._keysName() + ' [');

    for (
      var _iterator = _createForOfIteratorHelperLoose(sortedKeys), _step;
      !(_step = _iterator()).done;

    ) {
      var key = _step.value;
      out.push(
        '    ' +
          PDFObject$1.convert(this._dataForKey(key)) +
          ' ' +
          PDFObject$1.convert(this._items[key])
      );
    }

    out.push(']');
    out.push('>>');
    return out.join('\n');
  };

  _proto._compareKeys = function _compareKeys() {
    throw new Error('Must be implemented by subclasses');
  };

  _proto._keysName = function _keysName() {
    throw new Error('Must be implemented by subclasses');
  };

  _proto._dataForKey = function _dataForKey() {
    throw new Error('Must be implemented by subclasses');
  };

  return PDFTree;
})();

var PDFNameTree = /*#__PURE__*/ (function(_PDFTree) {
  _inheritsLoose(PDFNameTree, _PDFTree);

  function PDFNameTree() {
    return _PDFTree.apply(this, arguments) || this;
  }

  var _proto = PDFNameTree.prototype;

  _proto._compareKeys = function _compareKeys(a, b) {
    return a.localeCompare(b);
  };

  _proto._keysName = function _keysName() {
    return 'Names';
  };

  _proto._dataForKey = function _dataForKey(k) {
    return new String(k);
  };

  return PDFNameTree;
})(PDFTree);

var escapableRe = /[\n\r\t\b\f\(\)\\]/g;
var escapable = {
  '\n': '\\n',
  '\r': '\\r',
  '\t': '\\t',
  '\b': '\\b',
  '\f': '\\f',
  '\\': '\\\\',
  '(': '\\(',
  ')': '\\)'
};

var pad = function pad(str, length) {
  return (Array(length + 1).join('0') + str).slice(-length);
}; // Convert little endian UTF-16 to big endian

var swapBytes = function swapBytes(buff) {
  var l = buff.length;

  if (l & 0x01) {
    throw new Error('Buffer length must be even');
  } else {
    for (var i = 0, end = l - 1; i < end; i += 2) {
      var a = buff[i];
      buff[i] = buff[i + 1];
      buff[i + 1] = a;
    }
  }

  return buff;
};

var PDFObject = /*#__PURE__*/ (function() {
  function PDFObject() {}

  PDFObject.convert = function convert(object) {
    // String literals are converted to the PDF name type
    if (typeof object === 'string') {
      return '/' + object;
    } // String objects are converted to PDF strings (UTF-16)

    if (object instanceof String) {
      var string = object; // Detect if this is a unicode string

      var isUnicode = false;

      for (var i = 0, end = string.length; i < end; i++) {
        if (string.charCodeAt(i) > 0x7f) {
          isUnicode = true;
          break;
        }
      } // If so, encode it as big endian UTF-16

      if (isUnicode) {
        string = swapBytes(Buffer.from('\uFEFF' + string, 'utf16le')).toString(
          'binary'
        );
      } // Escape characters as required by the spec

      string = string.replace(escapableRe, function(c) {
        return escapable[c];
      });
      return '(' + string + ')'; // Buffers are converted to PDF hex strings
    }

    if (Buffer.isBuffer(object)) {
      return '<' + object.toString('hex') + '>';
    }

    if (object instanceof PDFReference || object instanceof PDFNameTree) {
      return object.toString();
    }

    if (object instanceof Date) {
      return (
        '(D:' +
        pad(object.getUTCFullYear(), 4) +
        pad(object.getUTCMonth() + 1, 2) +
        pad(object.getUTCDate(), 2) +
        pad(object.getUTCHours(), 2) +
        pad(object.getUTCMinutes(), 2) +
        pad(object.getUTCSeconds(), 2) +
        'Z)'
      );
    }

    if (Array.isArray(object)) {
      var items = Array.from(object)
        .map(function(e) {
          return PDFObject.convert(e);
        })
        .join(' ');
      return '[' + items + ']';
    }

    if ({}.toString.call(object) === '[object Object]') {
      var out = ['<<'];

      for (var key in object) {
        var val = object[key];
        out.push('/' + key + ' ' + PDFObject.convert(val));
      }

      out.push('>>');
      return out.join('\n');
    }

    if (typeof object === 'number') {
      return PDFObject.number(object);
    }

    return '' + object;
  };

  PDFObject.number = function number(n) {
    if (n > -1e21 && n < 1e21) {
      return Math.round(n * 1e6) / 1e6;
    }

    throw new Error('unsupported number: ' + n);
  };

  return PDFObject;
})();

var PDFObject$1 = PDFObject;

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ('value' in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  Object.defineProperty(Constructor, 'prototype', {
    writable: false
  });
  return Constructor;
}

var DEFAULT_MARGINS = {
  top: 0,
  left: 0,
  bottom: 0,
  right: 0
};
var SIZES = {
  '4A0': [4767.87, 6740.79],
  '2A0': [3370.39, 4767.87],
  A0: [2383.94, 3370.39],
  A1: [1683.78, 2383.94],
  A2: [1190.55, 1683.78],
  A3: [841.89, 1190.55],
  A4: [595.28, 841.89],
  A5: [419.53, 595.28],
  A6: [297.64, 419.53],
  A7: [209.76, 297.64],
  A8: [147.4, 209.76],
  A9: [104.88, 147.4],
  A10: [73.7, 104.88],
  B0: [2834.65, 4008.19],
  B1: [2004.09, 2834.65],
  B2: [1417.32, 2004.09],
  B3: [1000.63, 1417.32],
  B4: [708.66, 1000.63],
  B5: [498.9, 708.66],
  B6: [354.33, 498.9],
  B7: [249.45, 354.33],
  B8: [175.75, 249.45],
  B9: [124.72, 175.75],
  B10: [87.87, 124.72],
  C0: [2599.37, 3676.54],
  C1: [1836.85, 2599.37],
  C2: [1298.27, 1836.85],
  C3: [918.43, 1298.27],
  C4: [649.13, 918.43],
  C5: [459.21, 649.13],
  C6: [323.15, 459.21],
  C7: [229.61, 323.15],
  C8: [161.57, 229.61],
  C9: [113.39, 161.57],
  C10: [79.37, 113.39],
  RA0: [2437.8, 3458.27],
  RA1: [1729.13, 2437.8],
  RA2: [1218.9, 1729.13],
  RA3: [864.57, 1218.9],
  RA4: [609.45, 864.57],
  SRA0: [2551.18, 3628.35],
  SRA1: [1814.17, 2551.18],
  SRA2: [1275.59, 1814.17],
  SRA3: [907.09, 1275.59],
  SRA4: [637.8, 907.09],
  EXECUTIVE: [521.86, 756.0],
  FOLIO: [612.0, 936.0],
  LEGAL: [612.0, 1008.0],
  LETTER: [612.0, 792.0],
  TABLOID: [792.0, 1224.0]
};

var PDFPage = /*#__PURE__*/ (function() {
  function PDFPage(document, options) {
    if (options === void 0) {
      options = {};
    }

    this.document = document;
    this.size = options.size || 'letter';
    this.layout = options.layout || 'portrait';
    this.userUnit = options.userUnit || 1.0;
    this.margins = DEFAULT_MARGINS; // calculate page dimensions

    var dimensions = Array.isArray(this.size)
      ? this.size
      : SIZES[this.size.toUpperCase()];
    this.width = dimensions[this.layout === 'portrait' ? 0 : 1];
    this.height = dimensions[this.layout === 'portrait' ? 1 : 0];
    this.content = this.document.ref(); // Initialize the Font, XObject, and ExtGState dictionaries

    this.resources = this.document.ref({
      ProcSet: ['PDF', 'Text', 'ImageB', 'ImageC', 'ImageI']
    }); // The page dictionary

    this.dictionary = this.document.ref({
      Type: 'Page',
      Parent: this.document._root.data.Pages,
      MediaBox: [0, 0, this.width, this.height],
      Contents: this.content,
      Resources: this.resources,
      UserUnit: this.userUnit
    });
  } // Lazily create these objects

  var _proto = PDFPage.prototype;

  _proto.maxY = function maxY() {
    return this.height;
  };

  _proto.write = function write(chunk) {
    return this.content.write(chunk);
  };

  _proto.end = function end() {
    this.dictionary.end();
    this.resources.end();
    return this.content.end();
  };

  _createClass(PDFPage, [
    {
      key: 'fonts',
      get: function get() {
        var data = this.resources.data;
        return data.Font != null ? data.Font : (data.Font = {});
      }
    },
    {
      key: 'xobjects',
      get: function get() {
        var data = this.resources.data;
        return data.XObject != null ? data.XObject : (data.XObject = {});
      }
    },
    {
      key: 'ext_gstates',
      get: function get() {
        var data = this.resources.data;
        return data.ExtGState != null ? data.ExtGState : (data.ExtGState = {});
      }
    },
    {
      key: 'patterns',
      get: function get() {
        var data = this.resources.data;
        return data.Pattern != null ? data.Pattern : (data.Pattern = {});
      }
    },
    {
      key: 'colorSpaces',
      get: function get() {
        var data = this.resources.data;
        return data.ColorSpace || (data.ColorSpace = {});
      }
    },
    {
      key: 'annotations',
      get: function get() {
        var data = this.dictionary.data;
        return data.Annots != null ? data.Annots : (data.Annots = []);
      }
    },
    {
      key: 'structParentTreeKey',
      get: function get() {
        var data = this.dictionary.data;
        return data.StructParents != null
          ? data.StructParents
          : (data.StructParents = this.document.createStructParentTreeNextKey());
      }
    }
  ]);

  return PDFPage;
})();

/* eslint-disable no-prototype-builtins */

var wordArrayToBuffer = function wordArrayToBuffer(wordArray) {
  var byteArray = [];

  for (var i = 0; i < wordArray.sigBytes; i++) {
    byteArray.push(
      (wordArray.words[Math.floor(i / 4)] >> (8 * (3 - (i % 4)))) & 0xff
    );
  }

  return Buffer.from(byteArray);
};

var PDFSecurity = /*#__PURE__*/ (function() {
  function PDFSecurity() {}

  PDFSecurity.generateFileID = function generateFileID(info) {
    if (info === void 0) {
      info = {};
    }

    var infoStr = info.CreationDate.getTime() + '\n';

    for (var key in info) {
      if (!info.hasOwnProperty(key)) continue;
      infoStr += key + ': ' + info[key].valueOf() + '\n';
    }

    return wordArrayToBuffer(CryptoJS(infoStr));
  };

  return PDFSecurity;
})();

var number$2 = PDFObject$1.number;

var PDFGradient$1 = /*#__PURE__*/ (function() {
  function PDFGradient(doc) {
    this.doc = doc;
    this.stops = [];
    this.embedded = false;
    this.transform = [1, 0, 0, 1, 0, 0];
  }

  var _proto = PDFGradient.prototype;

  _proto.stop = function stop(pos, color, opacity) {
    if (opacity == null) {
      opacity = 1;
    }

    color = this.doc._normalizeColor(color);

    if (this.stops.length === 0) {
      if (color.length === 3) {
        this._colorSpace = 'DeviceRGB';
      } else if (color.length === 4) {
        this._colorSpace = 'DeviceCMYK';
      } else if (color.length === 1) {
        this._colorSpace = 'DeviceGray';
      } else {
        throw new Error('Unknown color space');
      }
    } else if (
      (this._colorSpace === 'DeviceRGB' && color.length !== 3) ||
      (this._colorSpace === 'DeviceCMYK' && color.length !== 4) ||
      (this._colorSpace === 'DeviceGray' && color.length !== 1)
    ) {
      throw new Error('All gradient stops must use the same color space');
    }

    opacity = Math.max(0, Math.min(1, opacity));
    this.stops.push([pos, color, opacity]);
    return this;
  };

  _proto.setTransform = function setTransform(m11, m12, m21, m22, dx, dy) {
    this.transform = [m11, m12, m21, m22, dx, dy];
    return this;
  };

  _proto.embed = function embed(m) {
    var fn;
    var stopsLength = this.stops.length;

    if (stopsLength === 0) {
      return;
    }

    this.embedded = true;
    this.matrix = m; // if the last stop comes before 100%, add a copy at 100%

    var last = this.stops[stopsLength - 1];

    if (last[0] < 1) {
      this.stops.push([1, last[1], last[2]]);
    }

    var bounds = [];
    var encode = [];
    var stops = [];

    for (var i = 0; i < stopsLength - 1; i++) {
      encode.push(0, 1);

      if (i + 2 !== stopsLength) {
        bounds.push(this.stops[i + 1][0]);
      }

      fn = this.doc.ref({
        FunctionType: 2,
        Domain: [0, 1],
        C0: this.stops[i + 0][1],
        C1: this.stops[i + 1][1],
        N: 1
      });
      stops.push(fn);
      fn.end();
    } // if there are only two stops, we don't need a stitching function

    if (stopsLength === 1) {
      fn = stops[0];
    } else {
      fn = this.doc.ref({
        FunctionType: 3,
        // stitching function
        Domain: [0, 1],
        Functions: stops,
        Bounds: bounds,
        Encode: encode
      });
      fn.end();
    }

    this.id = 'Sh' + ++this.doc._gradCount;
    var shader = this.shader(fn);
    shader.end();
    var pattern = this.doc.ref({
      Type: 'Pattern',
      PatternType: 2,
      Shading: shader,
      Matrix: this.matrix.map(number$2)
    });
    pattern.end();

    if (
      this.stops.some(function(stop) {
        return stop[2] < 1;
      })
    ) {
      var grad = this.opacityGradient();
      grad._colorSpace = 'DeviceGray';

      for (
        var _iterator = _createForOfIteratorHelperLoose(this.stops), _step;
        !(_step = _iterator()).done;

      ) {
        var stop = _step.value;
        grad.stop(stop[0], [stop[2]]);
      }

      grad = grad.embed(this.matrix);
      var pageBBox = [0, 0, this.doc.page.width, this.doc.page.height];
      var form = this.doc.ref({
        Type: 'XObject',
        Subtype: 'Form',
        FormType: 1,
        BBox: pageBBox,
        Group: {
          Type: 'Group',
          S: 'Transparency',
          CS: 'DeviceGray'
        },
        Resources: {
          ProcSet: ['PDF', 'Text', 'ImageB', 'ImageC', 'ImageI'],
          Pattern: {
            Sh1: grad
          }
        }
      });
      form.write('/Pattern cs /Sh1 scn');
      form.end(pageBBox.join(' ') + ' re f');
      var gstate = this.doc.ref({
        Type: 'ExtGState',
        SMask: {
          Type: 'Mask',
          S: 'Luminosity',
          G: form
        }
      });
      gstate.end();
      var opacityPattern = this.doc.ref({
        Type: 'Pattern',
        PatternType: 1,
        PaintType: 1,
        TilingType: 2,
        BBox: pageBBox,
        XStep: pageBBox[2],
        YStep: pageBBox[3],
        Resources: {
          ProcSet: ['PDF', 'Text', 'ImageB', 'ImageC', 'ImageI'],
          Pattern: {
            Sh1: pattern
          },
          ExtGState: {
            Gs1: gstate
          }
        }
      });
      opacityPattern.write('/Gs1 gs /Pattern cs /Sh1 scn');
      opacityPattern.end(pageBBox.join(' ') + ' re f');
      this.doc.page.patterns[this.id] = opacityPattern;
    } else {
      this.doc.page.patterns[this.id] = pattern;
    }

    return pattern;
  };

  _proto.apply = function apply(op) {
    // apply gradient transform to existing document ctm
    var _this$doc$_ctm = this.doc._ctm,
      m0 = _this$doc$_ctm[0],
      m1 = _this$doc$_ctm[1],
      m2 = _this$doc$_ctm[2],
      m3 = _this$doc$_ctm[3],
      m4 = _this$doc$_ctm[4],
      m5 = _this$doc$_ctm[5];
    var _this$transform = this.transform,
      m11 = _this$transform[0],
      m12 = _this$transform[1],
      m21 = _this$transform[2],
      m22 = _this$transform[3],
      dx = _this$transform[4],
      dy = _this$transform[5];
    var m = [
      m0 * m11 + m2 * m12,
      m1 * m11 + m3 * m12,
      m0 * m21 + m2 * m22,
      m1 * m21 + m3 * m22,
      m0 * dx + m2 * dy + m4,
      m1 * dx + m3 * dy + m5
    ];

    if (!this.embedded || m.join(' ') !== this.matrix.join(' ')) {
      this.embed(m);
    }

    return this.doc.addContent('/' + this.id + ' ' + op);
  };

  return PDFGradient;
})();

var PDFLinearGradient$1 = /*#__PURE__*/ (function(_PDFGradient) {
  _inheritsLoose(PDFLinearGradient, _PDFGradient);

  function PDFLinearGradient(doc, x1, y1, x2, y2) {
    var _this;

    _this = _PDFGradient.call(this, doc) || this;
    _this.x1 = x1;
    _this.y1 = y1;
    _this.x2 = x2;
    _this.y2 = y2;
    return _this;
  }

  var _proto2 = PDFLinearGradient.prototype;

  _proto2.shader = function shader(fn) {
    return this.doc.ref({
      ShadingType: 2,
      ColorSpace: this._colorSpace,
      Coords: [this.x1, this.y1, this.x2, this.y2],
      Function: fn,
      Extend: [true, true]
    });
  };

  _proto2.opacityGradient = function opacityGradient() {
    return new PDFLinearGradient(this.doc, this.x1, this.y1, this.x2, this.y2);
  };

  return PDFLinearGradient;
})(PDFGradient$1);

var PDFRadialGradient$1 = /*#__PURE__*/ (function(_PDFGradient2) {
  _inheritsLoose(PDFRadialGradient, _PDFGradient2);

  function PDFRadialGradient(doc, x1, y1, r1, x2, y2, r2) {
    var _this2;

    _this2 = _PDFGradient2.call(this, doc) || this;
    _this2.doc = doc;
    _this2.x1 = x1;
    _this2.y1 = y1;
    _this2.r1 = r1;
    _this2.x2 = x2;
    _this2.y2 = y2;
    _this2.r2 = r2;
    return _this2;
  }

  var _proto3 = PDFRadialGradient.prototype;

  _proto3.shader = function shader(fn) {
    return this.doc.ref({
      ShadingType: 3,
      ColorSpace: this._colorSpace,
      Coords: [this.x1, this.y1, this.r1, this.x2, this.y2, this.r2],
      Function: fn,
      Extend: [true, true]
    });
  };

  _proto3.opacityGradient = function opacityGradient() {
    return new PDFRadialGradient(
      this.doc,
      this.x1,
      this.y1,
      this.r1,
      this.x2,
      this.y2,
      this.r2
    );
  };

  return PDFRadialGradient;
})(PDFGradient$1);

var Gradient = {
  PDFGradient: PDFGradient$1,
  PDFLinearGradient: PDFLinearGradient$1,
  PDFRadialGradient: PDFRadialGradient$1
};

var PDFGradient = Gradient.PDFGradient,
  PDFLinearGradient = Gradient.PDFLinearGradient,
  PDFRadialGradient = Gradient.PDFRadialGradient;
var ColorMixin = {
  initColor: function initColor() {
    // The opacity dictionaries
    this._opacityRegistry = {};
    this._opacityCount = 0;
    return (this._gradCount = 0);
  },
  _normalizeColor: function _normalizeColor(color) {
    if (color instanceof PDFGradient) {
      return color;
    }

    var part;

    if (typeof color === 'string') {
      if (color.charAt(0) === '#') {
        if (color.length === 4) {
          color = color.replace(
            /#([0-9A-F])([0-9A-F])([0-9A-F])/i,
            '#$1$1$2$2$3$3'
          );
        }

        var hex = parseInt(color.slice(1), 16);
        color = [hex >> 16, (hex >> 8) & 0xff, hex & 0xff];
      } else if (namedColors[color]) {
        color = namedColors[color];
      }
    }

    if (Array.isArray(color)) {
      // RGB
      if (color.length === 3) {
        color = (function() {
          var result = [];

          for (
            var _i = 0, _Array$from = Array.from(color);
            _i < _Array$from.length;
            _i++
          ) {
            part = _Array$from[_i];
            result.push(part / 255);
          }

          return result;
        })(); // CMYK
      } else if (color.length === 4) {
        color = (function() {
          var result1 = [];

          for (
            var _i2 = 0, _Array$from2 = Array.from(color);
            _i2 < _Array$from2.length;
            _i2++
          ) {
            part = _Array$from2[_i2];
            result1.push(part / 100);
          }

          return result1;
        })();
      }

      return color;
    }

    return null;
  },
  _setColor: function _setColor(color, stroke) {
    color = this._normalizeColor(color);

    if (!color) {
      return false;
    }

    var op = stroke ? 'SCN' : 'scn';

    if (color instanceof PDFGradient) {
      this._setColorSpace('Pattern', stroke);

      color.apply(op);
    } else {
      var space = color.length === 4 ? 'DeviceCMYK' : 'DeviceRGB';

      this._setColorSpace(space, stroke);

      color = color.join(' ');
      this.addContent(color + ' ' + op);
    }

    return true;
  },
  _setColorSpace: function _setColorSpace(space, stroke) {
    var op = stroke ? 'CS' : 'cs';
    return this.addContent('/' + space + ' ' + op);
  },
  fillColor: function fillColor(color, opacity) {
    var set = this._setColor(color, false);

    if (set) {
      this.fillOpacity(opacity);
    } // save this for text wrapper, which needs to reset
    // the fill color on new pages

    this._fillColor = [color, opacity];
    return this;
  },
  strokeColor: function strokeColor(color, opacity) {
    var set = this._setColor(color, true);

    if (set) {
      this.strokeOpacity(opacity);
    }

    return this;
  },
  opacity: function opacity(_opacity) {
    this._doOpacity(_opacity, _opacity);

    return this;
  },
  fillOpacity: function fillOpacity(opacity) {
    this._doOpacity(opacity, null);

    return this;
  },
  strokeOpacity: function strokeOpacity(opacity) {
    this._doOpacity(null, opacity);

    return this;
  },
  _doOpacity: function _doOpacity(fillOpacity, strokeOpacity) {
    var dictionary, name;

    if (fillOpacity == null && strokeOpacity == null) {
      return;
    }

    if (fillOpacity != null) {
      fillOpacity = Math.max(0, Math.min(1, fillOpacity));
    }

    if (strokeOpacity != null) {
      strokeOpacity = Math.max(0, Math.min(1, strokeOpacity));
    }

    var key = fillOpacity + '_' + strokeOpacity;

    if (this._opacityRegistry[key]) {
      var _Array$from3 = Array.from(this._opacityRegistry[key]);

      dictionary = _Array$from3[0];
      name = _Array$from3[1];
    } else {
      dictionary = {
        Type: 'ExtGState'
      };

      if (fillOpacity != null) {
        dictionary.ca = fillOpacity;
      }

      if (strokeOpacity != null) {
        dictionary.CA = strokeOpacity;
      }

      dictionary = this.ref(dictionary);
      dictionary.end();
      var id = ++this._opacityCount;
      name = 'Gs' + id;
      this._opacityRegistry[key] = [dictionary, name];
    }

    this.page.ext_gstates[name] = dictionary;
    return this.addContent('/' + name + ' gs');
  },
  linearGradient: function linearGradient(x1, y1, x2, y2) {
    return new PDFLinearGradient(this, x1, y1, x2, y2);
  },
  radialGradient: function radialGradient(x1, y1, r1, x2, y2, r2) {
    return new PDFRadialGradient(this, x1, y1, r1, x2, y2, r2);
  }
};
var namedColors = {
  aliceblue: [240, 248, 255],
  antiquewhite: [250, 235, 215],
  aqua: [0, 255, 255],
  aquamarine: [127, 255, 212],
  azure: [240, 255, 255],
  beige: [245, 245, 220],
  bisque: [255, 228, 196],
  black: [0, 0, 0],
  blanchedalmond: [255, 235, 205],
  blue: [0, 0, 255],
  blueviolet: [138, 43, 226],
  brown: [165, 42, 42],
  burlywood: [222, 184, 135],
  cadetblue: [95, 158, 160],
  chartreuse: [127, 255, 0],
  chocolate: [210, 105, 30],
  coral: [255, 127, 80],
  cornflowerblue: [100, 149, 237],
  cornsilk: [255, 248, 220],
  crimson: [220, 20, 60],
  cyan: [0, 255, 255],
  darkblue: [0, 0, 139],
  darkcyan: [0, 139, 139],
  darkgoldenrod: [184, 134, 11],
  darkgray: [169, 169, 169],
  darkgreen: [0, 100, 0],
  darkgrey: [169, 169, 169],
  darkkhaki: [189, 183, 107],
  darkmagenta: [139, 0, 139],
  darkolivegreen: [85, 107, 47],
  darkorange: [255, 140, 0],
  darkorchid: [153, 50, 204],
  darkred: [139, 0, 0],
  darksalmon: [233, 150, 122],
  darkseagreen: [143, 188, 143],
  darkslateblue: [72, 61, 139],
  darkslategray: [47, 79, 79],
  darkslategrey: [47, 79, 79],
  darkturquoise: [0, 206, 209],
  darkviolet: [148, 0, 211],
  deeppink: [255, 20, 147],
  deepskyblue: [0, 191, 255],
  dimgray: [105, 105, 105],
  dimgrey: [105, 105, 105],
  dodgerblue: [30, 144, 255],
  firebrick: [178, 34, 34],
  floralwhite: [255, 250, 240],
  forestgreen: [34, 139, 34],
  fuchsia: [255, 0, 255],
  gainsboro: [220, 220, 220],
  ghostwhite: [248, 248, 255],
  gold: [255, 215, 0],
  goldenrod: [218, 165, 32],
  gray: [128, 128, 128],
  grey: [128, 128, 128],
  green: [0, 128, 0],
  greenyellow: [173, 255, 47],
  honeydew: [240, 255, 240],
  hotpink: [255, 105, 180],
  indianred: [205, 92, 92],
  indigo: [75, 0, 130],
  ivory: [255, 255, 240],
  khaki: [240, 230, 140],
  lavender: [230, 230, 250],
  lavenderblush: [255, 240, 245],
  lawngreen: [124, 252, 0],
  lemonchiffon: [255, 250, 205],
  lightblue: [173, 216, 230],
  lightcoral: [240, 128, 128],
  lightcyan: [224, 255, 255],
  lightgoldenrodyellow: [250, 250, 210],
  lightgray: [211, 211, 211],
  lightgreen: [144, 238, 144],
  lightgrey: [211, 211, 211],
  lightpink: [255, 182, 193],
  lightsalmon: [255, 160, 122],
  lightseagreen: [32, 178, 170],
  lightskyblue: [135, 206, 250],
  lightslategray: [119, 136, 153],
  lightslategrey: [119, 136, 153],
  lightsteelblue: [176, 196, 222],
  lightyellow: [255, 255, 224],
  lime: [0, 255, 0],
  limegreen: [50, 205, 50],
  linen: [250, 240, 230],
  magenta: [255, 0, 255],
  maroon: [128, 0, 0],
  mediumaquamarine: [102, 205, 170],
  mediumblue: [0, 0, 205],
  mediumorchid: [186, 85, 211],
  mediumpurple: [147, 112, 219],
  mediumseagreen: [60, 179, 113],
  mediumslateblue: [123, 104, 238],
  mediumspringgreen: [0, 250, 154],
  mediumturquoise: [72, 209, 204],
  mediumvioletred: [199, 21, 133],
  midnightblue: [25, 25, 112],
  mintcream: [245, 255, 250],
  mistyrose: [255, 228, 225],
  moccasin: [255, 228, 181],
  navajowhite: [255, 222, 173],
  navy: [0, 0, 128],
  oldlace: [253, 245, 230],
  olive: [128, 128, 0],
  olivedrab: [107, 142, 35],
  orange: [255, 165, 0],
  orangered: [255, 69, 0],
  orchid: [218, 112, 214],
  palegoldenrod: [238, 232, 170],
  palegreen: [152, 251, 152],
  paleturquoise: [175, 238, 238],
  palevioletred: [219, 112, 147],
  papayawhip: [255, 239, 213],
  peachpuff: [255, 218, 185],
  peru: [205, 133, 63],
  pink: [255, 192, 203],
  plum: [221, 160, 221],
  powderblue: [176, 224, 230],
  purple: [128, 0, 128],
  red: [255, 0, 0],
  rosybrown: [188, 143, 143],
  royalblue: [65, 105, 225],
  saddlebrown: [139, 69, 19],
  salmon: [250, 128, 114],
  sandybrown: [244, 164, 96],
  seagreen: [46, 139, 87],
  seashell: [255, 245, 238],
  sienna: [160, 82, 45],
  silver: [192, 192, 192],
  skyblue: [135, 206, 235],
  slateblue: [106, 90, 205],
  slategray: [112, 128, 144],
  slategrey: [112, 128, 144],
  snow: [255, 250, 250],
  springgreen: [0, 255, 127],
  steelblue: [70, 130, 180],
  tan: [210, 180, 140],
  teal: [0, 128, 128],
  thistle: [216, 191, 216],
  tomato: [255, 99, 71],
  turquoise: [64, 224, 208],
  violet: [238, 130, 238],
  wheat: [245, 222, 179],
  white: [255, 255, 255],
  whitesmoke: [245, 245, 245],
  yellow: [255, 255, 0],
  yellowgreen: [154, 205, 50]
};

/* eslint-disable no-lonely-if */
var cx, cy, px, py, sx, sy;
cx = cy = px = py = sx = sy = 0; // parseDataPath copy pasted from svgo
// https://github.com/svg/svgo/blob/e4918ccdd1a2b5831defe0f00c1286744b479448/lib/path.js

var argsCountPerCommand = {
  M: 2,
  m: 2,
  Z: 0,
  z: 0,
  L: 2,
  l: 2,
  H: 1,
  h: 1,
  V: 1,
  v: 1,
  C: 6,
  c: 6,
  S: 4,
  s: 4,
  Q: 4,
  q: 4,
  T: 2,
  t: 2,
  A: 7,
  a: 7
};
/**
 * @type {(c: string) => c is PathDataCommand}
 */

var isCommand = function isCommand(c) {
  return c in argsCountPerCommand;
};
/**
 * @type {(c: string) => boolean}
 */

var isWsp = function isWsp(c) {
  var codePoint = c.codePointAt(0);
  return (
    codePoint === 0x20 ||
    codePoint === 0x9 ||
    codePoint === 0xd ||
    codePoint === 0xa
  );
};
/**
 * @type {(c: string) => boolean}
 */

var isDigit = function isDigit(c) {
  var codePoint = c.codePointAt(0);

  if (codePoint == null) {
    return false;
  }

  return 48 <= codePoint && codePoint <= 57;
};
/**
 * @typedef {'none' | 'sign' | 'whole' | 'decimal_point' | 'decimal' | 'e' | 'exponent_sign' | 'exponent'} ReadNumberState
 */

/**
 * @type {(string: string, cursor: number) => [number, number | null]}
 */

var readNumber = function readNumber(string, cursor) {
  var i = cursor;
  var value = '';
  var state =
    /** @type {ReadNumberState} */
    'none';

  for (; i < string.length; i += 1) {
    var c = string[i];

    if (c === '+' || c === '-') {
      if (state === 'none') {
        state = 'sign';
        value += c;
        continue;
      }

      if (state === 'e') {
        state = 'exponent_sign';
        value += c;
        continue;
      }
    }

    if (isDigit(c)) {
      if (state === 'none' || state === 'sign' || state === 'whole') {
        state = 'whole';
        value += c;
        continue;
      }

      if (state === 'decimal_point' || state === 'decimal') {
        state = 'decimal';
        value += c;
        continue;
      }

      if (state === 'e' || state === 'exponent_sign' || state === 'exponent') {
        state = 'exponent';
        value += c;
        continue;
      }
    }

    if (c === '.') {
      if (state === 'none' || state === 'sign' || state === 'whole') {
        state = 'decimal_point';
        value += c;
        continue;
      }
    }

    if (c === 'E' || c === 'e') {
      if (
        state === 'whole' ||
        state === 'decimal_point' ||
        state === 'decimal'
      ) {
        state = 'e';
        value += c;
        continue;
      }
    }

    break;
  }

  var number = Number.parseFloat(value);

  if (Number.isNaN(number)) {
    return [cursor, null];
  } else {
    // step back to delegate iteration to parent loop
    return [i - 1, number];
  }
};
/**
 * @type {(string: string) => Array<PathDataItem>}
 */

var parsePathData = function parsePathData(string) {
  /**
   * @type {Array<PathDataItem>}
   */
  var pathData = [];
  /**
   * @type {null | PathDataCommand}
   */

  var command = null;
  var args =
    /** @type {number[]} */
    [];
  var argsCount = 0;
  var canHaveComma = false;
  var hadComma = false;

  for (var i = 0; i < string.length; i += 1) {
    var c = string.charAt(i);

    if (isWsp(c)) {
      continue;
    } // allow comma only between arguments

    if (canHaveComma && c === ',') {
      if (hadComma) {
        break;
      }

      hadComma = true;
      continue;
    }

    if (isCommand(c)) {
      if (hadComma) {
        return pathData;
      }

      if (command == null) {
        // moveto should be leading command
        if (c !== 'M' && c !== 'm') {
          return pathData;
        }
      } else {
        // stop if previous command arguments are not flushed
        if (args.length !== 0) {
          return pathData;
        }
      }

      command = c;
      args = [];
      argsCount = argsCountPerCommand[command];
      canHaveComma = false; // flush command without arguments

      if (argsCount === 0) {
        pathData.push({
          command: command,
          args: args
        });
      }

      continue;
    } // avoid parsing arguments if no command detected

    if (command == null) {
      return pathData;
    } // read next argument

    var newCursor = i;
    var number = null;

    if (command === 'A' || command === 'a') {
      var position = args.length;

      if (position === 0 || position === 1) {
        // allow only positive number without sign as first two arguments
        if (c !== '+' && c !== '-') {
          var _readNumber = readNumber(string, i);

          newCursor = _readNumber[0];
          number = _readNumber[1];
        }
      }

      if (position === 2 || position === 5 || position === 6) {
        var _readNumber2 = readNumber(string, i);

        newCursor = _readNumber2[0];
        number = _readNumber2[1];
      }

      if (position === 3 || position === 4) {
        // read flags
        if (c === '0') {
          number = 0;
        }

        if (c === '1') {
          number = 1;
        }
      }
    } else {
      var _readNumber3 = readNumber(string, i);

      newCursor = _readNumber3[0];
      number = _readNumber3[1];
    }

    if (number == null) {
      return pathData;
    }

    args.push(number);
    canHaveComma = true;
    hadComma = false;
    i = newCursor; // flush arguments when necessary count is reached

    if (args.length === argsCount) {
      pathData.push({
        command: command,
        args: args
      }); // subsequent moveto coordinates are threated as implicit lineto commands

      if (command === 'M') {
        command = 'L';
      }

      if (command === 'm') {
        command = 'l';
      }

      args = [];
    }
  }

  return pathData;
};

var _apply = function apply(commands, doc) {
  // current point, control point, and subpath starting point
  cx = cy = px = py = sx = sy = 0; // run the commands

  for (var i = 0; i < commands.length; i++) {
    var _commands$i = commands[i],
      command = _commands$i.command,
      args = _commands$i.args;

    if (typeof runners[command] === 'function') {
      runners[command](doc, args);
    }
  }
};

var runners = {
  M: function M(doc, a) {
    cx = a[0];
    cy = a[1];
    px = py = null;
    sx = cx;
    sy = cy;
    return doc.moveTo(cx, cy);
  },
  m: function m(doc, a) {
    cx += a[0];
    cy += a[1];
    px = py = null;
    sx = cx;
    sy = cy;
    return doc.moveTo(cx, cy);
  },
  C: function C(doc, a) {
    cx = a[4];
    cy = a[5];
    px = a[2];
    py = a[3];
    return doc.bezierCurveTo.apply(doc, a);
  },
  c: function c(doc, a) {
    doc.bezierCurveTo(
      a[0] + cx,
      a[1] + cy,
      a[2] + cx,
      a[3] + cy,
      a[4] + cx,
      a[5] + cy
    );
    px = cx + a[2];
    py = cy + a[3];
    cx += a[4];
    return (cy += a[5]);
  },
  S: function S(doc, a) {
    if (px === null) {
      px = cx;
      py = cy;
    }

    doc.bezierCurveTo(cx - (px - cx), cy - (py - cy), a[0], a[1], a[2], a[3]);
    px = a[0];
    py = a[1];
    cx = a[2];
    return (cy = a[3]);
  },
  s: function s(doc, a) {
    if (px === null) {
      px = cx;
      py = cy;
    }

    doc.bezierCurveTo(
      cx - (px - cx),
      cy - (py - cy),
      cx + a[0],
      cy + a[1],
      cx + a[2],
      cy + a[3]
    );
    px = cx + a[0];
    py = cy + a[1];
    cx += a[2];
    return (cy += a[3]);
  },
  Q: function Q(doc, a) {
    px = a[0];
    py = a[1];
    cx = a[2];
    cy = a[3];
    return doc.quadraticCurveTo(a[0], a[1], cx, cy);
  },
  q: function q(doc, a) {
    doc.quadraticCurveTo(a[0] + cx, a[1] + cy, a[2] + cx, a[3] + cy);
    px = cx + a[0];
    py = cy + a[1];
    cx += a[2];
    return (cy += a[3]);
  },
  T: function T(doc, a) {
    if (px === null) {
      px = cx;
      py = cy;
    } else {
      px = cx - (px - cx);
      py = cy - (py - cy);
    }

    doc.quadraticCurveTo(px, py, a[0], a[1]);
    px = cx - (px - cx);
    py = cy - (py - cy);
    cx = a[0];
    return (cy = a[1]);
  },
  t: function t(doc, a) {
    if (px === null) {
      px = cx;
      py = cy;
    } else {
      px = cx - (px - cx);
      py = cy - (py - cy);
    }

    doc.quadraticCurveTo(px, py, cx + a[0], cy + a[1]);
    cx += a[0];
    return (cy += a[1]);
  },
  A: function A(doc, a) {
    solveArc(doc, cx, cy, a);
    cx = a[5];
    return (cy = a[6]);
  },
  a: function a(doc, _a) {
    _a[5] += cx;
    _a[6] += cy;
    solveArc(doc, cx, cy, _a);
    cx = _a[5];
    return (cy = _a[6]);
  },
  L: function L(doc, a) {
    cx = a[0];
    cy = a[1];
    px = py = null;
    return doc.lineTo(cx, cy);
  },
  l: function l(doc, a) {
    cx += a[0];
    cy += a[1];
    px = py = null;
    return doc.lineTo(cx, cy);
  },
  H: function H(doc, a) {
    cx = a[0];
    px = py = null;
    return doc.lineTo(cx, cy);
  },
  h: function h(doc, a) {
    cx += a[0];
    px = py = null;
    return doc.lineTo(cx, cy);
  },
  V: function V(doc, a) {
    cy = a[0];
    px = py = null;
    return doc.lineTo(cx, cy);
  },
  v: function v(doc, a) {
    cy += a[0];
    px = py = null;
    return doc.lineTo(cx, cy);
  },
  Z: function Z(doc) {
    doc.closePath();
    cx = sx;
    return (cy = sy);
  },
  z: function z(doc) {
    doc.closePath();
    cx = sx;
    return (cy = sy);
  }
};

var solveArc = function solveArc(doc, x, y, coords) {
  var rx = coords[0],
    ry = coords[1],
    rot = coords[2],
    large = coords[3],
    sweep = coords[4],
    ex = coords[5],
    ey = coords[6];
  var segs = arcToSegments(ex, ey, rx, ry, large, sweep, rot, x, y);

  for (
    var _iterator = _createForOfIteratorHelperLoose(segs), _step;
    !(_step = _iterator()).done;

  ) {
    var seg = _step.value;
    var bez = segmentToBezier.apply(void 0, seg);
    doc.bezierCurveTo.apply(doc, bez);
  }
}; // from Inkscape svgtopdf, thanks!

var arcToSegments = function arcToSegments(
  x,
  y,
  rx,
  ry,
  large,
  sweep,
  rotateX,
  ox,
  oy
) {
  var th = rotateX * (Math.PI / 180);
  var sin_th = Math.sin(th);
  var cos_th = Math.cos(th);
  rx = Math.abs(rx);
  ry = Math.abs(ry);
  px = cos_th * (ox - x) * 0.5 + sin_th * (oy - y) * 0.5;
  py = cos_th * (oy - y) * 0.5 - sin_th * (ox - x) * 0.5;
  var pl = (px * px) / (rx * rx) + (py * py) / (ry * ry);

  if (pl > 1) {
    pl = Math.sqrt(pl);
    rx *= pl;
    ry *= pl;
  }

  var a00 = cos_th / rx;
  var a01 = sin_th / rx;
  var a10 = -sin_th / ry;
  var a11 = cos_th / ry;
  var x0 = a00 * ox + a01 * oy;
  var y0 = a10 * ox + a11 * oy;
  var x1 = a00 * x + a01 * y;
  var y1 = a10 * x + a11 * y;
  var d = (x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0);
  var sfactor_sq = 1 / d - 0.25;

  if (sfactor_sq < 0) {
    sfactor_sq = 0;
  }

  var sfactor = Math.sqrt(sfactor_sq);

  if (sweep === large) {
    sfactor = -sfactor;
  }

  var xc = 0.5 * (x0 + x1) - sfactor * (y1 - y0);
  var yc = 0.5 * (y0 + y1) + sfactor * (x1 - x0);
  var th0 = Math.atan2(y0 - yc, x0 - xc);
  var th1 = Math.atan2(y1 - yc, x1 - xc);
  var th_arc = th1 - th0;

  if (th_arc < 0 && sweep === 1) {
    th_arc += 2 * Math.PI;
  } else if (th_arc > 0 && sweep === 0) {
    th_arc -= 2 * Math.PI;
  }

  var segments = Math.ceil(Math.abs(th_arc / (Math.PI * 0.5 + 0.001)));
  var result = [];

  for (var i = 0; i < segments; i++) {
    var th2 = th0 + (i * th_arc) / segments;
    var th3 = th0 + ((i + 1) * th_arc) / segments;
    result[i] = [xc, yc, th2, th3, rx, ry, sin_th, cos_th];
  }

  return result;
};

var segmentToBezier = function segmentToBezier(
  cx,
  cy,
  th0,
  th1,
  rx,
  ry,
  sin_th,
  cos_th
) {
  var a00 = cos_th * rx;
  var a01 = -sin_th * ry;
  var a10 = sin_th * rx;
  var a11 = cos_th * ry;
  var th_half = 0.5 * (th1 - th0);
  var t =
    ((8 / 3) * Math.sin(th_half * 0.5) * Math.sin(th_half * 0.5)) /
    Math.sin(th_half);
  var x1 = cx + Math.cos(th0) - t * Math.sin(th0);
  var y1 = cy + Math.sin(th0) + t * Math.cos(th0);
  var x3 = cx + Math.cos(th1);
  var y3 = cy + Math.sin(th1);
  var x2 = x3 + t * Math.sin(th1);
  var y2 = y3 - t * Math.cos(th1);
  return [
    a00 * x1 + a01 * y1,
    a10 * x1 + a11 * y1,
    a00 * x2 + a01 * y2,
    a10 * x2 + a11 * y2,
    a00 * x3 + a01 * y3,
    a10 * x3 + a11 * y3
  ];
};

var SVGPath = /*#__PURE__*/ (function() {
  function SVGPath() {}

  SVGPath.apply = function apply(doc, path) {
    var commands = parsePathData(path);

    _apply(commands, doc);
  };

  return SVGPath;
})();

var number$1 = PDFObject$1.number; // This constant is used to approximate a symmetrical arc using a cubic
// Bezier curve.

var KAPPA = 4.0 * ((Math.sqrt(2) - 1.0) / 3.0);
var VectorMixin = {
  initVector: function initVector() {
    this._ctm = [1, 0, 0, 1, 0, 0]; // current transformation matrix

    return (this._ctmStack = []);
  },
  save: function save() {
    this._ctmStack.push(this._ctm.slice()); // TODO: save/restore colorspace and styles so not setting it unnessesarily all the time?

    return this.addContent('q');
  },
  restore: function restore() {
    this._ctm = this._ctmStack.pop() || [1, 0, 0, 1, 0, 0];
    return this.addContent('Q');
  },
  closePath: function closePath() {
    return this.addContent('h');
  },
  lineWidth: function lineWidth(w) {
    return this.addContent(number$1(w) + ' w');
  },
  _CAP_STYLES: {
    BUTT: 0,
    ROUND: 1,
    SQUARE: 2
  },
  lineCap: function lineCap(c) {
    if (typeof c === 'string') {
      c = this._CAP_STYLES[c.toUpperCase()];
    }

    return this.addContent(c + ' J');
  },
  _JOIN_STYLES: {
    MITER: 0,
    ROUND: 1,
    BEVEL: 2
  },
  lineJoin: function lineJoin(j) {
    if (typeof j === 'string') {
      j = this._JOIN_STYLES[j.toUpperCase()];
    }

    return this.addContent(j + ' j');
  },
  miterLimit: function miterLimit(m) {
    return this.addContent(number$1(m) + ' M');
  },
  dash: function dash(length, options) {
    var phase;

    if (options == null) {
      options = {};
    }

    if (length == null) {
      return this;
    }

    if (Array.isArray(length)) {
      length = Array.from(length)
        .map(function(v) {
          return PDFObject$1.number(v);
        })
        .join(' ');
      phase = options.phase || 0;
      return this.addContent(
        '[' + length + '] ' + PDFObject$1.number(phase) + ' d'
      );
    }

    var space = options.space != null ? options.space : length;
    phase = options.phase || 0;
    return this.addContent(
      '[' +
        PDFObject$1.number(length) +
        ' ' +
        PDFObject$1.number(space) +
        '] ' +
        PDFObject$1.number(phase) +
        ' d'
    );
  },
  undash: function undash() {
    return this.addContent('[] 0 d');
  },
  moveTo: function moveTo(x, y) {
    return this.addContent(number$1(x) + ' ' + number$1(y) + ' m');
  },
  lineTo: function lineTo(x, y) {
    return this.addContent(number$1(x) + ' ' + number$1(y) + ' l');
  },
  bezierCurveTo: function bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y) {
    return this.addContent(
      number$1(cp1x) +
        ' ' +
        number$1(cp1y) +
        ' ' +
        number$1(cp2x) +
        ' ' +
        number$1(cp2y) +
        ' ' +
        number$1(x) +
        ' ' +
        number$1(y) +
        ' c'
    );
  },
  quadraticCurveTo: function quadraticCurveTo(cpx, cpy, x, y) {
    return this.addContent(
      number$1(cpx) +
        ' ' +
        number$1(cpy) +
        ' ' +
        number$1(x) +
        ' ' +
        number$1(y) +
        ' v'
    );
  },
  rect: function rect(x, y, w, h) {
    return this.addContent(
      number$1(x) +
        ' ' +
        number$1(y) +
        ' ' +
        number$1(w) +
        ' ' +
        number$1(h) +
        ' re'
    );
  },
  roundedRect: function roundedRect(x, y, w, h, r) {
    if (r == null) {
      r = 0;
    }

    r = Math.min(r, 0.5 * w, 0.5 * h); // amount to inset control points from corners (see `ellipse`)

    var c = r * (1.0 - KAPPA);
    this.moveTo(x + r, y);
    this.lineTo(x + w - r, y);
    this.bezierCurveTo(x + w - c, y, x + w, y + c, x + w, y + r);
    this.lineTo(x + w, y + h - r);
    this.bezierCurveTo(x + w, y + h - c, x + w - c, y + h, x + w - r, y + h);
    this.lineTo(x + r, y + h);
    this.bezierCurveTo(x + c, y + h, x, y + h - c, x, y + h - r);
    this.lineTo(x, y + r);
    this.bezierCurveTo(x, y + c, x + c, y, x + r, y);
    return this.closePath();
  },
  ellipse: function ellipse(x, y, r1, r2) {
    // based on http://stackoverflow.com/questions/2172798/how-to-draw-an-oval-in-html5-canvas/2173084#2173084
    if (r2 == null) {
      r2 = r1;
    }

    x -= r1;
    y -= r2;
    var ox = r1 * KAPPA;
    var oy = r2 * KAPPA;
    var xe = x + r1 * 2;
    var ye = y + r2 * 2;
    var xm = x + r1;
    var ym = y + r2;
    this.moveTo(x, ym);
    this.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
    this.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
    this.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
    this.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
    return this.closePath();
  },
  circle: function circle(x, y, radius) {
    return this.ellipse(x, y, radius);
  },
  arc: function arc(x, y, radius, startAngle, endAngle, anticlockwise) {
    if (anticlockwise == null) {
      anticlockwise = false;
    }

    var TWO_PI = 2.0 * Math.PI;
    var HALF_PI = 0.5 * Math.PI;
    var deltaAng = endAngle - startAngle;

    if (Math.abs(deltaAng) > TWO_PI) {
      // draw only full circle if more than that is specified
      deltaAng = TWO_PI;
    } else if (deltaAng !== 0 && anticlockwise !== deltaAng < 0) {
      // necessary to flip direction of rendering
      var dir = anticlockwise ? -1 : 1;
      deltaAng = dir * TWO_PI + deltaAng;
    }

    var numSegs = Math.ceil(Math.abs(deltaAng) / HALF_PI);
    var segAng = deltaAng / numSegs;
    var handleLen = (segAng / HALF_PI) * KAPPA * radius;
    var curAng = startAngle; // component distances between anchor point and control point

    var deltaCx = -Math.sin(curAng) * handleLen;
    var deltaCy = Math.cos(curAng) * handleLen; // anchor point

    var ax = x + Math.cos(curAng) * radius;
    var ay = y + Math.sin(curAng) * radius; // calculate and render segments

    this.moveTo(ax, ay);

    for (
      var segIdx = 0, end = numSegs, asc = 0 <= end;
      asc ? segIdx < end : segIdx > end;
      asc ? segIdx++ : segIdx--
    ) {
      // starting control point
      var cp1x = ax + deltaCx;
      var cp1y = ay + deltaCy; // step angle

      curAng += segAng; // next anchor point

      ax = x + Math.cos(curAng) * radius;
      ay = y + Math.sin(curAng) * radius; // next control point delta

      deltaCx = -Math.sin(curAng) * handleLen;
      deltaCy = Math.cos(curAng) * handleLen; // ending control point

      var cp2x = ax - deltaCx;
      var cp2y = ay - deltaCy; // render segment

      this.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, ax, ay);
    }

    return this;
  },
  polygon: function polygon() {
    for (
      var _len = arguments.length, points = new Array(_len), _key = 0;
      _key < _len;
      _key++
    ) {
      points[_key] = arguments[_key];
    }

    this.moveTo.apply(this, Array.from(points.shift() || []));

    for (
      var _i = 0, _Array$from = Array.from(points);
      _i < _Array$from.length;
      _i++
    ) {
      var point = _Array$from[_i];
      this.lineTo.apply(this, Array.from(point || []));
    }

    return this.closePath();
  },
  path: function path(_path) {
    SVGPath.apply(this, _path);
    return this;
  },
  _windingRule: function _windingRule(rule) {
    if (/even-?odd/.test(rule)) {
      return '*';
    }

    return '';
  },
  fill: function fill(color, rule) {
    if (/(even-?odd)|(non-?zero)/.test(color)) {
      rule = color;
      color = null;
    }

    if (color) {
      this.fillColor(color);
    }

    return this.addContent('f' + this._windingRule(rule));
  },
  stroke: function stroke(color) {
    if (color) {
      this.strokeColor(color);
    }

    return this.addContent('S');
  },
  fillAndStroke: function fillAndStroke(fillColor, strokeColor, rule) {
    if (strokeColor == null) {
      strokeColor = fillColor;
    }

    var isFillRule = /(even-?odd)|(non-?zero)/;

    if (isFillRule.test(fillColor)) {
      rule = fillColor;
      fillColor = null;
    }

    if (isFillRule.test(strokeColor)) {
      rule = strokeColor;
      strokeColor = fillColor;
    }

    if (fillColor) {
      this.fillColor(fillColor);
      this.strokeColor(strokeColor);
    }

    return this.addContent('B' + this._windingRule(rule));
  },
  clip: function clip(rule) {
    return this.addContent('W' + this._windingRule(rule) + ' n');
  },
  transform: function transform(m11, m12, m21, m22, dx, dy) {
    // keep track of the current transformation matrix
    var m = this._ctm;

    var _Array$from2 = Array.from(m),
      m0 = _Array$from2[0],
      m1 = _Array$from2[1],
      m2 = _Array$from2[2],
      m3 = _Array$from2[3],
      m4 = _Array$from2[4],
      m5 = _Array$from2[5];

    m[0] = m0 * m11 + m2 * m12;
    m[1] = m1 * m11 + m3 * m12;
    m[2] = m0 * m21 + m2 * m22;
    m[3] = m1 * m21 + m3 * m22;
    m[4] = m0 * dx + m2 * dy + m4;
    m[5] = m1 * dx + m3 * dy + m5;
    var values = [m11, m12, m21, m22, dx, dy]
      .map(function(v) {
        return PDFObject$1.number(v);
      })
      .join(' ');
    return this.addContent(values + ' cm');
  },
  translate: function translate(x, y) {
    return this.transform(1, 0, 0, 1, x, y);
  },
  rotate: function rotate(angle, options) {
    if (options === void 0) {
      options = {};
    }

    var rad = (angle * Math.PI) / 180;
    var cos = Math.cos(rad);
    var sin = Math.sin(rad);
    var x = 0;
    var y = 0;

    if (options.origin != null) {
      var _Array$from3 = Array.from(options.origin);

      x = _Array$from3[0];
      y = _Array$from3[1];
      var x1 = x * cos - y * sin;
      var y1 = x * sin + y * cos;
      x -= x1;
      y -= y1;
    }

    return this.transform(cos, sin, -sin, cos, x, y);
  },
  scale: function scale(xFactor, yFactor, options) {
    if (options === void 0) {
      options = {};
    }

    if (yFactor == null) {
      yFactor = xFactor;
    }

    if (typeof yFactor === 'object') {
      options = yFactor;
      yFactor = xFactor;
    }

    var x = 0;
    var y = 0;

    if (options.origin != null) {
      var _Array$from4 = Array.from(options.origin);

      x = _Array$from4[0];
      y = _Array$from4[1];
      x -= xFactor * x;
      y -= yFactor * y;
    }

    return this.transform(xFactor, 0, 0, yFactor, x, y);
  },
  skew: function skew(xAngle, yAngle, options) {
    if (xAngle === void 0) {
      xAngle = 0;
    }

    if (yAngle === void 0) {
      yAngle = 0;
    }

    var radx = (xAngle * Math.PI) / 180;
    var rady = (yAngle * Math.PI) / 180;
    var tanx = Math.tan(radx);
    var tany = Math.tan(rady);
    var x = 0;
    var y = 0;

    if (options.origin != null) {
      var _Array$from5 = Array.from(options.origin);

      x = _Array$from5[0];
      y = _Array$from5[1];
      var x1 = x + tanx * y;
      var y1 = y + tany * x;
      x -= x1;
      y -= y1;
    }

    return this.transform(1, tany, tanx, 1, x, y);
  }
};

var range = function range(left, right, inclusive) {
  var range = [];
  var ascending = left < right;
  var end = !inclusive ? right : ascending ? right + 1 : right - 1;

  for (var i = left; ascending ? i < end : i > end; ascending ? i++ : i--) {
    range.push(i);
  }

  return range;
};

var WIN_ANSI_MAP = {
  402: 131,
  8211: 150,
  8212: 151,
  8216: 145,
  8217: 146,
  8218: 130,
  8220: 147,
  8221: 148,
  8222: 132,
  8224: 134,
  8225: 135,
  8226: 149,
  8230: 133,
  8364: 128,
  8240: 137,
  8249: 139,
  8250: 155,
  710: 136,
  8482: 153,
  338: 140,
  339: 156,
  732: 152,
  352: 138,
  353: 154,
  376: 159,
  381: 142,
  382: 158
};
var characters = '.notdef       .notdef        .notdef        .notdef\n.notdef       .notdef        .notdef        .notdef\n.notdef       .notdef        .notdef        .notdef\n.notdef       .notdef        .notdef        .notdef\n.notdef       .notdef        .notdef        .notdef\n.notdef       .notdef        .notdef        .notdef\n.notdef       .notdef        .notdef        .notdef\n.notdef       .notdef        .notdef        .notdef\n\nspace         exclam         quotedbl       numbersign\ndollar        percent        ampersand      quotesingle\nparenleft     parenright     asterisk       plus\ncomma         hyphen         period         slash\nzero          one            two            three\nfour          five           six            seven\neight         nine           colon          semicolon\nless          equal          greater        question\n\nat            A              B              C\nD             E              F              G\nH             I              J              K\nL             M              N              O\nP             Q              R              S\nT             U              V              W\nX             Y              Z              bracketleft\nbackslash     bracketright   asciicircum    underscore\n\ngrave         a              b              c\nd             e              f              g\nh             i              j              k\nl             m              n              o\np             q              r              s\nt             u              v              w\nx             y              z              braceleft\nbar           braceright     asciitilde     .notdef\n\nEuro          .notdef        quotesinglbase florin\nquotedblbase  ellipsis       dagger         daggerdbl\ncircumflex    perthousand    Scaron         guilsinglleft\nOE            .notdef        Zcaron         .notdef\n.notdef       quoteleft      quoteright     quotedblleft\nquotedblright bullet         endash         emdash\ntilde         trademark      scaron         guilsinglright\noe            .notdef        zcaron         ydieresis\n\nspace         exclamdown     cent           sterling\ncurrency      yen            brokenbar      section\ndieresis      copyright      ordfeminine    guillemotleft\nlogicalnot    hyphen         registered     macron\ndegree        plusminus      twosuperior    threesuperior\nacute         mu             paragraph      periodcentered\ncedilla       onesuperior    ordmasculine   guillemotright\nonequarter    onehalf        threequarters  questiondown\n\nAgrave        Aacute         Acircumflex    Atilde\nAdieresis     Aring          AE             Ccedilla\nEgrave        Eacute         Ecircumflex    Edieresis\nIgrave        Iacute         Icircumflex    Idieresis\nEth           Ntilde         Ograve         Oacute\nOcircumflex   Otilde         Odieresis      multiply\nOslash        Ugrave         Uacute         Ucircumflex\nUdieresis     Yacute         Thorn          germandbls\n\nagrave        aacute         acircumflex    atilde\nadieresis     aring          ae             ccedilla\negrave        eacute         ecircumflex    edieresis\nigrave        iacute         icircumflex    idieresis\neth           ntilde         ograve         oacute\nocircumflex   otilde         odieresis      divide\noslash        ugrave         uacute         ucircumflex\nudieresis     yacute         thorn          ydieresis'.split(
  /\s+/
);

function _parse(contents) {
  var obj = {
    attributes: {},
    glyphWidths: {},
    kernPairs: {}
  };
  var section = '';

  for (
    var _iterator = _createForOfIteratorHelperLoose(contents.split('\n')),
      _step;
    !(_step = _iterator()).done;

  ) {
    var line = _step.value;
    var match;
    var a;

    if ((match = line.match(/^Start(\w+)/))) {
      section = match[1];
      continue;
    } else if ((match = line.match(/^End(\w+)/))) {
      section = '';
      continue;
    }

    switch (section) {
      case 'FontMetrics':
        match = line.match(/(^\w+)\s+(.*)/);
        var key = match[1];
        var value = match[2];

        if ((a = obj.attributes[key])) {
          if (!Array.isArray(a)) {
            a = obj.attributes[key] = [a];
          }

          a.push(value);
        } else {
          obj.attributes[key] = value;
        }

        break;

      case 'CharMetrics':
        if (!/^CH?\s/.test(line)) {
          continue;
        }

        var name = line.match(/\bN\s+(\.?\w+)\s*;/)[1];
        obj.glyphWidths[name] = +line.match(/\bWX\s+(\d+)\s*;/)[1];
        break;

      case 'KernPairs':
        match = line.match(/^KPX\s+(\.?\w+)\s+(\.?\w+)\s+(-?\d+)/);

        if (match) {
          obj.kernPairs[match[1] + match[2]] = parseInt(match[3]);
        }

        break;
    }
  }

  return obj;
}

var AFMFont = /*#__PURE__*/ (function() {
  AFMFont.open = function open(filename) {
    return new AFMFont(fs.readFileSync(filename, 'utf8'));
  };

  AFMFont.fromJson = function fromJson(json) {
    return new AFMFont(json);
  };

  function AFMFont(contents) {
    var _this = this;

    if (typeof contents === 'string') {
      this.contents = contents;
      this.parse();
    } else {
      this.attributes = contents.attributes;
      this.glyphWidths = contents.glyphWidths;
      this.kernPairs = contents.kernPairs;
    }

    this.charWidths = range(0, 255, true).map(function(i) {
      return _this.glyphWidths[characters[i]];
    });
    this.bbox = Array.from(this.attributes.FontBBox.split(/\s+/)).map(function(
      e
    ) {
      return +e;
    });
    this.ascender = +(this.attributes.Ascender || 0);
    this.descender = +(this.attributes.Descender || 0);
    this.xHeight = +(this.attributes.XHeight || 0);
    this.capHeight = +(this.attributes.CapHeight || 0);
    this.lineGap =
      this.bbox[3] - this.bbox[1] - (this.ascender - this.descender);
  }

  var _proto = AFMFont.prototype;

  _proto.parse = function parse() {
    var parsed = _parse(this.contents);

    this.attributes = parsed.attributes;
    this.glyphWidths = parsed.glyphWidths;
    this.kernPairs = parsed.kernPairs;
  };

  _proto.encodeText = function encodeText(text) {
    var res = [];

    for (
      var i = 0, end = text.length, asc = 0 <= end;
      asc ? i < end : i > end;
      asc ? i++ : i--
    ) {
      var char = text.charCodeAt(i);
      char = WIN_ANSI_MAP[char] || char;
      res.push(char.toString(16));
    }

    return res;
  };

  _proto.glyphsForString = function glyphsForString(string) {
    var glyphs = [];

    for (
      var i = 0, end = string.length, asc = 0 <= end;
      asc ? i < end : i > end;
      asc ? i++ : i--
    ) {
      var charCode = string.charCodeAt(i);
      glyphs.push(this.characterToGlyph(charCode));
    }

    return glyphs;
  };

  _proto.characterToGlyph = function characterToGlyph(character) {
    return characters[WIN_ANSI_MAP[character] || character] || '.notdef';
  };

  _proto.widthOfGlyph = function widthOfGlyph(glyph) {
    return this.glyphWidths[glyph] || 0;
  };

  _proto.getKernPair = function getKernPair(left, right) {
    return this.kernPairs[left + right] || 0;
  };

  _proto.advancesForGlyphs = function advancesForGlyphs(glyphs) {
    var advances = [];

    for (var index = 0; index < glyphs.length; index++) {
      var left = glyphs[index];
      var right = glyphs[index + 1];
      advances.push(this.widthOfGlyph(left) + this.getKernPair(left, right));
    }

    return advances;
  };

  return AFMFont;
})();

var attributes = [
  {
    Comment: [
      'Copyright (c) 1985, 1987, 1989, 1990, 1997 Adobe Systems Incorporated.  All Rights Reserved.',
      'Creation Date: Thu May  1 12:43:52 1997',
      'UniqueID 43052',
      'VMusage 37169 48194'
    ],
    FontName: 'Helvetica-Bold',
    FullName: 'Helvetica Bold',
    FamilyName: 'Helvetica',
    Weight: 'Bold',
    ItalicAngle: '0',
    IsFixedPitch: 'false',
    CharacterSet: 'ExtendedRoman',
    FontBBox: '-170 -228 1003 962 ',
    UnderlinePosition: '-100',
    UnderlineThickness: '50',
    Version: '002.000',
    Notice:
      'Copyright (c) 1985, 1987, 1989, 1990, 1997 Adobe Systems Incorporated.  All Rights Reserved.Helvetica is a trademark of Linotype-Hell AG and/or its subsidiaries.',
    EncodingScheme: 'AdobeStandardEncoding',
    CapHeight: '718',
    XHeight: '532',
    Ascender: '718',
    Descender: '-207',
    StdHW: '118',
    StdVW: '140'
  },
  {
    Comment: [
      'Copyright (c) 1985, 1987, 1989, 1990, 1997 Adobe Systems Incorporated.  All Rights Reserved.',
      'Creation Date: Thu May  1 12:45:12 1997',
      'UniqueID 43053',
      'VMusage 14482 68586'
    ],
    FontName: 'Helvetica-BoldOblique',
    FullName: 'Helvetica Bold Oblique',
    FamilyName: 'Helvetica',
    Weight: 'Bold',
    ItalicAngle: '-12',
    IsFixedPitch: 'false',
    CharacterSet: 'ExtendedRoman',
    FontBBox: '-174 -228 1114 962',
    UnderlinePosition: '-100',
    UnderlineThickness: '50',
    Version: '002.000',
    Notice:
      'Copyright (c) 1985, 1987, 1989, 1990, 1997 Adobe Systems Incorporated.  All Rights Reserved.Helvetica is a trademark of Linotype-Hell AG and/or its subsidiaries.',
    EncodingScheme: 'AdobeStandardEncoding',
    CapHeight: '718',
    XHeight: '532',
    Ascender: '718',
    Descender: '-207',
    StdHW: '118',
    StdVW: '140'
  },
  {
    Comment: [
      'Copyright (c) 1985, 1987, 1989, 1990, 1997 Adobe Systems Incorporated.  All Rights Reserved.',
      'Creation Date: Thu May  1 12:44:31 1997',
      'UniqueID 43055',
      'VMusage 14960 69346'
    ],
    FontName: 'Helvetica-Oblique',
    FullName: 'Helvetica Oblique',
    FamilyName: 'Helvetica',
    Weight: 'Medium',
    ItalicAngle: '-12',
    IsFixedPitch: 'false',
    CharacterSet: 'ExtendedRoman',
    FontBBox: '-170 -225 1116 931 ',
    UnderlinePosition: '-100',
    UnderlineThickness: '50',
    Version: '002.000',
    Notice:
      'Copyright (c) 1985, 1987, 1989, 1990, 1997 Adobe Systems Incorporated.  All Rights Reserved.Helvetica is a trademark of Linotype-Hell AG and/or its subsidiaries.',
    EncodingScheme: 'AdobeStandardEncoding',
    CapHeight: '718',
    XHeight: '523',
    Ascender: '718',
    Descender: '-207',
    StdHW: '76',
    StdVW: '88'
  },
  {
    Comment: [
      'Copyright (c) 1985, 1987, 1989, 1990, 1997 Adobe Systems Incorporated.  All Rights Reserved.',
      'Creation Date: Thu May  1 12:38:23 1997',
      'UniqueID 43054',
      'VMusage 37069 48094'
    ],
    FontName: 'Helvetica',
    FullName: 'Helvetica',
    FamilyName: 'Helvetica',
    Weight: 'Medium',
    ItalicAngle: '0',
    IsFixedPitch: 'false',
    CharacterSet: 'ExtendedRoman',
    FontBBox: '-166 -225 1000 931 ',
    UnderlinePosition: '-100',
    UnderlineThickness: '50',
    Version: '002.000',
    Notice:
      'Copyright (c) 1985, 1987, 1989, 1990, 1997 Adobe Systems Incorporated.  All Rights Reserved.Helvetica is a trademark of Linotype-Hell AG and/or its subsidiaries.',
    EncodingScheme: 'AdobeStandardEncoding',
    CapHeight: '718',
    XHeight: '523',
    Ascender: '718',
    Descender: '-207',
    StdHW: '76',
    StdVW: '88'
  },
  {
    Comment: [
      'Copyright (c) 1985, 1987, 1989, 1990, 1993, 1997 Adobe Systems Incorporated.  All Rights Reserved.',
      'Creation Date: Thu May  1 12:52:56 1997',
      'UniqueID 43065',
      'VMusage 41636 52661'
    ],
    FontName: 'Times-Bold',
    FullName: 'Times Bold',
    FamilyName: 'Times',
    Weight: 'Bold',
    ItalicAngle: '0',
    IsFixedPitch: 'false',
    CharacterSet: 'ExtendedRoman',
    FontBBox: '-168 -218 1000 935 ',
    UnderlinePosition: '-100',
    UnderlineThickness: '50',
    Version: '002.000',
    Notice:
      'Copyright (c) 1985, 1987, 1989, 1990, 1993, 1997 Adobe Systems Incorporated.  All Rights Reserved.Times is a trademark of Linotype-Hell AG and/or its subsidiaries.',
    EncodingScheme: 'AdobeStandardEncoding',
    CapHeight: '676',
    XHeight: '461',
    Ascender: '683',
    Descender: '-217',
    StdHW: '44',
    StdVW: '139'
  },
  {
    Comment: [
      'Copyright (c) 1985, 1987, 1989, 1990, 1993, 1997 Adobe Systems Incorporated.  All Rights Reserved.',
      'Creation Date: Thu May  1 13:04:06 1997',
      'UniqueID 43066',
      'VMusage 45874 56899'
    ],
    FontName: 'Times-BoldItalic',
    FullName: 'Times Bold Italic',
    FamilyName: 'Times',
    Weight: 'Bold',
    ItalicAngle: '-15',
    IsFixedPitch: 'false',
    CharacterSet: 'ExtendedRoman',
    FontBBox: '-200 -218 996 921',
    UnderlinePosition: '-100',
    UnderlineThickness: '50',
    Version: '002.000',
    Notice:
      'Copyright (c) 1985, 1987, 1989, 1990, 1993, 1997 Adobe Systems Incorporated.  All Rights Reserved.Times is a trademark of Linotype-Hell AG and/or its subsidiaries.',
    EncodingScheme: 'AdobeStandardEncoding',
    CapHeight: '669',
    XHeight: '462',
    Ascender: '683',
    Descender: '-217',
    StdHW: '42',
    StdVW: '121'
  },
  {
    Comment: [
      'Copyright (c) 1985, 1987, 1989, 1990, 1993, 1997 Adobe Systems Incorporated.  All Rights Reserved.',
      'Creation Date: Thu May  1 12:56:55 1997',
      'UniqueID 43067',
      'VMusage 47727 58752'
    ],
    FontName: 'Times-Italic',
    FullName: 'Times Italic',
    FamilyName: 'Times',
    Weight: 'Medium',
    ItalicAngle: '-15.5',
    IsFixedPitch: 'false',
    CharacterSet: 'ExtendedRoman',
    FontBBox: '-169 -217 1010 883 ',
    UnderlinePosition: '-100',
    UnderlineThickness: '50',
    Version: '002.000',
    Notice:
      'Copyright (c) 1985, 1987, 1989, 1990, 1993, 1997 Adobe Systems Incorporated.  All Rights Reserved.Times is a trademark of Linotype-Hell AG and/or its subsidiaries.',
    EncodingScheme: 'AdobeStandardEncoding',
    CapHeight: '653',
    XHeight: '441',
    Ascender: '683',
    Descender: '-217',
    StdHW: '32',
    StdVW: '76'
  },
  {
    Comment: [
      'Copyright (c) 1985, 1987, 1989, 1990, 1993, 1997 Adobe Systems Incorporated.  All Rights Reserved.',
      'Creation Date: Thu May  1 12:49:17 1997',
      'UniqueID 43068',
      'VMusage 43909 54934'
    ],
    FontName: 'Times-Roman',
    FullName: 'Times Roman',
    FamilyName: 'Times',
    Weight: 'Roman',
    ItalicAngle: '0',
    IsFixedPitch: 'false',
    CharacterSet: 'ExtendedRoman',
    FontBBox: '-168 -218 1000 898 ',
    UnderlinePosition: '-100',
    UnderlineThickness: '50',
    Version: '002.000',
    Notice:
      'Copyright (c) 1985, 1987, 1989, 1990, 1993, 1997 Adobe Systems Incorporated.  All Rights Reserved.Times is a trademark of Linotype-Hell AG and/or its subsidiaries.',
    EncodingScheme: 'AdobeStandardEncoding',
    CapHeight: '662',
    XHeight: '450',
    Ascender: '683',
    Descender: '-217',
    StdHW: '28',
    StdVW: '84'
  },
  {
    Comment: [
      'Copyright (c) 1989, 1990, 1991, 1993, 1997 Adobe Systems Incorporated.  All Rights Reserved.',
      'Creation Date: Mon Jun 23 16:28:00 1997',
      'UniqueID 43048',
      'VMusage 41139 52164'
    ],
    FontName: 'Courier-Bold',
    FullName: 'Courier Bold',
    FamilyName: 'Courier',
    Weight: 'Bold',
    ItalicAngle: '0',
    IsFixedPitch: 'true',
    CharacterSet: 'ExtendedRoman',
    FontBBox: '-113 -250 749 801 ',
    UnderlinePosition: '-100',
    UnderlineThickness: '50',
    Version: '003.000',
    Notice:
      'Copyright (c) 1989, 1990, 1991, 1993, 1997 Adobe Systems Incorporated.  All Rights Reserved.',
    EncodingScheme: 'AdobeStandardEncoding',
    CapHeight: '562',
    XHeight: '439',
    Ascender: '629',
    Descender: '-157',
    StdHW: '84',
    StdVW: '106'
  },
  {
    Comment: [
      'Copyright (c) 1989, 1990, 1991, 1993, 1997 Adobe Systems Incorporated.  All Rights Reserved.',
      'Creation Date: Mon Jun 23 16:28:46 1997',
      'UniqueID 43049',
      'VMusage 17529 79244'
    ],
    FontName: 'Courier-BoldOblique',
    FullName: 'Courier Bold Oblique',
    FamilyName: 'Courier',
    Weight: 'Bold',
    ItalicAngle: '-12',
    IsFixedPitch: 'true',
    CharacterSet: 'ExtendedRoman',
    FontBBox: '-57 -250 869 801',
    UnderlinePosition: '-100',
    UnderlineThickness: '50',
    Version: '003.000',
    Notice:
      'Copyright (c) 1989, 1990, 1991, 1993, 1997 Adobe Systems Incorporated.  All Rights Reserved.',
    EncodingScheme: 'AdobeStandardEncoding',
    CapHeight: '562',
    XHeight: '439',
    Ascender: '629',
    Descender: '-157',
    StdHW: '84',
    StdVW: '106'
  },
  {
    Comment: [
      'Copyright (c) 1989, 1990, 1991, 1992, 1993, 1997 Adobe Systems Incorporated.  All Rights Reserved.',
      'Creation Date: Thu May  1 17:37:52 1997',
      'UniqueID 43051',
      'VMusage 16248 75829'
    ],
    FontName: 'Courier-Oblique',
    FullName: 'Courier Oblique',
    FamilyName: 'Courier',
    Weight: 'Medium',
    ItalicAngle: '-12',
    IsFixedPitch: 'true',
    CharacterSet: 'ExtendedRoman',
    FontBBox: '-27 -250 849 805 ',
    UnderlinePosition: '-100',
    UnderlineThickness: '50',
    Version: '003.000',
    Notice:
      'Copyright (c) 1989, 1990, 1991, 1992, 1993, 1997 Adobe Systems Incorporated.  All Rights Reserved.',
    EncodingScheme: 'AdobeStandardEncoding',
    CapHeight: '562',
    XHeight: '426',
    Ascender: '629',
    Descender: '-157',
    StdHW: '51',
    StdVW: '51'
  },
  {
    Comment: [
      'Copyright (c) 1989, 1990, 1991, 1992, 1993, 1997 Adobe Systems Incorporated.  All Rights Reserved.',
      'Creation Date: Thu May  1 17:27:09 1997',
      'UniqueID 43050',
      'VMusage 39754 50779'
    ],
    FontName: 'Courier',
    FullName: 'Courier',
    FamilyName: 'Courier',
    Weight: 'Medium',
    ItalicAngle: '0',
    IsFixedPitch: 'true',
    CharacterSet: 'ExtendedRoman',
    FontBBox: '-23 -250 715 805 ',
    UnderlinePosition: '-100',
    UnderlineThickness: '50',
    Version: '003.000',
    Notice:
      'Copyright (c) 1989, 1990, 1991, 1992, 1993, 1997 Adobe Systems Incorporated.  All Rights Reserved.',
    EncodingScheme: 'AdobeStandardEncoding',
    CapHeight: '562',
    XHeight: '426',
    Ascender: '629',
    Descender: '-157',
    StdHW: '51',
    StdVW: '51'
  }
];
var glyphWidths = {
  space: [278, 278, 278, 278, 250, 250, 250, 250, 600, 600, 600, 600],
  exclam: [333, 333, 278, 278, 333, 389, 333, 333, 600, 600, 600, 600],
  quotedbl: [474, 474, 355, 355, 555, 555, 420, 408, 600, 600, 600, 600],
  numbersign: [556, 556, 556, 556, 500, 500, 500, 500, 600, 600, 600, 600],
  dollar: [556, 556, 556, 556, 500, 500, 500, 500, 600, 600, 600, 600],
  percent: [889, 889, 889, 889, 1000, 833, 833, 833, 600, 600, 600, 600],
  ampersand: [722, 722, 667, 667, 833, 778, 778, 778, 600, 600, 600, 600],
  quoteright: [278, 278, 222, 222, 333, 333, 333, 333, 600, 600, 600, 600],
  parenleft: [333, 333, 333, 333, 333, 333, 333, 333, 600, 600, 600, 600],
  parenright: [333, 333, 333, 333, 333, 333, 333, 333, 600, 600, 600, 600],
  asterisk: [389, 389, 389, 389, 500, 500, 500, 500, 600, 600, 600, 600],
  plus: [584, 584, 584, 584, 570, 570, 675, 564, 600, 600, 600, 600],
  comma: [278, 278, 278, 278, 250, 250, 250, 250, 600, 600, 600, 600],
  hyphen: [333, 333, 333, 333, 333, 333, 333, 333, 600, 600, 600, 600],
  period: [278, 278, 278, 278, 250, 250, 250, 250, 600, 600, 600, 600],
  slash: [278, 278, 278, 278, 278, 278, 278, 278, 600, 600, 600, 600],
  zero: [556, 556, 556, 556, 500, 500, 500, 500, 600, 600, 600, 600],
  one: [556, 556, 556, 556, 500, 500, 500, 500, 600, 600, 600, 600],
  two: [556, 556, 556, 556, 500, 500, 500, 500, 600, 600, 600, 600],
  three: [556, 556, 556, 556, 500, 500, 500, 500, 600, 600, 600, 600],
  four: [556, 556, 556, 556, 500, 500, 500, 500, 600, 600, 600, 600],
  five: [556, 556, 556, 556, 500, 500, 500, 500, 600, 600, 600, 600],
  six: [556, 556, 556, 556, 500, 500, 500, 500, 600, 600, 600, 600],
  seven: [556, 556, 556, 556, 500, 500, 500, 500, 600, 600, 600, 600],
  eight: [556, 556, 556, 556, 500, 500, 500, 500, 600, 600, 600, 600],
  nine: [556, 556, 556, 556, 500, 500, 500, 500, 600, 600, 600, 600],
  colon: [333, 333, 278, 278, 333, 333, 333, 278, 600, 600, 600, 600],
  semicolon: [333, 333, 278, 278, 333, 333, 333, 278, 600, 600, 600, 600],
  less: [584, 584, 584, 584, 570, 570, 675, 564, 600, 600, 600, 600],
  equal: [584, 584, 584, 584, 570, 570, 675, 564, 600, 600, 600, 600],
  greater: [584, 584, 584, 584, 570, 570, 675, 564, 600, 600, 600, 600],
  question: [611, 611, 556, 556, 500, 500, 500, 444, 600, 600, 600, 600],
  at: [975, 975, 1015, 1015, 930, 832, 920, 921, 600, 600, 600, 600],
  A: [722, 722, 667, 667, 722, 667, 611, 722, 600, 600, 600, 600],
  B: [722, 722, 667, 667, 667, 667, 611, 667, 600, 600, 600, 600],
  C: [722, 722, 722, 722, 722, 667, 667, 667, 600, 600, 600, 600],
  D: [722, 722, 722, 722, 722, 722, 722, 722, 600, 600, 600, 600],
  E: [667, 667, 667, 667, 667, 667, 611, 611, 600, 600, 600, 600],
  F: [611, 611, 611, 611, 611, 667, 611, 556, 600, 600, 600, 600],
  G: [778, 778, 778, 778, 778, 722, 722, 722, 600, 600, 600, 600],
  H: [722, 722, 722, 722, 778, 778, 722, 722, 600, 600, 600, 600],
  I: [278, 278, 278, 278, 389, 389, 333, 333, 600, 600, 600, 600],
  J: [556, 556, 500, 500, 500, 500, 444, 389, 600, 600, 600, 600],
  K: [722, 722, 667, 667, 778, 667, 667, 722, 600, 600, 600, 600],
  L: [611, 611, 556, 556, 667, 611, 556, 611, 600, 600, 600, 600],
  M: [833, 833, 833, 833, 944, 889, 833, 889, 600, 600, 600, 600],
  N: [722, 722, 722, 722, 722, 722, 667, 722, 600, 600, 600, 600],
  O: [778, 778, 778, 778, 778, 722, 722, 722, 600, 600, 600, 600],
  P: [667, 667, 667, 667, 611, 611, 611, 556, 600, 600, 600, 600],
  Q: [778, 778, 778, 778, 778, 722, 722, 722, 600, 600, 600, 600],
  R: [722, 722, 722, 722, 722, 667, 611, 667, 600, 600, 600, 600],
  S: [667, 667, 667, 667, 556, 556, 500, 556, 600, 600, 600, 600],
  T: [611, 611, 611, 611, 667, 611, 556, 611, 600, 600, 600, 600],
  U: [722, 722, 722, 722, 722, 722, 722, 722, 600, 600, 600, 600],
  V: [667, 667, 667, 667, 722, 667, 611, 722, 600, 600, 600, 600],
  W: [944, 944, 944, 944, 1000, 889, 833, 944, 600, 600, 600, 600],
  X: [667, 667, 667, 667, 722, 667, 611, 722, 600, 600, 600, 600],
  Y: [667, 667, 667, 667, 722, 611, 556, 722, 600, 600, 600, 600],
  Z: [611, 611, 611, 611, 667, 611, 556, 611, 600, 600, 600, 600],
  bracketleft: [333, 333, 278, 278, 333, 333, 389, 333, 600, 600, 600, 600],
  backslash: [278, 278, 278, 278, 278, 278, 278, 278, 600, 600, 600, 600],
  bracketright: [333, 333, 278, 278, 333, 333, 389, 333, 600, 600, 600, 600],
  asciicircum: [584, 584, 469, 469, 581, 570, 422, 469, 600, 600, 600, 600],
  underscore: [556, 556, 556, 556, 500, 500, 500, 500, 600, 600, 600, 600],
  quoteleft: [278, 278, 222, 222, 333, 333, 333, 333, 600, 600, 600, 600],
  a: [556, 556, 556, 556, 500, 500, 500, 444, 600, 600, 600, 600],
  b: [611, 611, 556, 556, 556, 500, 500, 500, 600, 600, 600, 600],
  c: [556, 556, 500, 500, 444, 444, 444, 444, 600, 600, 600, 600],
  d: [611, 611, 556, 556, 556, 500, 500, 500, 600, 600, 600, 600],
  e: [556, 556, 556, 556, 444, 444, 444, 444, 600, 600, 600, 600],
  f: [333, 333, 278, 278, 333, 333, 278, 333, 600, 600, 600, 600],
  g: [611, 611, 556, 556, 500, 500, 500, 500, 600, 600, 600, 600],
  h: [611, 611, 556, 556, 556, 556, 500, 500, 600, 600, 600, 600],
  i: [278, 278, 222, 222, 278, 278, 278, 278, 600, 600, 600, 600],
  j: [278, 278, 222, 222, 333, 278, 278, 278, 600, 600, 600, 600],
  k: [556, 556, 500, 500, 556, 500, 444, 500, 600, 600, 600, 600],
  l: [278, 278, 222, 222, 278, 278, 278, 278, 600, 600, 600, 600],
  m: [889, 889, 833, 833, 833, 778, 722, 778, 600, 600, 600, 600],
  n: [611, 611, 556, 556, 556, 556, 500, 500, 600, 600, 600, 600],
  o: [611, 611, 556, 556, 500, 500, 500, 500, 600, 600, 600, 600],
  p: [611, 611, 556, 556, 556, 500, 500, 500, 600, 600, 600, 600],
  q: [611, 611, 556, 556, 556, 500, 500, 500, 600, 600, 600, 600],
  r: [389, 389, 333, 333, 444, 389, 389, 333, 600, 600, 600, 600],
  s: [556, 556, 500, 500, 389, 389, 389, 389, 600, 600, 600, 600],
  t: [333, 333, 278, 278, 333, 278, 278, 278, 600, 600, 600, 600],
  u: [611, 611, 556, 556, 556, 556, 500, 500, 600, 600, 600, 600],
  v: [556, 556, 500, 500, 500, 444, 444, 500, 600, 600, 600, 600],
  w: [778, 778, 722, 722, 722, 667, 667, 722, 600, 600, 600, 600],
  x: [556, 556, 500, 500, 500, 500, 444, 500, 600, 600, 600, 600],
  y: [556, 556, 500, 500, 500, 444, 444, 500, 600, 600, 600, 600],
  z: [500, 500, 500, 500, 444, 389, 389, 444, 600, 600, 600, 600],
  braceleft: [389, 389, 334, 334, 394, 348, 400, 480, 600, 600, 600, 600],
  bar: [280, 280, 260, 260, 220, 220, 275, 200, 600, 600, 600, 600],
  braceright: [389, 389, 334, 334, 394, 348, 400, 480, 600, 600, 600, 600],
  asciitilde: [584, 584, 584, 584, 520, 570, 541, 541, 600, 600, 600, 600],
  exclamdown: [333, 333, 333, 333, 333, 389, 389, 333, 600, 600, 600, 600],
  cent: [556, 556, 556, 556, 500, 500, 500, 500, 600, 600, 600, 600],
  sterling: [556, 556, 556, 556, 500, 500, 500, 500, 600, 600, 600, 600],
  fraction: [167, 167, 167, 167, 167, 167, 167, 167, 600, 600, 600, 600],
  yen: [556, 556, 556, 556, 500, 500, 500, 500, 600, 600, 600, 600],
  florin: [556, 556, 556, 556, 500, 500, 500, 500, 600, 600, 600, 600],
  section: [556, 556, 556, 556, 500, 500, 500, 500, 600, 600, 600, 600],
  currency: [556, 556, 556, 556, 500, 500, 500, 500, 600, 600, 600, 600],
  quotesingle: [238, 238, 191, 191, 278, 278, 214, 180, 600, 600, 600, 600],
  quotedblleft: [500, 500, 333, 333, 500, 500, 556, 444, 600, 600, 600, 600],
  guillemotleft: [556, 556, 556, 556, 500, 500, 500, 500, 600, 600, 600, 600],
  guilsinglleft: [333, 333, 333, 333, 333, 333, 333, 333, 600, 600, 600, 600],
  guilsinglright: [333, 333, 333, 333, 333, 333, 333, 333, 600, 600, 600, 600],
  fi: [611, 611, 500, 500, 556, 556, 500, 556, 600, 600, 600, 600],
  fl: [611, 611, 500, 500, 556, 556, 500, 556, 600, 600, 600, 600],
  endash: [556, 556, 556, 556, 500, 500, 500, 500, 600, 600, 600, 600],
  dagger: [556, 556, 556, 556, 500, 500, 500, 500, 600, 600, 600, 600],
  daggerdbl: [556, 556, 556, 556, 500, 500, 500, 500, 600, 600, 600, 600],
  periodcentered: [278, 278, 278, 278, 250, 250, 250, 250, 600, 600, 600, 600],
  paragraph: [556, 556, 537, 537, 540, 500, 523, 453, 600, 600, 600, 600],
  bullet: [350, 350, 350, 350, 350, 350, 350, 350, 600, 600, 600, 600],
  quotesinglbase: [278, 278, 222, 222, 333, 333, 333, 333, 600, 600, 600, 600],
  quotedblbase: [500, 500, 333, 333, 500, 500, 556, 444, 600, 600, 600, 600],
  quotedblright: [500, 500, 333, 333, 500, 500, 556, 444, 600, 600, 600, 600],
  guillemotright: [556, 556, 556, 556, 500, 500, 500, 500, 600, 600, 600, 600],
  ellipsis: [1000, 1000, 1000, 1000, 1000, 1000, 889, 1000, 600, 600, 600, 600],
  perthousand: [
    1000,
    1000,
    1000,
    1000,
    1000,
    1000,
    1000,
    1000,
    600,
    600,
    600,
    600
  ],
  questiondown: [611, 611, 611, 611, 500, 500, 500, 444, 600, 600, 600, 600],
  grave: [333, 333, 333, 333, 333, 333, 333, 333, 600, 600, 600, 600],
  acute: [333, 333, 333, 333, 333, 333, 333, 333, 600, 600, 600, 600],
  circumflex: [333, 333, 333, 333, 333, 333, 333, 333, 600, 600, 600, 600],
  tilde: [333, 333, 333, 333, 333, 333, 333, 333, 600, 600, 600, 600],
  macron: [333, 333, 333, 333, 333, 333, 333, 333, 600, 600, 600, 600],
  breve: [333, 333, 333, 333, 333, 333, 333, 333, 600, 600, 600, 600],
  dotaccent: [333, 333, 333, 333, 333, 333, 333, 333, 600, 600, 600, 600],
  dieresis: [333, 333, 333, 333, 333, 333, 333, 333, 600, 600, 600, 600],
  ring: [333, 333, 333, 333, 333, 333, 333, 333, 600, 600, 600, 600],
  cedilla: [333, 333, 333, 333, 333, 333, 333, 333, 600, 600, 600, 600],
  hungarumlaut: [333, 333, 333, 333, 333, 333, 333, 333, 600, 600, 600, 600],
  ogonek: [333, 333, 333, 333, 333, 333, 333, 333, 600, 600, 600, 600],
  caron: [333, 333, 333, 333, 333, 333, 333, 333, 600, 600, 600, 600],
  emdash: [1000, 1000, 1000, 1000, 1000, 1000, 889, 1000, 600, 600, 600, 600],
  AE: [1000, 1000, 1000, 1000, 1000, 944, 889, 889, 600, 600, 600, 600],
  ordfeminine: [370, 370, 370, 370, 300, 266, 276, 276, 600, 600, 600, 600],
  Lslash: [611, 611, 556, 556, 667, 611, 556, 611, 600, 600, 600, 600],
  Oslash: [778, 778, 778, 778, 778, 722, 722, 722, 600, 600, 600, 600],
  OE: [1000, 1000, 1000, 1000, 1000, 944, 944, 889, 600, 600, 600, 600],
  ordmasculine: [365, 365, 365, 365, 330, 300, 310, 310, 600, 600, 600, 600],
  ae: [889, 889, 889, 889, 722, 722, 667, 667, 600, 600, 600, 600],
  dotlessi: [278, 278, 278, 278, 278, 278, 278, 278, 600, 600, 600, 600],
  lslash: [278, 278, 222, 222, 278, 278, 278, 278, 600, 600, 600, 600],
  oslash: [611, 611, 611, 611, 500, 500, 500, 500, 600, 600, 600, 600],
  oe: [944, 944, 944, 944, 722, 722, 667, 722, 600, 600, 600, 600],
  germandbls: [611, 611, 611, 611, 556, 500, 500, 500, 600, 600, 600, 600],
  Idieresis: [278, 278, 278, 278, 389, 389, 333, 333, 600, 600, 600, 600],
  eacute: [556, 556, 556, 556, 444, 444, 444, 444, 600, 600, 600, 600],
  abreve: [556, 556, 556, 556, 500, 500, 500, 444, 600, 600, 600, 600],
  uhungarumlaut: [611, 611, 556, 556, 556, 556, 500, 500, 600, 600, 600, 600],
  ecaron: [556, 556, 556, 556, 444, 444, 444, 444, 600, 600, 600, 600],
  Ydieresis: [667, 667, 667, 667, 722, 611, 556, 722, 600, 600, 600, 600],
  divide: [584, 584, 584, 584, 570, 570, 675, 564, 600, 600, 600, 600],
  Yacute: [667, 667, 667, 667, 722, 611, 556, 722, 600, 600, 600, 600],
  Acircumflex: [722, 722, 667, 667, 722, 667, 611, 722, 600, 600, 600, 600],
  aacute: [556, 556, 556, 556, 500, 500, 500, 444, 600, 600, 600, 600],
  Ucircumflex: [722, 722, 722, 722, 722, 722, 722, 722, 600, 600, 600, 600],
  yacute: [556, 556, 500, 500, 500, 444, 444, 500, 600, 600, 600, 600],
  scommaaccent: [556, 556, 500, 500, 389, 389, 389, 389, 600, 600, 600, 600],
  ecircumflex: [556, 556, 556, 556, 444, 444, 444, 444, 600, 600, 600, 600],
  Uring: [722, 722, 722, 722, 722, 722, 722, 722, 600, 600, 600, 600],
  Udieresis: [722, 722, 722, 722, 722, 722, 722, 722, 600, 600, 600, 600],
  aogonek: [556, 556, 556, 556, 500, 500, 500, 444, 600, 600, 600, 600],
  Uacute: [722, 722, 722, 722, 722, 722, 722, 722, 600, 600, 600, 600],
  uogonek: [611, 611, 556, 556, 556, 556, 500, 500, 600, 600, 600, 600],
  Edieresis: [667, 667, 667, 667, 667, 667, 611, 611, 600, 600, 600, 600],
  Dcroat: [722, 722, 722, 722, 722, 722, 722, 722, 600, 600, 600, 600],
  commaaccent: [250, 250, 250, 250, 250, 250, 250, 250, 600, 600, 600, 600],
  copyright: [737, 737, 737, 737, 747, 747, 760, 760, 600, 600, 600, 600],
  Emacron: [667, 667, 667, 667, 667, 667, 611, 611, 600, 600, 600, 600],
  ccaron: [556, 556, 500, 500, 444, 444, 444, 444, 600, 600, 600, 600],
  aring: [556, 556, 556, 556, 500, 500, 500, 444, 600, 600, 600, 600],
  Ncommaaccent: [722, 722, 722, 722, 722, 722, 667, 722, 600, 600, 600, 600],
  lacute: [278, 278, 222, 222, 278, 278, 278, 278, 600, 600, 600, 600],
  agrave: [556, 556, 556, 556, 500, 500, 500, 444, 600, 600, 600, 600],
  Tcommaaccent: [611, 611, 611, 611, 667, 611, 556, 611, 600, 600, 600, 600],
  Cacute: [722, 722, 722, 722, 722, 667, 667, 667, 600, 600, 600, 600],
  atilde: [556, 556, 556, 556, 500, 500, 500, 444, 600, 600, 600, 600],
  Edotaccent: [667, 667, 667, 667, 667, 667, 611, 611, 600, 600, 600, 600],
  scaron: [556, 556, 500, 500, 389, 389, 389, 389, 600, 600, 600, 600],
  scedilla: [556, 556, 500, 500, 389, 389, 389, 389, 600, 600, 600, 600],
  iacute: [278, 278, 278, 278, 278, 278, 278, 278, 600, 600, 600, 600],
  lozenge: [494, 494, 471, 471, 494, 494, 471, 471, 600, 600, 600, 600],
  Rcaron: [722, 722, 722, 722, 722, 667, 611, 667, 600, 600, 600, 600],
  Gcommaaccent: [778, 778, 778, 778, 778, 722, 722, 722, 600, 600, 600, 600],
  ucircumflex: [611, 611, 556, 556, 556, 556, 500, 500, 600, 600, 600, 600],
  acircumflex: [556, 556, 556, 556, 500, 500, 500, 444, 600, 600, 600, 600],
  Amacron: [722, 722, 667, 667, 722, 667, 611, 722, 600, 600, 600, 600],
  rcaron: [389, 389, 333, 333, 444, 389, 389, 333, 600, 600, 600, 600],
  ccedilla: [556, 556, 500, 500, 444, 444, 444, 444, 600, 600, 600, 600],
  Zdotaccent: [611, 611, 611, 611, 667, 611, 556, 611, 600, 600, 600, 600],
  Thorn: [667, 667, 667, 667, 611, 611, 611, 556, 600, 600, 600, 600],
  Omacron: [778, 778, 778, 778, 778, 722, 722, 722, 600, 600, 600, 600],
  Racute: [722, 722, 722, 722, 722, 667, 611, 667, 600, 600, 600, 600],
  Sacute: [667, 667, 667, 667, 556, 556, 500, 556, 600, 600, 600, 600],
  dcaron: [743, 743, 643, 643, 672, 608, 544, 588, 600, 600, 600, 600],
  Umacron: [722, 722, 722, 722, 722, 722, 722, 722, 600, 600, 600, 600],
  uring: [611, 611, 556, 556, 556, 556, 500, 500, 600, 600, 600, 600],
  threesuperior: [333, 333, 333, 333, 300, 300, 300, 300, 600, 600, 600, 600],
  Ograve: [778, 778, 778, 778, 778, 722, 722, 722, 600, 600, 600, 600],
  Agrave: [722, 722, 667, 667, 722, 667, 611, 722, 600, 600, 600, 600],
  Abreve: [722, 722, 667, 667, 722, 667, 611, 722, 600, 600, 600, 600],
  multiply: [584, 584, 584, 584, 570, 570, 675, 564, 600, 600, 600, 600],
  uacute: [611, 611, 556, 556, 556, 556, 500, 500, 600, 600, 600, 600],
  Tcaron: [611, 611, 611, 611, 667, 611, 556, 611, 600, 600, 600, 600],
  partialdiff: [494, 494, 476, 476, 494, 494, 476, 476, 600, 600, 600, 600],
  ydieresis: [556, 556, 500, 500, 500, 444, 444, 500, 600, 600, 600, 600],
  Nacute: [722, 722, 722, 722, 722, 722, 667, 722, 600, 600, 600, 600],
  icircumflex: [278, 278, 278, 278, 278, 278, 278, 278, 600, 600, 600, 600],
  Ecircumflex: [667, 667, 667, 667, 667, 667, 611, 611, 600, 600, 600, 600],
  adieresis: [556, 556, 556, 556, 500, 500, 500, 444, 600, 600, 600, 600],
  edieresis: [556, 556, 556, 556, 444, 444, 444, 444, 600, 600, 600, 600],
  cacute: [556, 556, 500, 500, 444, 444, 444, 444, 600, 600, 600, 600],
  nacute: [611, 611, 556, 556, 556, 556, 500, 500, 600, 600, 600, 600],
  umacron: [611, 611, 556, 556, 556, 556, 500, 500, 600, 600, 600, 600],
  Ncaron: [722, 722, 722, 722, 722, 722, 667, 722, 600, 600, 600, 600],
  Iacute: [278, 278, 278, 278, 389, 389, 333, 333, 600, 600, 600, 600],
  plusminus: [584, 584, 584, 584, 570, 570, 675, 564, 600, 600, 600, 600],
  brokenbar: [280, 280, 260, 260, 220, 220, 275, 200, 600, 600, 600, 600],
  registered: [737, 737, 737, 737, 747, 747, 760, 760, 600, 600, 600, 600],
  Gbreve: [778, 778, 778, 778, 778, 722, 722, 722, 600, 600, 600, 600],
  Idotaccent: [278, 278, 278, 278, 389, 389, 333, 333, 600, 600, 600, 600],
  summation: [600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 600],
  Egrave: [667, 667, 667, 667, 667, 667, 611, 611, 600, 600, 600, 600],
  racute: [389, 389, 333, 333, 444, 389, 389, 333, 600, 600, 600, 600],
  omacron: [611, 611, 556, 556, 500, 500, 500, 500, 600, 600, 600, 600],
  Zacute: [611, 611, 611, 611, 667, 611, 556, 611, 600, 600, 600, 600],
  Zcaron: [611, 611, 611, 611, 667, 611, 556, 611, 600, 600, 600, 600],
  greaterequal: [549, 549, 549, 549, 549, 549, 549, 549, 600, 600, 600, 600],
  Eth: [722, 722, 722, 722, 722, 722, 722, 722, 600, 600, 600, 600],
  Ccedilla: [722, 722, 722, 722, 722, 667, 667, 667, 600, 600, 600, 600],
  lcommaaccent: [278, 278, 222, 222, 278, 278, 278, 278, 600, 600, 600, 600],
  tcaron: [389, 389, 317, 317, 416, 366, 300, 326, 600, 600, 600, 600],
  eogonek: [556, 556, 556, 556, 444, 444, 444, 444, 600, 600, 600, 600],
  Uogonek: [722, 722, 722, 722, 722, 722, 722, 722, 600, 600, 600, 600],
  Aacute: [722, 722, 667, 667, 722, 667, 611, 722, 600, 600, 600, 600],
  Adieresis: [722, 722, 667, 667, 722, 667, 611, 722, 600, 600, 600, 600],
  egrave: [556, 556, 556, 556, 444, 444, 444, 444, 600, 600, 600, 600],
  zacute: [500, 500, 500, 500, 444, 389, 389, 444, 600, 600, 600, 600],
  iogonek: [278, 278, 222, 222, 278, 278, 278, 278, 600, 600, 600, 600],
  Oacute: [778, 778, 778, 778, 778, 722, 722, 722, 600, 600, 600, 600],
  oacute: [611, 611, 556, 556, 500, 500, 500, 500, 600, 600, 600, 600],
  amacron: [556, 556, 556, 556, 500, 500, 500, 444, 600, 600, 600, 600],
  sacute: [556, 556, 500, 500, 389, 389, 389, 389, 600, 600, 600, 600],
  idieresis: [278, 278, 278, 278, 278, 278, 278, 278, 600, 600, 600, 600],
  Ocircumflex: [778, 778, 778, 778, 778, 722, 722, 722, 600, 600, 600, 600],
  Ugrave: [722, 722, 722, 722, 722, 722, 722, 722, 600, 600, 600, 600],
  Delta: [612, 612, 612, 612, 612, 612, 612, 612, 600, 600, 600, 600],
  thorn: [611, 611, 556, 556, 556, 500, 500, 500, 600, 600, 600, 600],
  twosuperior: [333, 333, 333, 333, 300, 300, 300, 300, 600, 600, 600, 600],
  Odieresis: [778, 778, 778, 778, 778, 722, 722, 722, 600, 600, 600, 600],
  mu: [611, 611, 556, 556, 556, 576, 500, 500, 600, 600, 600, 600],
  igrave: [278, 278, 278, 278, 278, 278, 278, 278, 600, 600, 600, 600],
  ohungarumlaut: [611, 611, 556, 556, 500, 500, 500, 500, 600, 600, 600, 600],
  Eogonek: [667, 667, 667, 667, 667, 667, 611, 611, 600, 600, 600, 600],
  dcroat: [611, 611, 556, 556, 556, 500, 500, 500, 600, 600, 600, 600],
  threequarters: [834, 834, 834, 834, 750, 750, 750, 750, 600, 600, 600, 600],
  Scedilla: [667, 667, 667, 667, 556, 556, 500, 556, 600, 600, 600, 600],
  lcaron: [400, 400, 299, 299, 394, 382, 300, 344, 600, 600, 600, 600],
  Kcommaaccent: [722, 722, 667, 667, 778, 667, 667, 722, 600, 600, 600, 600],
  Lacute: [611, 611, 556, 556, 667, 611, 556, 611, 600, 600, 600, 600],
  trademark: [1000, 1000, 1000, 1000, 1000, 1000, 980, 980, 600, 600, 600, 600],
  edotaccent: [556, 556, 556, 556, 444, 444, 444, 444, 600, 600, 600, 600],
  Igrave: [278, 278, 278, 278, 389, 389, 333, 333, 600, 600, 600, 600],
  Imacron: [278, 278, 278, 278, 389, 389, 333, 333, 600, 600, 600, 600],
  Lcaron: [611, 611, 556, 556, 667, 611, 611, 611, 600, 600, 600, 600],
  onehalf: [834, 834, 834, 834, 750, 750, 750, 750, 600, 600, 600, 600],
  lessequal: [549, 549, 549, 549, 549, 549, 549, 549, 600, 600, 600, 600],
  ocircumflex: [611, 611, 556, 556, 500, 500, 500, 500, 600, 600, 600, 600],
  ntilde: [611, 611, 556, 556, 556, 556, 500, 500, 600, 600, 600, 600],
  Uhungarumlaut: [722, 722, 722, 722, 722, 722, 722, 722, 600, 600, 600, 600],
  Eacute: [667, 667, 667, 667, 667, 667, 611, 611, 600, 600, 600, 600],
  emacron: [556, 556, 556, 556, 444, 444, 444, 444, 600, 600, 600, 600],
  gbreve: [611, 611, 556, 556, 500, 500, 500, 500, 600, 600, 600, 600],
  onequarter: [834, 834, 834, 834, 750, 750, 750, 750, 600, 600, 600, 600],
  Scaron: [667, 667, 667, 667, 556, 556, 500, 556, 600, 600, 600, 600],
  Scommaaccent: [667, 667, 667, 667, 556, 556, 500, 556, 600, 600, 600, 600],
  Ohungarumlaut: [778, 778, 778, 778, 778, 722, 722, 722, 600, 600, 600, 600],
  degree: [400, 400, 400, 400, 400, 400, 400, 400, 600, 600, 600, 600],
  ograve: [611, 611, 556, 556, 500, 500, 500, 500, 600, 600, 600, 600],
  Ccaron: [722, 722, 722, 722, 722, 667, 667, 667, 600, 600, 600, 600],
  ugrave: [611, 611, 556, 556, 556, 556, 500, 500, 600, 600, 600, 600],
  radical: [549, 549, 453, 453, 549, 549, 453, 453, 600, 600, 600, 600],
  Dcaron: [722, 722, 722, 722, 722, 722, 722, 722, 600, 600, 600, 600],
  rcommaaccent: [389, 389, 333, 333, 444, 389, 389, 333, 600, 600, 600, 600],
  Ntilde: [722, 722, 722, 722, 722, 722, 667, 722, 600, 600, 600, 600],
  otilde: [611, 611, 556, 556, 500, 500, 500, 500, 600, 600, 600, 600],
  Rcommaaccent: [722, 722, 722, 722, 722, 667, 611, 667, 600, 600, 600, 600],
  Lcommaaccent: [611, 611, 556, 556, 667, 611, 556, 611, 600, 600, 600, 600],
  Atilde: [722, 722, 667, 667, 722, 667, 611, 722, 600, 600, 600, 600],
  Aogonek: [722, 722, 667, 667, 722, 667, 611, 722, 600, 600, 600, 600],
  Aring: [722, 722, 667, 667, 722, 667, 611, 722, 600, 600, 600, 600],
  Otilde: [778, 778, 778, 778, 778, 722, 722, 722, 600, 600, 600, 600],
  zdotaccent: [500, 500, 500, 500, 444, 389, 389, 444, 600, 600, 600, 600],
  Ecaron: [667, 667, 667, 667, 667, 667, 611, 611, 600, 600, 600, 600],
  Iogonek: [278, 278, 278, 278, 389, 389, 333, 333, 600, 600, 600, 600],
  kcommaaccent: [556, 556, 500, 500, 556, 500, 444, 500, 600, 600, 600, 600],
  minus: [584, 584, 584, 584, 570, 606, 675, 564, 600, 600, 600, 600],
  Icircumflex: [278, 278, 278, 278, 389, 389, 333, 333, 600, 600, 600, 600],
  ncaron: [611, 611, 556, 556, 556, 556, 500, 500, 600, 600, 600, 600],
  tcommaaccent: [333, 333, 278, 278, 333, 278, 278, 278, 600, 600, 600, 600],
  logicalnot: [584, 584, 584, 584, 570, 606, 675, 564, 600, 600, 600, 600],
  odieresis: [611, 611, 556, 556, 500, 500, 500, 500, 600, 600, 600, 600],
  udieresis: [611, 611, 556, 556, 556, 556, 500, 500, 600, 600, 600, 600],
  notequal: [549, 549, 549, 549, 549, 549, 549, 549, 600, 600, 600, 600],
  gcommaaccent: [611, 611, 556, 556, 500, 500, 500, 500, 600, 600, 600, 600],
  eth: [611, 611, 556, 556, 500, 500, 500, 500, 600, 600, 600, 600],
  zcaron: [500, 500, 500, 500, 444, 389, 389, 444, 600, 600, 600, 600],
  ncommaaccent: [611, 611, 556, 556, 556, 556, 500, 500, 600, 600, 600, 600],
  onesuperior: [333, 333, 333, 333, 300, 300, 300, 300, 600, 600, 600, 600],
  imacron: [278, 278, 278, 278, 278, 278, 278, 278, 600, 600, 600, 600],
  Euro: [556, 556, 556, 556, 500, 500, 500, 500, 600, 600, 600, 600]
};
var kernPairs = {
  AC: [-40, -40, -30, -30, -55, -65, -30, -40],
  ACacute: [-40, -40, -30, -30, -55, -65, -30, -40],
  ACcaron: [-40, -40, -30, -30, -55, -65, -30, -40],
  ACcedilla: [-40, -40, -30, -30, -55, -65, -30, -40],
  AG: [-50, -50, -30, -30, -55, -60, -35, -40],
  AGbreve: [-50, -50, -30, -30, -55, -60, -35, -40],
  AGcommaaccent: [-50, -50, -30, -30, -55, -60, -35, -40],
  AO: [-40, -40, -30, -30, -45, -50, -40, -55],
  AOacute: [-40, -40, -30, -30, -45, -50, -40, -55],
  AOcircumflex: [-40, -40, -30, -30, -45, -50, -40, -55],
  AOdieresis: [-40, -40, -30, -30, -45, -50, -40, -55],
  AOgrave: [-40, -40, -30, -30, -45, -50, -40, -55],
  AOhungarumlaut: [-40, -40, -30, -30, -45, -50, -40, -55],
  AOmacron: [-40, -40, -30, -30, -45, -50, -40, -55],
  AOslash: [-40, -40, -30, -30, -45, -50, -40, -55],
  AOtilde: [-40, -40, -30, -30, -45, -50, -40, -55],
  AQ: [-40, -40, -30, -30, -45, -55, -40, -55],
  AT: [-90, -90, -120, -120, -95, -55, -37, -111],
  ATcaron: [-90, -90, -120, -120, -95, -55, -37, -111],
  ATcommaaccent: [-90, -90, -120, -120, -95, -55, -37, -111],
  AU: [-50, -50, -50, -50, -50, -50, -50, -55],
  AUacute: [-50, -50, -50, -50, -50, -50, -50, -55],
  AUcircumflex: [-50, -50, -50, -50, -50, -50, -50, -55],
  AUdieresis: [-50, -50, -50, -50, -50, -50, -50, -55],
  AUgrave: [-50, -50, -50, -50, -50, -50, -50, -55],
  AUhungarumlaut: [-50, -50, -50, -50, -50, -50, -50, -55],
  AUmacron: [-50, -50, -50, -50, -50, -50, -50, -55],
  AUogonek: [-50, -50, -50, -50, -50, -50, -50, -55],
  AUring: [-50, -50, -50, -50, -50, -50, -50, -55],
  AV: [-80, -80, -70, -70, -145, -95, -105, -135],
  AW: [-60, -60, -50, -50, -130, -100, -95, -90],
  AY: [-110, -110, -100, -100, -100, -70, -55, -105],
  AYacute: [-110, -110, -100, -100, -100, -70, -55, -105],
  AYdieresis: [-110, -110, -100, -100, -100, -70, -55, -105],
  Au: [-30, -30, -30, -30, -50, -30, -20],
  Auacute: [-30, -30, -30, -30, -50, -30, -20],
  Aucircumflex: [-30, -30, -30, -30, -50, -30, -20],
  Audieresis: [-30, -30, -30, -30, -50, -30, -20],
  Augrave: [-30, -30, -30, -30, -50, -30, -20],
  Auhungarumlaut: [-30, -30, -30, -30, -50, -30, -20],
  Aumacron: [-30, -30, -30, -30, -50, -30, -20],
  Auogonek: [-30, -30, -30, -30, -50, -30, -20],
  Auring: [-30, -30, -30, -30, -50, -30, -20],
  Av: [-40, -40, -40, -40, -100, -74, -55, -74],
  Aw: [-30, -30, -40, -40, -90, -74, -55, -92],
  Ay: [-30, -30, -40, -40, -74, -74, -55, -92],
  Ayacute: [-30, -30, -40, -40, -74, -74, -55, -92],
  Aydieresis: [-30, -30, -40, -40, -74, -74, -55, -92],
  AacuteC: [-40, -40, -30, -30, -55, -65, -30, -40],
  AacuteCacute: [-40, -40, -30, -30, -55, -65, -30, -40],
  AacuteCcaron: [-40, -40, -30, -30, -55, -65, -30, -40],
  AacuteCcedilla: [-40, -40, -30, -30, -55, -65, -30, -40],
  AacuteG: [-50, -50, -30, -30, -55, -60, -35, -40],
  AacuteGbreve: [-50, -50, -30, -30, -55, -60, -35, -40],
  AacuteGcommaaccent: [-50, -50, -30, -30, -55, -60, -35, -40],
  AacuteO: [-40, -40, -30, -30, -45, -50, -40, -55],
  AacuteOacute: [-40, -40, -30, -30, -45, -50, -40, -55],
  AacuteOcircumflex: [-40, -40, -30, -30, -45, -50, -40, -55],
  AacuteOdieresis: [-40, -40, -30, -30, -45, -50, -40, -55],
  AacuteOgrave: [-40, -40, -30, -30, -45, -50, -40, -55],
  AacuteOhungarumlaut: [-40, -40, -30, -30, -45, -50, -40, -55],
  AacuteOmacron: [-40, -40, -30, -30, -45, -50, -40, -55],
  AacuteOslash: [-40, -40, -30, -30, -45, -50, -40, -55],
  AacuteOtilde: [-40, -40, -30, -30, -45, -50, -40, -55],
  AacuteQ: [-40, -40, -30, -30, -45, -55, -40, -55],
  AacuteT: [-90, -90, -120, -120, -95, -55, -37, -111],
  AacuteTcaron: [-90, -90, -120, -120, -95, -55, -37, -111],
  AacuteTcommaaccent: [-90, -90, -120, -120, -95, -55, -37, -111],
  AacuteU: [-50, -50, -50, -50, -50, -50, -50, -55],
  AacuteUacute: [-50, -50, -50, -50, -50, -50, -50, -55],
  AacuteUcircumflex: [-50, -50, -50, -50, -50, -50, -50, -55],
  AacuteUdieresis: [-50, -50, -50, -50, -50, -50, -50, -55],
  AacuteUgrave: [-50, -50, -50, -50, -50, -50, -50, -55],
  AacuteUhungarumlaut: [-50, -50, -50, -50, -50, -50, -50, -55],
  AacuteUmacron: [-50, -50, -50, -50, -50, -50, -50, -55],
  AacuteUogonek: [-50, -50, -50, -50, -50, -50, -50, -55],
  AacuteUring: [-50, -50, -50, -50, -50, -50, -50, -55],
  AacuteV: [-80, -80, -70, -70, -145, -95, -105, -135],
  AacuteW: [-60, -60, -50, -50, -130, -100, -95, -90],
  AacuteY: [-110, -110, -100, -100, -100, -70, -55, -105],
  AacuteYacute: [-110, -110, -100, -100, -100, -70, -55, -105],
  AacuteYdieresis: [-110, -110, -100, -100, -100, -70, -55, -105],
  Aacuteu: [-30, -30, -30, -30, -50, -30, -20],
  Aacuteuacute: [-30, -30, -30, -30, -50, -30, -20],
  Aacuteucircumflex: [-30, -30, -30, -30, -50, -30, -20],
  Aacuteudieresis: [-30, -30, -30, -30, -50, -30, -20],
  Aacuteugrave: [-30, -30, -30, -30, -50, -30, -20],
  Aacuteuhungarumlaut: [-30, -30, -30, -30, -50, -30, -20],
  Aacuteumacron: [-30, -30, -30, -30, -50, -30, -20],
  Aacuteuogonek: [-30, -30, -30, -30, -50, -30, -20],
  Aacuteuring: [-30, -30, -30, -30, -50, -30, -20],
  Aacutev: [-40, -40, -40, -40, -100, -74, -55, -74],
  Aacutew: [-30, -30, -40, -40, -90, -74, -55, -92],
  Aacutey: [-30, -30, -40, -40, -74, -74, -55, -92],
  Aacuteyacute: [-30, -30, -40, -40, -74, -74, -55, -92],
  Aacuteydieresis: [-30, -30, -40, -40, -74, -74, -55, -92],
  AbreveC: [-40, -40, -30, -30, -55, -65, -30, -40],
  AbreveCacute: [-40, -40, -30, -30, -55, -65, -30, -40],
  AbreveCcaron: [-40, -40, -30, -30, -55, -65, -30, -40],
  AbreveCcedilla: [-40, -40, -30, -30, -55, -65, -30, -40],
  AbreveG: [-50, -50, -30, -30, -55, -60, -35, -40],
  AbreveGbreve: [-50, -50, -30, -30, -55, -60, -35, -40],
  AbreveGcommaaccent: [-50, -50, -30, -30, -55, -60, -35, -40],
  AbreveO: [-40, -40, -30, -30, -45, -50, -40, -55],
  AbreveOacute: [-40, -40, -30, -30, -45, -50, -40, -55],
  AbreveOcircumflex: [-40, -40, -30, -30, -45, -50, -40, -55],
  AbreveOdieresis: [-40, -40, -30, -30, -45, -50, -40, -55],
  AbreveOgrave: [-40, -40, -30, -30, -45, -50, -40, -55],
  AbreveOhungarumlaut: [-40, -40, -30, -30, -45, -50, -40, -55],
  AbreveOmacron: [-40, -40, -30, -30, -45, -50, -40, -55],
  AbreveOslash: [-40, -40, -30, -30, -45, -50, -40, -55],
  AbreveOtilde: [-40, -40, -30, -30, -45, -50, -40, -55],
  AbreveQ: [-40, -40, -30, -30, -45, -55, -40, -55],
  AbreveT: [-90, -90, -120, -120, -95, -55, -37, -111],
  AbreveTcaron: [-90, -90, -120, -120, -95, -55, -37, -111],
  AbreveTcommaaccent: [-90, -90, -120, -120, -95, -55, -37, -111],
  AbreveU: [-50, -50, -50, -50, -50, -50, -50, -55],
  AbreveUacute: [-50, -50, -50, -50, -50, -50, -50, -55],
  AbreveUcircumflex: [-50, -50, -50, -50, -50, -50, -50, -55],
  AbreveUdieresis: [-50, -50, -50, -50, -50, -50, -50, -55],
  AbreveUgrave: [-50, -50, -50, -50, -50, -50, -50, -55],
  AbreveUhungarumlaut: [-50, -50, -50, -50, -50, -50, -50, -55],
  AbreveUmacron: [-50, -50, -50, -50, -50, -50, -50, -55],
  AbreveUogonek: [-50, -50, -50, -50, -50, -50, -50, -55],
  AbreveUring: [-50, -50, -50, -50, -50, -50, -50, -55],
  AbreveV: [-80, -80, -70, -70, -145, -95, -105, -135],
  AbreveW: [-60, -60, -50, -50, -130, -100, -95, -90],
  AbreveY: [-110, -110, -100, -100, -100, -70, -55, -105],
  AbreveYacute: [-110, -110, -100, -100, -100, -70, -55, -105],
  AbreveYdieresis: [-110, -110, -100, -100, -100, -70, -55, -105],
  Abreveu: [-30, -30, -30, -30, -50, -30, -20],
  Abreveuacute: [-30, -30, -30, -30, -50, -30, -20],
  Abreveucircumflex: [-30, -30, -30, -30, -50, -30, -20],
  Abreveudieresis: [-30, -30, -30, -30, -50, -30, -20],
  Abreveugrave: [-30, -30, -30, -30, -50, -30, -20],
  Abreveuhungarumlaut: [-30, -30, -30, -30, -50, -30, -20],
  Abreveumacron: [-30, -30, -30, -30, -50, -30, -20],
  Abreveuogonek: [-30, -30, -30, -30, -50, -30, -20],
  Abreveuring: [-30, -30, -30, -30, -50, -30, -20],
  Abrevev: [-40, -40, -40, -40, -100, -74, -55, -74],
  Abrevew: [-30, -30, -40, -40, -90, -74, -55, -92],
  Abrevey: [-30, -30, -40, -40, -74, -74, -55, -92],
  Abreveyacute: [-30, -30, -40, -40, -74, -74, -55, -92],
  Abreveydieresis: [-30, -30, -40, -40, -74, -74, -55, -92],
  AcircumflexC: [-40, -40, -30, -30, -55, -65, -30, -40],
  AcircumflexCacute: [-40, -40, -30, -30, -55, -65, -30, -40],
  AcircumflexCcaron: [-40, -40, -30, -30, -55, -65, -30, -40],
  AcircumflexCcedilla: [-40, -40, -30, -30, -55, -65, -30, -40],
  AcircumflexG: [-50, -50, -30, -30, -55, -60, -35, -40],
  AcircumflexGbreve: [-50, -50, -30, -30, -55, -60, -35, -40],
  AcircumflexGcommaaccent: [-50, -50, -30, -30, -55, -60, -35, -40],
  AcircumflexO: [-40, -40, -30, -30, -45, -50, -40, -55],
  AcircumflexOacute: [-40, -40, -30, -30, -45, -50, -40, -55],
  AcircumflexOcircumflex: [-40, -40, -30, -30, -45, -50, -40, -55],
  AcircumflexOdieresis: [-40, -40, -30, -30, -45, -50, -40, -55],
  AcircumflexOgrave: [-40, -40, -30, -30, -45, -50, -40, -55],
  AcircumflexOhungarumlaut: [-40, -40, -30, -30, -45, -50, -40, -55],
  AcircumflexOmacron: [-40, -40, -30, -30, -45, -50, -40, -55],
  AcircumflexOslash: [-40, -40, -30, -30, -45, -50, -40, -55],
  AcircumflexOtilde: [-40, -40, -30, -30, -45, -50, -40, -55],
  AcircumflexQ: [-40, -40, -30, -30, -45, -55, -40, -55],
  AcircumflexT: [-90, -90, -120, -120, -95, -55, -37, -111],
  AcircumflexTcaron: [-90, -90, -120, -120, -95, -55, -37, -111],
  AcircumflexTcommaaccent: [-90, -90, -120, -120, -95, -55, -37, -111],
  AcircumflexU: [-50, -50, -50, -50, -50, -50, -50, -55],
  AcircumflexUacute: [-50, -50, -50, -50, -50, -50, -50, -55],
  AcircumflexUcircumflex: [-50, -50, -50, -50, -50, -50, -50, -55],
  AcircumflexUdieresis: [-50, -50, -50, -50, -50, -50, -50, -55],
  AcircumflexUgrave: [-50, -50, -50, -50, -50, -50, -50, -55],
  AcircumflexUhungarumlaut: [-50, -50, -50, -50, -50, -50, -50, -55],
  AcircumflexUmacron: [-50, -50, -50, -50, -50, -50, -50, -55],
  AcircumflexUogonek: [-50, -50, -50, -50, -50, -50, -50, -55],
  AcircumflexUring: [-50, -50, -50, -50, -50, -50, -50, -55],
  AcircumflexV: [-80, -80, -70, -70, -145, -95, -105, -135],
  AcircumflexW: [-60, -60, -50, -50, -130, -100, -95, -90],
  AcircumflexY: [-110, -110, -100, -100, -100, -70, -55, -105],
  AcircumflexYacute: [-110, -110, -100, -100, -100, -70, -55, -105],
  AcircumflexYdieresis: [-110, -110, -100, -100, -100, -70, -55, -105],
  Acircumflexu: [-30, -30, -30, -30, -50, -30, -20],
  Acircumflexuacute: [-30, -30, -30, -30, -50, -30, -20],
  Acircumflexucircumflex: [-30, -30, -30, -30, -50, -30, -20],
  Acircumflexudieresis: [-30, -30, -30, -30, -50, -30, -20],
  Acircumflexugrave: [-30, -30, -30, -30, -50, -30, -20],
  Acircumflexuhungarumlaut: [-30, -30, -30, -30, -50, -30, -20],
  Acircumflexumacron: [-30, -30, -30, -30, -50, -30, -20],
  Acircumflexuogonek: [-30, -30, -30, -30, -50, -30, -20],
  Acircumflexuring: [-30, -30, -30, -30, -50, -30, -20],
  Acircumflexv: [-40, -40, -40, -40, -100, -74, -55, -74],
  Acircumflexw: [-30, -30, -40, -40, -90, -74, -55, -92],
  Acircumflexy: [-30, -30, -40, -40, -74, -74, -55, -92],
  Acircumflexyacute: [-30, -30, -40, -40, -74, -74, -55, -92],
  Acircumflexydieresis: [-30, -30, -40, -40, -74, -74, -55, -92],
  AdieresisC: [-40, -40, -30, -30, -55, -65, -30, -40],
  AdieresisCacute: [-40, -40, -30, -30, -55, -65, -30, -40],
  AdieresisCcaron: [-40, -40, -30, -30, -55, -65, -30, -40],
  AdieresisCcedilla: [-40, -40, -30, -30, -55, -65, -30, -40],
  AdieresisG: [-50, -50, -30, -30, -55, -60, -35, -40],
  AdieresisGbreve: [-50, -50, -30, -30, -55, -60, -35, -40],
  AdieresisGcommaaccent: [-50, -50, -30, -30, -55, -60, -35, -40],
  AdieresisO: [-40, -40, -30, -30, -45, -50, -40, -55],
  AdieresisOacute: [-40, -40, -30, -30, -45, -50, -40, -55],
  AdieresisOcircumflex: [-40, -40, -30, -30, -45, -50, -40, -55],
  AdieresisOdieresis: [-40, -40, -30, -30, -45, -50, -40, -55],
  AdieresisOgrave: [-40, -40, -30, -30, -45, -50, -40, -55],
  AdieresisOhungarumlaut: [-40, -40, -30, -30, -45, -50, -40, -55],
  AdieresisOmacron: [-40, -40, -30, -30, -45, -50, -40, -55],
  AdieresisOslash: [-40, -40, -30, -30, -45, -50, -40, -55],
  AdieresisOtilde: [-40, -40, -30, -30, -45, -50, -40, -55],
  AdieresisQ: [-40, -40, -30, -30, -45, -55, -40, -55],
  AdieresisT: [-90, -90, -120, -120, -95, -55, -37, -111],
  AdieresisTcaron: [-90, -90, -120, -120, -95, -55, -37, -111],
  AdieresisTcommaaccent: [-90, -90, -120, -120, -95, -55, -37, -111],
  AdieresisU: [-50, -50, -50, -50, -50, -50, -50, -55],
  AdieresisUacute: [-50, -50, -50, -50, -50, -50, -50, -55],
  AdieresisUcircumflex: [-50, -50, -50, -50, -50, -50, -50, -55],
  AdieresisUdieresis: [-50, -50, -50, -50, -50, -50, -50, -55],
  AdieresisUgrave: [-50, -50, -50, -50, -50, -50, -50, -55],
  AdieresisUhungarumlaut: [-50, -50, -50, -50, -50, -50, -50, -55],
  AdieresisUmacron: [-50, -50, -50, -50, -50, -50, -50, -55],
  AdieresisUogonek: [-50, -50, -50, -50, -50, -50, -50, -55],
  AdieresisUring: [-50, -50, -50, -50, -50, -50, -50, -55],
  AdieresisV: [-80, -80, -70, -70, -145, -95, -105, -135],
  AdieresisW: [-60, -60, -50, -50, -130, -100, -95, -90],
  AdieresisY: [-110, -110, -100, -100, -100, -70, -55, -105],
  AdieresisYacute: [-110, -110, -100, -100, -100, -70, -55, -105],
  AdieresisYdieresis: [-110, -110, -100, -100, -100, -70, -55, -105],
  Adieresisu: [-30, -30, -30, -30, -50, -30, -20],
  Adieresisuacute: [-30, -30, -30, -30, -50, -30, -20],
  Adieresisucircumflex: [-30, -30, -30, -30, -50, -30, -20],
  Adieresisudieresis: [-30, -30, -30, -30, -50, -30, -20],
  Adieresisugrave: [-30, -30, -30, -30, -50, -30, -20],
  Adieresisuhungarumlaut: [-30, -30, -30, -30, -50, -30, -20],
  Adieresisumacron: [-30, -30, -30, -30, -50, -30, -20],
  Adieresisuogonek: [-30, -30, -30, -30, -50, -30, -20],
  Adieresisuring: [-30, -30, -30, -30, -50, -30, -20],
  Adieresisv: [-40, -40, -40, -40, -100, -74, -55, -74],
  Adieresisw: [-30, -30, -40, -40, -90, -74, -55, -92],
  Adieresisy: [-30, -30, -40, -40, -74, -74, -55, -92],
  Adieresisyacute: [-30, -30, -40, -40, -74, -74, -55, -92],
  Adieresisydieresis: [-30, -30, -40, -40, -74, -74, -55, -92],
  AgraveC: [-40, -40, -30, -30, -55, -65, -30, -40],
  AgraveCacute: [-40, -40, -30, -30, -55, -65, -30, -40],
  AgraveCcaron: [-40, -40, -30, -30, -55, -65, -30, -40],
  AgraveCcedilla: [-40, -40, -30, -30, -55, -65, -30, -40],
  AgraveG: [-50, -50, -30, -30, -55, -60, -35, -40],
  AgraveGbreve: [-50, -50, -30, -30, -55, -60, -35, -40],
  AgraveGcommaaccent: [-50, -50, -30, -30, -55, -60, -35, -40],
  AgraveO: [-40, -40, -30, -30, -45, -50, -40, -55],
  AgraveOacute: [-40, -40, -30, -30, -45, -50, -40, -55],
  AgraveOcircumflex: [-40, -40, -30, -30, -45, -50, -40, -55],
  AgraveOdieresis: [-40, -40, -30, -30, -45, -50, -40, -55],
  AgraveOgrave: [-40, -40, -30, -30, -45, -50, -40, -55],
  AgraveOhungarumlaut: [-40, -40, -30, -30, -45, -50, -40, -55],
  AgraveOmacron: [-40, -40, -30, -30, -45, -50, -40, -55],
  AgraveOslash: [-40, -40, -30, -30, -45, -50, -40, -55],
  AgraveOtilde: [-40, -40, -30, -30, -45, -50, -40, -55],
  AgraveQ: [-40, -40, -30, -30, -45, -55, -40, -55],
  AgraveT: [-90, -90, -120, -120, -95, -55, -37, -111],
  AgraveTcaron: [-90, -90, -120, -120, -95, -55, -37, -111],
  AgraveTcommaaccent: [-90, -90, -120, -120, -95, -55, -37, -111],
  AgraveU: [-50, -50, -50, -50, -50, -50, -50, -55],
  AgraveUacute: [-50, -50, -50, -50, -50, -50, -50, -55],
  AgraveUcircumflex: [-50, -50, -50, -50, -50, -50, -50, -55],
  AgraveUdieresis: [-50, -50, -50, -50, -50, -50, -50, -55],
  AgraveUgrave: [-50, -50, -50, -50, -50, -50, -50, -55],
  AgraveUhungarumlaut: [-50, -50, -50, -50, -50, -50, -50, -55],
  AgraveUmacron: [-50, -50, -50, -50, -50, -50, -50, -55],
  AgraveUogonek: [-50, -50, -50, -50, -50, -50, -50, -55],
  AgraveUring: [-50, -50, -50, -50, -50, -50, -50, -55],
  AgraveV: [-80, -80, -70, -70, -145, -95, -105, -135],
  AgraveW: [-60, -60, -50, -50, -130, -100, -95, -90],
  AgraveY: [-110, -110, -100, -100, -100, -70, -55, -105],
  AgraveYacute: [-110, -110, -100, -100, -100, -70, -55, -105],
  AgraveYdieresis: [-110, -110, -100, -100, -100, -70, -55, -105],
  Agraveu: [-30, -30, -30, -30, -50, -30, -20],
  Agraveuacute: [-30, -30, -30, -30, -50, -30, -20],
  Agraveucircumflex: [-30, -30, -30, -30, -50, -30, -20],
  Agraveudieresis: [-30, -30, -30, -30, -50, -30, -20],
  Agraveugrave: [-30, -30, -30, -30, -50, -30, -20],
  Agraveuhungarumlaut: [-30, -30, -30, -30, -50, -30, -20],
  Agraveumacron: [-30, -30, -30, -30, -50, -30, -20],
  Agraveuogonek: [-30, -30, -30, -30, -50, -30, -20],
  Agraveuring: [-30, -30, -30, -30, -50, -30, -20],
  Agravev: [-40, -40, -40, -40, -100, -74, -55, -74],
  Agravew: [-30, -30, -40, -40, -90, -74, -55, -92],
  Agravey: [-30, -30, -40, -40, -74, -74, -55, -92],
  Agraveyacute: [-30, -30, -40, -40, -74, -74, -55, -92],
  Agraveydieresis: [-30, -30, -40, -40, -74, -74, -55, -92],
  AmacronC: [-40, -40, -30, -30, -55, -65, -30, -40],
  AmacronCacute: [-40, -40, -30, -30, -55, -65, -30, -40],
  AmacronCcaron: [-40, -40, -30, -30, -55, -65, -30, -40],
  AmacronCcedilla: [-40, -40, -30, -30, -55, -65, -30, -40],
  AmacronG: [-50, -50, -30, -30, -55, -60, -35, -40],
  AmacronGbreve: [-50, -50, -30, -30, -55, -60, -35, -40],
  AmacronGcommaaccent: [-50, -50, -30, -30, -55, -60, -35, -40],
  AmacronO: [-40, -40, -30, -30, -45, -50, -40, -55],
  AmacronOacute: [-40, -40, -30, -30, -45, -50, -40, -55],
  AmacronOcircumflex: [-40, -40, -30, -30, -45, -50, -40, -55],
  AmacronOdieresis: [-40, -40, -30, -30, -45, -50, -40, -55],
  AmacronOgrave: [-40, -40, -30, -30, -45, -50, -40, -55],
  AmacronOhungarumlaut: [-40, -40, -30, -30, -45, -50, -40, -55],
  AmacronOmacron: [-40, -40, -30, -30, -45, -50, -40, -55],
  AmacronOslash: [-40, -40, -30, -30, -45, -50, -40, -55],
  AmacronOtilde: [-40, -40, -30, -30, -45, -50, -40, -55],
  AmacronQ: [-40, -40, -30, -30, -45, -55, -40, -55],
  AmacronT: [-90, -90, -120, -120, -95, -55, -37, -111],
  AmacronTcaron: [-90, -90, -120, -120, -95, -55, -37, -111],
  AmacronTcommaaccent: [-90, -90, -120, -120, -95, -55, -37, -111],
  AmacronU: [-50, -50, -50, -50, -50, -50, -50, -55],
  AmacronUacute: [-50, -50, -50, -50, -50, -50, -50, -55],
  AmacronUcircumflex: [-50, -50, -50, -50, -50, -50, -50, -55],
  AmacronUdieresis: [-50, -50, -50, -50, -50, -50, -50, -55],
  AmacronUgrave: [-50, -50, -50, -50, -50, -50, -50, -55],
  AmacronUhungarumlaut: [-50, -50, -50, -50, -50, -50, -50, -55],
  AmacronUmacron: [-50, -50, -50, -50, -50, -50, -50, -55],
  AmacronUogonek: [-50, -50, -50, -50, -50, -50, -50, -55],
  AmacronUring: [-50, -50, -50, -50, -50, -50, -50, -55],
  AmacronV: [-80, -80, -70, -70, -145, -95, -105, -135],
  AmacronW: [-60, -60, -50, -50, -130, -100, -95, -90],
  AmacronY: [-110, -110, -100, -100, -100, -70, -55, -105],
  AmacronYacute: [-110, -110, -100, -100, -100, -70, -55, -105],
  AmacronYdieresis: [-110, -110, -100, -100, -100, -70, -55, -105],
  Amacronu: [-30, -30, -30, -30, -50, -30, -20],
  Amacronuacute: [-30, -30, -30, -30, -50, -30, -20],
  Amacronucircumflex: [-30, -30, -30, -30, -50, -30, -20],
  Amacronudieresis: [-30, -30, -30, -30, -50, -30, -20],
  Amacronugrave: [-30, -30, -30, -30, -50, -30, -20],
  Amacronuhungarumlaut: [-30, -30, -30, -30, -50, -30, -20],
  Amacronumacron: [-30, -30, -30, -30, -50, -30, -20],
  Amacronuogonek: [-30, -30, -30, -30, -50, -30, -20],
  Amacronuring: [-30, -30, -30, -30, -50, -30, -20],
  Amacronv: [-40, -40, -40, -40, -100, -74, -55, -74],
  Amacronw: [-30, -30, -40, -40, -90, -74, -55, -92],
  Amacrony: [-30, -30, -40, -40, -74, -74, -55, -92],
  Amacronyacute: [-30, -30, -40, -40, -74, -74, -55, -92],
  Amacronydieresis: [-30, -30, -40, -40, -74, -74, -55, -92],
  AogonekC: [-40, -40, -30, -30, -55, -65, -30, -40],
  AogonekCacute: [-40, -40, -30, -30, -55, -65, -30, -40],
  AogonekCcaron: [-40, -40, -30, -30, -55, -65, -30, -40],
  AogonekCcedilla: [-40, -40, -30, -30, -55, -65, -30, -40],
  AogonekG: [-50, -50, -30, -30, -55, -60, -35, -40],
  AogonekGbreve: [-50, -50, -30, -30, -55, -60, -35, -40],
  AogonekGcommaaccent: [-50, -50, -30, -30, -55, -60, -35, -40],
  AogonekO: [-40, -40, -30, -30, -45, -50, -40, -55],
  AogonekOacute: [-40, -40, -30, -30, -45, -50, -40, -55],
  AogonekOcircumflex: [-40, -40, -30, -30, -45, -50, -40, -55],
  AogonekOdieresis: [-40, -40, -30, -30, -45, -50, -40, -55],
  AogonekOgrave: [-40, -40, -30, -30, -45, -50, -40, -55],
  AogonekOhungarumlaut: [-40, -40, -30, -30, -45, -50, -40, -55],
  AogonekOmacron: [-40, -40, -30, -30, -45, -50, -40, -55],
  AogonekOslash: [-40, -40, -30, -30, -45, -50, -40, -55],
  AogonekOtilde: [-40, -40, -30, -30, -45, -50, -40, -55],
  AogonekQ: [-40, -40, -30, -30, -45, -55, -40, -55],
  AogonekT: [-90, -90, -120, -120, -95, -55, -37, -111],
  AogonekTcaron: [-90, -90, -120, -120, -95, -55, -37, -111],
  AogonekTcommaaccent: [-90, -90, -120, -120, -95, -55, -37, -111],
  AogonekU: [-50, -50, -50, -50, -50, -50, -50, -55],
  AogonekUacute: [-50, -50, -50, -50, -50, -50, -50, -55],
  AogonekUcircumflex: [-50, -50, -50, -50, -50, -50, -50, -55],
  AogonekUdieresis: [-50, -50, -50, -50, -50, -50, -50, -55],
  AogonekUgrave: [-50, -50, -50, -50, -50, -50, -50, -55],
  AogonekUhungarumlaut: [-50, -50, -50, -50, -50, -50, -50, -55],
  AogonekUmacron: [-50, -50, -50, -50, -50, -50, -50, -55],
  AogonekUogonek: [-50, -50, -50, -50, -50, -50, -50, -55],
  AogonekUring: [-50, -50, -50, -50, -50, -50, -50, -55],
  AogonekV: [-80, -80, -70, -70, -145, -95, -105, -135],
  AogonekW: [-60, -60, -50, -50, -130, -100, -95, -90],
  AogonekY: [-110, -110, -100, -100, -100, -70, -55, -105],
  AogonekYacute: [-110, -110, -100, -100, -100, -70, -55, -105],
  AogonekYdieresis: [-110, -110, -100, -100, -100, -70, -55, -105],
  Aogoneku: [-30, -30, -30, -30, -50, -30, -20],
  Aogonekuacute: [-30, -30, -30, -30, -50, -30, -20],
  Aogonekucircumflex: [-30, -30, -30, -30, -50, -30, -20],
  Aogonekudieresis: [-30, -30, -30, -30, -50, -30, -20],
  Aogonekugrave: [-30, -30, -30, -30, -50, -30, -20],
  Aogonekuhungarumlaut: [-30, -30, -30, -30, -50, -30, -20],
  Aogonekumacron: [-30, -30, -30, -30, -50, -30, -20],
  Aogonekuogonek: [-30, -30, -30, -30, -50, -30, -20],
  Aogonekuring: [-30, -30, -30, -30, -50, -30, -20],
  Aogonekv: [-40, -40, -40, -40, -100, -74, -55, -74],
  Aogonekw: [-30, -30, -40, -40, -90, -74, -55, -52],
  Aogoneky: [-30, -30, -40, -40, -34, -34, -55, -52],
  Aogonekyacute: [-30, -30, -40, -40, -34, -34, -55, -52],
  Aogonekydieresis: [-30, -30, -40, -40, -34, -34, -55, -52],
  AringC: [-40, -40, -30, -30, -55, -65, -30, -40],
  AringCacute: [-40, -40, -30, -30, -55, -65, -30, -40],
  AringCcaron: [-40, -40, -30, -30, -55, -65, -30, -40],
  AringCcedilla: [-40, -40, -30, -30, -55, -65, -30, -40],
  AringG: [-50, -50, -30, -30, -55, -60, -35, -40],
  AringGbreve: [-50, -50, -30, -30, -55, -60, -35, -40],
  AringGcommaaccent: [-50, -50, -30, -30, -55, -60, -35, -40],
  AringO: [-40, -40, -30, -30, -45, -50, -40, -55],
  AringOacute: [-40, -40, -30, -30, -45, -50, -40, -55],
  AringOcircumflex: [-40, -40, -30, -30, -45, -50, -40, -55],
  AringOdieresis: [-40, -40, -30, -30, -45, -50, -40, -55],
  AringOgrave: [-40, -40, -30, -30, -45, -50, -40, -55],
  AringOhungarumlaut: [-40, -40, -30, -30, -45, -50, -40, -55],
  AringOmacron: [-40, -40, -30, -30, -45, -50, -40, -55],
  AringOslash: [-40, -40, -30, -30, -45, -50, -40, -55],
  AringOtilde: [-40, -40, -30, -30, -45, -50, -40, -55],
  AringQ: [-40, -40, -30, -30, -45, -55, -40, -55],
  AringT: [-90, -90, -120, -120, -95, -55, -37, -111],
  AringTcaron: [-90, -90, -120, -120, -95, -55, -37, -111],
  AringTcommaaccent: [-90, -90, -120, -120, -95, -55, -37, -111],
  AringU: [-50, -50, -50, -50, -50, -50, -50, -55],
  AringUacute: [-50, -50, -50, -50, -50, -50, -50, -55],
  AringUcircumflex: [-50, -50, -50, -50, -50, -50, -50, -55],
  AringUdieresis: [-50, -50, -50, -50, -50, -50, -50, -55],
  AringUgrave: [-50, -50, -50, -50, -50, -50, -50, -55],
  AringUhungarumlaut: [-50, -50, -50, -50, -50, -50, -50, -55],
  AringUmacron: [-50, -50, -50, -50, -50, -50, -50, -55],
  AringUogonek: [-50, -50, -50, -50, -50, -50, -50, -55],
  AringUring: [-50, -50, -50, -50, -50, -50, -50, -55],
  AringV: [-80, -80, -70, -70, -145, -95, -105, -135],
  AringW: [-60, -60, -50, -50, -130, -100, -95, -90],
  AringY: [-110, -110, -100, -100, -100, -70, -55, -105],
  AringYacute: [-110, -110, -100, -100, -100, -70, -55, -105],
  AringYdieresis: [-110, -110, -100, -100, -100, -70, -55, -105],
  Aringu: [-30, -30, -30, -30, -50, -30, -20],
  Aringuacute: [-30, -30, -30, -30, -50, -30, -20],
  Aringucircumflex: [-30, -30, -30, -30, -50, -30, -20],
  Aringudieresis: [-30, -30, -30, -30, -50, -30, -20],
  Aringugrave: [-30, -30, -30, -30, -50, -30, -20],
  Aringuhungarumlaut: [-30, -30, -30, -30, -50, -30, -20],
  Aringumacron: [-30, -30, -30, -30, -50, -30, -20],
  Aringuogonek: [-30, -30, -30, -30, -50, -30, -20],
  Aringuring: [-30, -30, -30, -30, -50, -30, -20],
  Aringv: [-40, -40, -40, -40, -100, -74, -55, -74],
  Aringw: [-30, -30, -40, -40, -90, -74, -55, -92],
  Aringy: [-30, -30, -40, -40, -74, -74, -55, -92],
  Aringyacute: [-30, -30, -40, -40, -74, -74, -55, -92],
  Aringydieresis: [-30, -30, -40, -40, -74, -74, -55, -92],
  AtildeC: [-40, -40, -30, -30, -55, -65, -30, -40],
  AtildeCacute: [-40, -40, -30, -30, -55, -65, -30, -40],
  AtildeCcaron: [-40, -40, -30, -30, -55, -65, -30, -40],
  AtildeCcedilla: [-40, -40, -30, -30, -55, -65, -30, -40],
  AtildeG: [-50, -50, -30, -30, -55, -60, -35, -40],
  AtildeGbreve: [-50, -50, -30, -30, -55, -60, -35, -40],
  AtildeGcommaaccent: [-50, -50, -30, -30, -55, -60, -35, -40],
  AtildeO: [-40, -40, -30, -30, -45, -50, -40, -55],
  AtildeOacute: [-40, -40, -30, -30, -45, -50, -40, -55],
  AtildeOcircumflex: [-40, -40, -30, -30, -45, -50, -40, -55],
  AtildeOdieresis: [-40, -40, -30, -30, -45, -50, -40, -55],
  AtildeOgrave: [-40, -40, -30, -30, -45, -50, -40, -55],
  AtildeOhungarumlaut: [-40, -40, -30, -30, -45, -50, -40, -55],
  AtildeOmacron: [-40, -40, -30, -30, -45, -50, -40, -55],
  AtildeOslash: [-40, -40, -30, -30, -45, -50, -40, -55],
  AtildeOtilde: [-40, -40, -30, -30, -45, -50, -40, -55],
  AtildeQ: [-40, -40, -30, -30, -45, -55, -40, -55],
  AtildeT: [-90, -90, -120, -120, -95, -55, -37, -111],
  AtildeTcaron: [-90, -90, -120, -120, -95, -55, -37, -111],
  AtildeTcommaaccent: [-90, -90, -120, -120, -95, -55, -37, -111],
  AtildeU: [-50, -50, -50, -50, -50, -50, -50, -55],
  AtildeUacute: [-50, -50, -50, -50, -50, -50, -50, -55],
  AtildeUcircumflex: [-50, -50, -50, -50, -50, -50, -50, -55],
  AtildeUdieresis: [-50, -50, -50, -50, -50, -50, -50, -55],
  AtildeUgrave: [-50, -50, -50, -50, -50, -50, -50, -55],
  AtildeUhungarumlaut: [-50, -50, -50, -50, -50, -50, -50, -55],
  AtildeUmacron: [-50, -50, -50, -50, -50, -50, -50, -55],
  AtildeUogonek: [-50, -50, -50, -50, -50, -50, -50, -55],
  AtildeUring: [-50, -50, -50, -50, -50, -50, -50, -55],
  AtildeV: [-80, -80, -70, -70, -145, -95, -105, -135],
  AtildeW: [-60, -60, -50, -50, -130, -100, -95, -90],
  AtildeY: [-110, -110, -100, -100, -100, -70, -55, -105],
  AtildeYacute: [-110, -110, -100, -100, -100, -70, -55, -105],
  AtildeYdieresis: [-110, -110, -100, -100, -100, -70, -55, -105],
  Atildeu: [-30, -30, -30, -30, -50, -30, -20],
  Atildeuacute: [-30, -30, -30, -30, -50, -30, -20],
  Atildeucircumflex: [-30, -30, -30, -30, -50, -30, -20],
  Atildeudieresis: [-30, -30, -30, -30, -50, -30, -20],
  Atildeugrave: [-30, -30, -30, -30, -50, -30, -20],
  Atildeuhungarumlaut: [-30, -30, -30, -30, -50, -30, -20],
  Atildeumacron: [-30, -30, -30, -30, -50, -30, -20],
  Atildeuogonek: [-30, -30, -30, -30, -50, -30, -20],
  Atildeuring: [-30, -30, -30, -30, -50, -30, -20],
  Atildev: [-40, -40, -40, -40, -100, -74, -55, -74],
  Atildew: [-30, -30, -40, -40, -90, -74, -55, -92],
  Atildey: [-30, -30, -40, -40, -74, -74, -55, -92],
  Atildeyacute: [-30, -30, -40, -40, -74, -74, -55, -92],
  Atildeydieresis: [-30, -30, -40, -40, -74, -74, -55, -92],
  BA: [-30, -30, 0, 0, -30, -25, -25, -35],
  BAacute: [-30, -30, 0, 0, -30, -25, -25, -35],
  BAbreve: [-30, -30, 0, 0, -30, -25, -25, -35],
  BAcircumflex: [-30, -30, 0, 0, -30, -25, -25, -35],
  BAdieresis: [-30, -30, 0, 0, -30, -25, -25, -35],
  BAgrave: [-30, -30, 0, 0, -30, -25, -25, -35],
  BAmacron: [-30, -30, 0, 0, -30, -25, -25, -35],
  BAogonek: [-30, -30, 0, 0, -30, -25, -25, -35],
  BAring: [-30, -30, 0, 0, -30, -25, -25, -35],
  BAtilde: [-30, -30, 0, 0, -30, -25, -25, -35],
  BU: [-10, -10, -10, -10, -10, -10, -10, -10],
  BUacute: [-10, -10, -10, -10, -10, -10, -10, -10],
  BUcircumflex: [-10, -10, -10, -10, -10, -10, -10, -10],
  BUdieresis: [-10, -10, -10, -10, -10, -10, -10, -10],
  BUgrave: [-10, -10, -10, -10, -10, -10, -10, -10],
  BUhungarumlaut: [-10, -10, -10, -10, -10, -10, -10, -10],
  BUmacron: [-10, -10, -10, -10, -10, -10, -10, -10],
  BUogonek: [-10, -10, -10, -10, -10, -10, -10, -10],
  BUring: [-10, -10, -10, -10, -10, -10, -10, -10],
  DA: [-40, -40, -40, -40, -35, -25, -35, -40],
  DAacute: [-40, -40, -40, -40, -35, -25, -35, -40],
  DAbreve: [-40, -40, -40, -40, -35, -25, -35, -40],
  DAcircumflex: [-40, -40, -40, -40, -35, -25, -35, -40],
  DAdieresis: [-40, -40, -40, -40, -35, -25, -35, -40],
  DAgrave: [-40, -40, -40, -40, -35, -25, -35, -40],
  DAmacron: [-40, -40, -40, -40, -35, -25, -35, -40],
  DAogonek: [-40, -40, -40, -40, -35, -25, -35, -40],
  DAring: [-40, -40, -40, -40, -35, -25, -35, -40],
  DAtilde: [-40, -40, -40, -40, -35, -25, -35, -40],
  DV: [-40, -40, -70, -70, -40, -50, -40, -40],
  DW: [-40, -40, -40, -40, -40, -40, -40, -30],
  DY: [-70, -70, -90, -90, -40, -50, -40, -55],
  DYacute: [-70, -70, -90, -90, -40, -50, -40, -55],
  DYdieresis: [-70, -70, -90, -90, -40, -50, -40, -55],
  Dcomma: [-30, -30, -70, -70],
  Dperiod: [-30, -30, -70, -70, -20],
  DcaronA: [-40, -40, -40, -40, -35, -25, -35, -40],
  DcaronAacute: [-40, -40, -40, -40, -35, -25, -35, -40],
  DcaronAbreve: [-40, -40, -40, -40, -35, -25, -35, -40],
  DcaronAcircumflex: [-40, -40, -40, -40, -35, -25, -35, -40],
  DcaronAdieresis: [-40, -40, -40, -40, -35, -25, -35, -40],
  DcaronAgrave: [-40, -40, -40, -40, -35, -25, -35, -40],
  DcaronAmacron: [-40, -40, -40, -40, -35, -25, -35, -40],
  DcaronAogonek: [-40, -40, -40, -40, -35, -25, -35, -40],
  DcaronAring: [-40, -40, -40, -40, -35, -25, -35, -40],
  DcaronAtilde: [-40, -40, -40, -40, -35, -25, -35, -40],
  DcaronV: [-40, -40, -70, -70, -40, -50, -40, -40],
  DcaronW: [-40, -40, -40, -40, -40, -40, -40, -30],
  DcaronY: [-70, -70, -90, -90, -40, -50, -40, -55],
  DcaronYacute: [-70, -70, -90, -90, -40, -50, -40, -55],
  DcaronYdieresis: [-70, -70, -90, -90, -40, -50, -40, -55],
  Dcaroncomma: [-30, -30, -70, -70],
  Dcaronperiod: [-30, -30, -70, -70, -20],
  DcroatA: [-40, -40, -40, -40, -35, -25, -35, -40],
  DcroatAacute: [-40, -40, -40, -40, -35, -25, -35, -40],
  DcroatAbreve: [-40, -40, -40, -40, -35, -25, -35, -40],
  DcroatAcircumflex: [-40, -40, -40, -40, -35, -25, -35, -40],
  DcroatAdieresis: [-40, -40, -40, -40, -35, -25, -35, -40],
  DcroatAgrave: [-40, -40, -40, -40, -35, -25, -35, -40],
  DcroatAmacron: [-40, -40, -40, -40, -35, -25, -35, -40],
  DcroatAogonek: [-40, -40, -40, -40, -35, -25, -35, -40],
  DcroatAring: [-40, -40, -40, -40, -35, -25, -35, -40],
  DcroatAtilde: [-40, -40, -40, -40, -35, -25, -35, -40],
  DcroatV: [-40, -40, -70, -70, -40, -50, -40, -40],
  DcroatW: [-40, -40, -40, -40, -40, -40, -40, -30],
  DcroatY: [-70, -70, -90, -90, -40, -50, -40, -55],
  DcroatYacute: [-70, -70, -90, -90, -40, -50, -40, -55],
  DcroatYdieresis: [-70, -70, -90, -90, -40, -50, -40, -55],
  Dcroatcomma: [-30, -30, -70, -70],
  Dcroatperiod: [-30, -30, -70, -70, -20],
  FA: [-80, -80, -80, -80, -90, -100, -115, -74],
  FAacute: [-80, -80, -80, -80, -90, -100, -115, -74],
  FAbreve: [-80, -80, -80, -80, -90, -100, -115, -74],
  FAcircumflex: [-80, -80, -80, -80, -90, -100, -115, -74],
  FAdieresis: [-80, -80, -80, -80, -90, -100, -115, -74],
  FAgrave: [-80, -80, -80, -80, -90, -100, -115, -74],
  FAmacron: [-80, -80, -80, -80, -90, -100, -115, -74],
  FAogonek: [-80, -80, -80, -80, -90, -100, -115, -74],
  FAring: [-80, -80, -80, -80, -90, -100, -115, -74],
  FAtilde: [-80, -80, -80, -80, -90, -100, -115, -74],
  Fa: [-20, -20, -50, -50, -25, -95, -75, -15],
  Faacute: [-20, -20, -50, -50, -25, -95, -75, -15],
  Fabreve: [-20, -20, -50, -50, -25, -95, -75, -15],
  Facircumflex: [-20, -20, -50, -50, -25, -95, -75, -15],
  Fadieresis: [-20, -20, -50, -50, -25, -95, -75, -15],
  Fagrave: [-20, -20, -50, -50, -25, -95, -75, -15],
  Famacron: [-20, -20, -50, -50, -25, -95, -75, -15],
  Faogonek: [-20, -20, -50, -50, -25, -95, -75, -15],
  Faring: [-20, -20, -50, -50, -25, -95, -75, -15],
  Fatilde: [-20, -20, -50, -50, -25, -95, -75, -15],
  Fcomma: [-100, -100, -150, -150, -92, -129, -135, -80],
  Fperiod: [-100, -100, -150, -150, -110, -129, -135, -80],
  JA: [-20, -20, -20, -20, -30, -25, -40, -60],
  JAacute: [-20, -20, -20, -20, -30, -25, -40, -60],
  JAbreve: [-20, -20, -20, -20, -30, -25, -40, -60],
  JAcircumflex: [-20, -20, -20, -20, -30, -25, -40, -60],
  JAdieresis: [-20, -20, -20, -20, -30, -25, -40, -60],
  JAgrave: [-20, -20, -20, -20, -30, -25, -40, -60],
  JAmacron: [-20, -20, -20, -20, -30, -25, -40, -60],
  JAogonek: [-20, -20, -20, -20, -30, -25, -40, -60],
  JAring: [-20, -20, -20, -20, -30, -25, -40, -60],
  JAtilde: [-20, -20, -20, -20, -30, -25, -40, -60],
  Jcomma: [-20, -20, -30, -30, 0, -10, -25],
  Jperiod: [-20, -20, -30, -30, -20, -10, -25],
  Ju: [-20, -20, -20, -20, -15, -40, -35],
  Juacute: [-20, -20, -20, -20, -15, -40, -35],
  Jucircumflex: [-20, -20, -20, -20, -15, -40, -35],
  Judieresis: [-20, -20, -20, -20, -15, -40, -35],
  Jugrave: [-20, -20, -20, -20, -15, -40, -35],
  Juhungarumlaut: [-20, -20, -20, -20, -15, -40, -35],
  Jumacron: [-20, -20, -20, -20, -15, -40, -35],
  Juogonek: [-20, -20, -20, -20, -15, -40, -35],
  Juring: [-20, -20, -20, -20, -15, -40, -35],
  KO: [-30, -30, -50, -50, -30, -30, -50, -30],
  KOacute: [-30, -30, -50, -50, -30, -30, -50, -30],
  KOcircumflex: [-30, -30, -50, -50, -30, -30, -50, -30],
  KOdieresis: [-30, -30, -50, -50, -30, -30, -50, -30],
  KOgrave: [-30, -30, -50, -50, -30, -30, -50, -30],
  KOhungarumlaut: [-30, -30, -50, -50, -30, -30, -50, -30],
  KOmacron: [-30, -30, -50, -50, -30, -30, -50, -30],
  KOslash: [-30, -30, -50, -50, -30, -30, -50, -30],
  KOtilde: [-30, -30, -50, -50, -30, -30, -50, -30],
  Ke: [-15, -15, -40, -40, -25, -25, -35, -25],
  Keacute: [-15, -15, -40, -40, -25, -25, -35, -25],
  Kecaron: [-15, -15, -40, -40, -25, -25, -35, -25],
  Kecircumflex: [-15, -15, -40, -40, -25, -25, -35, -25],
  Kedieresis: [-15, -15, -40, -40, -25, -25, -35, -25],
  Kedotaccent: [-15, -15, -40, -40, -25, -25, -35, -25],
  Kegrave: [-15, -15, -40, -40, -25, -25, -35, -25],
  Kemacron: [-15, -15, -40, -40, -25, -25, -35, -25],
  Keogonek: [-15, -15, -40, -40, -25, -25, -35, -25],
  Ko: [-35, -35, -40, -40, -25, -25, -40, -35],
  Koacute: [-35, -35, -40, -40, -25, -25, -40, -35],
  Kocircumflex: [-35, -35, -40, -40, -25, -25, -40, -35],
  Kodieresis: [-35, -35, -40, -40, -25, -25, -40, -35],
  Kograve: [-35, -35, -40, -40, -25, -25, -40, -35],
  Kohungarumlaut: [-35, -35, -40, -40, -25, -25, -40, -35],
  Komacron: [-35, -35, -40, -40, -25, -25, -40, -35],
  Koslash: [-35, -35, -40, -40, -25, -25, -40, -35],
  Kotilde: [-35, -35, -40, -40, -25, -25, -40, -35],
  Ku: [-30, -30, -30, -30, -15, -20, -40, -15],
  Kuacute: [-30, -30, -30, -30, -15, -20, -40, -15],
  Kucircumflex: [-30, -30, -30, -30, -15, -20, -40, -15],
  Kudieresis: [-30, -30, -30, -30, -15, -20, -40, -15],
  Kugrave: [-30, -30, -30, -30, -15, -20, -40, -15],
  Kuhungarumlaut: [-30, -30, -30, -30, -15, -20, -40, -15],
  Kumacron: [-30, -30, -30, -30, -15, -20, -40, -15],
  Kuogonek: [-30, -30, -30, -30, -15, -20, -40, -15],
  Kuring: [-30, -30, -30, -30, -15, -20, -40, -15],
  Ky: [-40, -40, -50, -50, -45, -20, -40, -25],
  Kyacute: [-40, -40, -50, -50, -45, -20, -40, -25],
  Kydieresis: [-40, -40, -50, -50, -45, -20, -40, -25],
  KcommaaccentO: [-30, -30, -50, -50, -30, -30, -50, -30],
  KcommaaccentOacute: [-30, -30, -50, -50, -30, -30, -50, -30],
  KcommaaccentOcircumflex: [-30, -30, -50, -50, -30, -30, -50, -30],
  KcommaaccentOdieresis: [-30, -30, -50, -50, -30, -30, -50, -30],
  KcommaaccentOgrave: [-30, -30, -50, -50, -30, -30, -50, -30],
  KcommaaccentOhungarumlaut: [-30, -30, -50, -50, -30, -30, -50, -30],
  KcommaaccentOmacron: [-30, -30, -50, -50, -30, -30, -50, -30],
  KcommaaccentOslash: [-30, -30, -50, -50, -30, -30, -50, -30],
  KcommaaccentOtilde: [-30, -30, -50, -50, -30, -30, -50, -30],
  Kcommaaccente: [-15, -15, -40, -40, -25, -25, -35, -25],
  Kcommaaccenteacute: [-15, -15, -40, -40, -25, -25, -35, -25],
  Kcommaaccentecaron: [-15, -15, -40, -40, -25, -25, -35, -25],
  Kcommaaccentecircumflex: [-15, -15, -40, -40, -25, -25, -35, -25],
  Kcommaaccentedieresis: [-15, -15, -40, -40, -25, -25, -35, -25],
  Kcommaaccentedotaccent: [-15, -15, -40, -40, -25, -25, -35, -25],
  Kcommaaccentegrave: [-15, -15, -40, -40, -25, -25, -35, -25],
  Kcommaaccentemacron: [-15, -15, -40, -40, -25, -25, -35, -25],
  Kcommaaccenteogonek: [-15, -15, -40, -40, -25, -25, -35, -25],
  Kcommaaccento: [-35, -35, -40, -40, -25, -25, -40, -35],
  Kcommaaccentoacute: [-35, -35, -40, -40, -25, -25, -40, -35],
  Kcommaaccentocircumflex: [-35, -35, -40, -40, -25, -25, -40, -35],
  Kcommaaccentodieresis: [-35, -35, -40, -40, -25, -25, -40, -35],
  Kcommaaccentograve: [-35, -35, -40, -40, -25, -25, -40, -35],
  Kcommaaccentohungarumlaut: [-35, -35, -40, -40, -25, -25, -40, -35],
  Kcommaaccentomacron: [-35, -35, -40, -40, -25, -25, -40, -35],
  Kcommaaccentoslash: [-35, -35, -40, -40, -25, -25, -40, -35],
  Kcommaaccentotilde: [-35, -35, -40, -40, -25, -25, -40, -35],
  Kcommaaccentu: [-30, -30, -30, -30, -15, -20, -40, -15],
  Kcommaaccentuacute: [-30, -30, -30, -30, -15, -20, -40, -15],
  Kcommaaccentucircumflex: [-30, -30, -30, -30, -15, -20, -40, -15],
  Kcommaaccentudieresis: [-30, -30, -30, -30, -15, -20, -40, -15],
  Kcommaaccentugrave: [-30, -30, -30, -30, -15, -20, -40, -15],
  Kcommaaccentuhungarumlaut: [-30, -30, -30, -30, -15, -20, -40, -15],
  Kcommaaccentumacron: [-30, -30, -30, -30, -15, -20, -40, -15],
  Kcommaaccentuogonek: [-30, -30, -30, -30, -15, -20, -40, -15],
  Kcommaaccenturing: [-30, -30, -30, -30, -15, -20, -40, -15],
  Kcommaaccenty: [-40, -40, -50, -50, -45, -20, -40, -25],
  Kcommaaccentyacute: [-40, -40, -50, -50, -45, -20, -40, -25],
  Kcommaaccentydieresis: [-40, -40, -50, -50, -45, -20, -40, -25],
  LT: [-90, -90, -110, -110, -92, -18, -20, -92],
  LTcaron: [-90, -90, -110, -110, -92, -18, -20, -92],
  LTcommaaccent: [-90, -90, -110, -110, -92, -18, -20, -92],
  LV: [-110, -110, -110, -110, -92, -37, -55, -100],
  LW: [-80, -80, -70, -70, -92, -37, -55, -74],
  LY: [-120, -120, -140, -140, -92, -37, -20, -100],
  LYacute: [-120, -120, -140, -140, -92, -37, -20, -100],
  LYdieresis: [-120, -120, -140, -140, -92, -37, -20, -100],
  Lquotedblright: [-140, -140, -140, -140, -20],
  Lquoteright: [-140, -140, -160, -160, -110, -55, -37, -92],
  Ly: [-30, -30, -30, -30, -55, -37, -30, -55],
  Lyacute: [-30, -30, -30, -30, -55, -37, -30, -55],
  Lydieresis: [-30, -30, -30, -30, -55, -37, -30, -55],
  LacuteT: [-90, -90, -110, -110, -92, -18, -20, -92],
  LacuteTcaron: [-90, -90, -110, -110, -92, -18, -20, -92],
  LacuteTcommaaccent: [-90, -90, -110, -110, -92, -18, -20, -92],
  LacuteV: [-110, -110, -110, -110, -92, -37, -55, -100],
  LacuteW: [-80, -80, -70, -70, -92, -37, -55, -74],
  LacuteY: [-120, -120, -140, -140, -92, -37, -20, -100],
  LacuteYacute: [-120, -120, -140, -140, -92, -37, -20, -100],
  LacuteYdieresis: [-120, -120, -140, -140, -92, -37, -20, -100],
  Lacutequotedblright: [-140, -140, -140, -140, -20],
  Lacutequoteright: [-140, -140, -160, -160, -110, -55, -37, -92],
  Lacutey: [-30, -30, -30, -30, -55, -37, -30, -55],
  Lacuteyacute: [-30, -30, -30, -30, -55, -37, -30, -55],
  Lacuteydieresis: [-30, -30, -30, -30, -55, -37, -30, -55],
  LcommaaccentT: [-90, -90, -110, -110, -92, -18, -20, -92],
  LcommaaccentTcaron: [-90, -90, -110, -110, -92, -18, -20, -92],
  LcommaaccentTcommaaccent: [-90, -90, -110, -110, -92, -18, -20, -92],
  LcommaaccentV: [-110, -110, -110, -110, -92, -37, -55, -100],
  LcommaaccentW: [-80, -80, -70, -70, -92, -37, -55, -74],
  LcommaaccentY: [-120, -120, -140, -140, -92, -37, -20, -100],
  LcommaaccentYacute: [-120, -120, -140, -140, -92, -37, -20, -100],
  LcommaaccentYdieresis: [-120, -120, -140, -140, -92, -37, -20, -100],
  Lcommaaccentquotedblright: [-140, -140, -140, -140, -20],
  Lcommaaccentquoteright: [-140, -140, -160, -160, -110, -55, -37, -92],
  Lcommaaccenty: [-30, -30, -30, -30, -55, -37, -30, -55],
  Lcommaaccentyacute: [-30, -30, -30, -30, -55, -37, -30, -55],
  Lcommaaccentydieresis: [-30, -30, -30, -30, -55, -37, -30, -55],
  LslashT: [-90, -90, -110, -110, -92, -18, -20, -92],
  LslashTcaron: [-90, -90, -110, -110, -92, -18, -20, -92],
  LslashTcommaaccent: [-90, -90, -110, -110, -92, -18, -20, -92],
  LslashV: [-110, -110, -110, -110, -92, -37, -55, -100],
  LslashW: [-80, -80, -70, -70, -92, -37, -55, -74],
  LslashY: [-120, -120, -140, -140, -92, -37, -20, -100],
  LslashYacute: [-120, -120, -140, -140, -92, -37, -20, -100],
  LslashYdieresis: [-120, -120, -140, -140, -92, -37, -20, -100],
  Lslashquotedblright: [-140, -140, -140, -140, -20],
  Lslashquoteright: [-140, -140, -160, -160, -110, -55, -37, -92],
  Lslashy: [-30, -30, -30, -30, -55, -37, -30, -55],
  Lslashyacute: [-30, -30, -30, -30, -55, -37, -30, -55],
  Lslashydieresis: [-30, -30, -30, -30, -55, -37, -30, -55],
  OA: [-50, -50, -20, -20, -40, -40, -55, -35],
  OAacute: [-50, -50, -20, -20, -40, -40, -55, -35],
  OAbreve: [-50, -50, -20, -20, -40, -40, -55, -35],
  OAcircumflex: [-50, -50, -20, -20, -40, -40, -55, -35],
  OAdieresis: [-50, -50, -20, -20, -40, -40, -55, -35],
  OAgrave: [-50, -50, -20, -20, -40, -40, -55, -35],
  OAmacron: [-50, -50, -20, -20, -40, -40, -55, -35],
  OAogonek: [-50, -50, -20, -20, -40, -40, -55, -35],
  OAring: [-50, -50, -20, -20, -40, -40, -55, -35],
  OAtilde: [-50, -50, -20, -20, -40, -40, -55, -35],
  OT: [-40, -40, -40, -40, -40, -40, -40, -40],
  OTcaron: [-40, -40, -40, -40, -40, -40, -40, -40],
  OTcommaaccent: [-40, -40, -40, -40, -40, -40, -40, -40],
  OV: [-50, -50, -50, -50, -50, -50, -50, -50],
  OW: [-50, -50, -30, -30, -50, -50, -50, -35],
  OX: [-50, -50, -60, -60, -40, -40, -40, -40],
  OY: [-70, -70, -70, -70, -50, -50, -50, -50],
  OYacute: [-70, -70, -70, -70, -50, -50, -50, -50],
  OYdieresis: [-70, -70, -70, -70, -50, -50, -50, -50],
  Ocomma: [-40, -40, -40, -40],
  Operiod: [-40, -40, -40, -40],
  OacuteA: [-50, -50, -20, -20, -40, -40, -55, -35],
  OacuteAacute: [-50, -50, -20, -20, -40, -40, -55, -35],
  OacuteAbreve: [-50, -50, -20, -20, -40, -40, -55, -35],
  OacuteAcircumflex: [-50, -50, -20, -20, -40, -40, -55, -35],
  OacuteAdieresis: [-50, -50, -20, -20, -40, -40, -55, -35],
  OacuteAgrave: [-50, -50, -20, -20, -40, -40, -55, -35],
  OacuteAmacron: [-50, -50, -20, -20, -40, -40, -55, -35],
  OacuteAogonek: [-50, -50, -20, -20, -40, -40, -55, -35],
  OacuteAring: [-50, -50, -20, -20, -40, -40, -55, -35],
  OacuteAtilde: [-50, -50, -20, -20, -40, -40, -55, -35],
  OacuteT: [-40, -40, -40, -40, -40, -40, -40, -40],
  OacuteTcaron: [-40, -40, -40, -40, -40, -40, -40, -40],
  OacuteTcommaaccent: [-40, -40, -40, -40, -40, -40, -40, -40],
  OacuteV: [-50, -50, -50, -50, -50, -50, -50, -50],
  OacuteW: [-50, -50, -30, -30, -50, -50, -50, -35],
  OacuteX: [-50, -50, -60, -60, -40, -40, -40, -40],
  OacuteY: [-70, -70, -70, -70, -50, -50, -50, -50],
  OacuteYacute: [-70, -70, -70, -70, -50, -50, -50, -50],
  OacuteYdieresis: [-70, -70, -70, -70, -50, -50, -50, -50],
  Oacutecomma: [-40, -40, -40, -40],
  Oacuteperiod: [-40, -40, -40, -40],
  OcircumflexA: [-50, -50, -20, -20, -40, -40, -55, -35],
  OcircumflexAacute: [-50, -50, -20, -20, -40, -40, -55, -35],
  OcircumflexAbreve: [-50, -50, -20, -20, -40, -40, -55, -35],
  OcircumflexAcircumflex: [-50, -50, -20, -20, -40, -40, -55, -35],
  OcircumflexAdieresis: [-50, -50, -20, -20, -40, -40, -55, -35],
  OcircumflexAgrave: [-50, -50, -20, -20, -40, -40, -55, -35],
  OcircumflexAmacron: [-50, -50, -20, -20, -40, -40, -55, -35],
  OcircumflexAogonek: [-50, -50, -20, -20, -40, -40, -55, -35],
  OcircumflexAring: [-50, -50, -20, -20, -40, -40, -55, -35],
  OcircumflexAtilde: [-50, -50, -20, -20, -40, -40, -55, -35],
  OcircumflexT: [-40, -40, -40, -40, -40, -40, -40, -40],
  OcircumflexTcaron: [-40, -40, -40, -40, -40, -40, -40, -40],
  OcircumflexTcommaaccent: [-40, -40, -40, -40, -40, -40, -40, -40],
  OcircumflexV: [-50, -50, -50, -50, -50, -50, -50, -50],
  OcircumflexW: [-50, -50, -30, -30, -50, -50, -50, -35],
  OcircumflexX: [-50, -50, -60, -60, -40, -40, -40, -40],
  OcircumflexY: [-70, -70, -70, -70, -50, -50, -50, -50],
  OcircumflexYacute: [-70, -70, -70, -70, -50, -50, -50, -50],
  OcircumflexYdieresis: [-70, -70, -70, -70, -50, -50, -50, -50],
  Ocircumflexcomma: [-40, -40, -40, -40],
  Ocircumflexperiod: [-40, -40, -40, -40],
  OdieresisA: [-50, -50, -20, -20, -40, -40, -55, -35],
  OdieresisAacute: [-50, -50, -20, -20, -40, -40, -55, -35],
  OdieresisAbreve: [-50, -50, -20, -20, -40, -40, -55, -35],
  OdieresisAcircumflex: [-50, -50, -20, -20, -40, -40, -55, -35],
  OdieresisAdieresis: [-50, -50, -20, -20, -40, -40, -55, -35],
  OdieresisAgrave: [-50, -50, -20, -20, -40, -40, -55, -35],
  OdieresisAmacron: [-50, -50, -20, -20, -40, -40, -55, -35],
  OdieresisAogonek: [-50, -50, -20, -20, -40, -40, -55, -35],
  OdieresisAring: [-50, -50, -20, -20, -40, -40, -55, -35],
  OdieresisAtilde: [-50, -50, -20, -20, -40, -40, -55, -35],
  OdieresisT: [-40, -40, -40, -40, -40, -40, -40, -40],
  OdieresisTcaron: [-40, -40, -40, -40, -40, -40, -40, -40],
  OdieresisTcommaaccent: [-40, -40, -40, -40, -40, -40, -40, -40],
  OdieresisV: [-50, -50, -50, -50, -50, -50, -50, -50],
  OdieresisW: [-50, -50, -30, -30, -50, -50, -50, -35],
  OdieresisX: [-50, -50, -60, -60, -40, -40, -40, -40],
  OdieresisY: [-70, -70, -70, -70, -50, -50, -50, -50],
  OdieresisYacute: [-70, -70, -70, -70, -50, -50, -50, -50],
  OdieresisYdieresis: [-70, -70, -70, -70, -50, -50, -50, -50],
  Odieresiscomma: [-40, -40, -40, -40],
  Odieresisperiod: [-40, -40, -40, -40],
  OgraveA: [-50, -50, -20, -20, -40, -40, -55, -35],
  OgraveAacute: [-50, -50, -20, -20, -40, -40, -55, -35],
  OgraveAbreve: [-50, -50, -20, -20, -40, -40, -55, -35],
  OgraveAcircumflex: [-50, -50, -20, -20, -40, -40, -55, -35],
  OgraveAdieresis: [-50, -50, -20, -20, -40, -40, -55, -35],
  OgraveAgrave: [-50, -50, -20, -20, -40, -40, -55, -35],
  OgraveAmacron: [-50, -50, -20, -20, -40, -40, -55, -35],
  OgraveAogonek: [-50, -50, -20, -20, -40, -40, -55, -35],
  OgraveAring: [-50, -50, -20, -20, -40, -40, -55, -35],
  OgraveAtilde: [-50, -50, -20, -20, -40, -40, -55, -35],
  OgraveT: [-40, -40, -40, -40, -40, -40, -40, -40],
  OgraveTcaron: [-40, -40, -40, -40, -40, -40, -40, -40],
  OgraveTcommaaccent: [-40, -40, -40, -40, -40, -40, -40, -40],
  OgraveV: [-50, -50, -50, -50, -50, -50, -50, -50],
  OgraveW: [-50, -50, -30, -30, -50, -50, -50, -35],
  OgraveX: [-50, -50, -60, -60, -40, -40, -40, -40],
  OgraveY: [-70, -70, -70, -70, -50, -50, -50, -50],
  OgraveYacute: [-70, -70, -70, -70, -50, -50, -50, -50],
  OgraveYdieresis: [-70, -70, -70, -70, -50, -50, -50, -50],
  Ogravecomma: [-40, -40, -40, -40],
  Ograveperiod: [-40, -40, -40, -40],
  OhungarumlautA: [-50, -50, -20, -20, -40, -40, -55, -35],
  OhungarumlautAacute: [-50, -50, -20, -20, -40, -40, -55, -35],
  OhungarumlautAbreve: [-50, -50, -20, -20, -40, -40, -55, -35],
  OhungarumlautAcircumflex: [-50, -50, -20, -20, -40, -40, -55, -35],
  OhungarumlautAdieresis: [-50, -50, -20, -20, -40, -40, -55, -35],
  OhungarumlautAgrave: [-50, -50, -20, -20, -40, -40, -55, -35],
  OhungarumlautAmacron: [-50, -50, -20, -20, -40, -40, -55, -35],
  OhungarumlautAogonek: [-50, -50, -20, -20, -40, -40, -55, -35],
  OhungarumlautAring: [-50, -50, -20, -20, -40, -40, -55, -35],
  OhungarumlautAtilde: [-50, -50, -20, -20, -40, -40, -55, -35],
  OhungarumlautT: [-40, -40, -40, -40, -40, -40, -40, -40],
  OhungarumlautTcaron: [-40, -40, -40, -40, -40, -40, -40, -40],
  OhungarumlautTcommaaccent: [-40, -40, -40, -40, -40, -40, -40, -40],
  OhungarumlautV: [-50, -50, -50, -50, -50, -50, -50, -50],
  OhungarumlautW: [-50, -50, -30, -30, -50, -50, -50, -35],
  OhungarumlautX: [-50, -50, -60, -60, -40, -40, -40, -40],
  OhungarumlautY: [-70, -70, -70, -70, -50, -50, -50, -50],
  OhungarumlautYacute: [-70, -70, -70, -70, -50, -50, -50, -50],
  OhungarumlautYdieresis: [-70, -70, -70, -70, -50, -50, -50, -50],
  Ohungarumlautcomma: [-40, -40, -40, -40],
  Ohungarumlautperiod: [-40, -40, -40, -40],
  OmacronA: [-50, -50, -20, -20, -40, -40, -55, -35],
  OmacronAacute: [-50, -50, -20, -20, -40, -40, -55, -35],
  OmacronAbreve: [-50, -50, -20, -20, -40, -40, -55, -35],
  OmacronAcircumflex: [-50, -50, -20, -20, -40, -40, -55, -35],
  OmacronAdieresis: [-50, -50, -20, -20, -40, -40, -55, -35],
  OmacronAgrave: [-50, -50, -20, -20, -40, -40, -55, -35],
  OmacronAmacron: [-50, -50, -20, -20, -40, -40, -55, -35],
  OmacronAogonek: [-50, -50, -20, -20, -40, -40, -55, -35],
  OmacronAring: [-50, -50, -20, -20, -40, -40, -55, -35],
  OmacronAtilde: [-50, -50, -20, -20, -40, -40, -55, -35],
  OmacronT: [-40, -40, -40, -40, -40, -40, -40, -40],
  OmacronTcaron: [-40, -40, -40, -40, -40, -40, -40, -40],
  OmacronTcommaaccent: [-40, -40, -40, -40, -40, -40, -40, -40],
  OmacronV: [-50, -50, -50, -50, -50, -50, -50, -50],
  OmacronW: [-50, -50, -30, -30, -50, -50, -50, -35],
  OmacronX: [-50, -50, -60, -60, -40, -40, -40, -40],
  OmacronY: [-70, -70, -70, -70, -50, -50, -50, -50],
  OmacronYacute: [-70, -70, -70, -70, -50, -50, -50, -50],
  OmacronYdieresis: [-70, -70, -70, -70, -50, -50, -50, -50],
  Omacroncomma: [-40, -40, -40, -40],
  Omacronperiod: [-40, -40, -40, -40],
  OslashA: [-50, -50, -20, -20, -40, -40, -55, -35],
  OslashAacute: [-50, -50, -20, -20, -40, -40, -55, -35],
  OslashAbreve: [-50, -50, -20, -20, -40, -40, -55, -35],
  OslashAcircumflex: [-50, -50, -20, -20, -40, -40, -55, -35],
  OslashAdieresis: [-50, -50, -20, -20, -40, -40, -55, -35],
  OslashAgrave: [-50, -50, -20, -20, -40, -40, -55, -35],
  OslashAmacron: [-50, -50, -20, -20, -40, -40, -55, -35],
  OslashAogonek: [-50, -50, -20, -20, -40, -40, -55, -35],
  OslashAring: [-50, -50, -20, -20, -40, -40, -55, -35],
  OslashAtilde: [-50, -50, -20, -20, -40, -40, -55, -35],
  OslashT: [-40, -40, -40, -40, -40, -40, -40, -40],
  OslashTcaron: [-40, -40, -40, -40, -40, -40, -40, -40],
  OslashTcommaaccent: [-40, -40, -40, -40, -40, -40, -40, -40],
  OslashV: [-50, -50, -50, -50, -50, -50, -50, -50],
  OslashW: [-50, -50, -30, -30, -50, -50, -50, -35],
  OslashX: [-50, -50, -60, -60, -40, -40, -40, -40],
  OslashY: [-70, -70, -70, -70, -50, -50, -50, -50],
  OslashYacute: [-70, -70, -70, -70, -50, -50, -50, -50],
  OslashYdieresis: [-70, -70, -70, -70, -50, -50, -50, -50],
  Oslashcomma: [-40, -40, -40, -40],
  Oslashperiod: [-40, -40, -40, -40],
  OtildeA: [-50, -50, -20, -20, -40, -40, -55, -35],
  OtildeAacute: [-50, -50, -20, -20, -40, -40, -55, -35],
  OtildeAbreve: [-50, -50, -20, -20, -40, -40, -55, -35],
  OtildeAcircumflex: [-50, -50, -20, -20, -40, -40, -55, -35],
  OtildeAdieresis: [-50, -50, -20, -20, -40, -40, -55, -35],
  OtildeAgrave: [-50, -50, -20, -20, -40, -40, -55, -35],
  OtildeAmacron: [-50, -50, -20, -20, -40, -40, -55, -35],
  OtildeAogonek: [-50, -50, -20, -20, -40, -40, -55, -35],
  OtildeAring: [-50, -50, -20, -20, -40, -40, -55, -35],
  OtildeAtilde: [-50, -50, -20, -20, -40, -40, -55, -35],
  OtildeT: [-40, -40, -40, -40, -40, -40, -40, -40],
  OtildeTcaron: [-40, -40, -40, -40, -40, -40, -40, -40],
  OtildeTcommaaccent: [-40, -40, -40, -40, -40, -40, -40, -40],
  OtildeV: [-50, -50, -50, -50, -50, -50, -50, -50],
  OtildeW: [-50, -50, -30, -30, -50, -50, -50, -35],
  OtildeX: [-50, -50, -60, -60, -40, -40, -40, -40],
  OtildeY: [-70, -70, -70, -70, -50, -50, -50, -50],
  OtildeYacute: [-70, -70, -70, -70, -50, -50, -50, -50],
  OtildeYdieresis: [-70, -70, -70, -70, -50, -50, -50, -50],
  Otildecomma: [-40, -40, -40, -40],
  Otildeperiod: [-40, -40, -40, -40],
  PA: [-100, -100, -120, -120, -74, -85, -90, -92],
  PAacute: [-100, -100, -120, -120, -74, -85, -90, -92],
  PAbreve: [-100, -100, -120, -120, -74, -85, -90, -92],
  PAcircumflex: [-100, -100, -120, -120, -74, -85, -90, -92],
  PAdieresis: [-100, -100, -120, -120, -74, -85, -90, -92],
  PAgrave: [-100, -100, -120, -120, -74, -85, -90, -92],
  PAmacron: [-100, -100, -120, -120, -74, -85, -90, -92],
  PAogonek: [-100, -100, -120, -120, -74, -85, -90, -92],
  PAring: [-100, -100, -120, -120, -74, -85, -90, -92],
  PAtilde: [-100, -100, -120, -120, -74, -85, -90, -92],
  Pa: [-30, -30, -40, -40, -10, -40, -80, -15],
  Paacute: [-30, -30, -40, -40, -10, -40, -80, -15],
  Pabreve: [-30, -30, -40, -40, -10, -40, -80, -15],
  Pacircumflex: [-30, -30, -40, -40, -10, -40, -80, -15],
  Padieresis: [-30, -30, -40, -40, -10, -40, -80, -15],
  Pagrave: [-30, -30, -40, -40, -10, -40, -80, -15],
  Pamacron: [-30, -30, -40, -40, -10, -40, -80, -15],
  Paogonek: [-30, -30, -40, -40, -10, -40, -80, -15],
  Paring: [-30, -30, -40, -40, -10, -40, -80, -15],
  Patilde: [-30, -30, -40, -40, -10, -40, -80, -15],
  Pcomma: [-120, -120, -180, -180, -92, -129, -135, -111],
  Pe: [-30, -30, -50, -50, -20, -50, -80],
  Peacute: [-30, -30, -50, -50, -20, -50, -80],
  Pecaron: [-30, -30, -50, -50, -20, -50, -80],
  Pecircumflex: [-30, -30, -50, -50, -20, -50, -80],
  Pedieresis: [-30, -30, -50, -50, -20, -50, -80],
  Pedotaccent: [-30, -30, -50, -50, -20, -50, -80],
  Pegrave: [-30, -30, -50, -50, -20, -50, -80],
  Pemacron: [-30, -30, -50, -50, -20, -50, -80],
  Peogonek: [-30, -30, -50, -50, -20, -50, -80],
  Po: [-40, -40, -50, -50, -20, -55, -80],
  Poacute: [-40, -40, -50, -50, -20, -55, -80],
  Pocircumflex: [-40, -40, -50, -50, -20, -55, -80],
  Podieresis: [-40, -40, -50, -50, -20, -55, -80],
  Pograve: [-40, -40, -50, -50, -20, -55, -80],
  Pohungarumlaut: [-40, -40, -50, -50, -20, -55, -80],
  Pomacron: [-40, -40, -50, -50, -20, -55, -80],
  Poslash: [-40, -40, -50, -50, -20, -55, -80],
  Potilde: [-40, -40, -50, -50, -20, -55, -80],
  Pperiod: [-120, -120, -180, -180, -110, -129, -135, -111],
  QU: [-10, -10, -10, -10, -10, -10, -10, -10],
  QUacute: [-10, -10, -10, -10, -10, -10, -10, -10],
  QUcircumflex: [-10, -10, -10, -10, -10, -10, -10, -10],
  QUdieresis: [-10, -10, -10, -10, -10, -10, -10, -10],
  QUgrave: [-10, -10, -10, -10, -10, -10, -10, -10],
  QUhungarumlaut: [-10, -10, -10, -10, -10, -10, -10, -10],
  QUmacron: [-10, -10, -10, -10, -10, -10, -10, -10],
  QUogonek: [-10, -10, -10, -10, -10, -10, -10, -10],
  QUring: [-10, -10, -10, -10, -10, -10, -10, -10],
  Qcomma: [20, 20],
  Qperiod: [20, 20, 0, 0, -20],
  RO: [-20, -20, -20, -20, -30, -40, -40, -40],
  ROacute: [-20, -20, -20, -20, -30, -40, -40, -40],
  ROcircumflex: [-20, -20, -20, -20, -30, -40, -40, -40],
  ROdieresis: [-20, -20, -20, -20, -30, -40, -40, -40],
  ROgrave: [-20, -20, -20, -20, -30, -40, -40, -40],
  ROhungarumlaut: [-20, -20, -20, -20, -30, -40, -40, -40],
  ROmacron: [-20, -20, -20, -20, -30, -40, -40, -40],
  ROslash: [-20, -20, -20, -20, -30, -40, -40, -40],
  ROtilde: [-20, -20, -20, -20, -30, -40, -40, -40],
  RT: [-20, -20, -30, -30, -40, -30, 0, -60],
  RTcaron: [-20, -20, -30, -30, -40, -30, 0, -60],
  RTcommaaccent: [-20, -20, -30, -30, -40, -30, 0, -60],
  RU: [-20, -20, -40, -40, -30, -40, -40, -40],
  RUacute: [-20, -20, -40, -40, -30, -40, -40, -40],
  RUcircumflex: [-20, -20, -40, -40, -30, -40, -40, -40],
  RUdieresis: [-20, -20, -40, -40, -30, -40, -40, -40],
  RUgrave: [-20, -20, -40, -40, -30, -40, -40, -40],
  RUhungarumlaut: [-20, -20, -40, -40, -30, -40, -40, -40],
  RUmacron: [-20, -20, -40, -40, -30, -40, -40, -40],
  RUogonek: [-20, -20, -40, -40, -30, -40, -40, -40],
  RUring: [-20, -20, -40, -40, -30, -40, -40, -40],
  RV: [-50, -50, -50, -50, -55, -18, -18, -80],
  RW: [-40, -40, -30, -30, -35, -18, -18, -55],
  RY: [-50, -50, -50, -50, -35, -18, -18, -65],
  RYacute: [-50, -50, -50, -50, -35, -18, -18, -65],
  RYdieresis: [-50, -50, -50, -50, -35, -18, -18, -65],
  RacuteO: [-20, -20, -20, -20, -30, -40, -40, -40],
  RacuteOacute: [-20, -20, -20, -20, -30, -40, -40, -40],
  RacuteOcircumflex: [-20, -20, -20, -20, -30, -40, -40, -40],
  RacuteOdieresis: [-20, -20, -20, -20, -30, -40, -40, -40],
  RacuteOgrave: [-20, -20, -20, -20, -30, -40, -40, -40],
  RacuteOhungarumlaut: [-20, -20, -20, -20, -30, -40, -40, -40],
  RacuteOmacron: [-20, -20, -20, -20, -30, -40, -40, -40],
  RacuteOslash: [-20, -20, -20, -20, -30, -40, -40, -40],
  RacuteOtilde: [-20, -20, -20, -20, -30, -40, -40, -40],
  RacuteT: [-20, -20, -30, -30, -40, -30, 0, -60],
  RacuteTcaron: [-20, -20, -30, -30, -40, -30, 0, -60],
  RacuteTcommaaccent: [-20, -20, -30, -30, -40, -30, 0, -60],
  RacuteU: [-20, -20, -40, -40, -30, -40, -40, -40],
  RacuteUacute: [-20, -20, -40, -40, -30, -40, -40, -40],
  RacuteUcircumflex: [-20, -20, -40, -40, -30, -40, -40, -40],
  RacuteUdieresis: [-20, -20, -40, -40, -30, -40, -40, -40],
  RacuteUgrave: [-20, -20, -40, -40, -30, -40, -40, -40],
  RacuteUhungarumlaut: [-20, -20, -40, -40, -30, -40, -40, -40],
  RacuteUmacron: [-20, -20, -40, -40, -30, -40, -40, -40],
  RacuteUogonek: [-20, -20, -40, -40, -30, -40, -40, -40],
  RacuteUring: [-20, -20, -40, -40, -30, -40, -40, -40],
  RacuteV: [-50, -50, -50, -50, -55, -18, -18, -80],
  RacuteW: [-40, -40, -30, -30, -35, -18, -18, -55],
  RacuteY: [-50, -50, -50, -50, -35, -18, -18, -65],
  RacuteYacute: [-50, -50, -50, -50, -35, -18, -18, -65],
  RacuteYdieresis: [-50, -50, -50, -50, -35, -18, -18, -65],
  RcaronO: [-20, -20, -20, -20, -30, -40, -40, -40],
  RcaronOacute: [-20, -20, -20, -20, -30, -40, -40, -40],
  RcaronOcircumflex: [-20, -20, -20, -20, -30, -40, -40, -40],
  RcaronOdieresis: [-20, -20, -20, -20, -30, -40, -40, -40],
  RcaronOgrave: [-20, -20, -20, -20, -30, -40, -40, -40],
  RcaronOhungarumlaut: [-20, -20, -20, -20, -30, -40, -40, -40],
  RcaronOmacron: [-20, -20, -20, -20, -30, -40, -40, -40],
  RcaronOslash: [-20, -20, -20, -20, -30, -40, -40, -40],
  RcaronOtilde: [-20, -20, -20, -20, -30, -40, -40, -40],
  RcaronT: [-20, -20, -30, -30, -40, -30, 0, -60],
  RcaronTcaron: [-20, -20, -30, -30, -40, -30, 0, -60],
  RcaronTcommaaccent: [-20, -20, -30, -30, -40, -30, 0, -60],
  RcaronU: [-20, -20, -40, -40, -30, -40, -40, -40],
  RcaronUacute: [-20, -20, -40, -40, -30, -40, -40, -40],
  RcaronUcircumflex: [-20, -20, -40, -40, -30, -40, -40, -40],
  RcaronUdieresis: [-20, -20, -40, -40, -30, -40, -40, -40],
  RcaronUgrave: [-20, -20, -40, -40, -30, -40, -40, -40],
  RcaronUhungarumlaut: [-20, -20, -40, -40, -30, -40, -40, -40],
  RcaronUmacron: [-20, -20, -40, -40, -30, -40, -40, -40],
  RcaronUogonek: [-20, -20, -40, -40, -30, -40, -40, -40],
  RcaronUring: [-20, -20, -40, -40, -30, -40, -40, -40],
  RcaronV: [-50, -50, -50, -50, -55, -18, -18, -80],
  RcaronW: [-40, -40, -30, -30, -35, -18, -18, -55],
  RcaronY: [-50, -50, -50, -50, -35, -18, -18, -65],
  RcaronYacute: [-50, -50, -50, -50, -35, -18, -18, -65],
  RcaronYdieresis: [-50, -50, -50, -50, -35, -18, -18, -65],
  RcommaaccentO: [-20, -20, -20, -20, -30, -40, -40, -40],
  RcommaaccentOacute: [-20, -20, -20, -20, -30, -40, -40, -40],
  RcommaaccentOcircumflex: [-20, -20, -20, -20, -30, -40, -40, -40],
  RcommaaccentOdieresis: [-20, -20, -20, -20, -30, -40, -40, -40],
  RcommaaccentOgrave: [-20, -20, -20, -20, -30, -40, -40, -40],
  RcommaaccentOhungarumlaut: [-20, -20, -20, -20, -30, -40, -40, -40],
  RcommaaccentOmacron: [-20, -20, -20, -20, -30, -40, -40, -40],
  RcommaaccentOslash: [-20, -20, -20, -20, -30, -40, -40, -40],
  RcommaaccentOtilde: [-20, -20, -20, -20, -30, -40, -40, -40],
  RcommaaccentT: [-20, -20, -30, -30, -40, -30, 0, -60],
  RcommaaccentTcaron: [-20, -20, -30, -30, -40, -30, 0, -60],
  RcommaaccentTcommaaccent: [-20, -20, -30, -30, -40, -30, 0, -60],
  RcommaaccentU: [-20, -20, -40, -40, -30, -40, -40, -40],
  RcommaaccentUacute: [-20, -20, -40, -40, -30, -40, -40, -40],
  RcommaaccentUcircumflex: [-20, -20, -40, -40, -30, -40, -40, -40],
  RcommaaccentUdieresis: [-20, -20, -40, -40, -30, -40, -40, -40],
  RcommaaccentUgrave: [-20, -20, -40, -40, -30, -40, -40, -40],
  RcommaaccentUhungarumlaut: [-20, -20, -40, -40, -30, -40, -40, -40],
  RcommaaccentUmacron: [-20, -20, -40, -40, -30, -40, -40, -40],
  RcommaaccentUogonek: [-20, -20, -40, -40, -30, -40, -40, -40],
  RcommaaccentUring: [-20, -20, -40, -40, -30, -40, -40, -40],
  RcommaaccentV: [-50, -50, -50, -50, -55, -18, -18, -80],
  RcommaaccentW: [-40, -40, -30, -30, -35, -18, -18, -55],
  RcommaaccentY: [-50, -50, -50, -50, -35, -18, -18, -65],
  RcommaaccentYacute: [-50, -50, -50, -50, -35, -18, -18, -65],
  RcommaaccentYdieresis: [-50, -50, -50, -50, -35, -18, -18, -65],
  TA: [-90, -90, -120, -120, -90, -55, -50, -93],
  TAacute: [-90, -90, -120, -120, -90, -55, -50, -93],
  TAbreve: [-90, -90, -120, -120, -90, -55, -50, -93],
  TAcircumflex: [-90, -90, -120, -120, -90, -55, -50, -93],
  TAdieresis: [-90, -90, -120, -120, -90, -55, -50, -93],
  TAgrave: [-90, -90, -120, -120, -90, -55, -50, -93],
  TAmacron: [-90, -90, -120, -120, -90, -55, -50, -93],
  TAogonek: [-90, -90, -120, -120, -90, -55, -50, -93],
  TAring: [-90, -90, -120, -120, -90, -55, -50, -93],
  TAtilde: [-90, -90, -120, -120, -90, -55, -50, -93],
  TO: [-40, -40, -40, -40, -18, -18, -18, -18],
  TOacute: [-40, -40, -40, -40, -18, -18, -18, -18],
  TOcircumflex: [-40, -40, -40, -40, -18, -18, -18, -18],
  TOdieresis: [-40, -40, -40, -40, -18, -18, -18, -18],
  TOgrave: [-40, -40, -40, -40, -18, -18, -18, -18],
  TOhungarumlaut: [-40, -40, -40, -40, -18, -18, -18, -18],
  TOmacron: [-40, -40, -40, -40, -18, -18, -18, -18],
  TOslash: [-40, -40, -40, -40, -18, -18, -18, -18],
  TOtilde: [-40, -40, -40, -40, -18, -18, -18, -18],
  Ta: [-80, -80, -120, -120, -92, -92, -92, -80],
  Taacute: [-80, -80, -120, -120, -92, -92, -92, -80],
  Tabreve: [-80, -80, -60, -60, -52, -92, -92, -80],
  Tacircumflex: [-80, -80, -120, -120, -52, -92, -92, -80],
  Tadieresis: [-80, -80, -120, -120, -52, -92, -92, -40],
  Tagrave: [-80, -80, -120, -120, -52, -92, -92, -40],
  Tamacron: [-80, -80, -60, -60, -52, -92, -92, -40],
  Taogonek: [-80, -80, -120, -120, -92, -92, -92, -80],
  Taring: [-80, -80, -120, -120, -92, -92, -92, -80],
  Tatilde: [-80, -80, -60, -60, -52, -92, -92, -40],
  Tcolon: [-40, -40, -20, -20, -74, -74, -55, -50],
  Tcomma: [-80, -80, -120, -120, -74, -92, -74, -74],
  Te: [-60, -60, -120, -120, -92, -92, -92, -70],
  Teacute: [-60, -60, -120, -120, -92, -92, -92, -70],
  Tecaron: [-60, -60, -120, -120, -92, -92, -92, -70],
  Tecircumflex: [-60, -60, -120, -120, -92, -92, -52, -70],
  Tedieresis: [-60, -60, -120, -120, -52, -52, -52, -30],
  Tedotaccent: [-60, -60, -120, -120, -92, -92, -92, -70],
  Tegrave: [-60, -60, -60, -60, -52, -52, -52, -70],
  Temacron: [-60, -60, -60, -60, -52, -52, -52, -30],
  Teogonek: [-60, -60, -120, -120, -92, -92, -92, -70],
  Thyphen: [-120, -120, -140, -140, -92, -92, -74, -92],
  To: [-80, -80, -120, -120, -92, -95, -92, -80],
  Toacute: [-80, -80, -120, -120, -92, -95, -92, -80],
  Tocircumflex: [-80, -80, -120, -120, -92, -95, -92, -80],
  Todieresis: [-80, -80, -120, -120, -92, -95, -92, -80],
  Tograve: [-80, -80, -120, -120, -92, -95, -92, -80],
  Tohungarumlaut: [-80, -80, -120, -120, -92, -95, -92, -80],
  Tomacron: [-80, -80, -60, -60, -92, -95, -92, -80],
  Toslash: [-80, -80, -120, -120, -92, -95, -92, -80],
  Totilde: [-80, -80, -60, -60, -92, -95, -92, -80],
  Tperiod: [-80, -80, -120, -120, -90, -92, -74, -74],
  Tr: [-80, -80, -120, -120, -74, -37, -55, -35],
  Tracute: [-80, -80, -120, -120, -74, -37, -55, -35],
  Trcommaaccent: [-80, -80, -120, -120, -74, -37, -55, -35],
  Tsemicolon: [-40, -40, -20, -20, -74, -74, -65, -55],
  Tu: [-90, -90, -120, -120, -92, -37, -55, -45],
  Tuacute: [-90, -90, -120, -120, -92, -37, -55, -45],
  Tucircumflex: [-90, -90, -120, -120, -92, -37, -55, -45],
  Tudieresis: [-90, -90, -120, -120, -92, -37, -55, -45],
  Tugrave: [-90, -90, -120, -120, -92, -37, -55, -45],
  Tuhungarumlaut: [-90, -90, -120, -120, -92, -37, -55, -45],
  Tumacron: [-90, -90, -60, -60, -92, -37, -55, -45],
  Tuogonek: [-90, -90, -120, -120, -92, -37, -55, -45],
  Turing: [-90, -90, -120, -120, -92, -37, -55, -45],
  Tw: [-60, -60, -120, -120, -74, -37, -74, -80],
  Ty: [-60, -60, -120, -120, -34, -37, -74, -80],
  Tyacute: [-60, -60, -120, -120, -34, -37, -74, -80],
  Tydieresis: [-60, -60, -60, -60, -34, -37, -34, -80],
  TcaronA: [-90, -90, -120, -120, -90, -55, -50, -93],
  TcaronAacute: [-90, -90, -120, -120, -90, -55, -50, -93],
  TcaronAbreve: [-90, -90, -120, -120, -90, -55, -50, -93],
  TcaronAcircumflex: [-90, -90, -120, -120, -90, -55, -50, -93],
  TcaronAdieresis: [-90, -90, -120, -120, -90, -55, -50, -93],
  TcaronAgrave: [-90, -90, -120, -120, -90, -55, -50, -93],
  TcaronAmacron: [-90, -90, -120, -120, -90, -55, -50, -93],
  TcaronAogonek: [-90, -90, -120, -120, -90, -55, -50, -93],
  TcaronAring: [-90, -90, -120, -120, -90, -55, -50, -93],
  TcaronAtilde: [-90, -90, -120, -120, -90, -55, -50, -93],
  TcaronO: [-40, -40, -40, -40, -18, -18, -18, -18],
  TcaronOacute: [-40, -40, -40, -40, -18, -18, -18, -18],
  TcaronOcircumflex: [-40, -40, -40, -40, -18, -18, -18, -18],
  TcaronOdieresis: [-40, -40, -40, -40, -18, -18, -18, -18],
  TcaronOgrave: [-40, -40, -40, -40, -18, -18, -18, -18],
  TcaronOhungarumlaut: [-40, -40, -40, -40, -18, -18, -18, -18],
  TcaronOmacron: [-40, -40, -40, -40, -18, -18, -18, -18],
  TcaronOslash: [-40, -40, -40, -40, -18, -18, -18, -18],
  TcaronOtilde: [-40, -40, -40, -40, -18, -18, -18, -18],
  Tcarona: [-80, -80, -120, -120, -92, -92, -92, -80],
  Tcaronaacute: [-80, -80, -120, -120, -92, -92, -92, -80],
  Tcaronabreve: [-80, -80, -60, -60, -52, -92, -92, -80],
  Tcaronacircumflex: [-80, -80, -120, -120, -52, -92, -92, -80],
  Tcaronadieresis: [-80, -80, -120, -120, -52, -92, -92, -40],
  Tcaronagrave: [-80, -80, -120, -120, -52, -92, -92, -40],
  Tcaronamacron: [-80, -80, -60, -60, -52, -92, -92, -40],
  Tcaronaogonek: [-80, -80, -120, -120, -92, -92, -92, -80],
  Tcaronaring: [-80, -80, -120, -120, -92, -92, -92, -80],
  Tcaronatilde: [-80, -80, -60, -60, -52, -92, -92, -40],
  Tcaroncolon: [-40, -40, -20, -20, -74, -74, -55, -50],
  Tcaroncomma: [-80, -80, -120, -120, -74, -92, -74, -74],
  Tcarone: [-60, -60, -120, -120, -92, -92, -92, -70],
  Tcaroneacute: [-60, -60, -120, -120, -92, -92, -92, -70],
  Tcaronecaron: [-60, -60, -120, -120, -92, -92, -92, -70],
  Tcaronecircumflex: [-60, -60, -120, -120, -92, -92, -52, -30],
  Tcaronedieresis: [-60, -60, -120, -120, -52, -52, -52, -30],
  Tcaronedotaccent: [-60, -60, -120, -120, -92, -92, -92, -70],
  Tcaronegrave: [-60, -60, -60, -60, -52, -52, -52, -70],
  Tcaronemacron: [-60, -60, -60, -60, -52, -52, -52, -30],
  Tcaroneogonek: [-60, -60, -120, -120, -92, -92, -92, -70],
  Tcaronhyphen: [-120, -120, -140, -140, -92, -92, -74, -92],
  Tcarono: [-80, -80, -120, -120, -92, -95, -92, -80],
  Tcaronoacute: [-80, -80, -120, -120, -92, -95, -92, -80],
  Tcaronocircumflex: [-80, -80, -120, -120, -92, -95, -92, -80],
  Tcaronodieresis: [-80, -80, -120, -120, -92, -95, -92, -80],
  Tcaronograve: [-80, -80, -120, -120, -92, -95, -92, -80],
  Tcaronohungarumlaut: [-80, -80, -120, -120, -92, -95, -92, -80],
  Tcaronomacron: [-80, -80, -60, -60, -92, -95, -92, -80],
  Tcaronoslash: [-80, -80, -120, -120, -92, -95, -92, -80],
  Tcaronotilde: [-80, -80, -60, -60, -92, -95, -92, -80],
  Tcaronperiod: [-80, -80, -120, -120, -90, -92, -74, -74],
  Tcaronr: [-80, -80, -120, -120, -74, -37, -55, -35],
  Tcaronracute: [-80, -80, -120, -120, -74, -37, -55, -35],
  Tcaronrcommaaccent: [-80, -80, -120, -120, -74, -37, -55, -35],
  Tcaronsemicolon: [-40, -40, -20, -20, -74, -74, -65, -55],
  Tcaronu: [-90, -90, -120, -120, -92, -37, -55, -45],
  Tcaronuacute: [-90, -90, -120, -120, -92, -37, -55, -45],
  Tcaronucircumflex: [-90, -90, -120, -120, -92, -37, -55, -45],
  Tcaronudieresis: [-90, -90, -120, -120, -92, -37, -55, -45],
  Tcaronugrave: [-90, -90, -120, -120, -92, -37, -55, -45],
  Tcaronuhungarumlaut: [-90, -90, -120, -120, -92, -37, -55, -45],
  Tcaronumacron: [-90, -90, -60, -60, -92, -37, -55, -45],
  Tcaronuogonek: [-90, -90, -120, -120, -92, -37, -55, -45],
  Tcaronuring: [-90, -90, -120, -120, -92, -37, -55, -45],
  Tcaronw: [-60, -60, -120, -120, -74, -37, -74, -80],
  Tcarony: [-60, -60, -120, -120, -34, -37, -74, -80],
  Tcaronyacute: [-60, -60, -120, -120, -34, -37, -74, -80],
  Tcaronydieresis: [-60, -60, -60, -60, -34, -37, -34, -80],
  TcommaaccentA: [-90, -90, -120, -120, -90, -55, -50, -93],
  TcommaaccentAacute: [-90, -90, -120, -120, -90, -55, -50, -93],
  TcommaaccentAbreve: [-90, -90, -120, -120, -90, -55, -50, -93],
  TcommaaccentAcircumflex: [-90, -90, -120, -120, -90, -55, -50, -93],
  TcommaaccentAdieresis: [-90, -90, -120, -120, -90, -55, -50, -93],
  TcommaaccentAgrave: [-90, -90, -120, -120, -90, -55, -50, -93],
  TcommaaccentAmacron: [-90, -90, -120, -120, -90, -55, -50, -93],
  TcommaaccentAogonek: [-90, -90, -120, -120, -90, -55, -50, -93],
  TcommaaccentAring: [-90, -90, -120, -120, -90, -55, -50, -93],
  TcommaaccentAtilde: [-90, -90, -120, -120, -90, -55, -50, -93],
  TcommaaccentO: [-40, -40, -40, -40, -18, -18, -18, -18],
  TcommaaccentOacute: [-40, -40, -40, -40, -18, -18, -18, -18],
  TcommaaccentOcircumflex: [-40, -40, -40, -40, -18, -18, -18, -18],
  TcommaaccentOdieresis: [-40, -40, -40, -40, -18, -18, -18, -18],
  TcommaaccentOgrave: [-40, -40, -40, -40, -18, -18, -18, -18],
  TcommaaccentOhungarumlaut: [-40, -40, -40, -40, -18, -18, -18, -18],
  TcommaaccentOmacron: [-40, -40, -40, -40, -18, -18, -18, -18],
  TcommaaccentOslash: [-40, -40, -40, -40, -18, -18, -18, -18],
  TcommaaccentOtilde: [-40, -40, -40, -40, -18, -18, -18, -18],
  Tcommaaccenta: [-80, -80, -120, -120, -92, -92, -92, -80],
  Tcommaaccentaacute: [-80, -80, -120, -120, -92, -92, -92, -80],
  Tcommaaccentabreve: [-80, -80, -60, -60, -52, -92, -92, -80],
  Tcommaaccentacircumflex: [-80, -80, -120, -120, -52, -92, -92, -80],
  Tcommaaccentadieresis: [-80, -80, -120, -120, -52, -92, -92, -40],
  Tcommaaccentagrave: [-80, -80, -120, -120, -52, -92, -92, -40],
  Tcommaaccentamacron: [-80, -80, -60, -60, -52, -92, -92, -40],
  Tcommaaccentaogonek: [-80, -80, -120, -120, -92, -92, -92, -80],
  Tcommaaccentaring: [-80, -80, -120, -120, -92, -92, -92, -80],
  Tcommaaccentatilde: [-80, -80, -60, -60, -52, -92, -92, -40],
  Tcommaaccentcolon: [-40, -40, -20, -20, -74, -74, -55, -50],
  Tcommaaccentcomma: [-80, -80, -120, -120, -74, -92, -74, -74],
  Tcommaaccente: [-60, -60, -120, -120, -92, -92, -92, -70],
  Tcommaaccenteacute: [-60, -60, -120, -120, -92, -92, -92, -70],
  Tcommaaccentecaron: [-60, -60, -120, -120, -92, -92, -92, -70],
  Tcommaaccentecircumflex: [-60, -60, -120, -120, -92, -92, -52, -30],
  Tcommaaccentedieresis: [-60, -60, -120, -120, -52, -52, -52, -30],
  Tcommaaccentedotaccent: [-60, -60, -120, -120, -92, -92, -92, -70],
  Tcommaaccentegrave: [-60, -60, -60, -60, -52, -52, -52, -30],
  Tcommaaccentemacron: [-60, -60, -60, -60, -52, -52, -52, -70],
  Tcommaaccenteogonek: [-60, -60, -120, -120, -92, -92, -92, -70],
  Tcommaaccenthyphen: [-120, -120, -140, -140, -92, -92, -74, -92],
  Tcommaaccento: [-80, -80, -120, -120, -92, -95, -92, -80],
  Tcommaaccentoacute: [-80, -80, -120, -120, -92, -95, -92, -80],
  Tcommaaccentocircumflex: [-80, -80, -120, -120, -92, -95, -92, -80],
  Tcommaaccentodieresis: [-80, -80, -120, -120, -92, -95, -92, -80],
  Tcommaaccentograve: [-80, -80, -120, -120, -92, -95, -92, -80],
  Tcommaaccentohungarumlaut: [-80, -80, -120, -120, -92, -95, -92, -80],
  Tcommaaccentomacron: [-80, -80, -60, -60, -92, -95, -92, -80],
  Tcommaaccentoslash: [-80, -80, -120, -120, -92, -95, -92, -80],
  Tcommaaccentotilde: [-80, -80, -60, -60, -92, -95, -92, -80],
  Tcommaaccentperiod: [-80, -80, -120, -120, -90, -92, -74, -74],
  Tcommaaccentr: [-80, -80, -120, -120, -74, -37, -55, -35],
  Tcommaaccentracute: [-80, -80, -120, -120, -74, -37, -55, -35],
  Tcommaaccentrcommaaccent: [-80, -80, -120, -120, -74, -37, -55, -35],
  Tcommaaccentsemicolon: [-40, -40, -20, -20, -74, -74, -65, -55],
  Tcommaaccentu: [-90, -90, -120, -120, -92, -37, -55, -45],
  Tcommaaccentuacute: [-90, -90, -120, -120, -92, -37, -55, -45],
  Tcommaaccentucircumflex: [-90, -90, -120, -120, -92, -37, -55, -45],
  Tcommaaccentudieresis: [-90, -90, -120, -120, -92, -37, -55, -45],
  Tcommaaccentugrave: [-90, -90, -120, -120, -92, -37, -55, -45],
  Tcommaaccentuhungarumlaut: [-90, -90, -120, -120, -92, -37, -55, -45],
  Tcommaaccentumacron: [-90, -90, -60, -60, -92, -37, -55, -45],
  Tcommaaccentuogonek: [-90, -90, -120, -120, -92, -37, -55, -45],
  Tcommaaccenturing: [-90, -90, -120, -120, -92, -37, -55, -45],
  Tcommaaccentw: [-60, -60, -120, -120, -74, -37, -74, -80],
  Tcommaaccenty: [-60, -60, -120, -120, -34, -37, -74, -80],
  Tcommaaccentyacute: [-60, -60, -120, -120, -34, -37, -74, -80],
  Tcommaaccentydieresis: [-60, -60, -60, -60, -34, -37, -34, -80],
  UA: [-50, -50, -40, -40, -60, -45, -40, -40],
  UAacute: [-50, -50, -40, -40, -60, -45, -40, -40],
  UAbreve: [-50, -50, -40, -40, -60, -45, -40, -40],
  UAcircumflex: [-50, -50, -40, -40, -60, -45, -40, -40],
  UAdieresis: [-50, -50, -40, -40, -60, -45, -40, -40],
  UAgrave: [-50, -50, -40, -40, -60, -45, -40, -40],
  UAmacron: [-50, -50, -40, -40, -60, -45, -40, -40],
  UAogonek: [-50, -50, -40, -40, -60, -45, -40, -40],
  UAring: [-50, -50, -40, -40, -60, -45, -40, -40],
  UAtilde: [-50, -50, -40, -40, -60, -45, -40, -40],
  Ucomma: [-30, -30, -40, -40, -50, 0, -25],
  Uperiod: [-30, -30, -40, -40, -50, 0, -25],
  UacuteA: [-50, -50, -40, -40, -60, -45, -40, -40],
  UacuteAacute: [-50, -50, -40, -40, -60, -45, -40, -40],
  UacuteAbreve: [-50, -50, -40, -40, -60, -45, -40, -40],
  UacuteAcircumflex: [-50, -50, -40, -40, -60, -45, -40, -40],
  UacuteAdieresis: [-50, -50, -40, -40, -60, -45, -40, -40],
  UacuteAgrave: [-50, -50, -40, -40, -60, -45, -40, -40],
  UacuteAmacron: [-50, -50, -40, -40, -60, -45, -40, -40],
  UacuteAogonek: [-50, -50, -40, -40, -60, -45, -40, -40],
  UacuteAring: [-50, -50, -40, -40, -60, -45, -40, -40],
  UacuteAtilde: [-50, -50, -40, -40, -60, -45, -40, -40],
  Uacutecomma: [-30, -30, -40, -40, -50, 0, -25],
  Uacuteperiod: [-30, -30, -40, -40, -50, 0, -25],
  UcircumflexA: [-50, -50, -40, -40, -60, -45, -40, -40],
  UcircumflexAacute: [-50, -50, -40, -40, -60, -45, -40, -40],
  UcircumflexAbreve: [-50, -50, -40, -40, -60, -45, -40, -40],
  UcircumflexAcircumflex: [-50, -50, -40, -40, -60, -45, -40, -40],
  UcircumflexAdieresis: [-50, -50, -40, -40, -60, -45, -40, -40],
  UcircumflexAgrave: [-50, -50, -40, -40, -60, -45, -40, -40],
  UcircumflexAmacron: [-50, -50, -40, -40, -60, -45, -40, -40],
  UcircumflexAogonek: [-50, -50, -40, -40, -60, -45, -40, -40],
  UcircumflexAring: [-50, -50, -40, -40, -60, -45, -40, -40],
  UcircumflexAtilde: [-50, -50, -40, -40, -60, -45, -40, -40],
  Ucircumflexcomma: [-30, -30, -40, -40, -50, 0, -25],
  Ucircumflexperiod: [-30, -30, -40, -40, -50, 0, -25],
  UdieresisA: [-50, -50, -40, -40, -60, -45, -40, -40],
  UdieresisAacute: [-50, -50, -40, -40, -60, -45, -40, -40],
  UdieresisAbreve: [-50, -50, -40, -40, -60, -45, -40, -40],
  UdieresisAcircumflex: [-50, -50, -40, -40, -60, -45, -40, -40],
  UdieresisAdieresis: [-50, -50, -40, -40, -60, -45, -40, -40],
  UdieresisAgrave: [-50, -50, -40, -40, -60, -45, -40, -40],
  UdieresisAmacron: [-50, -50, -40, -40, -60, -45, -40, -40],
  UdieresisAogonek: [-50, -50, -40, -40, -60, -45, -40, -40],
  UdieresisAring: [-50, -50, -40, -40, -60, -45, -40, -40],
  UdieresisAtilde: [-50, -50, -40, -40, -60, -45, -40, -40],
  Udieresiscomma: [-30, -30, -40, -40, -50, 0, -25],
  Udieresisperiod: [-30, -30, -40, -40, -50, 0, -25],
  UgraveA: [-50, -50, -40, -40, -60, -45, -40, -40],
  UgraveAacute: [-50, -50, -40, -40, -60, -45, -40, -40],
  UgraveAbreve: [-50, -50, -40, -40, -60, -45, -40, -40],
  UgraveAcircumflex: [-50, -50, -40, -40, -60, -45, -40, -40],
  UgraveAdieresis: [-50, -50, -40, -40, -60, -45, -40, -40],
  UgraveAgrave: [-50, -50, -40, -40, -60, -45, -40, -40],
  UgraveAmacron: [-50, -50, -40, -40, -60, -45, -40, -40],
  UgraveAogonek: [-50, -50, -40, -40, -60, -45, -40, -40],
  UgraveAring: [-50, -50, -40, -40, -60, -45, -40, -40],
  UgraveAtilde: [-50, -50, -40, -40, -60, -45, -40, -40],
  Ugravecomma: [-30, -30, -40, -40, -50, 0, -25],
  Ugraveperiod: [-30, -30, -40, -40, -50, 0, -25],
  UhungarumlautA: [-50, -50, -40, -40, -60, -45, -40, -40],
  UhungarumlautAacute: [-50, -50, -40, -40, -60, -45, -40, -40],
  UhungarumlautAbreve: [-50, -50, -40, -40, -60, -45, -40, -40],
  UhungarumlautAcircumflex: [-50, -50, -40, -40, -60, -45, -40, -40],
  UhungarumlautAdieresis: [-50, -50, -40, -40, -60, -45, -40, -40],
  UhungarumlautAgrave: [-50, -50, -40, -40, -60, -45, -40, -40],
  UhungarumlautAmacron: [-50, -50, -40, -40, -60, -45, -40, -40],
  UhungarumlautAogonek: [-50, -50, -40, -40, -60, -45, -40, -40],
  UhungarumlautAring: [-50, -50, -40, -40, -60, -45, -40, -40],
  UhungarumlautAtilde: [-50, -50, -40, -40, -60, -45, -40, -40],
  Uhungarumlautcomma: [-30, -30, -40, -40, -50, 0, -25],
  Uhungarumlautperiod: [-30, -30, -40, -40, -50, 0, -25],
  UmacronA: [-50, -50, -40, -40, -60, -45, -40, -40],
  UmacronAacute: [-50, -50, -40, -40, -60, -45, -40, -40],
  UmacronAbreve: [-50, -50, -40, -40, -60, -45, -40, -40],
  UmacronAcircumflex: [-50, -50, -40, -40, -60, -45, -40, -40],
  UmacronAdieresis: [-50, -50, -40, -40, -60, -45, -40, -40],
  UmacronAgrave: [-50, -50, -40, -40, -60, -45, -40, -40],
  UmacronAmacron: [-50, -50, -40, -40, -60, -45, -40, -40],
  UmacronAogonek: [-50, -50, -40, -40, -60, -45, -40, -40],
  UmacronAring: [-50, -50, -40, -40, -60, -45, -40, -40],
  UmacronAtilde: [-50, -50, -40, -40, -60, -45, -40, -40],
  Umacroncomma: [-30, -30, -40, -40, -50, 0, -25],
  Umacronperiod: [-30, -30, -40, -40, -50, 0, -25],
  UogonekA: [-50, -50, -40, -40, -60, -45, -40, -40],
  UogonekAacute: [-50, -50, -40, -40, -60, -45, -40, -40],
  UogonekAbreve: [-50, -50, -40, -40, -60, -45, -40, -40],
  UogonekAcircumflex: [-50, -50, -40, -40, -60, -45, -40, -40],
  UogonekAdieresis: [-50, -50, -40, -40, -60, -45, -40, -40],
  UogonekAgrave: [-50, -50, -40, -40, -60, -45, -40, -40],
  UogonekAmacron: [-50, -50, -40, -40, -60, -45, -40, -40],
  UogonekAogonek: [-50, -50, -40, -40, -60, -45, -40, -40],
  UogonekAring: [-50, -50, -40, -40, -60, -45, -40, -40],
  UogonekAtilde: [-50, -50, -40, -40, -60, -45, -40, -40],
  Uogonekcomma: [-30, -30, -40, -40, -50, 0, -25],
  Uogonekperiod: [-30, -30, -40, -40, -50, 0, -25],
  UringA: [-50, -50, -40, -40, -60, -45, -40, -40],
  UringAacute: [-50, -50, -40, -40, -60, -45, -40, -40],
  UringAbreve: [-50, -50, -40, -40, -60, -45, -40, -40],
  UringAcircumflex: [-50, -50, -40, -40, -60, -45, -40, -40],
  UringAdieresis: [-50, -50, -40, -40, -60, -45, -40, -40],
  UringAgrave: [-50, -50, -40, -40, -60, -45, -40, -40],
  UringAmacron: [-50, -50, -40, -40, -60, -45, -40, -40],
  UringAogonek: [-50, -50, -40, -40, -60, -45, -40, -40],
  UringAring: [-50, -50, -40, -40, -60, -45, -40, -40],
  UringAtilde: [-50, -50, -40, -40, -60, -45, -40, -40],
  Uringcomma: [-30, -30, -40, -40, -50, 0, -25],
  Uringperiod: [-30, -30, -40, -40, -50, 0, -25],
  VA: [-80, -80, -80, -80, -135, -85, -60, -135],
  VAacute: [-80, -80, -80, -80, -135, -85, -60, -135],
  VAbreve: [-80, -80, -80, -80, -135, -85, -60, -135],
  VAcircumflex: [-80, -80, -80, -80, -135, -85, -60, -135],
  VAdieresis: [-80, -80, -80, -80, -135, -85, -60, -135],
  VAgrave: [-80, -80, -80, -80, -135, -85, -60, -135],
  VAmacron: [-80, -80, -80, -80, -135, -85, -60, -135],
  VAogonek: [-80, -80, -80, -80, -135, -85, -60, -135],
  VAring: [-80, -80, -80, -80, -135, -85, -60, -135],
  VAtilde: [-80, -80, -80, -80, -135, -85, -60, -135],
  VG: [-50, -50, -40, -40, -30, -10, 0, -15],
  VGbreve: [-50, -50, -40, -40, -30, -10, 0, -15],
  VGcommaaccent: [-50, -50, -40, -40, -30, -10, 0, -15],
  VO: [-50, -50, -40, -40, -45, -30, -30, -40],
  VOacute: [-50, -50, -40, -40, -45, -30, -30, -40],
  VOcircumflex: [-50, -50, -40, -40, -45, -30, -30, -40],
  VOdieresis: [-50, -50, -40, -40, -45, -30, -30, -40],
  VOgrave: [-50, -50, -40, -40, -45, -30, -30, -40],
  VOhungarumlaut: [-50, -50, -40, -40, -45, -30, -30, -40],
  VOmacron: [-50, -50, -40, -40, -45, -30, -30, -40],
  VOslash: [-50, -50, -40, -40, -45, -30, -30, -40],
  VOtilde: [-50, -50, -40, -40, -45, -30, -30, -40],
  Va: [-60, -60, -70, -70, -92, -111, -111, -111],
  Vaacute: [-60, -60, -70, -70, -92, -111, -111, -111],
  Vabreve: [-60, -60, -70, -70, -92, -111, -111, -111],
  Vacircumflex: [-60, -60, -70, -70, -92, -111, -111, -71],
  Vadieresis: [-60, -60, -70, -70, -92, -111, -111, -71],
  Vagrave: [-60, -60, -70, -70, -92, -111, -111, -71],
  Vamacron: [-60, -60, -70, -70, -92, -111, -111, -71],
  Vaogonek: [-60, -60, -70, -70, -92, -111, -111, -111],
  Varing: [-60, -60, -70, -70, -92, -111, -111, -111],
  Vatilde: [-60, -60, -70, -70, -92, -111, -111, -71],
  Vcolon: [-40, -40, -40, -40, -92, -74, -65, -74],
  Vcomma: [-120, -120, -125, -125, -129, -129, -129, -129],
  Ve: [-50, -50, -80, -80, -100, -111, -111, -111],
  Veacute: [-50, -50, -80, -80, -100, -111, -111, -111],
  Vecaron: [-50, -50, -80, -80, -100, -111, -111, -71],
  Vecircumflex: [-50, -50, -80, -80, -100, -111, -111, -71],
  Vedieresis: [-50, -50, -80, -80, -100, -71, -71, -71],
  Vedotaccent: [-50, -50, -80, -80, -100, -111, -111, -111],
  Vegrave: [-50, -50, -80, -80, -100, -71, -71, -71],
  Vemacron: [-50, -50, -80, -80, -100, -71, -71, -71],
  Veogonek: [-50, -50, -80, -80, -100, -111, -111, -111],
  Vhyphen: [-80, -80, -80, -80, -74, -70, -55, -100],
  Vo: [-90, -90, -80, -80, -100, -111, -111, -129],
  Voacute: [-90, -90, -80, -80, -100, -111, -111, -129],
  Vocircumflex: [-90, -90, -80, -80, -100, -111, -111, -129],
  Vodieresis: [-90, -90, -80, -80, -100, -111, -111, -89],
  Vograve: [-90, -90, -80, -80, -100, -111, -111, -89],
  Vohungarumlaut: [-90, -90, -80, -80, -100, -111, -111, -129],
  Vomacron: [-90, -90, -80, -80, -100, -111, -111, -89],
  Voslash: [-90, -90, -80, -80, -100, -111, -111, -129],
  Votilde: [-90, -90, -80, -80, -100, -111, -111, -89],
  Vperiod: [-120, -120, -125, -125, -145, -129, -129, -129],
  Vsemicolon: [-40, -40, -40, -40, -92, -74, -74, -74],
  Vu: [-60, -60, -70, -70, -92, -55, -74, -75],
  Vuacute: [-60, -60, -70, -70, -92, -55, -74, -75],
  Vucircumflex: [-60, -60, -70, -70, -92, -55, -74, -75],
  Vudieresis: [-60, -60, -70, -70, -92, -55, -74, -75],
  Vugrave: [-60, -60, -70, -70, -92, -55, -74, -75],
  Vuhungarumlaut: [-60, -60, -70, -70, -92, -55, -74, -75],
  Vumacron: [-60, -60, -70, -70, -92, -55, -74, -75],
  Vuogonek: [-60, -60, -70, -70, -92, -55, -74, -75],
  Vuring: [-60, -60, -70, -70, -92, -55, -74, -75],
  WA: [-60, -60, -50, -50, -120, -74, -60, -120],
  WAacute: [-60, -60, -50, -50, -120, -74, -60, -120],
  WAbreve: [-60, -60, -50, -50, -120, -74, -60, -120],
  WAcircumflex: [-60, -60, -50, -50, -120, -74, -60, -120],
  WAdieresis: [-60, -60, -50, -50, -120, -74, -60, -120],
  WAgrave: [-60, -60, -50, -50, -120, -74, -60, -120],
  WAmacron: [-60, -60, -50, -50, -120, -74, -60, -120],
  WAogonek: [-60, -60, -50, -50, -120, -74, -60, -120],
  WAring: [-60, -60, -50, -50, -120, -74, -60, -120],
  WAtilde: [-60, -60, -50, -50, -120, -74, -60, -120],
  WO: [-20, -20, -20, -20, -10, -15, -25, -10],
  WOacute: [-20, -20, -20, -20, -10, -15, -25, -10],
  WOcircumflex: [-20, -20, -20, -20, -10, -15, -25, -10],
  WOdieresis: [-20, -20, -20, -20, -10, -15, -25, -10],
  WOgrave: [-20, -20, -20, -20, -10, -15, -25, -10],
  WOhungarumlaut: [-20, -20, -20, -20, -10, -15, -25, -10],
  WOmacron: [-20, -20, -20, -20, -10, -15, -25, -10],
  WOslash: [-20, -20, -20, -20, -10, -15, -25, -10],
  WOtilde: [-20, -20, -20, -20, -10, -15, -25, -10],
  Wa: [-40, -40, -40, -40, -65, -85, -92, -80],
  Waacute: [-40, -40, -40, -40, -65, -85, -92, -80],
  Wabreve: [-40, -40, -40, -40, -65, -85, -92, -80],
  Wacircumflex: [-40, -40, -40, -40, -65, -85, -92, -80],
  Wadieresis: [-40, -40, -40, -40, -65, -85, -92, -80],
  Wagrave: [-40, -40, -40, -40, -65, -85, -92, -80],
  Wamacron: [-40, -40, -40, -40, -65, -85, -92, -80],
  Waogonek: [-40, -40, -40, -40, -65, -85, -92, -80],
  Waring: [-40, -40, -40, -40, -65, -85, -92, -80],
  Watilde: [-40, -40, -40, -40, -65, -85, -92, -80],
  Wcolon: [-10, -10, 0, 0, -55, -55, -65, -37],
  Wcomma: [-80, -80, -80, -80, -92, -74, -92, -92],
  We: [-35, -35, -30, -30, -65, -90, -92, -80],
  Weacute: [-35, -35, -30, -30, -65, -90, -92, -80],
  Wecaron: [-35, -35, -30, -30, -65, -90, -92, -80],
  Wecircumflex: [-35, -35, -30, -30, -65, -90, -92, -80],
  Wedieresis: [-35, -35, -30, -30, -65, -50, -52, -40],
  Wedotaccent: [-35, -35, -30, -30, -65, -90, -92, -80],
  Wegrave: [-35, -35, -30, -30, -65, -50, -52, -40],
  Wemacron: [-35, -35, -30, -30, -65, -50, -52, -40],
  Weogonek: [-35, -35, -30, -30, -65, -90, -92, -80],
  Whyphen: [-40, -40, -40, -40, -37, -50, -37, -65],
  Wo: [-60, -60, -30, -30, -75, -80, -92, -80],
  Woacute: [-60, -60, -30, -30, -75, -80, -92, -80],
  Wocircumflex: [-60, -60, -30, -30, -75, -80, -92, -80],
  Wodieresis: [-60, -60, -30, -30, -75, -80, -92, -80],
  Wograve: [-60, -60, -30, -30, -75, -80, -92, -80],
  Wohungarumlaut: [-60, -60, -30, -30, -75, -80, -92, -80],
  Womacron: [-60, -60, -30, -30, -75, -80, -92, -80],
  Woslash: [-60, -60, -30, -30, -75, -80, -92, -80],
  Wotilde: [-60, -60, -30, -30, -75, -80, -92, -80],
  Wperiod: [-80, -80, -80, -80, -92, -74, -92, -92],
  Wsemicolon: [-10, -10, 0, 0, -55, -55, -65, -37],
  Wu: [-45, -45, -30, -30, -50, -55, -55, -50],
  Wuacute: [-45, -45, -30, -30, -50, -55, -55, -50],
  Wucircumflex: [-45, -45, -30, -30, -50, -55, -55, -50],
  Wudieresis: [-45, -45, -30, -30, -50, -55, -55, -50],
  Wugrave: [-45, -45, -30, -30, -50, -55, -55, -50],
  Wuhungarumlaut: [-45, -45, -30, -30, -50, -55, -55, -50],
  Wumacron: [-45, -45, -30, -30, -50, -55, -55, -50],
  Wuogonek: [-45, -45, -30, -30, -50, -55, -55, -50],
  Wuring: [-45, -45, -30, -30, -50, -55, -55, -50],
  Wy: [-20, -20, -20, -20, -60, -55, -70, -73],
  Wyacute: [-20, -20, -20, -20, -60, -55, -70, -73],
  Wydieresis: [-20, -20, -20, -20, -60, -55, -70, -73],
  YA: [-110, -110, -110, -110, -110, -74, -50, -120],
  YAacute: [-110, -110, -110, -110, -110, -74, -50, -120],
  YAbreve: [-110, -110, -110, -110, -110, -74, -50, -120],
  YAcircumflex: [-110, -110, -110, -110, -110, -74, -50, -120],
  YAdieresis: [-110, -110, -110, -110, -110, -74, -50, -120],
  YAgrave: [-110, -110, -110, -110, -110, -74, -50, -120],
  YAmacron: [-110, -110, -110, -110, -110, -74, -50, -120],
  YAogonek: [-110, -110, -110, -110, -110, -74, -50, -120],
  YAring: [-110, -110, -110, -110, -110, -74, -50, -120],
  YAtilde: [-110, -110, -110, -110, -110, -74, -50, -120],
  YO: [-70, -70, -85, -85, -35, -25, -15, -30],
  YOacute: [-70, -70, -85, -85, -35, -25, -15, -30],
  YOcircumflex: [-70, -70, -85, -85, -35, -25, -15, -30],
  YOdieresis: [-70, -70, -85, -85, -35, -25, -15, -30],
  YOgrave: [-70, -70, -85, -85, -35, -25, -15, -30],
  YOhungarumlaut: [-70, -70, -85, -85, -35, -25, -15, -30],
  YOmacron: [-70, -70, -85, -85, -35, -25, -15, -30],
  YOslash: [-70, -70, -85, -85, -35, -25, -15, -30],
  YOtilde: [-70, -70, -85, -85, -35, -25, -15, -30],
  Ya: [-90, -90, -140, -140, -85, -92, -92, -100],
  Yaacute: [-90, -90, -140, -140, -85, -92, -92, -100],
  Yabreve: [-90, -90, -70, -70, -85, -92, -92, -100],
  Yacircumflex: [-90, -90, -140, -140, -85, -92, -92, -100],
  Yadieresis: [-90, -90, -140, -140, -85, -92, -92, -60],
  Yagrave: [-90, -90, -140, -140, -85, -92, -92, -60],
  Yamacron: [-90, -90, -70, -70, -85, -92, -92, -60],
  Yaogonek: [-90, -90, -140, -140, -85, -92, -92, -100],
  Yaring: [-90, -90, -140, -140, -85, -92, -92, -100],
  Yatilde: [-90, -90, -140, -140, -85, -92, -92, -60],
  Ycolon: [-50, -50, -60, -60, -92, -92, -65, -92],
  Ycomma: [-100, -100, -140, -140, -92, -92, -92, -129],
  Ye: [-80, -80, -140, -140, -111, -111, -92, -100],
  Yeacute: [-80, -80, -140, -140, -111, -111, -92, -100],
  Yecaron: [-80, -80, -140, -140, -111, -111, -92, -100],
  Yecircumflex: [-80, -80, -140, -140, -111, -71, -92, -100],
  Yedieresis: [-80, -80, -140, -140, -71, -71, -52, -60],
  Yedotaccent: [-80, -80, -140, -140, -111, -111, -92, -100],
  Yegrave: [-80, -80, -140, -140, -71, -71, -52, -60],
  Yemacron: [-80, -80, -70, -70, -71, -71, -52, -60],
  Yeogonek: [-80, -80, -140, -140, -111, -111, -92, -100],
  Yo: [-100, -100, -140, -140, -111, -111, -92, -110],
  Yoacute: [-100, -100, -140, -140, -111, -111, -92, -110],
  Yocircumflex: [-100, -100, -140, -140, -111, -111, -92, -110],
  Yodieresis: [-100, -100, -140, -140, -111, -111, -92, -70],
  Yograve: [-100, -100, -140, -140, -111, -111, -92, -70],
  Yohungarumlaut: [-100, -100, -140, -140, -111, -111, -92, -110],
  Yomacron: [-100, -100, -140, -140, -111, -111, -92, -70],
  Yoslash: [-100, -100, -140, -140, -111, -111, -92, -110],
  Yotilde: [-100, -100, -140, -140, -111, -111, -92, -70],
  Yperiod: [-100, -100, -140, -140, -92, -74, -92, -129],
  Ysemicolon: [-50, -50, -60, -60, -92, -92, -65, -92],
  Yu: [-100, -100, -110, -110, -92, -92, -92, -111],
  Yuacute: [-100, -100, -110, -110, -92, -92, -92, -111],
  Yucircumflex: [-100, -100, -110, -110, -92, -92, -92, -111],
  Yudieresis: [-100, -100, -110, -110, -92, -92, -92, -71],
  Yugrave: [-100, -100, -110, -110, -92, -92, -92, -71],
  Yuhungarumlaut: [-100, -100, -110, -110, -92, -92, -92, -111],
  Yumacron: [-100, -100, -110, -110, -92, -92, -92, -71],
  Yuogonek: [-100, -100, -110, -110, -92, -92, -92, -111],
  Yuring: [-100, -100, -110, -110, -92, -92, -92, -111],
  YacuteA: [-110, -110, -110, -110, -110, -74, -50, -120],
  YacuteAacute: [-110, -110, -110, -110, -110, -74, -50, -120],
  YacuteAbreve: [-110, -110, -110, -110, -110, -74, -50, -120],
  YacuteAcircumflex: [-110, -110, -110, -110, -110, -74, -50, -120],
  YacuteAdieresis: [-110, -110, -110, -110, -110, -74, -50, -120],
  YacuteAgrave: [-110, -110, -110, -110, -110, -74, -50, -120],
  YacuteAmacron: [-110, -110, -110, -110, -110, -74, -50, -120],
  YacuteAogonek: [-110, -110, -110, -110, -110, -74, -50, -120],
  YacuteAring: [-110, -110, -110, -110, -110, -74, -50, -120],
  YacuteAtilde: [-110, -110, -110, -110, -110, -74, -50, -120],
  YacuteO: [-70, -70, -85, -85, -35, -25, -15, -30],
  YacuteOacute: [-70, -70, -85, -85, -35, -25, -15, -30],
  YacuteOcircumflex: [-70, -70, -85, -85, -35, -25, -15, -30],
  YacuteOdieresis: [-70, -70, -85, -85, -35, -25, -15, -30],
  YacuteOgrave: [-70, -70, -85, -85, -35, -25, -15, -30],
  YacuteOhungarumlaut: [-70, -70, -85, -85, -35, -25, -15, -30],
  YacuteOmacron: [-70, -70, -85, -85, -35, -25, -15, -30],
  YacuteOslash: [-70, -70, -85, -85, -35, -25, -15, -30],
  YacuteOtilde: [-70, -70, -85, -85, -35, -25, -15, -30],
  Yacutea: [-90, -90, -140, -140, -85, -92, -92, -100],
  Yacuteaacute: [-90, -90, -140, -140, -85, -92, -92, -100],
  Yacuteabreve: [-90, -90, -70, -70, -85, -92, -92, -100],
  Yacuteacircumflex: [-90, -90, -140, -140, -85, -92, -92, -100],
  Yacuteadieresis: [-90, -90, -140, -140, -85, -92, -92, -60],
  Yacuteagrave: [-90, -90, -140, -140, -85, -92, -92, -60],
  Yacuteamacron: [-90, -90, -70, -70, -85, -92, -92, -60],
  Yacuteaogonek: [-90, -90, -140, -140, -85, -92, -92, -100],
  Yacutearing: [-90, -90, -140, -140, -85, -92, -92, -100],
  Yacuteatilde: [-90, -90, -70, -70, -85, -92, -92, -60],
  Yacutecolon: [-50, -50, -60, -60, -92, -92, -65, -92],
  Yacutecomma: [-100, -100, -140, -140, -92, -92, -92, -129],
  Yacutee: [-80, -80, -140, -140, -111, -111, -92, -100],
  Yacuteeacute: [-80, -80, -140, -140, -111, -111, -92, -100],
  Yacuteecaron: [-80, -80, -140, -140, -111, -111, -92, -100],
  Yacuteecircumflex: [-80, -80, -140, -140, -111, -71, -92, -100],
  Yacuteedieresis: [-80, -80, -140, -140, -71, -71, -52, -60],
  Yacuteedotaccent: [-80, -80, -140, -140, -111, -111, -92, -100],
  Yacuteegrave: [-80, -80, -140, -140, -71, -71, -52, -60],
  Yacuteemacron: [-80, -80, -70, -70, -71, -71, -52, -60],
  Yacuteeogonek: [-80, -80, -140, -140, -111, -111, -92, -100],
  Yacuteo: [-100, -100, -140, -140, -111, -111, -92, -110],
  Yacuteoacute: [-100, -100, -140, -140, -111, -111, -92, -110],
  Yacuteocircumflex: [-100, -100, -140, -140, -111, -111, -92, -110],
  Yacuteodieresis: [-100, -100, -140, -140, -111, -111, -92, -70],
  Yacuteograve: [-100, -100, -140, -140, -111, -111, -92, -70],
  Yacuteohungarumlaut: [-100, -100, -140, -140, -111, -111, -92, -110],
  Yacuteomacron: [-100, -100, -70, -70, -111, -111, -92, -70],
  Yacuteoslash: [-100, -100, -140, -140, -111, -111, -92, -110],
  Yacuteotilde: [-100, -100, -140, -140, -111, -111, -92, -70],
  Yacuteperiod: [-100, -100, -140, -140, -92, -74, -92, -129],
  Yacutesemicolon: [-50, -50, -60, -60, -92, -92, -65, -92],
  Yacuteu: [-100, -100, -110, -110, -92, -92, -92, -111],
  Yacuteuacute: [-100, -100, -110, -110, -92, -92, -92, -111],
  Yacuteucircumflex: [-100, -100, -110, -110, -92, -92, -92, -111],
  Yacuteudieresis: [-100, -100, -110, -110, -92, -92, -92, -71],
  Yacuteugrave: [-100, -100, -110, -110, -92, -92, -92, -71],
  Yacuteuhungarumlaut: [-100, -100, -110, -110, -92, -92, -92, -111],
  Yacuteumacron: [-100, -100, -110, -110, -92, -92, -92, -71],
  Yacuteuogonek: [-100, -100, -110, -110, -92, -92, -92, -111],
  Yacuteuring: [-100, -100, -110, -110, -92, -92, -92, -111],
  YdieresisA: [-110, -110, -110, -110, -110, -74, -50, -120],
  YdieresisAacute: [-110, -110, -110, -110, -110, -74, -50, -120],
  YdieresisAbreve: [-110, -110, -110, -110, -110, -74, -50, -120],
  YdieresisAcircumflex: [-110, -110, -110, -110, -110, -74, -50, -120],
  YdieresisAdieresis: [-110, -110, -110, -110, -110, -74, -50, -120],
  YdieresisAgrave: [-110, -110, -110, -110, -110, -74, -50, -120],
  YdieresisAmacron: [-110, -110, -110, -110, -110, -74, -50, -120],
  YdieresisAogonek: [-110, -110, -110, -110, -110, -74, -50, -120],
  YdieresisAring: [-110, -110, -110, -110, -110, -74, -50, -120],
  YdieresisAtilde: [-110, -110, -110, -110, -110, -74, -50, -120],
  YdieresisO: [-70, -70, -85, -85, -35, -25, -15, -30],
  YdieresisOacute: [-70, -70, -85, -85, -35, -25, -15, -30],
  YdieresisOcircumflex: [-70, -70, -85, -85, -35, -25, -15, -30],
  YdieresisOdieresis: [-70, -70, -85, -85, -35, -25, -15, -30],
  YdieresisOgrave: [-70, -70, -85, -85, -35, -25, -15, -30],
  YdieresisOhungarumlaut: [-70, -70, -85, -85, -35, -25, -15, -30],
  YdieresisOmacron: [-70, -70, -85, -85, -35, -25, -15, -30],
  YdieresisOslash: [-70, -70, -85, -85, -35, -25, -15, -30],
  YdieresisOtilde: [-70, -70, -85, -85, -35, -25, -15, -30],
  Ydieresisa: [-90, -90, -140, -140, -85, -92, -92, -100],
  Ydieresisaacute: [-90, -90, -140, -140, -85, -92, -92, -100],
  Ydieresisabreve: [-90, -90, -70, -70, -85, -92, -92, -100],
  Ydieresisacircumflex: [-90, -90, -140, -140, -85, -92, -92, -100],
  Ydieresisadieresis: [-90, -90, -140, -140, -85, -92, -92, -60],
  Ydieresisagrave: [-90, -90, -140, -140, -85, -92, -92, -60],
  Ydieresisamacron: [-90, -90, -70, -70, -85, -92, -92, -60],
  Ydieresisaogonek: [-90, -90, -140, -140, -85, -92, -92, -100],
  Ydieresisaring: [-90, -90, -140, -140, -85, -92, -92, -100],
  Ydieresisatilde: [-90, -90, -70, -70, -85, -92, -92, -100],
  Ydieresiscolon: [-50, -50, -60, -60, -92, -92, -65, -92],
  Ydieresiscomma: [-100, -100, -140, -140, -92, -92, -92, -129],
  Ydieresise: [-80, -80, -140, -140, -111, -111, -92, -100],
  Ydieresiseacute: [-80, -80, -140, -140, -111, -111, -92, -100],
  Ydieresisecaron: [-80, -80, -140, -140, -111, -111, -92, -100],
  Ydieresisecircumflex: [-80, -80, -140, -140, -111, -71, -92, -100],
  Ydieresisedieresis: [-80, -80, -140, -140, -71, -71, -52, -60],
  Ydieresisedotaccent: [-80, -80, -140, -140, -111, -111, -92, -100],
  Ydieresisegrave: [-80, -80, -140, -140, -71, -71, -52, -60],
  Ydieresisemacron: [-80, -80, -70, -70, -71, -71, -52, -60],
  Ydieresiseogonek: [-80, -80, -140, -140, -111, -111, -92, -100],
  Ydieresiso: [-100, -100, -140, -140, -111, -111, -92, -110],
  Ydieresisoacute: [-100, -100, -140, -140, -111, -111, -92, -110],
  Ydieresisocircumflex: [-100, -100, -140, -140, -111, -111, -92, -110],
  Ydieresisodieresis: [-100, -100, -140, -140, -111, -111, -92, -70],
  Ydieresisograve: [-100, -100, -140, -140, -111, -111, -92, -70],
  Ydieresisohungarumlaut: [-100, -100, -140, -140, -111, -111, -92, -110],
  Ydieresisomacron: [-100, -100, -140, -140, -111, -111, -92, -70],
  Ydieresisoslash: [-100, -100, -140, -140, -111, -111, -92, -110],
  Ydieresisotilde: [-100, -100, -140, -140, -111, -111, -92, -70],
  Ydieresisperiod: [-100, -100, -140, -140, -92, -74, -92, -129],
  Ydieresissemicolon: [-50, -50, -60, -60, -92, -92, -65, -92],
  Ydieresisu: [-100, -100, -110, -110, -92, -92, -92, -111],
  Ydieresisuacute: [-100, -100, -110, -110, -92, -92, -92, -111],
  Ydieresisucircumflex: [-100, -100, -110, -110, -92, -92, -92, -111],
  Ydieresisudieresis: [-100, -100, -110, -110, -92, -92, -92, -71],
  Ydieresisugrave: [-100, -100, -110, -110, -92, -92, -92, -71],
  Ydieresisuhungarumlaut: [-100, -100, -110, -110, -92, -92, -92, -111],
  Ydieresisumacron: [-100, -100, -110, -110, -92, -92, -92, -71],
  Ydieresisuogonek: [-100, -100, -110, -110, -92, -92, -92, -111],
  Ydieresisuring: [-100, -100, -110, -110, -92, -92, -92, -111],
  ag: [-10, -10, 0, 0, 0, 0, -10],
  agbreve: [-10, -10, 0, 0, 0, 0, -10],
  agcommaaccent: [-10, -10, 0, 0, 0, 0, -10],
  av: [-15, -15, -20, -20, -25, 0, 0, -20],
  aw: [-15, -15, -20, -20, 0, 0, 0, -15],
  ay: [-20, -20, -30, -30],
  ayacute: [-20, -20, -30, -30],
  aydieresis: [-20, -20, -30, -30],
  aacuteg: [-10, -10, 0, 0, 0, 0, -10],
  aacutegbreve: [-10, -10, 0, 0, 0, 0, -10],
  aacutegcommaaccent: [-10, -10, 0, 0, 0, 0, -10],
  aacutev: [-15, -15, -20, -20, -25, 0, 0, -20],
  aacutew: [-15, -15, -20, -20, 0, 0, 0, -15],
  aacutey: [-20, -20, -30, -30],
  aacuteyacute: [-20, -20, -30, -30],
  aacuteydieresis: [-20, -20, -30, -30],
  abreveg: [-10, -10, 0, 0, 0, 0, -10],
  abrevegbreve: [-10, -10, 0, 0, 0, 0, -10],
  abrevegcommaaccent: [-10, -10, 0, 0, 0, 0, -10],
  abrevev: [-15, -15, -20, -20, -25, 0, 0, -20],
  abrevew: [-15, -15, -20, -20, 0, 0, 0, -15],
  abrevey: [-20, -20, -30, -30],
  abreveyacute: [-20, -20, -30, -30],
  abreveydieresis: [-20, -20, -30, -30],
  acircumflexg: [-10, -10, 0, 0, 0, 0, -10],
  acircumflexgbreve: [-10, -10, 0, 0, 0, 0, -10],
  acircumflexgcommaaccent: [-10, -10, 0, 0, 0, 0, -10],
  acircumflexv: [-15, -15, -20, -20, -25, 0, 0, -20],
  acircumflexw: [-15, -15, -20, -20, 0, 0, 0, -15],
  acircumflexy: [-20, -20, -30, -30],
  acircumflexyacute: [-20, -20, -30, -30],
  acircumflexydieresis: [-20, -20, -30, -30],
  adieresisg: [-10, -10, 0, 0, 0, 0, -10],
  adieresisgbreve: [-10, -10, 0, 0, 0, 0, -10],
  adieresisgcommaaccent: [-10, -10, 0, 0, 0, 0, -10],
  adieresisv: [-15, -15, -20, -20, -25, 0, 0, -20],
  adieresisw: [-15, -15, -20, -20, 0, 0, 0, -15],
  adieresisy: [-20, -20, -30, -30],
  adieresisyacute: [-20, -20, -30, -30],
  adieresisydieresis: [-20, -20, -30, -30],
  agraveg: [-10, -10, 0, 0, 0, 0, -10],
  agravegbreve: [-10, -10, 0, 0, 0, 0, -10],
  agravegcommaaccent: [-10, -10, 0, 0, 0, 0, -10],
  agravev: [-15, -15, -20, -20, -25, 0, 0, -20],
  agravew: [-15, -15, -20, -20, 0, 0, 0, -15],
  agravey: [-20, -20, -30, -30],
  agraveyacute: [-20, -20, -30, -30],
  agraveydieresis: [-20, -20, -30, -30],
  amacrong: [-10, -10, 0, 0, 0, 0, -10],
  amacrongbreve: [-10, -10, 0, 0, 0, 0, -10],
  amacrongcommaaccent: [-10, -10, 0, 0, 0, 0, -10],
  amacronv: [-15, -15, -20, -20, -25, 0, 0, -20],
  amacronw: [-15, -15, -20, -20, 0, 0, 0, -15],
  amacrony: [-20, -20, -30, -30],
  amacronyacute: [-20, -20, -30, -30],
  amacronydieresis: [-20, -20, -30, -30],
  aogonekg: [-10, -10, 0, 0, 0, 0, -10],
  aogonekgbreve: [-10, -10, 0, 0, 0, 0, -10],
  aogonekgcommaaccent: [-10, -10, 0, 0, 0, 0, -10],
  aogonekv: [-15, -15, -20, -20, -25, 0, 0, -20],
  aogonekw: [-15, -15, -20, -20, 0, 0, 0, -15],
  aogoneky: [-20, -20, -30, -30],
  aogonekyacute: [-20, -20, -30, -30],
  aogonekydieresis: [-20, -20, -30, -30],
  aringg: [-10, -10, 0, 0, 0, 0, -10],
  aringgbreve: [-10, -10, 0, 0, 0, 0, -10],
  aringgcommaaccent: [-10, -10, 0, 0, 0, 0, -10],
  aringv: [-15, -15, -20, -20, -25, 0, 0, -20],
  aringw: [-15, -15, -20, -20, 0, 0, 0, -15],
  aringy: [-20, -20, -30, -30],
  aringyacute: [-20, -20, -30, -30],
  aringydieresis: [-20, -20, -30, -30],
  atildeg: [-10, -10, 0, 0, 0, 0, -10],
  atildegbreve: [-10, -10, 0, 0, 0, 0, -10],
  atildegcommaaccent: [-10, -10, 0, 0, 0, 0, -10],
  atildev: [-15, -15, -20, -20, -25, 0, 0, -20],
  atildew: [-15, -15, -20, -20, 0, 0, 0, -15],
  atildey: [-20, -20, -30, -30],
  atildeyacute: [-20, -20, -30, -30],
  atildeydieresis: [-20, -20, -30, -30],
  bl: [-10, -10, -20, -20],
  blacute: [-10, -10, -20, -20],
  blcommaaccent: [-10, -10, -20, -20],
  blslash: [-10, -10, -20, -20],
  bu: [-20, -20, -20, -20, -20, -20, -20, -20],
  buacute: [-20, -20, -20, -20, -20, -20, -20, -20],
  bucircumflex: [-20, -20, -20, -20, -20, -20, -20, -20],
  budieresis: [-20, -20, -20, -20, -20, -20, -20, -20],
  bugrave: [-20, -20, -20, -20, -20, -20, -20, -20],
  buhungarumlaut: [-20, -20, -20, -20, -20, -20, -20, -20],
  bumacron: [-20, -20, -20, -20, -20, -20, -20, -20],
  buogonek: [-20, -20, -20, -20, -20, -20, -20, -20],
  buring: [-20, -20, -20, -20, -20, -20, -20, -20],
  bv: [-20, -20, -20, -20, -15, 0, 0, -15],
  by: [-20, -20, -20, -20],
  byacute: [-20, -20, -20, -20],
  bydieresis: [-20, -20, -20, -20],
  ch: [-10, -10, 0, 0, 0, -10, -15],
  ck: [-20, -20, -20, -20, 0, -10, -20],
  ckcommaaccent: [-20, -20, -20, -20, 0, -10, -20],
  cl: [-20, -20],
  clacute: [-20, -20],
  clcommaaccent: [-20, -20],
  clslash: [-20, -20],
  cy: [-10, -10, 0, 0, 0, 0, 0, -15],
  cyacute: [-10, -10, 0, 0, 0, 0, 0, -15],
  cydieresis: [-10, -10, 0, 0, 0, 0, 0, -15],
  cacuteh: [-10, -10, 0, 0, 0, -10, -15],
  cacutek: [-20, -20, -20, -20, 0, -10, -20],
  cacutekcommaaccent: [-20, -20, -20, -20, 0, -10, -20],
  cacutel: [-20, -20],
  cacutelacute: [-20, -20],
  cacutelcommaaccent: [-20, -20],
  cacutelslash: [-20, -20],
  cacutey: [-10, -10, 0, 0, 0, 0, 0, -15],
  cacuteyacute: [-10, -10, 0, 0, 0, 0, 0, -15],
  cacuteydieresis: [-10, -10, 0, 0, 0, 0, 0, -15],
  ccaronh: [-10, -10, 0, 0, 0, -10, -15],
  ccaronk: [-20, -20, -20, -20, 0, -10, -20],
  ccaronkcommaaccent: [-20, -20, -20, -20, 0, -10, -20],
  ccaronl: [-20, -20],
  ccaronlacute: [-20, -20],
  ccaronlcommaaccent: [-20, -20],
  ccaronlslash: [-20, -20],
  ccarony: [-10, -10, 0, 0, 0, 0, 0, -15],
  ccaronyacute: [-10, -10, 0, 0, 0, 0, 0, -15],
  ccaronydieresis: [-10, -10, 0, 0, 0, 0, 0, -15],
  ccedillah: [-10, -10, 0, 0, 0, -10, -15],
  ccedillak: [-20, -20, -20, -20, 0, -10, -20],
  ccedillakcommaaccent: [-20, -20, -20, -20, 0, -10, -20],
  ccedillal: [-20, -20],
  ccedillalacute: [-20, -20],
  ccedillalcommaaccent: [-20, -20],
  ccedillalslash: [-20, -20],
  ccedillay: [-10, -10, 0, 0, 0, 0, 0, -15],
  ccedillayacute: [-10, -10, 0, 0, 0, 0, 0, -15],
  ccedillaydieresis: [-10, -10, 0, 0, 0, 0, 0, -15],
  colonspace: [-40, -40, -50, -50],
  commaquotedblright: [-120, -120, -100, -100, -45, -95, -140, -70],
  commaquoteright: [-120, -120, -100, -100, -55, -95, -140, -70],
  commaspace: [-40, -40],
  dd: [-10, -10],
  ddcroat: [-10, -10],
  dv: [-15, -15],
  dw: [-15, -15, 0, 0, -15],
  dy: [-15, -15],
  dyacute: [-15, -15],
  dydieresis: [-15, -15],
  dcroatd: [-10, -10],
  dcroatdcroat: [-10, -10],
  dcroatv: [-15, -15],
  dcroatw: [-15, -15, 0, 0, -15],
  dcroaty: [-15, -15],
  dcroatyacute: [-15, -15],
  dcroatydieresis: [-15, -15],
  ecomma: [10, 10, -15, -15, 0, 0, -10],
  eperiod: [20, 20, -15, -15, 0, 0, -15],
  ev: [-15, -15, -30, -30, -15, 0, -15, -25],
  ew: [-15, -15, -20, -20, 0, 0, -15, -25],
  ex: [-15, -15, -30, -30, 0, 0, -20, -15],
  ey: [-15, -15, -20, -20, 0, 0, -30, -15],
  eyacute: [-15, -15, -20, -20, 0, 0, -30, -15],
  eydieresis: [-15, -15, -20, -20, 0, 0, -30, -15],
  eacutecomma: [10, 10, -15, -15, 0, 0, -10],
  eacuteperiod: [20, 20, -15, -15, 0, 0, -15],
  eacutev: [-15, -15, -30, -30, -15, 0, -15, -25],
  eacutew: [-15, -15, -20, -20, 0, 0, -15, -25],
  eacutex: [-15, -15, -30, -30, 0, 0, -20, -15],
  eacutey: [-15, -15, -20, -20, 0, 0, -30, -15],
  eacuteyacute: [-15, -15, -20, -20, 0, 0, -30, -15],
  eacuteydieresis: [-15, -15, -20, -20, 0, 0, -30, -15],
  ecaroncomma: [10, 10, -15, -15, 0, 0, -10],
  ecaronperiod: [20, 20, -15, -15, 0, 0, -15],
  ecaronv: [-15, -15, -30, -30, -15, 0, -15, -25],
  ecaronw: [-15, -15, -20, -20, 0, 0, -15, -25],
  ecaronx: [-15, -15, -30, -30, 0, 0, -20, -15],
  ecarony: [-15, -15, -20, -20, 0, 0, -30, -15],
  ecaronyacute: [-15, -15, -20, -20, 0, 0, -30, -15],
  ecaronydieresis: [-15, -15, -20, -20, 0, 0, -30, -15],
  ecircumflexcomma: [10, 10, -15, -15, 0, 0, -10],
  ecircumflexperiod: [20, 20, -15, -15, 0, 0, -15],
  ecircumflexv: [-15, -15, -30, -30, -15, 0, -15, -25],
  ecircumflexw: [-15, -15, -20, -20, 0, 0, -15, -25],
  ecircumflexx: [-15, -15, -30, -30, 0, 0, -20, -15],
  ecircumflexy: [-15, -15, -20, -20, 0, 0, -30, -15],
  ecircumflexyacute: [-15, -15, -20, -20, 0, 0, -30, -15],
  ecircumflexydieresis: [-15, -15, -20, -20, 0, 0, -30, -15],
  edieresiscomma: [10, 10, -15, -15, 0, 0, -10],
  edieresisperiod: [20, 20, -15, -15, 0, 0, -15],
  edieresisv: [-15, -15, -30, -30, -15, 0, -15, -25],
  edieresisw: [-15, -15, -20, -20, 0, 0, -15, -25],
  edieresisx: [-15, -15, -30, -30, 0, 0, -20, -15],
  edieresisy: [-15, -15, -20, -20, 0, 0, -30, -15],
  edieresisyacute: [-15, -15, -20, -20, 0, 0, -30, -15],
  edieresisydieresis: [-15, -15, -20, -20, 0, 0, -30, -15],
  edotaccentcomma: [10, 10, -15, -15, 0, 0, -10],
  edotaccentperiod: [20, 20, -15, -15, 0, 0, -15],
  edotaccentv: [-15, -15, -30, -30, -15, 0, -15, -25],
  edotaccentw: [-15, -15, -20, -20, 0, 0, -15, -25],
  edotaccentx: [-15, -15, -30, -30, 0, 0, -20, -15],
  edotaccenty: [-15, -15, -20, -20, 0, 0, -30, -15],
  edotaccentyacute: [-15, -15, -20, -20, 0, 0, -30, -15],
  edotaccentydieresis: [-15, -15, -20, -20, 0, 0, -30, -15],
  egravecomma: [10, 10, -15, -15, 0, 0, -10],
  egraveperiod: [20, 20, -15, -15, 0, 0, -15],
  egravev: [-15, -15, -30, -30, -15, 0, -15, -25],
  egravew: [-15, -15, -20, -20, 0, 0, -15, -25],
  egravex: [-15, -15, -30, -30, 0, 0, -20, -15],
  egravey: [-15, -15, -20, -20, 0, 0, -30, -15],
  egraveyacute: [-15, -15, -20, -20, 0, 0, -30, -15],
  egraveydieresis: [-15, -15, -20, -20, 0, 0, -30, -15],
  emacroncomma: [10, 10, -15, -15, 0, 0, -10],
  emacronperiod: [20, 20, -15, -15, 0, 0, -15],
  emacronv: [-15, -15, -30, -30, -15, 0, -15, -25],
  emacronw: [-15, -15, -20, -20, 0, 0, -15, -25],
  emacronx: [-15, -15, -30, -30, 0, 0, -20, -15],
  emacrony: [-15, -15, -20, -20, 0, 0, -30, -15],
  emacronyacute: [-15, -15, -20, -20, 0, 0, -30, -15],
  emacronydieresis: [-15, -15, -20, -20, 0, 0, -30, -15],
  eogonekcomma: [10, 10, -15, -15, 0, 0, -10],
  eogonekperiod: [20, 20, -15, -15, 0, 0, -15],
  eogonekv: [-15, -15, -30, -30, -15, 0, -15, -25],
  eogonekw: [-15, -15, -20, -20, 0, 0, -15, -25],
  eogonekx: [-15, -15, -30, -30, 0, 0, -20, -15],
  eogoneky: [-15, -15, -20, -20, 0, 0, -30, -15],
  eogonekyacute: [-15, -15, -20, -20, 0, 0, -30, -15],
  eogonekydieresis: [-15, -15, -20, -20, 0, 0, -30, -15],
  fcomma: [-10, -10, -30, -30, -15, -10, -10],
  fe: [-10, -10, -30, -30, 0, -10],
  feacute: [-10, -10, -30, -30, 0, -10],
  fecaron: [-10, -10, -30, -30],
  fecircumflex: [-10, -10, -30, -30],
  fedieresis: [-10, -10, -30, -30],
  fedotaccent: [-10, -10, -30, -30, 0, -10],
  fegrave: [-10, -10, -30, -30],
  femacron: [-10, -10, -30, -30],
  feogonek: [-10, -10, -30, -30, 0, -10],
  fo: [-20, -20, -30, -30, -25, -10],
  foacute: [-20, -20, -30, -30, -25, -10],
  focircumflex: [-20, -20, -30, -30, -25, -10],
  fodieresis: [-20, -20, -30, -30, -25],
  fograve: [-20, -20, -30, -30, -25, -10],
  fohungarumlaut: [-20, -20, -30, -30, -25, -10],
  fomacron: [-20, -20, -30, -30, -25],
  foslash: [-20, -20, -30, -30, -25, -10],
  fotilde: [-20, -20, -30, -30, -25, -10],
  fperiod: [-10, -10, -30, -30, -15, -10, -15],
  fquotedblright: [30, 30, 60, 60, 50],
  fquoteright: [30, 30, 50, 50, 55, 55, 92, 55],
  ge: [10, 10, 0, 0, 0, 0, -10],
  geacute: [10, 10, 0, 0, 0, 0, -10],
  gecaron: [10, 10, 0, 0, 0, 0, -10],
  gecircumflex: [10, 10, 0, 0, 0, 0, -10],
  gedieresis: [10, 10, 0, 0, 0, 0, -10],
  gedotaccent: [10, 10, 0, 0, 0, 0, -10],
  gegrave: [10, 10, 0, 0, 0, 0, -10],
  gemacron: [10, 10, 0, 0, 0, 0, -10],
  geogonek: [10, 10, 0, 0, 0, 0, -10],
  gg: [-10, -10, 0, 0, 0, 0, -10],
  ggbreve: [-10, -10, 0, 0, 0, 0, -10],
  ggcommaaccent: [-10, -10, 0, 0, 0, 0, -10],
  gbrevee: [10, 10, 0, 0, 0, 0, -10],
  gbreveeacute: [10, 10, 0, 0, 0, 0, -10],
  gbreveecaron: [10, 10, 0, 0, 0, 0, -10],
  gbreveecircumflex: [10, 10, 0, 0, 0, 0, -10],
  gbreveedieresis: [10, 10, 0, 0, 0, 0, -10],
  gbreveedotaccent: [10, 10, 0, 0, 0, 0, -10],
  gbreveegrave: [10, 10, 0, 0, 0, 0, -10],
  gbreveemacron: [10, 10, 0, 0, 0, 0, -10],
  gbreveeogonek: [10, 10, 0, 0, 0, 0, -10],
  gbreveg: [-10, -10, 0, 0, 0, 0, -10],
  gbrevegbreve: [-10, -10, 0, 0, 0, 0, -10],
  gbrevegcommaaccent: [-10, -10, 0, 0, 0, 0, -10],
  gcommaaccente: [10, 10, 0, 0, 0, 0, -10],
  gcommaaccenteacute: [10, 10, 0, 0, 0, 0, -10],
  gcommaaccentecaron: [10, 10, 0, 0, 0, 0, -10],
  gcommaaccentecircumflex: [10, 10, 0, 0, 0, 0, -10],
  gcommaaccentedieresis: [10, 10, 0, 0, 0, 0, -10],
  gcommaaccentedotaccent: [10, 10, 0, 0, 0, 0, -10],
  gcommaaccentegrave: [10, 10, 0, 0, 0, 0, -10],
  gcommaaccentemacron: [10, 10, 0, 0, 0, 0, -10],
  gcommaaccenteogonek: [10, 10, 0, 0, 0, 0, -10],
  gcommaaccentg: [-10, -10, 0, 0, 0, 0, -10],
  gcommaaccentgbreve: [-10, -10, 0, 0, 0, 0, -10],
  gcommaaccentgcommaaccent: [-10, -10, 0, 0, 0, 0, -10],
  hy: [-20, -20, -30, -30, -15, 0, 0, -5],
  hyacute: [-20, -20, -30, -30, -15, 0, 0, -5],
  hydieresis: [-20, -20, -30, -30, -15, 0, 0, -5],
  ko: [-15, -15, -20, -20, -15, -10, -10, -10],
  koacute: [-15, -15, -20, -20, -15, -10, -10, -10],
  kocircumflex: [-15, -15, -20, -20, -15, -10, -10, -10],
  kodieresis: [-15, -15, -20, -20, -15, -10, -10, -10],
  kograve: [-15, -15, -20, -20, -15, -10, -10, -10],
  kohungarumlaut: [-15, -15, -20, -20, -15, -10, -10, -10],
  komacron: [-15, -15, -20, -20, -15, -10, -10, -10],
  koslash: [-15, -15, -20, -20, -15, -10, -10, -10],
  kotilde: [-15, -15, -20, -20, -15, -10, -10, -10],
  kcommaaccento: [-15, -15, -20, -20, -15, -10, -10, -10],
  kcommaaccentoacute: [-15, -15, -20, -20, -15, -10, -10, -10],
  kcommaaccentocircumflex: [-15, -15, -20, -20, -15, -10, -10, -10],
  kcommaaccentodieresis: [-15, -15, -20, -20, -15, -10, -10, -10],
  kcommaaccentograve: [-15, -15, -20, -20, -15, -10, -10, -10],
  kcommaaccentohungarumlaut: [-15, -15, -20, -20, -15, -10, -10, -10],
  kcommaaccentomacron: [-15, -15, -20, -20, -15, -10, -10, -10],
  kcommaaccentoslash: [-15, -15, -20, -20, -15, -10, -10, -10],
  kcommaaccentotilde: [-15, -15, -20, -20, -15, -10, -10, -10],
  lw: [-15, -15, 0, 0, 0, 0, 0, -10],
  ly: [-15, -15],
  lyacute: [-15, -15],
  lydieresis: [-15, -15],
  lacutew: [-15, -15, 0, 0, 0, 0, 0, -10],
  lacutey: [-15, -15],
  lacuteyacute: [-15, -15],
  lacuteydieresis: [-15, -15],
  lcommaaccentw: [-15, -15, 0, 0, 0, 0, 0, -10],
  lcommaaccenty: [-15, -15],
  lcommaaccentyacute: [-15, -15],
  lcommaaccentydieresis: [-15, -15],
  lslashw: [-15, -15, 0, 0, 0, 0, 0, -10],
  lslashy: [-15, -15],
  lslashyacute: [-15, -15],
  lslashydieresis: [-15, -15],
  mu: [-20, -20, -10, -10],
  muacute: [-20, -20, -10, -10],
  mucircumflex: [-20, -20, -10, -10],
  mudieresis: [-20, -20, -10, -10],
  mugrave: [-20, -20, -10, -10],
  muhungarumlaut: [-20, -20, -10, -10],
  mumacron: [-20, -20, -10, -10],
  muogonek: [-20, -20, -10, -10],
  muring: [-20, -20, -10, -10],
  my: [-30, -30, -15, -15],
  myacute: [-30, -30, -15, -15],
  mydieresis: [-30, -30, -15, -15],
  nu: [-10, -10, -10, -10],
  nuacute: [-10, -10, -10, -10],
  nucircumflex: [-10, -10, -10, -10],
  nudieresis: [-10, -10, -10, -10],
  nugrave: [-10, -10, -10, -10],
  nuhungarumlaut: [-10, -10, -10, -10],
  numacron: [-10, -10, -10, -10],
  nuogonek: [-10, -10, -10, -10],
  nuring: [-10, -10, -10, -10],
  nv: [-40, -40, -20, -20, -40, -40, -40, -40],
  ny: [-20, -20, -15, -15, 0, 0, 0, -15],
  nyacute: [-20, -20, -15, -15, 0, 0, 0, -15],
  nydieresis: [-20, -20, -15, -15, 0, 0, 0, -15],
  nacuteu: [-10, -10, -10, -10],
  nacuteuacute: [-10, -10, -10, -10],
  nacuteucircumflex: [-10, -10, -10, -10],
  nacuteudieresis: [-10, -10, -10, -10],
  nacuteugrave: [-10, -10, -10, -10],
  nacuteuhungarumlaut: [-10, -10, -10, -10],
  nacuteumacron: [-10, -10, -10, -10],
  nacuteuogonek: [-10, -10, -10, -10],
  nacuteuring: [-10, -10, -10, -10],
  nacutev: [-40, -40, -20, -20, -40, -40, -40, -40],
  nacutey: [-20, -20, -15, -15, 0, 0, 0, -15],
  nacuteyacute: [-20, -20, -15, -15, 0, 0, 0, -15],
  nacuteydieresis: [-20, -20, -15, -15, 0, 0, 0, -15],
  ncaronu: [-10, -10, -10, -10],
  ncaronuacute: [-10, -10, -10, -10],
  ncaronucircumflex: [-10, -10, -10, -10],
  ncaronudieresis: [-10, -10, -10, -10],
  ncaronugrave: [-10, -10, -10, -10],
  ncaronuhungarumlaut: [-10, -10, -10, -10],
  ncaronumacron: [-10, -10, -10, -10],
  ncaronuogonek: [-10, -10, -10, -10],
  ncaronuring: [-10, -10, -10, -10],
  ncaronv: [-40, -40, -20, -20, -40, -40, -40, -40],
  ncarony: [-20, -20, -15, -15, 0, 0, 0, -15],
  ncaronyacute: [-20, -20, -15, -15, 0, 0, 0, -15],
  ncaronydieresis: [-20, -20, -15, -15, 0, 0, 0, -15],
  ncommaaccentu: [-10, -10, -10, -10],
  ncommaaccentuacute: [-10, -10, -10, -10],
  ncommaaccentucircumflex: [-10, -10, -10, -10],
  ncommaaccentudieresis: [-10, -10, -10, -10],
  ncommaaccentugrave: [-10, -10, -10, -10],
  ncommaaccentuhungarumlaut: [-10, -10, -10, -10],
  ncommaaccentumacron: [-10, -10, -10, -10],
  ncommaaccentuogonek: [-10, -10, -10, -10],
  ncommaaccenturing: [-10, -10, -10, -10],
  ncommaaccentv: [-40, -40, -20, -20, -40, -40, -40, -40],
  ncommaaccenty: [-20, -20, -15, -15, 0, 0, 0, -15],
  ncommaaccentyacute: [-20, -20, -15, -15, 0, 0, 0, -15],
  ncommaaccentydieresis: [-20, -20, -15, -15, 0, 0, 0, -15],
  ntildeu: [-10, -10, -10, -10],
  ntildeuacute: [-10, -10, -10, -10],
  ntildeucircumflex: [-10, -10, -10, -10],
  ntildeudieresis: [-10, -10, -10, -10],
  ntildeugrave: [-10, -10, -10, -10],
  ntildeuhungarumlaut: [-10, -10, -10, -10],
  ntildeumacron: [-10, -10, -10, -10],
  ntildeuogonek: [-10, -10, -10, -10],
  ntildeuring: [-10, -10, -10, -10],
  ntildev: [-40, -40, -20, -20, -40, -40, -40, -40],
  ntildey: [-20, -20, -15, -15, 0, 0, 0, -15],
  ntildeyacute: [-20, -20, -15, -15, 0, 0, 0, -15],
  ntildeydieresis: [-20, -20, -15, -15, 0, 0, 0, -15],
  ov: [-20, -20, -15, -15, -10, -15, -10, -15],
  ow: [-15, -15, -15, -15, -10, -25, 0, -25],
  ox: [-30, -30, -30, -30, 0, -10],
  oy: [-20, -20, -30, -30, 0, -10, 0, -10],
  oyacute: [-20, -20, -30, -30, 0, -10, 0, -10],
  oydieresis: [-20, -20, -30, -30, 0, -10, 0, -10],
  oacutev: [-20, -20, -15, -15, -10, -15, -10, -15],
  oacutew: [-15, -15, -15, -15, -10, -25, 0, -25],
  oacutex: [-30, -30, -30, -30, 0, -10],
  oacutey: [-20, -20, -30, -30, 0, -10, 0, -10],
  oacuteyacute: [-20, -20, -30, -30, 0, -10, 0, -10],
  oacuteydieresis: [-20, -20, -30, -30, 0, -10, 0, -10],
  ocircumflexv: [-20, -20, -15, -15, -10, -15, -10, -15],
  ocircumflexw: [-15, -15, -15, -15, -10, -25, 0, -25],
  ocircumflexx: [-30, -30, -30, -30, 0, -10],
  ocircumflexy: [-20, -20, -30, -30, 0, -10, 0, -10],
  ocircumflexyacute: [-20, -20, -30, -30, 0, -10, 0, -10],
  ocircumflexydieresis: [-20, -20, -30, -30, 0, -10, 0, -10],
  odieresisv: [-20, -20, -15, -15, -10, -15, -10, -15],
  odieresisw: [-15, -15, -15, -15, -10, -25, 0, -25],
  odieresisx: [-30, -30, -30, -30, 0, -10],
  odieresisy: [-20, -20, -30, -30, 0, -10, 0, -10],
  odieresisyacute: [-20, -20, -30, -30, 0, -10, 0, -10],
  odieresisydieresis: [-20, -20, -30, -30, 0, -10, 0, -10],
  ogravev: [-20, -20, -15, -15, -10, -15, -10, -15],
  ogravew: [-15, -15, -15, -15, -10, -25, 0, -25],
  ogravex: [-30, -30, -30, -30, 0, -10],
  ogravey: [-20, -20, -30, -30, 0, -10, 0, -10],
  ograveyacute: [-20, -20, -30, -30, 0, -10, 0, -10],
  ograveydieresis: [-20, -20, -30, -30, 0, -10, 0, -10],
  ohungarumlautv: [-20, -20, -15, -15, -10, -15, -10, -15],
  ohungarumlautw: [-15, -15, -15, -15, -10, -25, 0, -25],
  ohungarumlautx: [-30, -30, -30, -30, 0, -10],
  ohungarumlauty: [-20, -20, -30, -30, 0, -10, 0, -10],
  ohungarumlautyacute: [-20, -20, -30, -30, 0, -10, 0, -10],
  ohungarumlautydieresis: [-20, -20, -30, -30, 0, -10, 0, -10],
  omacronv: [-20, -20, -15, -15, -10, -15, -10, -15],
  omacronw: [-15, -15, -15, -15, -10, -25, 0, -25],
  omacronx: [-30, -30, -30, -30, 0, -10],
  omacrony: [-20, -20, -30, -30, 0, -10, 0, -10],
  omacronyacute: [-20, -20, -30, -30, 0, -10, 0, -10],
  omacronydieresis: [-20, -20, -30, -30, 0, -10, 0, -10],
  oslashv: [-20, -20, -70, -70, -10, -15, -10, -15],
  oslashw: [-15, -15, -70, -70, -10, -25, 0, -25],
  oslashx: [-30, -30, -85, -85, 0, -10],
  oslashy: [-20, -20, -70, -70, 0, -10, 0, -10],
  oslashyacute: [-20, -20, -70, -70, 0, -10, 0, -10],
  oslashydieresis: [-20, -20, -70, -70, 0, -10, 0, -10],
  otildev: [-20, -20, -15, -15, -10, -15, -10, -15],
  otildew: [-15, -15, -15, -15, -10, -25, 0, -25],
  otildex: [-30, -30, -30, -30, 0, -10],
  otildey: [-20, -20, -30, -30, 0, -10, 0, -10],
  otildeyacute: [-20, -20, -30, -30, 0, -10, 0, -10],
  otildeydieresis: [-20, -20, -30, -30, 0, -10, 0, -10],
  py: [-15, -15, -30, -30, 0, 0, 0, -10],
  pyacute: [-15, -15, -30, -30, 0, 0, 0, -10],
  pydieresis: [-15, -15, -30, -30, 0, 0, 0, -10],
  periodquotedblright: [-120, -120, -100, -100, -55, -95, -140, -70],
  periodquoteright: [-120, -120, -100, -100, -55, -95, -140, -70],
  periodspace: [-40, -40, -60, -60],
  quotedblrightspace: [-80, -80, -40, -40],
  quoteleftquoteleft: [-46, -46, -57, -57, -63, -74, -111, -74],
  quoterightd: [-80, -80, -50, -50, -20, -15, -25, -50],
  quoterightdcroat: [-80, -80, -50, -50, -20, -15, -25, -50],
  quoterightl: [-20, -20, 0, 0, 0, 0, 0, -10],
  quoterightlacute: [-20, -20, 0, 0, 0, 0, 0, -10],
  quoterightlcommaaccent: [-20, -20, 0, 0, 0, 0, 0, -10],
  quoterightlslash: [-20, -20, 0, 0, 0, 0, 0, -10],
  quoterightquoteright: [-46, -46, -57, -57, -63, -74, -111, -74],
  quoterightr: [-40, -40, -50, -50, -20, -15, -25, -50],
  quoterightracute: [-40, -40, -50, -50, -20, -15, -25, -50],
  quoterightrcaron: [-40, -40, -50, -50, -20, -15, -25, -50],
  quoterightrcommaaccent: [-40, -40, -50, -50, -20, -15, -25, -50],
  quoterights: [-60, -60, -50, -50, -37, -74, -40, -55],
  quoterightsacute: [-60, -60, -50, -50, -37, -74, -40, -55],
  quoterightscaron: [-60, -60, -50, -50, -37, -74, -40, -55],
  quoterightscedilla: [-60, -60, -50, -50, -37, -74, -40, -55],
  quoterightscommaaccent: [-60, -60, -50, -50, -37, -74, -40, -55],
  quoterightspace: [-80, -80, -70, -70, -74, -74, -111, -74],
  quoterightv: [-20, -20, 0, 0, -20, -15, -10, -50],
  rc: [-20, -20, 0, 0, -18, 0, -37],
  rcacute: [-20, -20, 0, 0, -18, 0, -37],
  rccaron: [-20, -20, 0, 0, -18, 0, -37],
  rccedilla: [-20, -20, 0, 0, -18, 0, -37],
  rcomma: [-60, -60, -50, -50, -92, -65, -111, -40],
  rd: [-20, -20, 0, 0, 0, 0, -37],
  rdcroat: [-20, -20, 0, 0, 0, 0, -37],
  rg: [-15, -15, 0, 0, -10, 0, -37, -18],
  rgbreve: [-15, -15, 0, 0, -10, 0, -37, -18],
  rgcommaaccent: [-15, -15, 0, 0, -10, 0, -37, -18],
  rhyphen: [-20, -20, 0, 0, -37, 0, -20, -20],
  ro: [-20, -20, 0, 0, -18, 0, -45],
  roacute: [-20, -20, 0, 0, -18, 0, -45],
  rocircumflex: [-20, -20, 0, 0, -18, 0, -45],
  rodieresis: [-20, -20, 0, 0, -18, 0, -45],
  rograve: [-20, -20, 0, 0, -18, 0, -45],
  rohungarumlaut: [-20, -20, 0, 0, -18, 0, -45],
  romacron: [-20, -20, 0, 0, -18, 0, -45],
  roslash: [-20, -20, 0, 0, -18, 0, -45],
  rotilde: [-20, -20, 0, 0, -18, 0, -45],
  rperiod: [-60, -60, -50, -50, -100, -65, -111, -55],
  rq: [-20, -20, 0, 0, -18, 0, -37],
  rs: [-15, -15, 0, 0, 0, 0, -10],
  rsacute: [-15, -15, 0, 0, 0, 0, -10],
  rscaron: [-15, -15, 0, 0, 0, 0, -10],
  rscedilla: [-15, -15, 0, 0, 0, 0, -10],
  rscommaaccent: [-15, -15, 0, 0, 0, 0, -10],
  rt: [20, 20, 40, 40],
  rtcommaaccent: [20, 20, 40, 40],
  rv: [10, 10, 30, 30, -10],
  ry: [10, 10, 30, 30],
  ryacute: [10, 10, 30, 30],
  rydieresis: [10, 10, 30, 30],
  racutec: [-20, -20, 0, 0, -18, 0, -37],
  racutecacute: [-20, -20, 0, 0, -18, 0, -37],
  racuteccaron: [-20, -20, 0, 0, -18, 0, -37],
  racuteccedilla: [-20, -20, 0, 0, -18, 0, -37],
  racutecomma: [-60, -60, -50, -50, -92, -65, -111, -40],
  racuted: [-20, -20, 0, 0, 0, 0, -37],
  racutedcroat: [-20, -20, 0, 0, 0, 0, -37],
  racuteg: [-15, -15, 0, 0, -10, 0, -37, -18],
  racutegbreve: [-15, -15, 0, 0, -10, 0, -37, -18],
  racutegcommaaccent: [-15, -15, 0, 0, -10, 0, -37, -18],
  racutehyphen: [-20, -20, 0, 0, -37, 0, -20, -20],
  racuteo: [-20, -20, 0, 0, -18, 0, -45],
  racuteoacute: [-20, -20, 0, 0, -18, 0, -45],
  racuteocircumflex: [-20, -20, 0, 0, -18, 0, -45],
  racuteodieresis: [-20, -20, 0, 0, -18, 0, -45],
  racuteograve: [-20, -20, 0, 0, -18, 0, -45],
  racuteohungarumlaut: [-20, -20, 0, 0, -18, 0, -45],
  racuteomacron: [-20, -20, 0, 0, -18, 0, -45],
  racuteoslash: [-20, -20, 0, 0, -18, 0, -45],
  racuteotilde: [-20, -20, 0, 0, -18, 0, -45],
  racuteperiod: [-60, -60, -50, -50, -100, -65, -111, -55],
  racuteq: [-20, -20, 0, 0, -18, 0, -37],
  racutes: [-15, -15, 0, 0, 0, 0, -10],
  racutesacute: [-15, -15, 0, 0, 0, 0, -10],
  racutescaron: [-15, -15, 0, 0, 0, 0, -10],
  racutescedilla: [-15, -15, 0, 0, 0, 0, -10],
  racutescommaaccent: [-15, -15, 0, 0, 0, 0, -10],
  racutet: [20, 20, 40, 40],
  racutetcommaaccent: [20, 20, 40, 40],
  racutev: [10, 10, 30, 30, -10],
  racutey: [10, 10, 30, 30],
  racuteyacute: [10, 10, 30, 30],
  racuteydieresis: [10, 10, 30, 30],
  rcaronc: [-20, -20, 0, 0, -18, 0, -37],
  rcaroncacute: [-20, -20, 0, 0, -18, 0, -37],
  rcaronccaron: [-20, -20, 0, 0, -18, 0, -37],
  rcaronccedilla: [-20, -20, 0, 0, -18, 0, -37],
  rcaroncomma: [-60, -60, -50, -50, -92, -65, -111, -40],
  rcarond: [-20, -20, 0, 0, 0, 0, -37],
  rcarondcroat: [-20, -20, 0, 0, 0, 0, -37],
  rcarong: [-15, -15, 0, 0, -10, 0, -37, -18],
  rcarongbreve: [-15, -15, 0, 0, -10, 0, -37, -18],
  rcarongcommaaccent: [-15, -15, 0, 0, -10, 0, -37, -18],
  rcaronhyphen: [-20, -20, 0, 0, -37, 0, -20, -20],
  rcarono: [-20, -20, 0, 0, -18, 0, -45],
  rcaronoacute: [-20, -20, 0, 0, -18, 0, -45],
  rcaronocircumflex: [-20, -20, 0, 0, -18, 0, -45],
  rcaronodieresis: [-20, -20, 0, 0, -18, 0, -45],
  rcaronograve: [-20, -20, 0, 0, -18, 0, -45],
  rcaronohungarumlaut: [-20, -20, 0, 0, -18, 0, -45],
  rcaronomacron: [-20, -20, 0, 0, -18, 0, -45],
  rcaronoslash: [-20, -20, 0, 0, -18, 0, -45],
  rcaronotilde: [-20, -20, 0, 0, -18, 0, -45],
  rcaronperiod: [-60, -60, -50, -50, -100, -65, -111, -55],
  rcaronq: [-20, -20, 0, 0, -18, 0, -37],
  rcarons: [-15, -15, 0, 0, 0, 0, -10],
  rcaronsacute: [-15, -15, 0, 0, 0, 0, -10],
  rcaronscaron: [-15, -15, 0, 0, 0, 0, -10],
  rcaronscedilla: [-15, -15, 0, 0, 0, 0, -10],
  rcaronscommaaccent: [-15, -15, 0, 0, 0, 0, -10],
  rcaront: [20, 20, 40, 40],
  rcarontcommaaccent: [20, 20, 40, 40],
  rcaronv: [10, 10, 30, 30, -10],
  rcarony: [10, 10, 30, 30],
  rcaronyacute: [10, 10, 30, 30],
  rcaronydieresis: [10, 10, 30, 30],
  rcommaaccentc: [-20, -20, 0, 0, -18, 0, -37],
  rcommaaccentcacute: [-20, -20, 0, 0, -18, 0, -37],
  rcommaaccentccaron: [-20, -20, 0, 0, -18, 0, -37],
  rcommaaccentccedilla: [-20, -20, 0, 0, -18, 0, -37],
  rcommaaccentcomma: [-60, -60, -50, -50, -92, -65, -111, -40],
  rcommaaccentd: [-20, -20, 0, 0, 0, 0, -37],
  rcommaaccentdcroat: [-20, -20, 0, 0, 0, 0, -37],
  rcommaaccentg: [-15, -15, 0, 0, -10, 0, -37, -18],
  rcommaaccentgbreve: [-15, -15, 0, 0, -10, 0, -37, -18],
  rcommaaccentgcommaaccent: [-15, -15, 0, 0, -10, 0, -37, -18],
  rcommaaccenthyphen: [-20, -20, 0, 0, -37, 0, -20, -20],
  rcommaaccento: [-20, -20, 0, 0, -18, 0, -45],
  rcommaaccentoacute: [-20, -20, 0, 0, -18, 0, -45],
  rcommaaccentocircumflex: [-20, -20, 0, 0, -18, 0, -45],
  rcommaaccentodieresis: [-20, -20, 0, 0, -18, 0, -45],
  rcommaaccentograve: [-20, -20, 0, 0, -18, 0, -45],
  rcommaaccentohungarumlaut: [-20, -20, 0, 0, -18, 0, -45],
  rcommaaccentomacron: [-20, -20, 0, 0, -18, 0, -45],
  rcommaaccentoslash: [-20, -20, 0, 0, -18, 0, -45],
  rcommaaccentotilde: [-20, -20, 0, 0, -18, 0, -45],
  rcommaaccentperiod: [-60, -60, -50, -50, -100, -65, -111, -55],
  rcommaaccentq: [-20, -20, 0, 0, -18, 0, -37],
  rcommaaccents: [-15, -15, 0, 0, 0, 0, -10],
  rcommaaccentsacute: [-15, -15, 0, 0, 0, 0, -10],
  rcommaaccentscaron: [-15, -15, 0, 0, 0, 0, -10],
  rcommaaccentscedilla: [-15, -15, 0, 0, 0, 0, -10],
  rcommaaccentscommaaccent: [-15, -15, 0, 0, 0, 0, -10],
  rcommaaccentt: [20, 20, 40, 40],
  rcommaaccenttcommaaccent: [20, 20, 40, 40],
  rcommaaccentv: [10, 10, 30, 30, -10],
  rcommaaccenty: [10, 10, 30, 30],
  rcommaaccentyacute: [10, 10, 30, 30],
  rcommaaccentydieresis: [10, 10, 30, 30],
  sw: [-15, -15, -30, -30],
  sacutew: [-15, -15, -30, -30],
  scaronw: [-15, -15, -30, -30],
  scedillaw: [-15, -15, -30, -30],
  scommaaccentw: [-15, -15, -30, -30],
  semicolonspace: [-40, -40, -50, -50],
  spaceT: [-100, -100, -50, -50, -30, 0, -18, -18],
  spaceTcaron: [-100, -100, -50, -50, -30, 0, -18, -18],
  spaceTcommaaccent: [-100, -100, -50, -50, -30, 0, -18, -18],
  spaceV: [-80, -80, -50, -50, -45, -70, -35, -50],
  spaceW: [-80, -80, -40, -40, -30, -70, -40, -30],
  spaceY: [-120, -120, -90, -90, -55, -70, -75, -90],
  spaceYacute: [-120, -120, -90, -90, -55, -70, -75, -90],
  spaceYdieresis: [-120, -120, -90, -90, -55, -70, -75, -90],
  spacequotedblleft: [-80, -80, -30, -30],
  spacequoteleft: [-60, -60, -60, -60],
  va: [-20, -20, -25, -25, -10, 0, 0, -25],
  vaacute: [-20, -20, -25, -25, -10, 0, 0, -25],
  vabreve: [-20, -20, -25, -25, -10, 0, 0, -25],
  vacircumflex: [-20, -20, -25, -25, -10, 0, 0, -25],
  vadieresis: [-20, -20, -25, -25, -10, 0, 0, -25],
  vagrave: [-20, -20, -25, -25, -10, 0, 0, -25],
  vamacron: [-20, -20, -25, -25, -10, 0, 0, -25],
  vaogonek: [-20, -20, -25, -25, -10, 0, 0, -25],
  varing: [-20, -20, -25, -25, -10, 0, 0, -25],
  vatilde: [-20, -20, -25, -25, -10, 0, 0, -25],
  vcomma: [-80, -80, -80, -80, -55, -37, -74, -65],
  vo: [-30, -30, -25, -25, -10, -15, 0, -20],
  voacute: [-30, -30, -25, -25, -10, -15, 0, -20],
  vocircumflex: [-30, -30, -25, -25, -10, -15, 0, -20],
  vodieresis: [-30, -30, -25, -25, -10, -15, 0, -20],
  vograve: [-30, -30, -25, -25, -10, -15, 0, -20],
  vohungarumlaut: [-30, -30, -25, -25, -10, -15, 0, -20],
  vomacron: [-30, -30, -25, -25, -10, -15, 0, -20],
  voslash: [-30, -30, -25, -25, -10, -15, 0, -20],
  votilde: [-30, -30, -25, -25, -10, -15, 0, -20],
  vperiod: [-80, -80, -80, -80, -70, -37, -74, -65],
  wcomma: [-40, -40, -60, -60, -55, -37, -74, -65],
  wo: [-20, -20, -10, -10, -10, -15, 0, -10],
  woacute: [-20, -20, -10, -10, -10, -15, 0, -10],
  wocircumflex: [-20, -20, -10, -10, -10, -15, 0, -10],
  wodieresis: [-20, -20, -10, -10, -10, -15, 0, -10],
  wograve: [-20, -20, -10, -10, -10, -15, 0, -10],
  wohungarumlaut: [-20, -20, -10, -10, -10, -15, 0, -10],
  womacron: [-20, -20, -10, -10, -10, -15, 0, -10],
  woslash: [-20, -20, -10, -10, -10, -15, 0, -10],
  wotilde: [-20, -20, -10, -10, -10, -15, 0, -10],
  wperiod: [-40, -40, -60, -60, -70, -37, -74, -65],
  xe: [-10, -10, -30, -30, 0, -10, 0, -15],
  xeacute: [-10, -10, -30, -30, 0, -10, 0, -15],
  xecaron: [-10, -10, -30, -30, 0, -10, 0, -15],
  xecircumflex: [-10, -10, -30, -30, 0, -10, 0, -15],
  xedieresis: [-10, -10, -30, -30, 0, -10, 0, -15],
  xedotaccent: [-10, -10, -30, -30, 0, -10, 0, -15],
  xegrave: [-10, -10, -30, -30, 0, -10, 0, -15],
  xemacron: [-10, -10, -30, -30, 0, -10, 0, -15],
  xeogonek: [-10, -10, -30, -30, 0, -10, 0, -15],
  ya: [-30, -30, -20, -20],
  yaacute: [-30, -30, -20, -20],
  yabreve: [-30, -30, -20, -20],
  yacircumflex: [-30, -30, -20, -20],
  yadieresis: [-30, -30, -20, -20],
  yagrave: [-30, -30, -20, -20],
  yamacron: [-30, -30, -20, -20],
  yaogonek: [-30, -30, -20, -20],
  yaring: [-30, -30, -20, -20],
  yatilde: [-30, -30, -20, -20],
  ycomma: [-80, -80, -100, -100, -55, -37, -55, -65],
  ye: [-10, -10, -20, -20, -10],
  yeacute: [-10, -10, -20, -20, -10],
  yecaron: [-10, -10, -20, -20, -10],
  yecircumflex: [-10, -10, -20, -20, -10],
  yedieresis: [-10, -10, -20, -20, -10],
  yedotaccent: [-10, -10, -20, -20, -10],
  yegrave: [-10, -10, -20, -20, -10],
  yemacron: [-10, -10, -20, -20, -10],
  yeogonek: [-10, -10, -20, -20, -10],
  yo: [-25, -25, -20, -20, -25],
  yoacute: [-25, -25, -20, -20, -25],
  yocircumflex: [-25, -25, -20, -20, -25],
  yodieresis: [-25, -25, -20, -20, -25],
  yograve: [-25, -25, -20, -20, -25],
  yohungarumlaut: [-25, -25, -20, -20, -25],
  yomacron: [-25, -25, -20, -20, -25],
  yoslash: [-25, -25, -20, -20, -25],
  yotilde: [-25, -25, -20, -20, -25],
  yperiod: [-80, -80, -100, -100, -70, -37, -55, -65],
  yacutea: [-30, -30, -20, -20],
  yacuteaacute: [-30, -30, -20, -20],
  yacuteabreve: [-30, -30, -20, -20],
  yacuteacircumflex: [-30, -30, -20, -20],
  yacuteadieresis: [-30, -30, -20, -20],
  yacuteagrave: [-30, -30, -20, -20],
  yacuteamacron: [-30, -30, -20, -20],
  yacuteaogonek: [-30, -30, -20, -20],
  yacutearing: [-30, -30, -20, -20],
  yacuteatilde: [-30, -30, -20, -20],
  yacutecomma: [-80, -80, -100, -100, -55, -37, -55, -65],
  yacutee: [-10, -10, -20, -20, -10],
  yacuteeacute: [-10, -10, -20, -20, -10],
  yacuteecaron: [-10, -10, -20, -20, -10],
  yacuteecircumflex: [-10, -10, -20, -20, -10],
  yacuteedieresis: [-10, -10, -20, -20, -10],
  yacuteedotaccent: [-10, -10, -20, -20, -10],
  yacuteegrave: [-10, -10, -20, -20, -10],
  yacuteemacron: [-10, -10, -20, -20, -10],
  yacuteeogonek: [-10, -10, -20, -20, -10],
  yacuteo: [-25, -25, -20, -20, -25],
  yacuteoacute: [-25, -25, -20, -20, -25],
  yacuteocircumflex: [-25, -25, -20, -20, -25],
  yacuteodieresis: [-25, -25, -20, -20, -25],
  yacuteograve: [-25, -25, -20, -20, -25],
  yacuteohungarumlaut: [-25, -25, -20, -20, -25],
  yacuteomacron: [-25, -25, -20, -20, -25],
  yacuteoslash: [-25, -25, -20, -20, -25],
  yacuteotilde: [-25, -25, -20, -20, -25],
  yacuteperiod: [-80, -80, -100, -100, -70, -37, -55, -65],
  ydieresisa: [-30, -30, -20, -20],
  ydieresisaacute: [-30, -30, -20, -20],
  ydieresisabreve: [-30, -30, -20, -20],
  ydieresisacircumflex: [-30, -30, -20, -20],
  ydieresisadieresis: [-30, -30, -20, -20],
  ydieresisagrave: [-30, -30, -20, -20],
  ydieresisamacron: [-30, -30, -20, -20],
  ydieresisaogonek: [-30, -30, -20, -20],
  ydieresisaring: [-30, -30, -20, -20],
  ydieresisatilde: [-30, -30, -20, -20],
  ydieresiscomma: [-80, -80, -100, -100, -55, -37, -55, -65],
  ydieresise: [-10, -10, -20, -20, -10],
  ydieresiseacute: [-10, -10, -20, -20, -10],
  ydieresisecaron: [-10, -10, -20, -20, -10],
  ydieresisecircumflex: [-10, -10, -20, -20, -10],
  ydieresisedieresis: [-10, -10, -20, -20, -10],
  ydieresisedotaccent: [-10, -10, -20, -20, -10],
  ydieresisegrave: [-10, -10, -20, -20, -10],
  ydieresisemacron: [-10, -10, -20, -20, -10],
  ydieresiseogonek: [-10, -10, -20, -20, -10],
  ydieresiso: [-25, -25, -20, -20, -25],
  ydieresisoacute: [-25, -25, -20, -20, -25],
  ydieresisocircumflex: [-25, -25, -20, -20, -25],
  ydieresisodieresis: [-25, -25, -20, -20, -25],
  ydieresisograve: [-25, -25, -20, -20, -25],
  ydieresisohungarumlaut: [-25, -25, -20, -20, -25],
  ydieresisomacron: [-25, -25, -20, -20, -25],
  ydieresisoslash: [-25, -25, -20, -20, -25],
  ydieresisotilde: [-25, -25, -20, -20, -25],
  ydieresisperiod: [-80, -80, -100, -100, -70, -37, -55, -65],
  ze: [10, 10, -15, -15],
  zeacute: [10, 10, -15, -15],
  zecaron: [10, 10, -15, -15],
  zecircumflex: [10, 10, -15, -15],
  zedieresis: [10, 10, -15, -15],
  zedotaccent: [10, 10, -15, -15],
  zegrave: [10, 10, -15, -15],
  zemacron: [10, 10, -15, -15],
  zeogonek: [10, 10, -15, -15],
  zacutee: [10, 10, -15, -15],
  zacuteeacute: [10, 10, -15, -15],
  zacuteecaron: [10, 10, -15, -15],
  zacuteecircumflex: [10, 10, -15, -15],
  zacuteedieresis: [10, 10, -15, -15],
  zacuteedotaccent: [10, 10, -15, -15],
  zacuteegrave: [10, 10, -15, -15],
  zacuteemacron: [10, 10, -15, -15],
  zacuteeogonek: [10, 10, -15, -15],
  zcarone: [10, 10, -15, -15],
  zcaroneacute: [10, 10, -15, -15],
  zcaronecaron: [10, 10, -15, -15],
  zcaronecircumflex: [10, 10, -15, -15],
  zcaronedieresis: [10, 10, -15, -15],
  zcaronedotaccent: [10, 10, -15, -15],
  zcaronegrave: [10, 10, -15, -15],
  zcaronemacron: [10, 10, -15, -15],
  zcaroneogonek: [10, 10, -15, -15],
  zdotaccente: [10, 10, -15, -15],
  zdotaccenteacute: [10, 10, -15, -15],
  zdotaccentecaron: [10, 10, -15, -15],
  zdotaccentecircumflex: [10, 10, -15, -15],
  zdotaccentedieresis: [10, 10, -15, -15],
  zdotaccentedotaccent: [10, 10, -15, -15],
  zdotaccentegrave: [10, 10, -15, -15],
  zdotaccentemacron: [10, 10, -15, -15],
  zdotaccenteogonek: [10, 10, -15, -15],
  Bcomma: [0, 0, -20, -20],
  Bperiod: [0, 0, -20, -20],
  Ccomma: [0, 0, -30, -30],
  Cperiod: [0, 0, -30, -30],
  Cacutecomma: [0, 0, -30, -30],
  Cacuteperiod: [0, 0, -30, -30],
  Ccaroncomma: [0, 0, -30, -30],
  Ccaronperiod: [0, 0, -30, -30],
  Ccedillacomma: [0, 0, -30, -30],
  Ccedillaperiod: [0, 0, -30, -30],
  Fe: [0, 0, -30, -30, -25, -100, -75],
  Feacute: [0, 0, -30, -30, -25, -100, -75],
  Fecaron: [0, 0, -30, -30, -25, -100, -75],
  Fecircumflex: [0, 0, -30, -30, -25, -100, -75],
  Fedieresis: [0, 0, -30, -30, -25, -100, -75],
  Fedotaccent: [0, 0, -30, -30, -25, -100, -75],
  Fegrave: [0, 0, -30, -30, -25, -100, -75],
  Femacron: [0, 0, -30, -30, -25, -100, -75],
  Feogonek: [0, 0, -30, -30, -25, -100, -75],
  Fo: [0, 0, -30, -30, -25, -70, -105, -15],
  Foacute: [0, 0, -30, -30, -25, -70, -105, -15],
  Focircumflex: [0, 0, -30, -30, -25, -70, -105, -15],
  Fodieresis: [0, 0, -30, -30, -25, -70, -105, -15],
  Fograve: [0, 0, -30, -30, -25, -70, -105, -15],
  Fohungarumlaut: [0, 0, -30, -30, -25, -70, -105, -15],
  Fomacron: [0, 0, -30, -30, -25, -70, -105, -15],
  Foslash: [0, 0, -30, -30, -25, -70, -105, -15],
  Fotilde: [0, 0, -30, -30, -25, -70, -105, -15],
  Fr: [0, 0, -45, -45, 0, -50, -55],
  Fracute: [0, 0, -45, -45, 0, -50, -55],
  Frcaron: [0, 0, -45, -45, 0, -50, -55],
  Frcommaaccent: [0, 0, -45, -45, 0, -50, -55],
  Ja: [0, 0, -20, -20, -15, -40, -35],
  Jaacute: [0, 0, -20, -20, -15, -40, -35],
  Jabreve: [0, 0, -20, -20, -15, -40, -35],
  Jacircumflex: [0, 0, -20, -20, -15, -40, -35],
  Jadieresis: [0, 0, -20, -20, -15, -40, -35],
  Jagrave: [0, 0, -20, -20, -15, -40, -35],
  Jamacron: [0, 0, -20, -20, -15, -40, -35],
  Jaogonek: [0, 0, -20, -20, -15, -40, -35],
  Jaring: [0, 0, -20, -20, -15, -40, -35],
  Jatilde: [0, 0, -20, -20, -15, -40, -35],
  LcaronT: [0, 0, -110, -110],
  LcaronTcaron: [0, 0, -110, -110],
  LcaronTcommaaccent: [0, 0, -110, -110],
  LcaronV: [0, 0, -110, -110],
  LcaronW: [0, 0, -70, -70],
  LcaronY: [0, 0, -140, -140],
  LcaronYacute: [0, 0, -140, -140],
  LcaronYdieresis: [0, 0, -140, -140],
  Lcaronquotedblright: [0, 0, -140, -140],
  Lcaronquoteright: [0, 0, -160, -160, 0, 0, 0, -92],
  Lcarony: [0, 0, -30, -30, 0, 0, 0, -55],
  Lcaronyacute: [0, 0, -30, -30, 0, 0, 0, -55],
  Lcaronydieresis: [0, 0, -30, -30, 0, 0, 0, -55],
  Scomma: [0, 0, -20, -20],
  Speriod: [0, 0, -20, -20],
  Sacutecomma: [0, 0, -20, -20],
  Sacuteperiod: [0, 0, -20, -20],
  Scaroncomma: [0, 0, -20, -20],
  Scaronperiod: [0, 0, -20, -20],
  Scedillacomma: [0, 0, -20, -20],
  Scedillaperiod: [0, 0, -20, -20],
  Scommaaccentcomma: [0, 0, -20, -20],
  Scommaaccentperiod: [0, 0, -20, -20],
  Trcaron: [0, 0, -120, -120, -74, -37, -55, -35],
  Tcaronrcaron: [0, 0, -120, -120, -74, -37, -55, -35],
  Tcommaaccentrcaron: [0, 0, -120, -120, -74, -37, -55, -35],
  Yhyphen: [0, 0, -140, -140, -92, -92, -74, -111],
  Yi: [0, 0, -20, -20, -37, -55, -74, -55],
  Yiacute: [0, 0, -20, -20, -37, -55, -74, -55],
  Yiogonek: [0, 0, -20, -20, -37, -55, -74, -55],
  Yacutehyphen: [0, 0, -140, -140, -92, -92, -74, -111],
  Yacutei: [0, 0, -20, -20, -37, -55, -74, -55],
  Yacuteiacute: [0, 0, -20, -20, -37, -55, -74, -55],
  Yacuteiogonek: [0, 0, -20, -20, -37, -55, -74, -55],
  Ydieresishyphen: [0, 0, -140, -140, -92, -92, -74, -111],
  Ydieresisi: [0, 0, -20, -20, -37, -55, -74, -55],
  Ydieresisiacute: [0, 0, -20, -20, -37, -55, -74, -55],
  Ydieresisiogonek: [0, 0, -20, -20, -37, -55, -74, -55],
  bb: [0, 0, -10, -10, -10, -10],
  bcomma: [0, 0, -40, -40],
  bperiod: [0, 0, -40, -40, -40, -40, -40, -40],
  ccomma: [0, 0, -15, -15],
  cacutecomma: [0, 0, -15, -15],
  ccaroncomma: [0, 0, -15, -15],
  ccedillacomma: [0, 0, -15, -15],
  fa: [0, 0, -30, -30, 0, 0, 0, -10],
  faacute: [0, 0, -30, -30, 0, 0, 0, -10],
  fabreve: [0, 0, -30, -30, 0, 0, 0, -10],
  facircumflex: [0, 0, -30, -30, 0, 0, 0, -10],
  fadieresis: [0, 0, -30, -30, 0, 0, 0, -10],
  fagrave: [0, 0, -30, -30, 0, 0, 0, -10],
  famacron: [0, 0, -30, -30, 0, 0, 0, -10],
  faogonek: [0, 0, -30, -30, 0, 0, 0, -10],
  faring: [0, 0, -30, -30, 0, 0, 0, -10],
  fatilde: [0, 0, -30, -30, 0, 0, 0, -10],
  fdotlessi: [0, 0, -28, -28, -35, -30, -60, -50],
  gr: [0, 0, -10, -10],
  gracute: [0, 0, -10, -10],
  grcaron: [0, 0, -10, -10],
  grcommaaccent: [0, 0, -10, -10],
  gbrever: [0, 0, -10, -10],
  gbreveracute: [0, 0, -10, -10],
  gbrevercaron: [0, 0, -10, -10],
  gbrevercommaaccent: [0, 0, -10, -10],
  gcommaaccentr: [0, 0, -10, -10],
  gcommaaccentracute: [0, 0, -10, -10],
  gcommaaccentrcaron: [0, 0, -10, -10],
  gcommaaccentrcommaaccent: [0, 0, -10, -10],
  ke: [0, 0, -20, -20, -10, -30, -10, -10],
  keacute: [0, 0, -20, -20, -10, -30, -10, -10],
  kecaron: [0, 0, -20, -20, -10, -30, -10, -10],
  kecircumflex: [0, 0, -20, -20, -10, -30, -10, -10],
  kedieresis: [0, 0, -20, -20, -10, -30, -10, -10],
  kedotaccent: [0, 0, -20, -20, -10, -30, -10, -10],
  kegrave: [0, 0, -20, -20, -10, -30, -10, -10],
  kemacron: [0, 0, -20, -20, -10, -30, -10, -10],
  keogonek: [0, 0, -20, -20, -10, -30, -10, -10],
  kcommaaccente: [0, 0, -20, -20, -10, -30, -10, -10],
  kcommaaccenteacute: [0, 0, -20, -20, -10, -30, -10, -10],
  kcommaaccentecaron: [0, 0, -20, -20, -10, -30, -10, -10],
  kcommaaccentecircumflex: [0, 0, -20, -20, -10, -30, -10, -10],
  kcommaaccentedieresis: [0, 0, -20, -20, -10, -30, -10, -10],
  kcommaaccentedotaccent: [0, 0, -20, -20, -10, -30, -10, -10],
  kcommaaccentegrave: [0, 0, -20, -20, -10, -30, -10, -10],
  kcommaaccentemacron: [0, 0, -20, -20, -10, -30, -10, -10],
  kcommaaccenteogonek: [0, 0, -20, -20, -10, -30, -10, -10],
  ocomma: [0, 0, -40, -40],
  operiod: [0, 0, -40, -40],
  oacutecomma: [0, 0, -40, -40],
  oacuteperiod: [0, 0, -40, -40],
  ocircumflexcomma: [0, 0, -40, -40],
  ocircumflexperiod: [0, 0, -40, -40],
  odieresiscomma: [0, 0, -40, -40],
  odieresisperiod: [0, 0, -40, -40],
  ogravecomma: [0, 0, -40, -40],
  ograveperiod: [0, 0, -40, -40],
  ohungarumlautcomma: [0, 0, -40, -40],
  ohungarumlautperiod: [0, 0, -40, -40],
  omacroncomma: [0, 0, -40, -40],
  omacronperiod: [0, 0, -40, -40],
  oslasha: [0, 0, -55, -55],
  oslashaacute: [0, 0, -55, -55],
  oslashabreve: [0, 0, -55, -55],
  oslashacircumflex: [0, 0, -55, -55],
  oslashadieresis: [0, 0, -55, -55],
  oslashagrave: [0, 0, -55, -55],
  oslashamacron: [0, 0, -55, -55],
  oslashaogonek: [0, 0, -55, -55],
  oslasharing: [0, 0, -55, -55],
  oslashatilde: [0, 0, -55, -55],
  oslashb: [0, 0, -55, -55],
  oslashc: [0, 0, -55, -55],
  oslashcacute: [0, 0, -55, -55],
  oslashccaron: [0, 0, -55, -55],
  oslashccedilla: [0, 0, -55, -55],
  oslashcomma: [0, 0, -95, -95],
  oslashd: [0, 0, -55, -55],
  oslashdcroat: [0, 0, -55, -55],
  oslashe: [0, 0, -55, -55],
  oslasheacute: [0, 0, -55, -55],
  oslashecaron: [0, 0, -55, -55],
  oslashecircumflex: [0, 0, -55, -55],
  oslashedieresis: [0, 0, -55, -55],
  oslashedotaccent: [0, 0, -55, -55],
  oslashegrave: [0, 0, -55, -55],
  oslashemacron: [0, 0, -55, -55],
  oslasheogonek: [0, 0, -55, -55],
  oslashf: [0, 0, -55, -55],
  oslashg: [0, 0, -55, -55, 0, 0, -10],
  oslashgbreve: [0, 0, -55, -55, 0, 0, -10],
  oslashgcommaaccent: [0, 0, -55, -55, 0, 0, -10],
  oslashh: [0, 0, -55, -55],
  oslashi: [0, 0, -55, -55],
  oslashiacute: [0, 0, -55, -55],
  oslashicircumflex: [0, 0, -55, -55],
  oslashidieresis: [0, 0, -55, -55],
  oslashigrave: [0, 0, -55, -55],
  oslashimacron: [0, 0, -55, -55],
  oslashiogonek: [0, 0, -55, -55],
  oslashj: [0, 0, -55, -55],
  oslashk: [0, 0, -55, -55],
  oslashkcommaaccent: [0, 0, -55, -55],
  oslashl: [0, 0, -55, -55],
  oslashlacute: [0, 0, -55, -55],
  oslashlcommaaccent: [0, 0, -55, -55],
  oslashlslash: [0, 0, -55, -55],
  oslashm: [0, 0, -55, -55],
  oslashn: [0, 0, -55, -55],
  oslashnacute: [0, 0, -55, -55],
  oslashncaron: [0, 0, -55, -55],
  oslashncommaaccent: [0, 0, -55, -55],
  oslashntilde: [0, 0, -55, -55],
  oslasho: [0, 0, -55, -55],
  oslashoacute: [0, 0, -55, -55],
  oslashocircumflex: [0, 0, -55, -55],
  oslashodieresis: [0, 0, -55, -55],
  oslashograve: [0, 0, -55, -55],
  oslashohungarumlaut: [0, 0, -55, -55],
  oslashomacron: [0, 0, -55, -55],
  oslashoslash: [0, 0, -55, -55],
  oslashotilde: [0, 0, -55, -55],
  oslashp: [0, 0, -55, -55],
  oslashperiod: [0, 0, -95, -95],
  oslashq: [0, 0, -55, -55],
  oslashr: [0, 0, -55, -55],
  oslashracute: [0, 0, -55, -55],
  oslashrcaron: [0, 0, -55, -55],
  oslashrcommaaccent: [0, 0, -55, -55],
  oslashs: [0, 0, -55, -55],
  oslashsacute: [0, 0, -55, -55],
  oslashscaron: [0, 0, -55, -55],
  oslashscedilla: [0, 0, -55, -55],
  oslashscommaaccent: [0, 0, -55, -55],
  oslasht: [0, 0, -55, -55],
  oslashtcommaaccent: [0, 0, -55, -55],
  oslashu: [0, 0, -55, -55],
  oslashuacute: [0, 0, -55, -55],
  oslashucircumflex: [0, 0, -55, -55],
  oslashudieresis: [0, 0, -55, -55],
  oslashugrave: [0, 0, -55, -55],
  oslashuhungarumlaut: [0, 0, -55, -55],
  oslashumacron: [0, 0, -55, -55],
  oslashuogonek: [0, 0, -55, -55],
  oslashuring: [0, 0, -55, -55],
  oslashz: [0, 0, -55, -55],
  oslashzacute: [0, 0, -55, -55],
  oslashzcaron: [0, 0, -55, -55],
  oslashzdotaccent: [0, 0, -55, -55],
  otildecomma: [0, 0, -40, -40],
  otildeperiod: [0, 0, -40, -40],
  pcomma: [0, 0, -35, -35],
  pperiod: [0, 0, -35, -35],
  ra: [0, 0, -10, -10, 0, 0, -15],
  raacute: [0, 0, -10, -10, 0, 0, -15],
  rabreve: [0, 0, -10, -10, 0, 0, -15],
  racircumflex: [0, 0, -10, -10, 0, 0, -15],
  radieresis: [0, 0, -10, -10, 0, 0, -15],
  ragrave: [0, 0, -10, -10, 0, 0, -15],
  ramacron: [0, 0, -10, -10, 0, 0, -15],
  raogonek: [0, 0, -10, -10, 0, 0, -15],
  raring: [0, 0, -10, -10, 0, 0, -15],
  ratilde: [0, 0, -10, -10, 0, 0, -15],
  rcolon: [0, 0, 30, 30],
  ri: [0, 0, 15, 15],
  riacute: [0, 0, 15, 15],
  ricircumflex: [0, 0, 15, 15],
  ridieresis: [0, 0, 15, 15],
  rigrave: [0, 0, 15, 15],
  rimacron: [0, 0, 15, 15],
  riogonek: [0, 0, 15, 15],
  rk: [0, 0, 15, 15],
  rkcommaaccent: [0, 0, 15, 15],
  rl: [0, 0, 15, 15],
  rlacute: [0, 0, 15, 15],
  rlcommaaccent: [0, 0, 15, 15],
  rlslash: [0, 0, 15, 15],
  rm: [0, 0, 25, 25],
  rn: [0, 0, 25, 25, -15],
  rnacute: [0, 0, 25, 25, -15],
  rncaron: [0, 0, 25, 25, -15],
  rncommaaccent: [0, 0, 25, 25, -15],
  rntilde: [0, 0, 25, 25, -15],
  rp: [0, 0, 30, 30, -10],
  rsemicolon: [0, 0, 30, 30],
  ru: [0, 0, 15, 15],
  ruacute: [0, 0, 15, 15],
  rucircumflex: [0, 0, 15, 15],
  rudieresis: [0, 0, 15, 15],
  rugrave: [0, 0, 15, 15],
  ruhungarumlaut: [0, 0, 15, 15],
  rumacron: [0, 0, 15, 15],
  ruogonek: [0, 0, 15, 15],
  ruring: [0, 0, 15, 15],
  racutea: [0, 0, -10, -10, 0, 0, -15],
  racuteaacute: [0, 0, -10, -10, 0, 0, -15],
  racuteabreve: [0, 0, -10, -10, 0, 0, -15],
  racuteacircumflex: [0, 0, -10, -10, 0, 0, -15],
  racuteadieresis: [0, 0, -10, -10, 0, 0, -15],
  racuteagrave: [0, 0, -10, -10, 0, 0, -15],
  racuteamacron: [0, 0, -10, -10, 0, 0, -15],
  racuteaogonek: [0, 0, -10, -10, 0, 0, -15],
  racutearing: [0, 0, -10, -10, 0, 0, -15],
  racuteatilde: [0, 0, -10, -10, 0, 0, -15],
  racutecolon: [0, 0, 30, 30],
  racutei: [0, 0, 15, 15],
  racuteiacute: [0, 0, 15, 15],
  racuteicircumflex: [0, 0, 15, 15],
  racuteidieresis: [0, 0, 15, 15],
  racuteigrave: [0, 0, 15, 15],
  racuteimacron: [0, 0, 15, 15],
  racuteiogonek: [0, 0, 15, 15],
  racutek: [0, 0, 15, 15],
  racutekcommaaccent: [0, 0, 15, 15],
  racutel: [0, 0, 15, 15],
  racutelacute: [0, 0, 15, 15],
  racutelcommaaccent: [0, 0, 15, 15],
  racutelslash: [0, 0, 15, 15],
  racutem: [0, 0, 25, 25],
  racuten: [0, 0, 25, 25, -15],
  racutenacute: [0, 0, 25, 25, -15],
  racutencaron: [0, 0, 25, 25, -15],
  racutencommaaccent: [0, 0, 25, 25, -15],
  racutentilde: [0, 0, 25, 25, -15],
  racutep: [0, 0, 30, 30, -10],
  racutesemicolon: [0, 0, 30, 30],
  racuteu: [0, 0, 15, 15],
  racuteuacute: [0, 0, 15, 15],
  racuteucircumflex: [0, 0, 15, 15],
  racuteudieresis: [0, 0, 15, 15],
  racuteugrave: [0, 0, 15, 15],
  racuteuhungarumlaut: [0, 0, 15, 15],
  racuteumacron: [0, 0, 15, 15],
  racuteuogonek: [0, 0, 15, 15],
  racuteuring: [0, 0, 15, 15],
  rcarona: [0, 0, -10, -10, 0, 0, -15],
  rcaronaacute: [0, 0, -10, -10, 0, 0, -15],
  rcaronabreve: [0, 0, -10, -10, 0, 0, -15],
  rcaronacircumflex: [0, 0, -10, -10, 0, 0, -15],
  rcaronadieresis: [0, 0, -10, -10, 0, 0, -15],
  rcaronagrave: [0, 0, -10, -10, 0, 0, -15],
  rcaronamacron: [0, 0, -10, -10, 0, 0, -15],
  rcaronaogonek: [0, 0, -10, -10, 0, 0, -15],
  rcaronaring: [0, 0, -10, -10, 0, 0, -15],
  rcaronatilde: [0, 0, -10, -10, 0, 0, -15],
  rcaroncolon: [0, 0, 30, 30],
  rcaroni: [0, 0, 15, 15],
  rcaroniacute: [0, 0, 15, 15],
  rcaronicircumflex: [0, 0, 15, 15],
  rcaronidieresis: [0, 0, 15, 15],
  rcaronigrave: [0, 0, 15, 15],
  rcaronimacron: [0, 0, 15, 15],
  rcaroniogonek: [0, 0, 15, 15],
  rcaronk: [0, 0, 15, 15],
  rcaronkcommaaccent: [0, 0, 15, 15],
  rcaronl: [0, 0, 15, 15],
  rcaronlacute: [0, 0, 15, 15],
  rcaronlcommaaccent: [0, 0, 15, 15],
  rcaronlslash: [0, 0, 15, 15],
  rcaronm: [0, 0, 25, 25],
  rcaronn: [0, 0, 25, 25, -15],
  rcaronnacute: [0, 0, 25, 25, -15],
  rcaronncaron: [0, 0, 25, 25, -15],
  rcaronncommaaccent: [0, 0, 25, 25, -15],
  rcaronntilde: [0, 0, 25, 25, -15],
  rcaronp: [0, 0, 30, 30, -10],
  rcaronsemicolon: [0, 0, 30, 30],
  rcaronu: [0, 0, 15, 15],
  rcaronuacute: [0, 0, 15, 15],
  rcaronucircumflex: [0, 0, 15, 15],
  rcaronudieresis: [0, 0, 15, 15],
  rcaronugrave: [0, 0, 15, 15],
  rcaronuhungarumlaut: [0, 0, 15, 15],
  rcaronumacron: [0, 0, 15, 15],
  rcaronuogonek: [0, 0, 15, 15],
  rcaronuring: [0, 0, 15, 15],
  rcommaaccenta: [0, 0, -10, -10, 0, 0, -15],
  rcommaaccentaacute: [0, 0, -10, -10, 0, 0, -15],
  rcommaaccentabreve: [0, 0, -10, -10, 0, 0, -15],
  rcommaaccentacircumflex: [0, 0, -10, -10, 0, 0, -15],
  rcommaaccentadieresis: [0, 0, -10, -10, 0, 0, -15],
  rcommaaccentagrave: [0, 0, -10, -10, 0, 0, -15],
  rcommaaccentamacron: [0, 0, -10, -10, 0, 0, -15],
  rcommaaccentaogonek: [0, 0, -10, -10, 0, 0, -15],
  rcommaaccentaring: [0, 0, -10, -10, 0, 0, -15],
  rcommaaccentatilde: [0, 0, -10, -10, 0, 0, -15],
  rcommaaccentcolon: [0, 0, 30, 30],
  rcommaaccenti: [0, 0, 15, 15],
  rcommaaccentiacute: [0, 0, 15, 15],
  rcommaaccenticircumflex: [0, 0, 15, 15],
  rcommaaccentidieresis: [0, 0, 15, 15],
  rcommaaccentigrave: [0, 0, 15, 15],
  rcommaaccentimacron: [0, 0, 15, 15],
  rcommaaccentiogonek: [0, 0, 15, 15],
  rcommaaccentk: [0, 0, 15, 15],
  rcommaaccentkcommaaccent: [0, 0, 15, 15],
  rcommaaccentl: [0, 0, 15, 15],
  rcommaaccentlacute: [0, 0, 15, 15],
  rcommaaccentlcommaaccent: [0, 0, 15, 15],
  rcommaaccentlslash: [0, 0, 15, 15],
  rcommaaccentm: [0, 0, 25, 25],
  rcommaaccentn: [0, 0, 25, 25, -15],
  rcommaaccentnacute: [0, 0, 25, 25, -15],
  rcommaaccentncaron: [0, 0, 25, 25, -15],
  rcommaaccentncommaaccent: [0, 0, 25, 25, -15],
  rcommaaccentntilde: [0, 0, 25, 25, -15],
  rcommaaccentp: [0, 0, 30, 30, -10],
  rcommaaccentsemicolon: [0, 0, 30, 30],
  rcommaaccentu: [0, 0, 15, 15],
  rcommaaccentuacute: [0, 0, 15, 15],
  rcommaaccentucircumflex: [0, 0, 15, 15],
  rcommaaccentudieresis: [0, 0, 15, 15],
  rcommaaccentugrave: [0, 0, 15, 15],
  rcommaaccentuhungarumlaut: [0, 0, 15, 15],
  rcommaaccentumacron: [0, 0, 15, 15],
  rcommaaccentuogonek: [0, 0, 15, 15],
  rcommaaccenturing: [0, 0, 15, 15],
  scomma: [0, 0, -15, -15],
  speriod: [0, 0, -15, -15],
  sacutecomma: [0, 0, -15, -15],
  sacuteperiod: [0, 0, -15, -15],
  scaroncomma: [0, 0, -15, -15],
  scaronperiod: [0, 0, -15, -15],
  scedillacomma: [0, 0, -15, -15],
  scedillaperiod: [0, 0, -15, -15],
  scommaaccentcomma: [0, 0, -15, -15],
  scommaaccentperiod: [0, 0, -15, -15],
  ve: [0, 0, -25, -25, -10, -15, 0, -15],
  veacute: [0, 0, -25, -25, -10, -15, 0, -15],
  vecaron: [0, 0, -25, -25, -10, -15, 0, -15],
  vecircumflex: [0, 0, -25, -25, -10, -15, 0, -15],
  vedieresis: [0, 0, -25, -25, -10, -15, 0, -15],
  vedotaccent: [0, 0, -25, -25, -10, -15, 0, -15],
  vegrave: [0, 0, -25, -25, -10, -15, 0, -15],
  vemacron: [0, 0, -25, -25, -10, -15, 0, -15],
  veogonek: [0, 0, -25, -25, -10, -15, 0, -15],
  wa: [0, 0, -15, -15, 0, -10, 0, -10],
  waacute: [0, 0, -15, -15, 0, -10, 0, -10],
  wabreve: [0, 0, -15, -15, 0, -10, 0, -10],
  wacircumflex: [0, 0, -15, -15, 0, -10, 0, -10],
  wadieresis: [0, 0, -15, -15, 0, -10, 0, -10],
  wagrave: [0, 0, -15, -15, 0, -10, 0, -10],
  wamacron: [0, 0, -15, -15, 0, -10, 0, -10],
  waogonek: [0, 0, -15, -15, 0, -10, 0, -10],
  waring: [0, 0, -15, -15, 0, -10, 0, -10],
  watilde: [0, 0, -15, -15, 0, -10, 0, -10],
  we: [0, 0, -10, -10, 0, -10],
  weacute: [0, 0, -10, -10, 0, -10],
  wecaron: [0, 0, -10, -10, 0, -10],
  wecircumflex: [0, 0, -10, -10, 0, -10],
  wedieresis: [0, 0, -10, -10, 0, -10],
  wedotaccent: [0, 0, -10, -10, 0, -10],
  wegrave: [0, 0, -10, -10, 0, -10],
  wemacron: [0, 0, -10, -10, 0, -10],
  weogonek: [0, 0, -10, -10, 0, -10],
  zo: [0, 0, -15, -15],
  zoacute: [0, 0, -15, -15],
  zocircumflex: [0, 0, -15, -15],
  zodieresis: [0, 0, -15, -15],
  zograve: [0, 0, -15, -15],
  zohungarumlaut: [0, 0, -15, -15],
  zomacron: [0, 0, -15, -15],
  zoslash: [0, 0, -15, -15],
  zotilde: [0, 0, -15, -15],
  zacuteo: [0, 0, -15, -15],
  zacuteoacute: [0, 0, -15, -15],
  zacuteocircumflex: [0, 0, -15, -15],
  zacuteodieresis: [0, 0, -15, -15],
  zacuteograve: [0, 0, -15, -15],
  zacuteohungarumlaut: [0, 0, -15, -15],
  zacuteomacron: [0, 0, -15, -15],
  zacuteoslash: [0, 0, -15, -15],
  zacuteotilde: [0, 0, -15, -15],
  zcarono: [0, 0, -15, -15],
  zcaronoacute: [0, 0, -15, -15],
  zcaronocircumflex: [0, 0, -15, -15],
  zcaronodieresis: [0, 0, -15, -15],
  zcaronograve: [0, 0, -15, -15],
  zcaronohungarumlaut: [0, 0, -15, -15],
  zcaronomacron: [0, 0, -15, -15],
  zcaronoslash: [0, 0, -15, -15],
  zcaronotilde: [0, 0, -15, -15],
  zdotaccento: [0, 0, -15, -15],
  zdotaccentoacute: [0, 0, -15, -15],
  zdotaccentocircumflex: [0, 0, -15, -15],
  zdotaccentodieresis: [0, 0, -15, -15],
  zdotaccentograve: [0, 0, -15, -15],
  zdotaccentohungarumlaut: [0, 0, -15, -15],
  zdotaccentomacron: [0, 0, -15, -15],
  zdotaccentoslash: [0, 0, -15, -15],
  zdotaccentotilde: [0, 0, -15, -15],
  Ap: [0, 0, 0, 0, -25],
  Aquoteright: [0, 0, 0, 0, -74, -74, -37, -111],
  Aacutep: [0, 0, 0, 0, -25],
  Aacutequoteright: [0, 0, 0, 0, -74, -74, -37, -111],
  Abrevep: [0, 0, 0, 0, -25],
  Abrevequoteright: [0, 0, 0, 0, -74, -74, -37, -111],
  Acircumflexp: [0, 0, 0, 0, -25],
  Acircumflexquoteright: [0, 0, 0, 0, -74, -74, -37, -111],
  Adieresisp: [0, 0, 0, 0, -25],
  Adieresisquoteright: [0, 0, 0, 0, -74, -74, -37, -111],
  Agravep: [0, 0, 0, 0, -25],
  Agravequoteright: [0, 0, 0, 0, -74, -74, -37, -111],
  Amacronp: [0, 0, 0, 0, -25],
  Amacronquoteright: [0, 0, 0, 0, -74, -74, -37, -111],
  Aogonekp: [0, 0, 0, 0, -25],
  Aogonekquoteright: [0, 0, 0, 0, -74, -74, -37, -111],
  Aringp: [0, 0, 0, 0, -25],
  Aringquoteright: [0, 0, 0, 0, -74, -74, -37, -111],
  Atildep: [0, 0, 0, 0, -25],
  Atildequoteright: [0, 0, 0, 0, -74, -74, -37, -111],
  Je: [0, 0, 0, 0, -15, -40, -25],
  Jeacute: [0, 0, 0, 0, -15, -40, -25],
  Jecaron: [0, 0, 0, 0, -15, -40, -25],
  Jecircumflex: [0, 0, 0, 0, -15, -40, -25],
  Jedieresis: [0, 0, 0, 0, -15, -40, -25],
  Jedotaccent: [0, 0, 0, 0, -15, -40, -25],
  Jegrave: [0, 0, 0, 0, -15, -40, -25],
  Jemacron: [0, 0, 0, 0, -15, -40, -25],
  Jeogonek: [0, 0, 0, 0, -15, -40, -25],
  Jo: [0, 0, 0, 0, -15, -40, -25],
  Joacute: [0, 0, 0, 0, -15, -40, -25],
  Jocircumflex: [0, 0, 0, 0, -15, -40, -25],
  Jodieresis: [0, 0, 0, 0, -15, -40, -25],
  Jograve: [0, 0, 0, 0, -15, -40, -25],
  Johungarumlaut: [0, 0, 0, 0, -15, -40, -25],
  Jomacron: [0, 0, 0, 0, -15, -40, -25],
  Joslash: [0, 0, 0, 0, -15, -40, -25],
  Jotilde: [0, 0, 0, 0, -15, -40, -25],
  NA: [0, 0, 0, 0, -20, -30, -27, -35],
  NAacute: [0, 0, 0, 0, -20, -30, -27, -35],
  NAbreve: [0, 0, 0, 0, -20, -30, -27, -35],
  NAcircumflex: [0, 0, 0, 0, -20, -30, -27, -35],
  NAdieresis: [0, 0, 0, 0, -20, -30, -27, -35],
  NAgrave: [0, 0, 0, 0, -20, -30, -27, -35],
  NAmacron: [0, 0, 0, 0, -20, -30, -27, -35],
  NAogonek: [0, 0, 0, 0, -20, -30, -27, -35],
  NAring: [0, 0, 0, 0, -20, -30, -27, -35],
  NAtilde: [0, 0, 0, 0, -20, -30, -27, -35],
  NacuteA: [0, 0, 0, 0, -20, -30, -27, -35],
  NacuteAacute: [0, 0, 0, 0, -20, -30, -27, -35],
  NacuteAbreve: [0, 0, 0, 0, -20, -30, -27, -35],
  NacuteAcircumflex: [0, 0, 0, 0, -20, -30, -27, -35],
  NacuteAdieresis: [0, 0, 0, 0, -20, -30, -27, -35],
  NacuteAgrave: [0, 0, 0, 0, -20, -30, -27, -35],
  NacuteAmacron: [0, 0, 0, 0, -20, -30, -27, -35],
  NacuteAogonek: [0, 0, 0, 0, -20, -30, -27, -35],
  NacuteAring: [0, 0, 0, 0, -20, -30, -27, -35],
  NacuteAtilde: [0, 0, 0, 0, -20, -30, -27, -35],
  NcaronA: [0, 0, 0, 0, -20, -30, -27, -35],
  NcaronAacute: [0, 0, 0, 0, -20, -30, -27, -35],
  NcaronAbreve: [0, 0, 0, 0, -20, -30, -27, -35],
  NcaronAcircumflex: [0, 0, 0, 0, -20, -30, -27, -35],
  NcaronAdieresis: [0, 0, 0, 0, -20, -30, -27, -35],
  NcaronAgrave: [0, 0, 0, 0, -20, -30, -27, -35],
  NcaronAmacron: [0, 0, 0, 0, -20, -30, -27, -35],
  NcaronAogonek: [0, 0, 0, 0, -20, -30, -27, -35],
  NcaronAring: [0, 0, 0, 0, -20, -30, -27, -35],
  NcaronAtilde: [0, 0, 0, 0, -20, -30, -27, -35],
  NcommaaccentA: [0, 0, 0, 0, -20, -30, -27, -35],
  NcommaaccentAacute: [0, 0, 0, 0, -20, -30, -27, -35],
  NcommaaccentAbreve: [0, 0, 0, 0, -20, -30, -27, -35],
  NcommaaccentAcircumflex: [0, 0, 0, 0, -20, -30, -27, -35],
  NcommaaccentAdieresis: [0, 0, 0, 0, -20, -30, -27, -35],
  NcommaaccentAgrave: [0, 0, 0, 0, -20, -30, -27, -35],
  NcommaaccentAmacron: [0, 0, 0, 0, -20, -30, -27, -35],
  NcommaaccentAogonek: [0, 0, 0, 0, -20, -30, -27, -35],
  NcommaaccentAring: [0, 0, 0, 0, -20, -30, -27, -35],
  NcommaaccentAtilde: [0, 0, 0, 0, -20, -30, -27, -35],
  NtildeA: [0, 0, 0, 0, -20, -30, -27, -35],
  NtildeAacute: [0, 0, 0, 0, -20, -30, -27, -35],
  NtildeAbreve: [0, 0, 0, 0, -20, -30, -27, -35],
  NtildeAcircumflex: [0, 0, 0, 0, -20, -30, -27, -35],
  NtildeAdieresis: [0, 0, 0, 0, -20, -30, -27, -35],
  NtildeAgrave: [0, 0, 0, 0, -20, -30, -27, -35],
  NtildeAmacron: [0, 0, 0, 0, -20, -30, -27, -35],
  NtildeAogonek: [0, 0, 0, 0, -20, -30, -27, -35],
  NtildeAring: [0, 0, 0, 0, -20, -30, -27, -35],
  NtildeAtilde: [0, 0, 0, 0, -20, -30, -27, -35],
  Ti: [0, 0, 0, 0, -18, -37, -55, -35],
  Tiacute: [0, 0, 0, 0, -18, -37, -55, -35],
  Tiogonek: [0, 0, 0, 0, -18, -37, -55, -35],
  Tcaroni: [0, 0, 0, 0, -18, -37, -55, -35],
  Tcaroniacute: [0, 0, 0, 0, -18, -37, -55, -35],
  Tcaroniogonek: [0, 0, 0, 0, -18, -37, -55, -35],
  Tcommaaccenti: [0, 0, 0, 0, -18, -37, -55, -35],
  Tcommaaccentiacute: [0, 0, 0, 0, -18, -37, -55, -35],
  Tcommaaccentiogonek: [0, 0, 0, 0, -18, -37, -55, -35],
  Vi: [0, 0, 0, 0, -37, -55, -74, -60],
  Viacute: [0, 0, 0, 0, -37, -55, -74, -60],
  Vicircumflex: [0, 0, 0, 0, -37, 0, -34, -20],
  Vidieresis: [0, 0, 0, 0, -37, 0, -34, -20],
  Vigrave: [0, 0, 0, 0, -37, 0, -34, -20],
  Vimacron: [0, 0, 0, 0, -37, 0, -34, -20],
  Viogonek: [0, 0, 0, 0, -37, -55, -74, -60],
  Wi: [0, 0, 0, 0, -18, -37, -55, -40],
  Wiacute: [0, 0, 0, 0, -18, -37, -55, -40],
  Wiogonek: [0, 0, 0, 0, -18, -37, -55, -40],
  fi: [0, 0, 0, 0, -25, 0, -20, -20],
  gperiod: [0, 0, 0, 0, -15, 0, -15],
  gbreveperiod: [0, 0, 0, 0, -15, 0, -15],
  gcommaaccentperiod: [0, 0, 0, 0, -15, 0, -15],
  iv: [0, 0, 0, 0, -10, 0, 0, -25],
  iacutev: [0, 0, 0, 0, -10, 0, 0, -25],
  icircumflexv: [0, 0, 0, 0, -10, 0, 0, -25],
  idieresisv: [0, 0, 0, 0, -10, 0, 0, -25],
  igravev: [0, 0, 0, 0, -10, 0, 0, -25],
  imacronv: [0, 0, 0, 0, -10, 0, 0, -25],
  iogonekv: [0, 0, 0, 0, -10, 0, 0, -25],
  ky: [0, 0, 0, 0, -15, 0, -10, -15],
  kyacute: [0, 0, 0, 0, -15, 0, -10, -15],
  kydieresis: [0, 0, 0, 0, -15, 0, -10, -15],
  kcommaaccenty: [0, 0, 0, 0, -15, 0, -10, -15],
  kcommaaccentyacute: [0, 0, 0, 0, -15, 0, -10, -15],
  kcommaaccentydieresis: [0, 0, 0, 0, -15, 0, -10, -15],
  quotedblleftA: [0, 0, 0, 0, -10, 0, 0, -80],
  quotedblleftAacute: [0, 0, 0, 0, -10, 0, 0, -80],
  quotedblleftAbreve: [0, 0, 0, 0, -10, 0, 0, -80],
  quotedblleftAcircumflex: [0, 0, 0, 0, -10, 0, 0, -80],
  quotedblleftAdieresis: [0, 0, 0, 0, -10, 0, 0, -80],
  quotedblleftAgrave: [0, 0, 0, 0, -10, 0, 0, -80],
  quotedblleftAmacron: [0, 0, 0, 0, -10, 0, 0, -80],
  quotedblleftAogonek: [0, 0, 0, 0, -10, 0, 0, -80],
  quotedblleftAring: [0, 0, 0, 0, -10, 0, 0, -80],
  quotedblleftAtilde: [0, 0, 0, 0, -10, 0, 0, -80],
  quoteleftA: [0, 0, 0, 0, -10, 0, 0, -80],
  quoteleftAacute: [0, 0, 0, 0, -10, 0, 0, -80],
  quoteleftAbreve: [0, 0, 0, 0, -10, 0, 0, -80],
  quoteleftAcircumflex: [0, 0, 0, 0, -10, 0, 0, -80],
  quoteleftAdieresis: [0, 0, 0, 0, -10, 0, 0, -80],
  quoteleftAgrave: [0, 0, 0, 0, -10, 0, 0, -80],
  quoteleftAmacron: [0, 0, 0, 0, -10, 0, 0, -80],
  quoteleftAogonek: [0, 0, 0, 0, -10, 0, 0, -80],
  quoteleftAring: [0, 0, 0, 0, -10, 0, 0, -80],
  quoteleftAtilde: [0, 0, 0, 0, -10, 0, 0, -80],
  re: [0, 0, 0, 0, -18, 0, -37],
  reacute: [0, 0, 0, 0, -18, 0, -37],
  recaron: [0, 0, 0, 0, -18, 0, -37],
  recircumflex: [0, 0, 0, 0, -18, 0, -37],
  redieresis: [0, 0, 0, 0, -18, 0, -37],
  redotaccent: [0, 0, 0, 0, -18, 0, -37],
  regrave: [0, 0, 0, 0, -18, 0, -37],
  remacron: [0, 0, 0, 0, -18, 0, -37],
  reogonek: [0, 0, 0, 0, -18, 0, -37],
  racutee: [0, 0, 0, 0, -18, 0, -37],
  racuteeacute: [0, 0, 0, 0, -18, 0, -37],
  racuteecaron: [0, 0, 0, 0, -18, 0, -37],
  racuteecircumflex: [0, 0, 0, 0, -18, 0, -37],
  racuteedieresis: [0, 0, 0, 0, -18, 0, -37],
  racuteedotaccent: [0, 0, 0, 0, -18, 0, -37],
  racuteegrave: [0, 0, 0, 0, -18, 0, -37],
  racuteemacron: [0, 0, 0, 0, -18, 0, -37],
  racuteeogonek: [0, 0, 0, 0, -18, 0, -37],
  rcarone: [0, 0, 0, 0, -18, 0, -37],
  rcaroneacute: [0, 0, 0, 0, -18, 0, -37],
  rcaronecaron: [0, 0, 0, 0, -18, 0, -37],
  rcaronecircumflex: [0, 0, 0, 0, -18, 0, -37],
  rcaronedieresis: [0, 0, 0, 0, -18, 0, -37],
  rcaronedotaccent: [0, 0, 0, 0, -18, 0, -37],
  rcaronegrave: [0, 0, 0, 0, -18, 0, -37],
  rcaronemacron: [0, 0, 0, 0, -18, 0, -37],
  rcaroneogonek: [0, 0, 0, 0, -18, 0, -37],
  rcommaaccente: [0, 0, 0, 0, -18, 0, -37],
  rcommaaccenteacute: [0, 0, 0, 0, -18, 0, -37],
  rcommaaccentecaron: [0, 0, 0, 0, -18, 0, -37],
  rcommaaccentecircumflex: [0, 0, 0, 0, -18, 0, -37],
  rcommaaccentedieresis: [0, 0, 0, 0, -18, 0, -37],
  rcommaaccentedotaccent: [0, 0, 0, 0, -18, 0, -37],
  rcommaaccentegrave: [0, 0, 0, 0, -18, 0, -37],
  rcommaaccentemacron: [0, 0, 0, 0, -18, 0, -37],
  rcommaaccenteogonek: [0, 0, 0, 0, -18, 0, -37],
  spaceA: [0, 0, 0, 0, -55, -37, -18, -55],
  spaceAacute: [0, 0, 0, 0, -55, -37, -18, -55],
  spaceAbreve: [0, 0, 0, 0, -55, -37, -18, -55],
  spaceAcircumflex: [0, 0, 0, 0, -55, -37, -18, -55],
  spaceAdieresis: [0, 0, 0, 0, -55, -37, -18, -55],
  spaceAgrave: [0, 0, 0, 0, -55, -37, -18, -55],
  spaceAmacron: [0, 0, 0, 0, -55, -37, -18, -55],
  spaceAogonek: [0, 0, 0, 0, -55, -37, -18, -55],
  spaceAring: [0, 0, 0, 0, -55, -37, -18, -55],
  spaceAtilde: [0, 0, 0, 0, -55, -37, -18, -55],
  Fi: [0, 0, 0, 0, 0, -40, -45],
  Fiacute: [0, 0, 0, 0, 0, -40, -45],
  Ficircumflex: [0, 0, 0, 0, 0, -40, -45],
  Fidieresis: [0, 0, 0, 0, 0, -40, -45],
  Figrave: [0, 0, 0, 0, 0, -40, -45],
  Fimacron: [0, 0, 0, 0, 0, -40, -45],
  Fiogonek: [0, 0, 0, 0, 0, -40, -45],
  eb: [0, 0, 0, 0, 0, -10],
  eacuteb: [0, 0, 0, 0, 0, -10],
  ecaronb: [0, 0, 0, 0, 0, -10],
  ecircumflexb: [0, 0, 0, 0, 0, -10],
  edieresisb: [0, 0, 0, 0, 0, -10],
  edotaccentb: [0, 0, 0, 0, 0, -10],
  egraveb: [0, 0, 0, 0, 0, -10],
  emacronb: [0, 0, 0, 0, 0, -10],
  eogonekb: [0, 0, 0, 0, 0, -10],
  ff: [0, 0, 0, 0, 0, -18, -18, -25],
  quoterightt: [0, 0, 0, 0, 0, -37, -30, -18],
  quoterighttcommaaccent: [0, 0, 0, 0, 0, -37, -30, -18],
  Yicircumflex: [0, 0, 0, 0, 0, 0, -34],
  Yidieresis: [0, 0, 0, 0, 0, 0, -34],
  Yigrave: [0, 0, 0, 0, 0, 0, -34],
  Yimacron: [0, 0, 0, 0, 0, 0, -34],
  Yacuteicircumflex: [0, 0, 0, 0, 0, 0, -34],
  Yacuteidieresis: [0, 0, 0, 0, 0, 0, -34],
  Yacuteigrave: [0, 0, 0, 0, 0, 0, -34],
  Yacuteimacron: [0, 0, 0, 0, 0, 0, -34],
  Ydieresisicircumflex: [0, 0, 0, 0, 0, 0, -34],
  Ydieresisidieresis: [0, 0, 0, 0, 0, 0, -34],
  Ydieresisigrave: [0, 0, 0, 0, 0, 0, -34],
  Ydieresisimacron: [0, 0, 0, 0, 0, 0, -34],
  eg: [0, 0, 0, 0, 0, 0, -40, -15],
  egbreve: [0, 0, 0, 0, 0, 0, -40, -15],
  egcommaaccent: [0, 0, 0, 0, 0, 0, -40, -15],
  eacuteg: [0, 0, 0, 0, 0, 0, -40, -15],
  eacutegbreve: [0, 0, 0, 0, 0, 0, -40, -15],
  eacutegcommaaccent: [0, 0, 0, 0, 0, 0, -40, -15],
  ecarong: [0, 0, 0, 0, 0, 0, -40, -15],
  ecarongbreve: [0, 0, 0, 0, 0, 0, -40, -15],
  ecarongcommaaccent: [0, 0, 0, 0, 0, 0, -40, -15],
  ecircumflexg: [0, 0, 0, 0, 0, 0, -40, -15],
  ecircumflexgbreve: [0, 0, 0, 0, 0, 0, -40, -15],
  ecircumflexgcommaaccent: [0, 0, 0, 0, 0, 0, -40, -15],
  edieresisg: [0, 0, 0, 0, 0, 0, -40, -15],
  edieresisgbreve: [0, 0, 0, 0, 0, 0, -40, -15],
  edieresisgcommaaccent: [0, 0, 0, 0, 0, 0, -40, -15],
  edotaccentg: [0, 0, 0, 0, 0, 0, -40, -15],
  edotaccentgbreve: [0, 0, 0, 0, 0, 0, -40, -15],
  edotaccentgcommaaccent: [0, 0, 0, 0, 0, 0, -40, -15],
  egraveg: [0, 0, 0, 0, 0, 0, -40, -15],
  egravegbreve: [0, 0, 0, 0, 0, 0, -40, -15],
  egravegcommaaccent: [0, 0, 0, 0, 0, 0, -40, -15],
  emacrong: [0, 0, 0, 0, 0, 0, -40, -15],
  emacrongbreve: [0, 0, 0, 0, 0, 0, -40, -15],
  emacrongcommaaccent: [0, 0, 0, 0, 0, 0, -40, -15],
  eogonekg: [0, 0, 0, 0, 0, 0, -40, -15],
  eogonekgbreve: [0, 0, 0, 0, 0, 0, -40, -15],
  eogonekgcommaaccent: [0, 0, 0, 0, 0, 0, -40, -15],
  fiogonek: [0, 0, 0, 0, 0, 0, -20],
  gcomma: [0, 0, 0, 0, 0, 0, -10],
  gbrevecomma: [0, 0, 0, 0, 0, 0, -10],
  gcommaaccentcomma: [0, 0, 0, 0, 0, 0, -10],
  og: [0, 0, 0, 0, 0, 0, -10],
  ogbreve: [0, 0, 0, 0, 0, 0, -10],
  ogcommaaccent: [0, 0, 0, 0, 0, 0, -10],
  oacuteg: [0, 0, 0, 0, 0, 0, -10],
  oacutegbreve: [0, 0, 0, 0, 0, 0, -10],
  oacutegcommaaccent: [0, 0, 0, 0, 0, 0, -10],
  ocircumflexg: [0, 0, 0, 0, 0, 0, -10],
  ocircumflexgbreve: [0, 0, 0, 0, 0, 0, -10],
  ocircumflexgcommaaccent: [0, 0, 0, 0, 0, 0, -10],
  odieresisg: [0, 0, 0, 0, 0, 0, -10],
  odieresisgbreve: [0, 0, 0, 0, 0, 0, -10],
  odieresisgcommaaccent: [0, 0, 0, 0, 0, 0, -10],
  ograveg: [0, 0, 0, 0, 0, 0, -10],
  ogravegbreve: [0, 0, 0, 0, 0, 0, -10],
  ogravegcommaaccent: [0, 0, 0, 0, 0, 0, -10],
  ohungarumlautg: [0, 0, 0, 0, 0, 0, -10],
  ohungarumlautgbreve: [0, 0, 0, 0, 0, 0, -10],
  ohungarumlautgcommaaccent: [0, 0, 0, 0, 0, 0, -10],
  omacrong: [0, 0, 0, 0, 0, 0, -10],
  omacrongbreve: [0, 0, 0, 0, 0, 0, -10],
  omacrongcommaaccent: [0, 0, 0, 0, 0, 0, -10],
  otildeg: [0, 0, 0, 0, 0, 0, -10],
  otildegbreve: [0, 0, 0, 0, 0, 0, -10],
  otildegcommaaccent: [0, 0, 0, 0, 0, 0, -10],
  fiacute: [0, 0, 0, 0, 0, 0, 0, -20],
  ga: [0, 0, 0, 0, 0, 0, 0, -5],
  gaacute: [0, 0, 0, 0, 0, 0, 0, -5],
  gabreve: [0, 0, 0, 0, 0, 0, 0, -5],
  gacircumflex: [0, 0, 0, 0, 0, 0, 0, -5],
  gadieresis: [0, 0, 0, 0, 0, 0, 0, -5],
  gagrave: [0, 0, 0, 0, 0, 0, 0, -5],
  gamacron: [0, 0, 0, 0, 0, 0, 0, -5],
  gaogonek: [0, 0, 0, 0, 0, 0, 0, -5],
  garing: [0, 0, 0, 0, 0, 0, 0, -5],
  gatilde: [0, 0, 0, 0, 0, 0, 0, -5],
  gbrevea: [0, 0, 0, 0, 0, 0, 0, -5],
  gbreveaacute: [0, 0, 0, 0, 0, 0, 0, -5],
  gbreveabreve: [0, 0, 0, 0, 0, 0, 0, -5],
  gbreveacircumflex: [0, 0, 0, 0, 0, 0, 0, -5],
  gbreveadieresis: [0, 0, 0, 0, 0, 0, 0, -5],
  gbreveagrave: [0, 0, 0, 0, 0, 0, 0, -5],
  gbreveamacron: [0, 0, 0, 0, 0, 0, 0, -5],
  gbreveaogonek: [0, 0, 0, 0, 0, 0, 0, -5],
  gbrevearing: [0, 0, 0, 0, 0, 0, 0, -5],
  gbreveatilde: [0, 0, 0, 0, 0, 0, 0, -5],
  gcommaaccenta: [0, 0, 0, 0, 0, 0, 0, -5],
  gcommaaccentaacute: [0, 0, 0, 0, 0, 0, 0, -5],
  gcommaaccentabreve: [0, 0, 0, 0, 0, 0, 0, -5],
  gcommaaccentacircumflex: [0, 0, 0, 0, 0, 0, 0, -5],
  gcommaaccentadieresis: [0, 0, 0, 0, 0, 0, 0, -5],
  gcommaaccentagrave: [0, 0, 0, 0, 0, 0, 0, -5],
  gcommaaccentamacron: [0, 0, 0, 0, 0, 0, 0, -5],
  gcommaaccentaogonek: [0, 0, 0, 0, 0, 0, 0, -5],
  gcommaaccentaring: [0, 0, 0, 0, 0, 0, 0, -5],
  gcommaaccentatilde: [0, 0, 0, 0, 0, 0, 0, -5]
};
var data = {
  attributes: attributes,
  glyphWidths: glyphWidths,
  kernPairs: kernPairs
};

var initFont = function initFont(font) {
  return [
    font.FontName,
    {
      attributes: font,
      glyphWidths: {},
      kernPairs: {}
    }
  ];
};

var expandData = function expandData(data) {
  var attributes = data.attributes,
    glyphWidths = data.glyphWidths,
    kernPairs = data.kernPairs;
  var fonts = attributes.map(initFont);
  Object.keys(glyphWidths).forEach(function(key) {
    glyphWidths[key].forEach(function(value, index) {
      if (value) fonts[index][1].glyphWidths[key] = value;
    });
  });
  Object.keys(kernPairs).forEach(function(key) {
    kernPairs[key].forEach(function(value, index) {
      if (value) fonts[index][1].kernPairs[key] = value;
    });
  });
  return Object.fromEntries(fonts);
};

var STANDARD_FONTS = expandData(data);

var createStandardFont = function createStandardFont(PDFFont) {
  return /*#__PURE__*/ (function(_PDFFont) {
    _inheritsLoose(StandardFont, _PDFFont);

    function StandardFont(document, name, id) {
      var _this;

      _this = _PDFFont.call(this) || this;
      _this.document = document;
      _this.name = name;
      _this.id = id;
      _this.font = AFMFont.fromJson(STANDARD_FONTS[_this.name]);
      _this.ascender = _this.font.ascender;
      _this.descender = _this.font.descender;
      _this.bbox = _this.font.bbox;
      _this.lineGap = _this.font.lineGap;
      return _this;
    }

    var _proto = StandardFont.prototype;

    _proto.embed = function embed() {
      this.dictionary.data = {
        Type: 'Font',
        BaseFont: this.name,
        Subtype: 'Type1',
        Encoding: 'WinAnsiEncoding'
      };
      return this.dictionary.end();
    };

    _proto.encode = function encode(text) {
      var encoded = this.font.encodeText(text);
      var glyphs = this.font.glyphsForString('' + text);
      var advances = this.font.advancesForGlyphs(glyphs);
      var positions = [];

      for (var i = 0; i < glyphs.length; i++) {
        var glyph = glyphs[i];
        positions.push({
          xAdvance: advances[i],
          yAdvance: 0,
          xOffset: 0,
          yOffset: 0,
          advanceWidth: this.font.widthOfGlyph(glyph)
        });
      }

      return [encoded, positions];
    };

    _proto.encodeGlyphs = function encodeGlyphs(glyphs) {
      var res = [];

      for (
        var _i = 0, _Array$from = Array.from(glyphs);
        _i < _Array$from.length;
        _i++
      ) {
        var glyph = _Array$from[_i];
        res.push(('00' + glyph.id.toString(16)).slice(-2));
      }

      return res;
    };

    _proto.widthOfString = function widthOfString(string, size) {
      var glyphs = this.font.glyphsForString('' + string);
      var advances = this.font.advancesForGlyphs(glyphs);
      var width = 0;

      for (
        var _i2 = 0, _Array$from2 = Array.from(advances);
        _i2 < _Array$from2.length;
        _i2++
      ) {
        var advance = _Array$from2[_i2];
        width += advance;
      }

      var scale = size / 1000;
      return width * scale;
    };

    StandardFont.isStandardFont = function isStandardFont(name) {
      return name in STANDARD_FONTS;
    };

    return StandardFont;
  })(PDFFont);
};

var toHex = function toHex() {
  for (
    var _len = arguments.length, codePoints = new Array(_len), _key = 0;
    _key < _len;
    _key++
  ) {
    codePoints[_key] = arguments[_key];
  }

  var codes = Array.from(codePoints).map(function(code) {
    return ('0000' + code.toString(16)).slice(-4);
  });
  return codes.join('');
};

var createEmbeddedFont = function createEmbeddedFont(PDFFont) {
  return /*#__PURE__*/ (function(_PDFFont) {
    _inheritsLoose(EmbeddedFont, _PDFFont);

    function EmbeddedFont(document, font, id) {
      var _this;

      _this = _PDFFont.call(this) || this;
      _this.document = document;
      _this.font = font;
      _this.id = id;
      _this.subset = _this.font.createSubset();
      _this.unicode = [[0]];
      _this.widths = [_this.font.getGlyph(0).advanceWidth];
      _this.name = _this.font.postscriptName;
      _this.scale = 1000 / _this.font.unitsPerEm;
      _this.ascender = _this.font.ascent * _this.scale;
      _this.descender = _this.font.descent * _this.scale;
      _this.xHeight = _this.font.xHeight * _this.scale;
      _this.capHeight = _this.font.capHeight * _this.scale;
      _this.lineGap = _this.font.lineGap * _this.scale;
      _this.bbox = _this.font.bbox;
      _this.layoutCache = Object.create(null);
      return _this;
    }

    var _proto = EmbeddedFont.prototype;

    _proto.layoutRun = function layoutRun(text, features) {
      var run = this.font.layout(text, features); // Normalize position values

      for (var i = 0; i < run.positions.length; i++) {
        var position = run.positions[i];

        for (var key in position) {
          position[key] *= this.scale;
        }

        position.advanceWidth = run.glyphs[i].advanceWidth * this.scale;
      }

      return run;
    };

    _proto.layoutCached = function layoutCached(text) {
      var cached;

      if ((cached = this.layoutCache[text])) {
        return cached;
      }

      var run = this.layoutRun(text);
      this.layoutCache[text] = run;
      return run;
    };

    _proto.layout = function layout(text, features, onlyWidth) {
      // Skip the cache if any user defined features are applied
      if (onlyWidth == null) {
        onlyWidth = false;
      }

      if (features) {
        return this.layoutRun(text, features);
      }

      var glyphs = onlyWidth ? null : [];
      var positions = onlyWidth ? null : [];
      var advanceWidth = 0; // Split the string by words to increase cache efficiency.
      // For this purpose, spaces and tabs are a good enough delimeter.

      var last = 0;
      var index = 0;

      while (index <= text.length) {
        var needle;

        if (
          (index === text.length && last < index) ||
          ((needle = text.charAt(index)), [' ', '\t'].includes(needle))
        ) {
          var run = this.layoutCached(text.slice(last, ++index));

          if (!onlyWidth) {
            glyphs.push.apply(glyphs, Array.from(run.glyphs || []));
            positions.push.apply(positions, Array.from(run.positions || []));
          }

          advanceWidth += run.advanceWidth;
          last = index;
        } else {
          index++;
        }
      }

      return {
        glyphs: glyphs,
        positions: positions,
        advanceWidth: advanceWidth
      };
    };

    _proto.encode = function encode(text, features) {
      var _this$layout = this.layout(text, features),
        glyphs = _this$layout.glyphs,
        positions = _this$layout.positions;

      var res = [];

      for (var i = 0; i < glyphs.length; i++) {
        var glyph = glyphs[i];
        var gid = this.subset.includeGlyph(glyph.id);
        res.push(('0000' + gid.toString(16)).slice(-4));

        if (this.widths[gid] == null) {
          this.widths[gid] = glyph.advanceWidth * this.scale;
        }

        if (this.unicode[gid] == null) {
          this.unicode[gid] = this.font._cmapProcessor.codePointsForGlyph(
            glyph.id
          );
        }
      }

      return [res, positions];
    };

    _proto.encodeGlyphs = function encodeGlyphs(glyphs) {
      var res = [];

      for (var i = 0; i < glyphs.length; i++) {
        var glyph = glyphs[i];
        var gid = this.subset.includeGlyph(glyph.id);
        res.push(('0000' + gid.toString(16)).slice(-4));

        if (this.widths[gid] == null) {
          this.widths[gid] = glyph.advanceWidth * this.scale;
        }

        if (this.unicode[gid] == null) {
          this.unicode[gid] = this.font._cmapProcessor.codePointsForGlyph(
            glyph.id
          );
        }
      }

      return res;
    };

    _proto.widthOfString = function widthOfString(string, size, features) {
      var width = this.layout(string, features, true).advanceWidth;
      var scale = size / 1000;
      return width * scale;
    };

    _proto.embed = function embed() {
      var isCFF = this.subset.cff != null;
      var fontFile = this.document.ref();

      if (isCFF) {
        fontFile.data.Subtype = 'CIDFontType0C';
      }

      fontFile.end(this.subset.encode());
      var familyClass =
        ((this.font['OS/2'] != null
          ? this.font['OS/2'].sFamilyClass
          : undefined) || 0) >> 8;
      var flags = 0;

      if (this.font.post.isFixedPitch) {
        flags |= 1 << 0;
      }

      if (1 <= familyClass && familyClass <= 7) {
        flags |= 1 << 1;
      }

      flags |= 1 << 2; // assume the font uses non-latin characters

      if (familyClass === 10) {
        flags |= 1 << 3;
      }

      if (this.font.head.macStyle.italic) {
        flags |= 1 << 6;
      } // generate a random tag (6 uppercase letters. 65 is the char code for 'A')

      var tag = [0, 1, 2, 3, 4, 5]
        .map(function(i) {
          return String.fromCharCode(Math.random() * 26 + 65);
        })
        .join('');
      var name = tag + '+' + this.font.postscriptName;
      var bbox = this.font.bbox;
      var descriptor = this.document.ref({
        Type: 'FontDescriptor',
        FontName: name,
        Flags: flags,
        FontBBox: [
          bbox.minX * this.scale,
          bbox.minY * this.scale,
          bbox.maxX * this.scale,
          bbox.maxY * this.scale
        ],
        ItalicAngle: this.font.italicAngle,
        Ascent: this.ascender,
        Descent: this.descender,
        CapHeight: (this.font.capHeight || this.font.ascent) * this.scale,
        XHeight: (this.font.xHeight || 0) * this.scale,
        StemV: 0
      }); // not sure how to calculate this

      if (isCFF) {
        descriptor.data.FontFile3 = fontFile;
      } else {
        descriptor.data.FontFile2 = fontFile;
      }

      descriptor.end();
      var descendantFont = this.document.ref({
        Type: 'Font',
        Subtype: isCFF ? 'CIDFontType0' : 'CIDFontType2',
        BaseFont: name,
        CIDSystemInfo: {
          Registry: new String('Adobe'),
          Ordering: new String('Identity'),
          Supplement: 0
        },
        FontDescriptor: descriptor,
        W: [0, this.widths]
      });
      descendantFont.end();
      this.dictionary.data = {
        Type: 'Font',
        Subtype: 'Type0',
        BaseFont: name,
        Encoding: 'Identity-H',
        DescendantFonts: [descendantFont],
        ToUnicode: this.toUnicodeCmap()
      };
      return this.dictionary.end();
    }; // Maps the glyph ids encoded in the PDF back to unicode strings
    // Because of ligature substitutions and the like, there may be one or more
    // unicode characters represented by each glyph.

    _proto.toUnicodeCmap = function toUnicodeCmap() {
      var cmap = this.document.ref();
      var entries = [];

      for (
        var _i = 0, _Array$from = Array.from(this.unicode);
        _i < _Array$from.length;
        _i++
      ) {
        var codePoints = _Array$from[_i];
        var encoded = [];

        for (
          var _i2 = 0, _Array$from2 = Array.from(codePoints);
          _i2 < _Array$from2.length;
          _i2++
        ) {
          var value = _Array$from2[_i2];

          if (value > 0xffff) {
            value -= 0x10000;
            encoded.push(toHex(((value >>> 10) & 0x3ff) | 0xd800));
            value = 0xdc00 | (value & 0x3ff);
          }

          encoded.push(toHex(value));
          entries.push('<' + encoded.join(' ') + '>');
        }
      }

      cmap.end(
        '  /CIDInit /ProcSet findresource begin\n  12 dict begin\n  begincmap\n  /CIDSystemInfo <<\n  /Registry (Adobe)\n  /Ordering (UCS)\n  /Supplement 0\n  >> def\n  /CMapName /Adobe-Identity-UCS def\n  /CMapType 2 def\n  1 begincodespacerange\n  <0000><ffff>\n  endcodespacerange\n  1 beginbfrange\n  <0000> <' +
          toHex(entries.length - 1) +
          '> [' +
          entries.join(' ') +
          ']\n  endbfrange\n  endcmap\n  CMapName currentdict /CMap defineresource pop\n  end\n  end  '
      );
      return cmap;
    };

    return EmbeddedFont;
  })(PDFFont);
};

var PDFFont = /*#__PURE__*/ (function() {
  function PDFFont() {}

  PDFFont.open = function open(document, src, family, id) {
    var font;

    if (typeof src === 'string') {
      if (StandardFont.isStandardFont(src)) {
        return new StandardFont(document, src, id);
      }

      {
        font = fontkit.openSync(src, family);
      }
    } else if (src instanceof Uint8Array) {
      font = fontkit.create(src, family);
    } else if (src instanceof ArrayBuffer) {
      font = fontkit.create(new Uint8Array(src), family);
    } else if (typeof src === 'object') {
      font = src;
    }

    if (font == null) {
      throw new Error('Not a supported font format or standard PDF font.');
    }

    return new EmbeddedFont(document, font, id);
  };

  var _proto = PDFFont.prototype;

  _proto.encode = function encode() {
    throw new Error('Must be implemented by subclasses');
  };

  _proto.widthOfString = function widthOfString() {
    throw new Error('Must be implemented by subclasses');
  };

  _proto.ref = function ref() {
    return this.dictionary != null
      ? this.dictionary
      : (this.dictionary = this.document.ref());
  };

  _proto.finalize = function finalize() {
    if (this.embedded || this.dictionary == null) {
      return;
    }

    this.embed();
    return (this.embedded = true);
  };

  _proto.embed = function embed() {
    throw new Error('Must be implemented by subclasses');
  };

  _proto.lineHeight = function lineHeight(size, includeGap) {
    if (includeGap == null) {
      includeGap = false;
    }

    var gap = includeGap ? this.lineGap : 0;
    return ((this.ascender + gap - this.descender) / 1000) * size;
  };

  return PDFFont;
})();
var StandardFont = createStandardFont(PDFFont);
var EmbeddedFont = createEmbeddedFont(PDFFont);

var FontsMixin = {
  initFonts: function initFonts() {
    // Lookup table for embedded fonts
    this._fontFamilies = {};
    this._fontCount = 0; // Font state

    this._fontSize = 12;
    this._font = null;
    this._registeredFonts = {}; // Set the default font

    return this.font('Helvetica');
  },
  font: function font(src, family, size) {
    var cacheKey, font;

    if (typeof family === 'number') {
      size = family;
      family = null;
    } // check registered fonts if src is a string

    if (typeof src === 'string' && this._registeredFonts[src]) {
      cacheKey = src;
      var _this$_registeredFont = this._registeredFonts[src];
      src = _this$_registeredFont.src;
      family = _this$_registeredFont.family;
    } else {
      cacheKey = family || src;

      if (typeof cacheKey !== 'string') {
        cacheKey = null;
      }
    }

    if (size != null) {
      this.fontSize(size);
    } // fast path: check if the font is already in the PDF

    if ((font = this._fontFamilies[cacheKey])) {
      this._font = font;
      return this;
    } // load the font

    var id = 'F' + ++this._fontCount;
    this._font = PDFFont.open(this, src, family, id); // check for existing font familes with the same name already in the PDF
    // useful if the font was passed as a buffer

    if ((font = this._fontFamilies[this._font.name])) {
      this._font = font;
      return this;
    } // save the font for reuse later

    if (cacheKey) {
      this._fontFamilies[cacheKey] = this._font;
    }

    if (this._font.name) {
      this._fontFamilies[this._font.name] = this._font;
    }

    return this;
  },
  fontSize: function fontSize(_fontSize) {
    this._fontSize = _fontSize;
    return this;
  },
  currentLineHeight: function currentLineHeight(includeGap) {
    if (includeGap == null) {
      includeGap = false;
    }

    return this._font.lineHeight(this._fontSize, includeGap);
  },
  registerFont: function registerFont(name, src, family) {
    this._registeredFonts[name] = {
      src: src,
      family: family
    };
    return this;
  }
};

var number = PDFObject$1.number;
var TextMixin = {
  initText: function initText() {
    this._line = this._line.bind(this); // Current coordinates

    this.x = 0;
    this.y = 0;
    return (this._lineGap = 0);
  },
  _text: function _text(text, x, y, options, lineCallback) {
    var _this = this;

    options = this._initOptions(x, y, options); // Convert text to a string

    text = text == null ? '' : '' + text; // if the wordSpacing option is specified, remove multiple consecutive spaces

    if (options.wordSpacing) {
      text = text.replace(/\s{2,}/g, ' ');
    }

    var addStructure = function addStructure() {
      if (options.structParent) {
        options.structParent.add(
          _this.struct(options.structType || 'P', [
            _this.markStructureContent(options.structType || 'P')
          ])
        );
      }
    };

    for (
      var _iterator = _createForOfIteratorHelperLoose(text.split('\n')), _step;
      !(_step = _iterator()).done;

    ) {
      var line = _step.value;
      addStructure();
      lineCallback(line, options);
    }

    return this;
  },
  text: function text(_text2, x, y, options) {
    return this._text(_text2, x, y, options, this._line);
  },
  widthOfString: function widthOfString(string, options) {
    if (options === void 0) {
      options = {};
    }

    return (
      this._font.widthOfString(string, this._fontSize, options.features) +
      (options.characterSpacing || 0) * (string.length - 1)
    );
  },
  _initOptions: function _initOptions(x, y, options) {
    if (x === void 0) {
      x = {};
    }

    if (options === void 0) {
      options = {};
    }

    if (typeof x === 'object') {
      options = x;
      x = null;
    } // clone options object

    var result = Object.assign({}, options); // extend options with previous values for continued text

    if (this._textOptions) {
      for (var key in this._textOptions) {
        var val = this._textOptions[key];

        if (key !== 'continued') {
          if (result[key] === undefined) {
            result[key] = val;
          }
        }
      }
    } // Update the current position

    if (x != null) {
      this.x = x;
    }

    if (y != null) {
      this.y = y;
    } // wrap to margins if no x or y position passed

    if (result.lineBreak !== false) {
      if (result.width == null) {
        result.width = this.page.width - this.x - this.page.margins.right;
      }

      result.width = Math.max(result.width, 0);
    }

    if (!result.columns) {
      result.columns = 0;
    }

    if (result.columnGap == null) {
      result.columnGap = 18;
    } // 1/4 inch

    return result;
  },
  _line: function _line(text, options) {
    if (options === void 0) {
      options = {};
    }

    this._fragment(text, this.x, this.y, options);

    return (this.x += this.widthOfString(text));
  },
  _fragment: function _fragment(text, x, y, options) {
    text = ('' + text).replace(/\n/g, '');
    if (text.length === 0) return;

    var _this$_font$encode = this._font.encode(text, options.features),
      encoded = _this$_font$encode[0],
      positions = _this$_font$encode[1];

    var dy = (this._font.ascender / 1000) * this._fontSize;

    this._glyphs(encoded, positions, x, y + dy, options);
  },
  _glyphs: function _glyphs(encoded, positions, x, y, options) {
    var _this2 = this;

    var commands = [];
    var scale = this._fontSize / 1000;
    var i;
    var last = 0;
    var hadOffset = false;
    this.save(); // flip coordinate system

    this.transform(1, 0, 0, -1, 0, this.page.height);
    y = this.page.height - y; // add current font to page if necessary

    if (this.page.fonts[this._font.id] == null) {
      this.page.fonts[this._font.id] = this._font.ref();
    } // begin the text object

    this.addContent('BT'); // text position

    this.addContent('1 0 0 1 ' + number(x) + ' ' + number(y) + ' Tm'); // font and font size

    this.addContent('/' + this._font.id + ' ' + number(this._fontSize) + ' Tf'); // rendering mode

    var mode = options.fill && options.stroke ? 2 : options.stroke ? 1 : 0;

    if (mode) {
      this.addContent(mode + ' Tr');
    } // Adds a segment of text to the TJ command buffer

    var addSegment = function addSegment(cur) {
      if (last < cur) {
        var hex = encoded.slice(last, cur).join('');
        var advance =
          positions[cur - 1].xAdvance - positions[cur - 1].advanceWidth;
        commands.push('<' + hex + '> ' + number(-advance));
      }

      return (last = cur);
    }; // Flushes the current TJ commands to the output stream

    var flush = function flush(i) {
      addSegment(i);

      if (commands.length > 0) {
        _this2.addContent('[' + commands.join(' ') + '] TJ');

        return (commands.length = 0);
      }
    };

    for (i = 0; i < positions.length; i++) {
      // If we have an x or y offset, we have to break out of the current TJ command
      // so we can move the text position.
      var pos = positions[i];

      if (pos.xOffset || pos.yOffset) {
        // Flush the current buffer
        flush(i); // Move the text position and flush just the current character

        this.addContent(
          '1 0 0 1 ' +
            number(x + pos.xOffset * scale) +
            ' ' +
            number(y + pos.yOffset * scale) +
            ' Tm'
        );
        flush(i + 1);
        hadOffset = true;
      } else {
        // If the last character had an offset, reset the text position
        if (hadOffset) {
          this.addContent('1 0 0 1 ' + number(x) + ' ' + number(y) + ' Tm');
          hadOffset = false;
        } // Group segments that don't have any advance adjustments

        if (pos.xAdvance - pos.advanceWidth !== 0) {
          addSegment(i + 1);
        }
      }

      x += pos.xAdvance * scale;
    } // Flush any remaining commands

    flush(i); // end the text object

    this.addContent('ET'); // restore flipped coordinate system

    return this.restore();
  }
};

var MARKERS = [
  0xffc0,
  0xffc1,
  0xffc2,
  0xffc3,
  0xffc5,
  0xffc6,
  0xffc7,
  0xffc8,
  0xffc9,
  0xffca,
  0xffcb,
  0xffcc,
  0xffcd,
  0xffce,
  0xffcf
];

var JPEG = /*#__PURE__*/ (function() {
  function JPEG(data, label) {
    var marker;
    this.data = data;
    this.label = label;

    if (this.data.readUInt16BE(0) !== 0xffd8) {
      throw 'SOI not found in JPEG';
    }

    var pos = 2;

    while (pos < this.data.length) {
      marker = this.data.readUInt16BE(pos);
      pos += 2;

      if (Array.from(MARKERS).includes(marker)) {
        break;
      }

      pos += this.data.readUInt16BE(pos);
    }

    if (!Array.from(MARKERS).includes(marker)) {
      throw 'Invalid JPEG.';
    }

    pos += 2;
    this.bits = this.data[pos++];
    this.height = this.data.readUInt16BE(pos);
    pos += 2;
    this.width = this.data.readUInt16BE(pos);
    pos += 2;
    var channels = this.data[pos++];

    this.colorSpace = (function() {
      switch (channels) {
        case 1:
          return 'DeviceGray';

        case 3:
          return 'DeviceRGB';

        case 4:
          return 'DeviceCMYK';
      }
    })();

    this.obj = null;
  }

  var _proto = JPEG.prototype;

  _proto.embed = function embed(document) {
    if (this.obj) {
      return;
    }

    this.obj = document.ref({
      Type: 'XObject',
      Subtype: 'Image',
      BitsPerComponent: this.bits,
      Width: this.width,
      Height: this.height,
      ColorSpace: this.colorSpace,
      Filter: 'DCTDecode'
    }); // add extra decode params for CMYK images. By swapping the
    // min and max values from the default, we invert the colors. See
    // section 4.8.4 of the spec.

    if (this.colorSpace === 'DeviceCMYK') {
      this.obj.data['Decode'] = [1.0, 0.0, 1.0, 0.0, 1.0, 0.0, 1.0, 0.0];
    }

    this.obj.end(this.data); // free memory

    this.data = null;
  };

  return JPEG;
})();

var PNGImage = /*#__PURE__*/ (function() {
  function PNGImage(data, label) {
    this.label = label;
    this.image = new PNG(data);
    this.width = this.image.width;
    this.height = this.image.height;
    this.imgData = this.image.imgData;
    this.obj = null;
  }

  var _proto = PNGImage.prototype;

  _proto.embed = function embed(document) {
    var dataDecoded = false;
    this.document = document;
    if (this.obj) return;
    var hasAlphaChannel = this.image.hasAlphaChannel;
    var isInterlaced = this.image.interlaceMethod === 1;
    this.obj = this.document.ref({
      Type: 'XObject',
      Subtype: 'Image',
      BitsPerComponent: hasAlphaChannel ? 8 : this.image.bits,
      Width: this.width,
      Height: this.height,
      Filter: 'FlateDecode'
    });

    if (!hasAlphaChannel) {
      var params = this.document.ref({
        Predictor: isInterlaced ? 1 : 15,
        Colors: this.image.colors,
        BitsPerComponent: this.image.bits,
        Columns: this.width
      });
      this.obj.data['DecodeParms'] = params;
      params.end();
    }

    if (this.image.palette.length === 0) {
      this.obj.data['ColorSpace'] = this.image.colorSpace;
    } else {
      // embed the color palette in the PDF as an object stream
      var palette = this.document.ref();
      palette.end(Buffer.from(this.image.palette)); // build the color space array for the image

      this.obj.data['ColorSpace'] = [
        'Indexed',
        'DeviceRGB',
        this.image.palette.length / 3 - 1,
        palette
      ];
    } // For PNG color types 0, 2 and 3, the transparency data is stored in
    // a dedicated PNG chunk.

    if (this.image.transparency.grayscale != null) {
      // Use Color Key Masking (spec section 4.8.5)
      // An array with N elements, where N is two times the number of color components.
      var val = this.image.transparency.grayscale;
      this.obj.data['Mask'] = [val, val];
    } else if (this.image.transparency.rgb) {
      // Use Color Key Masking (spec section 4.8.5)
      // An array with N elements, where N is two times the number of color components.
      var rgb = this.image.transparency.rgb;
      var mask = [];

      for (
        var _iterator = _createForOfIteratorHelperLoose(rgb), _step;
        !(_step = _iterator()).done;

      ) {
        var x = _step.value;
        mask.push(x, x);
      }

      this.obj.data['Mask'] = mask;
    } else if (this.image.transparency.indexed) {
      // Create a transparency SMask for the image based on the data
      // in the PLTE and tRNS sections. See below for details on SMasks.
      dataDecoded = true;
      return this.loadIndexedAlphaChannel();
    } else if (hasAlphaChannel) {
      // For PNG color types 4 and 6, the transparency data is stored as a alpha
      // channel mixed in with the main image data. Separate this data out into an
      // SMask object and store it separately in the PDF.
      dataDecoded = true;
      return this.splitAlphaChannel();
    }

    if (isInterlaced && !dataDecoded) {
      return this.decodeData();
    }

    this.finalize();
  };

  _proto.finalize = function finalize() {
    if (this.alphaChannel) {
      var sMask = this.document.ref({
        Type: 'XObject',
        Subtype: 'Image',
        Height: this.height,
        Width: this.width,
        BitsPerComponent: 8,
        Filter: 'FlateDecode',
        ColorSpace: 'DeviceGray',
        Decode: [0, 1]
      });
      sMask.end(this.alphaChannel);
      this.obj.data['SMask'] = sMask;
    } // add the actual image data

    this.obj.end(this.imgData); // free memory

    this.image = null;
    this.imgData = null;
  };

  _proto.splitAlphaChannel = function splitAlphaChannel() {
    var _this = this;

    return this.image.decodePixels(function(pixels) {
      var a;
      var p;
      var colorCount = _this.image.colors;
      var pixelCount = _this.width * _this.height;
      var imgData = Buffer.alloc(pixelCount * colorCount);
      var alphaChannel = Buffer.alloc(pixelCount);
      var i = (p = a = 0);
      var len = pixels.length; // For 16bit images copy only most significant byte (MSB) - PNG data is always stored in network byte order (MSB first)

      var skipByteCount = _this.image.bits === 16 ? 1 : 0;

      while (i < len) {
        for (var colorIndex = 0; colorIndex < colorCount; colorIndex++) {
          imgData[p++] = pixels[i++];
          i += skipByteCount;
        }

        alphaChannel[a++] = pixels[i++];
        i += skipByteCount;
      }

      _this.imgData = zlib.deflateSync(imgData);
      _this.alphaChannel = zlib.deflateSync(alphaChannel);
      return _this.finalize();
    });
  };

  _proto.loadIndexedAlphaChannel = function loadIndexedAlphaChannel() {
    var _this2 = this;

    var transparency = this.image.transparency.indexed;
    return this.image.decodePixels(function(pixels) {
      var alphaChannel = Buffer.alloc(_this2.width * _this2.height);
      var i = 0;

      for (var j = 0, end = pixels.length; j < end; j++) {
        alphaChannel[i++] = transparency[pixels[j]];
      }

      _this2.alphaChannel = zlib.deflateSync(alphaChannel);
      return _this2.finalize();
    });
  };

  _proto.decodeData = function decodeData() {
    var _this3 = this;

    this.image.decodePixels(function(pixels) {
      _this3.imgData = zlib.deflateSync(pixels);

      _this3.finalize();
    });
  };

  return PNGImage;
})();

var PDFImage = /*#__PURE__*/ (function() {
  function PDFImage() {}

  PDFImage.open = function open(src, label) {
    var data;

    if (Buffer.isBuffer(src)) {
      data = src;
    } else if (src instanceof ArrayBuffer) {
      data = Buffer.from(new Uint8Array(src));
    } else {
      var match = /^data:.+;base64,(.*)$/.exec(src);

      if (match) {
        data = Buffer.from(match[1], 'base64');
      } else {
        data = fs.readFileSync(src);
        if (!data) return;
      }
    }

    if (data[0] === 0xff && data[1] === 0xd8) {
      return new JPEG(data, label);
    }

    if (data[0] === 0x89 && data.toString('ascii', 1, 4) === 'PNG') {
      return new PNGImage(data, label);
    }

    throw new Error('Unknown image format.');
  };

  return PDFImage;
})();

var ImagesMixin = {
  initImages: function initImages() {
    this._imageRegistry = {};
    this._imageCount = 0;
  },
  embedImage: function embedImage(src) {
    var image;

    if (typeof src === 'string') {
      image = this._imageRegistry[src];
    }

    if (!image) {
      if (src.width && src.height) {
        image = src;
      } else {
        image = this.openImage(src);
      }
    }

    if (!image.obj) {
      image.embed(this);
    }

    return image;
  },
  image: function image(src, x, y, options) {
    if (options === void 0) {
      options = {};
    }

    var bh;
    var bp;
    var bw;
    var ip;
    var left;
    var left1;

    if (typeof x === 'object') {
      options = x;
      x = null;
    }

    var image = src instanceof PDFImage ? src : this.embedImage(src);
    x = (left = x != null ? x : options.x) != null ? left : this.x;
    y = (left1 = y != null ? y : options.y) != null ? left1 : this.y;

    if (this.page.xobjects[image.label] == null) {
      this.page.xobjects[image.label] = image.obj;
    }

    var w = options.width || image.width;
    var h = options.height || image.height;

    if (options.width && !options.height) {
      var wp = w / image.width;
      w = image.width * wp;
      h = image.height * wp;
    } else if (options.height && !options.width) {
      var hp = h / image.height;
      w = image.width * hp;
      h = image.height * hp;
    } else if (options.scale) {
      w = image.width * options.scale;
      h = image.height * options.scale;
    } else if (options.fit) {
      var _Array$from = Array.from(options.fit);

      bw = _Array$from[0];
      bh = _Array$from[1];
      bp = bw / bh;
      ip = image.width / image.height;

      if (ip > bp) {
        w = bw;
        h = bw / ip;
      } else {
        h = bh;
        w = bh * ip;
      }
    } // Set the current y position to below the image if it is in the document flow

    if (this.y === y) {
      this.y += h;
    }

    this.save();
    this.transform(w, 0, 0, -h, x, y + h);
    this.addContent('/' + image.label + ' Do');
    this.restore();
    return this;
  },
  openImage: function openImage(src) {
    var image;

    if (typeof src === 'string') {
      image = this._imageRegistry[src];
    }

    if (!image) {
      image = PDFImage.open(src, 'I' + ++this._imageCount);

      if (typeof src === 'string') {
        this._imageRegistry[src] = image;
      }
    }

    return image;
  }
};

var AnnotationsMixin = {
  annotate: function annotate(x, y, w, h, options) {
    options.Type = 'Annot';
    options.Rect = this._convertRect(x, y, w, h);
    options.Border = [0, 0, 0];

    if (options.Subtype === 'Link' && typeof options.F === 'undefined') {
      options.F = 1 << 2; // Print Annotation Flag
    }

    if (options.Subtype !== 'Link') {
      if (options.C == null) {
        options.C = this._normalizeColor(options.color || [0, 0, 0]);
      }
    } // convert colors

    delete options.color;

    if (typeof options.Dest === 'string') {
      options.Dest = new String(options.Dest);
    } // Capitalize keys

    for (var key in options) {
      var val = options[key];
      options[key[0].toUpperCase() + key.slice(1)] = val;
    }

    var ref = this.ref(options);
    this.page.annotations.push(ref);
    ref.end();
    return this;
  },
  note: function note(x, y, w, h, contents, options) {
    if (options === void 0) {
      options = {};
    }

    options.Subtype = 'Text';
    options.Contents = new String(contents);
    options.Name = 'Comment';

    if (options.color == null) {
      options.color = [243, 223, 92];
    }

    options.Border = [0, 0, options.borderWidth || 0];
    delete options.borderWidth;
    return this.annotate(x, y, w, h, options);
  },
  goTo: function goTo(x, y, w, h, name, options) {
    if (options === void 0) {
      options = {};
    }

    options.Subtype = 'Link';
    options.A = this.ref({
      S: 'GoTo',
      D: new String(name)
    });
    options.A.end();
    return this.annotate(x, y, w, h, options);
  },
  link: function link(x, y, w, h, url, options) {
    if (options === void 0) {
      options = {};
    }

    options.Subtype = 'Link';

    if (typeof url === 'number') {
      // Link to a page in the document (the page must already exist)
      var pages = this._root.data.Pages.data;

      if (url >= 0 && url < pages.Kids.length) {
        options.A = this.ref({
          S: 'GoTo',
          D: [pages.Kids[url], 'XYZ', null, null, null]
        });
        options.A.end();
      } else {
        throw new Error('The document has no page ' + url);
      }
    } else {
      // Link to an external url
      options.A = this.ref({
        S: 'URI',
        URI: new String(url)
      });
      options.A.end();
    }

    return this.annotate(x, y, w, h, options);
  },
  _markup: function _markup(x, y, w, h, options) {
    if (options === void 0) {
      options = {};
    }

    var _this$_convertRect = this._convertRect(x, y, w, h),
      x1 = _this$_convertRect[0],
      y1 = _this$_convertRect[1],
      x2 = _this$_convertRect[2],
      y2 = _this$_convertRect[3];

    options.QuadPoints = [x1, y2, x2, y2, x1, y1, x2, y1];
    options.Contents = new String();
    return this.annotate(x, y, w, h, options);
  },
  highlight: function highlight(x, y, w, h, options) {
    if (options === void 0) {
      options = {};
    }

    options.Subtype = 'Highlight';

    if (options.color == null) {
      options.color = [241, 238, 148];
    }

    return this._markup(x, y, w, h, options);
  },
  fileAnnotation: function fileAnnotation(x, y, w, h, file, options) {
    if (file === void 0) {
      file = {};
    }

    if (options === void 0) {
      options = {};
    }

    // create hidden file
    var filespec = this.file(
      file.src,
      Object.assign(
        {
          hidden: true
        },
        file
      )
    );
    options.Subtype = 'FileAttachment';
    options.FS = filespec; // add description from filespec unless description (Contents) has already been set

    if (options.Contents) {
      options.Contents = new String(options.Contents);
    } else if (filespec.data.Desc) {
      options.Contents = filespec.data.Desc;
    }

    return this.annotate(x, y, w, h, options);
  },
  _convertRect: function _convertRect(x1, y1, w, h) {
    // flip y1 and y2
    var y2 = y1;
    y1 += h; // make x2

    var x2 = x1 + w; // apply current transformation matrix to points

    var _this$_ctm = this._ctm,
      m0 = _this$_ctm[0],
      m1 = _this$_ctm[1],
      m2 = _this$_ctm[2],
      m3 = _this$_ctm[3],
      m4 = _this$_ctm[4],
      m5 = _this$_ctm[5];
    x1 = m0 * x1 + m2 * y1 + m4;
    y1 = m1 * x1 + m3 * y1 + m5;
    x2 = m0 * x2 + m2 * y2 + m4;
    y2 = m1 * x2 + m3 * y2 + m5;
    return [x1, y1, x2, y2];
  }
};

var DEFAULT_OPTIONS = {
  top: 0,
  left: 0,
  zoom: 0,
  fit: false,
  pageNumber: null,
  expanded: false
};

var PDFOutline = /*#__PURE__*/ (function() {
  function PDFOutline(document, parent, title, dest, options) {
    if (options === void 0) {
      options = DEFAULT_OPTIONS;
    }

    this.document = document;
    this.options = options;
    this.outlineData = {};

    if (dest !== null) {
      var destWidth = dest.data.MediaBox[2];
      var destHeight = dest.data.MediaBox[3];
      var top = destHeight - (options.top || 0);
      var left = destWidth - (options.left || 0);
      var zoom = options.zoom || 0;
      this.outlineData.Dest = options.fit
        ? [dest, 'Fit']
        : [dest, 'XYZ', left, top, zoom];
    }

    if (parent !== null) {
      this.outlineData.Parent = parent;
    }

    if (title !== null) {
      this.outlineData.Title = new String(title);
    }

    this.dictionary = this.document.ref(this.outlineData);
    this.children = [];
  }

  var _proto = PDFOutline.prototype;

  _proto.addItem = function addItem(title, options) {
    if (options === void 0) {
      options = DEFAULT_OPTIONS;
    }

    var pages = this.document._root.data.Pages.data.Kids;
    var dest =
      options.pageNumber !== null
        ? pages[options.pageNumber]
        : this.document.page.dictionary;
    var result = new PDFOutline(
      this.document,
      this.dictionary,
      title,
      dest,
      options
    );
    this.children.push(result);
    return result;
  };

  _proto.endOutline = function endOutline() {
    if (this.children.length > 0) {
      if (this.options.expanded) {
        this.outlineData.Count = this.children.length;
      }

      var first = this.children[0];
      var last = this.children[this.children.length - 1];
      this.outlineData.First = first.dictionary;
      this.outlineData.Last = last.dictionary;

      for (var i = 0, len = this.children.length; i < len; i++) {
        var child = this.children[i];

        if (i > 0) {
          child.outlineData.Prev = this.children[i - 1].dictionary;
        }

        if (i < this.children.length - 1) {
          child.outlineData.Next = this.children[i + 1].dictionary;
        }

        child.endOutline();
      }
    }

    return this.dictionary.end();
  };

  return PDFOutline;
})();

var OutlineMixin = {
  initOutline: function initOutline() {
    this.outline = new PDFOutline(this, null, null, null);
  },
  endOutline: function endOutline() {
    this.outline.endOutline();

    if (this.outline.children.length > 0) {
      this._root.data.Outlines = this.outline.dictionary;
      this._root.data.PageMode = this._root.data.PageMode || 'UseOutlines';
    }
  }
};

var FIELD_FLAGS = {
  readOnly: 1,
  required: 2,
  noExport: 4,
  multiline: 0x1000,
  password: 0x2000,
  toggleToOffButton: 0x4000,
  radioButton: 0x8000,
  pushButton: 0x10000,
  combo: 0x20000,
  edit: 0x40000,
  sort: 0x80000,
  multiSelect: 0x200000,
  noSpell: 0x400000
};
var FIELD_JUSTIFY = {
  left: 0,
  center: 1,
  right: 2
};
var VALUE_MAP = {
  value: 'V',
  defaultValue: 'DV'
};
var FORMAT_SPECIAL = {
  zip: '0',
  zipPlus4: '1',
  zip4: '1',
  phone: '2',
  ssn: '3'
};
var FORMAT_DEFAULT = {
  number: {
    nDec: 0,
    sepComma: false,
    negStyle: 'MinusBlack',
    currency: '',
    currencyPrepend: true
  },
  percent: {
    nDec: 0,
    sepComma: false
  }
};
var AcroFormMixin = {
  /**
   * Must call if adding AcroForms to a document. Must also call font() before
   * this method to set the default font.
   */
  initForm: function initForm() {
    if (!this._font) {
      throw new Error('Must set a font before calling initForm method');
    }

    this._acroform = {
      fonts: {},
      defaultFont: this._font.name
    };
    this._acroform.fonts[this._font.id] = this._font.ref();
    var data = {
      Fields: [],
      NeedAppearances: true,
      DA: new String('/' + this._font.id + ' 0 Tf 0 g'),
      DR: {
        Font: {}
      }
    };
    data.DR.Font[this._font.id] = this._font.ref();
    var AcroForm = this.ref(data);
    this._root.data.AcroForm = AcroForm;
    return this;
  },

  /**
   * Called automatically by document.js
   */
  endAcroForm: function endAcroForm() {
    var _this = this;

    if (this._root.data.AcroForm) {
      if (
        !Object.keys(this._acroform.fonts).length &&
        !this._acroform.defaultFont
      ) {
        throw new Error('No fonts specified for PDF form');
      }

      var fontDict = this._root.data.AcroForm.data.DR.Font;
      Object.keys(this._acroform.fonts).forEach(function(name) {
        fontDict[name] = _this._acroform.fonts[name];
      });

      this._root.data.AcroForm.data.Fields.forEach(function(fieldRef) {
        _this._endChild(fieldRef);
      });

      this._root.data.AcroForm.end();
    }

    return this;
  },
  _endChild: function _endChild(ref) {
    var _this2 = this;

    if (Array.isArray(ref.data.Kids)) {
      ref.data.Kids.forEach(function(childRef) {
        _this2._endChild(childRef);
      });
      ref.end();
    }

    return this;
  },

  /**
   * Creates and adds a form field to the document. Form fields are intermediate
   * nodes in a PDF form that are used to specify form name heirarchy and form
   * value defaults.
   * @param {string} name - field name (T attribute in field dictionary)
   * @param {object} options  - other attributes to include in field dictionary
   */
  formField: function formField(name, options) {
    if (options === void 0) {
      options = {};
    }

    var fieldDict = this._fieldDict(name, null, options);

    var fieldRef = this.ref(fieldDict);

    this._addToParent(fieldRef);

    return fieldRef;
  },

  /**
   * Creates and adds a Form Annotation to the document. Form annotations are
   * called Widget annotations internally within a PDF file.
   * @param {string} name - form field name (T attribute of widget annotation
   * dictionary)
   * @param {number} x
   * @param {number} y
   * @param {number} w
   * @param {number} h
   * @param {object} options
   */
  formAnnotation: function formAnnotation(name, type, x, y, w, h, options) {
    if (options === void 0) {
      options = {};
    }

    var fieldDict = this._fieldDict(name, type, options);

    fieldDict.Subtype = 'Widget';

    if (fieldDict.F === undefined) {
      fieldDict.F = 4; // print the annotation
    } // Add Field annot to page, and get it's ref

    this.annotate(x, y, w, h, fieldDict);
    var annotRef = this.page.annotations[this.page.annotations.length - 1];
    return this._addToParent(annotRef);
  },
  formText: function formText(name, x, y, w, h, options) {
    if (options === void 0) {
      options = {};
    }

    return this.formAnnotation(name, 'text', x, y, w, h, options);
  },
  formPushButton: function formPushButton(name, x, y, w, h, options) {
    if (options === void 0) {
      options = {};
    }

    return this.formAnnotation(name, 'pushButton', x, y, w, h, options);
  },
  formCombo: function formCombo(name, x, y, w, h, options) {
    if (options === void 0) {
      options = {};
    }

    return this.formAnnotation(name, 'combo', x, y, w, h, options);
  },
  formList: function formList(name, x, y, w, h, options) {
    if (options === void 0) {
      options = {};
    }

    return this.formAnnotation(name, 'list', x, y, w, h, options);
  },
  formRadioButton: function formRadioButton(name, x, y, w, h, options) {
    if (options === void 0) {
      options = {};
    }

    return this.formAnnotation(name, 'radioButton', x, y, w, h, options);
  },
  formCheckbox: function formCheckbox(name, x, y, w, h, options) {
    if (options === void 0) {
      options = {};
    }

    return this.formAnnotation(name, 'checkbox', x, y, w, h, options);
  },
  _addToParent: function _addToParent(fieldRef) {
    var parent = fieldRef.data.Parent;

    if (parent) {
      if (!parent.data.Kids) {
        parent.data.Kids = [];
      }

      parent.data.Kids.push(fieldRef);
    } else {
      this._root.data.AcroForm.data.Fields.push(fieldRef);
    }

    return this;
  },
  _fieldDict: function _fieldDict(name, type, options) {
    if (options === void 0) {
      options = {};
    }

    if (!this._acroform) {
      throw new Error(
        'Call document.initForms() method before adding form elements to document'
      );
    }

    var opts = Object.assign({}, options);

    if (type !== null) {
      opts = this._resolveType(type, options);
    }

    opts = this._resolveFlags(opts);
    opts = this._resolveJustify(opts);
    opts = this._resolveFont(opts);
    opts = this._resolveStrings(opts);
    opts = this._resolveColors(opts);
    opts = this._resolveFormat(opts);
    opts.T = new String(name);

    if (opts.parent) {
      opts.Parent = opts.parent;
      delete opts.parent;
    }

    return opts;
  },
  _resolveType: function _resolveType(type, opts) {
    if (type === 'text') {
      opts.FT = 'Tx';
    } else if (type === 'pushButton') {
      opts.FT = 'Btn';
      opts.pushButton = true;
    } else if (type === 'radioButton') {
      opts.FT = 'Btn';
      opts.radioButton = true;
    } else if (type === 'checkbox') {
      opts.FT = 'Btn';
    } else if (type === 'combo') {
      opts.FT = 'Ch';
      opts.combo = true;
    } else if (type === 'list') {
      opts.FT = 'Ch';
    } else {
      throw new Error("Invalid form annotation type '" + type + "'");
    }

    return opts;
  },
  _resolveFormat: function _resolveFormat(opts) {
    var f = opts.format;

    if (f && f.type) {
      var fnKeystroke;
      var fnFormat;
      var params = '';

      if (FORMAT_SPECIAL[f.type] !== undefined) {
        fnKeystroke = 'AFSpecial_Keystroke';
        fnFormat = 'AFSpecial_Format';
        params = FORMAT_SPECIAL[f.type];
      } else {
        var format = f.type.charAt(0).toUpperCase() + f.type.slice(1);
        fnKeystroke = 'AF' + format + '_Keystroke';
        fnFormat = 'AF' + format + '_Format';

        if (f.type === 'date') {
          fnKeystroke += 'Ex';
          params = String(f.param);
        } else if (f.type === 'time') {
          params = String(f.param);
        } else if (f.type === 'number') {
          var p = Object.assign({}, FORMAT_DEFAULT.number, f);
          params = String(
            [
              String(p.nDec),
              p.sepComma ? '0' : '1',
              '"' + p.negStyle + '"',
              'null',
              '"' + p.currency + '"',
              String(p.currencyPrepend)
            ].join(',')
          );
        } else if (f.type === 'percent') {
          var _p = Object.assign({}, FORMAT_DEFAULT.percent, f);

          params = String([String(_p.nDec), _p.sepComma ? '0' : '1'].join(','));
        }
      }

      opts.AA = opts.AA ? opts.AA : {};
      opts.AA.K = {
        S: 'JavaScript',
        JS: new String(fnKeystroke + '(' + params + ');')
      };
      opts.AA.F = {
        S: 'JavaScript',
        JS: new String(fnFormat + '(' + params + ');')
      };
    }

    delete opts.format;
    return opts;
  },
  _resolveColors: function _resolveColors(opts) {
    var color = this._normalizeColor(opts.backgroundColor);

    if (color) {
      if (!opts.MK) {
        opts.MK = {};
      }

      opts.MK.BG = color;
    }

    color = this._normalizeColor(opts.borderColor);

    if (color) {
      if (!opts.MK) {
        opts.MK = {};
      }

      opts.MK.BC = color;
    }

    delete opts.backgroundColor;
    delete opts.borderColor;
    return opts;
  },
  _resolveFlags: function _resolveFlags(options) {
    var result = 0;
    Object.keys(options).forEach(function(key) {
      if (FIELD_FLAGS[key]) {
        result |= FIELD_FLAGS[key];
        delete options[key];
      }
    });

    if (result !== 0) {
      options.Ff = options.Ff ? options.Ff : 0;
      options.Ff |= result;
    }

    return options;
  },
  _resolveJustify: function _resolveJustify(options) {
    var result = 0;

    if (options.align !== undefined) {
      if (typeof FIELD_JUSTIFY[options.align] === 'number') {
        result = FIELD_JUSTIFY[options.align];
      }

      delete options.align;
    }

    if (result !== 0) {
      options.Q = result; // default
    }

    return options;
  },
  _resolveFont: function _resolveFont(options) {
    // add current font to document-level AcroForm dict if necessary
    if (this._acroform.fonts[this._font.id] === null) {
      this._acroform.fonts[this._font.id] = this._font.ref();
    } // add current font to field's resource dict (RD) if not the default acroform font

    if (this._acroform.defaultFont !== this._font.name) {
      options.DR = {
        Font: {}
      }; // Get the fontSize option. If not set use auto sizing

      var fontSize = options.fontSize || 0;
      options.DR.Font[this._font.id] = this._font.ref();
      options.DA = new String('/' + this._font.id + ' ' + fontSize + ' Tf 0 g');
    }

    return options;
  },
  _resolveStrings: function _resolveStrings(options) {
    var select = [];

    function appendChoices(a) {
      if (Array.isArray(a)) {
        for (var idx = 0; idx < a.length; idx++) {
          if (typeof a[idx] === 'string') {
            select.push(new String(a[idx]));
          } else {
            select.push(a[idx]);
          }
        }
      }
    }

    appendChoices(options.Opt);

    if (options.select) {
      appendChoices(options.select);
      delete options.select;
    }

    if (select.length) {
      options.Opt = select;
    }

    Object.keys(VALUE_MAP).forEach(function(key) {
      if (options[key] !== undefined) {
        options[VALUE_MAP[key]] = options[key];
        delete options[key];
      }
    });
    ['V', 'DV'].forEach(function(key) {
      if (typeof options[key] === 'string') {
        options[key] = new String(options[key]);
      }
    });

    if (options.MK && options.MK.CA) {
      options.MK.CA = new String(options.MK.CA);
    }

    if (options.label) {
      options.MK = options.MK ? options.MK : {};
      options.MK.CA = new String(options.label);
      delete options.label;
    }

    return options;
  }
};

var AttachmentsMixin = {
  /**
   * Embed contents of `src` in PDF
   * @param {Buffer | ArrayBuffer | string} src input Buffer, ArrayBuffer, base64 encoded string or path to file
   * @param {object} options
   *  * options.name: filename to be shown in PDF, will use `src` if none set
   *  * options.type: filetype to be shown in PDF
   *  * options.description: description to be shown in PDF
   *  * options.hidden: if true, do not add attachment to EmbeddedFiles dictionary. Useful for file attachment annotations
   *  * options.creationDate: override creation date
   *  * options.modifiedDate: override modified date
   * @returns filespec reference
   */
  file: function file(src, options) {
    if (options === void 0) {
      options = {};
    }

    options.name = options.name || src;
    var refBody = {
      Type: 'EmbeddedFile',
      Params: {}
    };
    var data;

    if (!src) {
      throw new Error('No src specified');
    }

    if (Buffer.isBuffer(src)) {
      data = src;
    } else if (src instanceof ArrayBuffer) {
      data = Buffer.from(new Uint8Array(src));
    } else {
      var match;

      if ((match = /^data:(.*);base64,(.*)$/.exec(src))) {
        if (match[1]) {
          refBody.Subtype = match[1].replace('/', '#2F');
        }

        data = Buffer.from(match[2], 'base64');
      } else {
        data = fs.readFileSync(src);

        if (!data) {
          throw new Error('Could not read contents of file at filepath ' + src);
        } // update CreationDate and ModDate

        var _fs$statSync = fs.statSync(src),
          birthtime = _fs$statSync.birthtime,
          ctime = _fs$statSync.ctime;

        refBody.Params.CreationDate = birthtime;
        refBody.Params.ModDate = ctime;
      }
    } // override creation date and modified date

    if (options.creationDate instanceof Date) {
      refBody.Params.CreationDate = options.creationDate;
    }

    if (options.modifiedDate instanceof Date) {
      refBody.Params.ModDate = options.modifiedDate;
    } // add optional subtype

    if (options.type) {
      refBody.Subtype = options.type.replace('/', '#2F');
    } // add checksum and size information

    var checksum = CryptoJS.MD5(
      CryptoJS.lib.WordArray.create(new Uint8Array(data))
    );
    refBody.Params.CheckSum = new String(checksum);
    refBody.Params.Size = data.byteLength; // save some space when embedding the same file again
    // if a file with the same name and metadata exists, reuse its reference

    var ref;
    if (!this._fileRegistry) this._fileRegistry = {};
    var file = this._fileRegistry[options.name];

    if (file && isEqual(refBody, file)) {
      ref = file.ref;
    } else {
      ref = this.ref(refBody);
      ref.end(data);
      this._fileRegistry[options.name] = _extends({}, refBody, {
        ref: ref
      });
    } // add filespec for embedded file

    var fileSpecBody = {
      Type: 'Filespec',
      F: new String(options.name),
      EF: {
        F: ref
      },
      UF: new String(options.name)
    };

    if (options.description) {
      fileSpecBody.Desc = new String(options.description);
    }

    var filespec = this.ref(fileSpecBody);
    filespec.end();

    if (!options.hidden) {
      this.addNamedEmbeddedFile(options.name, filespec);
    }

    return filespec;
  }
};
/** check two embedded file metadata objects for equality */

function isEqual(a, b) {
  if (
    a.Subtype !== b.Subtype ||
    a.Params.CheckSum.toString() !== b.Params.CheckSum.toString() ||
    a.Params.Size !== b.Params.Size ||
    a.Params.CreationDate !== b.Params.CreationDate ||
    a.Params.ModDate !== b.Params.ModDate
  ) {
    return false;
  }

  return true;
}

var capitalize = function capitalize(v) {
  return v[0].toUpperCase() + v.slice(1);
};

var PDFDocument = /*#__PURE__*/ (function(_stream$Readable) {
  _inheritsLoose(PDFDocument, _stream$Readable);

  function PDFDocument(options) {
    var _this;

    if (options === void 0) {
      options = {};
    }

    _this = _stream$Readable.call(this) || this;
    _this.options = options; // PDF version

    switch (options.pdfVersion) {
      case '1.4':
        _this.version = 1.4;
        break;

      case '1.5':
        _this.version = 1.5;
        break;

      case '1.6':
        _this.version = 1.6;
        break;

      case '1.7':
      case '1.7ext3':
        _this.version = 1.7;
        break;

      default:
        _this.version = 1.3;
        break;
    } // Whether streams should be compressed

    _this.compress =
      _this.options.compress != null ? _this.options.compress : true;
    _this._pageBuffer = [];
    _this._pageBufferStart = 0; // The PDF object store

    _this._offsets = [];
    _this._waiting = 0;
    _this._ended = false;
    _this._offset = 0;

    var Pages = _this.ref({
      Type: 'Pages',
      Count: 0,
      Kids: []
    });

    var Names = _this.ref({
      Dests: new PDFNameTree()
    });

    _this._root = _this.ref({
      Type: 'Catalog',
      Pages: Pages,
      Names: Names
    });

    if (_this.options.lang) {
      _this._root.data.Lang = new String(_this.options.lang);
    }

    if (_this.options.pageLayout) {
      _this._root.data.PageLayout = capitalize(_this.options.pageLayout);
    }

    if (_this.options.pageMode) {
      _this._root.data.PageMode = capitalize(_this.options.pageMode);
    } // The current page

    _this.page = null; // Initialize mixins

    _this.initColor();

    _this.initVector();

    _this.initFonts();

    _this.initText();

    _this.initImages();

    _this.initOutline(); // this.initMarkings(options)
    // Initialize the metadata

    _this.info = {
      Producer: 'PDFKit',
      Creator: 'PDFKit',
      CreationDate: new Date()
    };

    if (_this.options.info) {
      for (var key in _this.options.info) {
        var val = _this.options.info[key];
        _this.info[key] = val;
      }
    }

    if (_this.options.displayTitle) {
      _this._root.data.ViewerPreferences = _this.ref({
        DisplayDocTitle: true
      });
    } // Generate file ID

    _this._id = PDFSecurity.generateFileID(_this.info); // Initialize security settings
    // this._security = PDFSecurity.create(this, options);
    // Write the header PDF version

    _this._write('%PDF-' + _this.version); // 4 binary chars, as recommended by the spec

    _this._write('%\xFF\xFF\xFF\xFF'); // Add the first page

    if (_this.options.autoFirstPage !== false) {
      _this.addPage();
    }

    return _this;
  }

  var _proto = PDFDocument.prototype;

  _proto.addPage = function addPage(options) {
    // end the current page if needed
    if (options == null) {
      options = this.options;
    } // end the current page if needed

    if (!this.options.bufferPages) {
      this.flushPages();
    } // create a page object

    this.page = new PDFPage(this, options);

    this._pageBuffer.push(this.page); // add the page to the object store

    var pages = this._root.data.Pages.data;
    pages.Kids.push(this.page.dictionary);
    pages.Count++; // flip PDF coordinate system so that the origin is in
    // the top left rather than the bottom left

    this._ctm = [1, 0, 0, 1, 0, 0];
    this.transform(1, 0, 0, -1, 0, this.page.height); // this.emit('pageAdded');

    return this;
  };

  _proto.flushPages = function flushPages() {
    // this local variable exists so we're future-proof against
    // reentrant calls to flushPages.
    var pages = this._pageBuffer;
    this._pageBuffer = [];
    this._pageBufferStart += pages.length;

    for (
      var _i = 0, _Array$from = Array.from(pages);
      _i < _Array$from.length;
      _i++
    ) {
      var page = _Array$from[_i];
      // this.endPageMarkings(page);
      page.end();
    }
  };

  _proto.addNamedDestination = function addNamedDestination(name) {
    for (
      var _len = arguments.length,
        args = new Array(_len > 1 ? _len - 1 : 0),
        _key = 1;
      _key < _len;
      _key++
    ) {
      args[_key - 1] = arguments[_key];
    }

    if (args.length === 0) {
      args = ['XYZ', null, null, null];
    }

    if (args[0] === 'XYZ' && args[2] !== null) {
      args[2] = this.page.height - args[2];
    }

    args.unshift(this.page.dictionary);

    this._root.data.Names.data.Dests.add(name, args);
  };

  _proto.addNamedEmbeddedFile = function addNamedEmbeddedFile(name, ref) {
    if (!this._root.data.Names.data.EmbeddedFiles) {
      // disabling /Limits for this tree fixes attachments not showing in Adobe Reader
      this._root.data.Names.data.EmbeddedFiles = new PDFNameTree({
        limits: false
      });
    } // add filespec to EmbeddedFiles

    this._root.data.Names.data.EmbeddedFiles.add(name, ref);
  };

  _proto.addNamedJavaScript = function addNamedJavaScript(name, js) {
    if (!this._root.data.Names.data.JavaScript) {
      this._root.data.Names.data.JavaScript = new PDFNameTree();
    }

    var data = {
      JS: new String(js),
      S: 'JavaScript'
    };

    this._root.data.Names.data.JavaScript.add(name, data);
  };

  _proto.ref = function ref(data) {
    var ref = new PDFReference(this, this._offsets.length + 1, data);

    this._offsets.push(null); // placeholder for this object's offset once it is finalized

    this._waiting++;
    return ref;
  };

  _proto._read = function _read() {
    // do nothing, but this method is required by node
  };

  _proto._write = function _write(data) {
    if (!Buffer.isBuffer(data)) {
      data = Buffer.from(data + '\n', 'binary');
    }

    this.push(data);
    return (this._offset += data.length);
  };

  _proto.addContent = function addContent(data) {
    this.page.write(data);
    return this;
  };

  _proto._refEnd = function _refEnd(ref) {
    this._offsets[ref.id - 1] = ref.offset;

    if (--this._waiting === 0 && this._ended) {
      this._finalize();

      return (this._ended = false);
    }
  };

  _proto.end = function end() {
    this.flushPages();
    this._info = this.ref();

    for (var key in this.info) {
      var val = this.info[key];

      if (typeof val === 'string') {
        val = new String(val);
      }

      var entry = this.ref(val);
      entry.end();
      this._info.data[key] = entry;
    }

    this._info.end();

    for (var name in this._fontFamilies) {
      var font = this._fontFamilies[name];
      font.finalize();
    }

    this.endOutline(); // this.endMarkings();

    this._root.end();

    this._root.data.Pages.end();

    this._root.data.Names.end();

    this.endAcroForm();

    if (this._root.data.ViewerPreferences) {
      this._root.data.ViewerPreferences.end();
    } // if (this._security) {
    //   this._security.end();
    // }

    if (this._waiting === 0) {
      return this._finalize();
    }

    this._ended = true;
  };

  _proto._finalize = function _finalize() {
    // generate xref
    var xRefOffset = this._offset;

    this._write('xref');

    this._write('0 ' + (this._offsets.length + 1));

    this._write('0000000000 65535 f ');

    for (
      var _i2 = 0, _Array$from2 = Array.from(this._offsets);
      _i2 < _Array$from2.length;
      _i2++
    ) {
      var offset = _Array$from2[_i2];
      offset = ('0000000000' + offset).slice(-10);

      this._write(offset + ' 00000 n ');
    } // trailer

    var trailer = {
      Size: this._offsets.length + 1,
      Root: this._root,
      Info: this._info,
      ID: [this._id, this._id]
    }; // if (this._security) {
    //   trailer.Encrypt = this._security.dictionary;
    // }

    this._write('trailer');

    this._write(PDFObject$1.convert(trailer));

    this._write('startxref');

    this._write('' + xRefOffset);

    this._write('%%EOF'); // end the stream

    return this.push(null);
  };

  _proto.toString = function toString() {
    return '[object PDFDocument]';
  };

  return PDFDocument;
})(stream.Readable);

var mixin = function mixin(methods) {
  Object.assign(PDFDocument.prototype, methods);
}; // Load mixins

mixin(ColorMixin);
mixin(VectorMixin);
mixin(FontsMixin);
mixin(TextMixin);
mixin(ImagesMixin);
mixin(AnnotationsMixin);
mixin(OutlineMixin); // mixin(MarkingsMixin);

mixin(AcroFormMixin);
mixin(AttachmentsMixin);

export { EmbeddedFont, PDFFont, StandardFont, PDFDocument as default };
