import {
  BookOpen,
  NotebookPen,
  Backpack,
  Calculator,
  Headphones,
  PenTool,
  FileText,
  Package,
} from 'lucide-react';
export function ProductIcon({ title, size = 64 }: { title: string; size?: number }) {
  const Icon = /كتاب|مرجع|book/i.test(title)
    ? BookOpen
    : /كشكول|دفتر|notebook/i.test(title)
      ? NotebookPen
      : /حقيبة|شنطة|bag/i.test(title)
        ? Backpack
        : /حاسبة|calculator/i.test(title)
          ? Calculator
          : /سماعة|headphone/i.test(title)
            ? Headphones
            : /قلم|pen/i.test(title)
              ? PenTool
              : /ملخص|مذكرة|ورق|notes/i.test(title)
                ? FileText
                : Package;
  return (
    <span className="product-item-icon" aria-hidden="true">
      <Icon size={size} strokeWidth={1.5} />
    </span>
  );
}
