import { Component, StrictMode } from 'react';
import type { ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { IMG } from './config';
import './index.css';

// If anything in the animated page throws, show a simple version instead of nothing.
class SafeBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error(error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="fallback">
        <img src={IMG.glasses} alt="Chrome Hearts glasses" />
        <h1>LENNON RESELLS</h1>
        <p>One pair of Chrome Hearts glasses. DM for price and requests.</p>
      </div>
    );
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SafeBoundary>
      <App />
    </SafeBoundary>
  </StrictMode>
);
