// Determine the server URL based on environment
const getServerUrl = () => {
  // Check for explicit environment variable first
  if (import.meta.env.VITE_SERVER_URL) {
    return import.meta.env.VITE_SERVER_URL;
  }
  
  // For production builds, use the production server
  if (import.meta.env.PROD) {
    return 'https://spyfall-uvdi.onrender.com';
  }
  
  // Default to localhost for development
  return 'http://localhost:3001';
};

const API_BASE_URL = getServerUrl();

console.log('🔗 API Base URL configured as:', API_BASE_URL);

class ApiService {
  async createRoom(gameDurationMinutes = 6) {
    console.log('API: Creating room with duration:', gameDurationMinutes);
    console.log('API: Making request to:', `${API_BASE_URL}/api/create-room`);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/create-room`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gameDurationMinutes }),
      });
      
      console.log('API: Response status:', response.status);
      console.log('API: Response headers:', response.headers);
      
      // Check if response is HTML instead of JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        const htmlText = await response.text();
        console.error('❌ Received HTML instead of JSON:', htmlText.substring(0, 200));
        throw new Error(`Server returned HTML instead of JSON. Check if server URL is correct: ${API_BASE_URL}`);
      }
      
      const data = await response.json();
      console.log('API: Response data:', data);
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to create room');
      }
      
      return data;
    } catch (error) {
      console.error('❌ API Error:', error);
      throw error;
    }
  }

  async validateRoom(roomCode) {
    const response = await fetch(`${API_BASE_URL}/api/validate-room`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ roomCode }),
    });
    
    const data = await response.json();
    return data;
  }

  async getLocations() {
    const response = await fetch(`${API_BASE_URL}/api/locations`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to get locations');
    }
    
    return data.locations;
  }
}

export default new ApiService(); 