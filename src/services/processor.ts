import axios from "axios";
import { getMediaUrl, sendVCardMessage } from "./whatsapp";
import { performOCR } from "./vision";
import { parseContactWithGemini } from "./gemini";
import { contactSchema } from "../schemas/contactSchema";
import { buildVCard } from "./vcard";
import { ZodError } from "zod";

export async function handleIncomingWebhook(payload: any) {
  // Basic defensive checks depending on WhatsApp payload structure
  try {
    const entries = payload.entry || [];
    for (const entry of entries) {
      const changes = entry.changes || [];
      for (const change of changes) {
        const value = change.value || {};
        const messages = value.messages || [];
        for (const message of messages) {
          const from = message.from; // sender id (phone number in whatsapp)
          const messageId = message.id;
          if (!message || !message.type) continue;

          // We're interested in image or document with media
          const media = message.image || message.document;
          
          if (!media) {
            console.log("No media in message, ignoring");
            continue;
          }
          const mediaId = media.id;
          if (!mediaId) {
            console.warn("No media id present");
            continue;
          }

          // 1) Retrieve media URL from Meta
          const mediaUrl = await getMediaUrl(mediaId);
          if (!mediaUrl) throw new Error("Failed to obtain media URL");

          // 2) Download bytes
          const imageResp = await axios.get(mediaUrl, {
            responseType: "arraybuffer",
            headers: {
              Authorization: `Bearer ${process.env.META_ACCESS_TOKEN}`,
            },
          });
          const imageBuffer = Buffer.from(imageResp.data);

          // 3) OCR
          const ocrText = await performOCR(imageBuffer);
          console.log("OCR TEXT:", ocrText.substring(0, 200));

          // 4) LLM parse
          const parsed = await parseContactWithGemini(ocrText);
          // 5) Validate
          let validated;
          try {
            validated = contactSchema.parse(parsed);
          } catch (e) {
            if (e instanceof ZodError) {
              console.warn("Validation failed, attempt heuristics");
              // Fallback heuristics could be applied here
              validated = {}; // fallback to partial
            } else {
              throw e;
            }
          }

          // 6) build vcard
          type ContactType = {
            firstName?: string;
            lastName?: string;
            phoneNumber?: string;
            email?: string;
            company?: string;
            title?: string;
            address?: string;
          };
          const contactObj: ContactType = {};
          if (validated.firstName) contactObj.firstName = validated.firstName;
          if (validated.lastName) contactObj.lastName = validated.lastName;
          if (validated.phoneNumber) contactObj.phoneNumber = validated.phoneNumber;
          if (validated.email) contactObj.email = validated.email;
          if (validated.company) contactObj.company = validated.company;
          if (validated.title) contactObj.title = validated.title;
          if (validated.address) contactObj.address = validated.address;

          const vcfString = buildVCard(contactObj);

          // 7) Send vCard back via WhatsApp
          await sendVCardMessage(from, vcfString, messageId);

          console.log(`Processed message ${messageId} from ${from}`);
        }
      }
    }
  } catch (err) {
    console.error("handleIncomingWebhook error:", err);
    throw err;
  }
}
