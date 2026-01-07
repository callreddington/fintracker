export default function DebugPage() {
  const apiUrl = import.meta.env.VITE_API_URL || 'NOT SET';
  const env = import.meta.env.VITE_ENVIRONMENT || 'NOT SET';

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Environment Debug Page</h1>
      <div style={{ background: '#f5f5f5', padding: '20px', marginTop: '20px' }}>
        <h2>Environment Variables:</h2>
        <pre>
          VITE_API_URL: {apiUrl}
          {'\n'}
          VITE_ENVIRONMENT: {env}
          {'\n\n'}
          Expected API_URL: https://fintracker-y76x.onrender.com/api/v1
        </pre>

        <h2>Test API Call:</h2>
        <p>Full registration URL would be:</p>
        <pre>{apiUrl}/auth/register</pre>

        <h2>All import.meta.env:</h2>
        <pre>{JSON.stringify(import.meta.env, null, 2)}</pre>
      </div>
    </div>
  );
}
