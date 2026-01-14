import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router, RouterModule } from "@angular/router";
import { AuthService } from "../../../services/auth.service";
import {
  StatisticsService,
  TeacherStats,
} from "../../../services/statistics.service";

@Component({
  selector: "app-teacher-dashboard",
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard-container">
      <nav class="navbar">
        <div class="navbar-brand">
          <h2>Learning Platform - Teacher</h2>
        </div>
        <div class="navbar-user">
          <span>{{ currentUser?.fullName }}</span>
          <button class="btn btn-secondary" (click)="logout()">Logout</button>
        </div>
      </nav>

      <div class="dashboard-content">
        <div class="container">
          <h1>Teacher Dashboard</h1>
          <p class="welcome-text">
            Welcome back, {{ currentUser?.firstName }}!
          </p>

          <div *ngIf="loading" class="loading">
            <div class="spinner"></div>
            <p>Loading statistics...</p>
          </div>

          <div *ngIf="error" class="alert alert-error">
            {{ error }}
          </div>

          <div *ngIf="!loading && !error" class="stats-grid">
            <div class="stat-card card">
              <div class="stat-icon">📚</div>
              <div class="stat-info">
                <h3>My Courses</h3>
                <p class="stat-number">{{ stats?.totalCourses || 0 }}</p>
              </div>
            </div>

            <div class="stat-card card">
              <div class="stat-icon">🎓</div>
              <div class="stat-info">
                <h3>Total Students</h3>
                <p class="stat-number">{{ stats?.totalStudents || 0 }}</p>
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
              <div class="stat-icon">⏳</div>
              <div class="stat-info">
                <h3>Pending Grading</h3>
                <p class="stat-number">{{ stats?.pendingGrading || 0 }}</p>
              </div>
            </div>

            <div class="stat-card card">
              <div class="stat-icon">✅</div>
              <div class="stat-info">
                <h3>Published Courses</h3>
                <p class="stat-number">{{ stats?.publishedCourses || 0 }}</p>
              </div>
            </div>

            <div class="stat-card card">
              <div class="stat-icon">⭐</div>
              <div class="stat-info">
                <h3>Average Rating</h3>
                <p class="stat-number">
                  {{ stats?.averageRating?.toFixed(1) || "N/A" }}
                </p>
              </div>
            </div>
          </div>

          <div class="quick-actions">
            <h2>Quick Actions</h2>
            <div class="actions-grid">
              <div class="action-card card">
                <h3>Create New Course</h3>
                <p>Start creating a new course for your students</p>
                <button
                  class="btn btn-primary"
                  routerLink="/teacher/courses/create"
                >
                  Create Course
                </button>
              </div>

              <div class="action-card card">
                <h3>My Courses</h3>
                <p>View and manage your existing courses</p>
                <button class="btn btn-primary" routerLink="/teacher/courses">
                  View Courses
                </button>
              </div>

              <div class="action-card card">
                <h3>Grade Assignments</h3>
                <p>Review and grade student submissions</p>
                <button
                  class="btn btn-primary"
                  routerLink="/teacher/grade-assignments"
                >
                  Grade Now
                </button>
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
        padding: 3rem;
        text-align: center;
      }

      .spinner {
        border: 4px solid #f3f3f3;
        border-top: 4px solid #4caf50;
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

      .quick-actions {
        margin-top: 3rem;
      }

      .quick-actions h2 {
        margin-bottom: 1.5rem;
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

      .recent-activity {
        margin-top: 3rem;
      }

      .recent-activity h2 {
        margin-bottom: 1.5rem;
      }

      .activity-list {
        padding: 0;
      }

      .activity-item {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem;
        border-bottom: 1px solid #eee;
      }

      .activity-item:last-child {
        border-bottom: none;
      }

      .activity-icon {
        font-size: 2rem;
      }

      .activity-details {
        flex: 1;
      }

      .activity-title {
        margin: 0;
        color: #333;
        font-weight: 500;
      }

      .activity-time {
        margin: 0.25rem 0 0 0;
        color: #999;
        font-size: 0.875rem;
      }

      @media (max-width: 768px) {
        .navbar {
          flex-direction: column;
          gap: 1rem;
          padding: 1rem;
        }

        .stats-grid,
        .actions-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class DashboardComponent implements OnInit {
  currentUser: any;
  stats: TeacherStats | null = null;
  loading = false;
  error = "";
  recentActivities: any[] = [];

  constructor(
    private authService: AuthService,
    private statisticsService: StatisticsService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.currentUserValue;
    this.loadStats();
    this.loadRecentActivities();
  }

  loadStats() {
    this.loading = true;
    this.error = "";

    this.statisticsService.getTeacherStats().subscribe({
      next: (data) => {
        this.stats = data;
        this.loading = false;
      },
      error: (err) => {
        console.error("Error loading teacher statistics:", err);
        this.loading = false;

        if (err.status === 0) {
          this.error =
            "Cannot connect to server. Please check your connection.";
        } else if (err.status === 401) {
          this.error = "Unauthorized. Please log in again.";
          setTimeout(() => this.logout(), 2000);
        } else {
          this.error =
            err.error?.message ||
            "Failed to load statistics. Please try again.";
        }
      },
    });
  }

  loadRecentActivities() {
    // TODO: Fetch actual activities from API
    this.recentActivities = [
      {
        icon: "📝",
        title: 'New assignment submission in "Web Development Basics"',
        time: "2 hours ago",
      },
      {
        icon: "🎓",
        title: '5 new students enrolled in "Advanced JavaScript"',
        time: "5 hours ago",
      },

      {
        icon: "📚",
        title: 'Course "Python Programming" was approved',
        time: "2 days ago",
      },
    ];
  }

  viewCoursesList() {
    this.router.navigate(["/teacher/courses"]);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(["/login"]);
  }
}
