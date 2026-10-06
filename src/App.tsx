import { useState } from 'react';
import HaloCursor from './components/HaloCursor';
import ScrollProgress from './components/ScrollProgress';
import FloatingSeek from './components/FloatingSeek';
import Intro from './sections/Intro';
import Nav from './sections/Nav';
import Hero from './sections/Hero';
import Ticker from './sections/Ticker';
import Pair from './sections/Pair';
import Request from './sections/Request';
import Angles from './sections/Angles';
import Statement from './sections/Statement';
import Footer from './sections/Footer';

export default function App() {
  // The site mounts as the intro's light opens up, so its entrance animations play in sync
  const [entered, setEntered] = useState(false);

  return (
    <div className="grain relative min-h-screen bg-ink" style={{ overflowX: 'clip' }}>
      <Intro onReveal={() => setEntered(true)} />
      <HaloCursor />
      {entered && (
        <>
          <ScrollProgress />
          <Nav />
          <main>
            <Hero />
            <Ticker />
            <Pair />
            <Request />
            <Angles />
            <Statement />
          </main>
          <Footer />
          <FloatingSeek />
        </>
      )}
    </div>
  );
}
