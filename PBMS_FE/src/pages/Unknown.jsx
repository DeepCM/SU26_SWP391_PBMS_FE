import '../styles/Home.css'
import Header from '../components/common/Header'

export default function Unknown() {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: '100vh',
      backgroundColor: '#f8fafc' // Light modern background tint
    }}>
      <Header />

      <main style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,                  // Takes up all remaining vertical space
        textAlign: 'center',
        padding: '40px 20px',
        boxSizing: 'border-box'
      }}>
        {/* Massive numeric indicator */}
        <h1 style={{ 
          fontSize: '8rem', 
          fontWeight: '900', 
          margin: 0, 
          color: '#1e293b', 
          lineHeight: '1' 
        }}>
          404
        </h1>
        
        {/* Clear error message */}
        <p style={{ 
          fontSize: '1.75rem', 
          fontWeight: '600', 
          color: '#64748b', 
          marginTop: '16px',
          maxWidth: '500px'
        }}>
          Không tìm thấy trang
        </p>
      </main>
    </div>
  )
}