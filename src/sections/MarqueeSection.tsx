import { useEffect, useRef, useState } from 'react';
import SafeImg from '../components/SafeImg';

const IMAGES = [
  'https://motionsites.ai/assets/hero-space-voyage-preview-eECLH3Yc.gif',
  'https://motionsites.ai/assets/hero-codenest-preview-Cgppc2qV.gif',
  'https://motionsites.ai/assets/hero-vex-ventures-preview-BczMFIiw.gif',
  'https://motionsites.ai/assets/hero-stellar-ai-v2-preview-DjvxjG3C.gif',
  'https://motionsites.ai/assets/hero-asme-preview-B_nGDnTP.gif',
  'https://motionsites.ai/assets/hero-transform-data-preview-Cx5OU29N.gif',
  'https://motionsites.ai/assets/hero-vitara-preview-Cjz2QYyU.gif',
  'https://motionsites.ai/assets/hero-terra-preview-BFjrCr7T.gif',
  'https://motionsites.ai/assets/hero-skyelite-preview-DHaZIgUv.gif',
  'https://motionsites.ai/assets/hero-aethera-preview-DknSlcTa.gif',
  'https://motionsites.ai/assets/hero-designpro-preview-D8c5_een.gif',
  'https://motionsites.ai/assets/hero-stellar-ai-preview-D3HL6bw1.gif',
  'https://motionsites.ai/assets/hero-xportfolio-preview-D4A8maiC.gif',
  'https://motionsites.ai/assets/hero-orbit-web3-preview-BXt4OttD.gif',
  'https://motionsites.ai/assets/hero-nexora-preview-cx5HmUgo.gif',
  'https://motionsites.ai/assets/hero-evr-ventures-preview-DZxeVFEX.gif',
  'https://motionsites.ai/assets/hero-planet-orbit-preview-DWAP8Z1P.gif',
  'https://motionsites.ai/assets/hero-new-era-preview-CocuDUm9.gif',
  'https://motionsites.ai/assets/hero-wealth-preview-B70idl_u.gif',
  'https://motionsites.ai/assets/hero-luminex-preview-CxOP7ce6.gif',
  'https://motionsites.ai/assets/hero-celestia-preview-0yO3jXO8.gif',
];

const ROW_1 = [...IMAGES.slice(0, 11), ...IMAGES.slice(0, 11), ...IMAGES.slice(0, 11)];
const ROW_2 = [...IMAGES.slice(11), ...IMAGES.slice(11), ...IMAGES.slice(11)];

// Tile width (420) + gap (12). Rows start one full set to the left so the
// middle copy is in view and neither edge ever shows empty space.
const TILE_STEP = 432;

function Tile({ src, seed }: { src: string; seed: number }) {
  return (
    <SafeImg
      src={src}
      seed={seed}
      loading="lazy"
      className="h-[270px] w-[420px] shrink-0 rounded-2xl object-cover"
    />
  );
}

export default function MarqueeSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const el = sectionRef.current;
      if (!el) return;
      const sectionTop = el.getBoundingClientRect().top + window.scrollY;
      setOffset((window.scrollY - sectionTop + window.innerHeight) * 0.3);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section
      ref={sectionRef}
      className="flex flex-col gap-3 overflow-hidden pb-10 pt-24 sm:pt-32 md:pt-40"
      style={{ background: '#0C0C0C' }}
    >
      <div
        className="flex gap-3"
        style={{
          marginLeft: -11 * TILE_STEP,
          transform: `translateX(${offset - 200}px)`,
          willChange: 'transform',
        }}
      >
        {ROW_1.map((src, i) => (
          <Tile key={i} src={src} seed={i} />
        ))}
      </div>
      <div
        className="flex gap-3"
        style={{
          marginLeft: -10 * TILE_STEP,
          transform: `translateX(${-(offset - 200)}px)`,
          willChange: 'transform',
        }}
      >
        {ROW_2.map((src, i) => (
          <Tile key={i} src={src} seed={i + 2} />
        ))}
      </div>
    </section>
  );
}
