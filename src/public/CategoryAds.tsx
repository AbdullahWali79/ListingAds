import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  collection,
  onSnapshot,
  query,
  where,
  type Timestamp,
} from 'firebase/firestore'
import { db } from '../firebase'

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
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      {/* Breadcrumb */}
      <nav style={{ marginBottom: '2rem' }}>
        <Link
          to="/"
          style={{
            color: '#007bff',
            textDecoration: 'none',
            fontSize: '0.875rem',
          }}
        >
          Home
        </Link>
        <span style={{ margin: '0 0.5rem', color: '#666' }}>/</span>
        <span style={{ color: '#666', fontSize: '0.875rem' }}>
          {category?.name || 'Category'}
        </span>
      </nav>

      {/* Category Header */}
      {category && (
        <div style={{ marginBottom: '2rem' }}>
          <h1
            style={{
              fontSize: '2rem',
              fontWeight: '700',
              color: '#333',
              marginBottom: '0.5rem',
            }}
          >
            {category.name}
          </h1>
          {category.description && (
            <p style={{ fontSize: '1rem', color: '#666' }}>{category.description}</p>
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
          <p style={{ marginBottom: '1.5rem', color: '#666' }}>
            Found {ads.length} {ads.length === 1 ? 'ad' : 'ads'}
          </p>
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
                        {ad.sellerName}
                      </span>
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

