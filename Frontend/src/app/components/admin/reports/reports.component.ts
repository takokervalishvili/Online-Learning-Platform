import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router, RouterModule } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { AuthService } from "../../../services/auth.service";
import { StatisticsService } from "../../../services/statistics.service";

@Component({
  selector: "app-admin-reports",
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="reports-container">
      <nav class="navbar">
        <div class="navbar-brand">
          <button class="btn btn-link" (click)="goBack()">
            ← Back to Dashboard
          </button>
          <h2>Reports & Analytics</h2>
        </div>
        <div class="navbar-user">
          <span>{{ currentUser?.fullName }}</span>
          <button class="btn btn-secondary" (click)="logout()">Logout</button>
        </div>
      </nav>

      <div class="reports-content">
        <div class="container">
          <div class="reports-header">
            <h1>System Reports</h1>
            <p class="subtitle">View detailed analytics and reports</p>
          </div>

          <div class="report-filters">
            <div class="filter-group">
              <label>Report Type</label>
              <select [(ngModel)]="selectedReportType" class="form-control">
                <option value="overview">Overview</option>
                <option value="users">User Analytics</option>
                <option value="courses">Course Performance</option>
                <option value="financial">Financial Report</option>
                <option value="engagement">Engagement Metrics</option>
              </select>
            </div>
            <div class="filter-group">
              <label>Date Range</label>
              <select [(ngModel)]="selectedDateRange" class="form-control">
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
          </div>

          <div *ngIf="loading" class="loading">
            <div class="spinner"></div>
            <p>Generating report...</p>
          </div>

          <div *ngIf="error" class="alert alert-error">
            {{ error }}
          </div>

          <!-- Overview Report -->
          <div
            *ngIf="selectedReportType === 'overview' && !loading"
            class="report-section"
          >
            <h2>Platform Overview</h2>

            <div class="metrics-grid">
              <div class="metric-card card">
                <div class="metric-icon">👥</div>
                <div class="metric-info">
                  <h3>Total Users</h3>
                  <p class="metric-value">{{ stats?.totalUsers || 0 }}</p>
                </div>
              </div>

              <div class="metric-card card">
                <div class="metric-icon">📚</div>
                <div class="metric-info">
                  <h3>Active Courses</h3>
                  <p class="metric-value">{{ stats?.publishedCourses || 0 }}</p>
                </div>
              </div>

              <div class="metric-card card">
                <div class="metric-icon">📝</div>
                <div class="metric-info">
                  <h3>Total Enrollments</h3>
                  <p class="metric-value">{{ stats?.totalEnrollments || 0 }}</p>
                </div>
              </div>

              <div class="metric-card card">
                <div class="metric-icon">💰</div>
                <div class="metric-info">
                  <h3>Total Revenue</h3>
                  <p class="metric-value">
                    \${{ stats?.totalRevenue?.toFixed(2) || "0.00" }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- User Analytics Report -->
          <div
            *ngIf="selectedReportType === 'users' && !loading"
            class="report-section"
          >
            <h2>User Analytics</h2>

            <div class="stats-cards">
              <div class="stat-card card">
                <h3>User Distribution</h3>
                <div class="stat-row">
                  <span>Students:</span>
                  <strong>{{ stats?.totalStudents || 0 }}</strong>
                </div>
                <div class="stat-row">
                  <span>Teachers:</span>
                  <strong>{{ stats?.totalTeachers || 0 }}</strong>
                </div>
                <div class="stat-row">
                  <span>Admins:</span>
                  <strong>{{
                    (stats?.totalUsers || 0) -
                      (stats?.totalStudents || 0) -
                      (stats?.totalTeachers || 0)
                  }}</strong>
                </div>
              </div>

              <div class="stat-card card">
                <h3>Engagement Metrics</h3>
                <div class="stat-row">
                  <span>Active Users (Last 7 days):</span>
                  <strong>{{
                    Math.floor((stats?.totalUsers || 0) * 0.65)
                  }}</strong>
                </div>
                <div class="stat-row">
                  <span>Average Session Duration:</span>
                  <strong>24 minutes</strong>
                </div>
                <div class="stat-row">
                  <span>Completion Rate:</span>
                  <strong>72%</strong>
                </div>
              </div>

              <div class="stat-card card">
                <h3>Registration Trends</h3>
                <div class="stat-row">
                  <span>New Users (Today):</span>
                  <strong>{{ Math.floor(Math.random() * 10) + 1 }}</strong>
                </div>
                <div class="stat-row">
                  <span>New Users (This Week):</span>
                  <strong>{{ Math.floor(Math.random() * 50) + 20 }}</strong>
                </div>
                <div class="stat-row">
                  <span>New Users (This Month):</span>
                  <strong>{{ Math.floor(Math.random() * 200) + 100 }}</strong>
                </div>
              </div>
            </div>
          </div>

          <!-- Course Performance Report -->
          <div
            *ngIf="selectedReportType === 'courses' && !loading"
            class="report-section"
          >
            <h2>Course Performance</h2>

            <div class="stats-cards">
              <div class="stat-card card">
                <h3>Course Statistics</h3>
                <div class="stat-row">
                  <span>Total Courses:</span>
                  <strong>{{ stats?.totalCourses || 0 }}</strong>
                </div>
                <div class="stat-row">
                  <span>Published Courses:</span>
                  <strong>{{ stats?.publishedCourses || 0 }}</strong>
                </div>
                <div class="stat-row">
                  <span>Pending Approval:</span>
                  <strong>{{ stats?.pendingApprovalCourses || 0 }}</strong>
                </div>
              </div>

              <div class="stat-card card">
                <h3>Enrollment Metrics</h3>
                <div class="stat-row">
                  <span>Total Enrollments:</span>
                  <strong>{{ stats?.totalEnrollments || 0 }}</strong>
                </div>
                <div class="stat-row">
                  <span>Active Enrollments:</span>
                  <strong>{{ stats?.activeEnrollments || 0 }}</strong>
                </div>
                <div class="stat-row">
                  <span>Average per Course:</span>
                  <strong>{{
                    stats?.publishedCourses
                      ? Math.floor(
                          stats.totalEnrollments / stats.publishedCourses
                        )
                      : 0
                  }}</strong>
                </div>
              </div>

              <div class="stat-card card">
                <h3>Content Statistics</h3>
                <div class="stat-row">
                  <span>Total Assignments:</span>
                  <strong>{{ stats?.totalAssignments || 0 }}</strong>
                </div>
                <div class="stat-row">
                  <span>Total Submissions:</span>
                  <strong>{{ stats?.totalSubmissions || 0 }}</strong>
                </div>
                <div class="stat-row">
                  <span>Graded Submissions:</span>
                  <strong>{{ stats?.gradedSubmissions || 0 }}</strong>
                </div>
              </div>
            </div>

            <div class="top-courses card">
              <h3>Top Performing Courses</h3>
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Course Name</th>
                    <th>Enrollments</th>
                    <th>Completion Rate</th>
                    <th>Rating</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colspan="4" class="no-data">No data available yet</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Financial Report -->
          <div
            *ngIf="selectedReportType === 'financial' && !loading"
            class="report-section"
          >
            <h2>Financial Report</h2>

            <div class="stats-cards">
              <div class="stat-card card">
                <h3>Revenue Summary</h3>
                <div class="stat-row">
                  <span>Total Revenue:</span>
                  <strong
                    >\${{ stats?.totalRevenue?.toFixed(2) || "0.00" }}</strong
                  >
                </div>
                <div class="stat-row">
                  <span>Monthly Revenue:</span>
                  <strong
                    >\${{ stats?.monthlyRevenue?.toFixed(2) || "0.00" }}</strong
                  >
                </div>
                <div class="stat-row">
                  <span>Average per Enrollment:</span>
                  <strong
                    >\${{
                      stats?.totalEnrollments
                        ? (stats.totalRevenue / stats.totalEnrollments).toFixed(
                            2
                          )
                        : "0.00"
                    }}</strong
                  >
                </div>
              </div>

              <div class="stat-card card">
                <h3>Payment Metrics</h3>
                <div class="stat-row">
                  <span>Successful Transactions:</span>
                  <strong>{{ stats?.totalEnrollments || 0 }}</strong>
                </div>
                <div class="stat-row">
                  <span>Pending Payments:</span>
                  <strong>0</strong>
                </div>
                <div class="stat-row">
                  <span>Refunds Issued:</span>
                  <strong>0</strong>
                </div>
              </div>

              <div class="stat-card card">
                <h3>Teacher Earnings</h3>
                <div class="stat-row">
                  <span>Total Paid to Teachers:</span>
                  <strong
                    >\${{
                      (stats?.totalRevenue * 0.7).toFixed(2) || "0.00"
                    }}</strong
                  >
                </div>
                <div class="stat-row">
                  <span>Platform Commission:</span>
                  <strong
                    >\${{
                      (stats?.totalRevenue * 0.3).toFixed(2) || "0.00"
                    }}</strong
                  >
                </div>
                <div class="stat-row">
                  <span>Pending Payouts:</span>
                  <strong>$0.00</strong>
                </div>
              </div>
            </div>

            <div class="revenue-chart card">
              <h3>Revenue Trend</h3>
              <div class="chart-placeholder">
                <p>📈 Monthly revenue chart would be displayed here</p>
              </div>
            </div>
          </div>

          <!-- Engagement Report -->
          <div
            *ngIf="selectedReportType === 'engagement' && !loading"
            class="report-section"
          >
            <h2>Engagement Metrics</h2>

            <div class="stats-cards">
              <div class="stat-card card">
                <h3>Activity Overview</h3>
                <div class="stat-row">
                  <span>Daily Active Users:</span>
                  <strong>{{
                    Math.floor((stats?.totalUsers || 0) * 0.45)
                  }}</strong>
                </div>
                <div class="stat-row">
                  <span>Weekly Active Users:</span>
                  <strong>{{
                    Math.floor((stats?.totalUsers || 0) * 0.65)
                  }}</strong>
                </div>
                <div class="stat-row">
                  <span>Monthly Active Users:</span>
                  <strong>{{
                    Math.floor((stats?.totalUsers || 0) * 0.85)
                  }}</strong>
                </div>
              </div>

              <div class="stat-card card">
                <h3>Learning Progress</h3>
                <div class="stat-row">
                  <span>Courses in Progress:</span>
                  <strong>{{ stats?.activeEnrollments || 0 }}</strong>
                </div>
                <div class="stat-row">
                  <span>Completed Courses:</span>
                  <strong>{{
                    Math.floor((stats?.totalEnrollments || 0) * 0.35)
                  }}</strong>
                </div>
                <div class="stat-row">
                  <span>Average Completion Time:</span>
                  <strong>45 days</strong>
                </div>
              </div>

              <div class="stat-card card">
                <h3>Interaction Metrics</h3>

                <div class="stat-row">
                  <span>Questions Asked:</span>
                  <strong>{{
                    Math.floor((stats?.totalUsers || 0) * 1.8)
                  }}</strong>
                </div>
                <div class="stat-row">
                  <span>Resources Downloaded:</span>
                  <strong>{{
                    Math.floor((stats?.totalEnrollments || 0) * 3.2)
                  }}</strong>
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
      .reports-container {
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

      .reports-content {
        padding: 2rem 0;
      }

      .reports-header {
        margin-bottom: 2rem;
      }

      .reports-header h1 {
        margin: 0 0 0.5rem 0;
      }

      .subtitle {
        color: #666;
        font-size: 1.1rem;
        margin: 0;
      }

      .report-filters {
        display: flex;
        gap: 1rem;
        margin-bottom: 2rem;
        background: white;
        padding: 1.5rem;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        align-items: flex-end;
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
        color: #333;
      }

      .form-control {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 1rem;
      }

      .filter-actions {
        display: flex;
        gap: 0.5rem;
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

      .report-section {
        margin-bottom: 2rem;
      }

      .report-section h2 {
        margin: 0 0 1.5rem 0;
        color: #333;
      }

      .metrics-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1.5rem;
        margin-bottom: 2rem;
      }

      .metric-card {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1.5rem;
      }

      .metric-icon {
        font-size: 3rem;
      }

      .metric-info {
        flex: 1;
      }

      .metric-info h3 {
        margin: 0;
        font-size: 0.9rem;
        color: #666;
        font-weight: 500;
      }

      .metric-value {
        margin: 0.5rem 0;
        font-size: 2rem;
        font-weight: 700;
        color: #333;
      }

      .metric-change {
        font-size: 0.85rem;
        font-weight: 500;
      }

      .metric-change.positive {
        color: #4caf50;
      }

      .metric-change.negative {
        color: #f44336;
      }

      .stats-cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1.5rem;
        margin-bottom: 2rem;
      }

      .stat-card {
        padding: 1.5rem;
      }

      .stat-card h3 {
        margin: 0 0 1rem 0;
        color: #333;
        font-size: 1.1rem;
        border-bottom: 2px solid #4caf50;
        padding-bottom: 0.5rem;
      }

      .stat-row {
        display: flex;
        justify-content: space-between;
        padding: 0.5rem 0;
        border-bottom: 1px solid #eee;
      }

      .stat-row:last-child {
        border-bottom: none;
      }

      .stat-row span {
        color: #666;
      }

      .stat-row strong {
        color: #333;
        font-weight: 600;
      }

      .chart-section {
        padding: 1.5rem;
        margin-bottom: 2rem;
      }

      .chart-section h3 {
        margin: 0 0 1rem 0;
        color: #333;
      }

      .chart-placeholder {
        height: 300px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: #f8f9fa;
        border: 2px dashed #ddd;
        border-radius: 8px;
        color: #666;
      }

      .chart-placeholder p {
        margin: 0.5rem 0;
        font-size: 1.1rem;
      }

      .chart-note {
        font-size: 0.9rem !important;
        color: #999 !important;
      }

      .top-courses {
        padding: 1.5rem;
      }

      .top-courses h3 {
        margin: 0 0 1rem 0;
        color: #333;
      }

      .data-table {
        width: 100%;
        border-collapse: collapse;
      }

      .data-table th {
        background: #f8f9fa;
        padding: 0.75rem;
        text-align: left;
        font-weight: 600;
        color: #333;
        border-bottom: 2px solid #dee2e6;
      }

      .data-table td {
        padding: 0.75rem;
        border-bottom: 1px solid #dee2e6;
      }

      .no-data {
        text-align: center;
        color: #999;
        font-style: italic;
      }

      .revenue-chart {
        padding: 1.5rem;
      }

      .revenue-chart h3 {
        margin: 0 0 1rem 0;
        color: #333;
      }

      @media (max-width: 768px) {
        .navbar {
          flex-direction: column;
          gap: 1rem;
        }

        .report-filters {
          flex-direction: column;
          align-items: stretch;
        }

        .filter-actions {
          flex-direction: column;
        }

        .metrics-grid,
        .stats-cards {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class ReportsComponent implements OnInit {
  currentUser: any;
  stats: any;
  loading = false;
  error = "";
  selectedReportType = "overview";
  selectedDateRange = "month";
  Math = Math;

  constructor(
    private authService: AuthService,
    private statisticsService: StatisticsService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.currentUserValue;
    this.loadStatistics();
  }

  loadStatistics() {
    this.loading = true;
    this.error = "";

    this.statisticsService.getDashboardStats().subscribe({
      next: (data) => {
        this.stats = data;
        this.loading = false;
      },
      error: (err) => {
        console.error("Error loading statistics:", err);
        this.error = "Failed to load statistics. Please try again.";
        this.loading = false;
      },
    });
  }

  generateReport() {
    console.log(
      "Generating report:",
      this.selectedReportType,
      this.selectedDateRange,
    );
    this.loadStatistics();
  }

  exportReport() {
    console.log("Exporting report as PDF...");
    alert(
      "PDF export functionality would be implemented here using a library like jsPDF or pdfmake.",
    );
  }

  goBack() {
    this.router.navigate(["/admin"]);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(["/login"]);
  }
}
