import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../environments/environment";

export interface Assignment {
  id: number;
  courseId: number;
  title: string;
  description: string;
  dueDate: string;
  maxScore: number;
  createdAt: string;
  updatedAt?: string;
  totalSubmissions: number;
  hasSubmitted: boolean;
}

export interface AssignmentDetail {
  id: number;
  courseId: number;
  courseTitle: string;
  title: string;
  description: string;
  dueDate: string;
  maxScore: number;
  createdAt: string;
  updatedAt?: string;
  submissions: Submission[];
  mySubmission?: Submission;
}

export interface Submission {
  id: number;
  assignmentId: number;
  studentId: number;
  studentName: string;
  content: string;
  attachments: string[];
  score?: number;
  feedback?: string;
  submittedAt: string;
  gradedAt?: string;
  gradedByTeacherId?: number;
  gradedByTeacherName?: string;
}

export interface CreateAssignmentDto {
  title: string;
  description: string;
  dueDate: string;
  maxScore: number;
}

export interface CreateSubmissionDto {
  content: string;
  attachments?: string[];
}

export interface GradeSubmissionDto {
  score: number;
  feedback?: string;
}

@Injectable({
  providedIn: "root",
})
export class AssignmentService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getAssignments(courseId: number): Observable<Assignment[]> {
    return this.http.get<Assignment[]>(
      `${this.apiUrl}/courses/${courseId}/assignments`,
    );
  }

  getAssignment(
    courseId: number,
    assignmentId: number,
  ): Observable<AssignmentDetail> {
    return this.http.get<AssignmentDetail>(
      `${this.apiUrl}/courses/${courseId}/assignments/${assignmentId}`,
    );
  }

  createAssignment(
    courseId: number,
    assignment: CreateAssignmentDto,
  ): Observable<Assignment> {
    return this.http.post<Assignment>(
      `${this.apiUrl}/courses/${courseId}/assignments`,
      assignment,
    );
  }

  updateAssignment(
    courseId: number,
    assignmentId: number,
    assignment: CreateAssignmentDto,
  ): Observable<Assignment> {
    return this.http.put<Assignment>(
      `${this.apiUrl}/courses/${courseId}/assignments/${assignmentId}`,
      assignment,
    );
  }

  deleteAssignment(courseId: number, assignmentId: number): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/courses/${courseId}/assignments/${assignmentId}`,
    );
  }

  submitAssignment(
    assignmentId: number,
    submission: CreateSubmissionDto,
  ): Observable<Submission> {
    return this.http.post<Submission>(
      `${this.apiUrl}/submissions/assignments/${assignmentId}/submit`,
      submission,
    );
  }

  gradeSubmission(
    submissionId: number,
    grade: GradeSubmissionDto,
  ): Observable<Submission> {
    return this.http.put<Submission>(
      `${this.apiUrl}/submissions/${submissionId}/grade`,
      grade,
    );
  }

  getAssignmentSubmissions(assignmentId: number): Observable<Submission[]> {
    return this.http.get<Submission[]>(
      `${this.apiUrl}/submissions/assignments/${assignmentId}`,
    );
  }

  getUngradedSubmissions(): Observable<Submission[]> {
    return this.http.get<Submission[]>(`${this.apiUrl}/submissions/ungraded`);
  }

  getTeacherAssignments(): Observable<Assignment[]> {
    return this.http.get<Assignment[]>(
      `${this.apiUrl}/submissions/teacher/assignments`,
    );
  }
}
