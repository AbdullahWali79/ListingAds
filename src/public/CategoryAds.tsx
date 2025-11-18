import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  collection,
  onSnapshot,
  query,
  type Timestamp,
} from 'firebase/firestore'
import { db } from '../firebase'
import { formatRemainingDays, checkAndUpdateExpiredAds } from '../utils/adExpiration'

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
  expiresAt?: Date | Timestamp
  durationDays?: number
  isAdminPost?: boolean
}

interface Category {
  id: string
  name: string
  slug: string
  description?: string
}

const CategoryAds = () => {
  const { slug } = useParams<{ slug: string }>()
  const [category, setCategory] = useState<Category | null>(null)
  const [ads, setAds] = useState<Ad[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch category by slug
  useEffect(() => {
    if (!slug) return

    const categoriesQuery = query(collection(db, 'categories'))
    const unsubscribeCategories = onSnapshot(
      categoriesQuery,
      (snapshot) => {
        snapshot.forEach((doc) => {
          const data = doc.data()
          if (data.slug === slug) {
            setCategory({
              id: doc.id,
              name: data.name || '',
              slug: data.slug || '',
              description: data.description || '',
            } as Category)
          }
        })
      },
      (err) => {
        console.error('Error fetching category:', err)
      }
    )

    return () => unsubscribeCategories()
  }, [slug])

  // Check expired ads on mount
  useEffect(() => {
    checkAndUpdateExpiredAds()
  }, [])

  // Fetch ads for this category
  useEffect(() => {
    if (!category) return

    const adsQuery = query(collection(db, 'ads'))
    const unsubscribeAds = onSnapshot(
      adsQuery,
      (snapshot) => {
        const adsList: Ad[] = []
        snapshot.forEach((doc) => {
          const data = doc.data()
          if (
            data.isDeleted !== true &&
            data.status === 'approved' &&
            (data.categoryId === category.id || data.categorySlug === slug)
          ) {
            // Convert expiresAt if it's a Firestore Timestamp
            let expiresAt = data.expiresAt
            if (expiresAt && expiresAt.toDate) {
              expiresAt = expiresAt.toDate()
            } else if (expiresAt && expiresAt instanceof Date) {
              // Already a Date object
              expiresAt = expiresAt
            } else if (expiresAt && typeof expiresAt === 'object' && expiresAt.seconds) {
              // Firestore Timestamp object
              expiresAt = new Date(expiresAt.seconds * 1000)
            }
            
            adsList.push({
              id: doc.id,
              title: data.title || '',
              description: data.description || '',
              price: data.price || 0,
              categoryId: data.categoryId || '',
              categoryName: data.categoryName || category.name,
              categorySlug: data.categorySlug || category.slug,
              sellerName: data.sellerName || 'Unknown',
              status: data.status || 'pending',
              isDeleted: data.isDeleted || false,
              imageUrl: data.imageUrl || data.image || undefined,
              createdAt: data.createdAt,
              expiresAt: expiresAt,
              durationDays: data.durationDays,
              isAdminPost: data.isAdminPost === true, // Explicitly check for true
            } as Ad)
          }
        })

        // Sort by createdAt (newest first)
        adsList.sort((a, b) => {
          const timeA = a.createdAt?.toMillis() ?? 0
          const timeB = b.createdAt?.toMillis() ?? 0
          return timeB - timeA
        })

        setAds(adsList)
        setLoading(false)
      },
      (err) => {
        console.error('Error fetching ads:', err)
        setLoading(false)
      }
    )

    return () => unsubscribeAds()
  }, [category, slug])

  // Format price
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  if (!slug) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h1 style={{ color: '#333' }}>Category not found</h1>
          <Link to="/" style={{ color: '#007bff', textDecoration: 'none' }}>
            Go back to home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
      {/* Modern Breadcrumb */}
      <nav style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Link
          to="/"
          style={{
            color: '#667eea',
            textDecoration: 'none',
            fontSize: '0.9rem',
            fontWeight: '500',
          }}
        >
          Home
        </Link>
        <span style={{ color: '#999', fontSize: '0.9rem' }}>/</span>
        <span style={{ color: '#666', fontSize: '0.9rem', fontWeight: '500' }}>
          {category?.name || 'Category'}
        </span>
      </nav>

      {/* Modern Category Header */}
      {category && (
        <div style={{ 
          marginBottom: '3rem',
          padding: '2rem',
          background: 'linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%)',
          borderRadius: '20px',
          border: '1px solid rgba(102, 126, 234, 0.1)',
        }}>
          <h1
            style={{
              fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
              fontWeight: '800',
              color: '#1a1a1a',
              marginBottom: '0.75rem',
              letterSpacing: '-0.02em',
            }}
          >
            {category.name}
          </h1>
          {category.description && (
            <p style={{ fontSize: '1.1rem', color: '#666', margin: 0, lineHeight: '1.6' }}>
              {category.description}
            </p>
          )}
        </div>
      )}

      {/* Ads Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
          Loading ads...
        </div>
      ) : ads.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
          <p>No ads found in this category.</p>
          <Link
            to="/"
            style={{
              color: '#007bff',
              textDecoration: 'none',
              marginTop: '1rem',
              display: 'inline-block',
            }}
          >
            Browse other categories
          </Link>
        </div>
      ) : (
        <>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '2rem',
            padding: '1rem',
            backgroundColor: '#fff',
            borderRadius: '12px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
          }}>
            <p style={{ margin: 0, color: '#666', fontSize: '0.95rem', fontWeight: '500' }}>
              Found <strong style={{ color: '#667eea' }}>{ads.length}</strong> {ads.length === 1 ? 'ad' : 'ads'}
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  color: '#666',
                }}
              >
                🔍 Filters
              </button>
              <button
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  color: '#666',
                }}
              >
                Sort
              </button>
            </div>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {ads.map((ad) => (
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
                    borderRadius: '16px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                    border: '1px solid rgba(0,0,0,0.05)',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-8px)'
                    e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.12)'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.07)'
                  }}
                >
                  <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '8px 8px 0 0', minHeight: '200px' }}>
                    {/* Stickers/Badges */}
                    <div style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 100, display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end', pointerEvents: 'none' }}>
                      {ad.isAdminPost && (
                        <span
                          style={{
                            backgroundColor: '#ff6b35',
                            color: 'white',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '12px',
                            fontSize: '0.7rem',
                            fontWeight: '600',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                            textTransform: 'uppercase',
                            whiteSpace: 'nowrap',
                            pointerEvents: 'auto',
                          }}
                        >
                          Admin Post
                        </span>
                      )}
                      {ad.expiresAt && (
                        <span
                          style={{
                            backgroundColor: formatRemainingDays(ad.expiresAt) === 'Expired' ? '#dc3545' : '#28a745',
                            color: 'white',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '12px',
                            fontSize: '0.7rem',
                            fontWeight: '600',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                            whiteSpace: 'nowrap',
                            pointerEvents: 'auto',
                          }}
                        >
                          {formatRemainingDays(ad.expiresAt)}
                        </span>
                      )}
                    </div>
                    {ad.imageUrl ? (
                      <img
                        src={ad.imageUrl}
                        alt={ad.title}
                        style={{
                          width: '100%',
                          height: '200px',
                          objectFit: 'cover',
                          display: 'block',
                        }}
                        onError={(e) => {
                          // Fallback to default image if user image fails to load
                          e.currentTarget.src = 'https://raw.githubusercontent.com/AbdullahWali79/AbdullahImages/main/new.jpg'
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          height: '200px',
                          backgroundColor: '#e9ecef',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#999',
                          fontSize: '0.875rem',
                          position: 'relative',
                        }}
                      >
                        <img
                          src="https://raw.githubusercontent.com/AbdullahWali79/AbdullahImages/main/new.jpg"
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
                      </div>
                    )}
                  </div>
                  <div style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <h3
                        style={{
                          margin: 0,
                          fontSize: '1.1rem',
                          fontWeight: '700',
                          color: '#1a1a1a',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          flex: 1,
                          lineHeight: '1.4',
                        }}
                      >
                        {ad.title}
                      </h3>
                    </div>
                    <p
                      style={{
                        margin: '0 0 1rem 0',
                        fontSize: '0.875rem',
                        color: '#666',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        minHeight: '2.5rem',
                        lineHeight: '1.5',
                      }}
                    >
                      {ad.description}
                    </p>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingTop: '0.75rem',
                        borderTop: '1px solid #f0f0f0',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '1.5rem',
                          fontWeight: '800',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text',
                        }}
                      >
                        {formatPrice(ad.price)}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#999' }}>
                        <span>👤</span>
                        <span>{ad.sellerName}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default CategoryAds

