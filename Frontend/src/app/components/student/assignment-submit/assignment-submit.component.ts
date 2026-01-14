import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import {
  AssignmentService,
  AssignmentDetail,
  Submission,
  CreateSubmissionDto,
} from "../../../services/assignment.service";
import { AuthService } from "../../../services/auth.service";

@Component({
  selector: "app-assignment-submit",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="assignment-submit-container">
      <nav class="navbar">
        <div class="navbar-brand">
          <button class="btn btn-link" (click)="goBack()">
            ← Back to Course
          </button>
          <h2>Assignment Submission</h2>
        </div>
        <div class="navbar-user">
          <span>{{ currentUser?.fullName }}</span>
          <button class="btn btn-secondary" (click)="logout()">Logout</button>
        </div>
      </nav>

      <div class="assignment-content">
        <div class="container">
          <div *ngIf="loading" class="loading">
            <div class="spinner"></div>
            <p>Loading assignment...</p>
          </div>

          <div *ngIf="error" class="alert alert-error">
            {{ error }}
            <button class="btn btn-sm" (click)="loadAssignment()">Retry</button>
          </div>

          <div *ngIf="successMessage" class="alert alert-success">
            {{ successMessage }}
          </div>

          <div *ngIf="!loading && !error && assignment" class="content-wrapper">
            <!-- Assignment Details Card -->
            <div class="assignment-card card">
              <div class="assignment-header">
                <h1>{{ assignment.title }}</h1>
                <div class="assignment-meta">
                  <span class="meta-item" [class.overdue]="isOverdue()">
                    📅 Due: {{ formatDate(assignment.dueDate) }}
                  </span>
                  <span class="meta-item">
                    💯 Max Score: {{ assignment.maxScore }}
                  </span>
                  <span class="meta-item">
                    📚 Course: {{ assignment.courseTitle }}
                  </span>
                </div>
              </div>

              <div class="assignment-body">
                <div class="section">
                  <h3>Description</h3>
                  <p class="description-text">{{ assignment.description }}</p>
                </div>

                <div class="section" *ngIf="isOverdue() && !hasSubmission()">
                  <div class="warning-banner">
                    <div class="warning-icon">⚠️</div>
                    <div class="warning-content">
                      <strong>This assignment is overdue!</strong>
                      <p>You can still submit, but it may be marked as late.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Submission Status / Form -->
            <div class="submission-card card">
              <!-- Already Submitted -->
              <div
                *ngIf="hasSubmission() && assignment.mySubmission"
                class="submitted-view"
              >
                <div class="submission-header">
                  <h2>Your Submission</h2>
                  <span
                    class="badge"
                    [class.badge-success]="
                      assignment.mySubmission.score !== undefined
                    "
                    [class.badge-info]="
                      assignment.mySubmission.score === undefined
                    "
                  >
                    {{
                      assignment.mySubmission.score !== undefined
                        ? "✓ Graded"
                        : "⏳ Pending Review"
                    }}
                  </span>
                </div>

                <div class="submission-info">
                  <p class="info-item">
                    <strong>Submitted:</strong>
                    {{ formatDateTime(assignment.mySubmission.submittedAt) }}
                  </p>
                  <p
                    class="info-item"
                    *ngIf="assignment.mySubmission.score !== undefined"
                  >
                    <strong>Score:</strong>
                    <span class="score"
                      >{{ assignment.mySubmission.score }}/{{
                        assignment.maxScore
                      }}</span
                    >
                    <span class="percentage"
                      >({{
                        getScorePercentage(assignment.mySubmission.score)
                      }}%)</span
                    >
                  </p>
                </div>

                <div class="submission-content section">
                  <h3>Your Answer</h3>
                  <div class="content-text">
                    {{ assignment.mySubmission.content }}
                  </div>
                </div>

                <div
                  class="attachments-section"
                  *ngIf="
                    assignment.mySubmission.attachments &&
                    assignment.mySubmission.attachments.length > 0
                  "
                >
                  <h3>
                    📎 Submitted Files ({{
                      assignment.mySubmission.attachments.length
                    }})
                  </h3>
                  <div class="attachments-list">
                    <div
                      class="attachment-item"
                      *ngFor="
                        let attachment of assignment.mySubmission.attachments;
                        let i = index
                      "
                    >
                      <div class="attachment-icon">📄</div>
                      <div class="attachment-info">
                        <span class="attachment-name">{{
                          getAttachmentName(attachment, i)
                        }}</span>
                      </div>
                      <a
                        [href]="attachment"
                        target="_blank"
                        class="btn btn-sm btn-outline"
                        download
                      >
                        Download
                      </a>
                    </div>
                  </div>
                </div>

                <div
                  class="feedback-section"
                  *ngIf="assignment.mySubmission.feedback"
                >
                  <h3>📝 Instructor Feedback</h3>
                  <div class="feedback-content">
                    <div class="feedback-header">
                      <span *ngIf="assignment.mySubmission.gradedByTeacherName">
                        👨‍🏫 {{ assignment.mySubmission.gradedByTeacherName }}
                      </span>
                      <span *ngIf="assignment.mySubmission.gradedAt">
                        {{ formatDateTime(assignment.mySubmission.gradedAt) }}
                      </span>
                    </div>
                    <p class="feedback-text">
                      {{ assignment.mySubmission.feedback }}
                    </p>
                  </div>
                </div>

                <div class="resubmit-section">
                  <button class="btn btn-outline" (click)="enableResubmit()">
                    🔄 Resubmit Assignment
                  </button>
                </div>
              </div>

              <!-- Submission Form -->
              <div
                *ngIf="!hasSubmission() || showResubmitForm"
                class="submission-form"
              >
                <h2>
                  {{ showResubmitForm ? "Resubmit" : "Submit" }} Your Work
                </h2>

                <form (ngSubmit)="submitAssignment()">
                  <div class="form-group">
                    <label for="content">Your Answer *</label>
                    <textarea
                      id="content"
                      [(ngModel)]="submissionContent"
                      name="content"
                      rows="10"
                      placeholder="Write your answer here..."
                      required
                      [disabled]="submitting"
                    ></textarea>
                    <small class="form-hint"
                      >Provide your complete answer or solution.</small
                    >
                  </div>

                  <div class="form-group">
                    <label for="attachments">Attachments (Optional)</label>
                    <textarea
                      id="attachments"
                      [(ngModel)]="attachmentsText"
                      name="attachments"
                      rows="3"
                      placeholder="Enter file URLs (one per line)"
                      [disabled]="submitting"
                    ></textarea>
                    <small class="form-hint">
                      Add links to files you want to submit (e.g., Google Drive,
                      Dropbox). Enter one URL per line.
                    </small>
                  </div>

                  <div class="form-actions">
                    <button
                      type="button"
                      class="btn btn-outline"
                      (click)="cancelResubmit()"
                      [disabled]="submitting"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      class="btn btn-primary"
                      [disabled]="!submissionContent.trim() || submitting"
                    >
                      {{
                        submitting
                          ? "Submitting..."
                          : showResubmitForm
                            ? "Resubmit"
                            : "Submit"
                      }}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <!-- Other Submissions (if any) -->
            <div
              class="stats-card card"
              *ngIf="
                assignment.submissions && assignment.submissions.length > 0
              "
            >
              <h3>📊 Submission Statistics</h3>
              <div class="stats-grid">
                <div class="stat-item">
                  <div class="stat-value">
                    {{ assignment.submissions.length }}
                  </div>
                  <div class="stat-label">Total Submissions</div>
                </div>
                <div class="stat-item" *ngIf="getGradedCount() > 0">
                  <div class="stat-value">{{ getAverageScore() }}%</div>
                  <div class="stat-label">Class Average</div>
                </div>
                <div
                  class="stat-item"
                  *ngIf="assignment.mySubmission?.score !== undefined"
                >
                  <div class="stat-value">{{ getYourRanking() }}</div>
                  <div class="stat-label">Your Ranking</div>
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
      .assignment-submit-container {
        min-height: 100vh;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }

      .navbar {
        background: white;
        padding: 1rem 2rem;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
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
        color: #667eea;
      }

      .navbar-user {
        display: flex;
        align-items: center;
        gap: 1rem;
      }

      .assignment-content {
        padding: 2rem;
      }

      .container {
        max-width: 900px;
        margin: 0 auto;
      }

      .loading {
        text-align: center;
        padding: 3rem;
        color: white;
      }

      .spinner {
        border: 4px solid rgba(255, 255, 255, 0.3);
        border-top: 4px solid white;
        border-radius: 50%;
        width: 50px;
        height: 50px;
        animation: spin 1s linear infinite;
        margin: 0 auto 1rem;
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
        border-radius: 8px;
        margin-bottom: 1rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .alert-error {
        background: #fee;
        color: #c33;
        border: 1px solid #fcc;
      }

      .alert-success {
        background: #efe;
        color: #3c3;
        border: 1px solid #cfc;
      }

      .content-wrapper {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }

      .card {
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        overflow: hidden;
      }

      .assignment-card,
      .submission-card {
        margin-bottom: 0;
      }

      .assignment-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 2rem;
      }

      .assignment-header h1 {
        margin: 0 0 1rem 0;
        font-size: 2rem;
      }

      .assignment-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 1.5rem;
        font-size: 0.95rem;
      }

      .meta-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .meta-item.overdue {
        color: #ffeb3b;
        font-weight: 600;
      }

      .assignment-body {
        padding: 2rem;
      }

      .section {
        margin-bottom: 1.5rem;
      }

      .section h3 {
        color: #667eea;
        margin-bottom: 1rem;
        font-size: 1.2rem;
      }

      .description-text {
        line-height: 1.8;
        color: #333;
        font-size: 1.05rem;
      }

      .warning-banner {
        display: flex;
        gap: 1rem;
        padding: 1rem;
        background: #fff3cd;
        border: 1px solid #ffc107;
        border-radius: 8px;
      }

      .warning-icon {
        font-size: 2rem;
        flex-shrink: 0;
      }

      .warning-content strong {
        display: block;
        color: #856404;
        margin-bottom: 0.25rem;
      }

      .warning-content p {
        margin: 0;
        color: #856404;
      }

      .submitted-view,
      .submission-form {
        padding: 2rem;
      }

      .submission-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
        padding-bottom: 1rem;
        border-bottom: 2px solid #e9ecef;
      }

      .submission-header h2 {
        margin: 0;
        color: #667eea;
      }

      .badge {
        padding: 0.5rem 1rem;
        border-radius: 20px;
        font-size: 0.85rem;
        font-weight: 600;
      }

      .badge-success {
        background: #d4edda;
        color: #155724;
      }

      .badge-info {
        background: #d1ecf1;
        color: #0c5460;
      }

      .submission-info {
        background: #f8f9fa;
        padding: 1rem;
        border-radius: 8px;
        margin-bottom: 1.5rem;
      }

      .info-item {
        margin: 0.5rem 0;
        color: #333;
      }

      .info-item strong {
        color: #667eea;
      }

      .score {
        font-size: 1.2rem;
        font-weight: 600;
        color: #28a745;
        margin-left: 0.5rem;
      }

      .percentage {
        color: #666;
        margin-left: 0.5rem;
      }

      .submission-content {
        padding: 1.5rem;
        background: #f8f9fa;
        border-radius: 8px;
        margin-bottom: 1.5rem;
      }

      .content-text {
        white-space: pre-wrap;
        line-height: 1.8;
        color: #333;
      }

      .attachments-section {
        margin-bottom: 1.5rem;
      }

      .attachments-section h3 {
        color: #667eea;
        margin-bottom: 1rem;
      }

      .attachments-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .attachment-item {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem;
        background: #f8f9fa;
        border-radius: 8px;
        border: 1px solid #e9ecef;
      }

      .attachment-icon {
        font-size: 2rem;
        flex-shrink: 0;
      }

      .attachment-info {
        flex: 1;
      }

      .attachment-name {
        font-weight: 500;
        color: #333;
      }

      .feedback-section {
        background: #e3f2fd;
        padding: 1.5rem;
        border-radius: 8px;
        border: 1px solid #90caf9;
      }

      .feedback-section h3 {
        color: #1976d2;
        margin-bottom: 1rem;
      }

      .feedback-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.75rem;
        font-size: 0.9rem;
        color: #666;
      }

      .feedback-text {
        white-space: pre-wrap;
        line-height: 1.8;
        color: #333;
        margin: 0;
      }

      .resubmit-section {
        margin-top: 1.5rem;
        padding-top: 1.5rem;
        border-top: 1px solid #e9ecef;
        text-align: center;
      }

      .form-group {
        margin-bottom: 1.5rem;
      }

      .form-group label {
        display: block;
        margin-bottom: 0.5rem;
        color: #667eea;
        font-weight: 600;
      }

      .form-group textarea {
        width: 100%;
        padding: 0.75rem;
        border: 2px solid #e9ecef;
        border-radius: 8px;
        font-size: 1rem;
        font-family: inherit;
        resize: vertical;
        transition: border-color 0.2s ease;
      }

      .form-group textarea:focus {
        outline: none;
        border-color: #667eea;
      }

      .form-group textarea:disabled {
        background: #f8f9fa;
        cursor: not-allowed;
      }

      .form-hint {
        display: block;
        margin-top: 0.5rem;
        color: #666;
        font-size: 0.85rem;
      }

      .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        margin-top: 2rem;
      }

      .stats-card {
        padding: 2rem;
      }

      .stats-card h3 {
        color: #667eea;
        margin-bottom: 1.5rem;
        text-align: center;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 1.5rem;
      }

      .stat-item {
        text-align: center;
        padding: 1rem;
        background: #f8f9fa;
        border-radius: 8px;
      }

      .stat-value {
        font-size: 2rem;
        font-weight: 700;
        color: #667eea;
        margin-bottom: 0.5rem;
      }

      .stat-label {
        color: #666;
        font-size: 0.9rem;
      }

      .btn {
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 8px;
        font-size: 1rem;
        cursor: pointer;
        transition: all 0.2s ease;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
      }

      .btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .btn-primary {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
      }

      .btn-primary:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      }

      .btn-outline {
        background: white;
        color: #667eea;
        border: 2px solid #667eea;
      }

      .btn-outline:hover:not(:disabled) {
        background: #667eea;
        color: white;
      }

      .btn-link {
        background: none;
        color: #667eea;
        padding: 0.5rem 1rem;
        font-weight: 500;
      }

      .btn-link:hover {
        background: #f8f9fa;
      }

      .btn-secondary {
        background: #6c757d;
        color: white;
      }

      .btn-secondary:hover {
        background: #5a6268;
      }

      .btn-sm {
        padding: 0.5rem 1rem;
        font-size: 0.9rem;
      }

      @media (max-width: 768px) {
        .navbar {
          flex-direction: column;
          gap: 1rem;
          padding: 1rem;
        }

        .navbar-brand {
          flex-direction: column;
          gap: 0.5rem;
          text-align: center;
        }

        .assignment-content {
          padding: 1rem;
        }

        .assignment-header {
          padding: 1.5rem;
        }

        .assignment-header h1 {
          font-size: 1.5rem;
        }

        .assignment-meta {
          flex-direction: column;
          gap: 0.5rem;
        }

        .assignment-body,
        .submitted-view,
        .submission-form {
          padding: 1.5rem;
        }

        .submission-header {
          flex-direction: column;
          align-items: flex-start;
          gap: 1rem;
        }

        .form-actions {
          flex-direction: column;
        }

        .form-actions .btn {
          width: 100%;
        }

        .stats-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class AssignmentSubmitComponent implements OnInit {
  currentUser: any;
  courseId!: number;
  assignmentId!: number;
  assignment: AssignmentDetail | null = null;
  loading = true;
  error = "";
  successMessage = "";

  // Submission form
  submissionContent = "";
  attachmentsText = "";
  submitting = false;
  showResubmitForm = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private assignmentService: AssignmentService,
    private authService: AuthService,
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.currentUserValue;

    this.route.params.subscribe((params) => {
      this.courseId = +params["courseId"];
      this.assignmentId = +params["assignmentId"];
      this.loadAssignment();
    });
  }

  loadAssignment() {
    this.loading = true;
    this.error = "";
    this.successMessage = "";

    this.assignmentService
      .getAssignment(this.courseId, this.assignmentId)
      .subscribe({
        next: (assignment) => {
          this.assignment = assignment;

          // Pre-fill form if resubmitting
          if (assignment.mySubmission && this.showResubmitForm) {
            this.submissionContent = assignment.mySubmission.content;
            this.attachmentsText = (
              assignment.mySubmission.attachments || []
            ).join("\n");
          }

          this.loading = false;
        },
        error: (err) => {
          console.error("Error loading assignment:", err);
          this.error = "Failed to load assignment. Please try again.";
          this.loading = false;
        },
      });
  }

  submitAssignment() {
    if (!this.submissionContent.trim()) {
      this.error = "Please provide your answer.";
      return;
    }

    this.submitting = true;
    this.error = "";
    this.successMessage = "";

    // Parse attachments
    const attachments = this.attachmentsText
      .split("\n")
      .map((url) => url.trim())
      .filter((url) => url.length > 0);

    const submissionData: CreateSubmissionDto = {
      content: this.submissionContent.trim(),
      attachments: attachments.length > 0 ? attachments : undefined,
    };

    this.assignmentService
      .submitAssignment(this.assignmentId, submissionData)
      .subscribe({
        next: (submission) => {
          this.successMessage = "Assignment submitted successfully!";
          this.submitting = false;
          this.showResubmitForm = false;
          this.submissionContent = "";
          this.attachmentsText = "";

          // Reload assignment to show the submission
          setTimeout(() => {
            this.loadAssignment();
          }, 1500);
        },
        error: (err) => {
          console.error("Error submitting assignment:", err);
          this.error =
            err.error?.message ||
            "Failed to submit assignment. Please try again.";
          this.submitting = false;
        },
      });
  }

  enableResubmit() {
    this.showResubmitForm = true;
    if (this.assignment?.mySubmission) {
      this.submissionContent = this.assignment.mySubmission.content;
      this.attachmentsText = (
        this.assignment.mySubmission.attachments || []
      ).join("\n");
    }
  }

  cancelResubmit() {
    this.showResubmitForm = false;
    this.submissionContent = "";
    this.attachmentsText = "";
    this.error = "";
  }

  hasSubmission(): boolean {
    return !!this.assignment?.mySubmission;
  }

  isOverdue(): boolean {
    if (!this.assignment) return false;
    return new Date(this.assignment.dueDate) < new Date();
  }

  formatDate(date: string): string {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  formatDateTime(date: string): string {
    if (!date) return "";
    return new Date(date).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  getAttachmentName(url: string, index: number): string {
    try {
      const parts = url.split("/");
      const filename = parts[parts.length - 1];
      return decodeURIComponent(filename) || `Attachment ${index + 1}`;
    } catch {
      return `Attachment ${index + 1}`;
    }
  }

  getScorePercentage(score: number): string {
    if (!this.assignment) return "0";
    return ((score / this.assignment.maxScore) * 100).toFixed(1);
  }

  getGradedCount(): number {
    if (!this.assignment?.submissions) return 0;
    return this.assignment.submissions.filter((s) => s.score !== undefined)
      .length;
  }

  getAverageScore(): string {
    if (!this.assignment?.submissions) return "0";

    const gradedSubmissions = this.assignment.submissions.filter(
      (s) => s.score !== undefined,
    );
    if (gradedSubmissions.length === 0) return "0";

    const sum = gradedSubmissions.reduce((acc, s) => acc + (s.score || 0), 0);
    const average = sum / gradedSubmissions.length;
    const percentage = (average / this.assignment.maxScore) * 100;

    return percentage.toFixed(1);
  }

  getYourRanking(): string {
    if (!this.assignment?.submissions || !this.assignment.mySubmission?.score) {
      return "N/A";
    }

    const gradedSubmissions = this.assignment.submissions
      .filter((s) => s.score !== undefined)
      .sort((a, b) => (b.score || 0) - (a.score || 0));

    const myRank =
      gradedSubmissions.findIndex(
        (s) => s.id === this.assignment!.mySubmission?.id,
      ) + 1;

    return myRank > 0 ? `${myRank}/${gradedSubmissions.length}` : "N/A";
  }

  goBack() {
    this.router.navigate(["/student/course", this.courseId]);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(["/login"]);
  }
}
