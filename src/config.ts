// The store lives at /shop/, while images sit at the site root.
const asset = (f: string) => new URL(`../${f}`, document.baseURI).href;

export const IMG = {
  glasses: asset('glasses.webp'),
  jupiter: asset('jupiter.webp'),
  neptune: asset('neptune.webp'),
  painting: asset('painting.webp'),
  trevi: asset('trevi.webp'),
  treviBlur: asset('trevi-blur.webp'),
  rays: asset('rays.webp'),
  cathedral: asset('cathedral.webp'),
};

// Scrolls to the requests section.
export function seek() {
  document.getElementById('request')?.scrollIntoView({ behavior: 'smooth' });
}
