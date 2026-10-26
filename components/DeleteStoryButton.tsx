"use client";

import { deleteStory } from "@/app/actions";

export default function DeleteStoryButton({ id }: { id: string }) {
  return (
    <form
      action={deleteStory}
      className="inline-form"
      onSubmit={(event) => {
        if (!window.confirm("Delete this story permanently? This cannot be undone."))
          event.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button className="button danger" type="submit">Delete story</button>
    </form>
  );
}
