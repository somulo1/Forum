# Forum Frontend

A modern, responsive frontend for the Forum application built with vanilla JavaScript, HTML, and CSS.

## Features

### 🔐 Authentication
- User registration and login
- Session management with cookies
- Secure logout functionality
- Protected routes and actions

### 📝 Posts
- Create, view, and delete posts
- Rich post content with categories
- Like/unlike posts
- Real-time post interactions
- Post filtering (all posts, my posts, liked posts)

### 💬 Comments
- Add comments to posts
- Like/unlike comments
- Delete own comments
- Real-time comment updates

### 🏷️ Categories
- Create and manage categories
- Filter posts by category
- Category statistics

### 🎨 User Interface
- Modern, responsive design
- Mobile-friendly interface
- Toast notifications
- Modal dialogs
- Loading states
- Empty states

## Architecture

### File Structure
```
frontend/
├── index.html          # Main HTML file
├── css/
│   └── styles.css      # Main stylesheet
├── js/
│   ├── app.js          # Main application logic
│   ├── api.js          # API communication
│   ├── auth.js         # Authentication management
│   ├── posts.js        # Posts functionality
│   ├── comments.js     # Comments functionality
│   └── utils.js        # Utility functions
└── favicon.ico         # Site favicon
```

### Key Components

#### 1. **App.js** - Main Application Controller
- Navigation management
- Page routing
- Initial data loading
- Global state management

#### 2. **API.js** - Backend Communication
- RESTful API client
- Request/response handling
- Error management
- Authentication headers

#### 3. **Auth.js** - Authentication Manager
- Login/register forms
- Session management
- User state tracking
- Protected action handling

#### 4. **Posts.js** - Posts Management
- Post creation and display
- Like/unlike functionality
- Post filtering
- Category integration

#### 5. **Comments.js** - Comments System
- Comment creation and display
- Comment interactions
- Post detail modal
- Real-time updates

#### 6. **Utils.js** - Utility Functions
- Date formatting
- Text utilities
- Modal management
- Toast notifications
- Local storage helpers

## API Integration

The frontend communicates with the backend through these endpoints:

### Authentication
- `POST /api/register` - User registration
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `GET /api/user` - Get current user

### Posts
- `GET /api/posts` - Get posts (with pagination and filters)
- `POST /api/posts/create` - Create new post
- `PUT /api/posts/update` - Update post
- `DELETE /api/posts/delete` - Delete post

### Comments
- `GET /api/comments/get?post_id=X` - Get post comments
- `POST /api/comments/create` - Create comment
- `DELETE /api/comments/delete` - Delete comment

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories/create` - Create category

### Likes
- `POST /api/likes/toggle` - Toggle like on post or comment

## Features in Detail

### Responsive Design
- Mobile-first approach
- Flexible grid layouts
- Touch-friendly interactions
- Optimized for all screen sizes

### Real-time Updates
- Optimistic UI updates
- Immediate feedback
- Error handling and rollback
- Smooth user experience

### Security
- XSS protection through HTML escaping
- CSRF protection via cookies
- Input validation
- Secure session management

### Performance
- Efficient DOM manipulation
- Lazy loading of content
- Optimized API calls
- Minimal dependencies

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Development

### Local Development
1. Ensure the backend is running
2. Open `index.html` in a web browser
3. Or serve through the backend at `http://localhost:8080`

### Customization
- Modify `css/styles.css` for styling changes
- Update `js/` files for functionality changes
- Customize colors and themes in CSS variables

### Adding Features
1. Add new API endpoints in `api.js`
2. Create new UI components in respective JS files
3. Update HTML structure if needed
4. Add corresponding CSS styles

## Best Practices

### Code Organization
- Modular JavaScript architecture
- Separation of concerns
- Reusable utility functions
- Clear naming conventions

### Error Handling
- Graceful error messages
- User-friendly notifications
- Fallback states
- Network error handling

### Accessibility
- Semantic HTML structure
- Keyboard navigation support
- Screen reader compatibility
- High contrast support

## Future Enhancements

- [ ] Real-time notifications
- [ ] Image upload support
- [ ] Advanced search functionality
- [ ] User profiles and avatars
- [ ] Dark mode theme
- [ ] Progressive Web App (PWA) features
- [ ] Infinite scroll pagination
- [ ] Rich text editor for posts
- [ ] Email notifications
- [ ] Social media integration

## Contributing

1. Follow the existing code style
2. Add comments for complex logic
3. Test on multiple browsers
4. Ensure responsive design
5. Update documentation as needed
