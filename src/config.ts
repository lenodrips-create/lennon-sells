// Where "Seek" requests go. Fill in either to let visitors send directly;
// left blank, visitors can still copy their written request.
export const CONTACT = {
  email: '',
  instagram: '', // handle without the @
};

export const GLASSES = `${import.meta.env.BASE_URL}glasses.png`;

// Lets any "Claim" button pre-fill the Seek form.
export function seek(item?: string) {
  window.dispatchEvent(new CustomEvent('seek', { detail: item ?? '' }));
  document.getElementById('seek')?.scrollIntoView({ behavior: 'smooth' });
}
