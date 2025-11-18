import { useEffect, useState, FormEvent } from "react";
import { Link } from "react-router-dom";
import { collection, onSnapshot, query, where, orderBy, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuthContext } from "../context/AuthContext";
import { getRemainingDays } from "../utils/adExpiration";

type MyAd = {
  id: string;
  title?: string;
  categoryName?: string;
  price?: number;
  status?: string;
  createdAt?: any;
  isDeleted?: boolean;
  expiresAt?: Date | any;
  durationDays?: number;
};

const UserDashboard: React.FC = () => {
  const { firebaseUser, userDoc, authLoading } = useAuthContext();
  const [myAds, setMyAds] = useState<MyAd[]>([]);
  const [adsLoading, setAdsLoading] = useState(false);
  const [adsError, setAdsError] = useState<string | null>(null);
  const [showReactivationModal, setShowReactivationModal] = useState(false);
  const [selectedAd, setSelectedAd] = useState<MyAd | null>(null);
  const [reactivationData, setReactivationData] = useState({
    paymentAmount: '',
    paymentMethod: '',
    referenceNumber: '',
    paymentProofUrl: '',
  });
  const [reactivationLoading, setReactivationLoading] = useState(false);

  // Show loading while auth is loading
  if (authLoading) {
    return (
      <div style={{ maxWidth: '1024px', margin: '0 auto', padding: '2.5rem 1rem' }}>
        <p>Loading...</p>
      </div>
    );
  }

  // If no user, show message (should be handled by UserProtectedRoute, but just in case)
  if (!firebaseUser) {
    return (
      <div style={{ maxWidth: '1024px', margin: '0 auto', padding: '2.5rem 1rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>My Account</h1>
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', padding: '1.5rem' }}>
          <p>Please login to view your dashboard.</p>
        </div>
      </div>
    );
  }

  // Get role and status - handle case where userDoc might be null
  const role = (userDoc?.role || "user").toLowerCase();
  const status = (userDoc?.status || "approved").toLowerCase();

  // Debug logging
  console.log("UserDashboard - firebaseUser:", firebaseUser?.uid);
  console.log("UserDashboard - userDoc:", userDoc);
  console.log("UserDashboard - role:", role);
  console.log("UserDashboard - status:", status);

  useEffect(() => {
    if (!firebaseUser) return;
    if (role !== "seller") {
      setAdsLoading(false);
      return;
    }

    setAdsLoading(true);
    setAdsError(null);

    try {
      const baseRef = collection(db, "ads");

      // Try with orderBy first, but if it fails (no index), fall back to just where
      let q;
      try {
        q = query(
          baseRef,
          where("sellerId", "==", firebaseUser.uid),
          orderBy("createdAt", "desc")
        );
      } catch (indexError) {
        // If orderBy fails (no index), use just where clause
        console.warn("Index not found, using query without orderBy:", indexError);
        q = query(
          baseRef,
          where("sellerId", "==", firebaseUser.uid)
        );
      }

      const unsub = onSnapshot(
        q,
        (snapshot) => {
          const items: MyAd[] = snapshot.docs.map((docSnap) => {
            const data = docSnap.data() as any;
            // Convert expiresAt if it's a Firestore Timestamp
            let expiresAt = data.expiresAt
            if (expiresAt && expiresAt.toDate) {
              expiresAt = expiresAt.toDate()
            }
            
            return {
              id: docSnap.id,
              title: data.title,
              categoryName: data.categoryName,
              price: data.price,
              status: data.status,
              createdAt: data.createdAt,
              isDeleted: data.isDeleted,
              expiresAt: expiresAt,
              durationDays: data.durationDays,
            };
          });
          // filter out deleted ads if field exists
          const filtered = items.filter((ad) => !ad.isDeleted);
          // Sort by createdAt manually if orderBy wasn't used
          filtered.sort((a, b) => {
            if (!a.createdAt || !b.createdAt) return 0;
            const aTime = a.createdAt.toDate ? a.createdAt.toDate().getTime() : 0;
            const bTime = b.createdAt.toDate ? b.createdAt.toDate().getTime() : 0;
            return bTime - aTime; // newest first
          });
          setMyAds(filtered);
          setAdsLoading(false);
        },
        (error) => {
          console.error("Error loading seller ads:", error);
          // If it's an index error, try without orderBy
          if (error.code === 'failed-precondition' || error.message?.includes('index')) {
            console.log("Retrying without orderBy...");
            const simpleQuery = query(
              baseRef,
              where("sellerId", "==", firebaseUser.uid)
            );
            const unsub2 = onSnapshot(
              simpleQuery,
              (snapshot) => {
                const items: MyAd[] = snapshot.docs.map((docSnap) => {
                  const data = docSnap.data() as any;
                  // Convert expiresAt if it's a Firestore Timestamp
                  let expiresAt = data.expiresAt
                  if (expiresAt && expiresAt.toDate) {
                    expiresAt = expiresAt.toDate()
                  }
                  
                  return {
                    id: docSnap.id,
                    title: data.title,
                    categoryName: data.categoryName,
                    price: data.price,
                    status: data.status,
                    createdAt: data.createdAt,
                    isDeleted: data.isDeleted,
                    expiresAt: expiresAt,
                    durationDays: data.durationDays,
                  };
                });
                const filtered = items.filter((ad) => !ad.isDeleted);
                filtered.sort((a, b) => {
                  if (!a.createdAt || !b.createdAt) return 0;
                  const aTime = a.createdAt.toDate ? a.createdAt.toDate().getTime() : 0;
                  const bTime = b.createdAt.toDate ? b.createdAt.toDate().getTime() : 0;
                  return bTime - aTime;
                });
                setMyAds(filtered);
                setAdsLoading(false);
              },
              (err2) => {
                console.error("Error loading seller ads (retry):", err2);
                setAdsError("Failed to load your ads.");
                setAdsLoading(false);
              }
            );
            return () => unsub2();
          } else {
            setAdsError("Failed to load your ads.");
            setAdsLoading(false);
          }
        }
      );

      return () => unsub();
    } catch (err) {
      console.error("Error initializing ads listener:", err);
      setAdsError("Failed to load your ads.");
      setAdsLoading(false);
    }
  }, [firebaseUser, role]);

  // Handle reactivation request
  const handleReactivationRequest = async (e: FormEvent) => {
    e.preventDefault()
    if (!selectedAd || !firebaseUser || !userDoc) return

    setReactivationLoading(true)
    setAdsError(null)

    try {
      // Create reactivation request
      await addDoc(collection(db, 'reactivationRequests'), {
        adId: selectedAd.id,
        adTitle: selectedAd.title || 'Untitled',
        sellerId: firebaseUser.uid,
        sellerName: userDoc.name || firebaseUser.displayName || 'Unknown',
        sellerEmail: userDoc.email || firebaseUser.email || '',
        paymentAmount: parseFloat(reactivationData.paymentAmount) || 0,
        paymentMethod: reactivationData.paymentMethod,
        referenceNumber: reactivationData.referenceNumber.trim() || null,
        paymentProofUrl: reactivationData.paymentProofUrl.trim(),
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      setShowReactivationModal(false)
      setSelectedAd(null)
      setReactivationData({
        paymentAmount: '',
        paymentMethod: '',
        referenceNumber: '',
        paymentProofUrl: '',
      })
      alert('Reactivation request submitted successfully! Admin will review it soon.')
    } catch (err: any) {
      console.error('Error submitting reactivation request:', err)
      setAdsError(err.message || 'Failed to submit reactivation request')
    } finally {
      setReactivationLoading(false)
    }
  }

  // Open reactivation modal
  const openReactivationModal = (ad: MyAd) => {
    setSelectedAd(ad)
    setShowReactivationModal(true)
  }

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2.5rem 1rem' }}>
      <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>My Account</h1>

      {/* profile card */}
      <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', padding: '1.5rem', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Profile</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <p style={{ margin: 0 }}>
            <span style={{ fontWeight: '500' }}>Name:</span> {userDoc?.name || firebaseUser.displayName || "—"}
          </p>
          <p style={{ margin: 0 }}>
            <span style={{ fontWeight: '500' }}>Email:</span> {userDoc?.email || firebaseUser.email || "—"}
          </p>
          <p style={{ margin: 0 }}>
            <span style={{ fontWeight: '500' }}>Role:</span> {role.charAt(0).toUpperCase() + role.slice(1)}
          </p>
          <p style={{ margin: 0 }}>
            <span style={{ fontWeight: '500' }}>Status:</span>{" "}
            <span
              style={{
                display: 'inline-block',
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontWeight: '600',
                backgroundColor:
                  status === "approved"
                    ? "#d4edda"
                    : status === "pending"
                    ? "#fff3cd"
                    : "#f8d7da",
                color:
                  status === "approved"
                    ? "#155724"
                    : status === "pending"
                    ? "#856404"
                    : "#721c24",
              }}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          </p>
        </div>
      </div>

      {/* Role-based sections */}

      {/* For admin */}
      {role === "admin" && (
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.75rem' }}>Admin Account</h2>
          <p style={{ marginBottom: '1rem' }}>
            You are an admin. Use the admin panel to manage categories, ads, users, and payments.
          </p>
          <Link
            to="/admin"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              backgroundColor: '#2563eb',
              color: 'white',
              fontSize: '0.875rem',
              fontWeight: '500',
              textDecoration: 'none',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#1d4ed8';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#2563eb';
            }}
          >
            Go to Admin Panel
          </Link>
        </div>
      )}

      {/* For buyer (role "user") */}
      {role === "user" && (
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.75rem' }}>Buyer Dashboard</h2>
          <p style={{ marginBottom: '1rem' }}>
            In the future you will see your saved ads and recent activity here.
          </p>
          <ul style={{ listStyle: 'disc', listStylePosition: 'inside', fontSize: '0.875rem', color: '#374151', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <li>Saved ads</li>
            <li>Recently viewed ads</li>
            <li>Recommended listings</li>
          </ul>
        </div>
      )}

      {/* For seller */}
      {role === "seller" && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Status message for sellers */}
          {status === "pending" && (
            <div style={{
              backgroundColor: '#fff3cd',
              border: '1px solid #ffc107',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '0.5rem',
            }}>
              <p style={{ margin: 0, color: '#856404', fontWeight: '500' }}>
                ⚠️ Your seller account is pending approval. You can view your ads but cannot post new ads until an admin approves your account.
              </p>
            </div>
          )}
          
          {status === "approved" && (
            <div style={{
              backgroundColor: '#d4edda',
              border: '1px solid #28a745',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '0.5rem',
            }}>
              <p style={{ margin: 0, color: '#155724', fontWeight: '500' }}>
                ✅ Your seller account is approved! You can now post ads.
              </p>
            </div>
          )}

          <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.25rem' }}>Seller Dashboard</h2>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                Manage your ads and track their status.
              </p>
            </div>
            {status === "approved" ? (
              <Link
                to="/post-ad"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  textDecoration: 'none',
                  cursor: 'pointer',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#1d4ed8';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#2563eb';
                }}
              >
                Post New Ad
              </Link>
            ) : (
              <button
                disabled
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  backgroundColor: '#ccc',
                  color: '#666',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  border: 'none',
                  cursor: 'not-allowed',
                }}
                title="Your account needs admin approval to post ads"
              >
                Post New Ad (Pending Approval)
              </button>
            )}
          </div>

          <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>My Ads</h3>

            {adsLoading && <p>Loading your ads...</p>}
            {adsError && <p style={{ color: '#dc2626', fontSize: '0.875rem', marginBottom: '0.5rem' }}>{adsError}</p>}

            {!adsLoading && !adsError && myAds.length === 0 && (
              <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>You have not posted any ads yet.</p>
            )}

            {!adsLoading && !adsError && myAds.length > 0 && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <th style={{ textAlign: 'left', padding: '0.5rem 1rem 0.5rem 0', fontWeight: '500' }}>Title</th>
                      <th style={{ textAlign: 'left', padding: '0.5rem 1rem 0.5rem 0', fontWeight: '500' }}>Category</th>
                      <th style={{ textAlign: 'left', padding: '0.5rem 1rem 0.5rem 0', fontWeight: '500' }}>Price</th>
                      <th style={{ textAlign: 'left', padding: '0.5rem 1rem 0.5rem 0', fontWeight: '500' }}>Status</th>
                      <th style={{ textAlign: 'left', padding: '0.5rem 1rem 0.5rem 0', fontWeight: '500' }}>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myAds.map((ad) => {
                      const adStatus = (ad.status || "pending").toLowerCase();
                      const created =
                        ad.createdAt && ad.createdAt.toDate
                          ? ad.createdAt.toDate().toLocaleString()
                          : "-";
                      
                      // Check if ad is expired
                      const remainingDays = ad.expiresAt ? getRemainingDays(ad.expiresAt) : null;
                      const isExpired = remainingDays !== null && remainingDays <= 0;
                      const showReactivation = (adStatus === 'pending' && isExpired) || (adStatus === 'pending' && remainingDays === null);

                      return (
                        <tr key={ad.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                          <td style={{ padding: '0.5rem 1rem 0.5rem 0' }}>
                            <Link
                              to={`/ad/${ad.id}`}
                              style={{
                                color: '#2563eb',
                                textDecoration: 'none',
                              }}
                              onMouseOver={(e) => {
                                e.currentTarget.style.textDecoration = 'underline';
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.textDecoration = 'none';
                              }}
                            >
                              {ad.title || "Untitled"}
                            </Link>
                          </td>
                          <td style={{ padding: '0.5rem 1rem 0.5rem 0' }}>{ad.categoryName || "-"}</td>
                          <td style={{ padding: '0.5rem 1rem 0.5rem 0' }}>
                            {typeof ad.price === "number" ? `PKR ${ad.price.toLocaleString()}` : "-"}
                          </td>
                          <td style={{ padding: '0.5rem 1rem 0.5rem 0' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                backgroundColor:
                                  adStatus === "approved"
                                    ? "#d4edda"
                                    : adStatus === "pending"
                                    ? "#fff3cd"
                                    : "#f8d7da",
                                color:
                                  adStatus === "approved"
                                    ? "#155724"
                                    : adStatus === "pending"
                                    ? "#856404"
                                    : "#721c24",
                              }}
                            >
                              {adStatus.charAt(0).toUpperCase() + adStatus.slice(1)}
                            </span>
                            {isExpired && (
                              <span style={{ 
                                marginLeft: '0.5rem',
                                fontSize: '0.75rem',
                                color: '#dc3545'
                              }}>
                                (Expired)
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '0.5rem 1rem 0.5rem 0' }}>
                            {created}
                            {showReactivation && (
                              <button
                                onClick={() => openReactivationModal(ad)}
                                style={{
                                  marginTop: '0.5rem',
                                  padding: '0.25rem 0.75rem',
                                  backgroundColor: '#007bff',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  fontSize: '0.75rem',
                                  cursor: 'pointer',
                                  display: 'block',
                                }}
                              >
                                Request Reactivation
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reactivation Modal */}
      {showReactivationModal && selectedAd && (
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
          onClick={() => setShowReactivationModal(false)}
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
              Request Ad Reactivation
            </h2>
            <p style={{ marginBottom: '1.5rem', color: '#666', fontSize: '0.875rem' }}>
              Your ad "{selectedAd.title || 'Untitled'}" has expired. Submit payment proof to reactivate it.
            </p>
            <form onSubmit={handleReactivationRequest}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333', fontWeight: '500' }}>
                  Payment Amount (PKR) *
                </label>
                <input
                  type="number"
                  value={reactivationData.paymentAmount}
                  onChange={(e) => setReactivationData({ ...reactivationData, paymentAmount: e.target.value })}
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
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333', fontWeight: '500' }}>
                  Payment Method *
                </label>
                <select
                  value={reactivationData.paymentMethod}
                  onChange={(e) => setReactivationData({ ...reactivationData, paymentMethod: e.target.value })}
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
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333', fontWeight: '500' }}>
                  Reference/Transaction Number (Optional)
                </label>
                <input
                  type="text"
                  value={reactivationData.referenceNumber}
                  onChange={(e) => setReactivationData({ ...reactivationData, referenceNumber: e.target.value })}
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
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333', fontWeight: '500' }}>
                  Payment Proof Image URL *
                </label>
                <input
                  type="url"
                  value={reactivationData.paymentProofUrl}
                  onChange={(e) => setReactivationData({ ...reactivationData, paymentProofUrl: e.target.value })}
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
              {adsError && (
                <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#fee', color: '#c33', borderRadius: '4px', fontSize: '0.875rem' }}>
                  {adsError}
                </div>
              )}
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowReactivationModal(false)
                    setSelectedAd(null)
                    setReactivationData({
                      paymentAmount: '',
                      paymentMethod: '',
                      referenceNumber: '',
                      paymentProofUrl: '',
                    })
                    setAdsError(null)
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
                  disabled={reactivationLoading}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: reactivationLoading ? '#ccc' : '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: reactivationLoading ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                  }}
                >
                  {reactivationLoading ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
