import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router, RouterModule } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { CoursesService, Course } from "../../../services/courses.service";
import { AuthService } from "../../../services/auth.service";

@Component({
  selector: "app-pending-courses",
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="pending-courses-container">
      <nav class="navbar">
        <div class="navbar-brand">
          <button class="btn btn-link" (click)="goBack()">
            ← Back to Dashboard
          </button>
          <h2>Pending Course Approvals</h2>
        </div>
        <div class="navbar-user">
          <span>{{ currentUser?.fullName }}</span>
          <button class="btn btn-secondary" (click)="logout()">Logout</button>
        </div>
      </nav>

      <div class="pending-courses-content">
        <div class="container">
          <div class="content-header">
            <h1>Review & Approve Courses</h1>
            <p class="subtitle">
              {{ pendingCourses.length }} courses awaiting approval
            </p>
          </div>

          <div *ngIf="loading" class="loading">
            <div class="spinner"></div>
            <p>Loading pending courses...</p>
          </div>

          <div *ngIf="error" class="alert alert-error">
            {{ error }}
            <button class="btn btn-sm" (click)="loadPendingCourses()">
              Retry
            </button>
          </div>

          <div *ngIf="successMessage" class="alert alert-success">
            {{ successMessage }}
          </div>

          <div
            *ngIf="!loading && !error && pendingCourses.length === 0"
            class="no-courses"
          >
            <div class="no-courses-icon">✅</div>
            <h2>All caught up!</h2>
            <p>There are no courses pending approval at this time.</p>
            <button class="btn btn-primary" (click)="goBack()">
              Back to Dashboard
            </button>
          </div>

          <div
            *ngIf="!loading && !error && pendingCourses.length > 0"
            class="courses-grid"
          >
            <div class="course-card card" *ngFor="let course of pendingCourses">
              <div class="course-header">
                <h3>{{ course.title }}</h3>
                <span class="badge badge-pending">Pending Approval</span>
              </div>

              <div class="course-details">
                <div class="detail-item">
                  <span class="detail-label">Teacher:</span>
                  <span class="detail-value">{{
                    course.teacherName || "Unknown"
                  }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Category:</span>
                  <span class="detail-value">{{ course.category }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Duration:</span>
                  <span class="detail-value">{{ course.duration }} hours</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Price:</span>
                  <span class="detail-value"
                    >\${{ course.price.toFixed(2) }}</span
                  >
                </div>
                <div class="detail-item">
                  <span class="detail-label">Created:</span>
                  <span class="detail-value">{{
                    course.createdAt | date: "short"
                  }}</span>
                </div>
              </div>

              <div class="course-description">
                <h4>Description</h4>
                <p>{{ course.description }}</p>
              </div>

              <div class="course-actions">
                <button
                  class="btn btn-success"
                  (click)="approveCourse(course)"
                  [disabled]="processing"
                >
                  <span *ngIf="processingCourseId !== course.id"
                    >✓ Approve</span
                  >
                  <span *ngIf="processingCourseId === course.id"
                    >Processing...</span
                  >
                </button>
                <button
                  class="btn btn-danger"
                  (click)="rejectCourse(course)"
                  [disabled]="processing"
                >
                  <span *ngIf="processingCourseId !== course.id">✗ Reject</span>
                  <span *ngIf="processingCourseId === course.id"
                    >Processing...</span
                  >
                </button>
                <button
                  class="btn btn-secondary"
                  (click)="viewCourseDetails(course)"
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Reject Confirmation Modal -->
      <div class="modal" *ngIf="rejectingCourse" (click)="closeRejectModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Reject Course</h2>
            <button class="close-btn" (click)="closeRejectModal()">
              &times;
            </button>
          </div>
          <div class="modal-body">
            <p>
              Are you sure you want to reject
              <strong>{{ rejectingCourse.title }}</strong
              >?
            </p>
            <div class="form-group">
              <label>Reason (optional):</label>
              <textarea
                [(ngModel)]="rejectionReason"
                class="form-control"
                rows="4"
                placeholder="Provide feedback to the teacher..."
              ></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeRejectModal()">
              Cancel
            </button>
            <button
              class="btn btn-danger"
              (click)="confirmReject()"
              [disabled]="processing"
            >
              {{ processing ? "Rejecting..." : "Reject Course" }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .pending-courses-container {
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

      .pending-courses-content {
        padding: 2rem 0;
      }

      .content-header {
        margin-bottom: 2rem;
      }

      .content-header h1 {
        margin: 0 0 0.5rem 0;
      }

      .subtitle {
        color: #666;
        font-size: 1.1rem;
        margin: 0;
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
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .alert-error {
        background-color: #fee;
        color: #c33;
        border: 1px solid #fcc;
      }

      .alert-success {
        background-color: #efe;
        color: #3c3;
        border: 1px solid #cfc;
      }

      .no-courses {
        text-align: center;
        padding: 4rem 2rem;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .no-courses-icon {
        font-size: 4rem;
        margin-bottom: 1rem;
      }

      .no-courses h2 {
        margin: 0 0 0.5rem 0;
        color: #333;
      }

      .no-courses p {
        color: #666;
        margin-bottom: 1.5rem;
      }

      .courses-grid {
        display: grid;
        gap: 1.5rem;
      }

      .course-card {
        padding: 1.5rem;
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
        flex: 1;
      }

      .badge {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        border-radius: 12px;
        font-size: 0.85rem;
        font-weight: 500;
        white-space: nowrap;
      }

      .badge-pending {
        background-color: #fff3cd;
        color: #856404;
      }

      .course-details {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        margin-bottom: 1.5rem;
        padding: 1rem;
        background-color: #f8f9fa;
        border-radius: 4px;
      }

      .detail-item {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .detail-label {
        font-size: 0.85rem;
        color: #666;
        font-weight: 500;
      }

      .detail-value {
        color: #333;
        font-weight: 400;
      }

      .course-description {
        margin-bottom: 1.5rem;
      }

      .course-description h4 {
        margin: 0 0 0.5rem 0;
        font-size: 1rem;
        color: #333;
      }

      .course-description p {
        color: #666;
        line-height: 1.6;
        margin: 0;
      }

      .course-actions {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }

      .modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }

      .modal-content {
        background: white;
        border-radius: 8px;
        width: 90%;
        max-width: 500px;
        max-height: 90vh;
        overflow-y: auto;
      }

      .modal-header {
        padding: 1.5rem;
        border-bottom: 1px solid #eee;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .modal-header h2 {
        margin: 0;
      }

      .close-btn {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: #666;
      }

      .close-btn:hover {
        color: #333;
      }

      .modal-body {
        padding: 1.5rem;
      }

      .modal-footer {
        padding: 1.5rem;
        border-top: 1px solid #eee;
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
      }

      .form-group {
        margin-bottom: 1rem;
      }

      .form-group label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
      }

      .form-control {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 1rem;
        font-family: inherit;
      }

      @media (max-width: 768px) {
        .navbar {
          flex-direction: column;
          gap: 1rem;
        }

        .course-header {
          flex-direction: column;
        }

        .course-details {
          grid-template-columns: 1fr;
        }

        .course-actions {
          flex-direction: column;
        }

        .course-actions button {
          width: 100%;
        }
      }
    `,
  ],
})
export class PendingCoursesComponent implements OnInit {
  currentUser: any;
  pendingCourses: Course[] = [];
  loading = false;
  error = "";
  successMessage = "";
  processing = false;
  processingCourseId: number | null = null;
  rejectingCourse: Course | null = null;
  rejectionReason = "";

  constructor(
    private coursesService: CoursesService,
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.currentUserValue;
    this.loadPendingCourses();
  }

  loadPendingCourses() {
    this.loading = true;
    this.error = "";

    this.coursesService.getPendingCourses().subscribe({
      next: (data) => {
        this.pendingCourses = data;
        this.loading = false;
        console.log("Loaded pending courses:", data);
      },
      error: (err) => {
        console.error("Error loading pending courses:", err);
        this.loading = false;
        this.error =
          err.error?.message ||
          "Failed to load pending courses. Please try again.";
      },
    });
  }

  approveCourse(course: Course) {
    if (confirm(`Are you sure you want to approve "${course.title}"?`)) {
      this.processing = true;
      this.processingCourseId = course.id;
      this.error = "";
      this.successMessage = "";

      this.coursesService.approveCourse(course.id).subscribe({
        next: () => {
          this.pendingCourses = this.pendingCourses.filter(
            (c) => c.id !== course.id,
          );
          this.successMessage = `Course "${course.title}" has been approved successfully!`;
          this.processing = false;
          this.processingCourseId = null;

          setTimeout(() => (this.successMessage = ""), 5000);
        },
        error: (err) => {
          console.error("Error approving course:", err);
          this.error =
            err.error?.message || "Failed to approve course. Please try again.";
          this.processing = false;
          this.processingCourseId = null;
        },
      });
    }
  }

  rejectCourse(course: Course) {
    this.rejectingCourse = course;
    this.rejectionReason = "";
  }

  closeRejectModal() {
    this.rejectingCourse = null;
    this.rejectionReason = "";
  }

  confirmReject() {
    if (!this.rejectingCourse) return;

    this.processing = true;
    this.processingCourseId = this.rejectingCourse.id;
    this.error = "";
    this.successMessage = "";

    this.coursesService
      .rejectCourse(this.rejectingCourse.id, this.rejectionReason)
      .subscribe({
        next: () => {
          const title = this.rejectingCourse!.title;
          this.pendingCourses = this.pendingCourses.filter(
            (c) => c.id !== this.rejectingCourse!.id,
          );
          this.successMessage = `Course "${title}" has been rejected.`;
          this.closeRejectModal();
          this.processing = false;
          this.processingCourseId = null;

          setTimeout(() => (this.successMessage = ""), 5000);
        },
        error: (err) => {
          console.error("Error rejecting course:", err);
          this.error =
            err.error?.message || "Failed to reject course. Please try again.";
          this.processing = false;
          this.processingCourseId = null;
        },
      });
  }

  viewCourseDetails(course: Course) {
    // Navigate to course details page
    this.router.navigate(["/admin/courses", course.id]);
  }

  goBack() {
    this.router.navigate(["/admin"]);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(["/login"]);
  }
}
