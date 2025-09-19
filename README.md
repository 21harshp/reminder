# CRUD Operations - User Management System

A full-stack web application for managing user records with Create, Read, Update, and Delete operations.

## Features

- **User Management**: Add, view, edit, and delete user records
- **Authentication System**: Secure login/logout with session management
- **Required Fields**: First Name and Last Name are mandatory
- **Date Validation**: Either Date of Birth or Anniversary Date must be provided
- **Mobile Number**: Optional field with WhatsApp integration
- **Date Filtering**: Filter users by DOB or Anniversary Date (DD/MM format)
- **Search Functionality**: Search users by first name or last name
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Validation**: Client-side and server-side validation
- **Modern UI**: Clean and intuitive user interface
- **Data Persistence**: JSON file storage for local development

## Technology Stack

### Backend
- **Node.js**: Runtime environment
- **Express.js**: Web framework
- **CORS**: Cross-origin resource sharing
- **Body Parser**: JSON parsing middleware

### Frontend
- **HTML5**: Semantic markup
- **CSS3**: Modern styling with gradients and animations
- **Vanilla JavaScript**: No frameworks, pure JavaScript

## Installation & Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start the Server**
   ```bash
   npm start
   ```
   
   Or for development with auto-restart:
   ```bash
   npm run dev
   ```

3. **Access the Application**
   Open your browser and navigate to: `http://localhost:3000`

## API Endpoints

### GET /api/users
- **Description**: Retrieve all users
- **Response**: Array of user objects

### GET /api/users/:id
- **Description**: Retrieve a specific user by ID
- **Parameters**: `id` (user ID)
- **Response**: User object

### POST /api/users
- **Description**: Create a new user
- **Body**: 
  ```json
  {
    "firstName": "string (required)",
    "lastName": "string (required)",
    "dob": "date (optional)",
    "anniversaryDate": "date (optional)"
  }
  ```
- **Validation**: Either `dob` or `anniversaryDate` must be provided

### PUT /api/users/:id
- **Description**: Update an existing user
- **Parameters**: `id` (user ID)
- **Body**: Same as POST
- **Response**: Updated user object

### DELETE /api/users/:id
- **Description**: Delete a user
- **Parameters**: `id` (user ID)
- **Response**: Success message

## Validation Rules

1. **First Name**: Required, cannot be empty
2. **Last Name**: Required, cannot be empty
3. **Date of Birth**: Optional, must be valid date format
4. **Anniversary Date**: Optional, must be valid date format
5. **Date Requirement**: At least one date field (DOB or Anniversary Date) must be provided

## File Structure

```
CrudOpration/
├── package.json          # Project dependencies and scripts
├── server.js             # Express server and API routes
├── public/               # Frontend files
│   ├── index.html        # Main HTML page
│   ├── styles.css        # CSS styling
│   └── script.js         # JavaScript functionality
└── README.md             # This file
```

## Usage Examples

### Adding a New User
1. Fill in the required fields (First Name, Last Name)
2. Provide at least one date (DOB or Anniversary Date)
3. Click "Add User"

### Editing a User
1. Click the "Edit" button on any user card
2. Modify the fields as needed
3. Click "Update User"

### Searching Users
- Use the search box to filter users by name
- Search works for both first name and last name

### Deleting a User
1. Click the "Delete" button on any user card
2. Confirm the deletion in the popup dialog

## Error Handling

The application includes comprehensive error handling:
- **Client-side validation**: Immediate feedback on form errors
- **Server-side validation**: Backend validation for data integrity
- **User-friendly messages**: Clear error messages and success notifications
- **Network error handling**: Graceful handling of connection issues

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers (iOS Safari, Chrome Mobile)

## Development

To run in development mode with auto-restart:
```bash
npm run dev
```

This requires the `nodemon` package to be installed globally or as a dev dependency.

## Deployment

### Vercel Deployment

This application is optimized for Vercel deployment:

1. **Push to GitHub**: Push your code to a GitHub repository
2. **Connect to Vercel**: Import the repository in Vercel
3. **Auto Deploy**: Vercel will automatically detect and deploy the Node.js application

### Important Notes for Vercel

- **Data Persistence**: In Vercel's serverless environment, data is stored in memory and will reset on each deployment
- **File System**: Vercel has a read-only filesystem, so JSON file operations are skipped in production
- **Sessions**: User sessions are stored in memory and will reset when the serverless function restarts
- **For Production**: Consider using a database (MongoDB, PostgreSQL, etc.) for persistent data storage

### Default Login Credentials

- **Admin**: `admin` / `admin123`
- **Manager**: `harsh` / `harsh123`

## License

MIT License - feel free to use this project for learning and development purposes.
