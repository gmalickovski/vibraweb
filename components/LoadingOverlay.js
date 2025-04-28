export default function LoadingOverlay() {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999
    }}>
      <div style={{
        color: 'white',
        fontSize: '20px',
        textAlign: 'center'
      }}>
        <div>Gerando Áudio...</div>
        <div style={{
          marginTop: '10px',
          fontSize: '16px'
        }}>Aguarde por favor</div>
      </div>
    </div>
  );
}
