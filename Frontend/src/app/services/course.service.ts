import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Course, CourseDetail } from '../models/course.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CourseService {
  private apiUrl = `${environment.apiUrl}/courses`;

  constructor(private http: HttpClient) {}

  getCourses(filters?: any): Observable<any> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params = params.append(key, filters[key]);
        }
      });
    }
    return this.http.get<any>(this.apiUrl, { params });
  }

  getCourse(id: number): Observable<CourseDetail> {
    return this.http.get<CourseDetail>(`${this.apiUrl}/${id}`);
  }

  createCourse(course: any): Observable<Course> {
    return this.http.post<Course>(this.apiUrl, course);
  }

  updateCourse(id: number, course: any): Observable<Course> {
    return this.http.put<Course>(`${this.apiUrl}/${id}`, course);
  }

  deleteCourse(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  enrollInCourse(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/enroll`, {});
  }

  getMyCourses(): Observable<Course[]> {
    return this.http.get<Course[]>(`${this.apiUrl}/my-courses`);
  }
}
