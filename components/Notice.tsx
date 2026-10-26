export default function Notice({
  message,
  error,
}: {
  message?: string;
  error?: string;
}) {
  const text = error || message;
  if (!text) return null;
  return <div className={`notice ${error ? "notice-error" : "notice-success"}`}>{text}</div>;
}
