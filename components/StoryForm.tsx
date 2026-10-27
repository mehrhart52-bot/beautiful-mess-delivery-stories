"use client";

import { useState } from "react";
import { wordCount } from "@/lib/types";

export default function StoryForm({
  action,
  initial = "",
  id,
}: {
  action: (data: FormData) => void | Promise<void>;
  initial?: string;
  id?: string;
}) {
  const [body, setBody] = useState(initial);
  const count = wordCount(body);
  return (
    <form action={action} className="story-form">
      {id && <input type="hidden" name="id" value={id} />}
      <label htmlFor="body">Tell us about the delivery</label>
      <div className="privacy-reminder" id="story-privacy">
        <strong>Protect the privacy of the people you helped.</strong>
        <p>All active users can read your story. Do not include full names, addresses, phone numbers, email addresses, medical information, or other sensitive personal details.</p>
        <p>Use descriptions such as “a family” or “a neighbor” instead.</p>
      </div>
      <textarea
        id="body"
        name="body"
        aria-describedby="story-privacy"
        rows={13}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        required
        autoFocus
      />
      <div className={`word-count ${count > 300 ? "over-limit" : ""}`} aria-live="polite">
        {count} of 300 words
      </div>
      <button className="button" type="submit" disabled={count === 0 || count > 300}>
        Save story
      </button>
    </form>
  );
}
