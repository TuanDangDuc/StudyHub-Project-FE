const axios = require('axios');
async function test() {
  try {
    const res = await axios.post('http://localhost:8080/api/user/login', { username: 'testuser', password: 'password123' });
    console.log("Login response:", res.status, res.data);
  } catch (e) {
    console.error("Login failed:", e.response ? e.response.status : e.message);
  }
}
test();
