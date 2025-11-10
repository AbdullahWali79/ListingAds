'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { adApi } from '@/lib/api';

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

export default function Home() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async () => {
    try {
      const response = await adApi.getAll({ limit: 20 });
      setAds(response.data);
    } catch (error) {
      console.error('Failed to fetch ads:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container" style={{ paddingTop: '40px', paddingBottom: '40px' }}>
        <h1 style={{ marginBottom: '30px' }}>Latest Ads</h1>
        {loading ? (
          <p>Loading...</p>
        ) : ads.length === 0 ? (
          <p>No ads available</p>
        ) : (
          <div className="grid">
            {ads.map((ad) => (
              <Link key={ad.id} href={`/ads/${ad.id}`}>
                <div className="card" style={{ cursor: 'pointer' }}>
                  {ad.image_urls && ad.image_urls.length > 0 && (
                    <img
                      src={ad.image_urls[0]}
                      alt={ad.title}
                      style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '5px', marginBottom: '15px' }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                  <h3 style={{ marginBottom: '10px' }}>{ad.title}</h3>
                  {ad.price && <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#0070f3', marginBottom: '10px' }}>${ad.price}</p>}
                  <p style={{ color: '#666', marginBottom: '10px' }}>{ad.category_name}</p>
                  <p style={{ color: '#999', fontSize: '14px' }}>By {ad.seller_name}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

