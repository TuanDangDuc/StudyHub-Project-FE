import axios from 'axios';
async function test() {
  try {
    const loginRes = await axios.post('http://localhost:8080/api/user/login', { username: 'tuan', password: 'password123' });
    console.log("Login response:", loginRes.status, loginRes.data);
    
    // Assume token is the raw string
    const token = loginRes.data;
    const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;
    
    // Parse JWT
    let uid = null;
    try {
       const payload = JSON.parse(atob(cleanToken.split('.')[1]));
       console.log("Payload:", payload);
       uid = payload.sub || payload.userId || payload.id || 'tuan';
    } catch(e) {
       console.log("Token is not JWT", cleanToken);
       uid = 'tuan';
    }
    
    console.log("UID to use:", uid);
    
    const infoRes = await axios.get(`http://localhost:8080/api/user/get-info/${uid}`, {
      headers: { Authorization: `Bearer ${cleanToken}` }
    });
    console.log("Info:", infoRes.data);
  } catch (e) {
    console.error("Failed:", e.response ? e.response.status + " " + JSON.stringify(e.response.data) : e.message);
  }
}
test();
