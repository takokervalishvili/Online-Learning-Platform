import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import {
  AssignmentService,
  Submission,
} from "../../../services/assignment.service";
import { AuthService } from "../../../services/auth.service";
import { UploadService } from "../../../services/upload.service";

@Component({
  selector: "app-grade-assignments",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="grade-container">
      <div class="header">
        <h1>Grade Assignments</h1>
        <button class="btn btn-secondary" routerLink="/teacher/dashboard">
          ← Back to Dashboard
        </button>
      </div>

      <div *ngIf="loading" class="loading">
        <div class="spinner"></div>
        <p>Loading submissions...</p>
      </div>

      <div *ngIf="error" class="alert alert-error">
        {{ error }}
      </div>

      <div *ngIf="!loading && submissions.length === 0" class="empty-state">
        <div class="empty-icon">📝</div>
        <h2>No submissions to grade</h2>
        <p>All assignments have been graded!</p>
      </div>

      <div class="submissions-list" *ngIf="!loading && submissions.length > 0">
        <div
          class="submission-card card"
          *ngFor="let submission of submissions"
        >
          <div class="submission-header">
            <div class="student-info">
              <h3>{{ submission.studentName }}</h3>
              <p class="meta">
                Submitted {{ formatDate(submission.submittedAt) }}
              </p>
            </div>
            <div class="assignment-info">
              <span class="assignment-badge">{{
                getAssignmentTitle(submission.assignmentId)
              }}</span>
            </div>
          </div>

          <div class="submission-content">
            <h4>Submission Content:</h4>
            <p class="content-text">{{ submission.content }}</p>

            <div *ngIf="submission.attachments.length > 0" class="attachments">
              <h4>Attachments:</h4>
              <div class="attachment-list">
                <a
                  *ngFor="let attachment of submission.attachments"
                  (click)="downloadFile(attachment)"
                  class="attachment-link"
                  style="cursor: pointer;"
                >
                  📎 {{ getFileName(attachment) }}
                </a>
              </div>
            </div>
          </div>

          <div class="grading-section" *ngIf="!submission.score">
            <div class="grading-form">
              <div class="form-row">
                <div class="form-group">
                  <label>Score *</label>
                  <input
                    type="number"
                    [(ngModel)]="gradingData[submission.id].score"
                    [max]="getMaxScore(submission.assignmentId)"
                    min="0"
                    class="form-control"
                    placeholder="Enter score"
                  />
                  <span class="max-score"
                    >/ {{ getMaxScore(submission.assignmentId) }} points</span
                  >
                </div>
              </div>

              <div class="form-group">
                <label>Feedback</label>
                <textarea
                  [(ngModel)]="gradingData[submission.id].feedback"
                  rows="3"
                  class="form-control"
                  placeholder="Provide feedback to the student..."
                ></textarea>
              </div>

              <button
                class="btn btn-primary"
                (click)="gradeSubmission(submission.id)"
                [disabled]="
                  !gradingData[submission.id].score || grading[submission.id]
                "
              >
                {{ grading[submission.id] ? "Grading..." : "Submit Grade" }}
              </button>
            </div>
          </div>

          <div class="graded-section" *ngIf="submission.score">
            <div class="grade-display">
              <div class="score-badge">
                <span class="score">{{ submission.score }}</span>
                <span class="max"
                  >/ {{ getMaxScore(submission.assignmentId) }}</span
                >
              </div>
              <div class="graded-info">
                <p>
                  <strong>Graded by:</strong>
                  {{ submission.gradedByTeacherName }}
                </p>
                <p>
                  <strong>Graded on:</strong>
                  {{ formatDate(submission.gradedAt!) }}
                </p>
                <p *ngIf="submission.feedback">
                  <strong>Feedback:</strong> {{ submission.feedback }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .grade-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem;
      }

      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
      }

      .header h1 {
        margin: 0;
        color: #333;
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

      .empty-state {
        text-align: center;
        padding: 4rem 2rem;
      }

      .empty-icon {
        font-size: 4rem;
        margin-bottom: 1rem;
      }

      .empty-state h2 {
        margin: 0 0 0.5rem 0;
        color: #666;
      }

      .empty-state p {
        color: #999;
      }

      .submissions-list {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }

      .submission-card {
        padding: 1.5rem;
      }

      .submission-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 1.5rem;
        padding-bottom: 1rem;
        border-bottom: 2px solid #eee;
      }

      .student-info h3 {
        margin: 0 0 0.25rem 0;
        color: #333;
        font-size: 1.25rem;
      }

      .meta {
        margin: 0;
        color: #999;
        font-size: 0.875rem;
      }

      .assignment-badge {
        display: inline-block;
        padding: 0.5rem 1rem;
        background: #e3f2fd;
        color: #1976d2;
        border-radius: 4px;
        font-size: 0.875rem;
        font-weight: 500;
      }

      .submission-content {
        margin-bottom: 1.5rem;
      }

      .submission-content h4 {
        margin: 0 0 0.75rem 0;
        color: #555;
        font-size: 1rem;
      }

      .content-text {
        padding: 1rem;
        background: #f9f9f9;
        border-left: 3px solid #4caf50;
        margin: 0 0 1rem 0;
        line-height: 1.6;
        color: #333;
      }

      .attachments {
        margin-top: 1rem;
      }

      .attachment-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .attachment-link {
        display: inline-flex;
        align-items: center;
        padding: 0.5rem;
        background: #fff;
        border: 1px solid #ddd;
        border-radius: 4px;
        color: #1976d2;
        text-decoration: none;
        transition: background 0.2s;
      }

      .attachment-link:hover {
        background: #f5f5f5;
      }

      .grading-section {
        padding: 1.5rem;
        background: #f9f9f9;
        border-radius: 4px;
      }

      .grading-form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .form-row {
        display: grid;
        grid-template-columns: 1fr;
        gap: 1rem;
      }

      .form-group {
        display: flex;
        flex-direction: column;
      }

      .form-group label {
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: #333;
      }

      .form-control {
        padding: 0.75rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 1rem;
      }

      .form-control:focus {
        outline: none;
        border-color: #4caf50;
      }

      .max-score {
        margin-top: 0.25rem;
        font-size: 0.875rem;
        color: #666;
      }

      .graded-section {
        padding: 1.5rem;
        background: #e8f5e9;
        border-radius: 4px;
        border: 1px solid #c8e6c9;
      }

      .grade-display {
        display: flex;
        gap: 2rem;
        align-items: flex-start;
      }

      .score-badge {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 1rem;
        background: white;
        border-radius: 8px;
        min-width: 100px;
      }

      .score {
        font-size: 2.5rem;
        font-weight: 700;
        color: #2e7d32;
      }

      .max {
        font-size: 1rem;
        color: #666;
      }

      .graded-info {
        flex: 1;
      }

      .graded-info p {
        margin: 0 0 0.5rem 0;
        color: #333;
      }

      .btn {
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 1rem;
        font-weight: 500;
        transition: all 0.2s;
      }

      .btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .btn-primary {
        background: #4caf50;
        color: white;
      }

      .btn-primary:hover:not(:disabled) {
        background: #45a049;
      }

      .btn-secondary {
        background: #6c757d;
        color: white;
      }

      .btn-secondary:hover {
        background: #5a6268;
      }

      @media (max-width: 768px) {
        .grade-container {
          padding: 1rem;
        }

        .header {
          flex-direction: column;
          align-items: flex-start;
          gap: 1rem;
        }

        .submission-header {
          flex-direction: column;
          gap: 1rem;
        }

        .grade-display {
          flex-direction: column;
        }
      }
    `,
  ],
})
export class GradeAssignmentsComponent implements OnInit {
  submissions: Submission[] = [];
  assignments: any[] = [];
  loading = false;
  error = "";
  gradingData: { [key: number]: { score: number | null; feedback: string } } =
    {};
  grading: { [key: number]: boolean } = {};

  constructor(
    private assignmentService: AssignmentService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private uploadService: UploadService,
  ) {}

  ngOnInit() {
    this.loadPendingSubmissions();
  }

  loadPendingSubmissions() {
    this.loading = true;
    this.error = "";

    // Load both ungraded submissions and teacher assignments
    Promise.all([
      this.assignmentService.getUngradedSubmissions().toPromise(),
      this.assignmentService.getTeacherAssignments().toPromise(),
    ])
      .then(([submissions, assignments]) => {
        this.submissions = submissions || [];
        this.assignments = assignments || [];

        // Initialize grading data for each submission
        this.submissions.forEach((submission) => {
          this.gradingData[submission.id] = {
            score: null,
            feedback: "",
          };
        });

        this.loading = false;
      })
      .catch((error) => {
        console.error("Error loading submissions:", error);
        this.error = error.error?.message || "Failed to load submissions";
        this.loading = false;
      });
  }

  gradeSubmission(submissionId: number) {
    const data = this.gradingData[submissionId];
    if (!data.score) {
      this.error = "Please enter a score";
      return;
    }

    this.grading[submissionId] = true;
    this.error = "";

    this.assignmentService
      .gradeSubmission(submissionId, {
        score: data.score,
        feedback: data.feedback || undefined,
      })
      .subscribe({
        next: (updated) => {
          const index = this.submissions.findIndex(
            (s) => s.id === submissionId,
          );
          if (index !== -1) {
            this.submissions[index] = updated;
          }
          this.grading[submissionId] = false;
          delete this.gradingData[submissionId];
        },
        error: (err) => {
          console.error("Error grading submission:", err);
          this.error = err.error?.message || "Failed to grade submission";
          this.grading[submissionId] = false;
        },
      });
  }

  getAssignmentTitle(assignmentId: number): string {
    const assignment = this.assignments.find((a) => a.id === assignmentId);
    return assignment ? assignment.title : `Assignment #${assignmentId}`;
  }

  getMaxScore(assignmentId: number): number {
    const assignment = this.assignments.find((a) => a.id === assignmentId);
    return assignment ? assignment.maxScore : 100;
  }

  getFileName(path: string): string {
    return path.split("/").pop() || path;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  downloadFile(filePath: string) {
    this.uploadService.downloadFile(filePath).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = this.getFileName(filePath);
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error("Error downloading file:", err);
        this.error = "Failed to download file";
      },
    });
  }
}
