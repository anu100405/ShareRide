import { useState } from 'react';

const styles = {
  btn: {
    base: {
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      padding: '12px 24px', borderRadius: 10, fontWeight: 700, fontSize: 15,
      transition: 'all 0.2s', cursor: 'pointer', border: 'none',
    },
    primary: {
      background: 'var(--accent)', color: '#0a0a0f',
    },
    secondary: {
      background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border2)',
    },
    danger: {
      background: 'rgba(255,79,79,0.1)', color: 'var(--red)', border: '1px solid rgba(255,79,79,0.3)',
    },
    ghost: {
      background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border)',
    },
  },
  input: {
    display: 'block', width: '100%', padding: '12px 16px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 10, color: 'var(--text)', outline: 'none',
    transition: 'border-color 0.2s',
  },
};

export const Button = ({ variant = 'primary', children, loading, style, ...props }) => (
  <button
    {...props}
    style={{
      ...styles.btn.base,
      ...styles.btn[variant],
      opacity: (props.disabled || loading) ? 0.5 : 1,
      width: style?.width === '100%' ? '100%' : undefined,
      ...style,
    }}
  >
    {loading ? <Spinner size={16} /> : children}
  </button>
);

export const Input = ({ label, error, style, ...props }) => (
  <div style={{ marginBottom: 16, ...style }}>
    {label && <label style={{ display: 'block', fontSize: 12, color: 'var(--text2)', marginBottom: 6, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</label>}
    <input
      {...props}
      style={{
        ...styles.input,
        borderColor: error ? 'var(--red)' : 'var(--border)',
      }}
      onFocus={e => e.target.style.borderColor = 'var(--accent)'}
      onBlur={e => e.target.style.borderColor = error ? 'var(--red)' : 'var(--border)'}
    />
    {error && <p style={{ marginTop: 4, fontSize: 12, color: 'var(--red)' }}>{error}</p>}
  </div>
);

export const Select = ({ label, options, style, ...props }) => (
  <div style={{ marginBottom: 16, ...style }}>
    {label && <label style={{ display: 'block', fontSize: 12, color: 'var(--text2)', marginBottom: 6, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</label>}
    <select
      {...props}
      style={{
        ...styles.input,
        appearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%239090aa' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 12px center',
        backgroundSize: 16,
        paddingRight: 40,
      }}
    >
      {options.map(o => (
        <option key={o.value} value={o.value} style={{ background: '#1e1e2e' }}>{o.label}</option>
      ))}
    </select>
  </div>
);

export const Card = ({ children, style, onClick }) => (
  <div
    onClick={onClick}
    style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: 20,
      cursor: onClick ? 'pointer' : 'default',
      transition: 'border-color 0.2s',
      ...style,
    }}
    onMouseEnter={e => onClick && (e.currentTarget.style.borderColor = 'var(--border2)')}
    onMouseLeave={e => onClick && (e.currentTarget.style.borderColor = 'var(--border)')}
  >
    {children}
  </div>
);

export const Spinner = ({ size = 24 }) => (
  <div style={{
    width: size, height: size, borderRadius: '50%',
    border: `2px solid var(--border)`,
    borderTopColor: 'var(--accent)',
    animation: 'spin 0.8s linear infinite',
    flexShrink: 0,
  }} />
);

export const Badge = ({ children, variant = 'default' }) => {
  const colors = {
    default: { bg: 'var(--surface2)', color: 'var(--text2)' },
    success: { bg: 'rgba(61,220,132,0.1)', color: 'var(--green)' },
    warning: { bg: 'rgba(240,192,64,0.1)', color: 'var(--accent)' },
    danger: { bg: 'rgba(255,79,79,0.1)', color: 'var(--red)' },
    info: { bg: 'rgba(91,156,246,0.1)', color: 'var(--blue)' },
  };
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: 20,
      fontSize: 12, fontWeight: 600, letterSpacing: '0.03em',
      ...colors[variant],
    }}>
      {children}
    </span>
  );
};

export const Modal = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg2)', border: '1px solid var(--border2)',
          borderRadius: 'var(--radius)', padding: 28, width: '100%', maxWidth: 480,
          animation: 'fadeUp 0.2s ease',
        }}
      >
        {title && <h3 style={{ marginBottom: 20, fontSize: 20 }}>{title}</h3>}
        {children}
      </div>
    </div>
  );
};

export const Toast = ({ message, type = 'info' }) => {
  const colors = { info: 'var(--blue)', success: 'var(--green)', error: 'var(--red)', warning: 'var(--accent)' };
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 2000,
      background: 'var(--surface)', border: `1px solid ${colors[type]}`,
      borderRadius: 10, padding: '14px 20px', maxWidth: 360,
      animation: 'fadeUp 0.3s ease', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      display: 'flex', gap: 12, alignItems: 'flex-start',
    }}>
      <div style={{ width: 4, borderRadius: 4, background: colors[type], alignSelf: 'stretch' }} />
      <p style={{ color: 'var(--text)', fontSize: 14 }}>{message}</p>
    </div>
  );
};

export const useToast = () => {
  const [toast, setToast] = useState(null);
  const show = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };
  return { toast, show };
};

export const StatusDot = ({ status }) => {
  const map = {
    online: 'var(--green)', offline: 'var(--text3)', on_ride: 'var(--accent)',
    searching: 'var(--blue)', accepted: 'var(--green)', in_progress: 'var(--accent)',
    completed: 'var(--green)', cancelled: 'var(--red)',
  };
  return (
    <span style={{
      display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
      background: map[status] || 'var(--text3)', marginRight: 6,
    }} />
  );
};

export const Divider = ({ style }) => (
  <div style={{ height: 1, background: 'var(--border)', margin: '20px 0', ...style }} />
);
