# Online Learning Platform

## Features

### For Administrators
- Manage users (students, teachers, administrators)
- Approve/disapprove course creation
- View system statistics and analytics
- Monitor platform activity

### For Teachers
- Create and manage courses
- Upload lectures (PDFs, videos)
- Create lesson calendars
- Create assignments with due dates
- Grade student submissions
- Monitor student progress

### For Students
- Search and filter courses
- Register for courses
- Access lecture materials
- Submit homework assignments
- Receive scores and feedback
- Track learning progress


### Backend
- **Framework**: ASP.NET Core 8.0
- **Database**: SQL Server
- **Authentication**: JWT Bearer Tokens
- **ORM**: Entity Framework Core


### Frontend
- **Framework**: Angular
- **Styling**: CSS


### Backend Setup

1. **Navigate to the Backend directory**
   ```bash
   cd Backend
   ```

2. **Restore NuGet packages**
   ```bash
   dotnet restore
   ```

 **Access the API**
   - API: `https://localhost:5001` or `http://localhost:5000`
   - Swagger UI: `https://localhost:5001/swagger`

### Frontend Setup

1. **Navigate to the Frontend directory**
   ```bash
   cd Frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure API URL**
   
   Edit `src/environments/environment.ts`:
   ```typescript
   export const environment = {
     production: false,
     apiUrl: 'https://localhost:5001/api'
   };
   ```

4. **Start the development server**
   ```bash
   ng serve
   ```

5. **Access the application**
   - Frontend: `http://localhost:4200`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/reset-password` - Request password reset
- `POST /api/auth/reset-password/confirm` - Confirm password reset
- `POST /api/auth/change-password` - Change password
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### Courses
- `GET /api/courses` - Get all courses (with filtering)
- `GET /api/courses/{id}` - Get course details
- `POST /api/courses` - Create course (Teacher)
- `PUT /api/courses/{id}` - Update course (Teacher)
- `DELETE /api/courses/{id}` - Delete course (Teacher/Admin)
- `PUT /api/courses/{id}/approve` - Approve/disapprove course (Admin)
- `POST /api/courses/{id}/enroll` - Enroll in course (Student)
- `GET /api/courses/my-courses` - Get user's courses

### Lessons
- `GET /api/courses/{courseId}/lessons` - Get course lessons
- `GET /api/courses/{courseId}/lessons/{id}` - Get lesson details
- `POST /api/courses/{courseId}/lessons` - Create lesson (Teacher)
- `PUT /api/courses/{courseId}/lessons/{id}` - Update lesson (Teacher)
- `DELETE /api/courses/{courseId}/lessons/{id}` - Delete lesson (Teacher)

### Assignments
- `GET /api/courses/{courseId}/assignments` - Get course assignments
- `GET /api/courses/{courseId}/assignments/{id}` - Get assignment details
- `POST /api/courses/{courseId}/assignments` - Create assignment (Teacher)
- `PUT /api/courses/{courseId}/assignments/{id}` - Update assignment (Teacher)
- `DELETE /api/courses/{courseId}/assignments/{id}` - Delete assignment (Teacher)
- `POST /api/assignments/{id}/submit` - Submit assignment (Student)
- `PUT /api/assignments/{id}/grade` - Grade submission (Teacher)
- `GET /api/assignments/{id}/submissions` - Get assignment submissions (Teacher)

### Users (Admin only)
- `GET /api/users` - Get all users
- `GET /api/users/{id}` - Get user details
- `PUT /api/users/{id}` - Update user
- `DELETE /api/users/{id}` - Delete user
