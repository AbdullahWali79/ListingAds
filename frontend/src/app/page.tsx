'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { adApi, categoryApi } from '@/lib/api';

interface Ad {
  id: number;
  title: string;
  description: string;
  price: number;
  image_urls: string[];
  category_name: string;
  category_slug: string;
  seller_name: string;
  created_at: string;
}

interface Category {
  id: number;
  name: string;
  slug: string;
}

export default function Home() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const searchParams = useSearchParams();

  useEffect(() => {
    const search = searchParams.get('search');
    if (search) {
      setSearchQuery(search);
    }
    fetchCategories();
    fetchAds();
  }, [searchParams]);

  const fetchCategories = async () => {
    try {
      const response = await categoryApi.getAll();
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchAds = async () => {
    try {
      const params: any = { limit: 4 };
      const search = searchParams.get('search');
      if (search) {
        params.search = search;
      }
      const response = await adApi.getAll(params);
      setAds(response.data);
    } catch (error) {
      console.error('Failed to fetch ads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.append('search', searchQuery);
    if (location) params.append('location', location);
    if (selectedCategory) params.append('category', selectedCategory);
    window.location.href = `/?${params.toString()}`;
  };

  const categoryIcons: { [key: string]: string } = {
    'cars': '🚗',
    'phones': '📱',
    'furniture': '🛋️',
    'jobs': '💼',
    'fashion': '👔',
    'electronics': '💻',
  };

  return (
    <>
      <Navbar />
      
      {/* Hero Section */}
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '80px 0',
        color: 'white'
      }}>
        <div className="container">
          <div className="hero-grid">
            <div>
              <h1 style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '20px', lineHeight: '1.2' }}>
                Buy & Sell Products Easily
              </h1>
              <p style={{ fontSize: '18px', marginBottom: '30px', opacity: 0.9, lineHeight: '1.6' }}>
                Find great deals or sell your items in your local marketplace. Your one-stop shop for everything you need.
              </p>
              
              {/* Search Form */}
              <div style={{ 
                background: 'white', 
                borderRadius: '12px', 
                padding: '20px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }}>
                <form onSubmit={handleSearch}>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '12px', alignItems: 'end' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontSize: '14px', fontWeight: '500' }}>
                        Search
                      </label>
                      <input
                        type="text"
                        placeholder="Search for anything..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '1px solid #ddd',
                          borderRadius: '8px',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontSize: '14px', fontWeight: '500' }}>
                        Location
                      </label>
                      <input
                        type="text"
                        placeholder="Location"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '1px solid #ddd',
                          borderRadius: '8px',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontSize: '14px', fontWeight: '500' }}>
                        Category
                      </label>
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '1px solid #ddd',
                          borderRadius: '8px',
                          fontSize: '14px',
                          background: 'white'
                        }}
                      >
                        <option value="">All Categories</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    <button 
                      type="submit"
                      className="btn btn-primary"
                      style={{ padding: '12px 24px', whiteSpace: 'nowrap' }}
                    >
                      Search
                    </button>
                  </div>
                </form>
              </div>
            </div>
            
            <div style={{ 
              background: 'rgba(255,255,255,0.1)', 
              borderRadius: '16px', 
              padding: '40px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '120px', marginBottom: '20px' }}>🛒</div>
              <p style={{ fontSize: '16px', opacity: 0.9 }}>
                Your local marketplace for buying and selling
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '60px', paddingBottom: '60px' }}>
        {/* Browse by Category */}
        <h2 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '40px', textAlign: 'center', color: '#333' }}>
          Browse by Category
        </h2>
        <div className="grid" style={{ marginBottom: '80px', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          {categories.slice(0, 6).map((category) => (
            <Link key={category.id} href={`/categories?category=${category.slug}`}>
              <div className="card" style={{ 
                textAlign: 'center', 
                cursor: 'pointer',
                transition: 'transform 0.2s',
                padding: '30px 20px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
              >
                <div style={{ fontSize: '48px', marginBottom: '15px' }}>
                  {categoryIcons[category.slug.toLowerCase()] || '📦'}
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#333' }}>{category.name}</h3>
              </div>
            </Link>
          ))}
        </div>

        {/* Latest Ads */}
        <h2 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '40px', textAlign: 'center', color: '#333' }}>
          Latest Ads
        </h2>
        {loading ? (
          <p style={{ textAlign: 'center', color: '#666' }}>Loading...</p>
        ) : ads.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666' }}>No ads available</p>
        ) : (
          <div className="grid">
            {ads.map((ad) => (
              <Link key={ad.id} href={`/ads/${ad.id}`}>
                <div className="card" style={{ cursor: 'pointer', padding: '0', overflow: 'hidden' }}>
                  {ad.image_urls && ad.image_urls.length > 0 && (
                    <img
                      src={ad.image_urls[0]}
                      alt={ad.title}
                      style={{ 
                        width: '100%', 
                        height: '200px', 
                        objectFit: 'cover',
                        display: 'block'
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                  <div style={{ padding: '20px' }}>
                    <h3 style={{ marginBottom: '10px', fontSize: '18px', fontWeight: '600', color: '#333' }}>{ad.title}</h3>
                    {ad.price && (
                      <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#0070f3', marginBottom: '10px' }}>
                        ${ad.price.toFixed(2)}
                      </p>
                    )}
                    <p style={{ color: '#666', fontSize: '14px', marginBottom: '5px' }}>
                      {ad.category_name}
                    </p>
                    <p style={{ color: '#999', fontSize: '13px' }}>
                      {ad.seller_name}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer style={{ 
        background: '#2d3748', 
        color: 'white', 
        padding: '60px 0 20px',
        marginTop: '80px'
      }}>
        <div className="container">
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(4, 1fr)', 
            gap: '40px',
            marginBottom: '40px'
          }}>
            <div>
              <h3 style={{ marginBottom: '15px', fontSize: '20px', fontWeight: 'bold' }}>Classifieds</h3>
              <p style={{ color: '#a0aec0', lineHeight: '1.6' }}>
                Your local marketplace to buy and sell new or used items with ease.
              </p>
            </div>
            <div>
              <h4 style={{ marginBottom: '15px', fontSize: '16px', fontWeight: '600' }}>About</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', color: '#a0aec0' }}>
                <Link href="/about" style={{ color: '#a0aec0' }}>About Us</Link>
                <Link href="/contact" style={{ color: '#a0aec0' }}>Contact</Link>
                <Link href="/careers" style={{ color: '#a0aec0' }}>Careers</Link>
              </div>
            </div>
            <div>
              <h4 style={{ marginBottom: '15px', fontSize: '16px', fontWeight: '600' }}>Support</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', color: '#a0aec0' }}>
                <Link href="/help" style={{ color: '#a0aec0' }}>Help Center</Link>
                <Link href="/terms" style={{ color: '#a0aec0' }}>Terms of Service</Link>
                <Link href="/privacy" style={{ color: '#a0aec0' }}>Privacy Policy</Link>
              </div>
            </div>
            <div>
              <h4 style={{ marginBottom: '15px', fontSize: '16px', fontWeight: '600' }}>Follow Us</h4>
              <div style={{ display: 'flex', gap: '15px' }}>
                <a href="#" style={{ color: '#a0aec0', fontSize: '24px' }}>📘</a>
                <a href="#" style={{ color: '#a0aec0', fontSize: '24px' }}>🐦</a>
                <a href="#" style={{ color: '#a0aec0', fontSize: '24px' }}>📷</a>
              </div>
            </div>
          </div>
          <div style={{ 
            borderTop: '1px solid #4a5568', 
            paddingTop: '20px', 
            textAlign: 'center', 
            color: '#a0aec0' 
          }}>
            © 2024 Classifieds. All rights reserved.
          </div>
        </div>
      </footer>
    </>
  );
}

