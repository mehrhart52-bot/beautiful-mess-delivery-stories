"use client";
import { useFormStatus } from "react-dom";
export default function SubmitButton({ children, pendingText = "Please wait…", disabled = false }: { children: React.ReactNode; pendingText?: string; disabled?: boolean }) {
  const { pending } = useFormStatus();
  return <button className="button" type="submit" disabled={pending || disabled}>{pending ? pendingText : children}</button>;
}
