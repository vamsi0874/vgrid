// import express, { Request, Response } from "express";

// const app = express();

// // This must match the Verify Token you set in the Meta App Dashboard
// const WEBHOOK_VERIFY_TOKEN = "123456";

// // Parse query params and verify webhook
// app.get("/webhook", (req: Request, res: Response) => {
//   const mode = req.query["hub.mode"];
//   const token = req.query["hub.verify_token"];
//   const challenge = req.query["hub.challenge"];

//   if (mode && token) {
//     if (mode === "subscribe" && token === WEBHOOK_VERIFY_TOKEN) {
//       console.log("WEBHOOK_VERIFIED");
//       // Send back the challenge from the request so Meta knows the endpoint is valid
//       return res.status(200).send(challenge);
//     }
//     return res.sendStatus(403); // Token mismatch
//   }

//   // If no mode/token provided, also respond 403
//   return res.sendStatus(403);
// });

// // ✅ Meta will POST actual events to this endpoint
// app.post("/webhook", express.json(), (req: Request, res: Response) => {
//   console.log("Received webhook event:", req.body);
//   res.sendStatus(200);
// });

// app.listen(3000, () => {
//   console.log("✅ Server is running on http://localhost:3000");
// });

import express, { Request, Response } from "express";
import dotenv from "dotenv";
import webhookRouter from "./routes/webhook";

dotenv.config();

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const app = express();


app.get('/',(req,res)=>{
  res.send('Hello World!')
})
// Important: route /api/webhook needs raw body for signature verification.
// We'll mount the webhook router separately with express.raw middleware.
app.get("/api/health", (_req: Request, res: Response) => res.json({ ok: true }));

// Mount webhook with raw body parser for signature verification
app.use("/webhook", express.raw({ type: "*/*", limit: "10mb" }), webhookRouter);

// Optional: other routes use json parser
app.use(express.json());

// app.listen(PORT, () => {
//   console.log(`Server listening on port ${PORT}`);
// });


export default app;