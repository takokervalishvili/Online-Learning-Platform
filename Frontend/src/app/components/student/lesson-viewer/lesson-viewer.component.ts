import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { LessonService, Lesson } from '../../../services/lesson.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-lesson-viewer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="lesson-viewer-container">
      <nav class="navbar">
        <div class="navbar-brand">
          <button class="btn btn-link" (click)="goBack()">
            ← Back to Course
          </button>
          <h2>Lesson Viewer</h2>
        </div>
        <div class="navbar-user">
          <span>{{ currentUser?.fullName }}</span>
          <button class="btn btn-secondary" (click)="logout()">Logout</button>
        </div>
      </nav>

      <div class="lesson-content">
        <div class="container">
          <div *ngIf="loading" class="loading">
            <div class="spinner"></div>
            <p>Loading lesson...</p>
          </div>

          <div *ngIf="error" class="alert alert-error">
            {{ error }}
            <button class="btn btn-sm" (click)="loadLesson()">Retry</button>
          </div>

          <div *ngIf="!loading && !error && lesson" class="lesson-card card">
            <!-- Lesson Header -->
            <div class="lesson-header">
              <h1>{{ lesson.title }}</h1>
              <div class="lesson-meta">
                <span *ngIf="lesson.scheduledDate">
                  📅 {{ formatDate(lesson.scheduledDate) }}
                </span>
                <span>📚 Lesson {{ lesson.orderIndex }}</span>
              </div>
            </div>

            <!-- Lesson Content -->
            <div class="lesson-body">
              <div class="content-section">
                <h3>Content</h3>
                <div class="lesson-text" [innerHTML]="formatContent(lesson.content)"></div>
              </div>

              <!-- Attachments -->
              <div class="attachments-section" *ngIf="lesson.attachments && lesson.attachments.length > 0">
                <h3>📎 Attachments ({{ lesson.attachments.length }})</h3>
                <div class="attachments-list">
                  <div class="attachment-item" *ngFor="let attachment of lesson.attachments; let i = index">
                    <div class="attachment-icon">📄</div>
                    <div class="attachment-info">
                      <span class="attachment-name">{{ getAttachmentName(attachment, i) }}</span>
                      <span class="attachment-type">{{ getAttachmentType(attachment) }}</span>
                    </div>
                    <a [href]="attachment" target="_blank" class="btn btn-sm btn-outline" download>
                      Download
                    </a>
                  </div>
                </div>
              </div>

              <!-- Navigation -->
              <div class="lesson-navigation">
                <button
                  class="btn btn-outline"
                  *ngIf="hasPreviousLesson()"
                  (click)="navigateToLesson(lesson.orderIndex - 1)"
                >
                  ← Previous Lesson
                </button>
                <button
                  class="btn btn-primary"
                  *ngIf="hasNextLesson()"
                  (click)="navigateToLesson(lesson.orderIndex + 1)"
                >
                  Next Lesson →
                </button>
                <button
                  class="btn btn-outline"
                  *ngIf="!hasNextLesson()"
                  (click)="goBack()"
                >
                  Back to Course
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .lesson-viewer-container {
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

    .lesson-content {
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
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
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

    .card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .lesson-card {
      margin-bottom: 2rem;
    }

    .lesson-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 2rem;
    }

    .lesson-header h1 {
      margin: 0 0 1rem 0;
      font-size: 2rem;
    }

    .lesson-meta {
      display: flex;
      gap: 1.5rem;
      font-size: 0.95rem;
      opacity: 0.95;
    }

    .lesson-body {
      padding: 2rem;
    }

    .content-section {
      margin-bottom: 2rem;
    }

    .content-section h3 {
      color: #667eea;
      margin-bottom: 1rem;
      font-size: 1.3rem;
    }

    .lesson-text {
      line-height: 1.8;
      color: #333;
      font-size: 1.05rem;
    }

    .lesson-text ::ng-deep p {
      margin-bottom: 1rem;
    }

    .lesson-text ::ng-deep h1,
    .lesson-text ::ng-deep h2,
    .lesson-text ::ng-deep h3 {
      color: #667eea;
      margin-top: 1.5rem;
      margin-bottom: 0.75rem;
    }

    .lesson-text ::ng-deep ul,
    .lesson-text ::ng-deep ol {
      margin-left: 1.5rem;
      margin-bottom: 1rem;
    }

    .lesson-text ::ng-deep code {
      background: #f5f5f5;
      padding: 0.2rem 0.4rem;
      border-radius: 4px;
      font-family: monospace;
    }

    .lesson-text ::ng-deep pre {
      background: #f5f5f5;
      padding: 1rem;
      border-radius: 8px;
      overflow-x: auto;
      margin-bottom: 1rem;
    }

    .attachments-section {
      margin-top: 2rem;
      padding-top: 2rem;
      border-top: 1px solid #e0e0e0;
    }

    .attachments-section h3 {
      color: #667eea;
      margin-bottom: 1rem;
      font-size: 1.2rem;
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
      transition: all 0.2s ease;
    }

    .attachment-item:hover {
      background: #e9ecef;
      transform: translateX(5px);
    }

    .attachment-icon {
      font-size: 2rem;
      flex-shrink: 0;
    }

    .attachment-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .attachment-name {
      font-weight: 500;
      color: #333;
    }

    .attachment-type {
      font-size: 0.85rem;
      color: #666;
      text-transform: uppercase;
    }

    .lesson-navigation {
      margin-top: 2rem;
      padding-top: 2rem;
      border-top: 1px solid #e0e0e0;
      display: flex;
      justify-content: space-between;
      gap: 1rem;
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

    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }

    .btn-outline {
      background: white;
      color: #667eea;
      border: 2px solid #667eea;
    }

    .btn-outline:hover {
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

      .lesson-content {
        padding: 1rem;
      }

      .lesson-header {
        padding: 1.5rem;
      }

      .lesson-header h1 {
        font-size: 1.5rem;
      }

      .lesson-body {
        padding: 1.5rem;
      }

      .lesson-navigation {
        flex-direction: column;
      }

      .attachment-item {
        flex-direction: column;
        text-align: center;
      }
    }
  `]
})
export class LessonViewerComponent implements OnInit {
  currentUser: any;
  courseId!: number;
  lessonId!: number;
  lesson: Lesson | null = null;
  loading = true;
  error = '';
  totalLessons = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private lessonService: LessonService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.currentUserValue;

    this.route.params.subscribe(params => {
      this.courseId = +params['courseId'];
      this.lessonId = +params['lessonId'];
      this.loadLesson();
    });

    // Get total lessons count from query params if available
    this.route.queryParams.subscribe(params => {
      if (params['total']) {
        this.totalLessons = +params['total'];
      }
    });
  }

  loadLesson() {
    this.loading = true;
    this.error = '';

    this.lessonService.getLesson(this.courseId, this.lessonId).subscribe({
      next: (lesson) => {
        this.lesson = lesson;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading lesson:', err);
        this.error = 'Failed to load lesson. Please try again.';
        this.loading = false;
      }
    });
  }

  formatContent(content: string): string {
    // Simple formatting - convert line breaks to paragraphs
    return content
      .split('\n\n')
      .map(para => `<p>${para.replace(/\n/g, '<br>')}</p>`)
      .join('');
  }

  formatDate(date: string): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getAttachmentName(url: string, index: number): string {
    try {
      const parts = url.split('/');
      const filename = parts[parts.length - 1];
      return decodeURIComponent(filename) || `Attachment ${index + 1}`;
    } catch {
      return `Attachment ${index + 1}`;
    }
  }

  getAttachmentType(url: string): string {
    const extension = url.split('.').pop()?.toLowerCase() || '';
    const typeMap: { [key: string]: string } = {
      'pdf': 'PDF Document',
      'doc': 'Word Document',
      'docx': 'Word Document',
      'xls': 'Excel Spreadsheet',
      'xlsx': 'Excel Spreadsheet',
      'ppt': 'PowerPoint',
      'pptx': 'PowerPoint',
      'zip': 'Archive',
      'rar': 'Archive',
      'jpg': 'Image',
      'jpeg': 'Image',
      'png': 'Image',
      'gif': 'Image',
      'mp4': 'Video',
      'mp3': 'Audio',
      'txt': 'Text File'
    };
    return typeMap[extension] || 'File';
  }

  hasPreviousLesson(): boolean {
    return this.lesson ? this.lesson.orderIndex > 1 : false;
  }

  hasNextLesson(): boolean {
    if (!this.lesson) return false;
    if (this.totalLessons > 0) {
      return this.lesson.orderIndex < this.totalLessons;
    }
    return false;
  }

  navigateToLesson(orderIndex: number) {
    this.router.navigate(['/student/course', this.courseId]);
  }

  goBack() {
    this.router.navigate(['/student/course', this.courseId]);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
