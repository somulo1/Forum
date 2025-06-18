# Forum Frontend

A modern, responsive web forum frontend built with vanilla HTML, CSS, and JavaScript. This frontend integrates seamlessly with the Go backend API to provide a complete forum experience.

## Features

### 🔐 Authentication
- User registration with validation
- Secure login/logout
- Session management with cookies
- User profile display

### 📝 Posts
- Create posts with title, content, and optional images
- Category assignment to posts
- View all posts with pagination
- Edit and delete own posts
- Rich post display with user avatars

### 💬 Comments
- Comment on posts
- Reply to comments (threaded discussions)
- Delete own comments
- Real-time comment display

### 👍 Reactions
- Like and dislike posts and comments
- Real-time reaction counts
- Visual feedback for user interactions

### 🏷️ Categories
- Browse posts by category
- Category filtering
- Dynamic category management

### 🔍 Filtering & Search
- Filter posts by categories
- View user's own posts
- View user's liked posts
- Search functionality (coming soon)

### 📱 Responsive Design
- Mobile-first design approach
- Tablet and desktop optimized
- Touch-friendly interface
- Accessible design patterns

## Technology Stack

- **HTML5**: Semantic markup
- **CSS3**: Modern styling with CSS Grid and Flexbox
- **Vanilla JavaScript**: No frameworks, pure ES6+
- **CSS Custom Properties**: Consistent theming
- **Responsive Design**: Mobile-first approach

## File Structure

```
frontend/
├── index.html          # Main HTML file
├── styles/
│   └── styles.css      # All CSS styles
├── js/
│   └── app.js          # Main JavaScript application
└── README.md           # This file
```

## Design System

### Color Palette
- **Primary**: Blue (#3b82f6)
- **Success**: Green (#10b981)
- **Error**: Red (#ef4444)
- **Warning**: Orange (#f59e0b)
- **Backgrounds**: Various shades of gray/white
- **Text**: Dark gray hierarchy

### Typography
- **Font**: Inter (Google Fonts)
- **Sizes**: Responsive scale from 0.75rem to 1.875rem
- **Weights**: 300, 400, 500, 600, 700

### Spacing
- **System**: 0.25rem base unit
- **Scale**: xs(0.25), sm(0.5), md(1), lg(1.5), xl(2), 2xl(3)

### Components
- **Buttons**: Primary, secondary, danger variants
- **Forms**: Consistent input styling with validation
- **Cards**: Post cards, comment cards, category cards
- **Modals**: Login, register, post details
- **Notifications**: Success, error, warning toasts

## API Integration

The frontend communicates with the backend through RESTful API endpoints:

### Authentication Endpoints
- `POST /api/register` - User registration
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `GET /api/user` - Get current user info

### Post Endpoints
- `GET /api/posts` - Get all posts (with pagination)
- `POST /api/posts/create` - Create new post
- `PUT /api/posts/update` - Update existing post
- `DELETE /api/posts/delete` - Delete post

### Comment Endpoints
- `GET /api/comments/get` - Get post comments
- `POST /api/comments/create` - Create comment
- `POST /api/comment/reply/create` - Create reply
- `DELETE /api/comments/delete` - Delete comment

### Reaction Endpoints
- `POST /api/likes/toggle` - Toggle like/dislike
- `GET /api/likes/reactions` - Get reaction counts

### Category Endpoints
- `GET /api/categories` - Get all categories
- `POST /api/categories/create` - Create category

## Key Features Implementation

### State Management
The `ForumApp` class manages application state including:
- Current user session
- Posts data
- Categories
- UI state (modals, loading, etc.)

### Error Handling
- Network error detection
- User-friendly error messages
- Graceful fallbacks
- Loading states

### Form Validation
- Client-side validation for registration
- Real-time feedback
- Accessibility considerations

### Responsive Design
- Mobile-first CSS
- Flexible grid layouts
- Touch-friendly interactions
- Optimized for all screen sizes

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance Features

- Efficient DOM manipulation
- Debounced search input
- Lazy loading of images
- Minimal JavaScript bundle
- CSS optimizations

## Accessibility

- Semantic HTML structure
- ARIA labels where needed
- Keyboard navigation support
- High contrast mode support
- Reduced motion support
- Screen reader friendly

## Development

### Local Development
1. Ensure the backend server is running on port 8080
2. Open `http://localhost:8080` in your browser
3. The frontend is served directly by the Go backend

### Code Style
- ES6+ JavaScript features
- Consistent indentation (4 spaces)
- Descriptive variable names
- Modular function organization
- Comprehensive error handling

## Future Enhancements

- [ ] Real-time notifications
- [ ] Advanced search functionality
- [ ] Post editing interface
- [ ] User profile pages
- [ ] Dark mode toggle
- [ ] Emoji reactions
- [ ] File upload progress
- [ ] Infinite scroll
- [ ] PWA capabilities

## Contributing

When contributing to the frontend:

1. Follow the existing code style
2. Test on multiple browsers
3. Ensure responsive design works
4. Add appropriate error handling
5. Update this README if needed

## License

This project is part of the Forum application and follows the same license terms.
