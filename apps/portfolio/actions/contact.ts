"use server";

import { Resend } from "resend";

type ContactFieldErrors = Partial<Record<"name" | "email" | "message", string>>;

export type ContactFormState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "validation_error"; fieldErrors: ContactFieldErrors }
  | { status: "error"; message: string };

// Deliberately loose — an RFC-perfect email regex is a well-known trap and
// buys nothing over catching the obvious "missing @"/"missing domain" cases.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const GENERIC_ERROR_MESSAGE = "Something went wrong. Please try again later.";

function validate(fields: {
  name: string;
  email: string;
  message: string;
}): ContactFieldErrors {
  const errors: ContactFieldErrors = {};

  if (!fields.name.trim()) {
    errors.name = "Name is required.";
  }

  if (!fields.email.trim()) {
    errors.email = "Email is required.";
  } else if (!EMAIL_RE.test(fields.email.trim())) {
    errors.email = "Enter a valid email address.";
  }

  if (!fields.message.trim()) {
    errors.message = "Message is required.";
  }

  return errors;
}

// Strips CR/LF so a crafted `name` can't inject extra headers into the
// `from`/`subject` fields it's interpolated into — Server Actions accept
// arbitrary FormData, not just what a single-line <input> would produce.
function sanitizeHeaderValue(value: string): string {
  return value.trim().replace(/[\r\n]+/g, " ");
}

export async function sendContactMessage(
  _prevState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const name = String(formData.get("name") ?? "");
  const email = String(formData.get("email") ?? "");
  const message = String(formData.get("message") ?? "");

  const fieldErrors = validate({ name, email, message });
  if (Object.keys(fieldErrors).length > 0) {
    return { status: "validation_error", fieldErrors };
  }

  const safeName = sanitizeHeaderValue(name);
  const safeEmail = email.trim();

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: `${safeName} <onboarding@resend.dev>`,
      to: process.env.CONTACT_RECIPIENT_EMAIL ?? "",
      replyTo: safeEmail,
      subject: `New contact form message from ${safeName}`,
      text: `From: ${safeName} <${safeEmail}>\n\n${message.trim()}`,
    });

    if (error) {
      console.error("[contact-action]", { stage: "resend", error });
      return { status: "error", message: GENERIC_ERROR_MESSAGE };
    }

    return { status: "success" };
  } catch (error) {
    console.error("[contact-action]", { stage: "resend-exception", error });
    return { status: "error", message: GENERIC_ERROR_MESSAGE };
  }
}
