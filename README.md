# Potoposter Functions ローカルエミュレーター

Cloud Functions Gen 2 の HTTP エンドポイントをローカルで確認するために、Functions Framework を使ったエミュレーター環境を用意しています。

## 準備
1. Node.js 22.x が動作すること（`package.json` の `engines.node` を参照）。
2. 依存関係をインストールする: `npm ci`。
3. TypeScript をコンパイルする: `npm run build`。

## エミュレーターの起動
- `npm run dev` で TypeScript をビルドしたうえで Functions Framework を起動します。
- `npm run emulator` は直近のビルド済みバンドル (`lib/index.js`) を使って HTTP サーバーを立ち上げるため、ビルド済みの状態で素早く再起動できます。
- デフォルトのポートは 8080 ですが、`PORT` 環境変数で変更できます（例: `PORT=5000 npm run emulator`）。

## 動作確認
起動後、`curl http://localhost:8080` などで `helloWorld` 関数のレスポンスが確認できます。Cloud Functions にデプロイする前にローカルで HTTP レスポンスやヘッダー、ステータスコードなどをチェックできます。

## ソース変更時の手順
1. 別ターミナルで `npm run build:watch` を実行すると `src/` の変更を自動的に `lib/` に反映します。
2. `npm run emulator`（または `npm run dev`）を再起動すれば最新ビルドを使ってリクエストを受け付けます。

## 補足
- Functions Framework は GCP の実行環境に近いパラメータセットを提供するため、Cloud Functions のデプロイ前のステージングとして使えます。
- `lib/index.js` を直接書き換えないようにし、すべて `src/index.ts` を編集して `npm run build` で生成してください。
# potoposter-functions
