import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  collection,
  onSnapshot,
  query,
  where,
  type Timestamp,
} from 'firebase/firestore'
import { db } from '../firebase'

interface Category {
  id: string
  name: string
  slug: string
  description?: string
  isActive: boolean
}

interface Ad {
  id: string
  title: string
  description: string
  price: number
  categoryId: string
  categoryName: string
  categorySlug?: string
  sellerName: string
  status: 'pending' | 'approved' | 'rejected'
  isDeleted: boolean
  imageUrl?: string
  createdAt?: Timestamp
}

const Home = () => {
  const [categories, setCategories] = useState<Category[]>([])
  const [recentAds, setRecentAds] = useState<Ad[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch categories
  useEffect(() => {
    const categoriesQuery = query(collection(db, 'categories'))
    const unsubscribeCategories = onSnapshot(
      categoriesQuery,
      (snapshot) => {
        const categoriesList: Category[] = []
        snapshot.forEach((doc) => {
          const data = doc.data()
          if (data.isActive !== false) {
            categoriesList.push({
              id: doc.id,
              name: data.name || '',
              slug: data.slug || '',
              description: data.description || '',
              isActive: data.isActive !== undefined ? data.isActive : true,
            } as Category)
          }
        })
        setCategories(categoriesList)
      },
      (err) => {
        console.error('Error fetching categories:', err)
      }
    )

    return () => unsubscribeCategories()
  }, [])

  // Fetch recent approved ads
  useEffect(() => {
    const adsQuery = query(collection(db, 'ads'))
    const unsubscribeAds = onSnapshot(
      adsQuery,
      (snapshot) => {
        const adsList: Ad[] = []
        snapshot.forEach((doc) => {
          const data = doc.data()
          if (
            data.isDeleted !== true &&
            data.status === 'approved'
          ) {
            adsList.push({
              id: doc.id,
              title: data.title || '',
              description: data.description || '',
              price: data.price || 0,
              categoryId: data.categoryId || '',
              categoryName: data.categoryName || 'Unknown',
              categorySlug: data.categorySlug || '',
              sellerName: data.sellerName || 'Unknown',
              status: data.status || 'pending',
              isDeleted: data.isDeleted || false,
              imageUrl: data.imageUrl || data.image || undefined,
              createdAt: data.createdAt,
            } as Ad)
          }
        })

        // Sort by createdAt (newest first) and take first 12
        adsList.sort((a, b) => {
          const timeA = a.createdAt?.toMillis() ?? 0
          const timeB = b.createdAt?.toMillis() ?? 0
          return timeB - timeA
        })

        setRecentAds(adsList.slice(0, 12))
        setLoading(false)
      },
      (err) => {
        console.error('Error fetching ads:', err)
        setLoading(false)
      }
    )

    return () => unsubscribeAds()
  }, [])

  // Format price
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      {/* Hero Section */}
      <div
        style={{
          textAlign: 'center',
          padding: '3rem 0',
          marginBottom: '3rem',
        }}
      >
        <h1
          style={{
            fontSize: '2.5rem',
            fontWeight: '700',
            color: '#333',
            marginBottom: '1rem',
          }}
        >
          Find Everything You Need
        </h1>
        <p style={{ fontSize: '1.2rem', color: '#666', marginBottom: '2rem' }}>
          Browse thousands of classified ads in your area
        </p>
      </div>

      {/* Categories Section */}
      <section style={{ marginBottom: '3rem' }}>
        <h2
          style={{
            fontSize: '1.75rem',
            fontWeight: '600',
            color: '#333',
            marginBottom: '1.5rem',
          }}
        >
          Browse by Category
        </h2>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            Loading categories...
          </div>
        ) : categories.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            No categories available
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '1rem',
            }}
          >
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/category/${category.slug}`}
                style={{
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <div
                  style={{
                    backgroundColor: '#fff',
                    padding: '1.5rem',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                    textAlign: 'center',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    cursor: 'pointer',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)'
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <h3
                    style={{
                      margin: 0,
                      fontSize: '1.1rem',
                      fontWeight: '600',
                      color: '#333',
                    }}
                  >
                    {category.name}
                  </h3>
                  {category.description && (
                    <p
                      style={{
                        margin: '0.5rem 0 0 0',
                        fontSize: '0.875rem',
                        color: '#666',
                      }}
                    >
                      {category.description}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Recent Ads Section */}
      <section>
        <h2
          style={{
            fontSize: '1.75rem',
            fontWeight: '600',
            color: '#333',
            marginBottom: '1.5rem',
          }}
        >
          Recent Listings
        </h2>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            Loading ads...
          </div>
        ) : recentAds.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            No ads available yet
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {recentAds.map((ad) => (
              <Link
                key={ad.id}
                to={`/ad/${ad.id}`}
                style={{
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <div
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                    overflow: 'hidden',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    cursor: 'pointer',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)'
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  {ad.imageUrl ? (
                    <img
                      src={ad.imageUrl}
                      alt={ad.title}
                      style={{
                        width: '100%',
                        height: '200px',
                        objectFit: 'cover',
                      }}
                      onError={(e) => {
                        // Fallback to placeholder if image fails to load
                        e.currentTarget.style.display = 'none'
                        const placeholder = e.currentTarget.nextElementSibling as HTMLElement
                        if (placeholder) {
                          placeholder.style.display = 'flex'
                          const placeholderImg = placeholder.querySelector('img')
                          if (placeholderImg) placeholderImg.style.display = 'block'
                        }
                      }}
                    />
                  ) : null}
                  <div
                    style={{
                      height: '200px',
                      backgroundColor: '#e9ecef',
                      display: ad.imageUrl ? 'none' : 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#999',
                      fontSize: '0.875rem',
                      position: 'relative',
                    }}
                  >
                    {!ad.imageUrl && (
                      <img
                        src={`https://picsum.photos/400/300?random=${ad.id}`}
                        alt={ad.title}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                        }}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                          const placeholder = e.currentTarget.parentElement
                          if (placeholder) {
                            placeholder.innerHTML = 'No Image'
                            placeholder.style.display = 'flex'
                          }
                        }}
                      />
                    )}
                    {!ad.imageUrl && <span style={{ position: 'relative', zIndex: 1, display: 'none' }}>No Image</span>}
                  </div>
                  <div style={{ padding: '1rem' }}>
                    <h3
                      style={{
                        margin: '0 0 0.5rem 0',
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        color: '#333',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {ad.title}
                    </h3>
                    <p
                      style={{
                        margin: '0 0 0.5rem 0',
                        fontSize: '0.875rem',
                        color: '#666',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        minHeight: '2.5rem',
                      }}
                    >
                      {ad.description}
                    </p>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: '0.75rem',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '1.25rem',
                          fontWeight: '700',
                          color: '#007bff',
                        }}
                      >
                        {formatPrice(ad.price)}
                      </span>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          color: '#999',
                        }}
                      >
                        {ad.categoryName}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default Home

