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
}

export default function AdDetailPage() {
  const params = useParams();
  const [ad, setAd] = useState<Ad | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchAd();
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

  return (
    <>
      <Navbar />
      <div className="container" style={{ paddingTop: '40px', paddingBottom: '40px' }}>
        <Link href="/" style={{ marginBottom: '20px', display: 'inline-block' }}>
          ← Back to listings
        </Link>
        <div className="card">
          <h1 style={{ marginBottom: '20px' }}>{ad.title}</h1>
          {ad.price && (
            <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#0070f3', marginBottom: '20px' }}>
              ${ad.price}
            </p>
          )}
          <p style={{ color: '#666', marginBottom: '20px' }}>Category: {ad.category_name}</p>
          <p style={{ color: '#999', marginBottom: '30px' }}>Posted by {ad.seller_name}</p>

          {ad.image_urls && ad.image_urls.length > 0 && (
            <div style={{ marginBottom: '30px' }}>
              {ad.image_urls.map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  alt={`${ad.title} - Image ${idx + 1}`}
                  style={{
                    width: '100%',
                    maxHeight: '500px',
                    objectFit: 'contain',
                    marginBottom: '10px',
                    borderRadius: '5px',
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ))}
            </div>
          )}

          {ad.video_url && (
            <div style={{ marginBottom: '30px' }}>
              <video
                src={ad.video_url}
                controls
                style={{ width: '100%', maxHeight: '500px', borderRadius: '5px' }}
              />
            </div>
          )}

          <div style={{ marginTop: '30px' }}>
            <h2 style={{ marginBottom: '15px' }}>Description</h2>
            <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{ad.description || 'No description provided.'}</p>
          </div>

          <div style={{ marginTop: '30px', padding: '20px', background: '#f5f5f5', borderRadius: '5px' }}>
            <h3 style={{ marginBottom: '10px' }}>Contact Seller</h3>
            <p>Email: {ad.seller_email}</p>
          </div>
        </div>
      </div>
    </>
  );
}

