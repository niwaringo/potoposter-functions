import {
  http,
  type Request,
  type Response,
} from "@google-cloud/functions-framework";
import { deleteUpload, listUploads } from "./gcs/gsc.js";

http("potoposterFunction", async (_req: Request, res: Response) => {
  try {
    const obj = await listUploads();

    if (!obj) {
      res.status(404).send("No uploads found");
      return;
    }

    await deleteUpload(obj.objectName);

    res.status(200).send(obj.publicUrl);
  } catch (error) {
    console.error("Failed to list uploads", error);
    res.status(500).send("Failed to list uploads");
  }
});
