import { API_BASE_URL } from '../config.mjs';

export class ProfileManager {
    constructor() {
        this.profileSection = document.getElementById('userProfile');
        this.profileModal = document.getElementById('profileModal');
    }

    async init() {
        await this.loadUserProfile();
        await this.renderProfile();
    }

    async loadUserProfile() {
        const user = this.getCurrentUser();
        if (!user) return;

        try {
            const response = await fetch(`${API_BASE_URL}/users/${user.id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch profile');
            }

            const profileData = await response.json();
            // Update user cookie with latest profile data
            this.updateUserCookie({
                ...user,
                ...profileData
            });
        } catch (error) {
            console.error('Error loading profile:', error);
        }
    }

    getCurrentUser() {
        const userCookie = document.cookie
            .split('; ')
            .find(row => row.startsWith('user='));
        return userCookie ? JSON.parse(decodeURIComponent(userCookie.split('=')[1])) : null;
    }

    updateUserCookie(userData) {
        const expires = new Date(Date.now() + 86400000).toUTCString();
        document.cookie = `user=${encodeURIComponent(JSON.stringify(userData))}; expires=${expires}; path=/`;
    }

    async renderProfile() {
        const user = this.getCurrentUser();
        if (!user) return;
    
        this.profileSection.innerHTML = `
            <img src="${user.avatar}" alt="${user.username}" class="profile-image">
            <h3>${user.username}</h3>
            <p>${user.bio || 'No bio yet'}</p>
            <button class="btn btn-secondary" id="editProfileBtn">Edit Profile</button>
        `;
    
        document.getElementById('editProfileBtn').addEventListener('click', () => this.showEditProfileForm());
    }

    showEditProfileForm() {
        const user = this.getCurrentUser();
        if (!user) return;

        const profileForm = document.getElementById('profileForm');
        
        profileForm.innerHTML = `
            <h2>Edit Profile</h2>
            <form id="editProfileForm">
                <div class="form-group">
                    <label for="editUsername">Username</label>
                    <input type="text" id="editUsername" value="${user.username}" required>
                </div>
                <div class="form-group">
                    <label for="editBio">Bio</label>
                    <textarea id="editBio">${user.bio || ''}</textarea>
                </div>
                <div class="form-group">
                    <label for="editAvatar">Avatar URL</label>
                    <input type="url" id="editAvatar" value="${user.avatar}">
                </div>
                <button type="submit" class="btn btn-primary">Save Changes</button>
            </form>
        `;

        document.getElementById('editProfileForm').addEventListener('submit', (e) => this.handleProfileUpdate(e));
        this.profileModal.classList.remove('hidden');
    }

    async handleProfileUpdate(e) {
        e.preventDefault();
        const user = this.getCurrentUser();
        if (!user) return;
        
        const updatedProfile = {
            username: document.getElementById('editUsername').value,
            bio: document.getElementById('editBio').value,
            avatar: document.getElementById('editAvatar').value
        };

        try {
            const response = await fetch(`${API_BASE_URL}/users/${user.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify(updatedProfile)
            });

            if (!response.ok) {
                throw new Error('Failed to update profile');
            }

            const updatedUser = await response.json();
            
            // Update user cookie with new profile data
            this.updateUserCookie({
                ...user,
                ...updatedUser
            });

            this.profileModal.classList.add('hidden');
            await this.renderProfile();
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Failed to update profile. Please try again.');
        }
    }
}