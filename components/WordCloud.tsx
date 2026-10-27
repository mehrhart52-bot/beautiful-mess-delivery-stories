"use client";

import { useEffect, useState } from "react";

type Word = { word: string; count: number };
type Placed = Word & { x: number; y: number; width: number; height: number; size: number };

// Place the most frequent word first, then search outward from the center.
function arrange(words: Word[], context: CanvasRenderingContext2D): Placed[] {
  for (let scale = 1; scale >= 0.2; scale -= 0.05) {
    const placed: Placed[] = [];
    for (const item of words) {
      const size = (24 + 52 * Math.sqrt(item.count / words[0].count)) * scale;
      context.font = `800 ${size}px Arial`;
      const width = context.measureText(item.word).width + 22;
      const height = size * 1.3 + 14;
      let found = false;
      for (let step = 0; step < 5000; step++) {
        const angle = step * 0.16;
        const radius = angle * 2;
        const x = 450 + Math.cos(angle) * radius * 1.5;
        const y = 280 + Math.sin(angle) * radius;
        if (x - width / 2 < 20 || x + width / 2 > 880 ||
            y - height / 2 < 20 || y + height / 2 > 540) continue;
        if (placed.some(other =>
          Math.abs(x - other.x) < (width + other.width) / 2 &&
          Math.abs(y - other.y) < (height + other.height) / 2
        )) continue;
        placed.push({ ...item, x, y, width, height, size });
        found = true;
        break;
      }
      if (!found) break;
    }
    if (placed.length === words.length) return placed;
  }
  return [];
}

export default function WordCloud({ words }: { words: Word[] }) {
  const [placed, setPlaced] = useState<Placed[]>([]);
  useEffect(() => {
    const context = document.createElement("canvas").getContext("2d");
    if (context) setPlaced(arrange(words, context));
  }, [words]);

  return <div className="word-cloud">
    {placed.length ? <svg viewBox="0 0 900 560" role="img" aria-label={words.map(({ word, count }) => `${word}: ${count} appearances`).join("; ")}>
      {placed.map(({ word, count, x, y, size }, index) =>
        <text key={word} x={x} y={y} textAnchor="middle" dominantBaseline="central"
          fontFamily="Arial, Helvetica, sans-serif" fontWeight="800" fontSize={size}
          fill={["#002b3d", "#075985", "#a87900"][index % 3]}>
          <title>{word}: {count} appearances</title>{word}
        </text>)}
    </svg> : <p>{words.map(({ word, count }) => `${word} (${count})`).join(" · ")}</p>}
  </div>;
}
