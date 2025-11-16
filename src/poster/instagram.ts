const IG_USER_ID = "32382991081314375";
const IG_TOKEN =
  "IGAAMDu5drPtNBZAFRxbjgyemYyZAVJINkYxRENoSTU2eTN4YXNONndyS3p4REl0X3NKY3pVSkZAGODVTQ01URlE4TXBDbEIyQXdiTm1TSTBVVGoycHE5Q0ZAXVzhQVTNuYm9GdldsREJ1VEEtYndSN3Exd2NWby14Y0JPeVh6TURkcwZDZD";

const GRAPH_API_VERSION = "v24.0";
const GRAPH_BASE_URL = `https://graph.instagram.com/${GRAPH_API_VERSION}`;
const INITIAL_STATUS_DELAY_MS = 5_000;
const POLLING_DELAY_MS = 10_000;
const POLLING_MAX_ATTEMPTS = 6;

interface IgImagePostIdleState {
  status: "idle";
}

interface IgImagePostSuccessState {
  status: "success";
  postId: string;
  message: string;
}

interface IgImagePostErrorState {
  status: "error";
  message: string;
}

export type IgImagePostState =
  | IgImagePostIdleState
  | IgImagePostSuccessState
  | IgImagePostErrorState;

interface GraphErrorResponse {
  error?: {
    message?: string;
    code?: number;
    type?: string;
  };
}

interface ResponseLike {
  status: number;
  statusText: string;
}

function hasGraphError(payload: unknown): payload is GraphErrorResponse {
  return (
    !!payload &&
    typeof payload === "object" &&
    "error" in payload &&
    typeof (payload as { error?: unknown }).error === "object"
  );
}

interface MediaCreationResponse {
  id: string;
}

interface MediaStatusResponse {
  status?: "IN_PROGRESS" | "FINISHED" | "ERROR" | "PENDING";
  status_code?: string;
  id?: string;
}

interface MediaPublishResponse {
  id: string;
}

// Instagram Graph APIのエラーメッセージを統一して返すヘルパー。
function formatGraphError(
  res: ResponseLike,
  payload: GraphErrorResponse | unknown,
): string {
  if (hasGraphError(payload)) {
    return `Instagram Graph API error (${res.status}): ${payload.error?.message ?? "unknown"}`;
  }

  return `Instagram Graph API error (${res.status}): ${res.statusText}`;
}

// 各エンドポイントに共通のfetch処理。JSONレスポンスの検証もここで実施。
async function requestGraph<T>(
  endpoint: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${GRAPH_BASE_URL}/${endpoint}`, init);
  const data = (await res.json().catch(() => undefined)) as
    | T
    | GraphErrorResponse;

  if (!res.ok) {
    throw new Error(formatGraphError(res, data));
  }

  return data as T;
}

// フォームから渡された画像URLの簡易バリデーション。
function validateImageUrl(
  value: string | undefined | null,
): asserts value is string {
  if (!value) {
    throw new Error("画像URLを入力してください。");
  }

  try {
    // URL.parseが成功すれば十分とし、http(s)チェックは不要要件に合わせてスキップ。
    new URL(value);
  } catch (_error) {
    throw new Error("画像URLの形式が正しくありません。");
  }
}

// 単純な待機ユーティリティ。
function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

// STEP1: Instagramメディアコンテナを作成。
async function createIgMedia(imageUrl: string) {
  console.log("[Ig] メディア作成開始", { imageUrl });
  const body = new URLSearchParams({
    image_url: imageUrl,
    access_token: IG_TOKEN,
  });

  const response = await requestGraph<MediaCreationResponse>(
    `${IG_USER_ID}/media`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    },
  );

  console.log("[Ig] メディア作成完了", { containerId: response.id });
  return response;
}

// STEP2: Instagramメディアが"FINISHED"になるまでポーリング。
async function waitForIgMediaReady(containerId: string) {
  // Ig側の非同期処理が動き始めるまで最初だけ5秒待機。
  await sleep(INITIAL_STATUS_DELAY_MS);

  for (let attempt = 1; attempt <= POLLING_MAX_ATTEMPTS; attempt += 1) {
    const status = await requestGraph<MediaStatusResponse>(
      `${containerId}?fields=status,status_code&access_token=${IG_TOKEN}`,
    );

    console.log("[Ig] メディアステータス", {
      attempt,
      status: status.status,
      statusCode: status.status_code,
    });

    // Instagram側でステータスがFINISHEDになれば投稿可能。
    if (status.status === "FINISHED" || status.status_code === "FINISHED") {
      return;
    }

    if (status.status === "ERROR" || status.status_code === "ERROR") {
      throw new Error("Instagramメディアの作成でエラーが発生しました。");
    }

    if (attempt < POLLING_MAX_ATTEMPTS) {
      await sleep(POLLING_DELAY_MS);
    }
  }

  throw new Error("Instagramメディアの作成がタイムアウトしました (約1分)。");
}

// STEP3: FINISHEDになったコンテナをInstagramに公開。
async function publishIgMedia(containerId: string) {
  console.log("[Ig] メディア公開開始", { containerId });
  const body = new URLSearchParams({
    creation_id: containerId,
    access_token: IG_TOKEN,
  });

  const response = await requestGraph<MediaPublishResponse>(
    `${IG_USER_ID}/media_publish`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    },
  );

  console.log("[Ig] メディア公開完了", { postId: response.id });
  return response;
}

// フォームから呼ばれるエントリーポイント。Instagram Graph APIの3段ステップを順に実行。
export async function runInstagramImagePost(
  imageUrl: string,
): Promise<IgImagePostState> {
  try {
    console.log("[Ig] 投稿処理スタート", { imageUrl });
    validateImageUrl(imageUrl);

    const { id: containerId } = await createIgMedia(imageUrl);
    await waitForIgMediaReady(containerId);
    const { id: postId } = await publishIgMedia(containerId);

    console.log("[Ig] 投稿処理成功", { postId });

    return {
      status: "success",
      postId,
      message: "Instagramへの投稿が完了しました。",
    };
  } catch (error) {
    console.log("[Ig] 投稿処理失敗", { error });
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Instagram投稿処理で不明なエラーが発生しました。",
    };
  }
}
