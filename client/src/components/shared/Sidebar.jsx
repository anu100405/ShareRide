import { useAuth } from '../../context/AuthContext';

const navItems = {
  passenger: [
    { id: 'book', label: 'Book Ride', icon: '🚕' },
    { id: 'rides', label: 'My Rides', icon: '📋' },
    { id: 'shared', label: 'Shared Rides', icon: '🤝' },
    { id: 'nearby', label: 'Nearby Drivers', icon: '📍' },
    { id: 'fares', label: 'Fare Guide', icon: '💲' },
    { id: 'profile', label: 'Profile', icon: '👤' },
  ],
  driver: [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
    { id: 'rides', label: 'Ride History', icon: '📋' },
    { id: 'earnings', label: 'Earnings', icon: '💰' },
    { id: 'fares', label: 'Fare Guide', icon: '💲' },
    { id: 'profile', label: 'Profile', icon: '👤' },
  ],
};

export default function Sidebar({ active, onNav }) {
  const { user, logout } = useAuth();
  const items = navItems[user?.role] || [];

  return (
    <aside style={{
      width: 220, background: 'var(--bg2)', borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', padding: '24px 0',
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '0 20px 28px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18,
          }}>🚕</div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, letterSpacing: '-0.04em' }}>ShareRide</span>
        </div>
      </div>

      {/* User info */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%', background: 'var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: '#0a0a0f',
          marginBottom: 10,
        }}>
          {user?.name?.[0]?.toUpperCase()}
        </div>
        <p style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.3 }}>{user?.name}</p>
        <p style={{ fontSize: 12, color: 'var(--text2)', textTransform: 'capitalize' }}>{user?.role}</p>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 12px' }}>
        {items.map(item => (
          <button key={item.id} onClick={() => onNav(item.id)} style={{
            display: 'flex', alignItems: 'center', gap: 10, width: '100%',
            padding: '11px 12px', borderRadius: 8, border: 'none',
            background: active === item.id ? 'var(--accent-glow)' : 'transparent',
            color: active === item.id ? 'var(--accent)' : 'var(--text2)',
            fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14,
            cursor: 'pointer', transition: 'all 0.15s',
            borderLeft: active === item.id ? '2px solid var(--accent)' : '2px solid transparent',
          }}
            onMouseEnter={e => active !== item.id && (e.currentTarget.style.color = 'var(--text)')}
            onMouseLeave={e => active !== item.id && (e.currentTarget.style.color = 'var(--text2)')}
          >
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* Logout */}
      <div style={{ padding: '12px 12px', borderTop: '1px solid var(--border)' }}>
        <button onClick={logout} style={{
          display: 'flex', alignItems: 'center', gap: 10, width: '100%',
          padding: '10px 12px', borderRadius: 8, border: 'none',
          background: 'transparent', color: 'var(--text3)',
          fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14, cursor: 'pointer',
          transition: 'color 0.15s',
        }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text3)'}
        >
          <span>↩</span> Sign Out
        </button>
      </div>
    </aside>
  );
}
