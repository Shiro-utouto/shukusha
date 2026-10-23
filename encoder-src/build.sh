#!/usr/bin/env bash
# Rebuilds ../encoder.js (MozJPEG + WebP encoders compiled to WebAssembly, embedded in one worker file).
set -euo pipefail
cd "$(dirname "$0")"
npm install --no-save @jsquash/jpeg@1.5.0 @jsquash/webp@1.4.0 esbuild@0.23.1
mkdir -p build
sed 's/import\.meta\.url/self.__u/g' node_modules/@jsquash/jpeg/codec/enc/mozjpeg_enc.js > build/mozjpeg_enc.js
sed 's/import\.meta\.url/self.__u/g' node_modules/@jsquash/webp/codec/enc/webp_enc.js > build/webp_enc.js
base64 -w0 node_modules/@jsquash/jpeg/codec/enc/mozjpeg_enc.wasm > build/jpeg.b64
base64 -w0 node_modules/@jsquash/webp/codec/enc/webp_enc.wasm > build/webp.b64
cp worker.js build/entry.js
npx esbuild build/entry.js --bundle --format=iife --minify --loader:.b64=text --outfile=../encoder.js
echo "built ../encoder.js"
