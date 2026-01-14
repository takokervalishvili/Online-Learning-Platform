import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router, RouterModule } from "@angular/router";
import { AuthService } from "../../../services/auth.service";
import { StudentService } from "../../../services/student.service";

@Component({
  selector: "app-student-courses",
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="courses-container">
      <nav class="navbar">
        <div class="navbar-brand">
          <h2>Learning Platform - Browse Courses</h2>
        </div>
        <div class="navbar-user">
          <button class="btn btn-outline" routerLink="/student">
            Dashboard
          </button>
          <span>{{ currentUser?.fullName }}</span>
          <button class="btn btn-secondary" (click)="logout()">Logout</button>
        </div>
      </nav>

      <div class="courses-content">
        <div class="container">
          <div class="page-header">
            <h1>Available Courses</h1>
            <p>Discover and enroll in courses to expand your knowledge</p>
          </div>

          <div class="filters">
            <div class="filter-group">
              <label>Category</label>
              <select
                class="filter-select"
                [(ngModel)]="filters.category"
                (change)="applyFilters()"
              >
                <option value="">All Categories</option>
                <option value="Programming">Programming</option>
                <option value="Design">Design</option>
                <option value="Business">Business</option>
                <option value="Marketing">Marketing</option>
                <option value="Data Science">Data Science</option>
                <option value="Web Development">Web Development</option>
              </select>
            </div>

            <div class="filter-group">
              <label>Sort By</label>
              <select
                class="filter-select"
                [(ngModel)]="filters.sortBy"
                (change)="applyFilters()"
              >
                <option value="enrollments">Most Popular</option>
                <option value="created">Newest</option>
                <option value="rating">Highest Rated</option>
                <option value="price">Price: Low to High</option>
              </select>
            </div>

            <div class="filter-group">
              <input
                type="text"
                class="search-input"
                placeholder="Search courses..."
                [(ngModel)]="filters.searchTerm"
                (keyup.enter)="applyFilters()"
                (blur)="applyFilters()"
              />
            </div>

            <div class="filter-group">
              <button class="btn btn-primary" (click)="applyFilters()">
                Search
              </button>
              <button
                class="btn btn-outline"
                (click)="clearFilters()"
                *ngIf="hasActiveFilters()"
              >
                Clear
              </button>
            </div>
          </div>

          <div *ngIf="loading" class="loading-container">
            <div class="spinner"></div>
            <p>Loading courses...</p>
          </div>

          <div *ngIf="!loading && courses.length === 0" class="empty-state">
            <div class="empty-icon">📚</div>
            <h3>No courses available</h3>
            <p>Check back later for new courses</p>
          </div>

          <div *ngIf="!loading && courses.length > 0" class="courses-grid">
            <div class="course-card card" *ngFor="let course of courses">
              <div class="course-image">
                <img
                  [src]="course.image || 'assets/course-placeholder.jpg'"
                  [alt]="course.title"
                />
                <span class="course-badge">{{ course.category }}</span>
              </div>

              <div class="course-content">
                <h3>{{ course.title }}</h3>
                <p class="course-teacher">👨‍🏫 {{ course.teacherName }}</p>
                <p class="course-description">{{ course.description }}</p>

                <div class="course-meta">
                  <div class="meta-item">
                    <span class="meta-icon">📚</span>
                    <span
                      >{{
                        course.lessonCount || course.totalLessons || 0
                      }}
                      Lessons</span
                    >
                  </div>
                  <div class="meta-item">
                    <span class="meta-icon">⏱️</span>
                    <span>{{ course.duration || 0 }} hours</span>
                  </div>
                  <div class="meta-item">
                    <span class="meta-icon">🎓</span>
                    <span
                      >{{
                        course.enrollmentCount || course.enrolledStudents || 0
                      }}
                      Students</span
                    >
                  </div>
                </div>

                <div class="course-rating" *ngIf="course.averageRating">
                  <span class="rating-stars"
                    >⭐ {{ course.averageRating }}/5</span
                  >
                </div>

                <div class="course-footer">
                  <div class="course-price">
                    <span *ngIf="course.price === 0" class="price-free"
                      >Free</span
                    >
                    <span *ngIf="course.price > 0" class="price-amount"
                      >\${{ course.price }}</span
                    >
                  </div>
                  <button
                    class="btn btn-primary"
                    (click)="enrollInCourse(course.id)"
                    [disabled]="course.isEnrolled"
                  >
                    <span *ngIf="!course.isEnrolled">Enroll Now</span>
                    <span *ngIf="course.isEnrolled">✓ Enrolled</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .courses-container {
        min-height: 100vh;
        background-color: #f5f5f5;
      }

      .navbar {
        background: white;
        padding: 1rem 2rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .navbar-brand h2 {
        margin: 0;
        color: #333;
      }

      .navbar-user {
        display: flex;
        align-items: center;
        gap: 1rem;
      }

      .navbar-user span {
        font-weight: 500;
      }

      .courses-content {
        padding: 2rem 0;
      }

      .page-header {
        text-align: center;
        margin-bottom: 2rem;
      }

      .page-header h1 {
        color: #333;
        margin-bottom: 0.5rem;
      }

      .page-header p {
        color: #666;
        font-size: 1.1rem;
      }

      .filters {
        display: flex;
        gap: 1rem;
        margin-bottom: 2rem;
        flex-wrap: wrap;
      }

      .filter-group {
        flex: 1;
        min-width: 200px;
      }

      .filter-group label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: #555;
      }

      .filter-select,
      .search-input {
        width: 100%;
        padding: 10px 15px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 1rem;
      }

      .filter-select:focus,
      .search-input:focus {
        outline: none;
        border-color: #667eea;
      }

      .loading-container {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        min-height: 400px;
      }

      .loading-container p {
        margin-top: 1rem;
        color: #666;
      }

      .empty-state {
        text-align: center;
        padding: 4rem 2rem;
      }

      .empty-icon {
        font-size: 4rem;
        margin-bottom: 1rem;
      }

      .empty-state h3 {
        color: #333;
        margin-bottom: 0.5rem;
      }

      .empty-state p {
        color: #666;
      }

      .courses-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 2rem;
      }

      .course-card {
        padding: 0;
        overflow: hidden;
        transition:
          transform 0.3s ease,
          box-shadow 0.3s ease;
        cursor: pointer;
      }

      .course-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
      }

      .course-image {
        position: relative;
        width: 100%;
        height: 200px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      }

      .course-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .course-badge {
        position: absolute;
        top: 10px;
        right: 10px;
        background: rgba(255, 255, 255, 0.95);
        padding: 5px 12px;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        color: #667eea;
      }

      .course-content {
        padding: 1.5rem;
      }

      .course-content h3 {
        margin: 0 0 0.5rem 0;
        color: #333;
        font-size: 1.25rem;
      }

      .course-teacher {
        color: #666;
        font-size: 0.9rem;
        margin-bottom: 1rem;
      }

      .course-description {
        color: #666;
        font-size: 0.9rem;
        margin-bottom: 1rem;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .course-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        margin-bottom: 1rem;
        padding: 1rem 0;
        border-top: 1px solid #eee;
        border-bottom: 1px solid #eee;
      }

      .meta-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: #666;
        font-size: 0.875rem;
      }

      .meta-icon {
        font-size: 1.1rem;
      }

      .course-rating {
        margin-bottom: 1rem;
      }

      .rating-stars {
        color: #ffc107;
        font-weight: 600;
      }

      .course-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 1.5rem;
      }

      .course-price {
        font-size: 1.5rem;
        font-weight: 700;
      }

      .price-free {
        color: #28a745;
      }

      .price-amount {
        color: #333;
      }

      .btn:disabled {
        background-color: #6c757d;
        cursor: not-allowed;
        opacity: 0.7;
      }

      @media (max-width: 768px) {
        .navbar {
          flex-direction: column;
          gap: 1rem;
          padding: 1rem;
        }

        .navbar-user {
          width: 100%;
          justify-content: space-between;
        }

        .filters {
          flex-direction: column;
        }

        .courses-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class CoursesComponent implements OnInit {
  currentUser: any;
  courses: any[] = [];
  loading = true;
  filters = {
    searchTerm: "",
    category: "",
    minPrice: undefined as number | undefined,
    maxPrice: undefined as number | undefined,
    sortBy: "enrollments",
    sortOrder: "desc",
  };

  constructor(
    private authService: AuthService,
    private studentService: StudentService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.currentUserValue;
    this.loadCourses();
  }

  loadCourses() {
    this.loading = true;
    const filterParams = {
      searchTerm: this.filters.searchTerm || undefined,
      category: this.filters.category || undefined,
      minPrice: this.filters.minPrice,
      maxPrice: this.filters.maxPrice,
      sortBy: this.filters.sortBy,
      sortOrder: this.filters.sortOrder,
    };

    this.studentService.getAvailableCourses(filterParams).subscribe({
      next: (response) => {
        console.log("📚 Courses API Response:", response);
        console.log("📚 Response type:", typeof response);
        console.log("📚 Response.items:", response.items);
        console.log("📚 Is response array?", Array.isArray(response));

        // Backend returns { items: [...], totalCount: ..., etc }
        this.courses =
          response.items || response.courses || response.data || response;

        console.log("📚 Parsed courses:", this.courses);
        console.log(
          "📚 Courses count:",
          Array.isArray(this.courses) ? this.courses.length : "Not an array",
        );

        // Check enrollment status for each course
        if (Array.isArray(this.courses)) {
          this.courses = this.courses.map((course) => ({
            ...course,
            totalLessons: course.lessonCount || course.totalLessons || 0,
            enrolledStudents:
              course.enrollmentCount || course.enrolledStudents || 0,
          }));
          console.log("📚 Final courses after mapping:", this.courses);
        } else {
          console.error("❌ Courses is not an array:", this.courses);
        }
        this.loading = false;
      },
      error: (err) => {
        console.error("❌ Error loading courses:", err);
        console.error("❌ Error details:", err.error);
        console.error("❌ Error status:", err.status);
        this.loading = false;
        // Use mock data if API fails
        console.log("📚 Loading mock courses as fallback");
        this.loadMockCourses();
      },
    });
  }

  applyFilters() {
    this.loadCourses();
  }

  clearFilters() {
    this.filters = {
      searchTerm: "",
      category: "",
      minPrice: undefined,
      maxPrice: undefined,
      sortBy: "enrollments",
      sortOrder: "desc",
    };
    this.loadCourses();
  }

  hasActiveFilters(): boolean {
    return !!(
      this.filters.searchTerm ||
      this.filters.category ||
      this.filters.minPrice !== undefined ||
      this.filters.maxPrice !== undefined
    );
  }

  loadMockCourses() {
    this.courses = [
      {
        id: 1,
        title: "Web Development Fundamentals",
        description:
          "Learn the basics of HTML, CSS, and JavaScript to build modern websites from scratch.",
        teacherName: "Prof. John Smith",
        category: "Programming",
        duration: 40,
        price: 0,
        totalLessons: 30,
        enrolledStudents: 234,
        averageRating: 4.8,
        isEnrolled: false,
      },
      {
        id: 2,
        title: "Advanced JavaScript",
        description:
          "Master advanced JavaScript concepts including async/await, closures, and design patterns.",
        teacherName: "Dr. Jane Doe",
        category: "Programming",
        duration: 35,
        price: 49.99,
        totalLessons: 25,
        enrolledStudents: 187,
        averageRating: 4.9,
        isEnrolled: false,
      },
      {
        id: 3,
        title: "Python for Data Science",
        description:
          "Learn Python programming with a focus on data analysis, visualization, and machine learning.",
        teacherName: "Prof. Mike Johnson",
        category: "Programming",
        duration: 50,
        price: 59.99,
        totalLessons: 40,
        enrolledStudents: 312,
        averageRating: 4.7,
        isEnrolled: false,
      },
      {
        id: 4,
        title: "UI/UX Design Principles",
        description:
          "Understand the fundamentals of user interface and user experience design.",
        teacherName: "Sarah Wilson",
        category: "Design",
        duration: 30,
        price: 39.99,
        totalLessons: 20,
        enrolledStudents: 156,
        averageRating: 4.6,
        isEnrolled: false,
      },
      {
        id: 5,
        title: "Digital Marketing Basics",
        description:
          "Learn essential digital marketing strategies including SEO, social media, and content marketing.",
        teacherName: "Mark Anderson",
        category: "Marketing",
        duration: 25,
        price: 0,
        totalLessons: 18,
        enrolledStudents: 289,
        averageRating: 4.5,
        isEnrolled: false,
      },
      {
        id: 6,
        title: "React.js Complete Guide",
        description:
          "Build modern web applications with React.js, Redux, and modern JavaScript.",
        teacherName: "Dr. Jane Doe",
        category: "Programming",
        duration: 45,
        price: 69.99,
        totalLessons: 35,
        enrolledStudents: 421,
        averageRating: 4.9,
        isEnrolled: false,
      },
    ];
  }

  enrollInCourse(courseId: number) {
    const course = this.courses.find((c) => c.id === courseId);
    if (!course) return;

    if (course.isEnrolled) {
      this.router.navigate(["/student/course", courseId]);
      return;
    }

    if (
      confirm(
        `Enroll in "${course.title}"?${course.price > 0 ? " Cost: $" + course.price : " (Free)"}`,
      )
    ) {
      this.studentService.enrollInCourse(courseId).subscribe({
        next: () => {
          course.isEnrolled = true;
          if (course.enrolledStudents !== undefined) {
            course.enrolledStudents++;
          }
          if (course.enrollmentCount !== undefined) {
            course.enrollmentCount++;
          }
          alert(
            "Successfully enrolled in course! You can now access the course content.",
          );
          // Optionally navigate to the course
          if (confirm("Would you like to start the course now?")) {
            this.router.navigate(["/student/course", courseId]);
          }
        },
        error: (err) => {
          console.error("Error enrolling in course:", err);
          const errorMsg =
            err.error?.message ||
            "Failed to enroll in course. Please try again.";
          alert(errorMsg);
        },
      });
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(["/login"]);
  }
}
