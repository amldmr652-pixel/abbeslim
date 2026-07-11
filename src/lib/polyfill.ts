// Vercel / Node.js ortamında eksik tarayıcı API'lerini taklit et
// pdf-parse / pdf.js bu API'lere ihtiyaç duyar

if (typeof global !== 'undefined') {
  // DOMMatrix - matris işlemleri için
  if (typeof (global as any).DOMMatrix === 'undefined') {
    (global as any).DOMMatrix = class DOMMatrix {
      a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
      m11 = 1; m12 = 0; m13 = 0; m14 = 0;
      m21 = 0; m22 = 1; m23 = 0; m24 = 0;
      m31 = 0; m32 = 0; m33 = 1; m34 = 0;
      m41 = 0; m42 = 0; m43 = 0; m44 = 1;
      is2D = true; isIdentity = true;
      constructor(_init?: any) {}
      translate(_tx = 0, _ty = 0, _tz = 0) { return new (global as any).DOMMatrix(); }
      scale(_sx = 1, _sy = 1, _sz = 1) { return new (global as any).DOMMatrix(); }
      rotate(_rx = 0, _ry = 0, _rz = 0) { return new (global as any).DOMMatrix(); }
      rotateAxisAngle(_x = 0, _y = 0, _z = 0, _angle = 0) { return new (global as any).DOMMatrix(); }
      multiply(_other?: any) { return new (global as any).DOMMatrix(); }
      inverse() { return new (global as any).DOMMatrix(); }
      flipX() { return new (global as any).DOMMatrix(); }
      flipY() { return new (global as any).DOMMatrix(); }
      skewX(_sx = 0) { return new (global as any).DOMMatrix(); }
      skewY(_sy = 0) { return new (global as any).DOMMatrix(); }
      transformPoint(point?: any) { return point || { x: 0, y: 0, z: 0, w: 1 }; }
      toFloat32Array() { return new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]); }
      toFloat64Array() { return new Float64Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]); }
      toString() { return 'matrix(1, 0, 0, 1, 0, 0)'; }
      toJSON() { return { a:1,b:0,c:0,d:1,e:0,f:0 }; }
    };
  }

  // Path2D
  if (typeof (global as any).Path2D === 'undefined') {
    (global as any).Path2D = class Path2D {
      constructor(_path?: any) {}
      moveTo(_x: number, _y: number) {}
      lineTo(_x: number, _y: number) {}
      closePath() {}
      arc(_x: number, _y: number, _r: number, _start: number, _end: number, _ccw?: boolean) {}
      arcTo(_x1: number, _y1: number, _x2: number, _y2: number, _r: number) {}
      bezierCurveTo(_cp1x: number, _cp1y: number, _cp2x: number, _cp2y: number, _x: number, _y: number) {}
      quadraticCurveTo(_cpx: number, _cpy: number, _x: number, _y: number) {}
      rect(_x: number, _y: number, _w: number, _h: number) {}
      ellipse(_x: number, _y: number, _rx: number, _ry: number, _rot: number, _start: number, _end: number) {}
      addPath(_path: any, _transform?: any) {}
    };
  }

  // ImageData
  if (typeof (global as any).ImageData === 'undefined') {
    (global as any).ImageData = class ImageData {
      width: number; height: number; data: Uint8ClampedArray;
      constructor(width: number, height: number) {
        this.width = width; this.height = height;
        this.data = new Uint8ClampedArray(width * height * 4);
      }
    };
  }

  // OffscreenCanvas
  if (typeof (global as any).OffscreenCanvas === 'undefined') {
    (global as any).OffscreenCanvas = class OffscreenCanvas {
      width: number; height: number;
      constructor(width: number, height: number) { this.width = width; this.height = height; }
      getContext(_ctx: string) { return null; }
      convertToBlob() { return Promise.resolve(new Blob()); }
    };
  }

  // HTMLCanvasElement (minimal)
  if (typeof (global as any).HTMLCanvasElement === 'undefined') {
    (global as any).HTMLCanvasElement = class HTMLCanvasElement {
      width = 0; height = 0;
      getContext(_ctx: string) { return null; }
      toDataURL() { return ''; }
    };
  }

  // document (minimal - pdf.js bazen kontrol eder)
  if (typeof (global as any).document === 'undefined') {
    (global as any).document = {
      createElement: (_tag: string) => ({
        getContext: (_ctx: string) => null,
        style: {},
        width: 0,
        height: 0,
      }),
      createElementNS: (_ns: string, _tag: string) => ({}),
    };
  }

  // window (minimal)
  if (typeof (global as any).window === 'undefined') {
    (global as any).window = global;
  }
}

export {};
