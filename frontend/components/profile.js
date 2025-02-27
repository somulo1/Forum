export class ProfileManager {
    constructor() {
        this.profileSection = document.getElementById('userProfile');
        this.profileModal = document.getElementById('profileModal');
    }

    init() {
        this.renderProfile();
    }

    getCurrentUser() {
        const userCookie = document.cookie
            .split('; ')
            .find(row => row.startsWith('user='));
        return userCookie ? JSON.parse(decodeURIComponent(userCookie.split('=')[1])) : null;
    }

    renderProfile() {
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

    handleProfileUpdate(e) {
        e.preventDefault();
        const user = this.getCurrentUser();
        
        const updatedUser = {
            ...user,
            username: document.getElementById('editUsername').value,
            bio: document.getElementById('editBio').value,
            avatar: document.getElementById('editAvatar').value
        };

        // Update user cookie
        const expires = new Date(Date.now() + 86400000).toUTCString();
        document.cookie = `user=${encodeURIComponent(JSON.stringify(updatedUser))}; expires=${expires}; path=/`;

        this.profileModal.classList.add('hidden');
        window.location.reload();
    }
}