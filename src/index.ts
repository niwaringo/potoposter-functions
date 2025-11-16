import {
  http,
  type Request,
  type Response,
} from "@google-cloud/functions-framework";
import { deleteUpload, listUploads } from "./gcs/gsc.js";
import { runInstagramImagePost } from "./poster/instagram.js";

http("potoposterFunction", async (req: Request, res: Response) => {
  if (req.method !== "GET") {
    res.status(405).send("GET only");
    return;
  }

  try {
    // GETアクセス時に最新アップロードを探しIGに流す。
    const obj = await listUploads();

    if (!obj) {
      res.status(404).send("No uploads found");
      return;
    }

    console.log("Found latest upload:", obj.objectName);

    const result = await runInstagramImagePost(obj.publicUrl);

    console.log("Instagram post result:", result);

    if (result.status !== "success") {
      res.status(502).json(result);
      return;
    }

    await deleteUpload(obj.objectName);

    res.status(200).json({
      message: "Instagramへの投稿が完了し、元ファイルを削除しました。",
      postId: result.postId,
    });
  } catch (error) {
    console.error("Failed to process Instagram posting flow", error);
    res.status(500).send("Failed to post to Instagram");
  }
});
