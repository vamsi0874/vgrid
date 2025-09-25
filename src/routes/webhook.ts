// import { Router, Response, Request } from "express";
// import crypto from "crypto";
// import { handleIncomingWebhook } from "../services/processor";
// import { parseWebhookPayload } from "../utils/metaHelpers";

// const router = Router();

// // Get endpoint verification (optional, used when verifying webhook subscription)
// router.get("/", (req: Request, res: Response) => {
//   // Meta webhook verification: challenge + hub.verify_token
//   console.log("Webhook verification request:", req.query);
//   const mode = req.query["hub.mode"];
//   const token = req.query["hub.verify_token"];
//   const challenge = req.query["hub.challenge"];
//   if (mode && token && challenge) {
//     // Add your own verification token check if desired (e.g., process.env.META_VERIFY_TOKEN)
//     return res.status(200).send(String(challenge));
//   }
//   res.status(200).send("OK");
// });

// router.post("/", async (req: Request, res: Response) => {

//   console.log("Incoming webhookkkk");
//   const rawBody = req.body as Buffer;
//   console.log("Raw body:", rawBody.toString("utf8").substring(0, 200));
//   // const signatureHeader = (req.headers["x-hub-signature-256"] as string) || (req.headers["x-hub-signature"] as string);

//   const appSecret = process.env.META_APP_SECRET;
//   if (!appSecret) {
//     console.error("META_APP_SECRET not configured");
//     return res.status(500).send("Server misconfigured");
//   }

//   // Verify signature
//   // const verify = verifySignature(rawBody, signatureHeader, appSecret);
//   // if (!verify) {
//   //   console.warn("Invalid signature on incoming webhook");
//   //   return res.status(403).send("Invalid signature");
//   // }

//   // Parse JSON payload from raw body
//   let payload: any;
//   try {
//     payload = JSON.parse(rawBody.toString("utf8"));
//   } catch (err) {
//     console.error("Failed to parse JSON payload", err);
//     return res.status(400).send("Invalid JSON");
//   }

//   // Ack immediately
//   res.status(200).send("EVENT_RECEIVED");

//   // send test whatsapp message
  


//   // Process asynchronously (don't block response)
//   try {
//     await handleIncomingWebhook(payload);
//     // await sendTestMessage()
//   } catch (err) {
//     console.error("Error processing webhook:", err);
//   }
// });

// // function verifySignature(rawBody: Buffer, signatureHeader: string | undefined, appSecret: string) {
// //   if (!signatureHeader) return false;
// //   // Meta may use sha256 prefix: "sha256=..."
// //   const [algoPart, signature] = signatureHeader.includes("=") ? signatureHeader.split("=") : ["sha1", signatureHeader];
// //   const algo = (algoPart ?? "sha1").replace("sha", "sha"); // keep as "sha256" or "sha1"
// //   try {
// //     const hmac = crypto.createHmac(algo, appSecret);
// //     hmac.update(rawBody);
// //     const computed = hmac.digest("hex");
// //     if (!signature) return false;
// //     return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(signature));
// //   } catch (e) {
// //     console.error("Error computing signature:", e);
// //     return false;
// //   }
// // }

// async function sendTestMessage() {
//   console.log("Sending test WhatsApp message...");
//   const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;  // from Meta app
//   const token = process.env.META_ACCESS_TOKEN;        // permanent system-user token

//   const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;

//   const body = {
//     messaging_product: "whatsapp",
//     to: "918897489909",                // <-- your test number
//     type: "template",
//     template: {
//       name: "hello_world",
//       language: { code: "en_US" }
//     }
//   };

//   const response = await fetch(url, {
//     method: "POST",
//     headers: {
//       "Authorization": `Bearer ${token}`,
//       "Content-Type": "application/json"
//     },
//     body: JSON.stringify(body)
//   });

//   if (!response.ok) {
//     const errText = await response.text();
//     throw new Error(`HTTP ${response.status}: ${errText}`);
//   }



//   console.log("WhatsApp API response:", await response.json());

//   return response;
// }



// export default router;


import express, { Request, Response } from "express";
import fetch from "node-fetch"; // or global fetch in Node 18+

const router = express.Router();

// Capture raw body if you want to verify signatures later


// Your WhatsApp Business number for loop protection
// const BUSINESS_NUMBER = process.env.WHATSAPP_BUSINESS_NUMBER;

// -------------------- GET: Webhook Verification --------------------
router.get("/webhook", (req: Request, res: Response) => {
  const verify_token = process.env.META_VERIFY_TOKEN;

  if (
    req.query["hub.mode"] === "subscribe" &&
    req.query["hub.verify_token"] === verify_token
  ) {
    console.log("Webhook verified successfully");
    return res.status(200).send(req.query["hub.challenge"]);
  }

  res.sendStatus(403);
});
let num = 1
// -------------------- POST: Webhook Event --------------------
router.post("/", async (req: Request, res: Response) => {
  console.log("Incoming webhook event");
  console.log("Num:", num+=1);

  // 1️⃣ Respond immediately so WhatsApp stops retrying
  res.sendStatus(200);

  // console.log("Raw body:", req.body.toString("utf8").substring(0, 200));

  // const body = req.body;
  // const changes = body?.entry?.[0]?.changes?.[0]?.value;
  // const messages = changes?.messages;

  // // 2️⃣ Only handle inbound user messages
  // if (!messages || messages.length === 0) {
  //   console.log("No inbound messages. Ignoring this event.");
  //   return;
  // }

  // const msg = messages[0];

  // Ignore messages from your own business number
  // if (msg.from === BUSINESS_NUMBER) {
  //   console.log("Message from self. Ignoring to prevent loop.");
  //   return;
  // }

  // console.log(`Received message from ${msg.from}:`, msg);

  // 3️⃣ Send test template message
  try {
    // await sendTestMessage();
    console.log("Test WhatsApp message sent successfully");
  } catch (err) {
    console.error("Failed to send WhatsApp message:", err);
  }
});

// -------------------- Function to send WhatsApp template message --------------------
async function sendTestMessage() {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.META_ACCESS_TOKEN;

  const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;

  const body = {
    messaging_product: "whatsapp",
    messages: ["Hello, this is a test message from the webhook."],
    to: '918897489909',  // send to the user who triggered the webhook
    type: "template",
    template: {
      name: "hello_world",
      language: { code: "en_US" }
    }
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errText}`);
  }

  console.log("WhatsApp API response:", await response.json());
}

export default router;