"use client";

import Link from "next/link";
import { useRef, useEffect } from "react";
import { experiences } from "@/lib/experiences";

export default function StoriesMenu({ label = "Stories", href = "/stories/all" }: { label?: string; href?: string }) {
  const menu = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      if (menu.current && !menu.current.contains(event.target as Node)) menu.current.open = false;
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, []);
  function close() { if (menu.current) menu.current.open = false; }
  return <details ref={menu} className="stories-menu" onKeyDown={event => {
    if (event.key === "Escape") { close(); menu.current?.querySelector("summary")?.focus(); }
  }}>
    <summary>{label}</summary>
    <div className="stories-menu-options">
      <Link href={href} onClick={close}>All</Link>
      {experiences.map(option => <Link key={option} href={`${href}?experience=${encodeURIComponent(option)}`} onClick={close}>{option}</Link>)}
    </div>
  </details>;
}
