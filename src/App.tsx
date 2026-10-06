import HaloCursor from './components/HaloCursor';
import ScrollProgress from './components/ScrollProgress';
import FloatingSeek from './components/FloatingSeek';
import Intro from './sections/Intro';
import Nav from './sections/Nav';
import Hero from './sections/Hero';
import LatinMarquee from './sections/LatinMarquee';
import Relic from './sections/Relic';
import Seek from './sections/Seek';
import Sanctum from './sections/Sanctum';
import Scripture from './sections/Scripture';
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
        <LatinMarquee />
        <Relic />
        <Seek />
        <Sanctum />
        <Scripture />
      </main>
      <Footer />
      <FloatingSeek />
    </div>
  );
}
