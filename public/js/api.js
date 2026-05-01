async function apiRequest(url, method = 'GET', body = null) {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json'
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
        method,
        headers
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    
    let data;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await response.json();
    } else {
        const text = await response.text();
        throw new Error(`Server returned non-JSON response (${response.status}): ${text.substring(0, 100)}...`);
    }

    if (!response.ok) {
        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = 'login.html';
        }
        throw new Error(data.message || 'Something went wrong');
    }

    return data;
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

function checkAuth(role) {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        window.location.href = 'login.html';
        return null;
    }
    if (role && user.role !== role) {
        window.location.href = 'index.html';
        return null;
    }
    return user;
}
