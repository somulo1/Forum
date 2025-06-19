/**
 * Profile View - User profile page
 */

import { BaseView } from './BaseView.mjs';

export class ProfileView extends BaseView {
    constructor(app, params, query) {
        super(app, params, query);
        this.user = null;
    }

    /**
     * Render the profile view
     * @param {HTMLElement} container - Container element
     */
    async render(container) {
        try {
            // Check authentication
            if (!await this.isAuthenticated()) {
                this.showAuthModal();
                this.app.router.navigate('/', true);
                return;
            }

            // Clear container
            container.innerHTML = '';

            // Show loading state
            container.appendChild(this.createLoadingElement());

            // Get user data
            this.user = this.getCurrentUser();
            
            if (!this.user) {
                throw new Error('User data not available');
            }

            // Create profile view
            await this.renderProfileContent(container);

        } catch (error) {
            console.error('Error rendering profile view:', error);
            container.innerHTML = '';
            container.appendChild(this.createErrorElement(
                'Failed to load profile.',
                () => this.render(container)
            ));
        }
    }

    /**
     * Render profile content
     * @param {HTMLElement} container - Container element
     */
    async renderProfileContent(container) {
        container.innerHTML = '';

        const profileContent = document.createElement('div');
        profileContent.className = 'profile-view';
        profileContent.innerHTML = `
            <div class="profile-header">
                <div class="profile-avatar">
                    <img src="http://localhost:8080${this.user.avatar_url || '/static/pictures/default-avatar.png'}" 
                         alt="${this.user.username}'s avatar"
                         class="avatar-large">
                </div>
                <div class="profile-info">
                    <h1>${this.user.username}</h1>
                    <p class="profile-email">${this.user.email}</p>
                    <p class="profile-joined">Joined: ${this.formatDate(this.user.created_at)}</p>
                    </div>
            </div>

            <div class="profile-details">
                <div class="profile-info-section">
                    <h3><i class="fas fa-user"></i> Profile Information</h3>
                    <div class="profile-data">
                        <div class="profile-field">
                            <label>Username</label>
                            <div class="field-value">${this.user.username}</div>
                        </div>
                        <div class="profile-field">
                            <label>Email Address</label>
                            <div class="field-value">${this.user.email}</div>
                        </div>
                        <div class="profile-field">
                            <label>Member Since</label>
                            <div class="field-value">${this.formatDate(this.user.created_at)}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        container.appendChild(profileContent);
    }



    /**
     * Format date for display
     * @param {string} dateString - Date string to format
     * @returns {string} - Formatted date
     */
    formatDate(dateString) {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            return 'Unknown';
        }
    }
}
