import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: string;
  avatar?: string;
  createdAt: Date;
}

export interface UpdateUserDto {
  firstName: string;
  lastName: string;
  role: string;
}

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  updateUser(id: number, user: UpdateUserDto): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${id}`, user);
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getUsersByRole(role: string): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/role/${role}`);
  }
}
