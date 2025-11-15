import {
  http,
  type Request,
  type Response,
} from "@google-cloud/functions-framework";

http("potoposterFunction", (_req: Request, res: Response) => {
  // Your code here

  // Send an HTTP response
  res.send("OK");
});
