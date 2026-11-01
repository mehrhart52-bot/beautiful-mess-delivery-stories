"use client";

import Script from "next/script";
import { useFormStatus } from "react-dom";
import { useEffect, useRef, useState } from "react";
import SubmitButton from "@/components/SubmitButton";

type Turnstile = {
  render: (element: HTMLElement, options: Record<string, unknown>) => string;
  remove: (id: string) => void;
  reset: (id: string) => void;
};
declare global { interface Window { turnstile?: Turnstile } }

export default function BotProtectedSubmit({ siteKey, nonce, children, pendingText }: {
  siteKey?: string; nonce?: string; children: React.ReactNode; pendingText: string;
}) {
  const { pending } = useFormStatus();
  const submitted = useRef(false);
  const container = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    if (!ready || !siteKey || !container.current || !window.turnstile) return;
    widget.current = window.turnstile.render(container.current, {
      sitekey: siteKey, theme: "light", size: "flexible", "response-field": false,
      callback: (value: string) => { setToken(value); setError(""); },
      "expired-callback": () => { setToken(""); setError("The security check expired. Please try the check again."); },
      "error-callback": () => { setToken(""); setError("The security check could not finish. Please try again."); },
    });
    return () => { if (widget.current !== null) window.turnstile?.remove(widget.current); widget.current = null; };
  }, [ready, siteKey]);
  useEffect(() => {
    if (pending) submitted.current = true;
    else if (submitted.current) {
      submitted.current = false;
      setToken("");
      if (widget.current !== null) window.turnstile?.reset(widget.current);
    }
  }, [pending]);
  return <>
    {siteKey && <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" nonce={nonce}
        onReady={() => setReady(true)} onError={() => setError("The security check could not load. Check your connection and reload this page.")} />
      <div ref={container} style={{ marginBlock: 16 }} />
      <input type="hidden" name="captchaToken" value={token} />
      {!token && !error && <p role="status" className="field-help">Please complete the security check before continuing.</p>}
      {error && <div role="alert"><p>{error}</p><button type="button" className="button secondary" onClick={() => {
        setToken("");
        if (widget.current !== null && window.turnstile) { setError(""); window.turnstile.reset(widget.current); }
        else window.location.reload();
      }}>Try security check again</button></div>}
      <noscript>Please enable JavaScript to complete the security check.</noscript>
    </>}
    <SubmitButton disabled={Boolean(siteKey) && !token} pendingText={pendingText}>{children}</SubmitButton>
  </>;
}
