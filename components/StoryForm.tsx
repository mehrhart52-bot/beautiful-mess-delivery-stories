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
      <p className="field-help">Share the moment in your own words. Please leave out private details such as full names, addresses, or medical information.</p>
      <textarea
        id="body"
        name="body"
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
