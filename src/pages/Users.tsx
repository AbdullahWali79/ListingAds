import { useState, useEffect, ChangeEvent } from 'react'
import {
  collection,
  doc,
  onSnapshot,
  query,
  orderBy,
  updateDoc,
  addDoc,
  serverTimestamp,
  type Timestamp,
} from 'firebase/firestore'
import { db, auth } from '../firebase'

interface User {
  id: string
  name: string
  email: string
  role: 'user' | 'seller' | 'admin'
  status: 'approved' | 'pending' | 'blocked'
  profileImageUrl?: string
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

type RoleFilter = 'all' | 'user' | 'seller' | 'admin'
type StatusFilter = 'all' | 'approved' | 'pending' | 'blocked'

const Users = () => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'user' as 'user' | 'seller' | 'admin',
    status: 'pending' as 'approved' | 'pending' | 'blocked',
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

  // Real-time users list
  useEffect(() => {
    setLoading(true)
    setError(null)

    // Try to query with orderBy, but handle gracefully if createdAt is missing
    let usersQuery
    try {
      usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'))
    } catch (err) {
      // If orderBy fails, use simple collection query
      usersQuery = query(collection(db, 'users'))
    }

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
            role: data.role || 'user',
            status: data.status || 'pending',
            profileImageUrl: data.profileImageUrl || undefined,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          } as User)
        })

        // If orderBy failed, sort manually by createdAt (newest first)
        if (usersList.length > 0 && !usersList[0].createdAt) {
          usersList.sort((a, b) => {
            const timeA = a.createdAt?.toMillis() ?? 0
            const timeB = b.createdAt?.toMillis() ?? 0
            return timeB - timeA // Newest first
          })
        }

        setUsers(usersList)
        setLoading(false)
        setError(null)
      },
      (err: any) => {
        console.error('Error fetching users:', err)
        // If orderBy fails, try without it
        if (err.code === 'failed-precondition' || err.message?.includes('index')) {
          const simpleQuery = query(collection(db, 'users'))
          const unsubscribeSimple = onSnapshot(
            simpleQuery,
            (snapshot) => {
              const usersList: User[] = []
              snapshot.forEach((doc) => {
                const data = doc.data()
                usersList.push({
                  id: doc.id,
                  name: data.name || 'Unknown',
                  email: data.email || '',
                  role: data.role || 'user',
                  status: data.status || 'pending',
                  createdAt: data.createdAt,
                  updatedAt: data.updatedAt,
                } as User)
              })

              // Sort manually by createdAt (newest first)
              usersList.sort((a, b) => {
                const timeA = a.createdAt?.toMillis() ?? 0
                const timeB = b.createdAt?.toMillis() ?? 0
                return timeB - timeA // Newest first
              })

              setUsers(usersList)
              setLoading(false)
              setError(null)
            },
            (err2: any) => {
              console.error('Error fetching users (fallback):', err2)
              if (err2.code === 'permission-denied') {
                setError('Permission denied. Please check Firestore security rules.')
              } else {
                setError(`Failed to load users: ${err2.message || 'Unknown error'}`)
              }
              setLoading(false)
            }
          )
          return () => unsubscribeSimple()
        } else if (err.code === 'permission-denied') {
          setError('Permission denied. Please check Firestore security rules.')
        } else {
          setError(`Failed to load users: ${err.message || 'Unknown error'}`)
        }
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  // Filter users based on role, status, and search term
  const filteredUsers = users.filter((user) => {
    // Role filter
    if (roleFilter !== 'all' && user.role !== roleFilter) {
      return false
    }

    // Status filter
    if (statusFilter !== 'all' && user.status !== statusFilter) {
      return false
    }

    // Search filter (name or email, case-insensitive)
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase()
      const nameMatch = user.name.toLowerCase().includes(searchLower)
      const emailMatch = user.email.toLowerCase().includes(searchLower)
      if (!nameMatch && !emailMatch) {
        return false
      }
    }

    return true
  })

  // Handle role change
  const handleRoleChange = async (userId: string, newRole: 'user' | 'seller' | 'admin') => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        role: newRole,
        updatedAt: serverTimestamp(),
      })
      setError(null)
    } catch (err: any) {
      console.error('Error updating user role:', err)
      setError(err.message || 'Failed to update user role')
    }
  }

  // Handle status change
  const handleStatusChange = async (userId: string, newStatus: 'approved' | 'pending' | 'blocked') => {
    // Prevent admin from blocking themselves
    const currentUser = auth.currentUser
    if (currentUser && currentUser.uid === userId && newStatus === 'blocked') {
      alert('You cannot block yourself.')
      return
    }

    try {
      await updateDoc(doc(db, 'users', userId), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      })
      setError(null)
    } catch (err: any) {
      console.error('Error updating user status:', err)
      setError(err.message || 'Failed to update user status')
    }
  }

  // Handle add user
  const handleAddUser = async () => {
    if (!newUser.name.trim() || !newUser.email.trim()) {
      setError('Please fill in name and email')
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newUser.email)) {
      setError('Please enter a valid email address')
      return
    }

    try {
      await addDoc(collection(db, 'users'), {
        name: newUser.name.trim(),
        email: newUser.email.trim().toLowerCase(),
        role: newUser.role,
        status: newUser.status,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      setError(null)
      setShowAddModal(false)
      setNewUser({
        name: '',
        email: '',
        role: 'user',
        status: 'pending',
      })
    } catch (err: any) {
      console.error('Error adding user:', err)
      setError(err.message || 'Failed to add user')
    }
  }

  // Close add modal
  const handleCloseAddModal = () => {
    setShowAddModal(false)
    setNewUser({
      name: '',
      email: '',
      role: 'user',
      status: 'pending',
    })
    setError(null)
  }

  // Get status badge style
  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'approved':
        return {
          backgroundColor: '#d4edda',
          color: '#155724',
        }
      case 'pending':
        return {
          backgroundColor: '#fff3cd',
          color: '#856404',
        }
      case 'blocked':
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

  // Get role badge style
  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'admin':
        return {
          backgroundColor: '#d1ecf1',
          color: '#0c5460',
        }
      case 'seller':
        return {
          backgroundColor: '#d4edda',
          color: '#155724',
        }
      case 'user':
        return {
          backgroundColor: '#e2e3e5',
          color: '#383d41',
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
        <h1 style={{ margin: 0, color: '#333' }}>Users</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            placeholder="Search by name or email"
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '0.875rem',
              width: '250px',
            }}
          />
          <button
            onClick={() => setShowAddModal(true)}
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
            + Add User
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '1.5rem',
          alignItems: 'center',
        }}
      >
        <label
          style={{
            color: '#333',
            fontWeight: '500',
          }}
        >
          Role:
        </label>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
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
          <option value="user">User</option>
          <option value="seller">Seller</option>
          <option value="admin">Admin</option>
        </select>

        <label
          style={{
            color: '#333',
            fontWeight: '500',
            marginLeft: '1rem',
          }}
        >
          Status:
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
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="blocked">Blocked</option>
        </select>
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

      {/* Add User Modal */}
      {showAddModal && (
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
          onClick={handleCloseAddModal}
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
              Add New User
            </h2>
            <div style={{ marginBottom: '1rem' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: '#333',
                  fontWeight: '500',
                }}
              >
                Name *
              </label>
              <input
                type="text"
                value={newUser.name}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setNewUser({ ...newUser, name: e.target.value })
                }
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  boxSizing: 'border-box',
                }}
                placeholder="Enter user name"
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
                Email *
              </label>
              <input
                type="email"
                value={newUser.email}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setNewUser({ ...newUser, email: e.target.value })
                }
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  boxSizing: 'border-box',
                }}
                placeholder="Enter user email"
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
                Role
              </label>
              <select
                value={newUser.role}
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                  setNewUser({ ...newUser, role: e.target.value as 'user' | 'seller' | 'admin' })
                }
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  backgroundColor: '#fff',
                  boxSizing: 'border-box',
                }}
              >
                <option value="user">User</option>
                <option value="seller">Seller</option>
                <option value="admin">Admin</option>
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
                Status
              </label>
              <select
                value={newUser.status}
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                  setNewUser({
                    ...newUser,
                    status: e.target.value as 'approved' | 'pending' | 'blocked',
                  })
                }
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  backgroundColor: '#fff',
                  boxSizing: 'border-box',
                }}
              >
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="blocked">Blocked</option>
              </select>
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
                onClick={handleCloseAddModal}
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
                onClick={handleAddUser}
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
                Add User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Users List */}
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
            Loading users...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            No users found
            {(roleFilter !== 'all' || statusFilter !== 'all' || searchTerm.trim()) &&
              ' matching the filters'}.
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
                    Name
                  </th>
                  <th
                    style={{
                      padding: '0.75rem',
                      textAlign: 'left',
                      color: '#333',
                      fontWeight: '600',
                    }}
                  >
                    Email
                  </th>
                  <th
                    style={{
                      padding: '0.75rem',
                      textAlign: 'left',
                      color: '#333',
                      fontWeight: '600',
                    }}
                  >
                    Role
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
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    style={{
                      borderBottom: '1px solid #f0f0f0',
                    }}
                  >
                    <td style={{ padding: '0.75rem', color: '#333', fontWeight: '500' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {user.profileImageUrl && (
                          <img
                            src={user.profileImageUrl}
                            alt={user.name}
                            onClick={() => window.open(user.profileImageUrl, '_blank')}
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              objectFit: 'cover',
                              cursor: 'pointer',
                              border: '2px solid #ddd',
                            }}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                        )}
                        <span>{user.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem', color: '#666' }}>{user.email}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span
                        style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '12px',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          textTransform: 'capitalize',
                          ...getRoleBadgeStyle(user.role),
                        }}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span
                        style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '12px',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          textTransform: 'capitalize',
                          ...getStatusBadgeStyle(user.status),
                        }}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', color: '#666', fontSize: '0.875rem' }}>
                      {formatDate(user.createdAt)}
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
                        <select
                          value={user.role}
                          onChange={(e) =>
                            handleRoleChange(user.id, e.target.value as 'user' | 'seller' | 'admin')
                          }
                          style={{
                            padding: '0.25rem 0.5rem',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '0.875rem',
                            cursor: 'pointer',
                            backgroundColor: '#fff',
                          }}
                        >
                          <option value="user">User</option>
                          <option value="seller">Seller</option>
                          <option value="admin">Admin</option>
                        </select>
                        <select
                          value={user.status}
                          onChange={(e) =>
                            handleStatusChange(
                              user.id,
                              e.target.value as 'approved' | 'pending' | 'blocked'
                            )
                          }
                          style={{
                            padding: '0.25rem 0.5rem',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '0.875rem',
                            cursor: 'pointer',
                            backgroundColor: '#fff',
                          }}
                        >
                          <option value="approved">Approved</option>
                          <option value="pending">Pending</option>
                          <option value="blocked">Blocked</option>
                        </select>
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

export default Users
