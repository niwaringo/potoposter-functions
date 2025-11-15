FROM node:22

# ---- root で作業（パッケージ導入）----
USER root

# よく使うツール（gitなど）を追加
RUN apt-get update && apt-get install -y --no-install-recommends \
    git ca-certificates bash curl \
 && rm -rf /var/lib/apt/lists/*

# Google Cloud SDK の APT リポジトリを追加（署名鍵を keyring へ）
RUN curl -fsSL https://packages.cloud.google.com/apt/doc/apt-key.gpg \
  | gpg --dearmor -o /usr/share/keyrings/cloud.google.gpg \
 && echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" \
  > /etc/apt/sources.list.d/google-cloud-sdk.list

# gcloud CLI 本体をインストール
# （gsutil/ bq など主要ツールは同梱されています）
RUN apt-get update && apt-get install -y --no-install-recommends \
    google-cloud-cli \
 && rm -rf /var/lib/apt/lists/*

# nodeユーザーで作業（公式Nodeイメージに存在）
USER node
WORKDIR /workspaces
