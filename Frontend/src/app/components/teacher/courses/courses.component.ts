import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { CourseService } from '../../../services/course.service';
import { AuthService } from '../../../services/auth.service';

interface Course {
  id: number;
  title: string;
  description: string;
  category: string;
  duration: number;
  price: number;
  status: string;
  isApproved: boolean;
  createdAt: string;
  enrollmentCount: number;
  lessonCount: number;
  assignmentCount: number;
  averageRating?: number;
}

@Component({
  selector: 'app-teacher-courses',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="courses-container">
      <div class="header">
        <h1>My Courses</h1>
        <button class="btn btn-primary" (click)="createCourse()">
          <span class="icon">➕</span> Create New Course
        </button>
      </div>

      <div class="filters">
        <div class="filter-group">
          <button
            class="filter-btn"
            [class.active]="filter === 'all'"
            (click)="setFilter('all')">
            All ({{ courses.length }})
          </button>
          <button
            class="filter-btn"
            [class.active]="filter === 'published'"
            (click)="setFilter('published')">
            Published ({{ getFilteredCount('PUBLISHED') }})
          </button>
          <button
            class="filter-btn"
            [class.active]="filter === 'draft'"
            (click)="setFilter('draft')">
            Draft ({{ getFilteredCount('DRAFT') }})
          </button>
        </div>
      </div>

      <div *ngIf="loading" class="loading">
        <div class="spinner"></div>
        <p>Loading courses...</p>
      </div>

      <div *ngIf="error" class="alert alert-error">
        {{ error }}
      </div>

      <div *ngIf="!loading && !error && filteredCourses.length === 0" class="empty-state">
        <div class="empty-icon">📚</div>
        <h2>No courses found</h2>
        <p>Create your first course to get started!</p>
        <button class="btn btn-primary" (click)="createCourse()">Create Course</button>
      </div>

      <div class="courses-grid" *ngIf="!loading && !error && filteredCourses.length > 0">
        <div class="course-card card" *ngFor="let course of filteredCourses">
          <div class="course-header">
            <div class="course-status" [class.published]="course.status === 'PUBLISHED'" [class.draft]="course.status === 'DRAFT'">
              {{ course.status }}
            </div>
            <div class="approval-badge" *ngIf="course.isApproved">
              <span class="icon">✅</span> Approved
            </div>
          </div>

          <h3 class="course-title">{{ course.title }}</h3>
          <p class="course-description">{{ course.description }}</p>

          <div class="course-meta">
            <div class="meta-item">
              <span class="icon">👥</span>
              <span>{{ course.enrollmentCount }} Students</span>
            </div>
            <div class="meta-item">
              <span class="icon">📝</span>
              <span>{{ course.lessonCount }} Lessons</span>
            </div>
            <div class="meta-item">
              <span class="icon">📋</span>
              <span>{{ course.assignmentCount }} Assignments</span>
            </div>
            <div class="meta-item" *ngIf="course.averageRating">
              <span class="icon">⭐</span>
              <span>{{ course.averageRating.toFixed(1) }}</span>
            </div>
          </div>

          <div class="course-footer">
            <div class="course-price">\${{ course.price }}</div>
            <div class="course-actions">
              <button class="btn btn-sm btn-secondary" (click)="viewAnalytics(course.id)">
                📊 Analytics
              </button>
              <button class="btn btn-sm btn-primary" (click)="editCourse(course.id)">
                ✏️ Edit
              </button>
              <button class="btn btn-sm btn-danger" (click)="deleteCourse(course.id)">
                🗑️
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .courses-container {
      max-width: 1400px;
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

    .filters {
      margin-bottom: 2rem;
    }

    .filter-group {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .filter-btn {
      padding: 0.5rem 1rem;
      border: 1px solid #ddd;
      background: white;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .filter-btn:hover {
      background: #f5f5f5;
    }

    .filter-btn.active {
      background: #4caf50;
      color: white;
      border-color: #4caf50;
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
      margin-bottom: 2rem;
    }

    .courses-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 1.5rem;
    }

    .course-card {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .course-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .course-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .course-status {
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .course-status.published {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .course-status.draft {
      background: #fff3e0;
      color: #ef6c00;
    }

    .approval-badge {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.75rem;
      color: #2e7d32;
    }

    .course-title {
      margin: 0 0 0.75rem 0;
      color: #333;
      font-size: 1.25rem;
    }

    .course-description {
      color: #666;
      margin: 0 0 1rem 0;
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .course-meta {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
      margin-bottom: 1.5rem;
      padding: 1rem;
      background: #f9f9f9;
      border-radius: 4px;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: #666;
    }

    .meta-item .icon {
      font-size: 1rem;
    }

    .course-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: auto;
      padding-top: 1rem;
      border-top: 1px solid #eee;
    }

    .course-price {
      font-size: 1.5rem;
      font-weight: 700;
      color: #4caf50;
    }

    .course-actions {
      display: flex;
      gap: 0.5rem;
    }

    .btn {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 500;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }

    .btn-sm {
      padding: 0.375rem 0.75rem;
      font-size: 0.8rem;
    }

    .btn-primary {
      background: #4caf50;
      color: white;
    }

    .btn-primary:hover {
      background: #45a049;
    }

    .btn-secondary {
      background: #2196f3;
      color: white;
    }

    .btn-secondary:hover {
      background: #0b7dda;
    }

    .btn-danger {
      background: #f44336;
      color: white;
    }

    .btn-danger:hover {
      background: #da190b;
    }

    .icon {
      display: inline-block;
    }

    @media (max-width: 768px) {
      .courses-container {
        padding: 1rem;
      }

      .header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }

      .courses-grid {
        grid-template-columns: 1fr;
      }

      .course-meta {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class CoursesComponent implements OnInit {
  courses: Course[] = [];
  filteredCourses: Course[] = [];
  filter: 'all' | 'published' | 'draft' = 'all';
  loading = false;
  error = '';

  constructor(
    private courseService: CourseService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadCourses();
  }

  loadCourses() {
    this.loading = true;
    this.error = '';

    this.courseService.getMyCourses().subscribe({
      next: (data: any) => {
        this.courses = data;
        this.applyFilter();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading courses:', err);
        this.loading = false;

        if (err.status === 0) {
          this.error = 'Cannot connect to server. Please check your connection.';
        } else if (err.status === 401) {
          this.error = 'Unauthorized. Please log in again.';
          setTimeout(() => {
            this.authService.logout();
            this.router.navigate(['/login']);
          }, 2000);
        } else {
          this.error = err.error?.message || 'Failed to load courses. Please try again.';
        }
      }
    });
  }

  setFilter(filter: 'all' | 'published' | 'draft') {
    this.filter = filter;
    this.applyFilter();
  }

  applyFilter() {
    if (this.filter === 'all') {
      this.filteredCourses = this.courses;
    } else if (this.filter === 'published') {
      this.filteredCourses = this.courses.filter(c => c.status === 'PUBLISHED');
    } else if (this.filter === 'draft') {
      this.filteredCourses = this.courses.filter(c => c.status === 'DRAFT');
    }
  }

  getFilteredCount(status: string): number {
    return this.courses.filter(c => c.status === status).length;
  }

  createCourse() {
    this.router.navigate(['/teacher/courses/create']);
  }

  editCourse(courseId: number) {
    this.router.navigate(['/teacher/courses', courseId, 'edit']);
  }

  viewAnalytics(courseId: number) {
    this.router.navigate(['/teacher/courses', courseId, 'analytics']);
  }

  deleteCourse(courseId: number) {
    if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      return;
    }

    this.courseService.deleteCourse(courseId).subscribe({
      next: () => {
        this.courses = this.courses.filter(c => c.id !== courseId);
        this.applyFilter();
      },
      error: (err) => {
        console.error('Error deleting course:', err);
        alert(err.error?.message || 'Failed to delete course. Please try again.');
      }
    });
  }
}
