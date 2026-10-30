"use client";

import { useState, useActionState } from "react";
import Link from "next/link";
import Notice from "@/components/Notice";
import { wordCount } from "@/lib/types";
import { experiences } from "@/lib/experiences";
import { themes, themeFor } from "@/lib/themes";

export default function StoryForm({
  action,
  initial = "",
  id,
  experience,
  theme,
  returnTo = "/stories/mine",
  cancelHref = "/stories/mine",
}: {
  action: (data: FormData) => Promise<void | { error: string }>;
  initial?: string;
  id?: string;
  experience?: string | null;
  theme?: string;
  returnTo?: string;
  cancelHref?: string;
}) {
  const [body, setBody] = useState(initial);
  const [selectedTheme, setSelectedTheme] = useState(theme || "");
  const [selectedExperience, setSelectedExperience] = useState(experience || "");
  const [state, submit, pending] = useActionState(async (_previous: { error: string }, data: FormData) => {
    const result = await action(data);
    return result || { error: "" };
  }, { error: "" });
  const count = wordCount(body);
  return (
    <form action={submit} className="story-form" onReset={event => event.preventDefault()}>
      {id && <input type="hidden" name="id" value={id} />}
      <input type="hidden" name="returnTo" value={returnTo} />
      <fieldset className="experience-options">
        <legend>Where did this experience come from? Choose one.</legend>
        {experiences.map(option => <label key={option}>
          <input type="radio" name="experience" value={option} checked={selectedExperience === option} onChange={() => setSelectedExperience(option)} required /><span>{option}</span>
        </label>)}
      </fieldset>
      <label htmlFor="body">Tell us about the experience</label>
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
      />
      <div className={`word-count ${count > 300 ? "over-limit" : ""}`} aria-live="polite">
        {count} of 300 words
      </div>
      <div className="field">
        <label htmlFor="theme">What specifically happened or changed?</label>
        <p id="theme-help" className="field-help">Choose the one theme that best describes the main outcome in your story. If none fits, select “No clear theme yet.”</p>
        <select id="theme" name="theme" value={selectedTheme} onChange={event => setSelectedTheme(event.target.value)} required aria-describedby="theme-help theme-description">
          <option value="" disabled>Select one theme</option>
          {themes.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
        </select>
        <p id="theme-description" className="field-help" aria-live="polite">{selectedTheme && <><strong>{themeFor(selectedTheme)?.label}</strong><br />{themeFor(selectedTheme)?.description}</>}</p>
      </div>
      <Notice error={state.error} />
      <div className="page-actions">
        <button className="button" type="submit" disabled={pending || count === 0 || count > 300}>
          {pending ? "Saving…" : "Save story"}
        </button>
        <Link className="button secondary" href={cancelHref}>Cancel</Link>
      </div>
    </form>
  );
}
