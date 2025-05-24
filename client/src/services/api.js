const API_BASE_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

class ApiService {
  async createRoom() {
    const response = await fetch(`${API_BASE_URL}/api/create-room`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to create room');
    }
    
    return data;
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