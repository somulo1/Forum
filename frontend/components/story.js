import { API_BASE_URL } from '../config.mjs';

export class StoryManager {
    constructor() {
        this.stories = [];
        this.storyContainer = document.getElementById('storySection');
        this.currentUser = this.getCurrentUser();
    }

    async init() {
        await this.fetchStories();
        this.renderStories();
        this.setupStoryListeners();
    }

    async fetchStories() {
        try {
            const response = await fetch(`${API_BASE_URL}/stories`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.currentUser?.token}`
                }
            });
            
            if (!response.ok) throw new Error('Failed to fetch stories');
            this.stories = await response.json();
        } catch (error) {
            console.error('Error fetching stories:', error);
            this.stories = [];
        }
    }

    async createStory(formData) {
        try {
            const response = await fetch(`${API_BASE_URL}/stories`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.currentUser?.token}`
                },
                body: formData
            });

            if (!response.ok) throw new Error('Failed to create story');
            const newStory = await response.json();
            this.stories.unshift(newStory);
            this.renderStories();
        } catch (error) {
            console.error('Error creating story:', error);
            alert('Failed to create story');
        }
    }

    renderStories() {
        const shouldScroll = this.stories.length > 4;
        this.storyContainer.innerHTML = `
            <div class="story-container">
                ${this.currentUser ? `
                    <div class="story-card create-story" style="background-image: linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url(${this.currentUser.avatar})">
                        <div class="create-story-button">
                            <i class="fas fa-plus"></i>
                        </div>
                    </div>
                ` : ''} 
                <div class="scrolling-stories">
                    <div class="scroll-stories-container ${shouldScroll ? '' : 'no-scroll'}">
                        ${this.stories.map(story => `
                            <div class="story-card" data-story-id="${story.id}">
                                <img src="${story.avatar}" alt="${story.username}'s avatar" class="avatar" onerror="this.onerror=null; this.src='/assets/default-avatar.png';">
                                <img src="${story.imageUrl}" alt="${story.username}'s story" class="story-image" onerror="this.onerror=null; this.src='/assets/default-image.png';">
                                <div class="story-info">
                                    <h4>${story.username}</h4>
                                    <p>${new Date(story.createdAt).toLocaleString()}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    setupStoryListeners() {
        const createStory = document.querySelector('.create-story');
        if (createStory) {
            createStory.addEventListener('click', () => this.showStoryModal());
        }

        document.querySelectorAll('.story-card:not(.create-story)').forEach(card => {
            card.addEventListener('click', () => this.viewStory(card.dataset.storyId));
        });
    }

    async viewStory(storyId) {
        try {
            const response = await fetch(`${API_BASE_URL}/stories/${storyId}`, {
                headers: {
                    'Authorization': `Bearer ${this.currentUser?.token}`
                }
            });
            
            if (!response.ok) throw new Error('Failed to fetch story');
            const story = await response.json();
            // Implement story viewing modal here
        } catch (error) {
            console.error('Error viewing story:', error);
        }
    }

    showStoryModal() {
        const modal = document.createElement('div');
        modal.innerHTML = `
            <div class="modal" id="storyModal">
                <div class="modal-content">
                    <h2>Create Story</h2>
                    <form id="storyForm">
                        <input type="file" accept="image/*" required>
                        <button type="submit">Share Story</button>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        document.getElementById('storyForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            await this.createStory(formData);
            modal.remove();
        });
    }

    getCurrentUser() {
        const userCookie = document.cookie
            .split('; ')
            .find(row => row.startsWith('user='));
        return userCookie ? JSON.parse(decodeURIComponent(userCookie.split('=')[1])) : null;
    }
}