"use client";

import { useActionState, useEffect } from "react";
import { Button, Input, TextArea, toastError, toastSuccess } from "@intromax/ui";
import { sendContactMessage, type ContactFormState } from "@/actions/contact";

const INITIAL_STATE: ContactFormState = { status: "idle" };

export function ContactForm() {
  const [state, formAction, isPending] = useActionState(
    sendContactMessage,
    INITIAL_STATE,
  );

  // `state` only changes reference when a submission completes, so this
  // fires exactly once per result — not on unrelated re-renders, and not
  // repeatedly for the same result.
  useEffect(() => {
    if (state.status === "success") {
      toastSuccess("Message sent — thanks, I'll get back to you soon.");
    } else if (state.status === "error") {
      toastError(state.message);
    }
  }, [state]);

  const fieldErrors = state.status === "validation_error" ? state.fieldErrors : {};

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Input
        id="name"
        name="name"
        label="name"
        autoComplete="name"
        required
        error={fieldErrors.name}
      />

      <Input
        id="email"
        name="email"
        label="email"
        type="email"
        autoComplete="email"
        required
        error={fieldErrors.email}
      />

      <TextArea
        id="message"
        name="message"
        label="message"
        error={fieldErrors.message}
      />

      <Button type="submit" disabled={isPending} className="self-start">
        {isPending ? "Sending…" : "Send"}
      </Button>
    </form>
  );
}
