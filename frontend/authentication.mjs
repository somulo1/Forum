import { API_BASE_URL } from './config.mjs';


export async function loginUser(email, password) {
  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Login failed.');
    }

    const data = await response.json();
    alert('Login successful!');
    localStorage.setItem('token', data.token); // Assuming a token is returned
    window.location.reload();
  } catch (error) {
    alert(`Error: ${error.message}`);
  }
}
export async function registerUser(username, email, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Registration failed');
    }

    alert('Registration successful. Please login.');
    window.location.href = 'api/login';
  } catch (error) {
    console.error('Registration Error:', error);
    alert(error.message);
  }
}

// Dynamically Render Authentication UI When Needed

export function promptAuthentication(action) {
  if (document.getElementById('auth-modal')) return; // Prevent multiple modals

  const authModal = document.createElement('div');
  authModal.id = 'auth-modal';
  authModal.innerHTML = `
    <div class="auth-modal-overlay"></div>
    <div class="auth-modal-content">
      <h2>${action === 'login' ? 'Login' : 'Sign Up'}</h2>
      <input type="email" id="auth-email" placeholder="Email" required />
      ${action === 'signup' ? '<input type="text" id="auth-username" placeholder="Username" required />' : ''}
      <input type="password" id="auth-password" placeholder="Password" required />
      <button id="auth-submit">${action === 'login' ? 'Login' : 'Sign Up'}</button>
      <button id="auth-cancel">Cancel</button>
    </div>
  `;
  document.body.appendChild(authModal);

  // Handle form submission
  document.getElementById('auth-submit').addEventListener('click', async () => {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;

    try {
      if (action === 'signup') {
        const username = document.getElementById('auth-username').value;
        await registerUser(username, email, password);
      } else {
        await loginUser(email, password);
      }
      closeAuthModal();
    } catch (error) {
      alert('Authentication failed. Please try again.');
      console.error(error);
    }
    
  });

  // Cancel button
  document.getElementById('auth-cancel').addEventListener('click', closeAuthModal);
}

// Close modal function
function closeAuthModal() {
  const authModal = document.getElementById('auth-modal');
  if (authModal) {
    authModal.remove();
  }
}

// Optional: Function to check if user is authenticated
export async function isAuthenticated() {
  try {
    const response = await fetch(`${API_BASE_URL}/user`, { credentials: 'include' });
    return response.ok;
  } catch (error) {
    console.error('Auth Check Error:', error);
    return false;
  }
}
