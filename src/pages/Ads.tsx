import { useState, useEffect } from 'react'
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

const Ads = () => {
  const [ads, setAds] = useState<Ad[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(false)

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
                      {ad.imageUrl ? (
                        <img
                          src={ad.imageUrl}
                          alt={ad.title}
                          style={{
                            width: '60px',
                            height: '60px',
                            objectFit: 'cover',
                            borderRadius: '4px',
                            border: '1px solid #e0e0e0',
                          }}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                            const placeholder = e.currentTarget.nextElementSibling as HTMLElement
                            if (placeholder) placeholder.style.display = 'flex'
                          }}
                        />
                      ) : null}
                      <div
                        style={{
                          width: '60px',
                          height: '60px',
                          backgroundColor: '#e9ecef',
                          borderRadius: '4px',
                          display: ad.imageUrl ? 'none' : 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          color: '#999',
                        }}
                      >
                        No Img
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
                      <div style={{ marginTop: '0.5rem' }}>
                        <input
                          type="text"
                          value={ad.imageUrl || ''}
                          placeholder="Add Image URL"
                          onChange={async (e) => {
                            const newUrl = e.target.value.trim()
                            if (newUrl !== (ad.imageUrl || '')) {
                              try {
                                await updateDoc(doc(db, 'ads', ad.id), {
                                  imageUrl: newUrl || null,
                                  updatedAt: serverTimestamp(),
                                })
                              } catch (err: any) {
                                console.error('Error updating image URL:', err)
                                setError(err.message || 'Failed to update image URL')
                              }
                            }
                          }}
                          style={{
                            width: '100%',
                            maxWidth: '300px',
                            padding: '0.25rem 0.5rem',
                            fontSize: '0.75rem',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                          }}
                        />
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
    </div>
  )
}

export default Ads
