'use client';
import { Printer } from 'lucide-react';
export function PrintPolicy() {
  return (
    <button
      className="button secondary"
      type="button"
      onClick={() => {
        const details = [
          ...document.querySelectorAll<HTMLDetailsElement>('.privacy-accordion details'),
        ];
        const states = details.map((x) => x.open);
        details.forEach((x) => {
          x.open = true;
        });
        try {
          window.print();
        } finally {
          details.forEach((x, i) => {
            x.open = states[i];
          });
        }
      }}
    >
      <Printer size={18} aria-hidden="true" />
      طباعة / حفظ PDF
    </button>
  );
}
