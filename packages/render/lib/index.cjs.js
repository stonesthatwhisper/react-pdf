'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var P = require('@react-pdf/primitives');
var fns = require('@react-pdf/fns');
var absPath = require('abs-svg-path');
var parsePath = require('parse-svg-path');
var normalizePath = require('normalize-svg-path');
var colorString = require('color-string');
var _extends = require('@babel/runtime/helpers/extends');

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

var P__namespace = /*#__PURE__*/ _interopNamespace(P);
var absPath__default = /*#__PURE__*/ _interopDefaultLegacy(absPath);
var parsePath__default = /*#__PURE__*/ _interopDefaultLegacy(parsePath);
var normalizePath__default = /*#__PURE__*/ _interopDefaultLegacy(normalizePath);
var colorString__default = /*#__PURE__*/ _interopDefaultLegacy(colorString);
var _extends__default = /*#__PURE__*/ _interopDefaultLegacy(_extends);

var renderPath = function renderPath(ctx, node) {
  var _node$props;

  var d =
    (_node$props = node.props) === null || _node$props === void 0
      ? void 0
      : _node$props.d;
  if (d) ctx.path(node.props.d);
};

var KAPPA$3 = 4.0 * ((Math.sqrt(2) - 1.0) / 3.0);

var renderRect = function renderRect(ctx, node) {
  var _node$props,
    _node$props2,
    _node$props3,
    _node$props4,
    _node$props5,
    _node$props6;

  var x =
    ((_node$props = node.props) === null || _node$props === void 0
      ? void 0
      : _node$props.x) || 0;
  var y =
    ((_node$props2 = node.props) === null || _node$props2 === void 0
      ? void 0
      : _node$props2.y) || 0;
  var rx =
    ((_node$props3 = node.props) === null || _node$props3 === void 0
      ? void 0
      : _node$props3.rx) || 0;
  var ry =
    ((_node$props4 = node.props) === null || _node$props4 === void 0
      ? void 0
      : _node$props4.ry) || 0;
  var width =
    ((_node$props5 = node.props) === null || _node$props5 === void 0
      ? void 0
      : _node$props5.width) || 0;
  var height =
    ((_node$props6 = node.props) === null || _node$props6 === void 0
      ? void 0
      : _node$props6.height) || 0;
  if (!width || !height) return;

  if (rx && ry) {
    var krx = rx * KAPPA$3;
    var kry = ry * KAPPA$3;
    ctx.moveTo(x + rx, y);
    ctx.lineTo(x - rx + width, y);
    ctx.bezierCurveTo(
      x - rx + width + krx,
      y,
      x + width,
      y + ry - kry,
      x + width,
      y + ry,
    );
    ctx.lineTo(x + width, y + height - ry);
    ctx.bezierCurveTo(
      x + width,
      y + height - ry + kry,
      x - rx + width + krx,
      y + height,
      x - rx + width,
      y + height,
    );
    ctx.lineTo(x + rx, y + height);
    ctx.bezierCurveTo(
      x + rx - krx,
      y + height,
      x,
      y + height - ry + kry,
      x,
      y + height - ry,
    );
    ctx.lineTo(x, y + ry);
    ctx.bezierCurveTo(x, y + ry - kry, x + rx - krx, y, x + rx, y);
  } else {
    ctx.moveTo(x, y);
    ctx.lineTo(x + width, y);
    ctx.lineTo(x + width, y + height);
    ctx.lineTo(x, y + height);
  }

  ctx.closePath();
};

var renderLine$1 = function renderLine(ctx, node) {
  var _ref = node.props || {},
    x1 = _ref.x1,
    x2 = _ref.x2,
    y1 = _ref.y1,
    y2 = _ref.y2;

  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
};

var renderGroup = function renderGroup() {
  // noop
};

var KAPPA$2 = 4.0 * ((Math.sqrt(2) - 1.0) / 3.0);
var drawEllipse = function drawEllipse(ctx, cx, cy, rx, ry) {
  var x = cx - rx;
  var y = cy - ry;
  var ox = rx * KAPPA$2;
  var oy = ry * KAPPA$2;
  var xe = x + rx * 2;
  var ye = y + ry * 2;
  var xm = x + rx;
  var ym = y + ry;
  ctx.moveTo(x, ym);
  ctx.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
  ctx.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
  ctx.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
  ctx.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
  ctx.closePath();
};

var renderEllipse = function renderEllipse(ctx, node) {
  var _ref = node.props || {},
    cx = _ref.cx,
    cy = _ref.cy,
    rx = _ref.rx,
    ry = _ref.ry;

  drawEllipse(ctx, cx, cy, rx, ry);
};

var renderCircle = function renderCircle(ctx, node) {
  var _node$props, _node$props2, _node$props3;

  var cx =
    (_node$props = node.props) === null || _node$props === void 0
      ? void 0
      : _node$props.cx;
  var cy =
    (_node$props2 = node.props) === null || _node$props2 === void 0
      ? void 0
      : _node$props2.cy;
  var r =
    (_node$props3 = node.props) === null || _node$props3 === void 0
      ? void 0
      : _node$props3.r;
  drawEllipse(ctx, cx, cy, r, r);
};

var renderGlyphs = function renderGlyphs(
  ctx,
  glyphs,
  positions,
  x,
  y,
  options,
) {
  if (options === void 0) {
    options = {};
  }

  var scale = 1000 / ctx._fontSize;
  var unitsPerEm = ctx._font.font.unitsPerEm || 1000;
  var advanceWidthScale = 1000 / unitsPerEm; // Glyph encoding and positioning

  var encodedGlyphs = ctx._font.encodeGlyphs(glyphs);

  var encodedPositions = positions.map(function(pos, i) {
    return {
      xAdvance: pos.xAdvance * scale,
      yAdvance: pos.yAdvance * scale,
      xOffset: pos.xOffset,
      yOffset: pos.yOffset,
      advanceWidth: glyphs[i].advanceWidth * advanceWidthScale,
    };
  });
  return ctx._glyphs(encodedGlyphs, encodedPositions, x, y, options);
};

var renderRun$1 = function renderRun(ctx, run) {
  var runAdvanceWidth = run.xAdvance;
  var _run$attributes = run.attributes,
    font = _run$attributes.font,
    fontSize = _run$attributes.fontSize,
    color = _run$attributes.color,
    opacity = _run$attributes.opacity;
  ctx.fillColor(color);
  ctx.fillOpacity(opacity);

  if (font.sbix || (font.COLR && font.CPAL)) {
    ctx.save();
    ctx.translate(0, -run.ascent);

    for (var i = 0; i < run.glyphs.length; i += 1) {
      var position = run.positions[i];
      var glyph = run.glyphs[i];
      ctx.save();
      ctx.translate(position.xOffset, position.yOffset);
      glyph.render(ctx, fontSize);
      ctx.restore();
      ctx.translate(position.xAdvance, position.yAdvance);
    }

    ctx.restore();
  } else {
    ctx.font(typeof font.name === 'string' ? font.name : font, fontSize);

    try {
      renderGlyphs(ctx, run.glyphs, run.positions, 0, 0);
    } catch (error) {
      console.log(error);
    }
  }

  ctx.translate(runAdvanceWidth, 0);
};

var renderSpan = function renderSpan(ctx, line, textAnchor, dominantBaseline) {
  var _line$box, _line$box2, _line$runs$, _line$runs$2, _line$runs$2$attribut;

  ctx.save();
  var x =
    ((_line$box = line.box) === null || _line$box === void 0
      ? void 0
      : _line$box.x) || 0;
  var y =
    ((_line$box2 = line.box) === null || _line$box2 === void 0
      ? void 0
      : _line$box2.y) || 0;
  var font =
    (_line$runs$ = line.runs[0]) === null || _line$runs$ === void 0
      ? void 0
      : _line$runs$.attributes.font;
  var scale =
    ((_line$runs$2 = line.runs[0]) === null || _line$runs$2 === void 0
      ? void 0
      : (_line$runs$2$attribut = _line$runs$2.attributes) === null ||
        _line$runs$2$attribut === void 0
      ? void 0
      : _line$runs$2$attribut.scale) || 1;
  var width = line.xAdvance;
  var ascent = font.ascent * scale;
  var xHeight = font.xHeight * scale;
  var descent = font.descent * scale;
  var capHeight = font.capHeight * scale;
  var xTranslate = x;
  var yTranslate = y;

  switch (textAnchor) {
    case 'middle':
      xTranslate = x - width / 2;
      break;

    case 'end':
      xTranslate = x - width;
      break;

    default:
      xTranslate = x;
      break;
  }

  switch (dominantBaseline) {
    case 'middle':
    case 'central':
      yTranslate = y + capHeight / 2;
      break;

    case 'hanging':
      yTranslate = y + capHeight;
      break;

    case 'mathematical':
      yTranslate = y + xHeight;
      break;

    case 'text-after-edge':
      yTranslate = y + descent;
      break;

    case 'text-before-edge':
      yTranslate = y + ascent;
      break;

    default:
      yTranslate = y;
      break;
  }

  ctx.translate(xTranslate, yTranslate);
  line.runs.forEach(function(run) {
    return renderRun$1(ctx, run);
  });
  ctx.restore();
};

var renderSvgText = function renderSvgText(ctx, node) {
  node.children.forEach(function(span) {
    return renderSpan(
      ctx,
      span.lines[0],
      span.props.textAnchor,
      span.props.dominantBaseline,
    );
  });
};

var pairs = function pairs(values) {
  var result = [];

  for (var i = 0; i < values.length; i += 2) {
    result.push([values[i], values[i + 1]]);
  }

  return result;
};
/**
 * Parse svg-like points into number arrays
 *
 * @param {String} points string ex. "20,30 50,60"
 * @return {Array} points array ex. [[20, 30], [50, 60]]
 */

var parsePoints = function parsePoints(points) {
  var values = (points || '')
    .trim()
    .replace(/,/g, ' ')
    .replace(/(\d)-(\d)/g, '$1 -$2')
    .split(/\s+/);

  if (values.length % 2 !== 0) {
    values = values.slice(0, -1);
  }

  values = values.map(parseFloat);
  return pairs(values);
};

var drawPolyline = function drawPolyline(ctx, points) {
  if (points.length > 0) {
    ctx.moveTo(points[0][0], points[0][1]);
    points.slice(1).forEach(function(p) {
      return ctx.lineTo(p[0], p[1]);
    });
  }
};

var renderPolyline = function renderPolyline(ctx, node) {
  var points = parsePoints(node.props.points || '');
  drawPolyline(ctx, points);
};

var renderPolygon = function renderPolygon(ctx, node) {
  renderPolyline(ctx, node);
  ctx.closePath();
};

var renderImage$1 = function renderImage(ctx, node) {
  if (!node.image.data) return;
  var _node$props = node.props,
    x = _node$props.x,
    y = _node$props.y;
  var _node$style = node.style,
    width = _node$style.width,
    height = _node$style.height,
    opacity = _node$style.opacity;
  var paddingTop = node.box.paddingLeft || 0;
  var paddingLeft = node.box.paddingLeft || 0;

  if (width === 0 || height === 0) {
    console.warn(
      "Image with src '" +
        node.props.href +
        "' skipped due to invalid dimensions",
    );
    return;
  }

  ctx.save();
  ctx
    .fillOpacity(opacity || 1)
    .image(node.image.data, x + paddingLeft, y + paddingTop, {
      width: width,
      height: height,
    });
  ctx.restore();
};

// This constant is used to approximate a symmetrical arc using a cubic
// Bezier curve.
var KAPPA$1 = 4.0 * ((Math.sqrt(2) - 1.0) / 3.0);

var clipNode = function clipNode(ctx, node) {
  if (!node.style) return;
  var _node$box = node.box,
    top = _node$box.top,
    left = _node$box.left,
    width = _node$box.width,
    height = _node$box.height;
  var _node$style = node.style,
    _node$style$borderTop = _node$style.borderTopLeftRadius,
    borderTopLeftRadius =
      _node$style$borderTop === void 0 ? 0 : _node$style$borderTop,
    _node$style$borderTop2 = _node$style.borderTopRightRadius,
    borderTopRightRadius =
      _node$style$borderTop2 === void 0 ? 0 : _node$style$borderTop2,
    _node$style$borderBot = _node$style.borderBottomRightRadius,
    borderBottomRightRadius =
      _node$style$borderBot === void 0 ? 0 : _node$style$borderBot,
    _node$style$borderBot2 = _node$style.borderBottomLeftRadius,
    borderBottomLeftRadius =
      _node$style$borderBot2 === void 0 ? 0 : _node$style$borderBot2; // Border top

  var rtr = Math.min(borderTopRightRadius, 0.5 * width, 0.5 * height);
  var ctr = rtr * (1.0 - KAPPA$1);
  ctx.moveTo(left + rtr, top);
  ctx.lineTo(left + width - rtr, top);
  ctx.bezierCurveTo(
    left + width - ctr,
    top,
    left + width,
    top + ctr,
    left + width,
    top + rtr,
  ); // Border right

  var rbr = Math.min(borderBottomRightRadius, 0.5 * width, 0.5 * height);
  var cbr = rbr * (1.0 - KAPPA$1);
  ctx.lineTo(left + width, top + height - rbr);
  ctx.bezierCurveTo(
    left + width,
    top + height - cbr,
    left + width - cbr,
    top + height,
    left + width - rbr,
    top + height,
  ); // Border bottom

  var rbl = Math.min(borderBottomLeftRadius, 0.5 * width, 0.5 * height);
  var cbl = rbl * (1.0 - KAPPA$1);
  ctx.lineTo(left + rbl, top + height);
  ctx.bezierCurveTo(
    left + cbl,
    top + height,
    left,
    top + height - cbl,
    left,
    top + height - rbl,
  ); // Border left

  var rtl = Math.min(borderTopLeftRadius, 0.5 * width, 0.5 * height);
  var ctl = rtl * (1.0 - KAPPA$1);
  ctx.lineTo(left, top + rtl);
  ctx.bezierCurveTo(left, top + ctl, left + ctl, top, left + rtl, top);
  ctx.closePath();
  ctx.clip();
};

var applySingleTransformation = function applySingleTransformation(
  ctx,
  transform,
  origin,
) {
  var operation = transform.operation,
    value = transform.value;

  switch (operation) {
    case 'scale': {
      var scaleX = value[0],
        scaleY = value[1];
      ctx.scale(scaleX, scaleY, {
        origin: origin,
      });
      break;
    }

    case 'rotate': {
      var angle = value[0];
      ctx.rotate(angle, {
        origin: origin,
      });
      break;
    }

    case 'translate': {
      var x = value[0],
        y = value[1];
      ctx.translate(x, y, {
        origin: origin,
      });
      break;
    }

    case 'skew': {
      var xAngle = value[0],
        yAngle = value[1];
      ctx.skew(xAngle, yAngle, {
        origin: origin,
      });
      break;
    }

    case 'matrix': {
      ctx.transform.apply(ctx, value);
      break;
    }

    default: {
      console.error(
        "Transform operation: '" + operation + "' doesn't supported",
      );
    }
  }
};

var applyTransformations = function applyTransformations(ctx, node) {
  var _node$style, _node$props;

  if (!node.origin) return;
  var origin = [node.origin.left, node.origin.top];
  var operations =
    ((_node$style = node.style) === null || _node$style === void 0
      ? void 0
      : _node$style.transform) ||
    ((_node$props = node.props) === null || _node$props === void 0
      ? void 0
      : _node$props.transform) ||
    [];
  operations.forEach(function(operation) {
    applySingleTransformation(ctx, operation, origin);
  });
};

var _boundingBoxFns;

var getPathBoundingBox = function getPathBoundingBox(node) {
  var _node$props;

  var path = normalizePath__default['default'](
    absPath__default['default'](
      parsePath__default['default'](
        ((_node$props = node.props) === null || _node$props === void 0
          ? void 0
          : _node$props.d) || '',
      ),
    ),
  );
  if (!path.length) return [0, 0, 0, 0];
  var bounds = [Infinity, Infinity, -Infinity, -Infinity];

  for (var i = 0, l = path.length; i < l; i += 1) {
    var points = path[i].slice(1);

    for (var j = 0; j < points.length; j += 2) {
      if (points[j + 0] < bounds[0]) bounds[0] = points[j + 0];
      if (points[j + 1] < bounds[1]) bounds[1] = points[j + 1];
      if (points[j + 0] > bounds[2]) bounds[2] = points[j + 0];
      if (points[j + 1] > bounds[3]) bounds[3] = points[j + 1];
    }
  }

  return bounds;
};

var getCircleBoundingBox = function getCircleBoundingBox(node) {
  var _node$props2, _node$props3, _node$props4;

  var r =
    ((_node$props2 = node.props) === null || _node$props2 === void 0
      ? void 0
      : _node$props2.r) || 0;
  var cx =
    ((_node$props3 = node.props) === null || _node$props3 === void 0
      ? void 0
      : _node$props3.cx) || 0;
  var cy =
    ((_node$props4 = node.props) === null || _node$props4 === void 0
      ? void 0
      : _node$props4.cy) || 0;
  return [cx - r, cy - r, cx + r, cy + r];
};

var getEllipseBoundingBox = function getEllipseBoundingBox(node) {
  var _node$props5, _node$props6, _node$props7, _node$props8;

  var cx =
    ((_node$props5 = node.props) === null || _node$props5 === void 0
      ? void 0
      : _node$props5.cx) || 0;
  var cy =
    ((_node$props6 = node.props) === null || _node$props6 === void 0
      ? void 0
      : _node$props6.cy) || 0;
  var rx =
    ((_node$props7 = node.props) === null || _node$props7 === void 0
      ? void 0
      : _node$props7.rx) || 0;
  var ry =
    ((_node$props8 = node.props) === null || _node$props8 === void 0
      ? void 0
      : _node$props8.ry) || 0;
  return [cx - rx, cy - ry, cx + rx, cy + ry];
};

var getLineBoundingBox = function getLineBoundingBox(node) {
  var _node$props9, _node$props10, _node$props11, _node$props12;

  var x1 =
    ((_node$props9 = node.props) === null || _node$props9 === void 0
      ? void 0
      : _node$props9.x1) || 0;
  var y1 =
    ((_node$props10 = node.props) === null || _node$props10 === void 0
      ? void 0
      : _node$props10.y1) || 0;
  var x2 =
    ((_node$props11 = node.props) === null || _node$props11 === void 0
      ? void 0
      : _node$props11.x2) || 0;
  var y2 =
    ((_node$props12 = node.props) === null || _node$props12 === void 0
      ? void 0
      : _node$props12.y2) || 0;
  return [
    Math.min(x1, x2),
    Math.min(y1, y2),
    Math.max(x1, x2),
    Math.max(y1, y2),
  ];
};

var getRectBoundingBox = function getRectBoundingBox(node) {
  var _node$props13, _node$props14, _node$props15, _node$props16;

  var x =
    ((_node$props13 = node.props) === null || _node$props13 === void 0
      ? void 0
      : _node$props13.x) || 0;
  var y =
    ((_node$props14 = node.props) === null || _node$props14 === void 0
      ? void 0
      : _node$props14.y) || 0;
  var width =
    ((_node$props15 = node.props) === null || _node$props15 === void 0
      ? void 0
      : _node$props15.width) || 0;
  var height =
    ((_node$props16 = node.props) === null || _node$props16 === void 0
      ? void 0
      : _node$props16.height) || 0;
  return [x, y, x + width, y + height];
};

var max = function max(values) {
  return Math.max.apply(Math, [-Infinity].concat(values));
};

var min = function min(values) {
  return Math.min.apply(Math, [Infinity].concat(values));
};

var getPolylineBoundingBox = function getPolylineBoundingBox(node) {
  var _node$props17;

  var points = parsePoints(
    ((_node$props17 = node.props) === null || _node$props17 === void 0
      ? void 0
      : _node$props17.points) || [],
  );
  var xValues = points.map(function(p) {
    return p[0];
  });
  var yValues = points.map(function(p) {
    return p[1];
  });
  return [min(xValues), min(yValues), max(xValues), max(yValues)];
};

var boundingBoxFns =
  ((_boundingBoxFns = {}),
  (_boundingBoxFns[P__namespace.Rect] = getRectBoundingBox),
  (_boundingBoxFns[P__namespace.Line] = getLineBoundingBox),
  (_boundingBoxFns[P__namespace.Path] = getPathBoundingBox),
  (_boundingBoxFns[P__namespace.Circle] = getCircleBoundingBox),
  (_boundingBoxFns[P__namespace.Ellipse] = getEllipseBoundingBox),
  (_boundingBoxFns[P__namespace.Polygon] = getPolylineBoundingBox),
  (_boundingBoxFns[P__namespace.Polyline] = getPolylineBoundingBox),
  _boundingBoxFns);

var getBoundingBox = function getBoundingBox(node) {
  var boundingBoxFn = boundingBoxFns[node.type];
  return boundingBoxFn ? boundingBoxFn(node) : [0, 0, 0, 0];
};

var _renderFns$1;

var setStrokeWidth = function setStrokeWidth(ctx, node) {
  var _node$props;

  var lineWidth =
    ((_node$props = node.props) === null || _node$props === void 0
      ? void 0
      : _node$props.strokeWidth) || 0;
  if (lineWidth) ctx.lineWidth(lineWidth);
};

var setStrokeColor = function setStrokeColor(ctx, node) {
  var _node$props2;

  var strokeColor =
    ((_node$props2 = node.props) === null || _node$props2 === void 0
      ? void 0
      : _node$props2.stroke) || null;
  if (strokeColor) ctx.strokeColor(strokeColor);
};

var setOpacity = function setOpacity(ctx, node) {
  var _node$props3;

  var opacity =
    ((_node$props3 = node.props) === null || _node$props3 === void 0
      ? void 0
      : _node$props3.opacity) || null;
  if (!fns.isNil(opacity)) ctx.opacity(opacity);
};

var setFillOpacity = function setFillOpacity(ctx, node) {
  var _node$props4;

  var fillOpacity =
    ((_node$props4 = node.props) === null || _node$props4 === void 0
      ? void 0
      : _node$props4.fillOpacity) || null;
  if (!fns.isNil(fillOpacity)) ctx.fillOpacity(fillOpacity);
};

var setStrokeOpacity = function setStrokeOpacity(ctx, node) {
  var _node$props5;

  var strokeOpacity =
    ((_node$props5 = node.props) === null || _node$props5 === void 0
      ? void 0
      : _node$props5.strokeOpacity) || null;
  if (!fns.isNil(strokeOpacity)) ctx.strokeOpacity(strokeOpacity);
};

var setLineJoin = function setLineJoin(ctx, node) {
  var _node$props6;

  var lineJoin =
    ((_node$props6 = node.props) === null || _node$props6 === void 0
      ? void 0
      : _node$props6.strokeLinejoin) || null;
  if (lineJoin) ctx.lineJoin(lineJoin);
};

var setLineCap = function setLineCap(ctx, node) {
  var _node$props7;

  var lineCap =
    ((_node$props7 = node.props) === null || _node$props7 === void 0
      ? void 0
      : _node$props7.strokeLinecap) || null;
  if (lineCap) ctx.lineCap(lineCap);
};

var setLineDash = function setLineDash(ctx, node) {
  var _node$props8;

  var value =
    ((_node$props8 = node.props) === null || _node$props8 === void 0
      ? void 0
      : _node$props8.strokeDasharray) || null;
  if (value) ctx.dash(value.split(','));
};

var hasLinearGradientFill = function hasLinearGradientFill(node) {
  var _node$props9, _node$props9$fill;

  return (
    ((_node$props9 = node.props) === null || _node$props9 === void 0
      ? void 0
      : (_node$props9$fill = _node$props9.fill) === null ||
        _node$props9$fill === void 0
      ? void 0
      : _node$props9$fill.type) === P__namespace.LinearGradient
  );
};

var hasRadialGradientFill = function hasRadialGradientFill(node) {
  var _node$props10, _node$props10$fill;

  return (
    ((_node$props10 = node.props) === null || _node$props10 === void 0
      ? void 0
      : (_node$props10$fill = _node$props10.fill) === null ||
        _node$props10$fill === void 0
      ? void 0
      : _node$props10$fill.type) === P__namespace.RadialGradient
  );
}; // Math simplified from https://github.com/devongovett/svgkit/blob/master/src/elements/SVGGradient.js#L104

var setLinearGradientFill = function setLinearGradientFill(ctx, node) {
  var _node$props11;

  var bbox = getBoundingBox(node);
  var gradient =
    ((_node$props11 = node.props) === null || _node$props11 === void 0
      ? void 0
      : _node$props11.fill) || null;
  var x1 = gradient.props.x1 || 0;
  var y1 = gradient.props.y1 || 0;
  var x2 = gradient.props.x2 || 1;
  var y2 = gradient.props.y2 || 0;
  var m0 = bbox[2] - bbox[0];
  var m3 = bbox[3] - bbox[1];
  var m4 = bbox[0];
  var m5 = bbox[1];
  var gx1 = m0 * x1 + m4;
  var gy1 = m3 * y1 + m5;
  var gx2 = m0 * x2 + m4;
  var gy2 = m3 * y2 + m5;
  var grad = ctx.linearGradient(gx1, gy1, gx2, gy2);
  gradient.children.forEach(function(stop) {
    grad.stop(stop.props.offset, stop.props.stopColor, stop.props.stopOpacity);
  });
  ctx.fill(grad);
}; // Math simplified from https://github.com/devongovett/svgkit/blob/master/src/elements/SVGGradient.js#L155

var setRadialGradientFill = function setRadialGradientFill(ctx, node) {
  var _node$props12;

  var bbox = getBoundingBox(node);
  var gradient =
    ((_node$props12 = node.props) === null || _node$props12 === void 0
      ? void 0
      : _node$props12.fill) || null;
  var cx = gradient.props.cx || 0.5;
  var cy = gradient.props.cy || 0.5;
  var fx = gradient.props.fx || cx;
  var fy = gradient.props.fy || cy;
  var r = gradient.props.r || 0.5;
  var m0 = bbox[2] - bbox[0];
  var m3 = bbox[3] - bbox[1];
  var m4 = bbox[0];
  var m5 = bbox[1];
  var gr = r * m0;
  var gcx = m0 * cx + m4;
  var gcy = m3 * cy + m5;
  var gfx = m0 * fx + m4;
  var gfy = m3 * fy + m5;
  var grad = ctx.radialGradient(gfx, gfy, 0, gcx, gcy, gr);
  gradient.children.forEach(function(stop) {
    grad.stop(stop.props.offset, stop.props.stopColor, stop.props.stopOpacity);
  });
  ctx.fill(grad);
};

var setFillColor = function setFillColor(ctx, node) {
  var _node$props13;

  var fillColor =
    ((_node$props13 = node.props) === null || _node$props13 === void 0
      ? void 0
      : _node$props13.fill) || null;
  if (fillColor) ctx.fillColor(fillColor);
};

var setFill = function setFill(ctx, node) {
  if (hasLinearGradientFill(node)) return setLinearGradientFill(ctx, node);
  if (hasRadialGradientFill(node)) return setRadialGradientFill(ctx, node);
  return setFillColor(ctx, node);
};

var draw = function draw(ctx, node) {
  var props = node.props || {};

  if (props.fill && props.stroke) {
    ctx.fillAndStroke(props.fillRule);
  } else if (props.fill) {
    ctx.fill(props.fillRule);
  } else if (props.stroke) {
    ctx.stroke();
  } else {
    ctx.save();
    ctx.opacity(0);
    ctx.fill(null);
    ctx.restore();
  }
};

var noop = function noop() {};

var renderFns$1 =
  ((_renderFns$1 = {}),
  (_renderFns$1[P__namespace.Tspan] = noop),
  (_renderFns$1[P__namespace.TextInstance] = noop),
  (_renderFns$1[P__namespace.Path] = renderPath),
  (_renderFns$1[P__namespace.Rect] = renderRect),
  (_renderFns$1[P__namespace.Line] = renderLine$1),
  (_renderFns$1[P__namespace.G] = renderGroup),
  (_renderFns$1[P__namespace.Text] = renderSvgText),
  (_renderFns$1[P__namespace.Circle] = renderCircle),
  (_renderFns$1[P__namespace.Image] = renderImage$1),
  (_renderFns$1[P__namespace.Ellipse] = renderEllipse),
  (_renderFns$1[P__namespace.Polygon] = renderPolygon),
  (_renderFns$1[P__namespace.Polyline] = renderPolyline),
  _renderFns$1);

var renderNode$1 = function renderNode(ctx, node) {
  var renderFn = renderFns$1[node.type];

  if (renderFns$1) {
    renderFn(ctx, node);
  } else {
    console.warn(
      'SVG node of type ' + node.type + ' is not currenty supported',
    );
  }
};

var drawNode = function drawNode(ctx, node) {
  setLineCap(ctx, node);
  setLineDash(ctx, node);
  setLineJoin(ctx, node);
  setStrokeWidth(ctx, node);
  setStrokeColor(ctx, node);
  setFill(ctx, node);
  setStrokeOpacity(ctx, node);
  setFillOpacity(ctx, node);
  setOpacity(ctx, node);
  applyTransformations(ctx, node);
  renderNode$1(ctx, node);
  draw(ctx, node);
};

var clipPath = function clipPath(ctx, node) {
  var _node$props14;

  var value =
    (_node$props14 = node.props) === null || _node$props14 === void 0
      ? void 0
      : _node$props14.clipPath;

  if (value) {
    var children = value.children || [];
    children.forEach(function(child) {
      return renderNode$1(ctx, child);
    });
    ctx.clip();
  }
};

var drawChildren = function drawChildren(ctx, node) {
  var children = node.children || [];
  children.forEach(function(child) {
    ctx.save();
    clipPath(ctx, child);
    drawNode(ctx, child);
    drawChildren(ctx, child);
    ctx.restore();
  });
};

var resolveAspectRatio = function resolveAspectRatio(ctx, node) {
  var _node$box = node.box,
    width = _node$box.width,
    height = _node$box.height;
  var _node$props15 = node.props,
    viewBox = _node$props15.viewBox,
    _node$props15$preserv = _node$props15.preserveAspectRatio,
    preserveAspectRatio =
      _node$props15$preserv === void 0 ? {} : _node$props15$preserv;
  var _preserveAspectRatio$ = preserveAspectRatio.meetOrSlice,
    meetOrSlice =
      _preserveAspectRatio$ === void 0 ? 'meet' : _preserveAspectRatio$,
    _preserveAspectRatio$2 = preserveAspectRatio.align,
    align =
      _preserveAspectRatio$2 === void 0 ? 'xMidYMid' : _preserveAspectRatio$2;
  if (viewBox == null || width == null || height == null) return;
  var x = (viewBox === null || viewBox === void 0 ? void 0 : viewBox.minX) || 0;
  var y = (viewBox === null || viewBox === void 0 ? void 0 : viewBox.minY) || 0;
  var logicalWidth =
    (viewBox === null || viewBox === void 0 ? void 0 : viewBox.maxX) || width;
  var logicalHeight =
    (viewBox === null || viewBox === void 0 ? void 0 : viewBox.maxY) || height;
  var logicalRatio = logicalWidth / logicalHeight;
  var physicalRatio = width / height;
  var scaleX = width / logicalWidth;
  var scaleY = height / logicalHeight;

  if (align === 'none') {
    ctx.scale(scaleX, scaleY);
    ctx.translate(-x, -y);
    return;
  }

  if (
    (logicalRatio < physicalRatio && meetOrSlice === 'meet') ||
    (logicalRatio >= physicalRatio && meetOrSlice === 'slice')
  ) {
    ctx.scale(scaleY, scaleY);

    switch (align) {
      case 'xMinYMin':
      case 'xMinYMid':
      case 'xMinYMax':
        ctx.translate(-x, -y);
        break;

      case 'xMidYMin':
      case 'xMidYMid':
      case 'xMidYMax':
        ctx.translate(
          -x - (logicalWidth - (width * logicalHeight) / height) / 2,
          -y,
        );
        break;

      default:
        ctx.translate(
          -x - (logicalWidth - (width * logicalHeight) / height),
          -y,
        );
    }
  } else {
    ctx.scale(scaleX, scaleX);

    switch (align) {
      case 'xMinYMin':
      case 'xMidYMin':
      case 'xMaxYMin':
        ctx.translate(-x, -y);
        break;

      case 'xMinYMid':
      case 'xMidYMid':
      case 'xMaxYMid':
        ctx.translate(
          -x,
          -y - (logicalHeight - (height * logicalWidth) / width) / 2,
        );
        break;

      default:
        ctx.translate(
          -x,
          -y - (logicalHeight - (height * logicalWidth) / width),
        );
    }
  }
};

var moveToOrigin = function moveToOrigin(ctx, node) {
  var _node$box2 = node.box,
    top = _node$box2.top,
    left = _node$box2.left;
  var paddingLeft = node.box.paddingLeft || 0;
  var paddingTop = node.box.paddingTop || 0;
  ctx.translate(left + paddingLeft, top + paddingTop);
};

var renderSvg = function renderSvg(ctx, node) {
  ctx.save();
  clipNode(ctx, node);
  moveToOrigin(ctx, node);
  resolveAspectRatio(ctx, node);
  drawChildren(ctx, node);
  ctx.restore();
};

var parseColor = function parseColor(hex) {
  var parsed = colorString__default['default'].get(hex);
  var value = colorString__default['default'].to.hex(parsed.value.slice(0, 3));
  var opacity = parsed.value[3];
  return {
    value: value,
    opacity: opacity,
  };
};

/* eslint-disable no-param-reassign */
var DEST_REGEXP = /^#.+/;

var isSrcId$1 = function isSrcId(src) {
  return src.match(DEST_REGEXP);
};

var renderAttachment = function renderAttachment(ctx, attachment) {
  var _attachment$xOffset = attachment.xOffset,
    xOffset = _attachment$xOffset === void 0 ? 0 : _attachment$xOffset,
    _attachment$yOffset = attachment.yOffset,
    yOffset = _attachment$yOffset === void 0 ? 0 : _attachment$yOffset,
    width = attachment.width,
    height = attachment.height,
    image = attachment.image;
  ctx.translate(-width + xOffset, -height + yOffset);
  ctx.image(image, 0, 0, {
    fit: [width, height],
    align: 'center',
    valign: 'bottom',
  });
};

var renderAttachments = function renderAttachments(ctx, run) {
  ctx.save();
  var font = run.attributes.font;
  var space = font.glyphForCodePoint(0x20);
  var objectReplacement = font.glyphForCodePoint(0xfffc);
  var attachmentAdvance = 0;

  for (var i = 0; i < run.glyphs.length; i += 1) {
    var position = run.positions[i];
    var glyph = run.glyphs[i];
    attachmentAdvance += position.xAdvance || 0;

    if (glyph.id === objectReplacement.id && run.attributes.attachment) {
      ctx.translate(attachmentAdvance, position.yOffset || 0);
      renderAttachment(ctx, run.attributes.attachment);
      run.glyphs[i] = space;
      attachmentAdvance = 0;
    }
  }

  ctx.restore();
};

var renderRun = function renderRun(ctx, run, options) {
  var _run$attributes = run.attributes,
    font = _run$attributes.font,
    fontSize = _run$attributes.fontSize,
    link = _run$attributes.link;
  var color = parseColor(run.attributes.color);
  var opacity = fns.isNil(run.attributes.opacity)
    ? color.opacity
    : run.attributes.opacity;
  var height = run.height,
    descent = run.descent,
    xAdvance = run.xAdvance;

  if (options.outlineRuns) {
    ctx.rect(0, -height, xAdvance, height).stroke();
  }

  ctx.fillColor(color.value);
  ctx.fillOpacity(opacity);

  if (link) {
    if (isSrcId$1(link)) {
      ctx.goTo(0, -height - descent, xAdvance, height, link.slice(1));
    } else {
      ctx.link(0, -height - descent, xAdvance, height, link);
    }
  }

  renderAttachments(ctx, run);

  if (font.sbix || (font.COLR && font.CPAL)) {
    ctx.save();
    ctx.translate(0, -run.ascent);

    for (var i = 0; i < run.glyphs.length; i += 1) {
      var position = run.positions[i];
      var glyph = run.glyphs[i];
      ctx.save();
      ctx.translate(position.xOffset, position.yOffset);
      glyph.render(ctx, fontSize);
      ctx.restore();
      ctx.translate(position.xAdvance, position.yAdvance);
    }

    ctx.restore();
  } else {
    ctx.font(typeof font.name === 'string' ? font.name : font, fontSize);

    try {
      renderGlyphs(ctx, run.glyphs, run.positions, 0, 0);
    } catch (error) {
      console.log(error);
    }
  }

  ctx.translate(xAdvance, 0);
};

var renderBackground$1 = function renderBackground(ctx, rect, backgroundColor) {
  var color = parseColor(backgroundColor);
  ctx.save();
  ctx.fillOpacity(color.opacity);
  ctx.rect(rect.x, rect.y, rect.width, rect.height);
  ctx.fill(color.value);
  ctx.restore();
};

var renderDecorationLine = function renderDecorationLine(ctx, line) {
  ctx.save();
  ctx.lineWidth(line.rect.height);
  ctx.strokeOpacity(line.opacity);

  if (/dashed/.test(line.style)) {
    ctx.dash(3 * line.rect.height);
  } else if (/dotted/.test(line.style)) {
    ctx.dash(line.rect.height);
  }

  if (/wavy/.test(line.style)) {
    var dist = Math.max(2, line.rect.height);
    var step = 1.1 * dist;
    var stepCount = Math.floor(line.rect.width / (2 * step)); // Adjust step to fill entire width

    var remainingWidth = line.rect.width - stepCount * 2 * step;
    var adjustment = remainingWidth / stepCount / 2;
    step += adjustment;
    var cp1y = line.rect.y + dist;
    var cp2y = line.rect.y - dist;
    var x = line.rect.x;
    ctx.moveTo(line.rect.x, line.rect.y);

    for (var i = 0; i < stepCount; i += 1) {
      ctx.bezierCurveTo(
        x + step,
        cp1y,
        x + step,
        cp2y,
        x + 2 * step,
        line.rect.y,
      );
      x += 2 * step;
    }
  } else {
    ctx.moveTo(line.rect.x, line.rect.y);
    ctx.lineTo(line.rect.x + line.rect.width, line.rect.y);

    if (/double/.test(line.style)) {
      ctx.moveTo(line.rect.x, line.rect.y + line.rect.height * 2);
      ctx.lineTo(
        line.rect.x + line.rect.width,
        line.rect.y + line.rect.height * 2,
      );
    }
  }

  ctx.stroke(line.color);
  ctx.restore();
};

var renderLine = function renderLine(ctx, line, options) {
  var lineAscent = line.ascent;

  if (options.outlineLines) {
    ctx.rect(line.box.x, line.box.y, line.box.width, line.box.height).stroke();
  }

  ctx.save();
  ctx.translate(line.box.x, line.box.y + lineAscent);

  for (var i = 0; i < line.runs.length; i += 1) {
    var run = line.runs[i];
    var isLastRun = i === line.runs.length - 1;

    if (run.attributes.backgroundColor) {
      var overflowRight = isLastRun ? line.overflowRight : 0;
      var backgroundRect = {
        x: 0,
        y: -lineAscent,
        height: line.box.height,
        width: run.xAdvance - overflowRight,
      };
      renderBackground$1(ctx, backgroundRect, run.attributes.backgroundColor);
    }

    renderRun(ctx, run, options);
  }

  ctx.restore();
  ctx.save();
  ctx.translate(line.box.x, line.box.y);

  for (var _i = 0; _i < line.decorationLines.length; _i += 1) {
    var decorationLine = line.decorationLines[_i];
    renderDecorationLine(ctx, decorationLine);
  }

  ctx.restore();
};

var renderBlock = function renderBlock(ctx, block, options) {
  block.forEach(function(line) {
    renderLine(ctx, line, options);
  });
};

var renderText = function renderText(ctx, node) {
  var _node$box2, _node$box3;

  var _node$box = node.box,
    top = _node$box.top,
    left = _node$box.left;
  var blocks = [node.lines];
  var paddingTop =
    ((_node$box2 = node.box) === null || _node$box2 === void 0
      ? void 0
      : _node$box2.paddingTop) || 0;
  var paddingLeft =
    ((_node$box3 = node.box) === null || _node$box3 === void 0
      ? void 0
      : _node$box3.paddingLeft) || 0;
  var initialY = node.lines[0] ? node.lines[0].box.y : 0;
  var offsetX = node.alignOffset || 0;
  ctx.save();
  ctx.translate(left + paddingLeft - offsetX, top + paddingTop - initialY);
  blocks.forEach(function(block) {
    renderBlock(ctx, block, {});
  });
  ctx.restore();
};

var renderPage = function renderPage(ctx, node) {
  var _node$props;

  var _node$box = node.box,
    width = _node$box.width,
    height = _node$box.height;
  var dpi =
    ((_node$props = node.props) === null || _node$props === void 0
      ? void 0
      : _node$props.dpi) || 72;
  var userUnit = dpi / 72;
  ctx.addPage({
    size: [width, height],
    margin: 0,
    userUnit: userUnit,
  });
};

var renderNote = function renderNote(ctx, node) {
  var _node$children, _node$style, _node$style2;

  var _node$box = node.box,
    top = _node$box.top,
    left = _node$box.left;
  var value =
    (node === null || node === void 0
      ? void 0
      : (_node$children = node.children) === null || _node$children === void 0
      ? void 0
      : _node$children[0].value) || '';
  var color =
    ((_node$style = node.style) === null || _node$style === void 0
      ? void 0
      : _node$style.backgroundColor) || null;
  var borderWidth =
    ((_node$style2 = node.style) === null || _node$style2 === void 0
      ? void 0
      : _node$style2.borderWidth) || null;
  ctx.note(left, top, 0, 0, value, {
    color: color,
    borderWidth: borderWidth,
  });
};

var isNumeric = function isNumeric(n) {
  return !Number.isNaN(parseFloat(n)) && Number.isFinite(n);
};

var applyContainObjectFit = function applyContainObjectFit(
  cw,
  ch,
  iw,
  ih,
  px,
  py,
) {
  var cr = cw / ch;
  var ir = iw / ih;
  var pxp = fns.matchPercent(px);
  var pyp = fns.matchPercent(py);
  var pxv = pxp ? pxp.percent : 0.5;
  var pyv = pyp ? pyp.percent : 0.5;

  if (cr > ir) {
    var _height = ch;

    var _width = _height * ir;

    var _yOffset = isNumeric(py) ? py : 0;

    var _xOffset = isNumeric(px) ? px : (cw - _width) * pxv;

    return {
      width: _width,
      height: _height,
      xOffset: _xOffset,
      yOffset: _yOffset,
    };
  }

  var width = cw;
  var height = width / ir;
  var xOffset = isNumeric(px) ? px : 0;
  var yOffset = isNumeric(py) ? py : (ch - height) * pyv;
  return {
    width: width,
    height: height,
    yOffset: yOffset,
    xOffset: xOffset,
  };
};

var applyNoneObjectFit = function applyNoneObjectFit(cw, ch, iw, ih, px, py) {
  var width = iw;
  var height = ih;
  var pxp = fns.matchPercent(px);
  var pyp = fns.matchPercent(py);
  var pxv = pxp ? pxp.percent : 0.5;
  var pyv = pyp ? pyp.percent : 0.5;
  var xOffset = isNumeric(px) ? px : (cw - width) * pxv;
  var yOffset = isNumeric(py) ? py : (ch - height) * pyv;
  return {
    width: width,
    height: height,
    xOffset: xOffset,
    yOffset: yOffset,
  };
};

var applyCoverObjectFit = function applyCoverObjectFit(cw, ch, iw, ih, px, py) {
  var ir = iw / ih;
  var cr = cw / ch;
  var pxp = fns.matchPercent(px);
  var pyp = fns.matchPercent(py);
  var pxv = pxp ? pxp.percent : 0.5;
  var pyv = pyp ? pyp.percent : 0.5;

  if (cr > ir) {
    var _width2 = cw;

    var _height2 = _width2 / ir;

    var _xOffset2 = isNumeric(px) ? px : 0;

    var _yOffset2 = isNumeric(py) ? py : (ch - _height2) * pyv;

    return {
      width: _width2,
      height: _height2,
      yOffset: _yOffset2,
      xOffset: _xOffset2,
    };
  }

  var height = ch;
  var width = height * ir;
  var xOffset = isNumeric(px) ? px : (cw - width) * pxv;
  var yOffset = isNumeric(py) ? py : 0;
  return {
    width: width,
    height: height,
    xOffset: xOffset,
    yOffset: yOffset,
  };
};

var applyScaleDownObjectFit = function applyScaleDownObjectFit(
  cw,
  ch,
  iw,
  ih,
  px,
  py,
) {
  var containDimension = applyContainObjectFit(cw, ch, iw, ih, px, py);
  var noneDimension = applyNoneObjectFit(cw, ch, iw, ih, px, py);
  return containDimension.width < noneDimension.width
    ? containDimension
    : noneDimension;
};

var applyFillObjectFit = function applyFillObjectFit(cw, ch, px, py) {
  return {
    width: cw,
    height: ch,
    xOffset: fns.matchPercent(px) ? 0 : px || 0,
    yOffset: fns.matchPercent(py) ? 0 : py || 0,
  };
};

var resolveObjectFit = function resolveObjectFit(type, cw, ch, iw, ih, px, py) {
  if (type === void 0) {
    type = 'fill';
  }

  switch (type) {
    case 'contain':
      return applyContainObjectFit(cw, ch, iw, ih, px, py);

    case 'cover':
      return applyCoverObjectFit(cw, ch, iw, ih, px, py);

    case 'none':
      return applyNoneObjectFit(cw, ch, iw, ih, px, py);

    case 'scale-down':
      return applyScaleDownObjectFit(cw, ch, iw, ih, px, py);

    default:
      return applyFillObjectFit(cw, ch, px, py);
  }
};

var drawImage = function drawImage(ctx, node, options) {
  var _node$style, _node$style2, _node$style3, _node$style4;

  if (options === void 0) {
    options = {};
  }

  var _node$box = node.box,
    left = _node$box.left,
    top = _node$box.top;
  var opacity =
    (_node$style = node.style) === null || _node$style === void 0
      ? void 0
      : _node$style.opacity;
  var objectFit =
    (_node$style2 = node.style) === null || _node$style2 === void 0
      ? void 0
      : _node$style2.objectFit;
  var objectPositionX =
    (_node$style3 = node.style) === null || _node$style3 === void 0
      ? void 0
      : _node$style3.objectPositionX;
  var objectPositionY =
    (_node$style4 = node.style) === null || _node$style4 === void 0
      ? void 0
      : _node$style4.objectPositionY;
  var paddingTop = node.box.paddingTop || 0;
  var paddingRight = node.box.paddingRight || 0;
  var paddingBottom = node.box.paddingBottom || 0;
  var paddingLeft = node.box.paddingLeft || 0;
  var imageCache = options.imageCache || new Map();

  var _resolveObjectFit = resolveObjectFit(
      objectFit,
      node.box.width - paddingLeft - paddingRight,
      node.box.height - paddingTop - paddingBottom,
      node.image.width,
      node.image.height,
      objectPositionX,
      objectPositionY,
    ),
    width = _resolveObjectFit.width,
    height = _resolveObjectFit.height,
    xOffset = _resolveObjectFit.xOffset,
    yOffset = _resolveObjectFit.yOffset;

  if (node.image.data) {
    if (width !== 0 && height !== 0) {
      var cacheKey = node.image.key;
      var image = imageCache.get(cacheKey) || ctx.embedImage(node.image.data);
      if (cacheKey) imageCache.set(cacheKey, image);
      var imageOpacity = fns.isNil(opacity) ? 1 : opacity;
      ctx
        .fillOpacity(imageOpacity)
        .image(
          image,
          left + paddingLeft + xOffset,
          top + paddingTop + yOffset,
          {
            width: width,
            height: height,
          },
        );
    } else {
      console.warn(
        "Image with src '" +
          JSON.stringify(node.props.src) +
          "' skipped due to invalid dimensions",
      );
    }
  }
};

var renderImage = function renderImage(ctx, node, options) {
  ctx.save();
  clipNode(ctx, node);
  drawImage(ctx, node, options);
  ctx.restore();
};

var CONTENT_COLOR = '#a1c6e7';
var PADDING_COLOR = '#c4deb9';
var MARGIN_COLOR = '#f8cca1'; // TODO: Draw debug boxes using clipping to enhance quality

var debugContent = function debugContent(ctx, node) {
  var _node$box = node.box,
    left = _node$box.left,
    top = _node$box.top,
    width = _node$box.width,
    height = _node$box.height,
    _node$box$paddingLeft = _node$box.paddingLeft,
    paddingLeft = _node$box$paddingLeft === void 0 ? 0 : _node$box$paddingLeft,
    _node$box$paddingTop = _node$box.paddingTop,
    paddingTop = _node$box$paddingTop === void 0 ? 0 : _node$box$paddingTop,
    _node$box$paddingRigh = _node$box.paddingRight,
    paddingRight = _node$box$paddingRigh === void 0 ? 0 : _node$box$paddingRigh,
    _node$box$paddingBott = _node$box.paddingBottom,
    paddingBottom =
      _node$box$paddingBott === void 0 ? 0 : _node$box$paddingBott,
    _node$box$borderLeftW = _node$box.borderLeftWidth,
    borderLeftWidth =
      _node$box$borderLeftW === void 0 ? 0 : _node$box$borderLeftW,
    _node$box$borderTopWi = _node$box.borderTopWidth,
    borderTopWidth =
      _node$box$borderTopWi === void 0 ? 0 : _node$box$borderTopWi,
    _node$box$borderRight = _node$box.borderRightWidth,
    borderRightWidth =
      _node$box$borderRight === void 0 ? 0 : _node$box$borderRight,
    _node$box$borderBotto = _node$box.borderBottomWidth,
    borderBottomWidth =
      _node$box$borderBotto === void 0 ? 0 : _node$box$borderBotto;
  ctx
    .fillColor(CONTENT_COLOR)
    .opacity(0.5)
    .rect(
      left + paddingLeft + borderLeftWidth,
      top + paddingTop + borderTopWidth,
      width - paddingLeft - paddingRight - borderRightWidth - borderLeftWidth,
      height - paddingTop - paddingBottom - borderTopWidth - borderBottomWidth,
    )
    .fill();
};

var debugPadding = function debugPadding(ctx, node) {
  var _node$box2 = node.box,
    left = _node$box2.left,
    top = _node$box2.top,
    width = _node$box2.width,
    height = _node$box2.height,
    _node$box2$paddingLef = _node$box2.paddingLeft,
    paddingLeft = _node$box2$paddingLef === void 0 ? 0 : _node$box2$paddingLef,
    _node$box2$paddingTop = _node$box2.paddingTop,
    paddingTop = _node$box2$paddingTop === void 0 ? 0 : _node$box2$paddingTop,
    _node$box2$paddingRig = _node$box2.paddingRight,
    paddingRight = _node$box2$paddingRig === void 0 ? 0 : _node$box2$paddingRig,
    _node$box2$paddingBot = _node$box2.paddingBottom,
    paddingBottom =
      _node$box2$paddingBot === void 0 ? 0 : _node$box2$paddingBot,
    _node$box2$borderLeft = _node$box2.borderLeftWidth,
    borderLeftWidth =
      _node$box2$borderLeft === void 0 ? 0 : _node$box2$borderLeft,
    _node$box2$borderTopW = _node$box2.borderTopWidth,
    borderTopWidth =
      _node$box2$borderTopW === void 0 ? 0 : _node$box2$borderTopW,
    _node$box2$borderRigh = _node$box2.borderRightWidth,
    borderRightWidth =
      _node$box2$borderRigh === void 0 ? 0 : _node$box2$borderRigh,
    _node$box2$borderBott = _node$box2.borderBottomWidth,
    borderBottomWidth =
      _node$box2$borderBott === void 0 ? 0 : _node$box2$borderBott;
  ctx.fillColor(PADDING_COLOR).opacity(0.5); // Padding top

  ctx
    .rect(
      left + paddingLeft + borderLeftWidth,
      top + borderTopWidth,
      width - paddingRight - paddingLeft - borderLeftWidth - borderRightWidth,
      paddingTop,
    )
    .fill(); // Padding left

  ctx
    .rect(
      left + borderLeftWidth,
      top + borderTopWidth,
      paddingLeft,
      height - borderTopWidth - borderBottomWidth,
    )
    .fill(); // Padding right

  ctx
    .rect(
      left + width - paddingRight - borderRightWidth,
      top + borderTopWidth,
      paddingRight,
      height - borderTopWidth - borderBottomWidth,
    )
    .fill(); // Padding bottom

  ctx
    .rect(
      left + paddingLeft + borderLeftWidth,
      top + height - paddingBottom - borderBottomWidth,
      width - paddingRight - paddingLeft - borderLeftWidth - borderRightWidth,
      paddingBottom,
    )
    .fill();
};

var getMargin = function getMargin(box) {
  var marginLeft = box.marginLeft === 'auto' ? 0 : box.marginLeft;
  var marginTop = box.marginTop === 'auto' ? 0 : box.marginTop;
  var marginRight = box.marginRight === 'auto' ? 0 : box.marginRight;
  var marginBottom = box.marginBottom === 'auto' ? 0 : box.marginBottom;
  return {
    marginLeft: marginLeft,
    marginTop: marginTop,
    marginRight: marginRight,
    marginBottom: marginBottom,
  };
};

var debugMargin = function debugMargin(ctx, node) {
  var _node$box3 = node.box,
    left = _node$box3.left,
    top = _node$box3.top,
    width = _node$box3.width,
    height = _node$box3.height;

  var _getMargin = getMargin(node.box),
    _getMargin$marginLeft = _getMargin.marginLeft,
    marginLeft = _getMargin$marginLeft === void 0 ? 0 : _getMargin$marginLeft,
    _getMargin$marginTop = _getMargin.marginTop,
    marginTop = _getMargin$marginTop === void 0 ? 0 : _getMargin$marginTop,
    _getMargin$marginRigh = _getMargin.marginRight,
    marginRight = _getMargin$marginRigh === void 0 ? 0 : _getMargin$marginRigh,
    _getMargin$marginBott = _getMargin.marginBottom,
    marginBottom = _getMargin$marginBott === void 0 ? 0 : _getMargin$marginBott;

  ctx.fillColor(MARGIN_COLOR).opacity(0.5); // Margin top

  ctx.rect(left, top - marginTop, width, marginTop).fill(); // Margin left

  ctx
    .rect(
      left - marginLeft,
      top - marginTop,
      marginLeft,
      height + marginTop + marginBottom,
    )
    .fill(); // Margin right

  ctx
    .rect(
      left + width,
      top - marginTop,
      marginRight,
      height + marginTop + marginBottom,
    )
    .fill(); // Margin bottom

  ctx.rect(left, top + height, width, marginBottom).fill();
};

var debugText = function debugText(ctx, node) {
  var _node$box4 = node.box,
    left = _node$box4.left,
    top = _node$box4.top,
    width = _node$box4.width,
    height = _node$box4.height;

  var _getMargin2 = getMargin(node.box),
    _getMargin2$marginLef = _getMargin2.marginLeft,
    marginLeft = _getMargin2$marginLef === void 0 ? 0 : _getMargin2$marginLef,
    _getMargin2$marginTop = _getMargin2.marginTop,
    marginTop = _getMargin2$marginTop === void 0 ? 0 : _getMargin2$marginTop,
    _getMargin2$marginRig = _getMargin2.marginRight,
    marginRight = _getMargin2$marginRig === void 0 ? 0 : _getMargin2$marginRig,
    _getMargin2$marginBot = _getMargin2.marginBottom,
    marginBottom = _getMargin2$marginBot === void 0 ? 0 : _getMargin2$marginBot;

  var roundedWidth = Math.round(width + marginLeft + marginRight);
  var roundedHeight = Math.round(height + marginTop + marginBottom);
  ctx
    .fontSize(6)
    .opacity(1)
    .fillColor('black')
    .text(
      roundedWidth + ' x ' + roundedHeight,
      left - marginLeft,
      Math.max(top - marginTop - 4, 1),
    );
};

var debugOrigin = function debugOrigin(ctx, node) {
  if (node.origin) {
    ctx
      .circle(node.origin.left, node.origin.top, 3)
      .fill('red')
      .circle(node.origin.left, node.origin.top, 5)
      .stroke('red');
  }
};

var renderDebug = function renderDebug(ctx, node) {
  var _node$props;

  if (
    !(
      (_node$props = node.props) !== null &&
      _node$props !== void 0 &&
      _node$props.debug
    )
  )
    return;
  ctx.save();
  debugContent(ctx, node);
  debugPadding(ctx, node);
  debugMargin(ctx, node);
  debugText(ctx, node);
  debugOrigin(ctx, node);
  ctx.restore();
};

var availableMethods = [
  'dash',
  'clip',
  'save',
  'path',
  'fill',
  'font',
  'text',
  'rect',
  'scale',
  'moveTo',
  'lineTo',
  'stroke',
  'rotate',
  'circle',
  'lineCap',
  'opacity',
  'ellipse',
  'polygon',
  'restore',
  'lineJoin',
  'fontSize',
  'fillColor',
  'lineWidth',
  'translate',
  'miterLimit',
  'strokeColor',
  'fillOpacity',
  'roundedRect',
  'fillAndStroke',
  'strokeOpacity',
  'bezierCurveTo',
  'quadraticCurveTo',
  'linearGradient',
  'radialGradient',
];

var painter = function painter(ctx) {
  var p = availableMethods.reduce(function(acc, prop) {
    var _extends2;

    return _extends__default['default'](
      {},
      acc,
      ((_extends2 = {}),
      (_extends2[prop] = function() {
        ctx[prop].apply(ctx, arguments);
        return p;
      }),
      _extends2),
    );
  }, {});
  return p;
};

var renderCanvas = function renderCanvas(ctx, node) {
  var _node$box = node.box,
    top = _node$box.top,
    left = _node$box.left,
    width = _node$box.width,
    height = _node$box.height;
  var paddingTop = node.box.paddingTop || 0;
  var paddingLeft = node.box.paddingLeft || 0;
  var paddingRight = node.box.paddingRight || 0;
  var paddingBottom = node.box.paddingBottom || 0;
  var availableWidth = width - paddingLeft - paddingRight;
  var availableHeight = height - paddingTop - paddingBottom;

  if (!availableWidth || !availableHeight) {
    console.warn(
      'Canvas element has null width or height. Please provide valid values via the `style` prop in order to correctly render it.',
    );
  }

  ctx.save().translate(left + paddingLeft, top + paddingTop);

  if (node.props.paint) {
    node.props.paint(painter(ctx), availableWidth, availableHeight);
  }

  ctx.restore();
};

// Ref: https://www.w3.org/TR/css-backgrounds-3/#borders
// This constant is used to approximate a symmetrical arc using a cubic Bezier curve.
var KAPPA = 4.0 * ((Math.sqrt(2) - 1.0) / 3.0);

var clipBorderTop = function clipBorderTop(ctx, layout, style, rtr, rtl) {
  var top = layout.top,
    left = layout.left,
    width = layout.width,
    height = layout.height;
  var borderTopWidth = style.borderTopWidth,
    borderRightWidth = style.borderRightWidth,
    borderLeftWidth = style.borderLeftWidth; // Clip outer top border edge

  ctx.moveTo(left + rtl, top);
  ctx.lineTo(left + width - rtr, top); // Ellipse coefficients outer top right cap

  var c0 = rtr * (1.0 - KAPPA); // Clip outer top right cap

  ctx.bezierCurveTo(
    left + width - c0,
    top,
    left + width,
    top + c0,
    left + width,
    top + rtr,
  ); // Move down in case the margin exceedes the radius

  var topRightYCoord = top + Math.max(borderTopWidth, rtr);
  ctx.lineTo(left + width, topRightYCoord); // Clip inner top right cap

  ctx.lineTo(left + width - borderRightWidth, topRightYCoord); // Ellipse coefficients inner top right cap

  var innerTopRightRadiusX = Math.max(rtr - borderRightWidth, 0);
  var innerTopRightRadiusY = Math.max(rtr - borderTopWidth, 0);
  var c1 = innerTopRightRadiusX * (1.0 - KAPPA);
  var c2 = innerTopRightRadiusY * (1.0 - KAPPA); // Clip inner top right cap

  ctx.bezierCurveTo(
    left + width - borderRightWidth,
    top + borderTopWidth + c2,
    left + width - borderRightWidth - c1,
    top + borderTopWidth,
    left + width - borderRightWidth - innerTopRightRadiusX,
    top + borderTopWidth,
  ); // Clip inner top border edge

  ctx.lineTo(left + Math.max(rtl, borderLeftWidth), top + borderTopWidth); // Ellipse coefficients inner top left cap

  var innerTopLeftRadiusX = Math.max(rtl - borderLeftWidth, 0);
  var innerTopLeftRadiusY = Math.max(rtl - borderTopWidth, 0);
  var c3 = innerTopLeftRadiusX * (1.0 - KAPPA);
  var c4 = innerTopLeftRadiusY * (1.0 - KAPPA);
  var topLeftYCoord = top + Math.max(borderTopWidth, rtl); // Clip inner top left cap

  ctx.bezierCurveTo(
    left + borderLeftWidth + c3,
    top + borderTopWidth,
    left + borderLeftWidth,
    top + borderTopWidth + c4,
    left + borderLeftWidth,
    topLeftYCoord,
  );
  ctx.lineTo(left, topLeftYCoord); // Move down in case the margin exceedes the radius

  ctx.lineTo(left, top + rtl); // Ellipse coefficients outer top left cap

  var c5 = rtl * (1.0 - KAPPA); // Clip outer top left cap

  ctx.bezierCurveTo(left, top + c5, left + c5, top, left + rtl, top);
  ctx.closePath();
  ctx.clip(); // Clip border top cap joins

  if (borderRightWidth) {
    var trSlope = -borderTopWidth / borderRightWidth;
    ctx.moveTo(left + width / 2, trSlope * (-width / 2) + top);
    ctx.lineTo(left + width, top);
    ctx.lineTo(left, top);
    ctx.lineTo(left, top + height);
    ctx.closePath();
    ctx.clip();
  }

  if (borderLeftWidth) {
    var _trSlope = -borderTopWidth / borderLeftWidth;

    ctx.moveTo(left + width / 2, _trSlope * (-width / 2) + top);
    ctx.lineTo(left, top);
    ctx.lineTo(left + width, top);
    ctx.lineTo(left + width, top + height);
    ctx.closePath();
    ctx.clip();
  }
};

var fillBorderTop = function fillBorderTop(ctx, layout, style, rtr, rtl) {
  var top = layout.top,
    left = layout.left,
    width = layout.width;
  var borderTopColor = style.borderTopColor,
    borderTopWidth = style.borderTopWidth,
    borderTopStyle = style.borderTopStyle,
    borderRightWidth = style.borderRightWidth,
    borderLeftWidth = style.borderLeftWidth;
  var c0 = rtl * (1.0 - KAPPA);
  var c1 = rtr * (1.0 - KAPPA);
  ctx.moveTo(left, top + Math.max(rtl, borderTopWidth));
  ctx.bezierCurveTo(left, top + c0, left + c0, top, left + rtl, top);
  ctx.lineTo(left + width - rtr, top);
  ctx.bezierCurveTo(
    left + width - c1,
    top,
    left + width,
    top + c1,
    left + width,
    top + rtr,
  );
  ctx.strokeColor(borderTopColor);
  ctx.lineWidth(
    Math.max(borderRightWidth, borderTopWidth, borderLeftWidth) * 2,
  );

  if (borderTopStyle === 'dashed') {
    ctx.dash(borderTopWidth * 2, {
      space: borderTopWidth * 1.2,
    });
  } else if (borderTopStyle === 'dotted') {
    ctx.dash(borderTopWidth, {
      space: borderTopWidth * 1.2,
    });
  }

  ctx.stroke();
  ctx.undash();
};

var clipBorderRight = function clipBorderRight(ctx, layout, style, rtr, rbr) {
  var top = layout.top,
    left = layout.left,
    width = layout.width,
    height = layout.height;
  var borderTopWidth = style.borderTopWidth,
    borderRightWidth = style.borderRightWidth,
    borderBottomWidth = style.borderBottomWidth; // Clip outer right border edge

  ctx.moveTo(left + width, top + rtr);
  ctx.lineTo(left + width, top + height - rbr); // Ellipse coefficients outer bottom right cap

  var c0 = rbr * (1.0 - KAPPA); // Clip outer top right cap

  ctx.bezierCurveTo(
    left + width,
    top + height - c0,
    left + width - c0,
    top + height,
    left + width - rbr,
    top + height,
  ); // Move left in case the margin exceedes the radius

  var topBottomXCoord = left + width - Math.max(borderRightWidth, rbr);
  ctx.lineTo(topBottomXCoord, top + height); // Clip inner bottom right cap

  ctx.lineTo(topBottomXCoord, top + height - borderBottomWidth); // Ellipse coefficients inner bottom right cap

  var innerBottomRightRadiusX = Math.max(rbr - borderRightWidth, 0);
  var innerBottomRightRadiusY = Math.max(rbr - borderBottomWidth, 0);
  var c1 = innerBottomRightRadiusX * (1.0 - KAPPA);
  var c2 = innerBottomRightRadiusY * (1.0 - KAPPA); // Clip inner top right cap

  ctx.bezierCurveTo(
    left + width - borderRightWidth - c1,
    top + height - borderBottomWidth,
    left + width - borderRightWidth,
    top + height - borderBottomWidth - c2,
    left + width - borderRightWidth,
    top + height - Math.max(rbr, borderBottomWidth),
  ); // Clip inner right border edge

  ctx.lineTo(
    left + width - borderRightWidth,
    top + Math.max(rtr, borderTopWidth),
  ); // Ellipse coefficients inner top right cap

  var innerTopRightRadiusX = Math.max(rtr - borderRightWidth, 0);
  var innerTopRightRadiusY = Math.max(rtr - borderTopWidth, 0);
  var c3 = innerTopRightRadiusX * (1.0 - KAPPA);
  var c4 = innerTopRightRadiusY * (1.0 - KAPPA);
  var topRightXCoord = left + width - Math.max(rtr, borderRightWidth); // Clip inner top left cap

  ctx.bezierCurveTo(
    left + width - borderRightWidth,
    top + borderTopWidth + c4,
    left + width - borderRightWidth - c3,
    top + borderTopWidth,
    topRightXCoord,
    top + borderTopWidth,
  );
  ctx.lineTo(topRightXCoord, top); // Move right in case the margin exceedes the radius

  ctx.lineTo(left + width - rtr, top); // Ellipse coefficients outer top right cap

  var c5 = rtr * (1.0 - KAPPA); // Clip outer top right cap

  ctx.bezierCurveTo(
    left + width - c5,
    top,
    left + width,
    top + c5,
    left + width,
    top + rtr,
  );
  ctx.closePath();
  ctx.clip(); // Clip border right cap joins

  if (borderTopWidth) {
    var trSlope = -borderTopWidth / borderRightWidth;
    ctx.moveTo(left + width / 2, trSlope * (-width / 2) + top);
    ctx.lineTo(left + width, top);
    ctx.lineTo(left + width, top + height);
    ctx.lineTo(left, top + height);
    ctx.closePath();
    ctx.clip();
  }

  if (borderBottomWidth) {
    var brSlope = borderBottomWidth / borderRightWidth;
    ctx.moveTo(left + width / 2, brSlope * (-width / 2) + top + height);
    ctx.lineTo(left + width, top + height);
    ctx.lineTo(left + width, top);
    ctx.lineTo(left, top);
    ctx.closePath();
    ctx.clip();
  }
};

var fillBorderRight = function fillBorderRight(ctx, layout, style, rtr, rbr) {
  var top = layout.top,
    left = layout.left,
    width = layout.width,
    height = layout.height;
  var borderRightColor = style.borderRightColor,
    borderRightStyle = style.borderRightStyle,
    borderRightWidth = style.borderRightWidth,
    borderTopWidth = style.borderTopWidth,
    borderBottomWidth = style.borderBottomWidth;
  var c0 = rbr * (1.0 - KAPPA);
  var c1 = rtr * (1.0 - KAPPA);
  ctx.moveTo(left + width - rtr, top);
  ctx.bezierCurveTo(
    left + width - c1,
    top,
    left + width,
    top + c1,
    left + width,
    top + rtr,
  );
  ctx.lineTo(left + width, top + height - rbr);
  ctx.bezierCurveTo(
    left + width,
    top + height - c0,
    left + width - c0,
    top + height,
    left + width - rbr,
    top + height,
  );
  ctx.strokeColor(borderRightColor);
  ctx.lineWidth(
    Math.max(borderRightWidth, borderTopWidth, borderBottomWidth) * 2,
  );

  if (borderRightStyle === 'dashed') {
    ctx.dash(borderRightWidth * 2, {
      space: borderRightWidth * 1.2,
    });
  } else if (borderRightStyle === 'dotted') {
    ctx.dash(borderRightWidth, {
      space: borderRightWidth * 1.2,
    });
  }

  ctx.stroke();
  ctx.undash();
};

var clipBorderBottom = function clipBorderBottom(ctx, layout, style, rbl, rbr) {
  var top = layout.top,
    left = layout.left,
    width = layout.width,
    height = layout.height;
  var borderBottomWidth = style.borderBottomWidth,
    borderRightWidth = style.borderRightWidth,
    borderLeftWidth = style.borderLeftWidth; // Clip outer top border edge

  ctx.moveTo(left + width - rbr, top + height);
  ctx.lineTo(left + rbl, top + height); // Ellipse coefficients outer top right cap

  var c0 = rbl * (1.0 - KAPPA); // Clip outer top right cap

  ctx.bezierCurveTo(
    left + c0,
    top + height,
    left,
    top + height - c0,
    left,
    top + height - rbl,
  ); // Move up in case the margin exceedes the radius

  var bottomLeftYCoord = top + height - Math.max(borderBottomWidth, rbl);
  ctx.lineTo(left, bottomLeftYCoord); // Clip inner bottom left cap

  ctx.lineTo(left + borderLeftWidth, bottomLeftYCoord); // Ellipse coefficients inner top right cap

  var innerBottomLeftRadiusX = Math.max(rbl - borderLeftWidth, 0);
  var innerBottomLeftRadiusY = Math.max(rbl - borderBottomWidth, 0);
  var c1 = innerBottomLeftRadiusX * (1.0 - KAPPA);
  var c2 = innerBottomLeftRadiusY * (1.0 - KAPPA); // Clip inner bottom left cap

  ctx.bezierCurveTo(
    left + borderLeftWidth,
    top + height - borderBottomWidth - c2,
    left + borderLeftWidth + c1,
    top + height - borderBottomWidth,
    left + borderLeftWidth + innerBottomLeftRadiusX,
    top + height - borderBottomWidth,
  ); // Clip inner bottom border edge

  ctx.lineTo(
    left + width - Math.max(rbr, borderRightWidth),
    top + height - borderBottomWidth,
  ); // Ellipse coefficients inner top left cap

  var innerBottomRightRadiusX = Math.max(rbr - borderRightWidth, 0);
  var innerBottomRightRadiusY = Math.max(rbr - borderBottomWidth, 0);
  var c3 = innerBottomRightRadiusX * (1.0 - KAPPA);
  var c4 = innerBottomRightRadiusY * (1.0 - KAPPA);
  var bottomRightYCoord = top + height - Math.max(borderBottomWidth, rbr); // Clip inner top left cap

  ctx.bezierCurveTo(
    left + width - borderRightWidth - c3,
    top + height - borderBottomWidth,
    left + width - borderRightWidth,
    top + height - borderBottomWidth - c4,
    left + width - borderRightWidth,
    bottomRightYCoord,
  );
  ctx.lineTo(left + width, bottomRightYCoord); // Move down in case the margin exceedes the radius

  ctx.lineTo(left + width, top + height - rbr); // Ellipse coefficients outer top left cap

  var c5 = rbr * (1.0 - KAPPA); // Clip outer top left cap

  ctx.bezierCurveTo(
    left + width,
    top + height - c5,
    left + width - c5,
    top + height,
    left + width - rbr,
    top + height,
  );
  ctx.closePath();
  ctx.clip(); // Clip border bottom cap joins

  if (borderRightWidth) {
    var brSlope = borderBottomWidth / borderRightWidth;
    ctx.moveTo(left + width / 2, brSlope * (-width / 2) + top + height);
    ctx.lineTo(left + width, top + height);
    ctx.lineTo(left, top + height);
    ctx.lineTo(left, top);
    ctx.closePath();
    ctx.clip();
  }

  if (borderLeftWidth) {
    var trSlope = -borderBottomWidth / borderLeftWidth;
    ctx.moveTo(left + width / 2, trSlope * (width / 2) + top + height);
    ctx.lineTo(left, top + height);
    ctx.lineTo(left + width, top + height);
    ctx.lineTo(left + width, top);
    ctx.closePath();
    ctx.clip();
  }
};

var fillBorderBottom = function fillBorderBottom(ctx, layout, style, rbl, rbr) {
  var top = layout.top,
    left = layout.left,
    width = layout.width,
    height = layout.height;
  var borderBottomColor = style.borderBottomColor,
    borderBottomStyle = style.borderBottomStyle,
    borderBottomWidth = style.borderBottomWidth,
    borderRightWidth = style.borderRightWidth,
    borderLeftWidth = style.borderLeftWidth;
  var c0 = rbl * (1.0 - KAPPA);
  var c1 = rbr * (1.0 - KAPPA);
  ctx.moveTo(left + width, top + height - rbr);
  ctx.bezierCurveTo(
    left + width,
    top + height - c1,
    left + width - c1,
    top + height,
    left + width - rbr,
    top + height,
  );
  ctx.lineTo(left + rbl, top + height);
  ctx.bezierCurveTo(
    left + c0,
    top + height,
    left,
    top + height - c0,
    left,
    top + height - rbl,
  );
  ctx.strokeColor(borderBottomColor);
  ctx.lineWidth(
    Math.max(borderBottomWidth, borderRightWidth, borderLeftWidth) * 2,
  );

  if (borderBottomStyle === 'dashed') {
    ctx.dash(borderBottomWidth * 2, {
      space: borderBottomWidth * 1.2,
    });
  } else if (borderBottomStyle === 'dotted') {
    ctx.dash(borderBottomWidth, {
      space: borderBottomWidth * 1.2,
    });
  }

  ctx.stroke();
  ctx.undash();
};

var clipBorderLeft = function clipBorderLeft(ctx, layout, style, rbl, rtl) {
  var top = layout.top,
    left = layout.left,
    width = layout.width,
    height = layout.height;
  var borderTopWidth = style.borderTopWidth,
    borderLeftWidth = style.borderLeftWidth,
    borderBottomWidth = style.borderBottomWidth; // Clip outer left border edge

  ctx.moveTo(left, top + height - rbl);
  ctx.lineTo(left, top + rtl); // Ellipse coefficients outer top left cap

  var c0 = rtl * (1.0 - KAPPA); // Clip outer top left cap

  ctx.bezierCurveTo(left, top + c0, left + c0, top, left + rtl, top); // Move right in case the margin exceedes the radius

  var topLeftCoordX = left + Math.max(borderLeftWidth, rtl);
  ctx.lineTo(topLeftCoordX, top); // Clip inner top left cap

  ctx.lineTo(topLeftCoordX, top + borderTopWidth); // Ellipse coefficients inner top left cap

  var innerTopLeftRadiusX = Math.max(rtl - borderLeftWidth, 0);
  var innerTopLeftRadiusY = Math.max(rtl - borderTopWidth, 0);
  var c1 = innerTopLeftRadiusX * (1.0 - KAPPA);
  var c2 = innerTopLeftRadiusY * (1.0 - KAPPA); // Clip inner top right cap

  ctx.bezierCurveTo(
    left + borderLeftWidth + c1,
    top + borderTopWidth,
    left + borderLeftWidth,
    top + borderTopWidth + c2,
    left + borderLeftWidth,
    top + Math.max(rtl, borderTopWidth),
  ); // Clip inner left border edge

  ctx.lineTo(
    left + borderLeftWidth,
    top + height - Math.max(rbl, borderBottomWidth),
  ); // Ellipse coefficients inner bottom left cap

  var innerBottomLeftRadiusX = Math.max(rbl - borderLeftWidth, 0);
  var innerBottomLeftRadiusY = Math.max(rbl - borderBottomWidth, 0);
  var c3 = innerBottomLeftRadiusX * (1.0 - KAPPA);
  var c4 = innerBottomLeftRadiusY * (1.0 - KAPPA);
  var bottomLeftXCoord = left + Math.max(rbl, borderLeftWidth); // Clip inner top left cap

  ctx.bezierCurveTo(
    left + borderLeftWidth,
    top + height - borderBottomWidth - c4,
    left + borderLeftWidth + c3,
    top + height - borderBottomWidth,
    bottomLeftXCoord,
    top + height - borderBottomWidth,
  );
  ctx.lineTo(bottomLeftXCoord, top + height); // Move left in case the margin exceedes the radius

  ctx.lineTo(left + rbl, top + height); // Ellipse coefficients outer top right cap

  var c5 = rbl * (1.0 - KAPPA); // Clip outer top right cap

  ctx.bezierCurveTo(
    left + c5,
    top + height,
    left,
    top + height - c5,
    left,
    top + height - rbl,
  );
  ctx.closePath();
  ctx.clip(); // Clip border right cap joins

  if (borderBottomWidth) {
    var trSlope = -borderBottomWidth / borderLeftWidth;
    ctx.moveTo(left + width / 2, trSlope * (width / 2) + top + height);
    ctx.lineTo(left, top + height);
    ctx.lineTo(left, top);
    ctx.lineTo(left + width, top);
    ctx.closePath();
    ctx.clip();
  }

  if (borderBottomWidth) {
    var _trSlope2 = -borderTopWidth / borderLeftWidth;

    ctx.moveTo(left + width / 2, _trSlope2 * (-width / 2) + top);
    ctx.lineTo(left, top);
    ctx.lineTo(left, top + height);
    ctx.lineTo(left + width, top + height);
    ctx.closePath();
    ctx.clip();
  }
};

var fillBorderLeft = function fillBorderLeft(ctx, layout, style, rbl, rtl) {
  var top = layout.top,
    left = layout.left,
    height = layout.height;
  var borderLeftColor = style.borderLeftColor,
    borderLeftStyle = style.borderLeftStyle,
    borderLeftWidth = style.borderLeftWidth,
    borderTopWidth = style.borderTopWidth,
    borderBottomWidth = style.borderBottomWidth;
  var c0 = rbl * (1.0 - KAPPA);
  var c1 = rtl * (1.0 - KAPPA);
  ctx.moveTo(left + rbl, top + height);
  ctx.bezierCurveTo(
    left + c0,
    top + height,
    left,
    top + height - c0,
    left,
    top + height - rbl,
  );
  ctx.lineTo(left, top + rtl);
  ctx.bezierCurveTo(left, top + c1, left + c1, top, left + rtl, top);
  ctx.strokeColor(borderLeftColor);
  ctx.lineWidth(
    Math.max(borderLeftWidth, borderTopWidth, borderBottomWidth) * 2,
  );

  if (borderLeftStyle === 'dashed') {
    ctx.dash(borderLeftWidth * 2, {
      space: borderLeftWidth * 1.2,
    });
  } else if (borderLeftStyle === 'dotted') {
    ctx.dash(borderLeftWidth, {
      space: borderLeftWidth * 1.2,
    });
  }

  ctx.stroke();
  ctx.undash();
};

var shouldRenderBorders = function shouldRenderBorders(node) {
  return (
    node.box &&
    (node.box.borderTopWidth ||
      node.box.borderRightWidth ||
      node.box.borderBottomWidth ||
      node.box.borderLeftWidth)
  );
};

var renderBorders = function renderBorders(ctx, node) {
  if (!shouldRenderBorders(node)) return;
  var _node$box = node.box,
    width = _node$box.width,
    height = _node$box.height,
    borderTopWidth = _node$box.borderTopWidth,
    borderLeftWidth = _node$box.borderLeftWidth,
    borderRightWidth = _node$box.borderRightWidth,
    borderBottomWidth = _node$box.borderBottomWidth;
  var _node$style = node.style,
    opacity = _node$style.opacity,
    _node$style$borderTop = _node$style.borderTopLeftRadius,
    borderTopLeftRadius =
      _node$style$borderTop === void 0 ? 0 : _node$style$borderTop,
    _node$style$borderTop2 = _node$style.borderTopRightRadius,
    borderTopRightRadius =
      _node$style$borderTop2 === void 0 ? 0 : _node$style$borderTop2,
    _node$style$borderBot = _node$style.borderBottomLeftRadius,
    borderBottomLeftRadius =
      _node$style$borderBot === void 0 ? 0 : _node$style$borderBot,
    _node$style$borderBot2 = _node$style.borderBottomRightRadius,
    borderBottomRightRadius =
      _node$style$borderBot2 === void 0 ? 0 : _node$style$borderBot2,
    _node$style$borderTop3 = _node$style.borderTopColor,
    borderTopColor =
      _node$style$borderTop3 === void 0 ? 'black' : _node$style$borderTop3,
    _node$style$borderTop4 = _node$style.borderTopStyle,
    borderTopStyle =
      _node$style$borderTop4 === void 0 ? 'solid' : _node$style$borderTop4,
    _node$style$borderLef = _node$style.borderLeftColor,
    borderLeftColor =
      _node$style$borderLef === void 0 ? 'black' : _node$style$borderLef,
    _node$style$borderLef2 = _node$style.borderLeftStyle,
    borderLeftStyle =
      _node$style$borderLef2 === void 0 ? 'solid' : _node$style$borderLef2,
    _node$style$borderRig = _node$style.borderRightColor,
    borderRightColor =
      _node$style$borderRig === void 0 ? 'black' : _node$style$borderRig,
    _node$style$borderRig2 = _node$style.borderRightStyle,
    borderRightStyle =
      _node$style$borderRig2 === void 0 ? 'solid' : _node$style$borderRig2,
    _node$style$borderBot3 = _node$style.borderBottomColor,
    borderBottomColor =
      _node$style$borderBot3 === void 0 ? 'black' : _node$style$borderBot3,
    _node$style$borderBot4 = _node$style.borderBottomStyle,
    borderBottomStyle =
      _node$style$borderBot4 === void 0 ? 'solid' : _node$style$borderBot4;
  var style = {
    borderTopColor: borderTopColor,
    borderTopWidth: borderTopWidth,
    borderTopStyle: borderTopStyle,
    borderLeftColor: borderLeftColor,
    borderLeftWidth: borderLeftWidth,
    borderLeftStyle: borderLeftStyle,
    borderRightColor: borderRightColor,
    borderRightWidth: borderRightWidth,
    borderRightStyle: borderRightStyle,
    borderBottomColor: borderBottomColor,
    borderBottomWidth: borderBottomWidth,
    borderBottomStyle: borderBottomStyle,
    borderTopLeftRadius: borderTopLeftRadius,
    borderTopRightRadius: borderTopRightRadius,
    borderBottomLeftRadius: borderBottomLeftRadius,
    borderBottomRightRadius: borderBottomRightRadius,
  };
  var rtr = Math.min(borderTopRightRadius, 0.5 * width, 0.5 * height);
  var rtl = Math.min(borderTopLeftRadius, 0.5 * width, 0.5 * height);
  var rbr = Math.min(borderBottomRightRadius, 0.5 * width, 0.5 * height);
  var rbl = Math.min(borderBottomLeftRadius, 0.5 * width, 0.5 * height);
  ctx.save();
  ctx.strokeOpacity(opacity);

  if (borderTopWidth) {
    ctx.save();
    clipBorderTop(ctx, node.box, style, rtr, rtl);
    fillBorderTop(ctx, node.box, style, rtr, rtl);
    ctx.restore();
  }

  if (borderRightWidth) {
    ctx.save();
    clipBorderRight(ctx, node.box, style, rtr, rbr);
    fillBorderRight(ctx, node.box, style, rtr, rbr);
    ctx.restore();
  }

  if (borderBottomWidth) {
    ctx.save();
    clipBorderBottom(ctx, node.box, style, rbl, rbr);
    fillBorderBottom(ctx, node.box, style, rbl, rbr);
    ctx.restore();
  }

  if (borderLeftWidth) {
    ctx.save();
    clipBorderLeft(ctx, node.box, style, rbl, rtl);
    fillBorderLeft(ctx, node.box, style, rbl, rtl);
    ctx.restore();
  }

  ctx.restore();
};

var drawBackground = function drawBackground(ctx, node) {
  var _node$style;

  var _node$box = node.box,
    top = _node$box.top,
    left = _node$box.left,
    width = _node$box.width,
    height = _node$box.height;
  var color = parseColor(node.style.backgroundColor);
  var nodeOpacity = fns.isNil(
    (_node$style = node.style) === null || _node$style === void 0
      ? void 0
      : _node$style.opacity,
  )
    ? 1
    : node.style.opacity;
  var opacity = Math.min(color.opacity, nodeOpacity);
  ctx
    .fillOpacity(opacity)
    .fillColor(color.value)
    .rect(left, top, width, height)
    .fill();
};

var renderBackground = function renderBackground(ctx, node) {
  var _node$style2;

  var hasBackground =
    !!node.box &&
    !!(
      (_node$style2 = node.style) !== null &&
      _node$style2 !== void 0 &&
      _node$style2.backgroundColor
    );

  if (hasBackground) {
    ctx.save();
    clipNode(ctx, node);
    drawBackground(ctx, node);
    ctx.restore();
  }
};

var isSrcId = function isSrcId(value) {
  return /^#.+/.test(value);
};

var setLink = function setLink(ctx, node) {
  var props = node.props || {};
  var _node$box = node.box,
    top = _node$box.top,
    left = _node$box.left,
    width = _node$box.width,
    height = _node$box.height;
  var src = props.src || props.href;

  if (src) {
    var isId = isSrcId(src);
    var method = isId ? 'goTo' : 'link';
    var value = isId ? src.slice(1) : src;
    ctx[method](left, top, width, height, value);
  }
};

var setDestination = function setDestination(ctx, node) {
  var _node$props;

  if (
    (_node$props = node.props) !== null &&
    _node$props !== void 0 &&
    _node$props.id
  ) {
    ctx.addNamedDestination(node.props.id, 'XYZ', null, node.box.top, null);
  }
};

var _renderFns;

var isRecursiveNode = function isRecursiveNode(node) {
  return node.type !== P__namespace.Text && node.type !== P__namespace.Svg;
};

var renderChildren = function renderChildren(ctx, node, options) {
  ctx.save();

  if (node.box) {
    ctx.translate(node.box.left, node.box.top);
  }

  var children = node.children || [];

  var renderChild = function renderChild(child) {
    return renderNode(ctx, child, options);
  };

  children.forEach(renderChild);
  ctx.restore();
};

var renderFns =
  ((_renderFns = {}),
  (_renderFns[P__namespace.Text] = renderText),
  (_renderFns[P__namespace.Note] = renderNote),
  (_renderFns[P__namespace.Image] = renderImage),
  (_renderFns[P__namespace.Canvas] = renderCanvas),
  (_renderFns[P__namespace.Svg] = renderSvg),
  (_renderFns[P__namespace.Link] = setLink),
  _renderFns);

var renderNode = function renderNode(ctx, node, options) {
  var _node$style;

  var overflowHidden =
    ((_node$style = node.style) === null || _node$style === void 0
      ? void 0
      : _node$style.overflow) === 'hidden';
  var shouldRenderChildren = isRecursiveNode(node);
  if (node.type === P__namespace.Page) renderPage(ctx, node);
  ctx.save();
  if (overflowHidden) clipNode(ctx, node);
  applyTransformations(ctx, node);
  renderBackground(ctx, node);
  renderBorders(ctx, node);
  var renderFn = renderFns[node.type];
  if (renderFn) renderFn(ctx, node, options);
  if (shouldRenderChildren) renderChildren(ctx, node, options);
  setDestination(ctx, node);
  renderDebug(ctx, node);
  ctx.restore();
};

/* eslint-disable no-param-reassign */
var setPDFMetadata = function setPDFMetadata(target) {
  return function(key, value) {
    if (value) target.info[key] = value;
  };
};
/**
 * Set document instance metadata
 *
 * @param {Object} ctx document instance
 * @param {Object} doc document root
 */

var addMetadata = function addMetadata(ctx, doc) {
  var setProp = setPDFMetadata(ctx);
  var props = doc.props || {};
  var title = props.title || null;
  var author = props.author || null;
  var subject = props.subject || null;
  var keywords = props.keywords || null;
  var creator = props.creator || 'react-pdf';
  var producer = props.producer || 'react-pdf';
  setProp('Title', title);
  setProp('Author', author);
  setProp('Subject', subject);
  setProp('Keywords', keywords);
  setProp('Creator', creator);
  setProp('Producer', producer);
};

/* eslint-disable no-param-reassign */
var addNodeBookmark = function addNodeBookmark(
  ctx,
  node,
  pageNumber,
  registry,
) {
  var _node$props;

  var bookmark =
    (_node$props = node.props) === null || _node$props === void 0
      ? void 0
      : _node$props.bookmark;

  if (bookmark) {
    var title = bookmark.title,
      parent = bookmark.parent,
      expanded = bookmark.expanded,
      zoom = bookmark.zoom,
      fit = bookmark.fit;
    var outline = registry[parent] || ctx.outline;
    var top = bookmark.top || node.box.top;
    var left = bookmark.left || node.box.left;
    var instance = outline.addItem(title, {
      pageNumber: pageNumber,
      expanded: expanded,
      top: top,
      left: left,
      zoom: zoom,
      fit: fit,
    });
    registry[bookmark.ref] = instance;
  }

  if (!node.children) return;
  node.children.forEach(function(child) {
    return addNodeBookmark(ctx, child, pageNumber, registry);
  });
};

var addBookmarks = function addBookmarks(ctx, root) {
  var registry = {};
  var pages = root.children || [];
  pages.forEach(function(page, i) {
    addNodeBookmark(ctx, page, i, registry);
  });
};

var render = function render(ctx, doc) {
  var pages = doc.children || [];
  var options = {
    imageCache: new Map(),
  };
  addMetadata(ctx, doc);
  pages.forEach(function(page) {
    return renderNode(ctx, page, options);
  });
  addBookmarks(ctx, doc);
  ctx.end();
  return ctx;
};

exports['default'] = render;
