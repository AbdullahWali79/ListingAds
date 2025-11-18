import { useState, useEffect, FormEvent, ChangeEvent } from 'react'
import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  updateDoc,
  setDoc,
  serverTimestamp,
  type Timestamp,
} from 'firebase/firestore'
import { db } from '../firebase'
import { useAuthContext } from '../context/AuthContext'

interface PricePackage {
  id: string
  userId: string
  userName: string
  userEmail: string
  package1Day: number // Price for 1 day
  package3Days: number // Price for 3 days
  package1Week: number // Price for 1 week (7 days)
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

interface User {
  id: string
  name: string
  email: string
  role: string
}

const PricePackages = () => {
  const { firebaseUser, userDoc } = useAuthContext()
  const [packages, setPackages] = useState<PricePackage[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [packageData, setPackageData] = useState({
    package1Day: 5,
    package3Days: 15,
    package1Week: 35,
  })

  // Fetch all sellers
  useEffect(() => {
    const usersQuery = query(
      collection(db, 'users'),
      where('role', '==', 'seller')
    )
    const unsubscribe = onSnapshot(
      usersQuery,
      (snapshot) => {
        const usersList: User[] = []
        snapshot.forEach((doc) => {
          const data = doc.data()
          usersList.push({
            id: doc.id,
            name: data.name || 'Unknown',
            email: data.email || '',
            role: data.role || 'seller',
          })
        })
        setUsers(usersList)
      },
      (err) => {
        console.error('Error fetching users:', err)
      }
    )
    return () => unsubscribe()
  }, [])

  // Fetch price packages
  useEffect(() => {
    setLoading(true)
    const packagesQuery = query(collection(db, 'pricePackages'))
    const unsubscribe = onSnapshot(
      packagesQuery,
      (snapshot) => {
        const packagesList: PricePackage[] = []
        snapshot.forEach((doc) => {
          const data = doc.data()
          packagesList.push({
            id: doc.id,
            userId: data.userId || '',
            userName: data.userName || 'Unknown',
            userEmail: data.userEmail || '',
            package1Day: data.package1Day || 5,
            package3Days: data.package3Days || 15,
            package1Week: data.package1Week || 35,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          })
        })
        setPackages(packagesList)
        setLoading(false)
      },
      (err: any) => {
        console.error('Error fetching packages:', err)
        setError(err.message || 'Failed to load price packages')
        setLoading(false)
      }
    )
    return () => unsubscribe()
  }, [])

  // Open edit modal
  const handleEditClick = (user: User) => {
    const existingPackage = packages.find((pkg) => pkg.userId === user.id)
    if (existingPackage) {
      setPackageData({
        package1Day: existingPackage.package1Day,
        package3Days: existingPackage.package3Days,
        package1Week: existingPackage.package1Week,
      })
    } else {
      setPackageData({
        package1Day: 5,
        package3Days: 15,
        package1Week: 35,
      })
    }
    setSelectedUser(user)
    setShowEditModal(true)
  }

  // Save package
  const handleSavePackage = async (e: FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return

    setError(null)

    // Validation
    if (packageData.package1Day <= 0 || packageData.package3Days <= 0 || packageData.package1Week <= 0) {
      setError('All prices must be greater than 0')
      return
    }

    try {
      const existingPackage = packages.find((pkg) => pkg.userId === selectedUser.id)
      const packageRef = existingPackage
        ? doc(db, 'pricePackages', existingPackage.id)
        : doc(collection(db, 'pricePackages'))

      await setDoc(
        packageRef,
        {
          userId: selectedUser.id,
          userName: selectedUser.name,
          userEmail: selectedUser.email,
          package1Day: packageData.package1Day,
          package3Days: packageData.package3Days,
          package1Week: packageData.package1Week,
          updatedAt: serverTimestamp(),
          ...(existingPackage ? {} : { createdAt: serverTimestamp() }),
        },
        { merge: true }
      )

      setShowEditModal(false)
      setSelectedUser(null)
      setError(null)
    } catch (err: any) {
      console.error('Error saving package:', err)
      setError(err.message || 'Failed to save price package')
    }
  }

  // Close modal
  const handleCloseModal = () => {
    setShowEditModal(false)
    setSelectedUser(null)
    setPackageData({
      package1Day: 5,
      package3Days: 15,
      package1Week: 35,
    })
    setError(null)
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
        <h1 style={{ margin: 0, color: '#333' }}>Price Packages</h1>
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

      {/* Edit Modal */}
      {showEditModal && selectedUser && (
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
          onClick={handleCloseModal}
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
            <h2 style={{ marginTop: 0, marginBottom: '1.5rem', color: '#333' }}>
              Set Price Packages for {selectedUser.name}
            </h2>
            <form onSubmit={handleSavePackage}>
              <div style={{ marginBottom: '1rem' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    color: '#333',
                    fontWeight: '500',
                  }}
                >
                  1 Day Package (PKR) *
                </label>
                <input
                  type="number"
                  value={packageData.package1Day}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setPackageData({ ...packageData, package1Day: parseFloat(e.target.value) || 0 })
                  }
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
                  3 Days Package (PKR) *
                </label>
                <input
                  type="number"
                  value={packageData.package3Days}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setPackageData({ ...packageData, package3Days: parseFloat(e.target.value) || 0 })
                  }
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
                />
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
                  1 Week Package (PKR) *
                </label>
                <input
                  type="number"
                  value={packageData.package1Week}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setPackageData({ ...packageData, package1Week: parseFloat(e.target.value) || 0 })
                  }
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
                  onClick={handleCloseModal}
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
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                  }}
                >
                  Save Package
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Packages List */}
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
            Loading price packages...
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: '#333' }}>
                Sellers
              </h2>
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
                        1 Day (PKR)
                      </th>
                      <th
                        style={{
                          padding: '0.75rem',
                          textAlign: 'left',
                          color: '#333',
                          fontWeight: '600',
                        }}
                      >
                        3 Days (PKR)
                      </th>
                      <th
                        style={{
                          padding: '0.75rem',
                          textAlign: 'left',
                          color: '#333',
                          fontWeight: '600',
                        }}
                      >
                        1 Week (PKR)
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
                    {users.map((user) => {
                      const userPackage = packages.find((pkg) => pkg.userId === user.id)
                      return (
                        <tr
                          key={user.id}
                          style={{
                            borderBottom: '1px solid #f0f0f0',
                          }}
                        >
                          <td style={{ padding: '0.75rem', color: '#333' }}>
                            <div style={{ fontWeight: '500' }}>{user.name}</div>
                            <div style={{ fontSize: '0.875rem', color: '#666' }}>{user.email}</div>
                          </td>
                          <td style={{ padding: '0.75rem', color: '#333' }}>
                            {userPackage ? `PKR ${userPackage.package1Day}` : 'Not Set'}
                          </td>
                          <td style={{ padding: '0.75rem', color: '#333' }}>
                            {userPackage ? `PKR ${userPackage.package3Days}` : 'Not Set'}
                          </td>
                          <td style={{ padding: '0.75rem', color: '#333' }}>
                            {userPackage ? `PKR ${userPackage.package1Week}` : 'Not Set'}
                          </td>
                          <td
                            style={{
                              padding: '0.75rem',
                              textAlign: 'right',
                            }}
                          >
                            <button
                              onClick={() => handleEditClick(user)}
                              style={{
                                padding: '0.25rem 0.75rem',
                                backgroundColor: '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                              }}
                            >
                              {userPackage ? 'Edit' : 'Set Package'}
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default PricePackages

