import { Storage } from "@google-cloud/storage";

// 複数回の呼び出しでクライアントを共有して接続を再利用する。
const storage = new Storage();

// potoposter向けアップロードを保存しているバケットとプレフィックス。
const POTOPPOSTER_BUCKET = "potoposter";
const UPLOAD_PREFIX = "uploads/";

export interface UploadObject {
  publicUrl: string;
  objectName: string;
}

export async function listUploads(): Promise<UploadObject | null> {
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

  // storage.googleapis.com向けの公開URLとFile識別子を返す。
  return {
    publicUrl: oldest.publicUrl(),
    objectName: oldest.name,
  };
}

export async function deleteUpload(objectName: string): Promise<void> {
  if (!objectName) {
    throw new Error("objectName is required to delete an upload");
  }

  if (objectName === UPLOAD_PREFIX) {
    throw new Error("Refusing to delete the uploads prefix itself");
  }

  if (!objectName.startsWith(UPLOAD_PREFIX)) {
    throw new Error(
      "Object outside uploads prefix cannot be deleted via deleteUpload",
    );
  }

  const bucket = storage.bucket(POTOPPOSTER_BUCKET);
  const file = bucket.file(objectName);

  await file.delete();
}
