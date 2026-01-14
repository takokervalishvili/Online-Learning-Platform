import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../environments/environment";

export interface Enrollment {
  id: number;
  courseId: number;
  studentId: number;
  studentName?: string;
  studentEmail?: string;
  courseName?: string;
  enrolledAt: string;
  isActive: boolean;
  progress: number;
  completedAt?: string;
  course?: EnrolledCourse;
  isCompleted?: boolean;
  completedAssignments?: number;
  pendingAssignments?: number;
  totalLessons?: number;
  totalAssignments?: number;
  nextLesson?: any;
}

export interface EnrolledCourse {
  id: number;
  title: string;
  description: string;
  category: string;
  duration: number;
  price: number;
  imageUrl?: string;
  teacherName: string;
  totalLessons: number;
  totalAssignments: number;
}

export interface EnrollmentDetail {
  id: number;
  studentId: number;
  studentName: string;
  studentEmail: string;
  courseId: number;
  course: {
    id: number;
    title: string;
    description: string;
    category: string;
    duration: number;
    price: number;
    teacherName: string;
    lessonCount: number;
    assignmentCount: number;
  };
  enrolledAt: string;
  isActive: boolean;
  progress: number;
  completedAt?: string;
  lessons: LessonProgress[];
  assignments: AssignmentProgress[];
}

export interface LessonProgress {
  id: number;
  title: string;
  orderIndex: number;
  durationMinutes: number;
  isCompleted: boolean;
}

export interface AssignmentProgress {
  id: number;
  title: string;
  dueDate: string;
  maxGrade: number;
  submission?: any;
  isSubmitted: boolean;
  isGraded: boolean;
}

export interface StudentStats {
  enrolledCourses: number;
  completedCourses: number;
  inProgressCourses: number;
  totalAssignments: number;
  completedAssignments: number;
  pendingAssignments: number;
  averageGrade: number;
  totalLearningHours: number;
}

export interface CourseProgress {
  courseId: number;
  courseName: string;
  progress: number;
  completedLessons: number;
  totalLessons: number;
  completedAssignments: number;
  totalAssignments: number;
  lastAccessedAt: string;
}

@Injectable({
  providedIn: "root",
})
export class StudentService {
  private apiUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  getMyEnrollments(): Observable<Enrollment[]> {
    const url = `${this.apiUrl}/enrollments/my-enrollments`;

    return new Observable((observer) => {
      this.http.get<Enrollment[]>(url).subscribe({
        next: (data) => {
          observer.next(data);
          observer.complete();
        },
        error: (err) => {
          observer.error(err);
        },
      });
    });
  }

  getEnrollment(id: number): Observable<EnrollmentDetail> {
    return this.http.get<EnrollmentDetail>(`${this.apiUrl}/enrollments/${id}`);
  }

  updateProgress(enrollmentId: number, progress: number): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/enrollments/${enrollmentId}/progress`,
      { progress },
    );
  }

  unenrollFromCourse(enrollmentId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/enrollments/${enrollmentId}`);
  }

  reactivateEnrollment(enrollmentId: number): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/enrollments/${enrollmentId}/reactivate`,
      {},
    );
  }

  getAvailableCourses(filters?: {
    searchTerm?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: string;
    sortOrder?: string;
  }): Observable<any> {
    let params = new HttpParams();
    params = params.append("status", "PUBLISHED");
    params = params.append("isApproved", "true");

    if (filters) {
      if (filters.searchTerm)
        params = params.append("searchTerm", filters.searchTerm);
      if (filters.category)
        params = params.append("category", filters.category);
      if (filters.minPrice !== undefined)
        params = params.append("minPrice", filters.minPrice.toString());
      if (filters.maxPrice !== undefined)
        params = params.append("maxPrice", filters.maxPrice.toString());
      if (filters.sortBy) params = params.append("sortBy", filters.sortBy);
      if (filters.sortOrder)
        params = params.append("sortOrder", filters.sortOrder);
    }

    const url = `${this.apiUrl}/courses`;
    return this.http.get<any>(url, { params });
  }

  getMyCourses(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/courses/my-courses`);
  }

  getCourseDetail(courseId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/courses/${courseId}`);
  }

  enrollInCourse(courseId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/courses/${courseId}/enroll`, {});
  }

  getMyAssignments(filters?: {
    courseId?: number;
    status?: "pending" | "submitted" | "graded";
  }): Observable<any[]> {
    let params = new HttpParams();

    if (filters) {
      if (filters.courseId)
        params = params.append("courseId", filters.courseId.toString());
      if (filters.status) params = params.append("status", filters.status);
    }

    return this.http.get<any[]>(`${this.apiUrl}/assignments/student`, {
      params,
    });
  }

  getAssignment(assignmentId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/assignments/${assignmentId}`);
  }

  submitAssignment(
    assignmentId: number,
    submission: {
      content: string;
      attachmentUrl?: string;
    },
  ): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/submissions/assignments/${assignmentId}/submit`,
      submission,
    );
  }

  getMySubmission(assignmentId: number): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/assignments/${assignmentId}/my-submission`,
    );
  }

  updateSubmission(
    submissionId: number,
    submission: {
      content: string;
      attachmentUrl?: string;
    },
  ): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/assignments/submissions/${submissionId}`,
      submission,
    );
  }

  getCourseLessons(courseId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/lessons/course/${courseId}`);
  }

  getLesson(lessonId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/lessons/${lessonId}`);
  }

  markLessonComplete(lessonId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/lessons/${lessonId}/complete`, {});
  }

  getStudentStats(): Observable<StudentStats> {
    return this.http.get<StudentStats>(`${this.apiUrl}/statistics/student`);
  }

  getCourseProgress(): Observable<CourseProgress[]> {
    return this.http.get<CourseProgress[]>(
      `${this.apiUrl}/statistics/student/progress`,
    );
  }

  getMyGrades(filters?: { courseId?: number }): Observable<any[]> {
    let params = new HttpParams();

    if (filters?.courseId) {
      params = params.append("courseId", filters.courseId.toString());
    }

    return this.http.get<any[]>(`${this.apiUrl}/assignments/student/grades`, {
      params,
    });
  }

  calculateCourseCompletion(enrollment: Enrollment): number {
    if (!enrollment.course) return 0;

    const totalLessons = enrollment.course.totalLessons || 0;
    const totalAssignments = enrollment.course.totalAssignments || 0;
    const total = totalLessons + totalAssignments;

    if (total === 0) return 0;

    const completedLessons = enrollment.completedAssignments || 0;
    const completedAssignments = enrollment.completedAssignments || 0;
    const completed = completedLessons + completedAssignments;

    return Math.round((completed / total) * 100);
  }

  isAssignmentOverdue(dueDate: string): boolean {
    return new Date(dueDate) < new Date();
  }

  getTimeRemaining(dueDate: string): string {
    const now = new Date();
    const due = new Date(dueDate);
    const diff = due.getTime() - now.getTime();

    if (diff < 0) return "Overdue";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days} day${days > 1 ? "s" : ""} remaining`;
    if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} remaining`;
    return "Due soon";
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  getGradeLetter(grade: number, maxGrade: number): string {
    const percentage = (grade / maxGrade) * 100;

    if (percentage >= 90) return "A";
    if (percentage >= 80) return "B";
    if (percentage >= 70) return "C";
    if (percentage >= 60) return "D";
    return "F";
  }

  getGradeColorClass(grade: number, maxGrade: number): string {
    const percentage = (grade / maxGrade) * 100;

    if (percentage >= 80) return "grade-excellent";
    if (percentage >= 70) return "grade-good";
    if (percentage >= 60) return "grade-average";
    return "grade-poor";
  }
}
