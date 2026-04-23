import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import CustomerLayout from './components/CustomerLayout';
import Home from './pages/Home';
import Services from './pages/Services';
import Shop from './pages/Shop';
import Booking from './pages/Booking';
import Cart from './pages/Cart';
import Bikes from './pages/Bikes';
import Contact from './pages/Contact';
import Profile from './pages/Profile';
import Auth from './pages/Auth';
import Admin from './pages/Admin';
import Wishlist from './pages/Wishlist';
import Customizer from './pages/Customizer';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import ProductDetail from './pages/ProductDetail';
import BikeDetail from './pages/BikeDetail';
import LoadingScreen from './components/LoadingScreen';
import BackgroundEffects from './components/BackgroundEffects';

export default function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate initial app loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary selection:bg-brand-orange selection:text-white transition-colors duration-300">
      <BackgroundEffects />
      <Routes>
        <Route path="/admin" element={<Admin />} />
        <Route path="/*" element={
          <CustomerLayout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/services" element={<Services />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/shop/:id" element={<ProductDetail />} />
              <Route path="/bikes" element={<Bikes />} />
              <Route path="/bikes/:id" element={<BikeDetail />} />
              <Route path="/booking" element={<Booking />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/customizer" element={<Customizer />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:id" element={<BlogPost />} />
            </Routes>
          </CustomerLayout>
        } />
      </Routes>
    </div>
  );
}
