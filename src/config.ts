const asset = (f: string) => `${import.meta.env.BASE_URL}${f}`;

export const IMG = {
  glasses: asset('glasses.webp'),
  jupiter: asset('jupiter.webp'),
  neptune: asset('neptune.webp'),
  painting: asset('painting.webp'),
};

// Scrolls to the requests section.
export function seek() {
  document.getElementById('request')?.scrollIntoView({ behavior: 'smooth' });
}
