import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Course {
  id: number;
  title: string;
  description: string;
  teacherId: number;
  teacherName?: string;
  category: string;
  duration: number;
  price: number;
  status: string;
  createdAt: Date;
  updatedAt?: Date;
  isApproved: boolean;
  approvedByAdminId?: number;
  approvedAt?: Date;
  enrollmentCount?: number;
}

export interface CreateCourseDto {
  title: string;
  description: string;
  category: string;
  duration: number;
  price: number;
}

export interface UpdateCourseDto {
  title?: string;
  description?: string;
  category?: string;
  duration?: number;
  price?: number;
  status?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CoursesService {
  private apiUrl = `${environment.apiUrl}/courses`;

  constructor(private http: HttpClient) {}

  getAllCourses(): Observable<Course[]> {
    return this.http.get<Course[]>(this.apiUrl);
  }

  getCourseById(id: number): Observable<Course> {
    return this.http.get<Course>(`${this.apiUrl}/${id}`);
  }

  createCourse(course: CreateCourseDto): Observable<Course> {
    return this.http.post<Course>(this.apiUrl, course);
  }

  updateCourse(id: number, course: UpdateCourseDto): Observable<Course> {
    return this.http.put<Course>(`${this.apiUrl}/${id}`, course);
  }

  deleteCourse(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getPendingCourses(): Observable<Course[]> {
    return this.http.get<Course[]>(`${this.apiUrl}/pending`);
  }

  approveCourse(id: number): Observable<Course> {
    return this.http.post<Course>(`${this.apiUrl}/${id}/approve`, {});
  }

  rejectCourse(id: number, reason?: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/reject`, { reason });
  }

  getPublishedCourses(): Observable<Course[]> {
    return this.http.get<Course[]>(`${this.apiUrl}/published`);
  }

  getMyCourses(): Observable<Course[]> {
    return this.http.get<Course[]>(`${this.apiUrl}/my-courses`);
  }
}
