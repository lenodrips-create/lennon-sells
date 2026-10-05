import { useState } from 'react';
import type { CSSProperties } from 'react';

const FALLBACKS = [
  'linear-gradient(135deg, #18011F 0%, #4A0A55 55%, #7621B0 100%)',
  'linear-gradient(135deg, #1A1A1F 0%, #3A3F48 60%, #646973 100%)',
  'linear-gradient(135deg, #20060A 0%, #6B1E3A 50%, #BE4C00 100%)',
  'linear-gradient(135deg, #0F1418 0%, #2A3B48 55%, #BBCCD7 130%)',
];

interface SafeImgProps {
  src: string;
  alt?: string;
  className?: string;
  style?: CSSProperties;
  loading?: 'lazy' | 'eager';
  seed?: number;
  /** Render nothing instead of a gradient tile when the image fails. */
  hideOnError?: boolean;
}

// Falls back to a gradient tile when a remote image can't be loaded.
export default function SafeImg({
  src,
  alt = '',
  className,
  style,
  loading,
  seed = 0,
  hideOnError = false,
}: SafeImgProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    if (hideOnError) return null;
    return (
      <div
        role={alt ? 'img' : undefined}
        aria-label={alt || undefined}
        className={className}
        style={{ ...style, background: FALLBACKS[seed % FALLBACKS.length] }}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      className={className}
      style={style}
      onError={() => setFailed(true)}
    />
  );
}
