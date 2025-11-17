import { useEffect, useState } from "react";
import { collection, getCountFromServer, query, where } from "firebase/firestore";
import { db } from "../firebase";

interface AdminStats {
  totalUsers: number;
  totalAds: number;
  approvedAds: number;
  pendingAds: number;
  totalPayments: number;
  pendingPayments: number;
}

const initialStats: AdminStats = {
  totalUsers: 0,
  totalAds: 0,
  approvedAds: 0,
  pendingAds: 0,
  totalPayments: 0,
  pendingPayments: 0,
};

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats>(initialStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setError(null);

        const usersRef = collection(db, "users");
        const adsRef = collection(db, "ads");
        const paymentsRef = collection(db, "payments");

        const [
          totalUsersSnap,
          totalAdsSnap,
          approvedAdsSnap,
          pendingAdsSnap,
          totalPaymentsSnap,
          pendingPaymentsSnap,
        ] = await Promise.all([
          getCountFromServer(usersRef),
          getCountFromServer(adsRef),
          getCountFromServer(query(adsRef, where("status", "==", "approved"))),
          getCountFromServer(query(adsRef, where("status", "==", "pending"))),
          getCountFromServer(paymentsRef),
          getCountFromServer(query(paymentsRef, where("status", "==", "pending"))),
        ]);

        setStats({
          totalUsers: totalUsersSnap.data().count,
          totalAds: totalAdsSnap.data().count,
          approvedAds: approvedAdsSnap.data().count,
          pendingAds: pendingAdsSnap.data().count,
          totalPayments: totalPaymentsSnap.data().count,
          pendingPayments: pendingPaymentsSnap.data().count,
        });
      } catch (err) {
        console.error("Error loading admin stats:", err);
        setError("Failed to load dashboard stats.");
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  return (
    <div style={{ padding: '1.5rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Dashboard</h1>

      {loading && <p>Loading dashboard stats...</p>}
      {error && (
        <div style={{ marginBottom: '1rem', borderRadius: '4px', backgroundColor: '#fee', color: '#c33', padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      {!loading && !error && (
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', padding: '1rem' }}>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem', margin: 0 }}>Total Users</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>{stats.totalUsers}</p>
          </div>

          <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', padding: '1rem' }}>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem', margin: 0 }}>Total Ads</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>{stats.totalAds}</p>
          </div>

          <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', padding: '1rem' }}>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem', margin: 0 }}>Approved Ads</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>{stats.approvedAds}</p>
          </div>

          <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', padding: '1rem' }}>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem', margin: 0 }}>Pending Ads</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>{stats.pendingAds}</p>
          </div>

          <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', padding: '1rem' }}>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem', margin: 0 }}>Total Payments</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>{stats.totalPayments}</p>
          </div>

          <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', padding: '1rem' }}>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem', margin: 0 }}>Pending Payments</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>{stats.pendingPayments}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
