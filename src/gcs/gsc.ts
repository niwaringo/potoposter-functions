import { Storage } from "@google-cloud/storage";

// 複数回の呼び出しでクライアントを共有して接続を再利用する。
const storage = new Storage();

// potoposter向けアップロードを保存しているバケットとプレフィックス。
const POTOPPOSTER_BUCKET = "potoposter";
const UPLOAD_PREFIX = "uploads/";

export async function listUploads(): Promise<string | null> {
  const bucket = storage.bucket(POTOPPOSTER_BUCKET);
  const [files] = await bucket.getFiles({
    prefix: UPLOAD_PREFIX,
    autoPaginate: true,
  });

  // GCSのobjects.listは名前の昇順で返すため、最初の要素が最古のオブジェクトになる。
  const oldest = files.find((file) => file.name !== UPLOAD_PREFIX);

  if (!oldest) {
    return null;
  }

  // storage.googleapis.com向けの公開URLを返す。
  return oldest.publicUrl();
}
