'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { getUser } from '@/lib/auth';
import { adApi, categoryApi } from '@/lib/api';

interface Ad {
  id: number;
  title: string;
  description: string;
  price: number;
  image_urls: string[];
  category_name: string;
  seller_name: string;
  created_at: string;
  location?: string;
}

interface Category {
  id: number;
  name: string;
  slug: string;
}

export default function BuyerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [ads, setAds] = useState<Ad[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [wishlist, setWishlist] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  const [rating, setRating] = useState(3);
  const [reviewText, setReviewText] = useState('');

  useEffect(() => {
    const currentUser = getUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    fetchCategories();
    fetchAds();
    // Load wishlist from localStorage
    const savedWishlist = localStorage.getItem('wishlist');
    if (savedWishlist) {
      setWishlist(JSON.parse(savedWishlist));
    }
  }, []);

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
      setLoading(true);
      const params: any = {};
      if (searchQuery) params.search = searchQuery;
      if (selectedCategory) params.category_id = selectedCategory;
      const response = await adApi.getAll(params);
      let fetchedAds = response.data || [];
      
      // Sort ads
      if (sortBy === 'latest') {
        fetchedAds.sort((a: Ad, b: Ad) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      } else if (sortBy === 'price-low') {
        fetchedAds.sort((a: Ad, b: Ad) => (a.price || 0) - (b.price || 0));
      } else if (sortBy === 'price-high') {
        fetchedAds.sort((a: Ad, b: Ad) => (b.price || 0) - (a.price || 0));
      }
      
      setAds(fetchedAds);
    } catch (error) {
      console.error('Failed to fetch ads:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, [searchQuery, selectedCategory, sortBy]);

  const toggleWishlist = (ad: Ad) => {
    const isInWishlist = wishlist.some(item => item.id === ad.id);
    let newWishlist;
    if (isInWishlist) {
      newWishlist = wishlist.filter(item => item.id !== ad.id);
    } else {
      newWishlist = [...wishlist, ad];
    }
    setWishlist(newWishlist);
    localStorage.setItem('wishlist', JSON.stringify(newWishlist));
  };

  const isInWishlist = (adId: number) => {
    return wishlist.some(item => item.id === adId);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAds();
  };

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Thank you for your feedback!');
    setReviewText('');
    setRating(3);
  };

  return (
    <>
      <Navbar />
      <div style={{ background: '#f0f4f8', minHeight: '100vh', paddingBottom: '40px' }}>
        <div className="container" style={{ paddingTop: '30px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '30px' }}>
            {/* Main Content */}
            <div>
              <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '30px', color: '#333' }}>
                Buyer Dashboard
              </h1>

              {/* Search and Filters */}
              <div style={{ marginBottom: '30px' }}>
                <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                  <input
                    type="text"
                    placeholder="Search for products, brands, or seller"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '14px 20px',
                      border: '1px solid #ddd',
                      borderRadius: '12px',
                      fontSize: '15px',
                      outline: 'none'
                    }}
                  />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    style={{
                      padding: '14px 20px',
                      border: '1px solid #ddd',
                      borderRadius: '12px',
                      fontSize: '15px',
                      background: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    style={{
                      padding: '14px 20px',
                      border: '1px solid #ddd',
                      borderRadius: '12px',
                      fontSize: '15px',
                      background: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">Location</option>
                    <option value="new-york">New York, NY</option>
                    <option value="los-angeles">Los Angeles, CA</option>
                    <option value="chicago">Chicago, IL</option>
                  </select>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    style={{
                      padding: '14px 20px',
                      border: '1px solid #ddd',
                      borderRadius: '12px',
                      fontSize: '15px',
                      background: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="latest">Sort By: Latest</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                  </select>
                </form>
              </div>

              {/* Discover Products */}
              <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '20px', color: '#333' }}>
                Discover Products
              </h2>
              {loading ? (
                <p style={{ textAlign: 'center', color: '#666', padding: '40px' }}>Loading...</p>
              ) : ads.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#666', padding: '40px' }}>No products found</p>
              ) : (
                <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '40px' }}>
                  {ads.map((ad) => (
                    <div key={ad.id} className="card" style={{ padding: '0', overflow: 'hidden', position: 'relative' }}>
                      <button
                        onClick={() => toggleWishlist(ad)}
                        style={{
                          position: 'absolute',
                          top: '10px',
                          right: '10px',
                          background: 'rgba(255,255,255,0.9)',
                          border: 'none',
                          borderRadius: '50%',
                          width: '36px',
                          height: '36px',
                          cursor: 'pointer',
                          fontSize: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          zIndex: 10,
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                      >
                        {isInWishlist(ad.id) ? '❤️' : '🤍'}
                      </button>
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
                        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '10px', color: '#333' }}>
                          {ad.title}
                        </h3>
                        {ad.price && (
                          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#0070f3', marginBottom: '10px' }}>
                            ${ad.price.toFixed(2)}
                          </p>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '15px', fontSize: '14px', color: '#666' }}>
                          <span>📍</span>
                          <span>{ad.location || 'New York, NY'}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <Link href={`/ads/${ad.id}`} className="btn btn-primary" style={{ textAlign: 'center', textDecoration: 'none' }}>
                            View Details
                          </Link>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              style={{
                                flex: 1,
                                padding: '10px',
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                background: '#f9fafb',
                                color: '#666',
                                cursor: 'pointer',
                                fontSize: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '5px'
                              }}
                            >
                              <span>📞</span>
                              Call Seller
                            </button>
                            <button
                              style={{
                                flex: 1,
                                padding: '10px',
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                background: '#f9fafb',
                                color: '#666',
                                cursor: 'pointer',
                                fontSize: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '5px'
                              }}
                            >
                              <span>💬</span>
                              WhatsApp
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginTop: '30px' }}>
                <button style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '8px', background: 'white', cursor: 'pointer' }}>
                  ←
                </button>
                {[1, 2, 3, '...', 10].map((page, idx) => (
                  <button
                    key={idx}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      background: page === 1 ? '#0070f3' : 'white',
                      color: page === 1 ? 'white' : '#333',
                      cursor: 'pointer',
                      fontWeight: page === 1 ? '600' : '400'
                    }}
                  >
                    {page}
                  </button>
                ))}
                <button style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '8px', background: 'white', cursor: 'pointer' }}>
                  →
                </button>
              </div>
            </div>

            {/* Sidebar */}
            <div>
              {/* Wishlist */}
              <div className="card" style={{ marginBottom: '20px', background: '#e0f2fe' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: '#333' }}>
                  Your Wishlist
                </h3>
                {wishlist.length === 0 ? (
                  <p style={{ color: '#666', fontSize: '14px', textAlign: 'center', padding: '20px' }}>
                    Your wishlist is empty
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {wishlist.slice(0, 5).map((item) => (
                      <div key={item.id} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        {item.image_urls && item.image_urls.length > 0 && (
                          <img
                            src={item.image_urls[0]}
                            alt={item.title}
                            style={{
                              width: '60px',
                              height: '60px',
                              objectFit: 'cover',
                              borderRadius: '8px'
                            }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        )}
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>{item.title}</div>
                          {item.price && (
                            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#0070f3' }}>
                              ${item.price.toFixed(2)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Share Your Experience */}
              <div className="card">
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '15px', color: '#333' }}>
                  Share Your Experience
                </h3>
                <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
                  Leave a review on a recent purchase.
                </p>
                <form onSubmit={handleSubmitFeedback}>
                  <div style={{ marginBottom: '15px' }}>
                    <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '24px',
                            cursor: 'pointer',
                            color: star <= rating ? '#ffc107' : '#ddd'
                          }}
                        >
                          ⭐
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    placeholder="Tell us about your experience..."
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    style={{
                      width: '100%',
                      minHeight: '100px',
                      padding: '12px',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      fontSize: '14px',
                      marginBottom: '15px',
                      fontFamily: 'inherit',
                      resize: 'vertical'
                    }}
                  />
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: '100%' }}
                  >
                    Submit Feedback
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

