'use client';
import { useState } from 'react';
import { Home, ChevronLeft, ChevronRight } from 'lucide-react';
export function HousingGallery({ images, title }: { images: string[]; title: string }) {
  const [index, setIndex] = useState(0);
  return (
    <div className="housing-gallery">
      {images.length ? (
        <img src={images[index]} alt={title + '، صورة ' + (index + 1)} />
      ) : (
        <div className="housing-gallery-empty">
          <Home size={68} />
          <span>لم تُضف صور للسكن بعد</span>
        </div>
      )}
      {images.length > 1 && (
        <div className="housing-gallery-controls">
          <button
            type="button"
            aria-label="الصورة السابقة"
            onClick={() => setIndex((index - 1 + images.length) % images.length)}
          >
            <ChevronRight size={18} />
          </button>
          <span
            className="housing-gallery-dots"
            aria-label={`الصورة ${index + 1} من ${images.length}`}
          >
            {images.map((_, i) => (
              <i key={i} className={i === index ? 'active' : ''} />
            ))}
          </span>
          <button
            type="button"
            aria-label="الصورة التالية"
            onClick={() => setIndex((index + 1) % images.length)}
          >
            <ChevronLeft size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
