import { useState, useEffect, FormEvent } from 'react'
import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  orderBy,
  updateDoc,
  addDoc,
  serverTimestamp,
  type Timestamp,
} from 'firebase/firestore'
import { db } from '../firebase'
import { useAuthContext } from '../context/AuthContext'

interface Ad {
  id: string
  title: string
  description: string
  price: number
  categoryId: string
  categoryName: string
  sellerId: string
  sellerName: string
  sellerEmail: string
  status: 'pending' | 'approved' | 'rejected'
  rejectionReason?: string | null
  isDeleted: boolean
  imageUrl?: string
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected'

interface Category {
  id: string
  name: string
  slug: string
  isActive: boolean
}

const Ads = () => {
  const { firebaseUser, userDoc } = useAuthContext()
  const [ads, setAds] = useState<Ad[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [imageUrlInputs, setImageUrlInputs] = useState<{ [key: string]: string }>({})
  const [loadingImages, setLoadingImages] = useState<{ [key: string]: boolean }>({})
  const [showImageModal, setShowImageModal] = useState(false)
  const [selectedAdForImage, setSelectedAdForImage] = useState<Ad | null>(null)
  
  // Create Ad Modal States
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createAdLoading, setCreateAdLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [newAd, setNewAd] = useState({
    title: '',
    description: '',
    price: '',
    categoryId: '',
    imageUrl: '',
  })

  // Format date
  const formatDate = (timestamp?: Timestamp): string => {
    if (!timestamp) return '-'
    const date = timestamp.toDate()
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Format price
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price)
  }

  // Real-time ads list with filter
  useEffect(() => {
    setLoading(true)
    setError(null)

    // Use simple query without orderBy to avoid index requirement
    // We'll filter and sort manually in JavaScript
    const adsQuery = query(collection(db, 'ads'))

    const unsubscribe = onSnapshot(
      adsQuery,
      (snapshot) => {
        const adsList: Ad[] = []
        snapshot.forEach((doc) => {
          const data = doc.data()
          // Filter out deleted ads
          if (data.isDeleted !== true) {
            adsList.push({
              id: doc.id,
              title: data.title || '',
              description: data.description || '',
              price: data.price || 0,
              categoryId: data.categoryId || '',
              categoryName: data.categoryName || 'Unknown',
              sellerId: data.sellerId || '',
              sellerName: data.sellerName || 'Unknown',
              sellerEmail: data.sellerEmail || '',
              status: data.status || 'pending',
              rejectionReason: data.rejectionReason || null,
              isDeleted: data.isDeleted || false,
              imageUrl: data.imageUrl || data.image || undefined,
              createdAt: data.createdAt,
              updatedAt: data.updatedAt,
            } as Ad)
          }
        })

        // Filter by status if needed
        const filteredAds = statusFilter === 'all' 
          ? adsList 
          : adsList.filter(ad => ad.status === statusFilter)

        // Sort manually by createdAt (newest first)
        filteredAds.sort((a, b) => {
          const timeA = a.createdAt?.toMillis() ?? 0
          const timeB = b.createdAt?.toMillis() ?? 0
          return timeB - timeA // Newest first
        })

        setAds(filteredAds)
        setLoading(false)
        setError(null)
      },
      (err: any) => {
        console.error('Error fetching ads:', err)
        if (err.code === 'permission-denied') {
          setError('Permission denied. Please check Firestore security rules.')
        } else {
          setError(`Failed to load ads: ${err.message || 'Unknown error'}`)
        }
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [statusFilter])

  // Fetch categories for create ad form
  useEffect(() => {
    const categoriesQuery = query(collection(db, 'categories'))
    const unsubscribe = onSnapshot(
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
              isActive: data.isActive !== undefined ? data.isActive : true,
            })
          }
        })
        setCategories(categoriesList)
      },
      (err) => {
        console.error('Error fetching categories:', err)
      }
    )
    return () => unsubscribe()
  }, [])

  // Convert GitHub blob URL to raw URL
  const convertGitHubUrl = (url: string): string => {
    if (!url) return url
    // Convert blob URL to raw URL
    url = url.replace('github.com', 'raw.githubusercontent.com')
    url = url.replace('/blob/', '/')
    return url.trim()
  }

  // Load and validate image URL
  const handleLoadImage = async (adId: string, url: string) => {
    if (!url || !url.trim()) {
      setError('Please enter an image URL')
      return
    }

    setLoadingImages({ ...loadingImages, [adId]: true })
    setError(null)

    try {
      // Convert GitHub blob URL to raw URL if needed
      let imageUrl = convertGitHubUrl(url)

      // Validate URL format
      try {
        new URL(imageUrl)
      } catch {
        setError('Invalid URL format')
        setLoadingImages({ ...loadingImages, [adId]: false })
        return
      }

      // Test if image loads
      const img = new Image()
      const imageLoadPromise = new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error('Image failed to load'))
        img.src = imageUrl
      })

      // Wait for image to load (with timeout)
      await Promise.race([
        imageLoadPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Image load timeout')), 10000))
      ])

      // If image loaded successfully, save to Firestore
      await updateDoc(doc(db, 'ads', adId), {
        imageUrl: imageUrl,
        updatedAt: serverTimestamp(),
      })

      // Update input state
      setImageUrlInputs({
        ...imageUrlInputs,
        [adId]: imageUrl,
      })

      setError(null)
    } catch (err: any) {
      console.error('Error loading image:', err)
      const errorMsg = err.message || 'Failed to load image. Please check the URL.'
      setError(errorMsg)
      
      // If it's a GitHub blob URL, suggest raw URL
      if (url.includes('github.com') && url.includes('/blob/')) {
        const rawUrl = convertGitHubUrl(url)
        setError(`Image load failed. Try using raw URL: ${rawUrl}`)
      }
    } finally {
      setLoadingImages({ ...loadingImages, [adId]: false })
    }
  }

  // Create Ad Handler
  const handleCreateAd = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!newAd.title.trim()) {
      setError('Title is required')
      return
    }
    if (!newAd.description.trim()) {
      setError('Description is required')
      return
    }
    const priceNum = parseFloat(newAd.price)
    if (!newAd.price || isNaN(priceNum) || priceNum <= 0) {
      setError('Please enter a valid price')
      return
    }
    if (!newAd.categoryId) {
      setError('Please select a category')
      return
    }
    if (!firebaseUser || !userDoc) {
      setError('User not found')
      return
    }

    setCreateAdLoading(true)

    try {
      const selectedCategory = categories.find(cat => cat.id === newAd.categoryId)
      if (!selectedCategory) {
        setError('Selected category not found')
        setCreateAdLoading(false)
        return
      }

      // Create ad with approved status (admin doesn't need payment)
      await addDoc(collection(db, 'ads'), {
        title: newAd.title.trim(),
        description: newAd.description.trim(),
        price: priceNum,
        categoryId: newAd.categoryId,
        categoryName: selectedCategory.name,
        categorySlug: selectedCategory.slug,
        sellerId: firebaseUser.uid,
        sellerName: userDoc.name || firebaseUser.displayName || 'Admin',
        sellerEmail: userDoc.email || firebaseUser.email || '',
        status: 'approved', // Admin ads are auto-approved
        isDeleted: false,
        imageUrl: newAd.imageUrl.trim() || null,
        isAdminPost: true, // Mark as admin post
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      // Reset form and close modal
      setNewAd({
        title: '',
        description: '',
        price: '',
        categoryId: '',
        imageUrl: '',
      })
      setShowCreateModal(false)
      setError(null)
    } catch (err: any) {
      console.error('Error creating ad:', err)
      setError(err.message || 'Failed to create ad')
    } finally {
      setCreateAdLoading(false)
    }
  }

  // Approve ad
  const handleApprove = async (id: string) => {
    try {
      await updateDoc(doc(db, 'ads', id), {
        status: 'approved',
        rejectionReason: null,
        updatedAt: serverTimestamp(),
      })
      setError(null)
    } catch (err: any) {
      console.error('Error approving ad:', err)
      setError(err.message || 'Failed to approve ad')
    }
  }

  // Open reject modal
  const handleRejectClick = (ad: Ad) => {
    setSelectedAd(ad)
    setRejectReason(ad.rejectionReason || '')
    setShowRejectModal(true)
  }

  // Close reject modal
  const handleCloseRejectModal = () => {
    setShowRejectModal(false)
    setSelectedAd(null)
    setRejectReason('')
  }

  // Reject ad
  const handleReject = async () => {
    if (!selectedAd) return

    try {
      await updateDoc(doc(db, 'ads', selectedAd.id), {
        status: 'rejected',
        rejectionReason: rejectReason.trim() || null,
        updatedAt: serverTimestamp(),
      })
      handleCloseRejectModal()
      setError(null)
    } catch (err: any) {
      console.error('Error rejecting ad:', err)
      setError(err.message || 'Failed to reject ad')
    }
  }

  // Soft delete ad
  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) {
      return
    }

    try {
      await updateDoc(doc(db, 'ads', id), {
        isDeleted: true,
        status: 'rejected',
        updatedAt: serverTimestamp(),
      })
      setError(null)
    } catch (err: any) {
      console.error('Error deleting ad:', err)
      setError(err.message || 'Failed to delete ad')
    }
  }

  // Add sample ads
  const handleAddSampleAds = async () => {
    if (!window.confirm('Add 5 sample ads for testing? This will create ads with different statuses.')) {
      return
    }

    setError(null)
    const sampleAds = [
      {
        title: 'iPhone 15 Pro Max - Brand New',
        description: 'Brand new iPhone 15 Pro Max, 256GB, Titanium Blue. Still in sealed box. Never used. Comes with all accessories.',
        price: 1199,
        categoryId: 'electronics',
        categoryName: 'Electronics',
        sellerId: 'seller1',
        sellerName: 'John Smith',
        sellerEmail: 'john.smith@example.com',
        status: 'pending' as const,
        isDeleted: false,
        imageUrl: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400',
      },
      {
        title: '2020 Honda Civic - Excellent Condition',
        description: 'Well maintained Honda Civic, 45,000 miles. Regular service records available. No accidents. Clean title.',
        price: 18500,
        categoryId: 'vehicles',
        categoryName: 'Vehicles',
        sellerId: 'seller2',
        sellerName: 'Sarah Johnson',
        sellerEmail: 'sarah.j@example.com',
        status: 'approved' as const,
        isDeleted: false,
        imageUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400',
      },
      {
        title: '3 Bedroom Apartment for Rent',
        description: 'Spacious 3BR apartment in downtown area. Fully furnished, modern kitchen, balcony with city view. Available immediately.',
        price: 2500,
        categoryId: 'real-estate',
        categoryName: 'Real Estate',
        sellerId: 'seller3',
        sellerName: 'Michael Brown',
        sellerEmail: 'm.brown@example.com',
        status: 'pending' as const,
        isDeleted: false,
        imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400',
      },
      {
        title: 'MacBook Pro M2 - 14 inch',
        description: 'MacBook Pro 14" with M2 chip, 16GB RAM, 512GB SSD. Lightly used, excellent condition. Original box and charger included.',
        price: 1499,
        categoryId: 'electronics',
        categoryName: 'Electronics',
        sellerId: 'seller4',
        sellerName: 'Emily Davis',
        sellerEmail: 'emily.d@example.com',
        status: 'rejected' as const,
        rejectionReason: 'Incomplete information provided',
        isDeleted: false,
        imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400',
      },
      {
        title: 'Vintage Leather Sofa Set',
        description: 'Beautiful vintage leather sofa set in excellent condition. 3-seater sofa and 2 armchairs. Perfect for living room.',
        price: 850,
        categoryId: 'furniture',
        categoryName: 'Furniture',
        sellerId: 'seller5',
        sellerName: 'Robert Wilson',
        sellerEmail: 'r.wilson@example.com',
        status: 'approved' as const,
        isDeleted: false,
        imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400',
      },
    ]

    try {
      const addedIds: string[] = []
      for (const ad of sampleAds) {
        const docRef = await addDoc(collection(db, 'ads'), {
          ...ad,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
        addedIds.push(docRef.id)
        console.log(`Ad added with ID: ${docRef.id}`, ad.title)
      }
      setError(null)
      alert(`Successfully added ${addedIds.length} sample ads to Firestore!\n\nCollection: "ads"\nDocument IDs: ${addedIds.join(', ')}`)
    } catch (err: any) {
      console.error('Error adding sample ads:', err)
      setError(err.message || 'Failed to add sample ads')
      alert(`Error: ${err.message || 'Failed to add sample ads'}`)
    }
  }

  // Get status badge style
  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          backgroundColor: '#fff3cd',
          color: '#856404',
        }
      case 'approved':
        return {
          backgroundColor: '#d4edda',
          color: '#155724',
        }
      case 'rejected':
        return {
          backgroundColor: '#f8d7da',
          color: '#721c24',
        }
      default:
        return {
          backgroundColor: '#e2e3e5',
          color: '#383d41',
        }
    }
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
        }}
      >
        <h1 style={{ margin: 0, color: '#333' }}>Ads</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
              transition: 'background-color 0.2s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#218838'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#28a745'
            }}
          >
            + Create Ad
          </button>
          <button
            onClick={handleAddSampleAds}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#17a2b8',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
              transition: 'background-color 0.2s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#138496'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#17a2b8'
            }}
          >
            Add Sample Ads
          </button>
          <label
            style={{
              color: '#333',
              fontWeight: '500',
              marginRight: '0.5rem',
            }}
          >
            Filter:
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '0.875rem',
              cursor: 'pointer',
              backgroundColor: '#fff',
            }}
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {error && (
        <div
          style={{
            marginBottom: '1rem',
            padding: '0.75rem',
            backgroundColor: '#fee',
            color: '#c33',
            borderRadius: '4px',
            fontSize: '0.875rem',
          }}
        >
          {error}
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedAd && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
          onClick={handleCloseRejectModal}
        >
          <div
            style={{
              backgroundColor: '#fff',
              padding: '2rem',
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              width: '90%',
              maxWidth: '500px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginTop: 0, marginBottom: '1rem', color: '#333' }}>
              Reject Ad
            </h2>
            <p style={{ marginBottom: '1rem', color: '#666' }}>
              <strong>Title:</strong> {selectedAd.title}
            </p>
            <div style={{ marginBottom: '1rem' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: '#333',
                  fontWeight: '500',
                }}
              >
                Rejection Reason (Optional)
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
                placeholder="Enter reason for rejection (optional)"
              />
            </div>
            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
                justifyContent: 'flex-end',
              }}
            >
              <button
                type="button"
                onClick={handleCloseRejectModal}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReject}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                }}
              >
                Reject Ad
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Ad Modal */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
          onClick={() => setShowCreateModal(false)}
        >
          <div
            style={{
              backgroundColor: '#fff',
              padding: '2rem',
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              width: '100%',
              maxWidth: '600px',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginTop: 0, marginBottom: '1.5rem', color: '#333' }}>
              Create New Ad (Admin)
            </h2>
            <p style={{ marginBottom: '1.5rem', color: '#666', fontSize: '0.875rem' }}>
              Admin ads are automatically approved. No payment required.
            </p>

            <form onSubmit={handleCreateAd}>
              <div style={{ marginBottom: '1rem' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    color: '#333',
                    fontWeight: '500',
                  }}
                >
                  Title *
                </label>
                <input
                  type="text"
                  value={newAd.title}
                  onChange={(e) => setNewAd({ ...newAd, title: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1rem',
                    boxSizing: 'border-box',
                  }}
                  placeholder="Enter ad title"
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    color: '#333',
                    fontWeight: '500',
                  }}
                >
                  Description *
                </label>
                <textarea
                  value={newAd.description}
                  onChange={(e) => setNewAd({ ...newAd, description: e.target.value })}
                  required
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1rem',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                  }}
                  placeholder="Enter detailed description"
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    color: '#333',
                    fontWeight: '500',
                  }}
                >
                  Price (USD) *
                </label>
                <input
                  type="number"
                  value={newAd.price}
                  onChange={(e) => setNewAd({ ...newAd, price: e.target.value })}
                  required
                  min="0"
                  step="0.01"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1rem',
                    boxSizing: 'border-box',
                  }}
                  placeholder="Enter price"
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    color: '#333',
                    fontWeight: '500',
                  }}
                >
                  Category *
                </label>
                <select
                  value={newAd.categoryId}
                  onChange={(e) => setNewAd({ ...newAd, categoryId: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1rem',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    color: '#333',
                    fontWeight: '500',
                  }}
                >
                  Image URL (Optional)
                </label>
                <input
                  type="url"
                  value={newAd.imageUrl}
                  onChange={(e) => setNewAd({ ...newAd, imageUrl: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1rem',
                    boxSizing: 'border-box',
                  }}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '0.5rem',
                  justifyContent: 'flex-end',
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false)
                    setNewAd({
                      title: '',
                      description: '',
                      price: '',
                      categoryId: '',
                      imageUrl: '',
                    })
                    setError(null)
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createAdLoading}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: createAdLoading ? '#ccc' : '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: createAdLoading ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                  }}
                >
                  {createAdLoading ? 'Creating...' : 'Create Ad'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ads List */}
      <div
        style={{
          backgroundColor: '#fff',
          padding: '2rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        }}
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            Loading ads...
          </div>
        ) : ads.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            No ads found
            {statusFilter !== 'all' && ` with status "${statusFilter}"`}.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
              }}
            >
              <thead>
                <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                  <th
                    style={{
                      padding: '0.75rem',
                      textAlign: 'left',
                      color: '#333',
                      fontWeight: '600',
                    }}
                  >
                    Image
                  </th>
                  <th
                    style={{
                      padding: '0.75rem',
                      textAlign: 'left',
                      color: '#333',
                      fontWeight: '600',
                    }}
                  >
                    Title
                  </th>
                  <th
                    style={{
                      padding: '0.75rem',
                      textAlign: 'left',
                      color: '#333',
                      fontWeight: '600',
                    }}
                  >
                    Category
                  </th>
                  <th
                    style={{
                      padding: '0.75rem',
                      textAlign: 'left',
                      color: '#333',
                      fontWeight: '600',
                    }}
                  >
                    Price
                  </th>
                  <th
                    style={{
                      padding: '0.75rem',
                      textAlign: 'left',
                      color: '#333',
                      fontWeight: '600',
                    }}
                  >
                    Status
                  </th>
                  <th
                    style={{
                      padding: '0.75rem',
                      textAlign: 'left',
                      color: '#333',
                      fontWeight: '600',
                    }}
                  >
                    Seller
                  </th>
                  <th
                    style={{
                      padding: '0.75rem',
                      textAlign: 'left',
                      color: '#333',
                      fontWeight: '600',
                    }}
                  >
                    Created At
                  </th>
                  <th
                    style={{
                      padding: '0.75rem',
                      textAlign: 'right',
                      color: '#333',
                      fontWeight: '600',
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {ads.map((ad) => (
                  <tr
                    key={ad.id}
                    style={{
                      borderBottom: '1px solid #f0f0f0',
                    }}
                  >
                    <td style={{ padding: '0.75rem' }}>
                      <div style={{ position: 'relative' }}>
                        <img
                          src={ad.imageUrl || 'https://raw.githubusercontent.com/AbdullahWali79/AbdullahImages/main/new.jpg'}
                          alt={ad.title}
                          onClick={() => {
                            setSelectedAdForImage(ad)
                            setShowImageModal(true)
                          }}
                          style={{
                            width: '60px',
                            height: '60px',
                            objectFit: 'cover',
                            borderRadius: '4px',
                            border: '1px solid #e0e0e0',
                            display: 'block',
                            cursor: 'pointer',
                          }}
                          onError={(e) => {
                            // If user image fails, try default image
                            const defaultImageUrl = 'https://raw.githubusercontent.com/AbdullahWali79/AbdullahImages/main/new.jpg'
                            if (e.currentTarget.src !== defaultImageUrl && ad.imageUrl) {
                              e.currentTarget.src = defaultImageUrl
                            } else {
                              // If default also fails, show placeholder
                              e.currentTarget.style.display = 'none'
                              const placeholder = e.currentTarget.nextElementSibling as HTMLElement
                              if (placeholder) placeholder.style.display = 'flex'
                            }
                          }}
                        />
                        <div
                          style={{
                            width: '60px',
                            height: '60px',
                            backgroundColor: '#e9ecef',
                            borderRadius: '4px',
                            display: 'none',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            color: '#999',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                          }}
                        >
                          No Img
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem', color: '#333' }}>
                      <div style={{ fontWeight: '500' }}>{ad.title}</div>
                      {ad.description && (
                        <div
                          style={{
                            fontSize: '0.875rem',
                            color: '#666',
                            marginTop: '0.25rem',
                            maxWidth: '300px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {ad.description}
                        </div>
                      )}
                      <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <input
                          type="text"
                          value={imageUrlInputs[ad.id] !== undefined ? imageUrlInputs[ad.id] : (ad.imageUrl || '')}
                          placeholder="Paste Image URL here"
                          onChange={(e) => {
                            setImageUrlInputs({
                              ...imageUrlInputs,
                              [ad.id]: e.target.value,
                            })
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleLoadImage(ad.id, imageUrlInputs[ad.id] || ad.imageUrl || '')
                            }
                          }}
                          style={{
                            flex: 1,
                            minWidth: '200px',
                            maxWidth: '300px',
                            padding: '0.25rem 0.5rem',
                            fontSize: '0.75rem',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleLoadImage(ad.id, imageUrlInputs[ad.id] || ad.imageUrl || '')}
                          disabled={loadingImages[ad.id] || !imageUrlInputs[ad.id] && !ad.imageUrl}
                          style={{
                            padding: '0.25rem 0.75rem',
                            backgroundColor: loadingImages[ad.id] ? '#ccc' : '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: loadingImages[ad.id] ? 'not-allowed' : 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            whiteSpace: 'nowrap',
                            transition: 'background-color 0.2s',
                          }}
                          onMouseOver={(e) => {
                            if (!loadingImages[ad.id]) {
                              e.currentTarget.style.backgroundColor = '#218838'
                            }
                          }}
                          onMouseOut={(e) => {
                            if (!loadingImages[ad.id]) {
                              e.currentTarget.style.backgroundColor = '#28a745'
                            }
                          }}
                          title="Load and Save Image URL"
                        >
                          {loadingImages[ad.id] ? '⏳ Loading...' : '✅ Load Image'}
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            const defaultImageUrl = 'https://raw.githubusercontent.com/AbdullahWali79/AbdullahImages/main/new.jpg'
                            try {
                              await updateDoc(doc(db, 'ads', ad.id), {
                                imageUrl: defaultImageUrl,
                                updatedAt: serverTimestamp(),
                              })
                              setImageUrlInputs({
                                ...imageUrlInputs,
                                [ad.id]: defaultImageUrl,
                              })
                              setError(null)
                            } catch (err: any) {
                              console.error('Error setting default image:', err)
                              setError(err.message || 'Failed to set default image')
                            }
                          }}
                          style={{
                            padding: '0.25rem 0.75rem',
                            backgroundColor: '#17a2b8',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            whiteSpace: 'nowrap',
                            transition: 'background-color 0.2s',
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = '#138496'
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = '#17a2b8'
                          }}
                          title="Set Default Image (Ads List)"
                        >
                          📷 Use Default
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem', color: '#666' }}>
                      {ad.categoryName}
                    </td>
                    <td style={{ padding: '0.75rem', color: '#333', fontWeight: '500' }}>
                      {formatPrice(ad.price)}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span
                        style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '12px',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          textTransform: 'capitalize',
                          ...getStatusBadgeStyle(ad.status),
                        }}
                      >
                        {ad.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', color: '#666' }}>
                      <div>{ad.sellerName}</div>
                      <div style={{ fontSize: '0.875rem', color: '#999' }}>
                        {ad.sellerEmail}
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem', color: '#666', fontSize: '0.875rem' }}>
                      {formatDate(ad.createdAt)}
                    </td>
                    <td
                      style={{
                        padding: '0.75rem',
                        textAlign: 'right',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          gap: '0.5rem',
                          justifyContent: 'flex-end',
                          flexWrap: 'wrap',
                        }}
                      >
                        {ad.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(ad.id)}
                              style={{
                                padding: '0.25rem 0.75rem',
                                backgroundColor: '#28a745',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                              }}
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectClick(ad)}
                              style={{
                                padding: '0.25rem 0.75rem',
                                backgroundColor: '#ffc107',
                                color: '#333',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                              }}
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {ad.status === 'approved' && (
                          <button
                            onClick={() => handleRejectClick(ad)}
                            style={{
                              padding: '0.25rem 0.75rem',
                              backgroundColor: '#ffc107',
                              color: '#333',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.875rem',
                              fontWeight: '500',
                            }}
                          >
                            Reject
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(ad.id, ad.title)}
                          style={{
                            padding: '0.25rem 0.75rem',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Image View Modal */}
      {showImageModal && selectedAdForImage && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 2000,
          }}
          onClick={() => {
            setShowImageModal(false)
            setSelectedAdForImage(null)
          }}
        >
          <div
            style={{
              maxWidth: '90%',
              maxHeight: '90%',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                setShowImageModal(false)
                setSelectedAdForImage(null)
              }}
              style={{
                position: 'absolute',
                top: '-40px',
                right: 0,
                backgroundColor: '#fff',
                color: '#333',
                border: 'none',
                borderRadius: '4px',
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
              }}
            >
              Close (X)
            </button>
            <img
              src={selectedAdForImage.imageUrl || 'https://raw.githubusercontent.com/AbdullahWali79/AbdullahImages/main/new.jpg'}
              alt={selectedAdForImage.title}
              style={{
                maxWidth: '100%',
                maxHeight: '90vh',
                objectFit: 'contain',
                borderRadius: '8px',
              }}
            />
            <div
              style={{
                marginTop: '1rem',
                padding: '1rem',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                borderRadius: '8px',
                color: '#333',
              }}
            >
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem' }}>{selectedAdForImage.title}</h3>
              <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#666' }}>
                {selectedAdForImage.description}
              </p>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>
                <div><strong>Seller:</strong> {selectedAdForImage.sellerName}</div>
                <div><strong>Email:</strong> {selectedAdForImage.sellerEmail}</div>
                <div><strong>Category:</strong> {selectedAdForImage.categoryName}</div>
                <div><strong>Price:</strong> {formatPrice(selectedAdForImage.price)}</div>
                <div><strong>Status:</strong> {selectedAdForImage.status}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Ads
