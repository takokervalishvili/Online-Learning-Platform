import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router, RouterModule } from "@angular/router";
import { AuthService } from "../../../services/auth.service";
import {
  StatisticsService,
  DashboardStats,
} from "../../../services/statistics.service";

@Component({
  selector: "app-admin-dashboard",
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard-container">
      <nav class="navbar">
        <div class="navbar-brand">
          <h2>Learning Platform - Admin</h2>
        </div>
        <div class="navbar-user">
          <span>{{ currentUser?.fullName }}</span>
          <button class="btn btn-secondary" (click)="logout()">Logout</button>
        </div>
      </nav>

      <div class="dashboard-content">
        <div class="container">
          <h1>Admin Dashboard</h1>
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

          <div *ngIf="!loading && !error">
            <div class="stats-grid">
              <div class="stat-card card">
                <div class="stat-icon">👥</div>
                <div class="stat-info">
                  <h3>Total Users</h3>
                  <p class="stat-number">{{ stats.totalUsers }}</p>
                </div>
              </div>

              <div class="stat-card card">
                <div class="stat-icon">📚</div>
                <div class="stat-info">
                  <h3>Total Courses</h3>
                  <p class="stat-number">{{ stats.totalCourses }}</p>
                </div>
              </div>

              <div class="stat-card card">
                <div class="stat-icon">👨‍🏫</div>
                <div class="stat-info">
                  <h3>Teachers</h3>
                  <p class="stat-number">{{ stats.totalTeachers }}</p>
                </div>
              </div>

              <div class="stat-card card">
                <div class="stat-icon">🎓</div>
                <div class="stat-info">
                  <h3>Students</h3>
                  <p class="stat-number">{{ stats.totalStudents }}</p>
                </div>
              </div>

              <div class="stat-card card">
                <div class="stat-icon">✅</div>
                <div class="stat-info">
                  <h3>Published Courses</h3>
                  <p class="stat-number">{{ stats.publishedCourses }}</p>
                </div>
              </div>

              <div class="stat-card card">
                <div class="stat-icon">⏳</div>
                <div class="stat-info">
                  <h3>Pending Approval</h3>
                  <p class="stat-number">{{ stats.pendingApprovalCourses }}</p>
                </div>
              </div>

              <div class="stat-card card">
                <div class="stat-icon">📝</div>
                <div class="stat-info">
                  <h3>Total Enrollments</h3>
                  <p class="stat-number">{{ stats.totalEnrollments }}</p>
                </div>
              </div>

              <div class="stat-card card">
                <div class="stat-icon">💰</div>
                <div class="stat-info">
                  <h3>Total Revenue</h3>
                  <p class="stat-number">
                    \${{ stats.totalRevenue.toFixed(2) }}
                  </p>
                </div>
              </div>
            </div>

            <div class="quick-actions">
              <h2>Quick Actions</h2>
              <div class="actions-grid">
                <div class="action-card card">
                  <h3>Manage Users</h3>
                  <p>View, edit, and manage user accounts</p>
                  <button class="btn btn-primary" (click)="navigateToUsers()">
                    Manage Users
                  </button>
                </div>

                <div class="action-card card">
                  <h3>Approve Courses</h3>
                  <p>
                    Review and approve pending courses ({{
                      stats.pendingApprovalCourses
                    }}
                    pending)
                  </p>
                  <button
                    class="btn btn-primary"
                    (click)="navigateToPendingCourses()"
                  >
                    View Pending
                  </button>
                </div>

                <div class="action-card card">
                  <h3>System Settings</h3>
                  <p>Configure platform settings</p>
                  <button
                    class="btn btn-primary"
                    (click)="navigateToSettings()"
                  >
                    Settings
                  </button>
                </div>

                <div class="action-card card">
                  <h3>Reports</h3>
                  <p>View system reports and analytics</p>
                  <button class="btn btn-primary" (click)="navigateToReports()">
                    View Reports
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
        transition:
          transform 0.2s,
          box-shadow 0.2s;
      }

      .stat-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
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
        transition:
          transform 0.2s,
          box-shadow 0.2s;
      }

      .action-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }

      .action-card h3 {
        margin: 0 0 0.5rem 0;
        color: #333;
      }

      .action-card p {
        color: #666;
        margin-bottom: 1rem;
        min-height: 2.5rem;
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
  stats: DashboardStats = {
    totalUsers: 0,
    totalCourses: 0,
    totalTeachers: 0,
    totalStudents: 0,
    publishedCourses: 0,
    pendingApprovalCourses: 0,
    totalEnrollments: 0,
    activeEnrollments: 0,
    totalAssignments: 0,
    totalSubmissions: 0,
    gradedSubmissions: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
  };
  loading = false;
  error = "";

  constructor(
    private authService: AuthService,
    private statisticsService: StatisticsService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.currentUserValue;
    console.log("Admin Dashboard - Current User:", this.currentUser);
    this.loadStats();
  }

  loadStats() {
    this.loading = true;
    this.error = "";

    console.log("Loading dashboard statistics...");

    this.statisticsService.getDashboardStats().subscribe({
      next: (data) => {
        console.log("Statistics loaded successfully:", data);
        this.stats = data;
        this.loading = false;
      },
      error: (err) => {
        console.error("Error loading statistics:", err);
        this.loading = false;

        if (err.status === 0) {
          this.error =
            "Cannot connect to server. Please check your connection.";
        } else if (err.status === 401) {
          this.error = "Unauthorized. Please log in again.";
          setTimeout(() => this.logout(), 2000);
        } else if (err.status === 403) {
          this.error = "You do not have permission to view this page.";
        } else {
          this.error =
            err.error?.message ||
            "Failed to load statistics. Please try again.";
        }
      },
    });
  }

  navigateToUsers() {
    console.log("Navigating to users management...");
    this.router.navigate(["/admin/users"]);
  }

  navigateToPendingCourses() {
    console.log("Navigating to pending courses...");
    this.router.navigate(["/admin/courses/pending"]);
  }

  navigateToSettings() {
    console.log("Navigating to settings...");
    this.router.navigate(["/admin/settings"]);
  }

  navigateToReports() {
    console.log("Navigating to reports...");
    this.router.navigate(["/admin/reports"]);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(["/login"]);
  }
}
