'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { adApi } from '@/lib/api';

interface Ad {
  id: number;
  title: string;
  description: string;
  price: number;
  image_urls: string[];
  video_url: string;
  category_name: string;
  seller_name: string;
  seller_email: string;
  created_at: string;
  location?: string;
}

export default function AdDetailPage() {
  const params = useParams();
  const [ad, setAd] = useState<Ad | null>(null);
  const [relatedAds, setRelatedAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showPhone, setShowPhone] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchAd();
      fetchRelatedAds();
    }
  }, [params.id]);

  const fetchAd = async () => {
    try {
      const response = await adApi.getById(Number(params.id));
      setAd(response.data);
    } catch (error) {
      console.error('Failed to fetch ad:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedAds = async () => {
    try {
      const response = await adApi.getAll({ limit: 4 });
      setRelatedAds(response.data.filter((a: Ad) => a.id !== Number(params.id)).slice(0, 4));
    } catch (error) {
      console.error('Failed to fetch related ads:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container" style={{ paddingTop: '40px' }}>
          <p>Loading...</p>
        </div>
      </>
    );
  }

  if (!ad) {
    return (
      <>
        <Navbar />
        <div className="container" style={{ paddingTop: '40px' }}>
          <p>Ad not found</p>
        </div>
      </>
    );
  }

  const images = ad.image_urls && ad.image_urls.length > 0 ? ad.image_urls : [];
  const mainImage = images[selectedImageIndex] || (images.length > 0 ? images[0] : null);

  return (
    <>
      <Navbar />
      <div style={{ background: '#f0f4f8', minHeight: '100vh', paddingBottom: '60px' }}>
        <div className="container" style={{ paddingTop: '30px' }}>
          {/* Breadcrumbs */}
          <div style={{ marginBottom: '20px', fontSize: '14px', color: '#666' }}>
            <Link href="/" style={{ color: '#0070f3' }}>Home</Link>
            {' / '}
            <Link href="/categories" style={{ color: '#0070f3' }}>{ad.category_name}</Link>
            {' / '}
            <span style={{ color: '#666' }}>{ad.title.length > 30 ? ad.title.substring(0, 30) + '...' : ad.title}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '60px' }}>
            {/* Left Column - Images */}
            <div>
              {mainImage && (
                <div style={{ 
                  position: 'relative',
                  marginBottom: '20px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  background: 'white',
                  padding: '10px'
                }}>
                  <img
                    src={mainImage}
                    alt={ad.title}
                    style={{
                      width: '100%',
                      height: '500px',
                      objectFit: 'contain',
                      borderRadius: '8px',
                      display: 'block'
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={() => setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
                        style={{
                          position: 'absolute',
                          left: '20px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'rgba(0,0,0,0.5)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '40px',
                          height: '40px',
                          cursor: 'pointer',
                          fontSize: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        ←
                      </button>
                      <button
                        onClick={() => setSelectedImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
                        style={{
                          position: 'absolute',
                          right: '20px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'rgba(0,0,0,0.5)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '40px',
                          height: '40px',
                          cursor: 'pointer',
                          fontSize: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        →
                      </button>
                    </>
                  )}
                </div>
              )}
              {images.length > 1 && (
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {images.map((url, idx) => (
                    <img
                      key={idx}
                      src={url}
                      alt={`${ad.title} - Thumbnail ${idx + 1}`}
                      onClick={() => setSelectedImageIndex(idx)}
                      style={{
                        width: '100px',
                        height: '100px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        border: selectedImageIndex === idx ? '3px solid #0070f3' : '2px solid #ddd',
                        opacity: selectedImageIndex === idx ? 1 : 0.7,
                        transition: 'all 0.2s'
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Right Column - Details */}
            <div>
              <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '15px', color: '#333' }}>
                {ad.title}
              </h1>
              <p style={{ color: '#666', marginBottom: '20px', fontSize: '14px' }}>
                Posted on: {formatDate(ad.created_at)}
              </p>
              {ad.price && (
                <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#0070f3', marginBottom: '30px' }}>
                  €{ad.price.toFixed(2)}
                </p>
              )}

              {/* Seller Info */}
              <div style={{ 
                background: 'white', 
                borderRadius: '12px', 
                padding: '20px', 
                marginBottom: '30px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                  <div style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    background: '#e0e0e0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px'
                  }}>
                    👤
                  </div>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '5px' }}>{ad.seller_name}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px', color: '#28a745' }}>
                      <span>✓</span>
                      <span>Verified Seller</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666', fontSize: '14px' }}>
                  <span>📍</span>
                  <span>{ad.location || 'Dublin, Ireland'}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '30px' }}>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`Hi, I'm interested in ${ad.title}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: '#25D366',
                    color: 'white',
                    padding: '14px 24px',
                    borderRadius: '8px',
                    textAlign: 'center',
                    fontWeight: '600',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    fontSize: '16px'
                  }}
                >
                  <span>💬</span>
                  Chat on WhatsApp
                </a>
                <button
                  onClick={() => setShowPhone(!showPhone)}
                  style={{
                    background: '#e0f2fe',
                    color: '#0070f3',
                    padding: '14px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    fontSize: '16px'
                  }}
                >
                  <span>📞</span>
                  {showPhone ? '+1 234 567 8900' : 'Show Phone Number'}
                </button>
              </div>

              {/* Description */}
              <div style={{ 
                background: 'white', 
                borderRadius: '12px', 
                padding: '24px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
              }}>
                <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '15px', color: '#333' }}>
                  Description
                </h2>
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8', color: '#555', fontSize: '15px' }}>
                  {ad.description || 'No description provided.'}
                </div>
              </div>
            </div>
          </div>

          {/* You might also like */}
          {relatedAds.length > 0 && (
            <div>
              <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '30px', color: '#333' }}>
                You might also like
              </h2>
              <div className="grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                {relatedAds.map((relatedAd) => (
                  <Link key={relatedAd.id} href={`/ads/${relatedAd.id}`}>
                    <div className="card" style={{ cursor: 'pointer', padding: '0', overflow: 'hidden' }}>
                      {relatedAd.image_urls && relatedAd.image_urls.length > 0 && (
                        <img
                          src={relatedAd.image_urls[0]}
                          alt={relatedAd.title}
                          style={{
                            width: '100%',
                            height: '180px',
                            objectFit: 'cover',
                            display: 'block'
                          }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      )}
                      <div style={{ padding: '16px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', color: '#333' }}>
                          {relatedAd.title}
                        </h3>
                        {relatedAd.price && (
                          <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#0070f3' }}>
                            €{relatedAd.price.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
