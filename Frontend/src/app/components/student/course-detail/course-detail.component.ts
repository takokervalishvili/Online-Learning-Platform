import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { AuthService } from "../../../services/auth.service";
import { StudentService } from "../../../services/student.service";

@Component({
  selector: "app-course-detail",
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="course-detail-container">
      <nav class="navbar">
        <div class="navbar-brand">
          <button class="btn btn-link" routerLink="/student/my-courses">
            ← Back to My Courses
          </button>
          <h2>Course Details</h2>
        </div>
        <div class="navbar-user">
          <span>{{ currentUser?.fullName }}</span>
          <button class="btn btn-secondary" (click)="logout()">Logout</button>
        </div>
      </nav>

      <div class="course-content">
        <div class="container">
          <div *ngIf="loading" class="loading">
            <div class="spinner"></div>
            <p>Loading course...</p>
          </div>

          <div *ngIf="error" class="alert alert-error">
            {{ error }}
            <button class="btn btn-sm" (click)="loadCourse()">Retry</button>
          </div>

          <div *ngIf="!loading && !error && course">
            <!-- Course Header -->
            <div class="course-header card">
              <div class="header-content">
                <div class="course-info">
                  <h1>{{ course.title }}</h1>
                  <p class="course-category">{{ course.category }}</p>
                  <p class="course-teacher">
                    👨‍🏫 Instructor: {{ course.teacherName }}
                  </p>
                  <p class="course-description">{{ course.description }}</p>

                  <div class="course-meta">
                    <div class="meta-item">
                      <span class="meta-icon">📚</span>
                      <span>{{ course.lessonCount || 0 }} Lessons</span>
                    </div>
                    <div class="meta-item">
                      <span class="meta-icon">📝</span>
                      <span>{{ course.assignmentCount || 0 }} Assignments</span>
                    </div>
                    <div class="meta-item">
                      <span class="meta-icon">⏱️</span>
                      <span>{{ course.duration }} hours</span>
                    </div>
                    <div class="meta-item" *ngIf="course.averageRating">
                      <span class="meta-icon">⭐</span>
                      <span>{{ course.averageRating.toFixed(1) }}/5</span>
                    </div>
                  </div>
                </div>

                <div class="progress-card">
                  <h3>Your Progress</h3>
                  <div class="progress-circle">
                    <svg viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="#e9ecef"
                        stroke-width="10"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="url(#gradient)"
                        stroke-width="10"
                        stroke-linecap="round"
                        [attr.stroke-dasharray]="progressCircumference"
                        [attr.stroke-dashoffset]="progressOffset"
                        transform="rotate(-90 50 50)"
                      />
                      <defs>
                        <linearGradient
                          id="gradient"
                          x1="0%"
                          y1="0%"
                          x2="100%"
                          y2="0%"
                        >
                          <stop offset="0%" stop-color="#667eea" />
                          <stop offset="100%" stop-color="#764ba2" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div class="progress-text">
                      <span class="progress-number"
                        >{{ enrollment?.progress?.toFixed(0) || 0 }}%</span
                      >
                      <span class="progress-label">Complete</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Course Content Tabs -->
            <div class="content-tabs">
              <button
                class="tab"
                [class.active]="activeTab === 'lessons'"
                (click)="activeTab = 'lessons'"
              >
                📚 Lessons ({{ lessons.length }})
              </button>
              <button
                class="tab"
                [class.active]="activeTab === 'assignments'"
                (click)="activeTab = 'assignments'"
              >
                📝 Assignments ({{ assignments.length }})
              </button>
              <button
                class="tab"
                [class.active]="activeTab === 'about'"
                (click)="activeTab = 'about'"
              >
                ℹ️ About
              </button>
            </div>

            <!-- Lessons Tab -->
            <div *ngIf="activeTab === 'lessons'" class="tab-content">
              <div *ngIf="lessons.length === 0" class="empty-state">
                <div class="empty-icon">📚</div>
                <h3>No Lessons Yet</h3>
                <p>
                  The instructor hasn't added any lessons to this course yet.
                </p>
              </div>

              <div *ngIf="lessons.length > 0" class="lessons-list">
                <div
                  class="lesson-item card"
                  *ngFor="let lesson of lessons; let i = index"
                >
                  <div class="lesson-number">{{ i + 1 }}</div>
                  <div class="lesson-content">
                    <h3>{{ lesson.title }}</h3>
                    <p class="lesson-preview" *ngIf="lesson.content">
                      {{ getPreview(lesson.content) }}
                    </p>
                    <div class="lesson-meta">
                      <span *ngIf="lesson.scheduledDate">
                        📅 {{ formatDate(lesson.scheduledDate) }}
                      </span>
                      <span *ngIf="lesson.attachments">
                        📎 Has attachments
                      </span>
                    </div>
                  </div>
                  <div class="lesson-actions">
                    <button
                      class="btn btn-primary"
                      (click)="viewLesson(lesson)"
                    >
                      View Lesson
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Assignments Tab -->
            <div *ngIf="activeTab === 'assignments'" class="tab-content">
              <div *ngIf="assignments.length === 0" class="empty-state">
                <div class="empty-icon">📝</div>
                <h3>No Assignments Yet</h3>
                <p>
                  The instructor hasn't added any assignments to this course
                  yet.
                </p>
              </div>

              <div *ngIf="assignments.length > 0" class="assignments-list">
                <div
                  class="assignment-item card"
                  *ngFor="let assignment of assignments"
                >
                  <div class="assignment-header">
                    <h3>{{ assignment.title }}</h3>
                    <span
                      class="badge"
                      [class.badge-success]="assignment.isGraded"
                      [class.badge-warning]="
                        assignment.isSubmitted && !assignment.isGraded
                      "
                      [class.badge-danger]="
                        !assignment.isSubmitted && isOverdue(assignment.dueDate)
                      "
                      [class.badge-info]="
                        !assignment.isSubmitted &&
                        !isOverdue(assignment.dueDate)
                      "
                    >
                      {{ getAssignmentStatus(assignment) }}
                    </span>
                  </div>
                  <p class="assignment-description">
                    {{ assignment.description }}
                  </p>
                  <div class="assignment-meta">
                    <span
                      class="due-date"
                      [class.overdue]="isOverdue(assignment.dueDate)"
                    >
                      📅 Due: {{ formatDate(assignment.dueDate) }}
                    </span>
                    <span>💯 Max Score: {{ assignment.maxScore }}</span>
                    <span *ngIf="assignment.submission?.score !== undefined">
                      ✅ Your Score: {{ assignment.submission.score }}/{{
                        assignment.maxScore
                      }}
                    </span>
                  </div>
                  <div class="assignment-actions">
                    <button
                      class="btn btn-primary"
                      *ngIf="!assignment.isSubmitted"
                      (click)="submitAssignment(assignment)"
                    >
                      Submit Assignment
                    </button>
                    <button
                      class="btn btn-outline"
                      *ngIf="assignment.isSubmitted"
                      (click)="viewSubmission(assignment)"
                    >
                      View Submission
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- About Tab -->
            <div *ngIf="activeTab === 'about'" class="tab-content">
              <div class="about-section card">
                <h2>About This Course</h2>
                <p>{{ course.description }}</p>

                <h3>Course Information</h3>
                <div class="info-grid">
                  <div class="info-item">
                    <strong>Category:</strong>
                    <span>{{ course.category }}</span>
                  </div>
                  <div class="info-item">
                    <strong>Duration:</strong>
                    <span>{{ course.duration }} hours</span>
                  </div>
                  <div class="info-item">
                    <strong>Instructor:</strong>
                    <span>{{ course.teacherName }}</span>
                  </div>
                  <div class="info-item">
                    <strong>Price:</strong>
                    <span>{{
                      course.price === 0 ? "Free" : "$" + course.price
                    }}</span>
                  </div>
                  <div class="info-item">
                    <strong>Enrolled Students:</strong>
                    <span>{{ course.enrollmentCount || 0 }}</span>
                  </div>
                  <div class="info-item" *ngIf="course.averageRating">
                    <strong>Rating:</strong>
                    <span>⭐ {{ course.averageRating.toFixed(1) }}/5</span>
                  </div>
                </div>

                <h3>Your Enrollment</h3>
                <div class="info-grid">
                  <div class="info-item">
                    <strong>Enrolled On:</strong>
                    <span>{{ formatDate(enrollment?.enrolledAt || "") }}</span>
                  </div>
                  <div class="info-item">
                    <strong>Progress:</strong>
                    <span>{{ enrollment?.progress?.toFixed(0) || 0 }}%</span>
                  </div>
                  <div class="info-item" *ngIf="enrollment?.completedAt">
                    <strong>Completed On:</strong>
                    <span>{{ formatDate(enrollment.completedAt) }}</span>
                  </div>
                </div>

                <div class="actions-section">
                  <button class="btn btn-danger" (click)="unenroll()">
                    Unenroll from Course
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div *ngIf="!loading && !error && !course" class="empty-state">
            <div class="empty-icon">❌</div>
            <h3>Course Not Found</h3>
            <p>This course doesn't exist or you don't have access to it.</p>
            <button class="btn btn-primary" routerLink="/student/courses">
              Browse Courses
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .course-detail-container {
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

      .course-content {
        padding: 2rem 0;
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

      .course-header {
        margin-bottom: 2rem;
        padding: 2rem;
      }

      .header-content {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 2rem;
      }

      .course-info h1 {
        margin: 0 0 0.5rem 0;
        color: #333;
      }

      .course-category {
        display: inline-block;
        background: #e3f2fd;
        color: #1976d2;
        padding: 4px 12px;
        border-radius: 4px;
        font-size: 0.875rem;
        font-weight: 600;
        margin-bottom: 0.5rem;
      }

      .course-teacher {
        color: #666;
        font-size: 1rem;
        margin-bottom: 1rem;
      }

      .course-description {
        color: #666;
        line-height: 1.6;
        margin-bottom: 1.5rem;
      }

      .course-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 1.5rem;
      }

      .meta-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: #666;
        font-size: 0.9rem;
      }

      .meta-icon {
        font-size: 1.2rem;
      }

      .progress-card {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 2rem;
        border-radius: 12px;
        text-align: center;
        min-width: 250px;
      }

      .progress-card h3 {
        margin: 0 0 1rem 0;
        font-size: 1.1rem;
      }

      .progress-circle {
        position: relative;
        width: 150px;
        height: 150px;
        margin: 0 auto;
      }

      .progress-circle svg {
        width: 100%;
        height: 100%;
      }

      .progress-text {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
      }

      .progress-number {
        display: block;
        font-size: 2rem;
        font-weight: 700;
      }

      .progress-label {
        display: block;
        font-size: 0.875rem;
        opacity: 0.9;
      }

      .content-tabs {
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

      .tab-content {
        min-height: 400px;
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

      .lessons-list,
      .assignments-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .lesson-item,
      .assignment-item {
        padding: 1.5rem;
        display: flex;
        gap: 1.5rem;
        align-items: start;
      }

      .lesson-number {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        width: 48px;
        height: 48px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 1.2rem;
        flex-shrink: 0;
      }

      .lesson-content {
        flex: 1;
      }

      .lesson-content h3,
      .assignment-item h3 {
        margin: 0 0 0.5rem 0;
        color: #333;
        font-size: 1.1rem;
      }

      .lesson-preview {
        color: #666;
        font-size: 0.9rem;
        margin-bottom: 0.5rem;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .lesson-meta {
        display: flex;
        gap: 1rem;
        font-size: 0.875rem;
        color: #999;
      }

      .lesson-actions {
        flex-shrink: 0;
      }

      .assignment-item {
        flex-direction: column;
        gap: 1rem;
      }

      .assignment-header {
        display: flex;
        justify-content: space-between;
        align-items: start;
        gap: 1rem;
        width: 100%;
      }

      .badge {
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 600;
        white-space: nowrap;
      }

      .badge-success {
        background-color: #e8f5e9;
        color: #388e3c;
      }

      .badge-warning {
        background-color: #fff3e0;
        color: #f57c00;
      }

      .badge-danger {
        background-color: #ffebee;
        color: #c62828;
      }

      .badge-info {
        background-color: #e3f2fd;
        color: #1976d2;
      }

      .assignment-description {
        color: #666;
        margin: 0;
      }

      .assignment-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 1.5rem;
        font-size: 0.9rem;
        color: #666;
      }

      .due-date.overdue {
        color: #c62828;
        font-weight: 600;
      }

      .assignment-actions {
        display: flex;
        gap: 0.5rem;
      }

      .about-section {
        padding: 2rem;
      }

      .about-section h2 {
        margin: 0 0 1rem 0;
        color: #333;
      }

      .about-section h3 {
        margin: 2rem 0 1rem 0;
        color: #333;
        font-size: 1.1rem;
      }

      .about-section p {
        color: #666;
        line-height: 1.6;
      }

      .info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 1rem;
        margin-bottom: 2rem;
      }

      .info-item {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .info-item strong {
        color: #333;
        font-size: 0.875rem;
      }

      .info-item span {
        color: #666;
        font-size: 1rem;
      }

      .actions-section {
        margin-top: 2rem;
        padding-top: 2rem;
        border-top: 1px solid #eee;
      }

      @media (max-width: 768px) {
        .navbar {
          flex-direction: column;
          gap: 1rem;
          padding: 1rem;
        }

        .header-content {
          grid-template-columns: 1fr;
        }

        .progress-card {
          min-width: 100%;
        }

        .content-tabs {
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

        .lesson-item {
          flex-direction: column;
        }

        .assignment-actions {
          flex-direction: column;
          width: 100%;
        }

        .assignment-actions button {
          width: 100%;
        }
      }
    `,
  ],
})
export class CourseDetailComponent implements OnInit {
  currentUser: any;
  courseId!: number;
  course: any = null;
  enrollment: any = null;
  lessons: any[] = [];
  assignments: any[] = [];
  loading = true;
  error = "";
  activeTab: "lessons" | "assignments" | "about" = "lessons";

  progressCircumference = 2 * Math.PI * 45;
  progressOffset = this.progressCircumference;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private studentService: StudentService,
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.currentUserValue;
    this.route.params.subscribe((params) => {
      this.courseId = +params["id"];
      this.loadCourse();
    });
  }

  loadCourse() {
    this.loading = true;
    this.error = "";

    // Load course details
    this.studentService.getCourseDetail(this.courseId).subscribe({
      next: (data) => {
        console.log("=== COURSE DETAIL DATA RECEIVED ===");
        console.log("Full course data:", data);
        console.log("Course ID:", data.id);
        console.log("Course Title:", data.title);
        console.log("Course Status:", data.status);
        console.log("Is Approved:", data.isApproved);
        console.log("Lessons array:", data.lessons);
        console.log("Lessons count:", data.lessons ? data.lessons.length : 0);
        console.log("Assignments array:", data.assignments);
        console.log(
          "Assignments count:",
          data.assignments ? data.assignments.length : 0,
        );
        console.log("Is Enrolled:", data.isEnrolled);
        console.log("===================================");

        this.course = data;
        this.lessons = data.lessons || [];
        this.assignments = data.assignments || [];

        console.log("Component lessons array:", this.lessons);
        console.log("Component assignments array:", this.assignments);

        // Load enrollment details
        this.loadEnrollment();
      },
      error: (err) => {
        console.error("Error loading course:", err);
        console.error("Error details:", JSON.stringify(err, null, 2));
        this.error = "Failed to load course. Please try again.";
        this.loading = false;
      },
    });
  }

  loadEnrollment() {
    this.studentService.getMyEnrollments().subscribe({
      next: (enrollments) => {
        this.enrollment = enrollments.find((e) => e.courseId === this.courseId);
        this.updateProgressCircle();
        this.loading = false;
      },
      error: (err) => {
        console.error("Error loading enrollment:", err);
        this.loading = false;
      },
    });
  }

  updateProgressCircle() {
    const progress = this.enrollment?.progress || 0;
    this.progressOffset =
      this.progressCircumference -
      (progress / 100) * this.progressCircumference;
  }

  viewLesson(lesson: any) {
    this.router.navigate(
      ["/student/course", this.courseId, "lesson", lesson.id],
      {
        queryParams: { total: this.lessons.length },
      },
    );
  }

  submitAssignment(assignment: any) {
    this.router.navigate([
      "/student/course",
      this.courseId,
      "assignment",
      assignment.id,
    ]);
  }

  viewSubmission(assignment: any) {
    this.router.navigate([
      "/student/course",
      this.courseId,
      "assignment",
      assignment.id,
    ]);
  }

  unenroll() {
    if (
      !confirm(`Are you sure you want to unenroll from "${this.course.title}"?`)
    ) {
      return;
    }

    if (this.enrollment) {
      this.studentService.unenrollFromCourse(this.enrollment.id).subscribe({
        next: () => {
          alert("Successfully unenrolled from course.");
          this.router.navigate(["/student/my-courses"]);
        },
        error: (err) => {
          console.error("Error unenrolling:", err);
          alert("Failed to unenroll. Please try again.");
        },
      });
    }
  }

  getPreview(content: string): string {
    return content.length > 150 ? content.substring(0, 150) + "..." : content;
  }

  formatDate(date: string): string {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  isOverdue(dueDate: string): boolean {
    return new Date(dueDate) < new Date();
  }

  getAssignmentStatus(assignment: any): string {
    if (assignment.isGraded) return "✓ Graded";
    if (assignment.isSubmitted) return "⏳ Submitted";
    if (this.isOverdue(assignment.dueDate)) return "⚠️ Overdue";
    return "📝 Pending";
  }

  logout() {
    this.authService.logout();
    this.router.navigate(["/login"]);
  }
}
