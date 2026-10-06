// Gothic rose window drawn as SVG: stained-glass petals in crimson, lapis and gold.
export default function RoseWindow({ className = '' }: { className?: string }) {
  const petals = 16;
  const inner = 8;
  return (
    <svg viewBox="-200 -200 400 400" className={className} aria-hidden>
      <defs>
        <radialGradient id="rw-glow">
          <stop offset="0%" stopColor="#F6E3A8" stopOpacity="0.9" />
          <stop offset="45%" stopColor="#D4AF62" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#D4AF62" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="rw-red" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C2334B" />
          <stop offset="100%" stopColor="#5A0F1D" />
        </linearGradient>
        <linearGradient id="rw-blue" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3B52A8" />
          <stop offset="100%" stopColor="#141C42" />
        </linearGradient>
      </defs>

      <circle r="198" fill="none" stroke="#D4AF62" strokeOpacity="0.55" strokeWidth="2" />
      <circle r="186" fill="none" stroke="#D4AF62" strokeOpacity="0.3" strokeWidth="1" strokeDasharray="2 6" />

      {Array.from({ length: petals }, (_, i) => (
        <g key={`o${i}`} transform={`rotate(${(360 / petals) * i})`}>
          <path
            d="M0 -60 C 28 -95, 30 -150, 0 -178 C -30 -150, -28 -95, 0 -60 Z"
            fill={i % 2 ? 'url(#rw-blue)' : 'url(#rw-red)'}
            fillOpacity="0.55"
            stroke="#D4AF62"
            strokeOpacity="0.8"
            strokeWidth="1.5"
          />
          <circle cy="-170" r="7" fill="#D4AF62" fillOpacity="0.5" />
          <line y1="-60" y2="-178" stroke="#D4AF62" strokeOpacity="0.35" strokeWidth="0.8" />
        </g>
      ))}

      {Array.from({ length: inner }, (_, i) => (
        <g key={`i${i}`} transform={`rotate(${(360 / inner) * i + 22.5})`}>
          <path
            d="M0 -18 C 16 -32, 18 -50, 0 -62 C -18 -50, -16 -32, 0 -18 Z"
            fill="#D4AF62"
            fillOpacity="0.35"
            stroke="#F6E3A8"
            strokeOpacity="0.8"
            strokeWidth="1"
          />
        </g>
      ))}

      <circle r="64" fill="none" stroke="#D4AF62" strokeOpacity="0.7" strokeWidth="1.5" />
      <circle r="120" fill="url(#rw-glow)" />
      <circle r="16" fill="#F6E3A8" fillOpacity="0.8" />
    </svg>
  );
}
