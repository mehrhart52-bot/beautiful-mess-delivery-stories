"use client";

import { useState } from "react";

export default function PasswordInput() {
  const [visible, setVisible] = useState(false);
  return <div className="password-input">
    <input id="password" name="password" type={visible ? "text" : "password"} autoComplete="current-password" required />
    <button type="button" aria-controls="password" aria-label={visible ? "Hide password" : "Show password"} aria-pressed={visible} onClick={() => setVisible(!visible)}>
      {visible ? "Hide" : "Show"}
    </button>
  </div>;
}
