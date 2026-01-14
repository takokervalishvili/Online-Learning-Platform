import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface CourseAnalytics {
  courseId: number;
  courseTitle: string;
  totalEnrollments: number;
  activeEnrollments: number;
  completedEnrollments: number;
  completionRate: number;
  averageProgress: number;
  totalLessons: number;
  totalAssignments: number;
  totalSubmissions: number;
  gradedSubmissions: number;
  pendingGrading: number;
  averageScore: number;
  averageRating: number;
  totalRatings: number;
  totalRevenue: number;
  enrollmentsByMonth: { month: string; count: number }[];
  createdAt: string;
  status: string;
}

interface StudentProgress {
  studentId: number;
  studentName: string;
  studentEmail: string;
  enrolledAt: string;
  progress: number;
  completedAssignments: number;
  totalAssignments: number;
  averageScore?: number;
  lastActivity?: string;
}

@Component({
  selector: 'app-course-analytics',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="analytics-container">
      <div class="header">
        <div class="header-content">
          <button class="btn-back" routerLink="/teacher/courses">
            ← Back to Courses
          </button>
          <h1>Course Analytics</h1>
          <h2 *ngIf="analytics">{{ analytics.courseTitle }}</h2>
        </div>
      </div>

      <div *ngIf="loading" class="loading">
        <div class="spinner"></div>
        <p>Loading analytics...</p>
      </div>

      <div *ngIf="error" class="alert alert-error">
        {{ error }}
      </div>

      <div *ngIf="!loading && analytics" class="analytics-content">
        <!-- Overview Stats -->
        <div class="stats-grid">
          <div class="stat-card card">
            <div class="stat-icon" style="background: #e3f2fd; color: #1976d2;">👥</div>
            <div class="stat-details">
              <h3>Total Students</h3>
              <p class="stat-value">{{ analytics.totalEnrollments }}</p>
              <p class="stat-label">Active: {{ analytics.activeEnrollments }}</p>
            </div>
          </div>

          <div class="stat-card card">
            <div class="stat-icon" style="background: #e8f5e9; color: #2e7d32;">✅</div>
            <div class="stat-details">
              <h3>Completion Rate</h3>
              <p class="stat-value">{{ analytics.completionRate.toFixed(1) }}%</p>
              <p class="stat-label">{{ analytics.completedEnrollments }} completed</p>
            </div>
          </div>

          <div class="stat-card card">
            <div class="stat-icon" style="background: #fff3e0; color: #ef6c00;">📊</div>
            <div class="stat-details">
              <h3>Avg Progress</h3>
              <p class="stat-value">{{ analytics.averageProgress.toFixed(1) }}%</p>
              <p class="stat-label">Overall course progress</p>
            </div>
          </div>

          <div class="stat-card card">
            <div class="stat-icon" style="background: #fce4ec; color: #c2185b;">⭐</div>
            <div class="stat-details">
              <h3>Average Rating</h3>
              <p class="stat-value">{{ analytics.averageRating > 0 ? analytics.averageRating.toFixed(1) : 'N/A' }}</p>
              <p class="stat-label">{{ analytics.totalRatings }} ratings</p>
            </div>
          </div>

          <div class="stat-card card">
            <div class="stat-icon" style="background: #f3e5f5; color: #7b1fa2;">📝</div>
            <div class="stat-details">
              <h3>Assignments</h3>
              <p class="stat-value">{{ analytics.totalAssignments }}</p>
              <p class="stat-label">{{ analytics.totalSubmissions }} submissions</p>
            </div>
          </div>

          <div class="stat-card card">
            <div class="stat-icon" style="background: #fff9c4; color: #f57f17;">⏳</div>
            <div class="stat-details">
              <h3>Pending Grading</h3>
              <p class="stat-value">{{ analytics.pendingGrading }}</p>
              <p class="stat-label">{{ analytics.gradedSubmissions }} graded</p>
            </div>
          </div>

          <div class="stat-card card">
            <div class="stat-icon" style="background: #e0f2f1; color: #00695c;">💯</div>
            <div class="stat-details">
              <h3>Average Score</h3>
              <p class="stat-value">{{ analytics.averageScore > 0 ? analytics.averageScore.toFixed(1) : 'N/A' }}</p>
              <p class="stat-label">Out of 100</p>
            </div>
          </div>

          <div class="stat-card card">
            <div class="stat-icon" style="background: #e8f5e9; color: #2e7d32;">💰</div>
            <div class="stat-details">
              <h3>Revenue</h3>
              <p class="stat-value">\${{ analytics.totalRevenue.toFixed(2) }}</p>
              <p class="stat-label">Total earnings</p>
            </div>
          </div>
        </div>

        <!-- Course Info -->
        <div class="card info-section">
          <h3>Course Information</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Status:</span>
              <span class="status-badge" [class.published]="analytics.status === 'PUBLISHED'" [class.draft]="analytics.status === 'DRAFT'">
                {{ analytics.status }}
              </span>
            </div>
            <div class="info-item">
              <span class="info-label">Total Lessons:</span>
              <span class="info-value">{{ analytics.totalLessons }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Created:</span>
              <span class="info-value">{{ formatDate(analytics.createdAt) }}</span>
            </div>
          </div>
        </div>

        <!-- Enrollment Trend -->
        <div class="card chart-section" *ngIf="analytics.enrollmentsByMonth.length > 0">
          <h3>Enrollment Trend</h3>
          <div class="chart-container">
            <div class="bar-chart">
              <div
                *ngFor="let data of analytics.enrollmentsByMonth"
                class="bar-item"
                [style.height.%]="getBarHeight(data.count)"
              >
                <div class="bar-fill" [style.height.%]="getBarHeight(data.count)">
                  <span class="bar-label">{{ data.count }}</span>
                </div>
                <span class="bar-month">{{ formatMonth(data.month) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Student Progress -->
        <div class="card">
          <div class="section-header">
            <h3>Student Progress</h3>
            <button class="btn btn-primary" (click)="loadStudentProgress()">
              {{ studentsLoading ? 'Loading...' : 'Load Student Details' }}
            </button>
          </div>

          <div *ngIf="studentsLoading" class="loading-small">
            <div class="spinner-small"></div>
            <p>Loading student progress...</p>
          </div>

          <div *ngIf="!studentsLoading && studentProgress.length > 0" class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Email</th>
                  <th>Enrolled</th>
                  <th>Progress</th>
                  <th>Assignments</th>
                  <th>Avg Score</th>
                  <th>Last Activity</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let student of studentProgress">
                  <td>{{ student.studentName }}</td>
                  <td>{{ student.studentEmail }}</td>
                  <td>{{ formatDate(student.enrolledAt) }}</td>
                  <td>
                    <div class="progress-bar-small">
                      <div class="progress-fill-small" [style.width.%]="student.progress"></div>
                      <span class="progress-text-small">{{ student.progress.toFixed(0) }}%</span>
                    </div>
                  </td>
                  <td>{{ student.completedAssignments }} / {{ student.totalAssignments }}</td>
                  <td>{{ student.averageScore ? student.averageScore.toFixed(1) : 'N/A' }}</td>
                  <td>{{ student.lastActivity ? formatDate(student.lastActivity) : 'No activity' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .analytics-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 2rem;
    }

    .header {
      margin-bottom: 2rem;
    }

    .header-content {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .btn-back {
      align-self: flex-start;
      padding: 0.5rem 1rem;
      background: #6c757d;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.875rem;
      transition: background 0.2s;
    }

    .btn-back:hover {
      background: #5a6268;
    }

    .header h1 {
      margin: 0;
      color: #333;
      font-size: 2rem;
    }

    .header h2 {
      margin: 0;
      color: #666;
      font-size: 1.25rem;
      font-weight: 500;
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
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
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

    .analytics-content {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.5rem;
    }

    .stat-icon {
      font-size: 2.5rem;
      width: 60px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 12px;
    }

    .stat-details {
      flex: 1;
    }

    .stat-details h3 {
      margin: 0 0 0.5rem 0;
      font-size: 0.875rem;
      color: #666;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .stat-value {
      margin: 0;
      font-size: 2rem;
      font-weight: 700;
      color: #333;
    }

    .stat-label {
      margin: 0.25rem 0 0 0;
      font-size: 0.75rem;
      color: #999;
    }

    .card {
      background: white;
      border-radius: 8px;
      padding: 1.5rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .info-section h3,
    .chart-section h3 {
      margin: 0 0 1.5rem 0;
      color: #333;
      font-size: 1.25rem;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .info-label {
      font-size: 0.875rem;
      color: #666;
      font-weight: 500;
    }

    .info-value {
      font-size: 1rem;
      color: #333;
    }

    .status-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .status-badge.published {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .status-badge.draft {
      background: #fff3e0;
      color: #ef6c00;
    }

    .chart-container {
      padding: 1rem 0;
    }

    .bar-chart {
      display: flex;
      align-items: flex-end;
      gap: 1rem;
      height: 200px;
      padding: 1rem 0;
    }

    .bar-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      position: relative;
    }

    .bar-fill {
      width: 100%;
      background: linear-gradient(to top, #4caf50, #81c784);
      border-radius: 4px 4px 0 0;
      position: relative;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding-top: 0.25rem;
      transition: all 0.3s;
    }

    .bar-fill:hover {
      opacity: 0.8;
    }

    .bar-label {
      font-size: 0.875rem;
      font-weight: 600;
      color: white;
    }

    .bar-month {
      font-size: 0.75rem;
      color: #666;
      text-align: center;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .section-header h3 {
      margin: 0;
      color: #333;
      font-size: 1.25rem;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 500;
      transition: all 0.2s;
    }

    .btn-primary {
      background: #4caf50;
      color: white;
    }

    .btn-primary:hover {
      background: #45a049;
    }

    .loading-small {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      padding: 2rem;
    }

    .spinner-small {
      border: 3px solid #f3f3f3;
      border-top: 3px solid #4caf50;
      border-radius: 50%;
      width: 30px;
      height: 30px;
      animation: spin 1s linear infinite;
    }

    .table-container {
      overflow-x: auto;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
    }

    .data-table th,
    .data-table td {
      padding: 1rem;
      text-align: left;
      border-bottom: 1px solid #eee;
    }

    .data-table th {
      background: #f9f9f9;
      font-weight: 600;
      color: #333;
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .data-table td {
      color: #666;
    }

    .data-table tbody tr:hover {
      background: #f9f9f9;
    }

    .progress-bar-small {
      position: relative;
      width: 100px;
      height: 24px;
      background: #f0f0f0;
      border-radius: 12px;
      overflow: hidden;
    }

    .progress-fill-small {
      height: 100%;
      background: linear-gradient(to right, #4caf50, #81c784);
      transition: width 0.3s;
    }

    .progress-text-small {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 0.75rem;
      font-weight: 600;
      color: #333;
    }

    @media (max-width: 768px) {
      .analytics-container {
        padding: 1rem;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }

      .info-grid {
        grid-template-columns: 1fr;
      }

      .bar-chart {
        height: 150px;
      }

      .table-container {
        font-size: 0.875rem;
      }

      .data-table th,
      .data-table td {
        padding: 0.5rem;
      }
    }
  `]
})
export class CourseAnalyticsComponent implements OnInit {
  courseId!: number;
  analytics: CourseAnalytics | null = null;
  studentProgress: StudentProgress[] = [];
  loading = false;
  studentsLoading = false;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.courseId = +params['id'];
      this.loadAnalytics();
    });
  }

  loadAnalytics() {
    this.loading = true;
    this.error = '';

    this.http.get<CourseAnalytics>(`${environment.apiUrl}/statistics/course/${this.courseId}/analytics`).subscribe({
      next: (data) => {
        this.analytics = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading analytics:', err);
        this.loading = false;

        if (err.status === 0) {
          this.error = 'Cannot connect to server. Please check your connection.';
        } else if (err.status === 401) {
          this.error = 'Unauthorized. Please log in again.';
        } else if (err.status === 404) {
          this.error = 'Course not found.';
        } else {
          this.error = err.error?.message || 'Failed to load analytics. Please try again.';
        }
      }
    });
  }

  loadStudentProgress() {
    this.studentsLoading = true;

    this.http.get<StudentProgress[]>(`${environment.apiUrl}/statistics/course/${this.courseId}/students`).subscribe({
      next: (data) => {
        this.studentProgress = data;
        this.studentsLoading = false;
      },
      error: (err) => {
        console.error('Error loading student progress:', err);
        this.error = err.error?.message || 'Failed to load student progress';
        this.studentsLoading = false;
      }
    });
  }

  getBarHeight(count: number): number {
    if (!this.analytics || this.analytics.enrollmentsByMonth.length === 0) return 0;
    const maxCount = Math.max(...this.analytics.enrollmentsByMonth.map(d => d.count));
    return maxCount > 0 ? (count / maxCount) * 100 : 0;
  }

  formatMonth(monthStr: string): string {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}
