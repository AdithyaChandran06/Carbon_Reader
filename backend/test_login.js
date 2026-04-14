const axios = require('axios');

async function test() {
  const email = `test${Date.now()}@test.com`;
  const password = "password123";

  try {
    console.log("Registering...", email);
    const res1 = await axios.post("http://localhost:5000/api/auth/register", {
      name: "Test User",
      email,
      password
    });
    console.log("Registered:", res1.data);

    console.log("Logging in...", email);
    const res2 = await axios.post("http://localhost:5000/api/auth/login", {
      email,
      password
    });
    console.log("Logged in:", res2.data);
  } catch (err) {
    if (err.response) {
      console.error("Error:", err.response.data);
    } else {
      console.error("Error:", err.message);
    }
  }
}

test();
