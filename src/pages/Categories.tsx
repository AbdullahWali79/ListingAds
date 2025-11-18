import { useState, useEffect } from 'react'
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  type Timestamp,
} from 'firebase/firestore'
import { db } from '../firebase'

interface Category {
  id: string
  name: string
  slug: string
  description?: string
  isActive: boolean
  order?: number
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

interface CategoryFormData {
  name: string
  slug: string
  description: string
  isActive: boolean
  order: string
}

const Categories = () => {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [form, setForm] = useState<CategoryFormData>({
    name: '',
    slug: '',
    description: '',
    isActive: true,
    order: '',
  })

  // Generate slug from name
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
  }

  // Real-time categories list
  useEffect(() => {
    setLoading(true)
    
    // Use simple query without orderBy to avoid index requirement
    // We'll sort manually in JavaScript
    const categoriesQuery = query(collection(db, 'categories'))

    const unsubscribe = onSnapshot(
      categoriesQuery,
      (snapshot) => {
        const categoriesList: Category[] = []
        snapshot.forEach((doc) => {
          const data = doc.data()
          categoriesList.push({
            id: doc.id,
            name: data.name || '',
            slug: data.slug || '',
            description: data.description || '',
            isActive: data.isActive !== undefined ? data.isActive : true,
            order: data.order,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          } as Category)
        })
        // Sort manually: first by order, then by createdAt
        categoriesList.sort((a, b) => {
          const orderA = a.order ?? 999999
          const orderB = b.order ?? 999999
          if (orderA !== orderB) return orderA - orderB
          const timeA = a.createdAt?.toMillis() ?? 0
          const timeB = b.createdAt?.toMillis() ?? 0
          return timeB - timeA // Newest first
        })
        setCategories(categoriesList)
        setLoading(false)
        setError(null)
      },
      (err: any) => {
        console.error('Error fetching categories:', err)
        // More specific error message
        if (err.code === 'permission-denied') {
          setError('Permission denied. Please check Firestore security rules.')
        } else if (err.code === 'failed-precondition') {
          setError('Firestore index required. Please create the index in Firebase Console.')
        } else {
          setError(`Failed to load categories: ${err.message || 'Unknown error'}`)
        }
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  // Handle form input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    if (name === 'name' && !form.slug) {
      // Auto-generate slug from name if slug is empty
      setForm({
        ...form,
        name: value,
        slug: generateSlug(value),
      })
    } else {
      setForm({
        ...form,
        [name]: type === 'checkbox' ? checked : value,
      })
    }
  }

  // Reset form
  const resetForm = () => {
    setForm({
      name: '',
      slug: '',
      description: '',
      isActive: true,
      order: '',
    })
    setEditingCategory(null)
    setIsFormOpen(false)
  }

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!form.name.trim()) {
      setError('Name is required')
      return
    }

    if (!form.slug.trim()) {
      setError('Slug is required')
      return
    }

    try {
      const categoryData: any = {
        name: form.name.trim(),
        slug: form.slug.trim().toLowerCase(),
        description: form.description.trim() || '',
        isActive: form.isActive,
        updatedAt: serverTimestamp(),
      }

      if (form.order) {
        categoryData.order = parseInt(form.order) || 0
      }

      if (editingCategory) {
        // Update existing category
        await updateDoc(doc(db, 'categories', editingCategory.id), categoryData)
      } else {
        // Add new category
        categoryData.createdAt = serverTimestamp()
        await addDoc(collection(db, 'categories'), categoryData)
      }

      resetForm()
    } catch (err: any) {
      console.error('Error saving category:', err)
      setError(err.message || 'Failed to save category')
    }
  }

  // Handle edit
  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setForm({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      isActive: category.isActive,
      order: category.order?.toString() || '',
    })
    setIsFormOpen(true)
  }

  // Handle delete
  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) {
      return
    }

    try {
      await deleteDoc(doc(db, 'categories', id))
      setError(null)
    } catch (err: any) {
      console.error('Error deleting category:', err)
      setError(err.message || 'Failed to delete category')
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
        <h1 style={{ margin: 0, color: '#333' }}>Categories</h1>
        <button
          onClick={() => {
            resetForm()
            setIsFormOpen(true)
          }}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '500',
            transition: 'background-color 0.2s',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#0056b3'
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#007bff'
          }}
        >
          Add Category
        </button>
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

      {/* Add/Edit Form */}
      {isFormOpen && (
        <div
          style={{
            backgroundColor: '#fff',
            padding: '1.5rem',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            marginBottom: '2rem',
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: '1rem', color: '#333' }}>
            {editingCategory ? 'Edit Category' : 'Add Category'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: '#333',
                  fontWeight: '500',
                }}
              >
                Name <span style={{ color: '#dc3545' }}>*</span>
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleInputChange}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  boxSizing: 'border-box',
                }}
                placeholder="Category name"
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
                Slug <span style={{ color: '#dc3545' }}>*</span>
              </label>
              <input
                type="text"
                name="slug"
                value={form.slug}
                onChange={handleInputChange}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  boxSizing: 'border-box',
                }}
                placeholder="url-friendly-slug"
              />
              <small style={{ color: '#666', fontSize: '0.875rem' }}>
                Auto-generated from name if left empty
              </small>
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
                Description
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleInputChange}
                rows={3}
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
                placeholder="Category description (optional)"
              />
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
                marginBottom: '1rem',
              }}
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    color: '#333',
                    fontWeight: '500',
                  }}
                >
                  Order
                </label>
                <input
                  type="number"
                  name="order"
                  value={form.order}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1rem',
                    boxSizing: 'border-box',
                  }}
                  placeholder="0"
                />
              </div>

              <div>
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
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    paddingTop: '0.75rem',
                  }}
                >
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={form.isActive}
                    onChange={handleInputChange}
                    style={{
                      width: '18px',
                      height: '18px',
                      marginRight: '0.5rem',
                      cursor: 'pointer',
                    }}
                  />
                  <span style={{ color: '#333' }}>Active</span>
                </div>
              </div>
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
                onClick={resetForm}
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
                {editingCategory ? 'Update Category' : 'Create Category'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories List */}
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
            Loading categories...
          </div>
        ) : categories.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            No categories found. Click "Add Category" to create one.
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
                    Slug
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
                    Order
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
                {categories.map((category) => (
                  <tr
                    key={category.id}
                    style={{
                      borderBottom: '1px solid #f0f0f0',
                    }}
                  >
                    <td style={{ padding: '0.75rem', color: '#333' }}>
                      {category.name}
                    </td>
                    <td style={{ padding: '0.75rem', color: '#666' }}>
                      <code
                        style={{
                          backgroundColor: '#f5f5f5',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '3px',
                          fontSize: '0.875rem',
                        }}
                      >
                        {category.slug}
                      </code>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span
                        style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '12px',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          backgroundColor: category.isActive
                            ? '#d4edda'
                            : '#f8d7da',
                          color: category.isActive ? '#155724' : '#721c24',
                        }}
                      >
                        {category.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', color: '#666' }}>
                      {category.order ?? '-'}
                    </td>
                    <td
                      style={{
                        padding: '0.75rem',
                        textAlign: 'right',
                      }}
                    >
                      <button
                        onClick={() => handleEdit(category)}
                        style={{
                          padding: '0.25rem 0.75rem',
                          marginRight: '0.5rem',
                          backgroundColor: '#ffc107',
                          color: '#333',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(category.id, category.name)}
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

export default Categories
