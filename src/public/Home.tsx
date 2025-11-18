import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  collection,
  onSnapshot,
  query,
  type Timestamp,
} from 'firebase/firestore'
import { db } from '../firebase'
import { formatRemainingDays, checkAndUpdateExpiredAds } from '../utils/adExpiration'

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
  expiresAt?: Date | Timestamp
  durationDays?: number
  isAdminPost?: boolean
}

const Home = () => {
  const [categories, setCategories] = useState<Category[]>([])
  const [recentAds, setRecentAds] = useState<Ad[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [adsLoading, setAdsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch categories
  useEffect(() => {
    console.log('Setting up categories listener...')
    console.log('Firebase db object:', db)
    setCategoriesLoading(true)
    
    // Verify db is available
    if (!db) {
      console.error('Firestore db is not initialized')
      setCategoriesLoading(false)
      return
    }

    // Use onSnapshot for real-time updates
    try {
      const categoriesQuery = query(collection(db, 'categories'))
      console.log('Setting up categories onSnapshot listener...')
      
      const unsubscribeCategories = onSnapshot(
        categoriesQuery,
        (snapshot) => {
          console.log('✅ Categories snapshot received!', {
            size: snapshot.size,
            empty: snapshot.empty,
          })
          
          const categoriesList: Category[] = []
          snapshot.forEach((doc) => {
            const data = doc.data()
            console.log('📁 Category found:', doc.id, data.name, 'isActive:', data.isActive)
            const isActive = data.isActive === undefined ? true : data.isActive
            if (isActive !== false) {
              categoriesList.push({
                id: doc.id,
                name: data.name || '',
                slug: data.slug || '',
                description: data.description || '',
                isActive: isActive,
              } as Category)
            }
          })
          console.log('✅ Categories loaded:', categoriesList.length, 'out of', snapshot.size)
          setCategories(categoriesList)
          setCategoriesLoading(false)
        },
        (err) => {
          console.error('❌ ERROR fetching categories:', err)
          console.error('Error code:', err.code)
          console.error('Error message:', err.message)
          if (err.code === 'permission-denied') {
            console.error('🔒 PERMISSION DENIED - Check Firestore security rules!')
            console.error('Rules should allow: allow read: if true; for categories')
          }
          setCategoriesLoading(false)
        }
      )

      return () => {
        console.log('Unsubscribing from categories')
        unsubscribeCategories()
      }
    } catch (err: any) {
      console.error('❌ Failed to setup categories listener:', err)
      setCategoriesLoading(false)
    }
  }, [])

  // Check expired ads on mount
  useEffect(() => {
    checkAndUpdateExpiredAds()
    // Check every 5 minutes
    const interval = setInterval(() => {
      checkAndUpdateExpiredAds()
    }, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  // Fetch recent approved ads
  useEffect(() => {
    console.log('Setting up ads listener...')
    console.log('Firebase db object:', db)
    setAdsLoading(true)
    
    // Verify db is available
    if (!db) {
      console.error('Firestore db is not initialized')
      setAdsLoading(false)
      return
    }

    // Use onSnapshot for real-time updates
    try {
      const adsQuery = query(collection(db, 'ads'))
      console.log('Setting up ads onSnapshot listener...')
      
      const unsubscribeAds = onSnapshot(
        adsQuery,
        (snapshot) => {
          console.log('✅ Ads snapshot received!', {
            size: snapshot.size,
            empty: snapshot.empty,
          })
          
          const adsList: Ad[] = []
          snapshot.forEach((doc) => {
            const data = doc.data()
            const isDeleted = data.isDeleted === true
            const status = data.status || 'pending'
            const isApproved = status === 'approved'
            
            console.log('📄 Ad found:', doc.id, {
              title: data.title,
              status: status,
              isDeleted: isDeleted,
              isApproved: isApproved
            })
            
            if (!isDeleted && isApproved) {
              let expiresAt = data.expiresAt
              if (expiresAt && expiresAt.toDate) {
                expiresAt = expiresAt.toDate()
              } else if (expiresAt && expiresAt instanceof Date) {
                expiresAt = expiresAt
              } else if (expiresAt && typeof expiresAt === 'object' && expiresAt.seconds) {
                expiresAt = new Date(expiresAt.seconds * 1000)
              }
              
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
                expiresAt: expiresAt,
                durationDays: data.durationDays,
                isAdminPost: data.isAdminPost === true,
              } as Ad)
            } else {
              console.log('⏭️ Ad skipped:', doc.id, isDeleted ? '(deleted)' : '(not approved)')
            }
          })

          adsList.sort((a, b) => {
            const timeA = a.createdAt?.toMillis() ?? 0
            const timeB = b.createdAt?.toMillis() ?? 0
            return timeB - timeA
          })

          console.log('✅ Ads loaded:', adsList.length, 'approved out of', snapshot.size, 'total')
          setRecentAds(adsList.slice(0, 12))
          setAdsLoading(false)
        },
        (err) => {
          console.error('❌ ERROR fetching ads:', err)
          console.error('Error code:', err.code)
          console.error('Error message:', err.message)
          if (err.code === 'permission-denied') {
            console.error('🔒 PERMISSION DENIED - Check Firestore security rules!')
            console.error('Rules should allow: allow read: if resource.data.status == "approved" && resource.data.isDeleted != true;')
          }
          setAdsLoading(false)
        }
      )

      return () => {
        console.log('Unsubscribing from ads')
        unsubscribeAds()
      }
    } catch (err: any) {
      console.error('❌ Failed to setup ads listener:', err)
      setAdsLoading(false)
    }
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
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0' }}>
      {/* Modern Hero Section */}
      <div
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '4rem 2rem',
          marginBottom: '3rem',
          borderRadius: '0 0 30px 30px',
          color: 'white',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1
            style={{
              fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              fontWeight: '800',
              marginBottom: '1rem',
              textShadow: '0 2px 10px rgba(0,0,0,0.2)',
              letterSpacing: '-0.02em',
            }}
          >
            Sell, Buy and Donate Anything
          </h1>
          <p style={{ 
            fontSize: 'clamp(1rem, 2vw, 1.3rem)', 
            marginBottom: '2.5rem',
            opacity: 0.95,
            maxWidth: '600px',
            margin: '0 auto 2.5rem auto',
          }}>
            Browse thousands of classified ads in your area. Buy, sell, or trade with confidence.
          </p>
          
          {/* Search Bar */}
          <div style={{ 
            maxWidth: '600px', 
            margin: '0 auto',
            display: 'flex',
            gap: '0.5rem',
            backgroundColor: 'rgba(255,255,255,0.95)',
            borderRadius: '50px',
            padding: '0.5rem',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
          }}>
            <input
              type="text"
              placeholder="Search for products, services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                padding: '0.75rem 1.5rem',
                fontSize: '1rem',
                borderRadius: '50px',
                backgroundColor: 'transparent',
              }}
            />
            <button
              style={{
                padding: '0.75rem 2rem',
                backgroundColor: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '50px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s',
                whiteSpace: 'nowrap',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#5568d3'
                e.currentTarget.style.transform = 'scale(1.05)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#667eea'
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              Search
            </button>
          </div>
        </div>
        {/* Decorative circles */}
        <div style={{
          position: 'absolute',
          top: '-50px',
          right: '-50px',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          backgroundColor: 'rgba(255,255,255,0.1)',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-30px',
          left: '-30px',
          width: '150px',
          height: '150px',
          borderRadius: '50%',
          backgroundColor: 'rgba(255,255,255,0.1)',
        }} />
      </div>

      <div style={{ padding: '0 2rem' }}>

      {/* Categories Section */}
      <section style={{ marginBottom: '4rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2
            style={{
              fontSize: 'clamp(1.5rem, 3vw, 2rem)',
              fontWeight: '700',
              color: '#1a1a1a',
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            Browse by Category
          </h2>
          <Link
            to="/"
            style={{
              color: '#667eea',
              textDecoration: 'none',
              fontSize: '0.95rem',
              fontWeight: '600',
            }}
          >
            View All →
          </Link>
        </div>
        {categoriesLoading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            Loading categories...
          </div>
        ) : categories.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            <p style={{ margin: 0, marginBottom: '0.5rem' }}>No categories available</p>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#999' }}>
              Please add categories from the admin panel
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
              gap: '0.75rem',
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
                    padding: '1rem 0.75rem',
                    borderRadius: '12px',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.06)',
                    textAlign: 'center',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'pointer',
                    border: '1px solid rgba(0,0,0,0.05)',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100px',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px) scale(1.05)'
                    e.currentTarget.style.boxShadow = '0 8px 16px rgba(102, 126, 234, 0.15)'
                    e.currentTarget.style.borderColor = '#667eea'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)'
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.06)'
                    e.currentTarget.style.borderColor = 'rgba(0,0,0,0.05)'
                  }}
                >
                  {/* Mini Category Icon */}
                  <div style={{
                    width: '40px',
                    height: '40px',
                    margin: '0 auto 0.5rem auto',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1rem',
                    color: 'white',
                    fontWeight: '700',
                    flexShrink: 0,
                  }}>
                    {category.name.charAt(0).toUpperCase()}
                  </div>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      color: '#1a1a1a',
                      lineHeight: '1.3',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      wordBreak: 'break-word',
                    }}
                  >
                    {category.name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Recent Ads Section */}
      <section style={{ marginBottom: '4rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2
            style={{
              fontSize: 'clamp(1.5rem, 3vw, 2rem)',
              fontWeight: '700',
              color: '#1a1a1a',
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            Recent Listings
          </h2>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
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
        {adsLoading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            Loading ads...
          </div>
        ) : recentAds.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            <p style={{ margin: 0, marginBottom: '0.5rem' }}>No ads available yet</p>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#999' }}>
              Be the first to post an ad!
            </p>
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
                      <span
                        style={{
                          fontSize: '0.75rem',
                          color: '#667eea',
                          backgroundColor: '#f0f4ff',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '6px',
                          fontWeight: '600',
                          marginLeft: '0.5rem',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {ad.categoryName}
                      </span>
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
        )}
      </section>
      </div>
    </div>
  )
}

export default Home

