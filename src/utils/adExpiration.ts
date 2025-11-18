import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp, Timestamp } from 'firebase/firestore'
import { db } from '../firebase'

// Check and update expired ads
export const checkAndUpdateExpiredAds = async () => {
  try {
    const now = new Date()
    const adsQuery = query(
      collection(db, 'ads'),
      where('status', '==', 'approved')
    )
    
    const snapshot = await getDocs(adsQuery)
    const updates: Promise<void>[] = []
    
    snapshot.forEach((docSnap) => {
      const data = docSnap.data()
      const expiresAt = data.expiresAt
      
      if (expiresAt) {
        // Convert Firestore Timestamp to Date if needed
        let expiryDate: Date
        if (expiresAt.toDate) {
          expiryDate = expiresAt.toDate()
        } else if (expiresAt instanceof Date) {
          expiryDate = expiresAt
        } else {
          return // Skip if invalid date
        }
        
        // If ad has expired, set status to pending
        if (expiryDate <= now) {
          updates.push(
            updateDoc(doc(db, 'ads', docSnap.id), {
              status: 'pending',
              updatedAt: serverTimestamp(),
            })
          )
        }
      }
    })
    
    await Promise.all(updates)
    return updates.length
  } catch (error) {
    console.error('Error checking expired ads:', error)
    return 0
  }
}

// Calculate remaining days for an ad
export const getRemainingDays = (expiresAt: Date | Timestamp | null | undefined): number | null => {
  if (!expiresAt) return null
  
  let expiryDate: Date
  if (expiresAt instanceof Date) {
    expiryDate = expiresAt
  } else if (expiresAt.toDate) {
    expiryDate = expiresAt.toDate()
  } else {
    return null
  }
  
  const now = new Date()
  const diffTime = expiryDate.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return diffDays > 0 ? diffDays : 0
}

// Format remaining days for display
export const formatRemainingDays = (expiresAt: Date | Timestamp | null | undefined): string => {
  const days = getRemainingDays(expiresAt)
  if (days === null) return 'N/A'
  if (days === 0) return 'Expired'
  if (days === 1) return '1 day left'
  return `${days} days left`
}

