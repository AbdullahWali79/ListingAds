# Practical Code Improvements - Ready to Implement

Yeh document mein aapko ready-to-use code examples milenge jo aap directly implement kar sakte hain.

## 🎯 Quick Wins (Pehle ye implement karein)

### 1. Reusable Button Component
**File**: `src/components/ui/Button.tsx`

```tsx
import { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: ReactNode
}

const Button = ({ 
  variant = 'primary', 
  size = 'md', 
  loading = false,
  children,
  className = '',
  disabled,
  ...props 
}: ButtonProps) => {
  const baseStyles = 'font-medium rounded transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
  }
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  }
  
  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? 'Loading...' : children}
    </button>
  )
}

export default Button
```

**Usage**:
```tsx
<Button variant="primary" size="md" loading={isSubmitting}>
  Submit
</Button>
```

---

### 2. Toast Notification System
**File**: `src/context/ToastContext.tsx`

```tsx
import { createContext, useContext, useState, ReactNode } from 'react'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = (message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts((prev) => [...prev, { id, message, type }])
    
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }, 3000)
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            style={{
              padding: '1rem 1.5rem',
              borderRadius: '8px',
              backgroundColor:
                toast.type === 'success'
                  ? '#10b981'
                  : toast.type === 'error'
                  ? '#ef4444'
                  : toast.type === 'warning'
                  ? '#f59e0b'
                  : '#3b82f6',
              color: 'white',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              minWidth: '300px',
              animation: 'slideIn 0.3s ease-out',
            }}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
```

**Usage in App.tsx**:
```tsx
import { ToastProvider } from './context/ToastContext'

function App() {
  return (
    <ToastProvider>
      {/* Your existing routes */}
    </ToastProvider>
  )
}
```

**Usage in components**:
```tsx
import { useToast } from '../context/ToastContext'

const MyComponent = () => {
  const { showToast } = useToast()
  
  const handleSubmit = async () => {
    try {
      // ... your logic
      showToast('Ad posted successfully!', 'success')
    } catch (error) {
      showToast('Failed to post ad', 'error')
    }
  }
}
```

---

### 3. Image URL Validator Utility
**File**: `src/utils/imageValidator.ts`

```tsx
export const isValidImageUrl = async (url: string): Promise<boolean> => {
  if (!url || !url.trim()) return false
  
  // Basic URL validation
  try {
    new URL(url)
  } catch {
    return false
  }
  
  // Check if URL is an image
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
  const lowerUrl = url.toLowerCase()
  const hasImageExtension = imageExtensions.some(ext => lowerUrl.includes(ext))
  
  if (!hasImageExtension && !lowerUrl.includes('image') && !lowerUrl.includes('img')) {
    return false
  }
  
  // Try to load image
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(true)
    img.onerror = () => resolve(false)
    img.src = url
  })
}

export const validateImageUrl = async (url: string): Promise<{ valid: boolean; error?: string }> => {
  if (!url.trim()) {
    return { valid: false, error: 'Image URL is required' }
  }
  
  if (!(await isValidImageUrl(url))) {
    return { valid: false, error: 'Invalid image URL. Please provide a valid image link.' }
  }
  
  return { valid: true }
}
```

**Usage in PostAd.tsx**:
```tsx
import { validateImageUrl } from '../utils/imageValidator'

const handleImageUrlBlur = async () => {
  if (imageUrl.trim()) {
    const result = await validateImageUrl(imageUrl)
    if (!result.valid) {
      setError(result.error || 'Invalid image URL')
    }
  }
}

// In your input:
<input
  // ... other props
  onBlur={handleImageUrlBlur}
/>
```

---

### 4. Loading Skeleton Component
**File**: `src/components/ui/Skeleton.tsx`

```tsx
const Skeleton = ({ width = '100%', height = '1rem', className = '' }: { 
  width?: string
  height?: string
  className?: string 
}) => {
  return (
    <div
      className={className}
      style={{
        width,
        height,
        backgroundColor: '#e5e7eb',
        borderRadius: '4px',
        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }}
    />
  )
}

export const AdCardSkeleton = () => {
  return (
    <div style={{ 
      backgroundColor: 'white', 
      borderRadius: '8px', 
      padding: '1rem',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <Skeleton width="100%" height="200px" style={{ marginBottom: '1rem' }} />
      <Skeleton width="80%" height="1.25rem" style={{ marginBottom: '0.5rem' }} />
      <Skeleton width="60%" height="1rem" style={{ marginBottom: '0.5rem' }} />
      <Skeleton width="40%" height="1.5rem" />
    </div>
  )
}

export default Skeleton
```

**Usage in Home.tsx**:
```tsx
import { AdCardSkeleton } from '../components/ui/Skeleton'

{loading ? (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
    {[...Array(6)].map((_, i) => (
      <AdCardSkeleton key={i} />
    ))}
  </div>
) : (
  // Your existing ads grid
)}
```

---

### 5. Search Component
**File**: `src/components/SearchBar.tsx`

```tsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const SearchBar = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const navigate = useNavigate()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ position: 'relative', width: '100%', maxWidth: '500px' }}>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search ads..."
        style={{
          width: '100%',
          padding: '0.75rem 3rem 0.75rem 1rem',
          border: '1px solid #ddd',
          borderRadius: '8px',
          fontSize: '1rem',
        }}
      />
      <button
        type="submit"
        style={{
          position: 'absolute',
          right: '0.5rem',
          top: '50%',
          transform: 'translateY(-50%)',
          padding: '0.5rem 1rem',
          backgroundColor: '#2563eb',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
        }}
      >
        Search
      </button>
    </form>
  )
}

export default SearchBar
```

**Add to PublicHeader.tsx**:
```tsx
import SearchBar from './SearchBar'

// Inside header, before nav:
<SearchBar />
```

---

### 6. Price Formatter Utility
**File**: `src/utils/formatters.ts`

```tsx
export const formatPrice = (price: number, currency: string = 'PKR'): string => {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

export const formatDate = (timestamp: any): string => {
  if (!timestamp) return '-'
  
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export const truncateText = (text: string, maxLength: number = 100): string => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}
```

**Usage**: Replace all formatPrice functions with this utility.

---

### 7. Responsive Table Component
**File**: `src/components/ui/ResponsiveTable.tsx`

```tsx
import { ReactNode } from 'react'

interface ResponsiveTableProps {
  headers: string[]
  rows: ReactNode[][]
  mobileView?: (row: ReactNode[], index: number) => ReactNode
}

const ResponsiveTable = ({ headers, rows, mobileView }: ResponsiveTableProps) => {
  return (
    <>
      {/* Desktop View */}
      <div style={{ display: 'block', overflowX: 'auto' }} className="desktop-only">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
              {headers.map((header, i) => (
                <th
                  key={i}
                  style={{
                    padding: '0.75rem',
                    textAlign: 'left',
                    fontWeight: '600',
                  }}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} style={{ borderBottom: '1px solid #f0f0f0' }}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} style={{ padding: '0.75rem' }}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile View */}
      <div style={{ display: 'none' }} className="mobile-only">
        {rows.map((row, index) => (
          <div
            key={index}
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1rem',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            {mobileView ? (
              mobileView(row, index)
            ) : (
              <>
                {headers.map((header, i) => (
                  <div key={i} style={{ marginBottom: '0.5rem' }}>
                    <strong>{header}:</strong> {row[i]}
                  </div>
                ))}
              </>
            )}
          </div>
        ))}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .desktop-only { display: none !important; }
          .mobile-only { display: block !important; }
        }
        @media (min-width: 769px) {
          .desktop-only { display: block !important; }
          .mobile-only { display: none !important; }
        }
      `}</style>
    </>
  )
}

export default ResponsiveTable
```

---

### 8. Constants File
**File**: `src/constants/index.ts`

```tsx
export const COLORS = {
  primary: '#2563eb',
  secondary: '#6c757d',
  success: '#28a745',
  danger: '#dc3545',
  warning: '#ffc107',
  info: '#17a2b8',
  light: '#f8f9fa',
  dark: '#343a40',
}

export const STATUS_COLORS = {
  pending: { bg: '#fff3cd', text: '#856404' },
  approved: { bg: '#d4edda', text: '#155724' },
  rejected: { bg: '#f8d7da', text: '#721c24' },
  blocked: { bg: '#f8d7da', text: '#721c24' },
}

export const SPACING = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
}

export const BREAKPOINTS = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
}

export const AD_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const

export const USER_ROLES = {
  USER: 'user',
  SELLER: 'seller',
  ADMIN: 'admin',
} as const

export const PAYMENT_METHODS = [
  { value: 'bank', label: 'Bank Transfer' },
  { value: 'easypaisa', label: 'EasyPaisa' },
  { value: 'jazzcash', label: 'JazzCash' },
  { value: 'card', label: 'Card' },
] as const
```

---

## 📝 Implementation Steps

1. **Pehle ye files create karein:**
   - `src/components/ui/Button.tsx`
   - `src/context/ToastContext.tsx`
   - `src/utils/imageValidator.ts`
   - `src/utils/formatters.ts`
   - `src/constants/index.ts`

2. **Phir existing components mein integrate karein:**
   - PostAd.tsx mein Button component use karein
   - ToastContext ko App.tsx mein wrap karein
   - formatPrice ko replace karein with utility function

3. **Gradually improve karein:**
   - Search functionality add karein
   - Loading skeletons add karein
   - Responsive tables implement karein

---

## 🎨 CSS Improvements

**Add to `src/index.css`:**

```css
/* Design System Variables */
:root {
  --color-primary: #2563eb;
  --color-secondary: #6c757d;
  --color-success: #28a745;
  --color-danger: #dc3545;
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  --border-radius: 8px;
  --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
}

/* Animations */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Responsive Utilities */
@media (max-width: 768px) {
  .hide-mobile { display: none !important; }
}

@media (min-width: 769px) {
  .hide-desktop { display: none !important; }
}
```

---

## ✅ Next Steps

1. ✅ Reusable components create karein
2. ✅ Toast system implement karein
3. ✅ Utilities extract karein
4. ✅ Constants file create karein
5. ✅ Search functionality add karein
6. ✅ Loading states improve karein
7. ✅ Responsive design enhance karein

**Note**: In sab improvements ko step-by-step implement karein. Pehle basic components aur utilities create karein, phir gradually existing code mein integrate karein.

