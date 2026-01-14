import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router, RouterModule } from "@angular/router";
import { AuthService } from "../../../services/auth.service";
import {
  StudentService,
  Enrollment,
  StudentStats,
} from "../../../services/student.service";
import { StatisticsService } from "../../../services/statistics.service";

@Component({
  selector: "app-student-dashboard",
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard-container">
      <nav class="navbar">
        <div class="navbar-brand">
          <h2>Learning Platform - Student</h2>
        </div>
        <div class="navbar-user">
          <span>{{ currentUser?.fullName }}</span>
          <button class="btn btn-secondary" (click)="logout()">Logout</button>
        </div>
      </nav>

      <div class="dashboard-content">
        <div class="container">
          <h1>Student Dashboard</h1>
          <p class="welcome-text">
            Welcome back, {{ currentUser?.firstName }}!
          </p>

          <div *ngIf="loading" class="loading">
            <div class="spinner"></div>
            <p>Loading your dashboard...</p>
          </div>

          <div *ngIf="error" class="alert alert-error">
            {{ error }}
          </div>

          <div *ngIf="!loading && !error">
            <div class="stats-grid">
              <div class="stat-card card">
                <div class="stat-icon">📚</div>
                <div class="stat-info">
                  <h3>Enrolled Courses</h3>
                  <p class="stat-number">{{ stats?.enrolledCourses || 0 }}</p>
                </div>
              </div>

              <div class="stat-card card">
                <div class="stat-icon">✅</div>
                <div class="stat-info">
                  <h3>Completed Courses</h3>
                  <p class="stat-number">{{ stats?.completedCourses || 0 }}</p>
                </div>
              </div>

              <div class="stat-card card">
                <div class="stat-icon">📝</div>
                <div class="stat-info">
                  <h3>Assignments</h3>
                  <p class="stat-number">{{ stats?.totalAssignments || 0 }}</p>
                </div>
              </div>

              <div class="stat-card card">
                <div class="stat-icon">⭐</div>
                <div class="stat-info">
                  <h3>Average Grade</h3>
                  <p class="stat-number">
                    {{ (stats?.averageGrade || 0).toFixed(1) }}%
                  </p>
                </div>
              </div>
            </div>

            <div class="quick-actions">
              <h2>Quick Actions</h2>
              <div class="actions-grid">
                <div class="action-card card">
                  <h3>Browse Courses</h3>
                  <p>Discover and enroll in new courses</p>
                  <button class="btn btn-primary" routerLink="/student/courses">
                    Browse Courses
                  </button>
                </div>

                <div class="action-card card">
                  <h3>My Courses</h3>
                  <p>Access your enrolled courses</p>
                  <button
                    class="btn btn-primary"
                    routerLink="/student/my-courses"
                  >
                    View My Courses
                  </button>
                </div>

              </div>
            </div>

            <div class="current-courses" *ngIf="enrollments.length > 0">
              <h2>Continue Learning</h2>
              <div class="courses-grid">
                <div
                  class="course-card card"
                  *ngFor="let enrollment of enrollments.slice(0, 3)"
                >
                  <div class="course-header">
                    <h3>{{ enrollment.course?.title }}</h3>
                    <span class="badge badge-info"
                      >{{ enrollment.progress.toFixed(0) }}% Complete</span
                    >
                  </div>
                  <p class="course-teacher">
                    👨‍🏫 {{ enrollment.course?.teacherName }}
                  </p>
                  <div class="course-meta">
                    <span class="meta-item"
                      >📚
                      {{ enrollment.course?.totalLessons || 0 }} Lessons</span
                    >
                    <span class="meta-item"
                      >📝
                      {{
                        enrollment.course?.totalAssignments || 0
                      }}
                      Assignments</span
                    >
                  </div>
                  <div class="progress-bar">
                    <div
                      class="progress-fill"
                      [style.width.%]="enrollment.progress"
                    ></div>
                  </div>
                  <button
                    class="btn btn-primary btn-sm mt-2"
                    [routerLink]="['/student/course', enrollment.courseId]"
                  >
                    Continue
                  </button>
                </div>
              </div>
            </div>

            <div
              class="empty-state"
              *ngIf="enrollments.length === 0 && !loading"
            >
              <div class="empty-icon">📚</div>
              <h3>No Enrolled Courses</h3>
              <p>Start learning by enrolling in your first course!</p>
              <button class="btn btn-primary" routerLink="/student/courses">
                Browse Courses
              </button>
            </div>

            <div
              class="upcoming-assignments"
              *ngIf="upcomingAssignments.length > 0"
            >
              <h2>Upcoming Assignments</h2>
              <div class="card">
                <div class="assignment-list">
                  <div
                    class="assignment-item"
                    *ngFor="let assignment of upcomingAssignments.slice(0, 5)"
                  >
                    <div class="assignment-info">
                      <h4>{{ assignment.title }}</h4>
                      <p class="assignment-course">
                        {{ assignment.courseName || assignment.course?.title }}
                      </p>
                    </div>
                    <div class="assignment-due">
                      <span
                        class="due-date"
                        [class.urgent]="isUrgent(assignment.dueDate)"
                        [class.overdue]="isOverdue(assignment.dueDate)"
                      >
                        {{ getDueText(assignment.dueDate) }}
                      </span>
                      <button
                        class="btn btn-outline btn-sm"
                        [routerLink]="['/student/assignment', assignment.id]"
                      >
                        View
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="recent-grades" *ngIf="recentGrades.length > 0">
              <h2>Recent Grades</h2>
              <div class="card">
                <div class="grades-list">
                  <div
                    class="grade-item"
                    *ngFor="let grade of recentGrades.slice(0, 5)"
                  >
                    <div class="grade-info">
                      <h4>{{ grade.assignmentTitle }}</h4>
                      <p class="grade-course">{{ grade.courseName }}</p>
                    </div>
                    <div
                      class="grade-score"
                      [ngClass]="getGradeClass(grade.grade, grade.maxGrade)"
                    >
                      <span class="score"
                        >{{ grade.grade }}/{{ grade.maxGrade }}</span
                      >
                      <span class="percentage"
                        >{{
                          ((grade.grade / grade.maxGrade) * 100).toFixed(0)
                        }}%</span
                      >
                    </div>
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
      .dashboard-container {
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

      .dashboard-content {
        padding: 2rem 0;
      }

      .welcome-text {
        color: #666;
        font-size: 1.1rem;
        margin-bottom: 2rem;
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
      }

      .alert-error {
        background-color: #fee;
        color: #c33;
        border: 1px solid #fcc;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1.5rem;
        margin-bottom: 3rem;
      }

      .stat-card {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1.5rem;
      }

      .stat-icon {
        font-size: 3rem;
      }

      .stat-info h3 {
        margin: 0;
        font-size: 0.9rem;
        color: #666;
        font-weight: 500;
      }

      .stat-number {
        margin: 0.5rem 0 0 0;
        font-size: 2rem;
        font-weight: 700;
        color: #333;
      }

      .quick-actions,
      .current-courses,
      .upcoming-assignments,
      .recent-grades {
        margin-top: 3rem;
      }

      h2 {
        margin-bottom: 1.5rem;
        color: #333;
      }

      .actions-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1.5rem;
      }

      .action-card {
        padding: 1.5rem;
      }

      .action-card h3 {
        margin: 0 0 0.5rem 0;
        color: #333;
      }

      .action-card p {
        color: #666;
        margin-bottom: 1rem;
      }

      .courses-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1.5rem;
      }

      .course-card {
        padding: 1.5rem;
      }

      .course-header {
        display: flex;
        justify-content: space-between;
        align-items: start;
        margin-bottom: 0.5rem;
      }

      .course-header h3 {
        margin: 0;
        color: #333;
        font-size: 1.1rem;
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

      .course-teacher {
        color: #666;
        font-size: 0.9rem;
        margin-bottom: 0.5rem;
      }

      .course-meta {
        display: flex;
        gap: 1rem;
        margin-bottom: 1rem;
        font-size: 0.875rem;
        color: #666;
      }

      .meta-item {
        display: flex;
        align-items: center;
        gap: 0.25rem;
      }

      .progress-bar {
        width: 100%;
        height: 8px;
        background-color: #e9ecef;
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 1rem;
      }

      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
        transition: width 0.3s ease;
      }

      .btn-sm {
        padding: 8px 16px;
        font-size: 0.9rem;
      }

      .mt-2 {
        margin-top: 0.5rem;
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

      .assignment-list,
      .grades-list {
        padding: 0;
      }

      .assignment-item,
      .grade-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        border-bottom: 1px solid #eee;
      }

      .assignment-item:last-child,
      .grade-item:last-child {
        border-bottom: none;
      }

      .assignment-info,
      .grade-info {
        flex: 1;
      }

      .assignment-info h4,
      .grade-info h4 {
        margin: 0 0 0.25rem 0;
        color: #333;
        font-size: 1rem;
      }

      .assignment-course,
      .grade-course {
        margin: 0;
        color: #666;
        font-size: 0.875rem;
      }

      .assignment-due {
        display: flex;
        align-items: center;
        gap: 1rem;
      }

      .due-date {
        color: #666;
        font-size: 0.875rem;
        font-weight: 500;
        min-width: 120px;
        text-align: right;
      }

      .due-date.urgent {
        color: #ff9800;
        font-weight: 600;
      }

      .due-date.overdue {
        color: #dc3545;
        font-weight: 600;
      }

      .grade-score {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 0.25rem;
        min-width: 100px;
      }

      .grade-score .score {
        font-size: 1.25rem;
        font-weight: 700;
      }

      .grade-score .percentage {
        font-size: 0.875rem;
        font-weight: 600;
      }

      .grade-excellent {
        color: #28a745;
      }

      .grade-good {
        color: #17a2b8;
      }

      .grade-average {
        color: #ffc107;
      }

      .grade-poor {
        color: #dc3545;
      }

      @media (max-width: 768px) {
        .navbar {
          flex-direction: column;
          gap: 1rem;
          padding: 1rem;
        }

        .stats-grid,
        .actions-grid,
        .courses-grid {
          grid-template-columns: 1fr;
        }

        .assignment-item,
        .grade-item {
          flex-direction: column;
          align-items: start;
          gap: 1rem;
        }

        .assignment-due,
        .grade-score {
          width: 100%;
          justify-content: space-between;
        }

        .due-date {
          text-align: left;
        }
      }
    `,
  ],
})
export class DashboardComponent implements OnInit {
  currentUser: any;
  stats: StudentStats | null = null;
  enrollments: Enrollment[] = [];
  upcomingAssignments: any[] = [];
  recentGrades: any[] = [];
  loading = true;
  error = "";

  constructor(
    private authService: AuthService,
    private studentService: StudentService,
    private statisticsService: StatisticsService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.currentUserValue;
    this.loadDashboardData();
  }

  loadDashboardData() {
    this.loading = true;
    this.error = "";

    // Load statistics
    this.statisticsService.getStudentStats().subscribe({
      next: (data) => {
        this.stats = data;
      },
      error: (err) => {
        console.error("Error loading stats:", err);
        // Use default stats if API fails
        this.stats = {
          enrolledCourses: 0,
          completedCourses: 0,
          inProgressCourses: 0,
          totalAssignments: 0,
          completedAssignments: 0,
          pendingAssignments: 0,
          averageGrade: 0,
          totalLearningHours: 0,
        };
      },
    });

    // Load enrollments
    this.studentService.getMyEnrollments().subscribe({
      next: (data) => {
        this.enrollments = data.filter((e) => e.isActive && !e.completedAt);
        this.loading = false;
      },
      error: (err) => {
        console.error("Error loading enrollments:", err);
        this.enrollments = [];
        this.loading = false;
      },
    });

    // Load upcoming assignments
    this.studentService.getMyAssignments({ status: "pending" }).subscribe({
      next: (data) => {
        this.upcomingAssignments = data
          .filter((a) => !this.isOverdue(a.dueDate))
          .sort(
            (a, b) =>
              new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
          );
      },
      error: (err) => {
        console.error("Error loading assignments:", err);
        this.upcomingAssignments = [];
      },
    });

    // Load recent grades
    this.studentService.getMyGrades().subscribe({
      next: (data) => {
        this.recentGrades = data
          .filter((g) => g.grade !== null && g.grade !== undefined)
          .sort(
            (a, b) =>
              new Date(b.gradedAt || b.submittedAt).getTime() -
              new Date(a.gradedAt || a.submittedAt).getTime(),
          );
      },
      error: (err) => {
        console.error("Error loading grades:", err);
        this.recentGrades = [];
      },
    });
  }

  isUrgent(dueDate: string): boolean {
    const now = new Date();
    const due = new Date(dueDate);
    const hoursRemaining = (due.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursRemaining > 0 && hoursRemaining <= 48;
  }

  isOverdue(dueDate: string): boolean {
    return new Date(dueDate) < new Date();
  }

  getDueText(dueDate: string): string {
    const now = new Date();
    const due = new Date(dueDate);
    const diff = due.getTime() - now.getTime();

    if (diff < 0) return "Overdue";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 7) return `Due ${due.toLocaleDateString()}`;
    if (days > 0) return `Due in ${days} day${days > 1 ? "s" : ""}`;
    if (hours > 0) return `Due in ${hours} hour${hours > 1 ? "s" : ""}`;
    return "Due soon";
  }

  getGradeClass(grade: number, maxGrade: number): string {
    const percentage = (grade / maxGrade) * 100;
    if (percentage >= 80) return "grade-excellent";
    if (percentage >= 70) return "grade-good";
    if (percentage >= 60) return "grade-average";
    return "grade-poor";
  }

  logout() {
    this.authService.logout();
    this.router.navigate(["/login"]);
  }
}
