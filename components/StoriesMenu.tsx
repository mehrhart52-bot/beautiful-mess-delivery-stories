"use client";

import Link from "next/link";
import { useRef, useEffect } from "react";
import { experiences } from "@/lib/experiences";
import styles from "./StoriesMenu.module.css";

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
  return <details ref={menu} className={styles.menu} onToggle={() => {
    const panel = menu.current?.querySelector("div");
    if (menu.current?.open && panel) {
      panel.style.transform = "";
      const box = panel.getBoundingClientRect();
      const shift = box.left < 12 ? 12 - box.left : box.right > window.innerWidth - 12 ? window.innerWidth - 12 - box.right : 0;
      panel.style.transform = `translateX(${shift}px)`;
    }
  }} onKeyDown={event => {
    if (event.key === "Escape") { close(); menu.current?.querySelector("summary")?.focus(); }
  }}>
    <summary>{label}</summary>
    <div className={styles.options}>
      <Link href={href} onClick={close}>All</Link>
      {experiences.map(option => <Link key={option} href={`${href}?experience=${encodeURIComponent(option)}`} onClick={close}>{option}</Link>)}
    </div>
  </details>;
}
