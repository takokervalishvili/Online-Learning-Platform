import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { BehaviorSubject, Observable, tap } from "rxjs";
import {
  User,
  AuthResponse,
  LoginDto,
  RegisterDto,
} from "../models/user.model";
import { environment } from "../../environments/environment";

@Injectable({
  providedIn: "root",
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;
  private apiUrl = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient) {
    const storedUser = localStorage.getItem("currentUser");
    this.currentUserSubject = new BehaviorSubject<User | null>(
      storedUser ? JSON.parse(storedUser) : null,
    );
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  login(credentials: LoginDto): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap((response) => {
          localStorage.setItem("token", response.token);
          localStorage.setItem("currentUser", JSON.stringify(response.user));
          this.currentUserSubject.next(response.user);
          const storedToken = localStorage.getItem("token");
        }),
      );
  }

  register(data: RegisterDto): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data).pipe(
      tap((response) => {
        localStorage.setItem("token", response.token);
        localStorage.setItem("currentUser", JSON.stringify(response.user));
        this.currentUserSubject.next(response.user);
      }),
    );
  }

  logout(): void {
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    return localStorage.getItem("token");
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}
