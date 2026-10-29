import { useEffect, useRef, useState } from "react";
import type { Answer } from "@kids-math/core";

interface DragState { index: number; pointerId: number; startX: number; startY: number }

export function DragTray({ total, onAnswer }: { total: number; onAnswer: (a: Answer) => void }) {
  const [counted, setCounted] = useState<boolean[]>(() => Array(total).fill(false));
  const [dragging, setDragging] = useState<number | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const trayRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setCounted(Array(total).fill(false));
    dragRef.current = null;
    setDragging(null);
  }, [total]);

  const countedN = counted.filter(Boolean).length;

  const cancelDrag = () => {
    const d = dragRef.current;
    if (!d) return;
    const el = itemRefs.current[d.index];
    if (el) {
      try { if (el.hasPointerCapture(d.pointerId)) el.releasePointerCapture(d.pointerId); } catch { /* noop */ }
      el.style.transform = "";
    }
    dragRef.current = null;
    setDragging(null);
  };

  const countOne = (i: number) => {
    setCounted((prev) => {
      if (prev[i]) return prev;
      const next = [...prev];
      next[i] = true;
      return next;
    });
  };

  const onItemPointerDown = (e: React.PointerEvent<HTMLButtonElement>, i: number) => {
    if (counted[i] || !e.isPrimary) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { index: i, pointerId: e.pointerId, startX: e.clientX, startY: e.clientY };
    setDragging(i);
  };

  const onItemPointerMove = (e: React.PointerEvent<HTMLButtonElement>, i: number) => {
    const d = dragRef.current;
    if (!d || d.pointerId !== e.pointerId || d.index !== i) return;
    const el = itemRefs.current[i];
    if (el) el.style.transform = `translate(${e.clientX - d.startX}px, ${e.clientY - d.startY}px)`;
  };

  const onItemPointerUp = (e: React.PointerEvent<HTMLButtonElement>, i: number) => {
    const d = dragRef.current;
    if (!d || d.pointerId !== e.pointerId || d.index !== i) return;
    const el = itemRefs.current[i];
    if (el) {
      try { if (el.hasPointerCapture(d.pointerId)) el.releasePointerCapture(d.pointerId); } catch { /* noop */ }
      el.style.transform = "";
    }
    dragRef.current = null;
    setDragging(null);
    const tray = trayRef.current?.getBoundingClientRect();
    if (tray && e.clientX >= tray.left && e.clientX <= tray.right && e.clientY >= tray.top && e.clientY <= tray.bottom) {
      countOne(i);
    }
  };

  return (
    <div
      data-testid="drag-tray"
      className="drag-tray"
      // Second finger while dragging cancels cleanly: capture phase runs
      // before any item handler, so we can swallow the new press.
      onPointerDownCapture={(e) => {
        const d = dragRef.current;
        if (d && e.pointerId !== d.pointerId) {
          cancelDrag();
          e.stopPropagation();
          e.preventDefault();
        }
      }}
    >
      <div className="drag-items" role="group" aria-label="draggable stickers">
        {Array.from({ length: total }, (_, i) => (
          <button
            key={i}
            ref={(el) => { itemRefs.current[i] = el; }}
            type="button"
            data-testid={`drag-item-${i + 1}`}
            className={dragging === i ? "drag-item dragging" : "drag-item"}
            aria-label={`drag sticker ${i + 1}`}
            aria-disabled={counted[i]}
            hidden={counted[i]}
            onPointerDown={(e) => onItemPointerDown(e, i)}
            onPointerMove={(e) => onItemPointerMove(e, i)}
            onPointerUp={(e) => onItemPointerUp(e, i)}
            onPointerCancel={cancelDrag}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); countOne(i); } }}
          >
            ⭐
          </button>
        ))}
      </div>
      <div ref={trayRef} data-testid="tray-zone" className="tray-zone" role="region" aria-label={`tray, ${countedN} counted`}>
        Tray: <b data-testid="tray-counted">{countedN}</b>
      </div>
      <div className="widget-actions">
        <button
          type="button"
          data-testid="drag-confirm"
          aria-label="Confirm drag count"
          onClick={() => onAnswer({ kind: "count", value: countedN })}
        >
          Confirm tray
        </button>
      </div>
    </div>
  );
}
