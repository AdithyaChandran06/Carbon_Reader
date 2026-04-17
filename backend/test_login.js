async function test() {
  const email = `test${Date.now()}@test.com`;
  const password = "password123";

  try {
    console.log("Registering...", email);
    const res1 = await fetch("http://localhost:5000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test User",
        email,
        password
      })
    });
    
    if (!res1.ok) {
        throw new Error(await res1.text());
    }
    console.log("Registered:", await res1.json());

    console.log("Logging in...", email);
    const res2 = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password
      })
    });
    
    if (!res2.ok) {
        throw new Error(await res2.text());
    }
    console.log("Logged in:", await res2.json());
  } catch (err) {
    console.error("Error:", err.message ? err.message : err);
  }
}

test();
