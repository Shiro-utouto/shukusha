# 縮写

画素数を変えずに、見た目そのままで写真を軽くするWebアプリ。写真はすべて端末の中で処理され、どこにも送られません。

## 使い方（iPhone）

1. Safariでこのページを開く
2. 共有ボタン →「ホーム画面に追加」
3. ホーム画面の「縮写」から起動（一度開けばオフラインでも使えます）

## できること

- **おまかせ圧縮**：写真の細部を実際に圧縮して見比べ、「見た目そのまま／バランス／軽さ優先」の条件を満たすいちばん軽い画質を自動で探す
- **画質指定・容量指定**（例：1MB以下）。どのモードでも画素数は変えない
- MozJPEG（WebAssembly）による高圧縮。WebPにも対応
- iPhoneのHDR写真の明るさ情報（ゲインマップ）と広色域（Display P3）を保持
- 位置情報は常に削除、撮影日時と機種は残せる
- 元の写真との左右比較、最大1600%拡大
- 複数枚の一括処理、共有シートからまとめて保存、ZIP保存

## ファイル

- `index.html` — アプリ本体
- `encoder.js` — 圧縮エンジン（Web Worker、WebAssemblyを内蔵）
- `sw.js` — オフライン対応。`index.html` か `encoder.js` を変えたら `VERSION` を上げる
- `encoder-src/` — `encoder.js` のソースとビルドスクリプト（`./encoder-src/build.sh`）

圧縮エンジンは [jSquash](https://github.com/jamsinclair/jSquash)（Apache-2.0）の MozJPEG / libwebp ビルドを使っています。
