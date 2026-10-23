import mozFactory from './mozjpeg_enc.js';
import webpFactory from './webp_enc.js';
import JPEG_B64 from './jpeg.b64';
import WEBP_B64 from './webp.b64';

self.__u = 'https://localhost/enc.js';

function b64bytes(s) {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function makeModule(factory, b64) {
  const wasm = await WebAssembly.compile(b64bytes(b64));
  return factory({
    noInitialRun: true,
    instantiateWasm(imports, cb) {
      const inst = new WebAssembly.Instance(wasm, imports);
      cb(inst);
      return inst.exports;
    },
  });
}

const JPEG_OPTS = {
  quality: 75, baseline: false, arithmetic: false, progressive: true,
  optimize_coding: true, smoothing: 0, color_space: 3, quant_table: 3,
  trellis_multipass: false, trellis_opt_zero: false, trellis_opt_table: false,
  trellis_loops: 1, auto_subsample: true, chroma_subsample: 2,
  separate_chroma_quality: false, chroma_quality: 75,
};
const WEBP_OPTS = {
  quality: 75, target_size: 0, target_PSNR: 0, method: 4, sns_strength: 50,
  filter_strength: 60, filter_sharpness: 0, filter_type: 1, partitions: 0,
  segments: 4, pass: 1, show_compressed: 0, preprocessing: 0, autofilter: 0,
  partition_limit: 0, alpha_compression: 1, alpha_filtering: 1, alpha_quality: 100,
  lossless: 0, exact: 0, image_hint: 0, emulate_jpeg_size: 0, thread_level: 0,
  low_memory: 0, near_lossless: 100, use_delta_palette: 0, use_sharp_yuv: 0,
};

let jpegMod = null, webpMod = null;
const images = new Map();

async function init() {
  const res = { jpeg: false, webp: false, error: '' };
  try { jpegMod = await makeModule(mozFactory, JPEG_B64); res.jpeg = true; }
  catch (e) { res.error = String(e && e.message || e); }
  try { webpMod = await makeModule(webpFactory, WEBP_B64); res.webp = true; }
  catch (e) { res.error = res.error || String(e && e.message || e); }
  return res;
}

function encode(img, fmt, q, sub444) {
  if (fmt === 'webp') {
    const opts = { ...WEBP_OPTS, quality: q, use_sharp_yuv: q >= 85 ? 1 : 0 };
    const r = webpMod.encode(img.data, img.width, img.height, opts);
    if (!r) throw new Error('WebP encode failed');
    return r.slice().buffer;
  }
  const opts = { ...JPEG_OPTS, quality: q };
  if (sub444) { opts.auto_subsample = false; opts.chroma_subsample = 1; }
  const r = jpegMod.encode(img.data, img.width, img.height, opts);
  return r.slice().buffer;
}

self.onmessage = async (ev) => {
  const m = ev.data;
  try {
    let out = null, transfer = [];
    if (m.cmd === 'init') out = await init();
    else if (m.cmd === 'set') {
      images.set(m.key, { data: new Uint8ClampedArray(m.buf), width: m.w, height: m.h });
      out = true;
    } else if (m.cmd === 'drop') {
      for (const k of [...images.keys()]) if (k.startsWith(m.key)) images.delete(k);
      out = true;
    } else if (m.cmd === 'encode') {
      const img = images.get(m.key);
      if (!img) throw new Error('missing image ' + m.key);
      const buf = encode(img, m.fmt, m.q, m.sub444);
      out = buf; transfer = [buf];
    }
    self.postMessage({ id: m.id, ok: true, out }, transfer);
  } catch (e) {
    self.postMessage({ id: m.id, ok: false, error: String(e && e.message || e) });
  }
};
