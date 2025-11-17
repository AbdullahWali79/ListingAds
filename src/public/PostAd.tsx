import { useState, useEffect, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, addDoc, onSnapshot, query, where, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuthContext } from '../context/AuthContext'

interface Category {
  id: string
  name: string
  slug: string
  isActive: boolean
}

const PostAd = () => {
  const { firebaseUser, userDoc } = useAuthContext()
  const navigate = useNavigate()
  
  const [categories, setCategories] = useState<Category[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  // Payment fields
  const [paymentAmount, setPaymentAmount] = useState('500') // Default amount
  const [paymentMethod, setPaymentMethod] = useState('')
  const [referenceNumber, setReferenceNumber] = useState('')
  const [paymentProofUrl, setPaymentProofUrl] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [categoriesLoading, setCategoriesLoading] = useState(true)

  // Check if user is approved seller
  useEffect(() => {
    if (userDoc && userDoc.role === 'seller' && userDoc.status !== 'approved') {
      navigate('/dashboard')
    }
  }, [userDoc, navigate])

  // Fetch active categories
  useEffect(() => {
    // Try with isActive filter first, fallback to all categories if it fails
    let categoriesQuery;
    try {
      categoriesQuery = query(
        collection(db, 'categories'),
        where('isActive', '==', true)
      )
    } catch (err) {
      // If query fails (no index), use simple collection query
      console.warn('Using simple categories query:', err)
      categoriesQuery = query(collection(db, 'categories'))
    }

    const unsubscribe = onSnapshot(
      categoriesQuery,
      (snapshot) => {
        const categoriesList: Category[] = []
        snapshot.forEach((doc) => {
          const data = doc.data()
          // Filter active categories in JS if query didn't filter
          const isActive = data.isActive !== undefined ? data.isActive : true
          if (isActive) {
            categoriesList.push({
              id: doc.id,
              name: data.name || '',
              slug: data.slug || '',
              isActive: isActive,
            })
          }
        })
        setCategories(categoriesList)
        setCategoriesLoading(false)
      },
      (err) => {
        console.error('Error fetching categories:', err)
        // If error, try simple query without filter
        if (err.code === 'failed-precondition' || err.message?.includes('index')) {
          const simpleQuery = query(collection(db, 'categories'))
          const unsub2 = onSnapshot(
            simpleQuery,
            (snapshot) => {
              const categoriesList: Category[] = []
              snapshot.forEach((doc) => {
                const data = doc.data()
                const isActive = data.isActive !== undefined ? data.isActive : true
                if (isActive) {
                  categoriesList.push({
                    id: doc.id,
                    name: data.name || '',
                    slug: data.slug || '',
                    isActive: isActive,
                  })
                }
              })
              setCategories(categoriesList)
              setCategoriesLoading(false)
            },
            (err2) => {
              console.error('Error fetching categories (retry):', err2)
              setCategoriesLoading(false)
            }
          )
          return () => unsub2()
        } else {
          setCategoriesLoading(false)
        }
      }
    )

    return () => unsubscribe()
  }, [])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!title.trim()) {
      setError('Title is required')
      return
    }

    if (!description.trim()) {
      setError('Description is required')
      return
    }

    const priceNum = parseFloat(price)
    if (!price || isNaN(priceNum) || priceNum <= 0) {
      setError('Please enter a valid price')
      return
    }

    if (!categoryId) {
      setError('Please select a category')
      return
    }

    // Payment validation
    const paymentAmountNum = parseFloat(paymentAmount)
    if (!paymentAmount || isNaN(paymentAmountNum) || paymentAmountNum <= 0) {
      setError('Please enter a valid payment amount')
      return
    }

    if (!paymentMethod) {
      setError('Please select a payment method')
      return
    }

    if (!paymentProofUrl.trim()) {
      setError('Payment proof image URL is required')
      return
    }

    if (!firebaseUser || !userDoc) {
      setError('Please login to post an ad')
      return
    }

    if (userDoc.role !== 'seller' || userDoc.status !== 'approved') {
      setError('Only approved sellers can post ads')
      return
    }

    setLoading(true)

    try {
      // Find selected category
      const selectedCategory = categories.find(cat => cat.id === categoryId)
      if (!selectedCategory) {
        setError('Selected category not found')
        setLoading(false)
        return
      }

      // Create ad in Firestore first (to get ad ID)
      const adDocRef = await addDoc(collection(db, 'ads'), {
        title: title.trim(),
        description: description.trim(),
        price: priceNum,
        categoryId: categoryId,
        categoryName: selectedCategory.name,
        categorySlug: selectedCategory.slug,
        sellerId: firebaseUser.uid,
        sellerName: userDoc.name || firebaseUser.displayName || 'Unknown',
        sellerEmail: userDoc.email || firebaseUser.email || '',
        status: 'pending',
        isDeleted: false,
        imageUrl: imageUrl.trim() || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      // Create payment document with ad reference
      await addDoc(collection(db, 'payments'), {
        userId: firebaseUser.uid,
        userName: userDoc.name || firebaseUser.displayName || 'Unknown',
        userEmail: userDoc.email || firebaseUser.email || '',
        amount: paymentAmountNum,
        currency: 'PKR',
        method: paymentMethod,
        referenceNumber: referenceNumber.trim() || null,
        screenshotUrl: paymentProofUrl.trim(),
        status: 'pending',
        adId: adDocRef.id, // Link payment to ad
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      // Redirect to dashboard
      navigate('/dashboard')
    } catch (err: any) {
      console.error('Error creating ad:', err)
      setError(err.message || 'Failed to create ad. Please try again.')
      setLoading(false)
    }
  }

  if (!firebaseUser || userDoc?.role !== 'seller' || userDoc?.status !== 'approved') {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', padding: '1.5rem' }}>
          <h2 style={{ color: '#dc2626', marginBottom: '1rem' }}>Access Denied</h2>
          <p>Only approved sellers can post ads. Please wait for admin approval.</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Post New Ad</h1>

      <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', padding: '2rem' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label
              htmlFor="title"
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
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
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

          <div style={{ marginBottom: '1.5rem' }}>
            <label
              htmlFor="description"
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
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={6}
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

          <div style={{ marginBottom: '1.5rem' }}>
            <label
              htmlFor="price"
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: '#333',
                fontWeight: '500',
              }}
            >
              Price (PKR) *
            </label>
            <input
              id="price"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
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

          <div style={{ marginBottom: '1.5rem' }}>
            <label
              htmlFor="category"
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: '#333',
                fontWeight: '500',
              }}
            >
              Category *
            </label>
            {categoriesLoading ? (
              <p>Loading categories...</p>
            ) : (
              <select
                id="category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
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
            )}
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label
              htmlFor="imageUrl"
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: '#333',
                fontWeight: '500',
              }}
            >
              Ad Image URL (Optional)
            </label>
            <input
              id="imageUrl"
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
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

          {/* Payment Section */}
          <div style={{ 
            marginTop: '2rem', 
            paddingTop: '2rem', 
            borderTop: '2px solid #e5e7eb' 
          }}>
            <h2 style={{ 
              fontSize: '1.25rem', 
              fontWeight: '600', 
              marginBottom: '1rem',
              color: '#333'
            }}>
              Payment Information
            </h2>
            <p style={{ 
              fontSize: '0.875rem', 
              color: '#666', 
              marginBottom: '1.5rem' 
            }}>
              Please provide payment proof to post your ad. Payment will be verified by admin.
            </p>

            <div style={{ marginBottom: '1.5rem' }}>
              <label
                htmlFor="paymentAmount"
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: '#333',
                  fontWeight: '500',
                }}
              >
                Payment Amount (PKR) *
              </label>
              <input
                id="paymentAmount"
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
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
                placeholder="Enter payment amount"
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label
                htmlFor="paymentMethod"
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: '#333',
                  fontWeight: '500',
                }}
              >
                Payment Method *
              </label>
              <select
                id="paymentMethod"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
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
                <option value="">Select payment method</option>
                <option value="bank">Bank Transfer</option>
                <option value="easypaisa">EasyPaisa</option>
                <option value="jazzcash">JazzCash</option>
                <option value="card">Card</option>
              </select>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label
                htmlFor="referenceNumber"
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: '#333',
                  fontWeight: '500',
                }}
              >
                Reference/Transaction Number (Optional)
              </label>
              <input
                id="referenceNumber"
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  boxSizing: 'border-box',
                }}
                placeholder="Enter transaction reference number"
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label
                htmlFor="paymentProofUrl"
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: '#333',
                  fontWeight: '500',
                }}
              >
                Payment Proof Image URL *
              </label>
              <input
                id="paymentProofUrl"
                type="url"
                value={paymentProofUrl}
                onChange={(e) => setPaymentProofUrl(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  boxSizing: 'border-box',
                }}
                placeholder="https://example.com/payment-proof.jpg"
              />
              <p style={{ 
                fontSize: '0.75rem', 
                color: '#666', 
                marginTop: '0.25rem',
                marginBottom: 0
              }}>
                Upload payment screenshot to image hosting service (e.g., imgur, imgbb) and paste the URL here
              </p>
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

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: loading ? '#ccc' : '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s',
              }}
            >
              {loading ? 'Posting...' : 'Post Ad'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PostAd

