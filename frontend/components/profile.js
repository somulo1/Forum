import { API_BASE_URL } from '../config.mjs';

class ProfileManager {
    constructor() {
        this.profileSection = document.querySelector('.profile-section');
        this.avatarUpload = document.getElementById('avatarUpload');
        this.userAvatar = document.getElementById('userAvatar');
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadUserProfile();
    }

    setupEventListeners() {
        this.avatarUpload?.addEventListener('change', (e) => this.handleAvatarUpload(e));
        document.getElementById('editProfileBtn')?.addEventListener('click', () => this.showEditProfileForm());
    }

    async loadUserProfile() {
        const user = this.getCurrentUser();
        if (!user) return;

        try {
            const response = await fetch(`${API_BASE_URL}/user/${user.id}`, {
                headers: {
                    'Authorization': `Bearer ${user.token}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch profile');

            const profile = await response.json();
            this.renderProfile(profile);
        } catch (error) {
            console.error('Error loading profile:', error);
        }
    }

    async handleAvatarUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('avatar', file);

        try {
            const user = this.getCurrentUser();
            const response = await fetch(`${API_BASE_URL}/user/avatar`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${user.token}`
                },
                body: formData
            });

            if (!response.ok) throw new Error('Failed to upload avatar');
            
            const data = await response.json();
            this.userAvatar.src = data.avatar_url;
            
            // Update user in localStorage
            user.avatar_url = data.avatar_url;
            localStorage.setItem('user', JSON.stringify(user));
        } catch (error) {
            console.error('Error uploading avatar:', error);
        }
    }

    async handleProfileUpdate(event) {
        event.preventDefault();
        const user = this.getCurrentUser();
        if (!user) return;

        const formData = {
            username: document.getElementById('editUsername').value,
            bio: document.getElementById('editBio').value,
            avatar_url: document.getElementById('editAvatar').value
        };

        try {
            const response = await fetch(`${API_BASE_URL}/user/update`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) throw new Error('Failed to update profile');

            const updatedProfile = await response.json();
            this.renderProfile(updatedProfile);
            this.hideEditProfileForm();
        } catch (error) {
            console.error('Error updating profile:', error);
        }
    }

    renderProfile(profile) {
        this.userAvatar.src = profile.avatar_url || '/images/default-avatar.png';
        document.getElementById('profileUsername').textContent = profile.username;
    }

    getCurrentUser() {
        const userJson = localStorage.getItem('user');
        return userJson ? JSON.parse(userJson) : null;
    }
}

export { ProfileManager };