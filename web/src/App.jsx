import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import ScrollEffects from './components/ScrollEffects.jsx';
import Home from './pages/Home.jsx';
import Features from './pages/Features.jsx';
import Rewards from './pages/Rewards.jsx';
import Premium from './pages/Premium.jsx';
import About from './pages/About.jsx';
import Support from './pages/Support.jsx';
import Contact from './pages/Contact.jsx';
import Privacy from './pages/Privacy.jsx';
import Terms from './pages/Terms.jsx';
import DeleteAccount from './pages/DeleteAccount.jsx';
import NotFound from './pages/NotFound.jsx';

const TITLES = {
  '/': 'axyio: Move. Earn. Redeem.',
  '/features': 'Features · axyio',
  '/rewards': 'FIT & rewards · axyio',
  '/premium': 'Premium · axyio',
  '/about': 'About · axyio',
  '/support': 'Help center · axyio',
  '/contact': 'Contact · axyio',
  '/privacy': 'Privacy Policy · axyio',
  '/terms': 'Terms of Service · axyio',
  '/delete-account': 'Delete your account · axyio',
};

/** Scrolls to the top (or to #hash) on navigation and sets the tab title. */
function RouteEffects() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    document.title = TITLES[pathname] || 'Page not found · axyio';
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname, hash]);
  return null;
}

export default function App() {
  return (
    <>
      <RouteEffects />
      <ScrollEffects />
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/features" element={<Features />} />
          <Route path="/rewards" element={<Rewards />} />
          <Route path="/premium" element={<Premium />} />
          <Route path="/about" element={<About />} />
          <Route path="/support" element={<Support />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/delete-account" element={<DeleteAccount />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}
