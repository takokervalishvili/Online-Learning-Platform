import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../environments/environment";

export interface DashboardStats {
  totalUsers: number;
  totalStudents: number;
  totalTeachers: number;
  totalCourses: number;
  publishedCourses: number;
  pendingApprovalCourses: number;
  totalEnrollments: number;
  activeEnrollments: number;
  totalAssignments: number;
  totalSubmissions: number;
  gradedSubmissions: number;
  totalRevenue: number;
  monthlyRevenue: number;
}

export interface TeacherStats {
  totalCourses: number;
  publishedCourses: number;
  draftCourses: number;
  totalEnrollments: number;
  totalStudents: number;
  totalLessons: number;
  totalAssignments: number;
  pendingSubmissions: number;
  pendingGrading: number;
  averageRating: number;
  totalRevenue: number;
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

@Injectable({
  providedIn: "root",
})
export class StatisticsService {
  private apiUrl = `${environment.apiUrl}/statistics`;

  constructor(private http: HttpClient) {}

  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/dashboard`);
  }

  getTeacherStats(): Observable<TeacherStats> {
    return this.http.get<TeacherStats>(`${this.apiUrl}/teacher`);
  }

  getStudentStats(): Observable<StudentStats> {
    return this.http.get<StudentStats>(`${this.apiUrl}/student`);
  }
}
