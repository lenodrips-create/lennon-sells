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
  return (
    <div className="grain relative" style={{ overflowX: 'clip' }}>
      <Intro />
      <ScrollProgress />
      <HaloCursor />
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
    </div>
  );
}
