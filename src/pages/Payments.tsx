import { useState, useEffect, type ChangeEvent } from 'react'
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

interface Payment {
  id: string
  userId: string
  userName: string
  userEmail: string
  amount: number
  currency: string
  method: string
  referenceNumber?: string
  screenshotUrl?: string
  status: 'pending' | 'approved' | 'rejected'
  adminNote?: string
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected'

const Payments = () => {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [adminNote, setAdminNote] = useState('')
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

  // Format amount with currency
  const formatAmount = (amount: number, currency: string): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  // Format payment method
  const formatMethod = (method: string): string => {
    const methodMap: { [key: string]: string } = {
      bank: 'Bank Transfer',
      easypaisa: 'EasyPaisa',
      jazzcash: 'JazzCash',
      card: 'Card',
    }
    return methodMap[method] || method.charAt(0).toUpperCase() + method.slice(1)
  }

  // Real-time payments list with filter
  useEffect(() => {
    setLoading(true)
    setError(null)

    const paymentsRef = collection(db, 'payments')
    let paymentsQuery

    try {
      if (statusFilter === 'all') {
        paymentsQuery = query(paymentsRef, orderBy('createdAt', 'desc'))
      } else {
        paymentsQuery = query(
          paymentsRef,
          where('status', '==', statusFilter),
          orderBy('createdAt', 'desc')
        )
      }
    } catch (err) {
      // If orderBy fails, use simple query and sort manually
      paymentsQuery = statusFilter === 'all' 
        ? query(paymentsRef)
        : query(paymentsRef, where('status', '==', statusFilter))
    }

    const unsubscribe = onSnapshot(
      paymentsQuery,
      (snapshot) => {
        const paymentsList: Payment[] = []
        snapshot.forEach((doc) => {
          const data = doc.data()
          paymentsList.push({
            id: doc.id,
            userId: data.userId || '',
            userName: data.userName || 'Unknown',
            userEmail: data.userEmail || '',
            amount: data.amount || 0,
            currency: data.currency || 'PKR',
            method: data.method || 'unknown',
            referenceNumber: data.referenceNumber || undefined,
            screenshotUrl: data.screenshotUrl || undefined,
            status: data.status || 'pending',
            adminNote: data.adminNote || undefined,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          } as Payment)
        })

        // If orderBy failed, sort manually by createdAt (newest first)
        paymentsList.sort((a, b) => {
          const timeA = a.createdAt?.toMillis() ?? 0
          const timeB = b.createdAt?.toMillis() ?? 0
          return timeB - timeA // Newest first
        })

        setPayments(paymentsList)
        setLoading(false)
        setError(null)
      },
      (err: any) => {
        console.error('Error fetching payments:', err)
        // If orderBy fails, try without it
        if (err.code === 'failed-precondition' || err.message?.includes('index')) {
          const simpleQuery = statusFilter === 'all'
            ? query(paymentsRef)
            : query(paymentsRef, where('status', '==', statusFilter))
          
          const unsubscribeSimple = onSnapshot(
            simpleQuery,
            (snapshot) => {
              const paymentsList: Payment[] = []
              snapshot.forEach((doc) => {
                const data = doc.data()
                paymentsList.push({
                  id: doc.id,
                  userId: data.userId || '',
                  userName: data.userName || 'Unknown',
                  userEmail: data.userEmail || '',
                  amount: data.amount || 0,
                  currency: data.currency || 'PKR',
                  method: data.method || 'unknown',
                  referenceNumber: data.referenceNumber || undefined,
                  screenshotUrl: data.screenshotUrl || undefined,
                  status: data.status || 'pending',
                  adminNote: data.adminNote || undefined,
                  createdAt: data.createdAt,
                  updatedAt: data.updatedAt,
                } as Payment)
              })

              // Sort manually by createdAt (newest first)
              paymentsList.sort((a, b) => {
                const timeA = a.createdAt?.toMillis() ?? 0
                const timeB = b.createdAt?.toMillis() ?? 0
                return timeB - timeA // Newest first
              })

              setPayments(paymentsList)
              setLoading(false)
              setError(null)
            },
            (err2: any) => {
              console.error('Error fetching payments (fallback):', err2)
              if (err2.code === 'permission-denied') {
                setError('Permission denied. Please check Firestore security rules.')
              } else {
                setError(`Failed to load payments: ${err2.message || 'Unknown error'}`)
              }
              setLoading(false)
            }
          )
          return () => unsubscribeSimple()
        } else if (err.code === 'permission-denied') {
          setError('Permission denied. Please check Firestore security rules.')
        } else {
          setError(`Failed to load payments: ${err.message || 'Unknown error'}`)
        }
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [statusFilter])

  // Approve payment
  const handleApprove = async (id: string) => {
    try {
      await updateDoc(doc(db, 'payments', id), {
        status: 'approved',
        adminNote: null,
        updatedAt: serverTimestamp(),
      })
      setError(null)
    } catch (err: any) {
      console.error('Error approving payment:', err)
      setError(err.message || 'Failed to approve payment')
    }
  }

  // Open reject modal
  const handleRejectClick = (payment: Payment) => {
    setSelectedPayment(payment)
    setAdminNote(payment.adminNote || '')
    setShowRejectModal(true)
  }

  // Close reject modal
  const handleCloseRejectModal = () => {
    setShowRejectModal(false)
    setSelectedPayment(null)
    setAdminNote('')
  }

  // Reject payment
  const handleReject = async () => {
    if (!selectedPayment) return

    try {
      await updateDoc(doc(db, 'payments', selectedPayment.id), {
        status: 'rejected',
        adminNote: adminNote.trim() || null,
        updatedAt: serverTimestamp(),
      })
      handleCloseRejectModal()
      setError(null)
    } catch (err: any) {
      console.error('Error rejecting payment:', err)
      setError(err.message || 'Failed to reject payment')
    }
  }

  // Add sample payments
  const handleAddSamplePayments = async () => {
    if (!window.confirm('Add 5 sample payments for testing? This will create payments with different statuses.')) {
      return
    }

    setError(null)
    const samplePayments = [
      {
        userId: 'user1',
        userName: 'Ahmed Ali',
        userEmail: 'ahmed.ali@example.com',
        amount: 5000,
        currency: 'PKR',
        method: 'easypaisa',
        referenceNumber: 'EP1234567890',
        screenshotUrl: 'https://via.placeholder.com/400x300?text=Payment+Screenshot+1',
        status: 'pending' as const,
      },
      {
        userId: 'user2',
        userName: 'Fatima Khan',
        userEmail: 'fatima.khan@example.com',
        amount: 10000,
        currency: 'PKR',
        method: 'jazzcash',
        referenceNumber: 'JC9876543210',
        screenshotUrl: 'https://via.placeholder.com/400x300?text=Payment+Screenshot+2',
        status: 'approved' as const,
      },
      {
        userId: 'user3',
        userName: 'Hassan Raza',
        userEmail: 'hassan.raza@example.com',
        amount: 7500,
        currency: 'PKR',
        method: 'bank',
        referenceNumber: 'BNK4567890123',
        screenshotUrl: 'https://via.placeholder.com/400x300?text=Payment+Screenshot+3',
        status: 'pending' as const,
      },
      {
        userId: 'user4',
        userName: 'Sara Ahmed',
        userEmail: 'sara.ahmed@example.com',
        amount: 15000,
        currency: 'PKR',
        method: 'card',
        referenceNumber: 'CARD7890123456',
        status: 'rejected' as const,
        adminNote: 'Incomplete payment information provided',
      },
      {
        userId: 'user5',
        userName: 'Usman Malik',
        userEmail: 'usman.malik@example.com',
        amount: 3000,
        currency: 'PKR',
        method: 'easypaisa',
        referenceNumber: 'EP5555555555',
        status: 'approved' as const,
      },
    ]

    try {
      const addedIds: string[] = []
      for (const payment of samplePayments) {
        const docRef = await addDoc(collection(db, 'payments'), {
          ...payment,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
        addedIds.push(docRef.id)
        console.log(`Payment added with ID: ${docRef.id}`, payment.userName)
      }
      setError(null)
      alert(`Successfully added ${addedIds.length} sample payments to Firestore!\n\nCollection: "payments"\nDocument IDs: ${addedIds.join(', ')}`)
    } catch (err: any) {
      console.error('Error adding sample payments:', err)
      setError(err.message || 'Failed to add sample payments')
      alert(`Error: ${err.message || 'Failed to add sample payments'}`)
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
        <h1 style={{ margin: 0, color: '#333' }}>Payments</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={handleAddSamplePayments}
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
            Add Sample Payments
          </button>
          <label
            style={{
              color: '#333',
              fontWeight: '500',
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
      {showRejectModal && selectedPayment && (
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
              Reject Payment
            </h2>
            <p style={{ marginBottom: '1rem', color: '#666' }}>
              <strong>User:</strong> {selectedPayment.userName} ({selectedPayment.userEmail})
            </p>
            <p style={{ marginBottom: '1rem', color: '#666' }}>
              <strong>Amount:</strong> {formatAmount(selectedPayment.amount, selectedPayment.currency)}
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
                value={adminNote}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setAdminNote(e.target.value)}
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
                Reject Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payments List */}
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
            Loading payments...
          </div>
        ) : payments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            No payments found
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
                    User
                  </th>
                  <th
                    style={{
                      padding: '0.75rem',
                      textAlign: 'left',
                      color: '#333',
                      fontWeight: '600',
                    }}
                  >
                    Amount
                  </th>
                  <th
                    style={{
                      padding: '0.75rem',
                      textAlign: 'left',
                      color: '#333',
                      fontWeight: '600',
                    }}
                  >
                    Method
                  </th>
                  <th
                    style={{
                      padding: '0.75rem',
                      textAlign: 'left',
                      color: '#333',
                      fontWeight: '600',
                    }}
                  >
                    Reference
                  </th>
                  <th
                    style={{
                      padding: '0.75rem',
                      textAlign: 'left',
                      color: '#333',
                      fontWeight: '600',
                    }}
                  >
                    Screenshot
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
                {payments.map((payment) => (
                  <tr
                    key={payment.id}
                    style={{
                      borderBottom: '1px solid #f0f0f0',
                    }}
                  >
                    <td style={{ padding: '0.75rem', color: '#333' }}>
                      <div style={{ fontWeight: '500' }}>{payment.userName}</div>
                      <div style={{ fontSize: '0.875rem', color: '#666' }}>
                        {payment.userEmail}
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem', color: '#333', fontWeight: '500' }}>
                      {formatAmount(payment.amount, payment.currency)}
                    </td>
                    <td style={{ padding: '0.75rem', color: '#666' }}>
                      {formatMethod(payment.method)}
                    </td>
                    <td style={{ padding: '0.75rem', color: '#666', fontSize: '0.875rem' }}>
                      {payment.referenceNumber || '-'}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      {payment.screenshotUrl ? (
                        <a
                          href={payment.screenshotUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: '#007bff',
                            textDecoration: 'none',
                            fontSize: '0.875rem',
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.textDecoration = 'underline'
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.textDecoration = 'none'
                          }}
                        >
                          View
                        </a>
                      ) : (
                        <span style={{ color: '#999', fontSize: '0.875rem' }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span
                        style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '12px',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          textTransform: 'capitalize',
                          ...getStatusBadgeStyle(payment.status),
                        }}
                      >
                        {payment.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', color: '#666', fontSize: '0.875rem' }}>
                      {formatDate(payment.createdAt)}
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
                        {payment.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(payment.id)}
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
                              onClick={() => handleRejectClick(payment)}
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
                              Reject
                            </button>
                          </>
                        )}
                        {payment.status === 'approved' && (
                          <button
                            onClick={() => handleRejectClick(payment)}
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
                            Reject
                          </button>
                        )}
                        {payment.status === 'rejected' && (
                          <button
                            onClick={() => handleApprove(payment.id)}
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
                        )}
                        {payment.adminNote && (
                          <div
                            style={{
                              fontSize: '0.75rem',
                              color: '#666',
                              marginTop: '0.25rem',
                              fontStyle: 'italic',
                            }}
                          >
                            Note: {payment.adminNote}
                          </div>
                        )}
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

export default Payments
