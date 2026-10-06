// Where requests go. Fill in either to let visitors send directly;
// left blank, visitors can still copy their written request.
export const CONTACT = {
  email: '',
  instagram: '', // handle without the @
};

const asset = (f: string) => `${import.meta.env.BASE_URL}${f}`;

export const IMG = {
  glasses: asset('glasses.webp'),
  jupiter: asset('jupiter.webp'),
  neptune: asset('neptune.webp'),
  painting: asset('painting.webp'),
};

// Lets any "request" button pre-fill the request form.
export function seek(item?: string) {
  window.dispatchEvent(new CustomEvent('seek', { detail: item ?? '' }));
  document.getElementById('request')?.scrollIntoView({ behavior: 'smooth' });
}
