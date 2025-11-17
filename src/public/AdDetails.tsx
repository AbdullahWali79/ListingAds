import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { doc, onSnapshot, type Timestamp } from 'firebase/firestore'
import { db } from '../firebase'

interface Ad {
  id: string
  title: string
  description: string
  price: number
  categoryId: string
  categoryName: string
  categorySlug?: string
  sellerId: string
  sellerName: string
  sellerEmail: string
  status: 'pending' | 'approved' | 'rejected'
  isDeleted: boolean
  imageUrl?: string
  createdAt?: Timestamp
}

const AdDetails = () => {
  const { adId } = useParams<{ adId: string }>()
  const [ad, setAd] = useState<Ad | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!adId) {
      setError('Ad ID is required')
      setLoading(false)
      return
    }

    const adDocRef = doc(db, 'ads', adId)
    const unsubscribe = onSnapshot(
      adDocRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setError('Ad not found')
          setLoading(false)
          return
        }

        const data = snapshot.data()
        
        // Only show approved and non-deleted ads
        if (data.isDeleted === true || data.status !== 'approved') {
          setError('Ad not available')
          setLoading(false)
          return
        }

        setAd({
          id: snapshot.id,
          title: data.title || '',
          description: data.description || '',
          price: data.price || 0,
          categoryId: data.categoryId || '',
          categoryName: data.categoryName || 'Unknown',
          categorySlug: data.categorySlug || '',
          sellerId: data.sellerId || '',
          sellerName: data.sellerName || 'Unknown',
          sellerEmail: data.sellerEmail || '',
          status: data.status || 'pending',
          isDeleted: data.isDeleted || false,
          imageUrl: data.imageUrl || data.image || undefined,
          createdAt: data.createdAt,
        } as Ad)
        setLoading(false)
        setError(null)
      },
      (err) => {
        console.error('Error fetching ad:', err)
        setError('Failed to load ad')
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [adId])

  // Format price
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  // Format date
  const formatDate = (timestamp?: Timestamp): string => {
    if (!timestamp) return '-'
    const date = timestamp.toDate()
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
          Loading ad details...
        </div>
      </div>
    )
  }

  if (error || !ad) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h1 style={{ color: '#333', marginBottom: '1rem' }}>{error || 'Ad not found'}</h1>
          <Link
            to="/"
            style={{
              color: '#007bff',
              textDecoration: 'none',
              fontSize: '1rem',
            }}
          >
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
        {ad.categorySlug && (
          <>
            <span style={{ margin: '0 0.5rem', color: '#666' }}>/</span>
            <Link
              to={`/category/${ad.categorySlug}`}
              style={{
                color: '#007bff',
                textDecoration: 'none',
                fontSize: '0.875rem',
              }}
            >
              {ad.categoryName}
            </Link>
          </>
        )}
        <span style={{ margin: '0 0.5rem', color: '#666' }}>/</span>
        <span style={{ color: '#666', fontSize: '0.875rem' }}>{ad.title}</span>
      </nav>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 400px',
          gap: '2rem',
        }}
      >
        {/* Main Content */}
        <div>
          {/* Image */}
          {ad.imageUrl ? (
            <img
              src={ad.imageUrl}
              alt={ad.title}
              style={{
                width: '100%',
                height: '400px',
                objectFit: 'cover',
                borderRadius: '8px',
                marginBottom: '2rem',
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
              width: '100%',
              height: '400px',
              backgroundColor: '#e9ecef',
              borderRadius: '8px',
              display: ad.imageUrl ? 'none' : 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#999',
              fontSize: '1rem',
              marginBottom: '2rem',
              position: 'relative',
            }}
          >
            {!ad.imageUrl && (
              <img
                src={`https://picsum.photos/800/600?random=${ad.id}`}
                alt={ad.title}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: '8px',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                  const placeholder = e.currentTarget.parentElement
                  if (placeholder) {
                    placeholder.innerHTML = 'No Image Available'
                    placeholder.style.display = 'flex'
                  }
                }}
              />
            )}
            {!ad.imageUrl && <span style={{ position: 'relative', zIndex: 1, display: 'none' }}>No Image Available</span>}
          </div>

          {/* Title */}
          <h1
            style={{
              fontSize: '2rem',
              fontWeight: '700',
              color: '#333',
              marginBottom: '1rem',
            }}
          >
            {ad.title}
          </h1>

          {/* Description */}
          <div style={{ marginBottom: '2rem' }}>
            <h2
              style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#333',
                marginBottom: '0.75rem',
              }}
            >
              Description
            </h2>
            <p
              style={{
                fontSize: '1rem',
                color: '#666',
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap',
              }}
            >
              {ad.description}
            </p>
          </div>

          {/* Additional Info */}
          <div
            style={{
              padding: '1.5rem',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
            }}
          >
            <h3
              style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: '#333',
                marginBottom: '1rem',
              }}
            >
              Details
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div>
                <strong style={{ color: '#666' }}>Category:</strong>{' '}
                {ad.categorySlug ? (
                  <Link
                    to={`/category/${ad.categorySlug}`}
                    style={{
                      color: '#007bff',
                      textDecoration: 'none',
                    }}
                  >
                    {ad.categoryName}
                  </Link>
                ) : (
                  <span>{ad.categoryName}</span>
                )}
              </div>
              <div>
                <strong style={{ color: '#666' }}>Posted:</strong>{' '}
                <span>{formatDate(ad.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div>
          <div
            style={{
              backgroundColor: '#fff',
              padding: '2rem',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              position: 'sticky',
              top: '2rem',
            }}
          >
            {/* Price */}
            <div style={{ marginBottom: '2rem' }}>
              <div
                style={{
                  fontSize: '2.5rem',
                  fontWeight: '700',
                  color: '#007bff',
                  marginBottom: '0.5rem',
                }}
              >
                {formatPrice(ad.price)}
              </div>
            </div>

            {/* Contact Seller */}
            <div style={{ marginBottom: '2rem' }}>
              <h3
                style={{
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  color: '#333',
                  marginBottom: '1rem',
                }}
              >
                Seller Information
              </h3>
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '1rem', fontWeight: '500', color: '#333' }}>
                  {ad.sellerName}
                </div>
                <div
                  style={{
                    fontSize: '0.875rem',
                    color: '#666',
                    marginTop: '0.25rem',
                  }}
                >
                  {ad.sellerEmail}
                </div>
              </div>
              <button
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#218838'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#28a745'
                }}
                onClick={() => {
                  window.location.href = `mailto:${ad.sellerEmail}?subject=Inquiry about ${ad.title}`
                }}
              >
                Contact Seller
              </button>
            </div>

            {/* Report Ad */}
            <div
              style={{
                paddingTop: '1.5rem',
                borderTop: '1px solid #e0e0e0',
              }}
            >
              <button
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  backgroundColor: 'transparent',
                  color: '#dc3545',
                  border: '1px solid #dc3545',
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
                onClick={() => {
                  alert('Report functionality coming soon')
                }}
              >
                Report this ad
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdDetails

