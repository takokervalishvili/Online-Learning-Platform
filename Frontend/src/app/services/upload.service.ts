import { Injectable } from "@angular/core";
import { HttpClient, HttpEvent, HttpEventType } from "@angular/common/http";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { environment } from "../../environments/environment";

export interface UploadResult {
  fileName: string;
  filePath: string;
  fileSize: number;
  fileType: string;
  uploadedAt: string;
}

export interface UploadProgress {
  progress: number;
  file?: UploadResult;
}

@Injectable({
  providedIn: "root",
})
export class UploadService {
  private apiUrl = `${environment.apiUrl}/upload`;

  constructor(private http: HttpClient) {}

  uploadVideo(file: File): Observable<UploadProgress> {
    const formData = new FormData();
    formData.append("file", file);

    return this.http
      .post<UploadResult>(`${this.apiUrl}/video`, formData, {
        reportProgress: true,
        observe: "events",
      })
      .pipe(
        map((event: HttpEvent<any>) => {
          switch (event.type) {
            case HttpEventType.UploadProgress:
              const progress = event.total
                ? Math.round((100 * event.loaded) / event.total)
                : 0;
              return { progress };
            case HttpEventType.Response:
              return { progress: 100, file: event.body };
            default:
              return { progress: 0 };
          }
        }),
      );
  }

  uploadDocument(file: File): Observable<UploadProgress> {
    const formData = new FormData();
    formData.append("file", file);

    return this.http
      .post<UploadResult>(`${this.apiUrl}/document`, formData, {
        reportProgress: true,
        observe: "events",
      })
      .pipe(
        map((event: HttpEvent<any>) => {
          switch (event.type) {
            case HttpEventType.UploadProgress:
              const progress = event.total
                ? Math.round((100 * event.loaded) / event.total)
                : 0;
              return { progress };
            case HttpEventType.Response:
              return { progress: 100, file: event.body };
            default:
              return { progress: 0 };
          }
        }),
      );
  }

  uploadAttachment(file: File): Observable<UploadProgress> {
    const formData = new FormData();
    formData.append("file", file);

    return this.http
      .post<UploadResult>(`${this.apiUrl}/attachment`, formData, {
        reportProgress: true,
        observe: "events",
      })
      .pipe(
        map((event: HttpEvent<any>) => {
          switch (event.type) {
            case HttpEventType.UploadProgress:
              const progress = event.total
                ? Math.round((100 * event.loaded) / event.total)
                : 0;
              return { progress };
            case HttpEventType.Response:
              return { progress: 100, file: event.body };
            default:
              return { progress: 0 };
          }
        }),
      );
  }

  deleteFile(filePath: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}`, {
      params: { filePath },
    });
  }

  getUploadedFiles(type?: string): Observable<any> {
    const params = type ? { type: type } : undefined;
    return this.http.get(`${this.apiUrl}/files`, { params });
  }

  downloadFile(filePath: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/download`, {
      params: { filePath },
      responseType: "blob",
    });
  }

  getFileUrl(filePath: string): string {
    return `${environment.apiUrl}${filePath}`;
  }
}
