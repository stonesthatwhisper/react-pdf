'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var fs = require('fs');
var zlib = require('zlib');

function _interopDefaultLegacy(e) {
  return e && typeof e === 'object' && 'default' in e ? e : { default: e };
}

var fs__default = /*#__PURE__*/ _interopDefaultLegacy(fs);
var zlib__default = /*#__PURE__*/ _interopDefaultLegacy(zlib);

var PNG = /*#__PURE__*/ (function() {
  PNG.decode = function decode(path, fn) {
    {
      return fs__default['default'].readFile(path, function(err, file) {
        var png = new PNG(file);
        return png.decode(function(pixels) {
          return fn(pixels);
        });
      });
    }
  };

  PNG.load = function load(path) {
    {
      var file = fs__default['default'].readFileSync(path);
      return new PNG(file);
    }
  };

  function PNG(data) {
    var i;
    this.data = data;
    this.pos = 8; // Skip the default header

    this.palette = [];
    this.imgData = [];
    this.transparency = {};
    this.text = {};

    while (true) {
      var chunkSize = this.readUInt32();
      var section = '';

      for (i = 0; i < 4; i++) {
        section += String.fromCharCode(this.data[this.pos++]);
      }

      switch (section) {
        case 'IHDR':
          // we can grab  interesting values from here (like width, height, etc)
          this.width = this.readUInt32();
          this.height = this.readUInt32();
          this.bits = this.data[this.pos++];
          this.colorType = this.data[this.pos++];
          this.compressionMethod = this.data[this.pos++];
          this.filterMethod = this.data[this.pos++];
          this.interlaceMethod = this.data[this.pos++];
          break;

        case 'PLTE':
          this.palette = this.read(chunkSize);
          break;

        case 'IDAT':
          for (i = 0; i < chunkSize; i++) {
            this.imgData.push(this.data[this.pos++]);
          }

          break;

        case 'tRNS':
          // This chunk can only occur once and it must occur after the
          // PLTE chunk and before the IDAT chunk.
          this.transparency = {};

          switch (this.colorType) {
            case 3:
              // Indexed color, RGB. Each byte in this chunk is an alpha for
              // the palette index in the PLTE ("palette") chunk up until the
              // last non-opaque entry. Set up an array, stretching over all
              // palette entries which will be 0 (opaque) or 1 (transparent).
              this.transparency.indexed = this.read(chunkSize);
              var short = 255 - this.transparency.indexed.length;

              if (short > 0) {
                for (i = 0; i < short; i++) {
                  this.transparency.indexed.push(255);
                }
              }

              break;

            case 0:
              // Greyscale. Corresponding to entries in the PLTE chunk.
              // Grey is two bytes, range 0 .. (2 ^ bit-depth) - 1
              this.transparency.grayscale = this.read(chunkSize)[0];
              break;

            case 2:
              // True color with proper alpha channel.
              this.transparency.rgb = this.read(chunkSize);
              break;
          }

          break;

        case 'tEXt':
          var text = this.read(chunkSize);
          var index = text.indexOf(0);
          var key = String.fromCharCode.apply(String, text.slice(0, index));
          this.text[key] = String.fromCharCode.apply(
            String,
            text.slice(index + 1),
          );
          break;

        case 'IEND':
          // we've got everything we need!
          switch (this.colorType) {
            case 0:
            case 3:
            case 4:
              this.colors = 1;
              break;

            case 2:
            case 6:
              this.colors = 3;
              break;
          }

          this.hasAlphaChannel = [4, 6].includes(this.colorType);
          var colors = this.colors + (this.hasAlphaChannel ? 1 : 0);
          this.pixelBitlength = this.bits * colors;

          switch (this.colors) {
            case 1:
              this.colorSpace = 'DeviceGray';
              break;

            case 3:
              this.colorSpace = 'DeviceRGB';
              break;
          }

          this.imgData = Buffer.from(this.imgData);
          return;

        default:
          // unknown (or unimportant) section, skip it
          this.pos += chunkSize;
      }

      this.pos += 4; // Skip the CRC

      if (this.pos > this.data.length) {
        throw new Error('Incomplete or corrupt PNG file');
      }
    }
  }

  var _proto = PNG.prototype;

  _proto.read = function read(bytes) {
    var result = new Array(bytes);

    for (var i = 0; i < bytes; i++) {
      result[i] = this.data[this.pos++];
    }

    return result;
  };

  _proto.readUInt32 = function readUInt32() {
    var b1 = this.data[this.pos++] << 24;
    var b2 = this.data[this.pos++] << 16;
    var b3 = this.data[this.pos++] << 8;
    var b4 = this.data[this.pos++];
    return b1 | b2 | b3 | b4;
  };

  _proto.readUInt16 = function readUInt16() {
    var b1 = this.data[this.pos++] << 8;
    var b2 = this.data[this.pos++];
    return b1 | b2;
  };

  _proto.decodePixels = function decodePixels(fn) {
    var _this = this;

    return zlib__default['default'].inflate(this.imgData, function(err, data) {
      if (err) throw err;
      var pos = 0;
      var width = _this.width,
        height = _this.height;
      var pixelBytes = _this.pixelBitlength / 8;
      var pixels = Buffer.alloc(width * height * pixelBytes);

      function pass(x0, y0, dx, dy, singlePass) {
        if (singlePass === void 0) {
          singlePass = false;
        }

        var w = Math.ceil((width - x0) / dx);
        var h = Math.ceil((height - y0) / dy);
        var scanlineLength = pixelBytes * w;
        var buffer = singlePass ? pixels : Buffer.alloc(scanlineLength * h);
        var row = 0;
        var c = 0;

        while (row < h && pos < data.length) {
          var byte;
          var col;
          var i;
          var left;
          var upper;

          switch (data[pos++]) {
            case 0:
              // None
              for (i = 0; i < scanlineLength; i++) {
                buffer[c++] = data[pos++];
              }

              break;

            case 1:
              // Sub
              for (i = 0; i < scanlineLength; i++) {
                byte = data[pos++];
                left = i < pixelBytes ? 0 : buffer[c - pixelBytes];
                buffer[c++] = (byte + left) % 256;
              }

              break;

            case 2:
              // Up
              for (i = 0; i < scanlineLength; i++) {
                byte = data[pos++];
                col = (i - (i % pixelBytes)) / pixelBytes;
                upper =
                  row &&
                  buffer[
                    (row - 1) * scanlineLength +
                      col * pixelBytes +
                      (i % pixelBytes)
                  ];
                buffer[c++] = (upper + byte) % 256;
              }

              break;

            case 3:
              // Average
              for (i = 0; i < scanlineLength; i++) {
                byte = data[pos++];
                col = (i - (i % pixelBytes)) / pixelBytes;
                left = i < pixelBytes ? 0 : buffer[c - pixelBytes];
                upper =
                  row &&
                  buffer[
                    (row - 1) * scanlineLength +
                      col * pixelBytes +
                      (i % pixelBytes)
                  ];
                buffer[c++] = (byte + Math.floor((left + upper) / 2)) % 256;
              }

              break;

            case 4:
              // Paeth
              for (i = 0; i < scanlineLength; i++) {
                var paeth;
                var upperLeft;
                byte = data[pos++];
                col = (i - (i % pixelBytes)) / pixelBytes;
                left = i < pixelBytes ? 0 : buffer[c - pixelBytes];

                if (row === 0) {
                  upper = upperLeft = 0;
                } else {
                  upper =
                    buffer[
                      (row - 1) * scanlineLength +
                        col * pixelBytes +
                        (i % pixelBytes)
                    ];
                  upperLeft =
                    col &&
                    buffer[
                      (row - 1) * scanlineLength +
                        (col - 1) * pixelBytes +
                        (i % pixelBytes)
                    ];
                }

                var p = left + upper - upperLeft;
                var pa = Math.abs(p - left);
                var pb = Math.abs(p - upper);
                var pc = Math.abs(p - upperLeft);

                if (pa <= pb && pa <= pc) {
                  paeth = left;
                } else if (pb <= pc) {
                  paeth = upper;
                } else {
                  paeth = upperLeft;
                }

                buffer[c++] = (byte + paeth) % 256;
              }

              break;

            default:
              throw new Error('Invalid filter algorithm: ' + data[pos - 1]);
          }

          if (!singlePass) {
            var pixelsPos = ((y0 + row * dy) * width + x0) * pixelBytes;
            var bufferPos = row * scanlineLength;

            for (i = 0; i < w; i++) {
              for (var j = 0; j < pixelBytes; j++) {
                pixels[pixelsPos++] = buffer[bufferPos++];
              }

              pixelsPos += (dx - 1) * pixelBytes;
            }
          }

          row++;
        }
      }

      if (_this.interlaceMethod === 1) {
        /*
          1 6 4 6 2 6 4 6
          7 7 7 7 7 7 7 7
          5 6 5 6 5 6 5 6
          7 7 7 7 7 7 7 7
          3 6 4 6 3 6 4 6
          7 7 7 7 7 7 7 7
          5 6 5 6 5 6 5 6
          7 7 7 7 7 7 7 7
        */
        pass(0, 0, 8, 8); // 1

        pass(4, 0, 8, 8); // 2

        pass(0, 4, 4, 8); // 3

        pass(2, 0, 4, 4); // 4

        pass(0, 2, 2, 4); // 5

        pass(1, 0, 2, 2); // 6

        pass(0, 1, 1, 2); // 7
      } else {
        pass(0, 0, 1, 1, true);
      }

      return fn(pixels);
    });
  };

  _proto.decodePalette = function decodePalette() {
    var palette = this.palette;
    var length = palette.length;
    var transparency = this.transparency.indexed || [];
    var ret = Buffer.alloc(transparency.length + length);
    var pos = 0;
    var c = 0;

    for (var i = 0; i < length; i += 3) {
      var left;
      ret[pos++] = palette[i];
      ret[pos++] = palette[i + 1];
      ret[pos++] = palette[i + 2];
      ret[pos++] = (left = transparency[c++]) != null ? left : 255;
    }

    return ret;
  };

  _proto.copyToImageData = function copyToImageData(imageData, pixels) {
    var j;
    var k;
    var colors = this.colors;
    var palette = null;
    var alpha = this.hasAlphaChannel;

    if (this.palette.length) {
      palette =
        this._decodedPalette || (this._decodedPalette = this.decodePalette());
      colors = 4;
      alpha = true;
    }

    var data = imageData.data || imageData;
    var length = data.length;
    var input = palette || pixels;
    var i = (j = 0);

    if (colors === 1) {
      while (i < length) {
        k = palette ? pixels[i / 4] * 4 : j;
        var v = input[k++];
        data[i++] = v;
        data[i++] = v;
        data[i++] = v;
        data[i++] = alpha ? input[k++] : 255;
        j = k;
      }
    } else {
      while (i < length) {
        k = palette ? pixels[i / 4] * 4 : j;
        data[i++] = input[k++];
        data[i++] = input[k++];
        data[i++] = input[k++];
        data[i++] = alpha ? input[k++] : 255;
        j = k;
      }
    }
  };

  _proto.decode = function decode(fn) {
    var _this2 = this;

    var ret = Buffer.alloc(this.width * this.height * 4);
    return this.decodePixels(function(pixels) {
      _this2.copyToImageData(ret, pixels);

      return fn(ret);
    });
  };

  return PNG;
})();

exports['default'] = PNG;
