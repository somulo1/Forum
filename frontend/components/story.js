export class StoryManager {
    constructor() {
        this.storySection = document.getElementById('storySection');
        this.stories = [];
    }

    init() {
        this.loadStories();
        this.render();
    }

    loadStories() {
        // Simulate stories data
        this.stories = [
            {
                id: 1,
                user: 'John Doe',
                avatar: 'images/Screenshot from 2025-02-25 13-35-47.png',
                image: 'images/Screenshot from 2025-02-25 13-36-23.png',
                timestamp: new Date(Date.now() - 3600000)
            },
            {
                id: 2,
                user: 'Jane Smith',
                avatar: 'images/Screenshot from 2025-02-25 13-36-46.png',
                image: 'images/Screenshot from 2025-02-25 13-37-12.png',
                timestamp: new Date(Date.now() - 7200000)
            },
            {
                id: 3,
                user: 'Alice Johnson',
                avatar: 'images/Screenshot from 2025-02-25 13-38-13.png',
                image: 'images/Screenshot from 2025-02-25 13-39-19.png',
                timestamp: new Date(Date.now() - 10800000)
            },
            {
                id: 4,
                user: 'Bob Brown',
                avatar: 'images/Screenshot from 2025-02-25 13-40-43.png',
                image: 'images/Screenshot from 2025-02-25 13-40-59.png',
                timestamp: new Date(Date.now() - 14400000)
            },
            {
                id: 5,
                user: 'Charlie Green',
                avatar: 'images/Screenshot from 2025-02-25 13-41-13.png',
                image: 'images/Screenshot from 2025-02-25 13-48-23.png',
                timestamp: new Date(Date.now() - 18000000)
            },
            {
                id: 6,
                user: 'Diana Prince',
                avatar: 'images/Screenshot from 2025-02-25 13-48-57.png',
                image: 'images/Screenshot from 2025-02-25 13-49-21.png',
                timestamp: new Date(Date.now() - 21600000)
            },
            {
                id: 7,
                user: 'Eve Adams',
                avatar: 'images/Screenshot from 2025-02-25 13-51-31.png',
                image: 'images/Screenshot from 2025-02-25 13-53-51.png',
                timestamp: new Date(Date.now() - 25200000)
            },
            {
                id: 8,
                user: 'Frank Castle',
                avatar: 'images/Screenshot from 2025-02-25 13-54-08.png',
                image: 'images/Screenshot from 2025-02-25 13-54-32.png',
                timestamp: new Date(Date.now() - 28800000)
            },
            {
                id: 9,
                user: 'Grace Lee',
                avatar: 'images/Screenshot from 2025-02-25 13-55-00.png',
                image: 'images/Screenshot from 2025-02-25 13-55-11.png',
                timestamp: new Date(Date.now() - 32400000)
            }
           
        ];
    }
    
    render() {
        const user = this.getCurrentUser();
        const totalStories = this.stories.length;
        
        // Determine if the stories need to scroll
        const shouldScroll = totalStories > 8; // Only scroll if there are more than 4 stories
    
        this.storySection.innerHTML = `
            <div class="story-container">
                ${user ? `
                    <div class="story-card create-story" style="background-image: linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url(${user.avatar})">
                        <div class="create-story-button">
                            <i class="fas fa-plus"></i>
                        </div>
                    </div>
                ` : ''} 
                <div class="scrolling-stories">
                    <div class="scroll-stories-container ${shouldScroll ? '' : 'no-scroll'}">
                        ${this.stories.slice(4).map(story => `
                            <div class="story-card">
                                <img src="${story.avatar}" alt="${story.user}'s avatar" class="avatar" onerror="this.onerror=null; this.src='path/to/default-avatar.png';">
                                <img src="${story.image}" alt="${story.user}'s story" class="story-image" onerror="this.onerror=null; this.src='path/to/default-image.png';">
                                <div class="story-info">
                                    <h4>${story.user}</h4>
                                    <p>${new Date(story.timestamp).toLocaleString()}</p>
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
            createStory.addEventListener('click', () => this.handleCreateStory());
        }

        document.querySelectorAll('.story-card:not(.create-story)').forEach(card => {
            card.addEventListener('click', () => this.viewStory(card));
        });
    }

    handleCreateStory() {
        // Simulate story creation
        alert('Story creation coming soon!');
    }

    viewStory(storyCard) {
        // Simulate story viewing
        alert('Story viewer coming soon!');
    }

    getCurrentUser() {
        const userCookie = document.cookie
            .split('; ')
            .find(row => row.startsWith('user='));
        return userCookie ? JSON.parse(decodeURIComponent(userCookie.split('=')[1])) : null;
    }
}