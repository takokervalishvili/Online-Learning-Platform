import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Lesson {
  id: number;
  courseId: number;
  title: string;
  content: string;
  attachments: string[];
  orderIndex: number;
  createdAt: string;
  updatedAt?: string;
  scheduledDate?: string;
}

export interface CreateLessonDto {
  title: string;
  content: string;
  attachments?: string[];
  orderIndex: number;
  scheduledDate?: string;
}

export interface UpdateLessonDto {
  title?: string;
  content?: string;
  attachments?: string[];
  orderIndex?: number;
  scheduledDate?: string;
}

@Injectable({
  providedIn: 'root'
})
export class LessonService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getLessons(courseId: number): Observable<Lesson[]> {
    return this.http.get<Lesson[]>(`${this.apiUrl}/courses/${courseId}/lessons`);
  }

  getLesson(courseId: number, lessonId: number): Observable<Lesson> {
    return this.http.get<Lesson>(`${this.apiUrl}/courses/${courseId}/lessons/${lessonId}`);
  }

  createLesson(courseId: number, lesson: CreateLessonDto): Observable<Lesson> {
    return this.http.post<Lesson>(`${this.apiUrl}/courses/${courseId}/lessons`, lesson);
  }

  updateLesson(courseId: number, lessonId: number, lesson: UpdateLessonDto): Observable<Lesson> {
    return this.http.put<Lesson>(`${this.apiUrl}/courses/${courseId}/lessons/${lessonId}`, lesson);
  }

  deleteLesson(courseId: number, lessonId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/courses/${courseId}/lessons/${lessonId}`);
  }

  reorderLessons(courseId: number, lessonIds: number[]): Observable<any> {
    return this.http.put(`${this.apiUrl}/courses/${courseId}/lessons/reorder`, { lessonIds });
  }
}
