import { useState, useEffect, type FormEvent } from 'react'
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
  // Package selection
  const [selectedPackage, setSelectedPackage] = useState<'1day' | '3days' | '1week'>('1day')
  const [packageDays, setPackageDays] = useState(1)
  const [pricePackage, setPricePackage] = useState<{
    package1Day: number
    package3Days: number
    package1Week: number
  } | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [categoriesLoading, setCategoriesLoading] = useState(true)

  // Check if user is approved seller
  useEffect(() => {
    if (userDoc && userDoc.role === 'seller' && userDoc.status !== 'approved') {
      navigate('/dashboard')
    }
  }, [userDoc, navigate])

  // Fetch price package for current user
  useEffect(() => {
    if (!firebaseUser || !userDoc || userDoc.role !== 'seller') return

    const packagesQuery = query(
      collection(db, 'pricePackages'),
      where('userId', '==', firebaseUser.uid)
    )
    const unsubscribe = onSnapshot(
      packagesQuery,
      (snapshot) => {
        if (!snapshot.empty) {
          const data = snapshot.docs[0].data()
          setPricePackage({
            package1Day: data.package1Day || 5,
            package3Days: data.package3Days || 15,
            package1Week: data.package1Week || 35,
          })
          // Set default payment amount based on selected package
          if (selectedPackage === '1day') {
            setPaymentAmount(String(data.package1Day || 5))
          } else if (selectedPackage === '3days') {
            setPaymentAmount(String(data.package3Days || 15))
          } else {
            setPaymentAmount(String(data.package1Week || 35))
          }
        } else {
          // Default packages if not set
          setPricePackage({
            package1Day: 5,
            package3Days: 15,
            package1Week: 35,
          })
          setPaymentAmount('5')
        }
      },
      (err) => {
        console.error('Error fetching price package:', err)
        // Set defaults on error
        setPricePackage({
          package1Day: 5,
          package3Days: 15,
          package1Week: 35,
        })
        setPaymentAmount('5')
      }
    )
    return () => unsubscribe()
  }, [firebaseUser, userDoc, selectedPackage])

  // Update package days and payment amount when package changes
  useEffect(() => {
    if (selectedPackage === '1day') {
      setPackageDays(1)
      if (pricePackage) {
        setPaymentAmount(String(pricePackage.package1Day))
      }
    } else if (selectedPackage === '3days') {
      setPackageDays(3)
      if (pricePackage) {
        setPaymentAmount(String(pricePackage.package3Days))
      }
    } else if (selectedPackage === '1week') {
      setPackageDays(7)
      if (pricePackage) {
        setPaymentAmount(String(pricePackage.package1Week))
      }
    }
  }, [selectedPackage, pricePackage])

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

      // Calculate expiry date based on selected package
      const now = new Date()
      const expiresAt = new Date(now)
      expiresAt.setDate(expiresAt.getDate() + packageDays)

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
        // Duration fields
        durationDays: packageDays,
        expiresAt: expiresAt,
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
            <div style={{ 
              marginTop: '0.75rem', 
              padding: '1rem', 
              backgroundColor: '#f0f9ff', 
              borderRadius: '8px',
              border: '1px solid #bae6fd',
            }}>
              <p style={{ 
                fontSize: '0.875rem', 
                color: '#0369a1', 
                margin: '0 0 0.75rem 0',
                fontWeight: '600',
              }}>
                📸 How to Upload Image:
              </p>
              <ol style={{ 
                margin: 0, 
                paddingLeft: '1.25rem', 
                fontSize: '0.8rem', 
                color: '#0c4a6e',
                lineHeight: '1.6',
              }}>
                <li style={{ marginBottom: '0.5rem' }}>Click on any image hosting website below</li>
                <li style={{ marginBottom: '0.5rem' }}>Upload your image</li>
                <li style={{ marginBottom: '0.5rem' }}>Copy the direct image URL</li>
                <li>Paste the URL in the field above</li>
              </ol>
              <div style={{ 
                marginTop: '0.75rem', 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '0.5rem' 
              }}>
                <a
                  href="https://imgur.com/upload"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#1e40af',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: '500',
                    display: 'inline-block',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1e3a8a'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1e40af'}
                >
                  📷 Upload to Imgur
                </a>
                <a
                  href="https://imgbb.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#059669',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: '500',
                    display: 'inline-block',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#047857'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#059669'}
                >
                  🖼️ Upload to ImgBB
                </a>
                <a
                  href="https://postimages.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#7c3aed',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: '500',
                    display: 'inline-block',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#6d28d9'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#7c3aed'}
                >
                  🎨 Upload to PostImages
                </a>
              </div>
            </div>
          </div>

          {/* Package Selection Section */}
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
              Ad Duration Package
            </h2>
            <p style={{ 
              fontSize: '0.875rem', 
              color: '#666', 
              marginBottom: '1.5rem' 
            }}>
              Select how long you want your ad to be displayed. Your ad will be active for the selected duration.
            </p>

            <div style={{ marginBottom: '1.5rem' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: '#333',
                  fontWeight: '500',
                }}
              >
                Select Package *
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '1rem',
                    border: selectedPackage === '1day' ? '2px solid #007bff' : '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    backgroundColor: selectedPackage === '1day' ? '#f0f8ff' : 'white',
                  }}
                >
                  <input
                    type="radio"
                    name="package"
                    value="1day"
                    checked={selectedPackage === '1day'}
                    onChange={() => setSelectedPackage('1day')}
                    style={{ marginRight: '0.75rem', cursor: 'pointer' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>1 Day Package</div>
                    <div style={{ fontSize: '0.875rem', color: '#666' }}>
                      PKR {pricePackage?.package1Day || 5} - Your ad will be displayed for 1 day
                    </div>
                  </div>
                </label>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '1rem',
                    border: selectedPackage === '3days' ? '2px solid #007bff' : '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    backgroundColor: selectedPackage === '3days' ? '#f0f8ff' : 'white',
                  }}
                >
                  <input
                    type="radio"
                    name="package"
                    value="3days"
                    checked={selectedPackage === '3days'}
                    onChange={() => setSelectedPackage('3days')}
                    style={{ marginRight: '0.75rem', cursor: 'pointer' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>3 Days Package</div>
                    <div style={{ fontSize: '0.875rem', color: '#666' }}>
                      PKR {pricePackage?.package3Days || 15} - Your ad will be displayed for 3 days
                    </div>
                  </div>
                </label>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '1rem',
                    border: selectedPackage === '1week' ? '2px solid #007bff' : '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    backgroundColor: selectedPackage === '1week' ? '#f0f8ff' : 'white',
                  }}
                >
                  <input
                    type="radio"
                    name="package"
                    value="1week"
                    checked={selectedPackage === '1week'}
                    onChange={() => setSelectedPackage('1week')}
                    style={{ marginRight: '0.75rem', cursor: 'pointer' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>1 Week Package</div>
                    <div style={{ fontSize: '0.875rem', color: '#666' }}>
                      PKR {pricePackage?.package1Week || 35} - Your ad will be displayed for 7 days
                    </div>
                  </div>
                </label>
              </div>
              {selectedPackage && (
                <div style={{ 
                  marginTop: '1rem', 
                  padding: '0.75rem', 
                  backgroundColor: '#e7f3ff', 
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                  color: '#004085'
                }}>
                  <strong>Selected:</strong> Your ad will be displayed for <strong>{packageDays} {packageDays === 1 ? 'day' : 'days'}</strong> after admin approval.
                </div>
              )}
            </div>
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
                readOnly
              />
              <p style={{ 
                fontSize: '0.75rem', 
                color: '#666', 
                marginTop: '0.25rem',
                marginBottom: 0
              }}>
                Amount is automatically set based on selected package. Contact admin if you need to change it.
              </p>
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
              <div style={{ 
                marginTop: '0.75rem', 
                padding: '1rem', 
                backgroundColor: '#fef3c7', 
                borderRadius: '8px',
                border: '1px solid #fcd34d',
              }}>
                <p style={{ 
                  fontSize: '0.875rem', 
                  color: '#92400e', 
                  margin: '0 0 0.75rem 0',
                  fontWeight: '600',
                }}>
                  💳 How to Upload Payment Proof:
                </p>
                <ol style={{ 
                  margin: 0, 
                  paddingLeft: '1.25rem', 
                  fontSize: '0.8rem', 
                  color: '#78350f',
                  lineHeight: '1.6',
                }}>
                  <li style={{ marginBottom: '0.5rem' }}>Take a screenshot of your payment proof</li>
                  <li style={{ marginBottom: '0.5rem' }}>Click on any image hosting website below</li>
                  <li style={{ marginBottom: '0.5rem' }}>Upload the screenshot</li>
                  <li style={{ marginBottom: '0.5rem' }}>Copy the direct image URL</li>
                  <li>Paste the URL in the field above</li>
                </ol>
                <div style={{ 
                  marginTop: '0.75rem', 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: '0.5rem' 
                }}>
                  <a
                    href="https://imgur.com/upload"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#1e40af',
                      color: 'white',
                      textDecoration: 'none',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: '500',
                      display: 'inline-block',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1e3a8a'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1e40af'}
                  >
                    📷 Upload to Imgur
                  </a>
                  <a
                    href="https://imgbb.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#059669',
                      color: 'white',
                      textDecoration: 'none',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: '500',
                      display: 'inline-block',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#047857'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#059669'}
                  >
                    🖼️ Upload to ImgBB
                  </a>
                  <a
                    href="https://postimages.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#7c3aed',
                      color: 'white',
                      textDecoration: 'none',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: '500',
                      display: 'inline-block',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#6d28d9'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#7c3aed'}
                  >
                    🎨 Upload to PostImages
                  </a>
                </div>
              </div>
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

