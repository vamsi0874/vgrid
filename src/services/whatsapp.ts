import axios from "axios";

import * as dotenv from "dotenv";
dotenv.config();

const META_BASE = "https://graph.facebook.com/v22.0"; // adjust to the API version you're using
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

if (!ACCESS_TOKEN || !PHONE_NUMBER_ID) {
  console.warn("META_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID is missing in env");
}

export async function getMediaUrl(mediaId: string): Promise<string> {
  // GET /{media-id} to obtain url field
  const url = `${META_BASE}/${mediaId}`;
  const resp = await axios.get(url, {
    params: { access_token: ACCESS_TOKEN },
  });
  // resp.data should contain url
  return resp.data.url;
}

export async function sendVCardMessage(to: string, vcfContent: string, contextMessageId?: string) {
  // Meta expects the document to be uploaded to their media endpoint first.
  // We'll upload the vcf as a media file, then send message referencing media id.
  // 1) Upload
  const uploadUrl = `${META_BASE}/${PHONE_NUMBER_ID}/media`;
  const FormData = require("form-data");
  const blob = Buffer.from(vcfContent, "utf8");
  const fd = new FormData();
  fd.append("file", blob, { filename: "contact.vcf", contentType: "text/vcard" });

  // If running in Node, FormData above may need `form-data` package. For brevity, show the conceptual flow:
  // - Use form-data package or multipart upload with axios.
  // I'll show a simple approach using axios + form-data (user must install "form-data" if needed).

  const uploadResp = await axios.post(uploadUrl, fd, {
    headers: {
      ...fd.getHeaders(),
      Authorization: `Bearer ${ACCESS_TOKEN}`,
    },
    params: { access_token: ACCESS_TOKEN },
  });
  const mediaId = uploadResp.data.id;
  if (!mediaId) throw new Error("Failed to upload media to Meta");

  // 2) Send message referencing media
  const messagesUrl = `${META_BASE}/${PHONE_NUMBER_ID}/messages`;
  type WhatsAppDocumentMessage = {
    messaging_product: string;
    to: string;
    type: "document";
    document: {
      id: any;
      filename: string;
    };
    context?: {
      message_id: string;
    };
  };

  const body: WhatsAppDocumentMessage = {
    messaging_product: "whatsapp",
    to,
    type: "document",
    document: {
      id: mediaId,
      filename: "contact.vcf",
    },
  };

  if (contextMessageId) {
    body.context = { message_id: contextMessageId };
  }

  const sendResp = await axios.post(messagesUrl, body, {
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    params: { access_token: ACCESS_TOKEN },
  });

  return sendResp.data;
}
