import vision from "@google-cloud/vision";
import 'dotenv/config';
import fs from "fs";

const client = new vision.ImageAnnotatorClient();

export async function performOCR(buffer: Buffer): Promise<string> {
  // Use client.batchAnnotateImages
  const [result] = await client.documentTextDetection({ image: { content: buffer } });
  // documentTextDetection returns fullTextAnnotation
  const annotation = result.fullTextAnnotation;
  const text = annotation?.text || "";
  return text;
}
