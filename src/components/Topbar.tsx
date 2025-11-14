const Topbar = () => {
  return (
    <div
      style={{
        height: '60px',
        backgroundColor: '#fff',
        borderBottom: '1px solid #e0e0e0',
        display: 'flex',
        alignItems: 'center',
        padding: '0 1.5rem',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <h2 style={{ margin: 0, color: '#333' }}>Admin Panel</h2>
    </div>
  )
}

export default Topbar

