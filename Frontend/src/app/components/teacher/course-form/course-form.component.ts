import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { CourseService } from "../../../services/course.service";
import {
  AssignmentService,
  CreateAssignmentDto,
} from "../../../services/assignment.service";
import {
  LessonService,
  CreateLessonDto,
  UpdateLessonDto,
} from "../../../services/lesson.service";
import {
  UploadService,
  UploadProgress,
} from "../../../services/upload.service";
import { forkJoin, of } from "rxjs";
import { catchError } from "rxjs/operators";

interface Lesson {
  id?: number;
  title: string;
  content: string;
  attachments: string[];
  orderIndex: number;
  scheduledDate?: string;
}

interface Assignment {
  id?: number;
  title: string;
  description: string;
  dueDate: string;
  maxScore: number;
}

@Component({
  selector: "app-course-form",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="course-form-container">
      <div class="header">
        <h1>{{ isEditMode ? "Edit Course" : "Create New Course" }}</h1>
        <button class="btn btn-secondary" (click)="goBack()">← Back</button>
      </div>

      <div *ngIf="error" class="alert alert-error">
        {{ error }}
      </div>

      <div *ngIf="success" class="alert alert-success">
        {{ success }}
      </div>

      <form (ngSubmit)="saveCourse()" #courseForm="ngForm">
        <!-- Course Details Section -->
        <div class="card section">
          <h2>Course Details</h2>

          <div class="form-group">
            <label for="title">Course Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              [(ngModel)]="course.title"
              required
              class="form-control"
              placeholder="e.g., Introduction to Web Development"
            />
          </div>

          <div class="form-group">
            <label for="description">Description *</label>
            <textarea
              id="description"
              name="description"
              [(ngModel)]="course.description"
              required
              rows="5"
              class="form-control"
              placeholder="Describe what students will learn in this course..."
            ></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="category">Category *</label>
              <select
                id="category"
                name="category"
                [(ngModel)]="course.category"
                required
                class="form-control"
              >
                <option value="">Select a category</option>
                <option value="Programming">Programming</option>
                <option value="Web Development">Web Development</option>
                <option value="Mobile Development">Mobile Development</option>
                <option value="Data Science">Data Science</option>
                <option value="Design">Design</option>
                <option value="Business">Business</option>
                <option value="Marketing">Marketing</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div class="form-group">
              <label for="duration">Duration (hours) *</label>
              <input
                type="number"
                id="duration"
                name="duration"
                [(ngModel)]="course.duration"
                required
                min="1"
                class="form-control"
                placeholder="e.g., 40"
              />
            </div>

            <div class="form-group">
              <label for="price">Price ($) *</label>
              <input
                type="number"
                id="price"
                name="price"
                [(ngModel)]="course.price"
                required
                min="0"
                step="0.01"
                class="form-control"
                placeholder="e.g., 99.99"
              />
            </div>
          </div>

          <div class="form-group" *ngIf="isEditMode">
            <label for="status">Status</label>
            <select
              id="status"
              name="status"
              [(ngModel)]="course.status"
              class="form-control"
            >
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
            </select>
          </div>
        </div>

        <!-- Lessons Section -->
        <div class="card section">
          <div class="section-header">
            <h2>Lessons</h2>
            <button type="button" class="btn btn-primary" (click)="addLesson()">
              ➕ Add Lesson
            </button>
          </div>

          <div *ngIf="lessons.length === 0" class="empty-state">
            <p>
              No lessons added yet. Click "Add Lesson" to create your first
              lesson.
            </p>
          </div>

          <div class="lessons-list" *ngIf="lessons.length > 0">
            <div
              class="lesson-item card-inner"
              *ngFor="let lesson of lessons; let i = index"
            >
              <div class="lesson-header">
                <h3>Lesson {{ i + 1 }}</h3>
                <button
                  type="button"
                  class="btn-icon btn-danger"
                  (click)="removeLesson(i)"
                >
                  🗑️
                </button>
              </div>

              <div class="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  [(ngModel)]="lesson.title"
                  [name]="'lessonTitle' + i"
                  required
                  class="form-control"
                  placeholder="Lesson title"
                />
              </div>

              <div class="form-group">
                <label>Content *</label>
                <textarea
                  [(ngModel)]="lesson.content"
                  [name]="'lessonContent' + i"
                  required
                  rows="4"
                  class="form-control"
                  placeholder="Lesson content, instructions, or description..."
                ></textarea>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Order</label>
                  <input
                    type="number"
                    [(ngModel)]="lesson.orderIndex"
                    [name]="'lessonOrder' + i"
                    min="1"
                    class="form-control"
                  />
                </div>

                <div class="form-group">
                  <label>Scheduled Date</label>
                  <input
                    type="datetime-local"
                    [(ngModel)]="lesson.scheduledDate"
                    [name]="'lessonDate' + i"
                    class="form-control"
                  />
                </div>
              </div>

              <div class="form-group">
                <label>Attachments</label>
                <div class="upload-section">
                  <input
                    type="file"
                    (change)="uploadLessonFile($event, i)"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4,.avi,.mov,.wmv"
                    class="file-input"
                  />
                  <div
                    *ngIf="
                      uploadProgress[i] &&
                      uploadProgress[i] > 0 &&
                      uploadProgress[i] < 100
                    "
                    class="progress-bar"
                  >
                    <div
                      class="progress-fill"
                      [style.width.%]="uploadProgress[i]"
                    ></div>
                    <span class="progress-text">{{ uploadProgress[i] }}%</span>
                  </div>
                </div>
                <div
                  class="attachments-list"
                  *ngIf="lesson.attachments.length > 0"
                >
                  <div
                    class="attachment-item"
                    *ngFor="let attachment of lesson.attachments; let j = index"
                  >
                    <span>📎 {{ getFileName(attachment) }}</span>
                    <button
                      type="button"
                      class="btn-icon btn-sm"
                      (click)="removeAttachment(i, j)"
                    >
                      ✖
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Assignments Section -->
        <div class="card section">
          <div class="section-header">
            <h2>Assignments</h2>
            <button
              type="button"
              class="btn btn-primary"
              (click)="addAssignment()"
            >
              ➕ Add Assignment
            </button>
          </div>

          <div *ngIf="assignments.length === 0" class="empty-state">
            <p>
              No assignments added yet. Click "Add Assignment" to create your
              first assignment.
            </p>
          </div>

          <div class="assignments-list" *ngIf="assignments.length > 0">
            <div
              class="assignment-item card-inner"
              *ngFor="let assignment of assignments; let i = index"
            >
              <div class="assignment-header">
                <h3>Assignment {{ i + 1 }}</h3>
                <button
                  type="button"
                  class="btn-icon btn-danger"
                  (click)="removeAssignment(i)"
                >
                  🗑️
                </button>
              </div>

              <div class="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  [(ngModel)]="assignment.title"
                  [name]="'assignmentTitle' + i"
                  required
                  class="form-control"
                  placeholder="Assignment title"
                />
              </div>

              <div class="form-group">
                <label>Description *</label>
                <textarea
                  [(ngModel)]="assignment.description"
                  [name]="'assignmentDescription' + i"
                  required
                  rows="4"
                  class="form-control"
                  placeholder="Assignment instructions and requirements..."
                ></textarea>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Due Date *</label>
                  <input
                    type="datetime-local"
                    [(ngModel)]="assignment.dueDate"
                    [name]="'assignmentDueDate' + i"
                    required
                    class="form-control"
                  />
                </div>

                <div class="form-group">
                  <label>Max Score *</label>
                  <input
                    type="number"
                    [(ngModel)]="assignment.maxScore"
                    [name]="'assignmentMaxScore' + i"
                    required
                    min="1"
                    class="form-control"
                    placeholder="e.g., 100"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Form Actions -->
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" (click)="goBack()">
            Cancel
          </button>
          <button
            type="submit"
            class="btn btn-primary"
            [disabled]="!courseForm.form.valid || saving"
          >
            {{
              saving
                ? "Saving..."
                : isEditMode
                  ? "Update Course"
                  : "Create Course"
            }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [
    `
      .course-form-container {
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

      .alert-success {
        background-color: #efe;
        color: #3c3;
        border: 1px solid #cfc;
      }

      .section {
        margin-bottom: 2rem;
        padding: 2rem;
      }

      .section h2 {
        margin: 0 0 1.5rem 0;
        color: #333;
        font-size: 1.5rem;
      }

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
      }

      .section-header h2 {
        margin: 0;
      }

      .form-group {
        margin-bottom: 1.5rem;
      }

      .form-group label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: #333;
      }

      .form-control {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 1rem;
        transition: border-color 0.2s;
      }

      .form-control:focus {
        outline: none;
        border-color: #4caf50;
      }

      .form-row {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
      }

      .empty-state {
        text-align: center;
        padding: 2rem;
        color: #999;
        background: #f9f9f9;
        border-radius: 4px;
      }

      .lessons-list,
      .assignments-list {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }

      .lesson-item,
      .assignment-item {
        padding: 1.5rem;
        background: #f9f9f9;
        border: 1px solid #eee;
      }

      .lesson-header,
      .assignment-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid #ddd;
      }

      .lesson-header h3,
      .assignment-header h3 {
        margin: 0;
        color: #333;
        font-size: 1.125rem;
      }

      .upload-section {
        margin-bottom: 0.5rem;
      }

      .file-input {
        display: block;
        width: 100%;
        padding: 0.5rem;
        border: 1px dashed #ddd;
        border-radius: 4px;
        cursor: pointer;
      }

      .progress-bar {
        position: relative;
        height: 30px;
        background: #f0f0f0;
        border-radius: 4px;
        overflow: hidden;
        margin-top: 0.5rem;
      }

      .progress-fill {
        height: 100%;
        background: #4caf50;
        transition: width 0.3s;
      }

      .progress-text {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-weight: 600;
        color: #333;
      }

      .attachments-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin-top: 0.5rem;
      }

      .attachment-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem;
        background: white;
        border: 1px solid #ddd;
        border-radius: 4px;
      }

      .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        padding-top: 2rem;
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

      .btn-danger {
        background: #f44336;
        color: white;
      }

      .btn-danger:hover {
        background: #da190b;
      }

      .btn-icon {
        padding: 0.5rem;
        background: none;
        border: none;
        cursor: pointer;
        font-size: 1.25rem;
        transition: transform 0.2s;
      }

      .btn-icon:hover {
        transform: scale(1.1);
      }

      .btn-sm {
        font-size: 0.875rem;
        padding: 0.25rem;
      }

      @media (max-width: 768px) {
        .course-form-container {
          padding: 1rem;
        }

        .header {
          flex-direction: column;
          align-items: flex-start;
          gap: 1rem;
        }

        .section {
          padding: 1rem;
        }

        .form-row {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class CourseFormComponent implements OnInit {
  courseId?: number;
  isEditMode = false;
  saving = false;
  error = "";
  success = "";

  course = {
    title: "",
    description: "",
    category: "",
    duration: 0,
    price: 0,
    status: "DRAFT",
  };

  lessons: Lesson[] = [];
  assignments: Assignment[] = [];
  uploadProgress: { [key: number]: number } = {};

  originalLessonIds: number[] = [];
  originalAssignmentIds: number[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private courseService: CourseService,
    private assignmentService: AssignmentService,
    private lessonService: LessonService,
    private uploadService: UploadService,
  ) {}

  ngOnInit() {
    this.route.params.subscribe((params) => {
      if (params["id"]) {
        this.courseId = +params["id"];
        this.isEditMode = true;
        this.loadCourse();
      }
    });
  }

  loadCourse() {
    if (!this.courseId) return;

    this.courseService.getCourse(this.courseId).subscribe({
      next: (data: any) => {
        this.course = {
          title: data.title,
          description: data.description,
          category: data.category,
          duration: data.duration,
          price: data.price,
          status: data.status,
        };
        this.lessons = data.lessons || [];
        this.assignments = data.assignments || [];

        // Store original IDs for deletion tracking
        this.originalLessonIds = this.lessons
          .filter((l) => l.id)
          .map((l) => l.id!);
        this.originalAssignmentIds = this.assignments
          .filter((a) => a.id)
          .map((a) => a.id!);
      },
      error: (err) => {
        console.error("Error loading course:", err);
        this.error = err.error?.message || "Failed to load course";
      },
    });
  }

  addLesson() {
    this.lessons.push({
      title: "",
      content: "",
      attachments: [],
      orderIndex: this.lessons.length + 1,
    });
  }

  removeLesson(index: number) {
    if (confirm("Are you sure you want to remove this lesson?")) {
      this.lessons.splice(index, 1);
      // Reorder remaining lessons
      this.lessons.forEach((lesson, i) => {
        lesson.orderIndex = i + 1;
      });
    }
  }

  addAssignment() {
    this.assignments.push({
      title: "",
      description: "",
      dueDate: "",
      maxScore: 100,
    });
  }

  removeAssignment(index: number) {
    if (confirm("Are you sure you want to remove this assignment?")) {
      this.assignments.splice(index, 1);
    }
  }

  uploadLessonFile(event: any, lessonIndex: number) {
    const file = event.target.files[0];
    if (!file) return;

    const isVideo = file.type.startsWith("video/");
    const uploadObservable = isVideo
      ? this.uploadService.uploadVideo(file)
      : this.uploadService.uploadDocument(file);

    this.uploadProgress[lessonIndex] = 0;

    uploadObservable.subscribe({
      next: (progress: UploadProgress) => {
        this.uploadProgress[lessonIndex] = progress.progress;
        if (progress.file) {
          this.lessons[lessonIndex].attachments.push(progress.file.filePath);
          setTimeout(() => {
            delete this.uploadProgress[lessonIndex];
          }, 1000);
        }
      },
      error: (err) => {
        console.error("Upload error:", err);
        this.error = "Failed to upload file";
        delete this.uploadProgress[lessonIndex];
      },
    });
  }

  removeAttachment(lessonIndex: number, attachmentIndex: number) {
    this.lessons[lessonIndex].attachments.splice(attachmentIndex, 1);
  }

  getFileName(path: string): string {
    return path.split("/").pop() || path;
  }

  saveCourse() {
    this.saving = true;
    this.error = "";
    this.success = "";

    const courseData = { ...this.course };

    const saveObservable = this.isEditMode
      ? this.courseService.updateCourse(this.courseId!, courseData)
      : this.courseService.createCourse(courseData);

    saveObservable.subscribe({
      next: (course: any) => {
        const savedCourseId = this.courseId || course.id;

        if (this.lessons.length > 0 || this.assignments.length > 0) {
          this.saveLessonsAndAssignments(savedCourseId);
        } else {
          this.success = `Course ${this.isEditMode ? "updated" : "created"} successfully!`;
          this.saving = false;
          setTimeout(() => {
            this.router.navigate(["/teacher/courses"]);
          }, 2000);
        }
      },
      error: (err) => {
        console.error("Error saving course:", err);
        this.error = err.error?.message || "Failed to save course";
        this.saving = false;
      },
    });
  }

  saveLessonsAndAssignments(courseId: number) {
    const requests: any[] = [];

    const currentLessonIds = this.lessons.filter((l) => l.id).map((l) => l.id!);
    const deletedLessonIds = this.originalLessonIds.filter(
      (id) => !currentLessonIds.includes(id),
    );

    const currentAssignmentIds = this.assignments
      .filter((a) => a.id)
      .map((a) => a.id!);
    const deletedAssignmentIds = this.originalAssignmentIds.filter(
      (id) => !currentAssignmentIds.includes(id),
    );

    deletedLessonIds.forEach((lessonId) => {
      requests.push(
        this.lessonService.deleteLesson(courseId, lessonId).pipe(
          catchError((err) => {
            console.error("Error deleting lesson:", err);
            return of(null);
          }),
        ),
      );
    });

    deletedAssignmentIds.forEach((assignmentId) => {
      requests.push(
        this.assignmentService.deleteAssignment(courseId, assignmentId).pipe(
          catchError((err) => {
            console.error("Error deleting assignment:", err);
            return of(null);
          }),
        ),
      );
    });

    this.lessons.forEach((lesson, index) => {
      if (lesson.id) {
        const updateData: UpdateLessonDto = {
          title: lesson.title,
          content: lesson.content,
          attachments: lesson.attachments,
          orderIndex: index + 1,
          scheduledDate: lesson.scheduledDate,
        };
        requests.push(
          this.lessonService.updateLesson(courseId, lesson.id, updateData).pipe(
            catchError((err) => {
              console.error("Error updating lesson:", err);
              return of(null);
            }),
          ),
        );
      } else {
        const createData: CreateLessonDto = {
          title: lesson.title,
          content: lesson.content,
          attachments: lesson.attachments,
          orderIndex: index + 1,
          scheduledDate: lesson.scheduledDate,
        };
        requests.push(
          this.lessonService.createLesson(courseId, createData).pipe(
            catchError((err) => {
              console.error("Error creating lesson:", err);
              return of(null);
            }),
          ),
        );
      }
    });

    this.assignments.forEach((assignment) => {
      const assignmentData: CreateAssignmentDto = {
        title: assignment.title,
        description: assignment.description,
        dueDate: assignment.dueDate,
        maxScore: assignment.maxScore,
      };

      if (assignment.id) {
        requests.push(
          this.assignmentService
            .updateAssignment(courseId, assignment.id, assignmentData)
            .pipe(
              catchError((err) => {
                console.error("Error updating assignment:", err);
                return of(null);
              }),
            ),
        );
      } else {
        requests.push(
          this.assignmentService
            .createAssignment(courseId, assignmentData)
            .pipe(
              catchError((err) => {
                console.error("Error creating assignment:", err);
                return of(null);
              }),
            ),
        );
      }
    });

    if (requests.length > 0) {
      forkJoin(requests).subscribe({
        next: (results) => {
          const failures = results.filter((r) => r === null).length;
          if (failures > 0) {
            this.error = `Course saved, but ${failures} lesson(s)/assignment(s) failed to save. Please try editing them again.`;
            this.saving = false;
          } else {
            this.success = `Course ${this.isEditMode ? "updated" : "created"} successfully with ${this.lessons.length} lesson(s) and ${this.assignments.length} assignment(s)!`;
            this.saving = false;
            setTimeout(() => {
              this.router.navigate(["/teacher/courses"]);
            }, 2000);
          }
        },
        error: (err) => {
          console.error("Error saving lessons/assignments:", err);
          this.error =
            "Course saved, but some lessons/assignments failed to save. Please try editing them again.";
          this.saving = false;
        },
      });
    } else {
      this.success = `Course ${this.isEditMode ? "updated" : "created"} successfully!`;
      this.saving = false;
      setTimeout(() => {
        this.router.navigate(["/teacher/courses"]);
      }, 2000);
    }
  }

  goBack() {
    this.router.navigate(["/teacher/courses"]);
  }
}
