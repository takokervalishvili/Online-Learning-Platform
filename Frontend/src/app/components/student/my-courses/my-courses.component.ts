import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router, RouterModule } from "@angular/router";
import { AuthService } from "../../../services/auth.service";
import { StudentService, Enrollment } from "../../../services/student.service";

@Component({
  selector: "app-my-courses",
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="my-courses-container">
      <nav class="navbar">
        <div class="navbar-brand">
          <button class="btn btn-link" routerLink="/student">
            ← Back to Dashboard
          </button>
          <h2>My Courses</h2>
        </div>
        <div class="navbar-user">
          <span>{{ currentUser?.fullName }}</span>
          <button class="btn btn-secondary" (click)="logout()">Logout</button>
        </div>
      </nav>

      <div class="my-courses-content">
        <div class="container">
          <div class="page-header">
            <h1>My Enrolled Courses</h1>
            <p>Track your progress and continue learning</p>
          </div>

          <!-- Debug Panel -->
          <div class="debug-panel card" *ngIf="showDebug">
            <div class="debug-header">
              <h3>🔍 Debug Information</h3>
              <button class="btn btn-sm" (click)="showDebug = false">
                Hide
              </button>
            </div>
            <div class="debug-content">
              <h4>Current User:</h4>
              <pre>{{ currentUser | json }}</pre>

              <h4>Raw Enrollments ({{ enrollments.length }}):</h4>
              <pre>{{ enrollments | json }}</pre>

              <h4>Active Courses ({{ activeCourses.length }}):</h4>
              <pre>{{ activeCourses | json }}</pre>

              <h4>Completed Courses ({{ completedCourses.length }}):</h4>
              <pre>{{ completedCourses | json }}</pre>

              <button class="btn btn-primary" (click)="loadEnrollments()">
                Reload Enrollments
              </button>
            </div>
          </div>
          
          <div class="tabs">
            <button
              class="tab"
              [class.active]="activeTab === 'active'"
              (click)="activeTab = 'active'"
            >
              Active Courses ({{ activeCourses.length }})
            </button>
            <button
              class="tab"
              [class.active]="activeTab === 'completed'"
              (click)="activeTab = 'completed'"
            >
              Completed ({{ completedCourses.length }})
            </button>
          </div>

          <div *ngIf="loading" class="loading">
            <div class="spinner"></div>
            <p>Loading your courses...</p>
          </div>

          <div *ngIf="error" class="alert alert-error">
            {{ error }}
            <button class="btn btn-sm" (click)="loadEnrollments()">
              Retry
            </button>
          </div>

          <div *ngIf="!loading && !error">
            <!-- Active Courses -->
            <div *ngIf="activeTab === 'active'" class="courses-section">
              <div *ngIf="activeCourses.length === 0" class="empty-state">
                <div class="empty-icon">📚</div>
                <h3>No Active Courses</h3>
                <p>Browse and enroll in courses to start learning!</p>
                <button class="btn btn-primary" routerLink="/student/courses">
                  Browse Courses
                </button>
              </div>

              <div *ngIf="activeCourses.length > 0" class="courses-grid">
                <div
                  class="course-card card"
                  *ngFor="let enrollment of activeCourses"
                >
                  <div class="course-header">
                    <h3>{{ enrollment.course?.title }}</h3>
                    <span
                      class="badge"
                      [class.badge-warning]="enrollment.progress < 50"
                      [class.badge-info]="
                        enrollment.progress >= 50 && enrollment.progress < 100
                      "
                    >
                      {{ enrollment.progress.toFixed(0) }}% Complete
                    </span>
                  </div>

                  <p class="course-category">
                    {{ enrollment.course?.category }}
                  </p>
                  <p class="course-teacher">
                    👨‍🏫 {{ enrollment.course?.teacherName }}
                  </p>

                  <div class="course-meta">
                    <div class="meta-item">
                      <span
                        >📚
                        {{ enrollment.course?.totalLessons || 0 }} Lessons</span
                      >
                    </div>
                    <div class="meta-item">
                      <span
                        >📝
                        {{ enrollment.course?.totalAssignments || 0 }}
                        Assignments</span
                      >
                    </div>
                    <div class="meta-item">
                      <span
                        >✅
                        {{ enrollment.completedAssignments || 0 }}
                        Completed</span
                      >
                    </div>
                  </div>

                  <div class="progress-section">
                    <div class="progress-bar">
                      <div
                        class="progress-fill"
                        [style.width.%]="enrollment.progress"
                      ></div>
                    </div>
                    <span class="progress-text"
                      >{{ enrollment.progress.toFixed(0) }}%</span
                    >
                  </div>

                  <div class="course-date">
                    <small
                      >Enrolled: {{ formatDate(enrollment.enrolledAt) }}</small
                    >
                  </div>

                  <div class="course-actions">
                    <button
                      class="btn btn-primary"
                      [routerLink]="['/student/course', enrollment.courseId]"
                    >
                      Continue Learning
                    </button>
                    <button
                      class="btn btn-outline"
                      (click)="unenroll(enrollment)"
                    >
                      Unenroll
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Completed Courses -->
            <div *ngIf="activeTab === 'completed'" class="courses-section">
              <div *ngIf="completedCourses.length === 0" class="empty-state">
                <div class="empty-icon">🎓</div>
                <h3>No Completed Courses Yet</h3>
                <p>Complete your active courses to see them here!</p>
                <button class="btn btn-primary" (click)="activeTab = 'active'">
                  View Active Courses
                </button>
              </div>

              <div *ngIf="completedCourses.length > 0" class="courses-grid">
                <div
                  class="course-card card"
                  *ngFor="let enrollment of completedCourses"
                >
                  <div class="course-header">
                    <h3>{{ enrollment.course?.title }}</h3>
                    <span class="badge badge-success">✓ Completed</span>
                  </div>

                  <p class="course-category">
                    {{ enrollment.course?.category }}
                  </p>
                  <p class="course-teacher">
                    👨‍🏫 {{ enrollment.course?.teacherName }}
                  </p>

                  <div class="course-meta">
                    <div class="meta-item">
                      <span
                        >📚
                        {{ enrollment.course?.totalLessons || 0 }} Lessons</span
                      >
                    </div>
                    <div class="meta-item">
                      <span
                        >📝
                        {{ enrollment.course?.totalAssignments || 0 }}
                        Assignments</span
                      >
                    </div>
                  </div>

                  <div class="completion-badge">
                    <span class="completion-icon">🎉</span>
                    <span
                      >Completed on
                      {{ formatDate(enrollment.completedAt!) }}</span
                    >
                  </div>

                  <div class="course-actions">
                    <button
                      class="btn btn-outline"
                      [routerLink]="['/student/course', enrollment.courseId]"
                    >
                      Review Course
                    </button>
                  </div>
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
      .my-courses-container {
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

      .navbar-brand {
        display: flex;
        align-items: center;
        gap: 1rem;
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

      .debug-panel {
        margin-bottom: 2rem;
        padding: 1.5rem;
        background: #fff8e1;
        border: 2px solid #ffc107;
      }

      .debug-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        padding-bottom: 0.5rem;
        border-bottom: 2px solid #ffc107;
      }

      .debug-header h3 {
        margin: 0;
        color: #f57c00;
      }

      .debug-content h4 {
        margin: 1rem 0 0.5rem 0;
        color: #333;
        font-size: 0.9rem;
        font-weight: 600;
      }

      .debug-content pre {
        background: #fff;
        padding: 1rem;
        border-radius: 4px;
        overflow-x: auto;
        font-size: 0.85rem;
        max-height: 300px;
        overflow-y: auto;
      }

      .debug-toggle {
        margin-bottom: 1rem;
      }

      .my-courses-content {
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

      .tabs {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 2rem;
        border-bottom: 2px solid #ddd;
      }

      .tab {
        padding: 1rem 2rem;
        background: none;
        border: none;
        border-bottom: 3px solid transparent;
        cursor: pointer;
        font-size: 1rem;
        font-weight: 500;
        color: #666;
        transition: all 0.3s;
      }

      .tab:hover {
        color: #333;
        background: #f8f9fa;
      }

      .tab.active {
        color: #667eea;
        border-bottom-color: #667eea;
      }

      .loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 300px;
      }

      .spinner {
        border: 4px solid #f3f3f3;
        border-top: 4px solid #667eea;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        animation: spin 1s linear infinite;
        margin-bottom: 1rem;
      }

      @keyframes spin {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }

      .alert {
        padding: 1rem;
        border-radius: 4px;
        margin-bottom: 1rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .alert-error {
        background-color: #fee;
        color: #c33;
        border: 1px solid #fcc;
      }

      .empty-state {
        text-align: center;
        padding: 4rem 2rem;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
        margin-bottom: 1.5rem;
      }

      .courses-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
        gap: 2rem;
      }

      .course-card {
        padding: 1.5rem;
        transition:
          transform 0.3s ease,
          box-shadow 0.3s ease;
      }

      .course-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
      }

      .course-header {
        display: flex;
        justify-content: space-between;
        align-items: start;
        margin-bottom: 1rem;
        gap: 1rem;
      }

      .course-header h3 {
        margin: 0;
        color: #333;
        font-size: 1.25rem;
        flex: 1;
      }

      .badge {
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 600;
        white-space: nowrap;
      }

      .badge-info {
        background-color: #e3f2fd;
        color: #1976d2;
      }

      .badge-warning {
        background-color: #fff3e0;
        color: #f57c00;
      }

      .badge-success {
        background-color: #e8f5e9;
        color: #388e3c;
      }

      .course-category {
        display: inline-block;
        background: #f8f9fa;
        padding: 4px 12px;
        border-radius: 4px;
        font-size: 0.875rem;
        color: #666;
        margin-bottom: 0.5rem;
      }

      .course-teacher {
        color: #666;
        font-size: 0.9rem;
        margin-bottom: 1rem;
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
        color: #666;
        font-size: 0.875rem;
      }

      .progress-section {
        margin-bottom: 1rem;
      }

      .progress-bar {
        width: 100%;
        height: 10px;
        background-color: #e9ecef;
        border-radius: 5px;
        overflow: hidden;
        margin-bottom: 0.5rem;
      }

      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
        transition: width 0.3s ease;
      }

      .progress-text {
        font-size: 0.875rem;
        font-weight: 600;
        color: #667eea;
      }

      .course-date {
        margin-bottom: 1rem;
      }

      .course-date small {
        color: #999;
        font-size: 0.875rem;
      }

      .completion-badge {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 1rem;
        background: #e8f5e9;
        border-radius: 8px;
        margin-bottom: 1rem;
      }

      .completion-icon {
        font-size: 1.5rem;
      }

      .completion-badge span {
        color: #388e3c;
        font-weight: 600;
      }

      .course-actions {
        display: flex;
        gap: 0.5rem;
      }

      .course-actions button {
        flex: 1;
      }

      @media (max-width: 768px) {
        .navbar {
          flex-direction: column;
          gap: 1rem;
          padding: 1rem;
        }

        .navbar-brand {
          flex-direction: column;
          text-align: center;
        }

        .navbar-user {
          width: 100%;
          justify-content: space-between;
        }

        .tabs {
          flex-direction: column;
        }

        .tab {
          border-bottom: 1px solid #ddd;
          border-left: 3px solid transparent;
        }

        .tab.active {
          border-bottom-color: #ddd;
          border-left-color: #667eea;
        }

        .courses-grid {
          grid-template-columns: 1fr;
        }

        .course-actions {
          flex-direction: column;
        }
      }
    `,
  ],
})
export class MyCoursesComponent implements OnInit {
  currentUser: any;
  enrollments: Enrollment[] = [];
  activeCourses: Enrollment[] = [];
  completedCourses: Enrollment[] = [];
  loading = true;
  error = "";
  activeTab: "active" | "completed" = "active";
  showDebug = false;

  constructor(
    private authService: AuthService,
    private studentService: StudentService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.currentUserValue;
    this.loadEnrollments();
  }

  loadEnrollments() {
    this.loading = true;
    this.error = "";
    this.studentService.getMyEnrollments().subscribe({
      next: (data) => {

        this.enrollments = data;
        this.activeCourses = data.filter((e) => e.isActive && !e.completedAt);
        this.completedCourses = data.filter((e) => e.completedAt);


        this.loading = false;
      },
      error: (err) => {
        this.error = `Failed to load your courses: ${err.error?.message || err.message}`;
        this.loading = false;
      },
    });
  }

  unenroll(enrollment: Enrollment) {
    if (
      !confirm(
        `Are you sure you want to unenroll from "${enrollment.course?.title}"?`,
      )
    ) {
      return;
    }

    this.studentService.unenrollFromCourse(enrollment.id).subscribe({
      next: () => {
        this.loadEnrollments();
      },
      error: (err) => {
        alert("Failed to unenroll. Please try again.");
      },
    });
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(["/login"]);
  }
}
