'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { categoryApi, adApi } from '@/lib/api';

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface Ad {
  id: number;
  title: string;
  price: number;
  image_urls: string[];
  category_name: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchAdsByCategory();
    } else {
      setAds([]);
    }
  }, [selectedCategory]);

  const fetchCategories = async () => {
    try {
      const response = await categoryApi.getAll();
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdsByCategory = async () => {
    try {
      const response = await adApi.getAll({ category_id: selectedCategory! });
      setAds(response.data);
    } catch (error) {
      console.error('Failed to fetch ads:', error);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container" style={{ paddingTop: '40px', paddingBottom: '40px' }}>
        <h1 style={{ marginBottom: '30px' }}>Categories</h1>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '40px' }}>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className="btn"
                style={{
                  background: selectedCategory === category.id ? '#0070f3' : '#f0f0f0',
                  color: selectedCategory === category.id ? 'white' : 'black',
                }}
              >
                {category.name}
              </button>
            ))}
          </div>
        )}

        {selectedCategory && (
          <div>
            <h2 style={{ marginBottom: '20px' }}>
              {categories.find((c) => c.id === selectedCategory)?.name} Ads
            </h2>
            {ads.length === 0 ? (
              <p>No ads in this category</p>
            ) : (
              <div className="grid">
                {ads.map((ad) => (
                  <Link key={ad.id} href={`/ads/${ad.id}`}>
                    <div className="card" style={{ cursor: 'pointer' }}>
                      {ad.image_urls && ad.image_urls.length > 0 && (
                        <img
                          src={ad.image_urls[0]}
                          alt={ad.title}
                          style={{
                            width: '100%',
                            height: '200px',
                            objectFit: 'cover',
                            borderRadius: '5px',
                            marginBottom: '15px',
                          }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      )}
                      <h3 style={{ marginBottom: '10px' }}>{ad.title}</h3>
                      {ad.price && (
                        <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#0070f3' }}>
                          ${ad.price}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

