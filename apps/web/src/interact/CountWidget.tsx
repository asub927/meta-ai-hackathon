import { useState } from "react";
import type { Answer } from "@kids-math/core";

const MAX = 20;
const PER_ROW = 10;

export function CountWidget({ onAnswer }: { onAnswer: (a: Answer) => void }) {
  const [value, setValue] = useState(0);

  // Toggle in onPointerDown so highlight is immediate (no wait for click /
  // state round-trip). The click guard (detail === 0) covers keyboard
  // activation without double-toggling real taps.
  const press = (n: number) => setValue((v) => (v === n ? n - 1 : n));
  const clear = () => setValue(0);

  const rows: number[][] = [];
  for (let r = 0; r < MAX / PER_ROW; r++) {
    rows.push(Array.from({ length: PER_ROW }, (_, c) => r * PER_ROW + c + 1));
  }

  return (
    <div data-testid="count-widget" className="count-widget">
      {rows.map((row, r) => (
        <div key={r} className="counter-grid" role="group" aria-label={`counters ${row[0]} to ${row[row.length - 1]}`}>
          {row.map((n) => (
            <button
              key={n}
              type="button"
              data-testid={`counter-${n}`}
              className={n <= value ? "counter on" : "counter"}
              aria-label={`counter ${n}`}
              aria-pressed={n <= value}
              onPointerDown={() => press(n)}
              onClick={(e) => { if (e.detail === 0) press(n); }}
            >
              {n}
            </button>
          ))}
        </div>
      ))}
      <p data-testid="count-value" aria-live="polite">Count: {value}</p>
      <div className="widget-actions">
        <button
          type="button"
          data-testid="count-confirm"
          aria-label="Done counting"
          onClick={() => onAnswer({ kind: "count", value })}
        >
          Done counting
        </button>
        <button
          type="button"
          data-testid="count-clear"
          className="secondary"
          aria-label="Clear count"
          onClick={clear}
        >
          Clear
        </button>
      </div>
    </div>
  );
}
