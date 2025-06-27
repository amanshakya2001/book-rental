async function runTests() {
    const { default: fetch } = await import('node-fetch');
    const BASE_URL = 'http://localhost:3011/api'; // Make sure this port matches your running dev server
    let cookie = '';

    async function fetchWithCookie(url, options = {}) {
        const headers = { ...options.headers, cookie };
        const response = await fetch(url, { ...options, headers });

        const setCookieHeader = response.headers.get('set-cookie');
        if (setCookieHeader) {
            cookie = setCookieHeader.split(';')[0];
        }
        return response;
    }

    try {
        // --- User Signup ---
        console.log('Testing User Signup...');
        const newUser = { username: `testuser${Date.now()}`, password: 'password123' };
        let res = await fetchWithCookie(`${BASE_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newUser),
        });
        let body = await res.json();
        if (!res.ok) throw new Error(`Signup failed: ${res.status} ${JSON.stringify(body)}`);
        const signedUpUser = body;
        console.log('Signup successful:', signedUpUser);

        // --- User Logout ---
        console.log('\nTesting User Logout...');
        res = await fetchWithCookie(`${BASE_URL}/auth/logout`, { method: 'POST' });
        // Logout might not return a JSON body, so handle that
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Logout failed: ${res.status} ${text}`);
        }
        cookie = ''; // Clear cookie after logout
        console.log('Logout successful.');

        // --- User Login (Regular User) ---
        console.log('\nTesting User Login (user1)...');
        res = await fetchWithCookie(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'user1', password: 'password123' }),
        });
        body = await res.json();
        if (!res.ok) throw new Error(`Login failed: ${res.status} ${JSON.stringify(body)}`);
        const loggedInUser = body;
        console.log('Login successful:', loggedInUser);

        // --- POST /api/books (as user1) ---
        console.log('\nTesting POST /api/books (as user1)...');
        const newBook = {
            title: 'A Book by User1',
            author: 'User One',
            price_per_day: 1.25,
        };
        res = await fetchWithCookie(`${BASE_URL}/books`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newBook),
        });
        body = await res.json();
        if (!res.ok) throw new Error(`POST /api/books failed: ${res.status} ${JSON.stringify(body)}`);
        const createdBook = body;
        const bookId = createdBook.id;
        console.log('POST /api/books successful:', createdBook);

        // --- DELETE another user's book (as user1) - SHOULD FAIL ---
        console.log("\nTesting DELETE another user's book (as user1) - expecting failure...");
        // Assuming a book with ID 1 exists and is not owned by user1
        res = await fetchWithCookie(`${BASE_URL}/books/1`, { method: 'DELETE' });
        if (res.status !== 403) {
            const text = await res.text();
            throw new Error(`Unauthorized delete test failed: expected status 403 but got ${res.status}. Body: ${text}`);
        }
        console.log('Unauthorized delete test successful (403 Forbidden).');

        // --- Admin Login ---
        console.log('\nTesting Admin Login...');
        res = await fetchWithCookie(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: 'adminpassword' }),
        });
        body = await res.json();
        if (!res.ok) throw new Error(`Admin login failed: ${res.status} ${JSON.stringify(body)}`);
        console.log('Admin login successful.');

        // --- DELETE a book (as admin) ---
        console.log(`\nTesting DELETE /api/books/${bookId} (as admin)...`);
        res = await fetchWithCookie(`${BASE_URL}/books/${bookId}`, { method: 'DELETE' });
        if (res.status !== 204) {
            const text = await res.text();
            throw new Error(`Admin DELETE failed: ${res.status} ${text}`);
        }
        console.log('Admin DELETE successful.');

        
    console.log('\nTesting GET /api/books (as admin)...');
    try {
        const response = await fetchWithCookie(`${BASE_URL}/books`);
        if (response.status !== 200) {
            const errorText = await response.text();
            throw new Error(`GET /api/books failed: ${response.status} ${errorText}`);
        }
        const books = await response.json();
        console.log(`GET /api/books successful. Found ${books.length} books.`);
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    }

    console.log('\n\n✅ All tests passed!');
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        process.exit(1); // Exit with error code
    }
}

runTests();
