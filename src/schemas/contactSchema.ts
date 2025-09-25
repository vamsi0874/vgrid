import { z } from "zod";

export const contactSchema = z.object({
  firstName: z.string().optional().or(z.null()).transform(v => (v === null ? undefined : v)),
  lastName: z.string().optional().or(z.null()).transform(v => (v === null ? undefined : v)),
  phoneNumber: z.string().optional(),
  email: z.string().email().optional(),
  company: z.string().optional(),
  title: z.string().optional(),
  address: z.string().optional(),
});

export type Contact = z.infer<typeof contactSchema>;
