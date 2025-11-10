'use client';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'danger' | 'success' | 'info';
  children?: React.ReactNode;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  type = 'info',
  children,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const buttonColors = {
    danger: { bg: '#dc3545', hover: '#c82333' },
    success: { bg: '#28a745', hover: '#218838' },
    info: { bg: '#0070f3', hover: '#0051cc' },
  };

  const buttonColor = buttonColors[type];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
      }}
      onClick={onCancel}
    >
      <div
        className="card"
        style={{
          maxWidth: '500px',
          width: '90%',
          margin: '20px',
          background: 'white',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ marginBottom: '15px' }}>{title}</h2>
        <p style={{ marginBottom: children ? '15px' : '25px', color: '#666' }}>{message}</p>
        {children}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '25px' }}>
          <button
            onClick={onCancel}
            className="btn btn-secondary"
            style={{ minWidth: '100px' }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="btn"
            style={{
              background: buttonColor.bg,
              color: 'white',
              minWidth: '100px',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = buttonColor.hover;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = buttonColor.bg;
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

