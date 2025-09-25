import { Contact } from "../types";

/**
 * Build a simple vCard string from contact object.
 * vCard 3.0 simple generator. For more advanced usage, use a library.
 */
export function buildVCard(contact: Partial<Contact>): string {
  const { firstName = "", lastName = "", phoneNumber = "", email = "", company = "", title = "", address = "" } = contact;
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${[firstName, lastName].filter(Boolean).join(" ")}`,
    `N:${lastName};${firstName};;;`,
  ];
  if (company) lines.push(`ORG:${escapeVCARD(company)}`);
  if (title) lines.push(`TITLE:${escapeVCARD(title)}`);
  if (phoneNumber) lines.push(`TEL;TYPE=CELL:${escapeVCARD(phoneNumber)}`);
  if (email) lines.push(`EMAIL;TYPE=INTERNET:${escapeVCARD(email)}`);
  if (address) lines.push(`ADR;TYPE=WORK:;;${escapeVCARD(address)};;;;`);
  lines.push("END:VCARD");
  return lines.join("\r\n");
}

function escapeVCARD(s: string) {
  return (s || "").replace(/\n/g, "\\n").replace(/,/g, "\\,");
}
