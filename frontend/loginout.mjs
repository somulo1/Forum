import { API_BASE_URL } from './config.mjs';
// import { promptAuthentication } from './authentication.mjs';

export async function checkAuthStatus() {
  try {
    const response = await fetch(`${API_BASE_URL}/user`, { credentials: 'include' });
    if (!response.ok) throw new Error('Not authenticated');
    renderLogoutButton();
    const user = await response.json();
    document.getElementById('guest-section').style.display = 'none';
    document.getElementById('user-section').style.display = 'flex';
    document.getElementById('user-profile-pic').src = user.profilePicture || 'default-avatar.png';
  } catch (error) {
    console.error('User not authenticated:', error);
    // document.getElementById('guest-section').style.display = 'flex';
    // document.getElementById('user-section').style.display = 'none';
  }
}

export async function logoutUser() {
  try {
    await fetch(`${API_BASE_URL}/logout`, { method: 'POST', credentials: 'include' });
    window.location.reload();
  } catch (error) {
    console.error('Error logging out:', error);
  }
}
export function renderAuthButtons() {
  const authButtonsContainer = document.getElementById('auth-buttons');
  authButtonsContainer.innerHTML = `
  <button onclick="$promptAuthentication('login')">Login</button>
  <button onclick="promptAuthentication('signup')">Sign Up</button>
  `;
}
export function renderLogoutButton() {
  const authButtonsContainer = document.getElementById('auth-buttons');
  authButtonsContainer.innerHTML = `
    <button id="logout-btn" class="btn btn-danger">Logout</button>
  `;

  document.getElementById('logout-btn').addEventListener('click', async () => {
    await logoutUser();
  });
}
export async function registerUser(username, email, password) {
  try {
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to register.');
    }

    alert('Registration successful! Please log in.');
  } catch (error) {
    alert(`Error: ${error.message}`);
  }
}


