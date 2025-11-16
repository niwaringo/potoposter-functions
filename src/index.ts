import {
  http,
  type Request,
  type Response,
} from "@google-cloud/functions-framework";
import { listUploads } from "./gcs/gsc.js";

http("potoposterFunction", async (_req: Request, res: Response) => {
  try {
    const url = await listUploads();

    if (!url) {
      res.status(404).send("No uploads found");
      return;
    }

    res.status(200).send(url);
  } catch (error) {
    console.error("Failed to list uploads", error);
    res.status(500).send("Failed to list uploads");
  }
});
