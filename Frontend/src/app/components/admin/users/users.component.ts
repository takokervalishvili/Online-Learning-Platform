import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UsersService, User, UpdateUserDto } from '../../../services/users.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="users-container">
      <nav class="navbar">
        <div class="navbar-brand">
          <button class="btn btn-link" (click)="goBack()">← Back to Dashboard</button>
          <h2>User Management</h2>
        </div>
        <div class="navbar-user">
          <span>{{ currentUser?.fullName }}</span>
          <button class="btn btn-secondary" (click)="logout()">Logout</button>
        </div>
      </nav>

      <div class="users-content">
        <div class="container">
          <div class="users-header">
            <h1>Manage Users</h1>
            <div class="filter-controls">
              <select [(ngModel)]="roleFilter" (change)="filterUsers()" class="form-control">
                <option value="">All Roles</option>
                <option value="ADMIN">Admin</option>
                <option value="TEACHER">Teacher</option>
                <option value="STUDENT">Student</option>
              </select>
              <input
                type="text"
                [(ngModel)]="searchQuery"
                (input)="filterUsers()"
                placeholder="Search by name or email..."
                class="form-control search-input"
              />
            </div>
          </div>

          <div *ngIf="loading" class="loading">
            <div class="spinner"></div>
            <p>Loading users...</p>
          </div>

          <div *ngIf="error" class="alert alert-error">
            {{ error }}
            <button class="btn btn-sm" (click)="loadUsers()">Retry</button>
          </div>

          <div *ngIf="successMessage" class="alert alert-success">
            {{ successMessage }}
          </div>

          <div *ngIf="!loading && !error" class="users-table-container">
            <table class="users-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let user of filteredUsers">
                  <td>{{ user.id }}</td>
                  <td>{{ user.fullName }}</td>
                  <td>{{ user.email }}</td>
                  <td>
                    <span class="badge" [ngClass]="getRoleBadgeClass(user.role)">
                      {{ user.role }}
                    </span>
                  </td>
                  <td>{{ user.createdAt | date: 'short' }}</td>
                  <td>
                    <button
                      class="btn btn-sm btn-primary"
                      (click)="editUser(user)"
                      [disabled]="user.id === currentUser?.id"
                    >
                      Edit
                    </button>
                    <button
                      class="btn btn-sm btn-danger"
                      (click)="deleteUser(user)"
                      [disabled]="user.id === currentUser?.id"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>

            <div *ngIf="filteredUsers.length === 0" class="no-results">
              <p>No users found.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Edit User Modal -->
      <div class="modal" *ngIf="editingUser" (click)="closeModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Edit User</h2>
            <button class="close-btn" (click)="closeModal()">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>First Name</label>
              <input
                type="text"
                [(ngModel)]="editForm.firstName"
                class="form-control"
              />
            </div>
            <div class="form-group">
              <label>Last Name</label>
              <input
                type="text"
                [(ngModel)]="editForm.lastName"
                class="form-control"
              />
            </div>
            <div class="form-group">
              <label>Role</label>
              <select [(ngModel)]="editForm.role" class="form-control">
                <option value="ADMIN">Admin</option>
                <option value="TEACHER">Teacher</option>
                <option value="STUDENT">Student</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeModal()">Cancel</button>
            <button class="btn btn-primary" (click)="saveUser()" [disabled]="saving">
              {{ saving ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Delete Confirmation Modal -->
      <div class="modal" *ngIf="deletingUser" (click)="closeDeleteModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Confirm Delete</h2>
            <button class="close-btn" (click)="closeDeleteModal()">&times;</button>
          </div>
          <div class="modal-body">
            <p>Are you sure you want to delete user <strong>{{ deletingUser.fullName }}</strong>?</p>
            <p class="warning">This action cannot be undone.</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeDeleteModal()">Cancel</button>
            <button class="btn btn-danger" (click)="confirmDelete()" [disabled]="deleting">
              {{ deleting ? 'Deleting...' : 'Delete User' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .users-container {
      min-height: 100vh;
      background-color: #f5f5f5;
    }

    .navbar {
      background: white;
      padding: 1rem 2rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .navbar-brand {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .navbar-brand h2 {
      margin: 0;
      color: #333;
    }

    .navbar-user {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .users-content {
      padding: 2rem 0;
    }

    .users-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .filter-controls {
      display: flex;
      gap: 1rem;
    }

    .search-input {
      min-width: 300px;
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
      border-top: 4px solid #4CAF50;
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
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .alert-error {
      background-color: #fee;
      color: #c33;
      border: 1px solid #fcc;
    }

    .alert-success {
      background-color: #efe;
      color: #3c3;
      border: 1px solid #cfc;
    }

    .users-table-container {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      overflow-x: auto;
    }

    .users-table {
      width: 100%;
      border-collapse: collapse;
    }

    .users-table th,
    .users-table td {
      padding: 1rem;
      text-align: left;
      border-bottom: 1px solid #eee;
    }

    .users-table th {
      background-color: #f8f9fa;
      font-weight: 600;
      color: #333;
    }

    .users-table tbody tr:hover {
      background-color: #f8f9fa;
    }

    .badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.85rem;
      font-weight: 500;
    }

    .badge-admin {
      background-color: #e3f2fd;
      color: #1976d2;
    }

    .badge-teacher {
      background-color: #f3e5f5;
      color: #7b1fa2;
    }

    .badge-student {
      background-color: #e8f5e9;
      color: #388e3c;
    }

    .no-results {
      padding: 3rem;
      text-align: center;
      color: #666;
    }

    .modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: 8px;
      width: 90%;
      max-width: 500px;
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal-header {
      padding: 1.5rem;
      border-bottom: 1px solid #eee;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .modal-header h2 {
      margin: 0;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #666;
    }

    .close-btn:hover {
      color: #333;
    }

    .modal-body {
      padding: 1.5rem;
    }

    .modal-footer {
      padding: 1.5rem;
      border-top: 1px solid #eee;
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
    }

    .form-control {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
    }

    .warning {
      color: #f44336;
      font-weight: 500;
    }

    @media (max-width: 768px) {
      .navbar {
        flex-direction: column;
        gap: 1rem;
      }

      .users-header {
        flex-direction: column;
        align-items: flex-start;
      }

      .filter-controls {
        flex-direction: column;
        width: 100%;
      }

      .search-input {
        min-width: 100%;
      }

      .users-table {
        font-size: 0.9rem;
      }

      .users-table th,
      .users-table td {
        padding: 0.5rem;
      }
    }
  `]
})
export class UsersComponent implements OnInit {
  currentUser: any;
  users: User[] = [];
  filteredUsers: User[] = [];
  loading = false;
  error = '';
  successMessage = '';
  roleFilter = '';
  searchQuery = '';
  editingUser: User | null = null;
  deletingUser: User | null = null;
  saving = false;
  deleting = false;
  editForm: UpdateUserDto = {
    firstName: '',
    lastName: '',
    role: 'STUDENT'
  };

  constructor(
    private usersService: UsersService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.currentUserValue;
    this.loadUsers();
  }

  loadUsers() {
    this.loading = true;
    this.error = '';

    this.usersService.getAllUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.filterUsers();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading users:', err);
        this.loading = false;
        this.error = err.error?.message || 'Failed to load users. Please try again.';
      }
    });
  }

  filterUsers() {
    let filtered = [...this.users];

    // Filter by role
    if (this.roleFilter) {
      filtered = filtered.filter(u => u.role === this.roleFilter);
    }

    // Filter by search query
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(u =>
        u.fullName.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query)
      );
    }

    this.filteredUsers = filtered;
  }

  getRoleBadgeClass(role: string): string {
    return `badge-${role.toLowerCase()}`;
  }

  editUser(user: User) {
    this.editingUser = user;
    this.editForm = {
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    };
  }

  closeModal() {
    this.editingUser = null;
    this.editForm = {
      firstName: '',
      lastName: '',
      role: 'STUDENT'
    };
  }

  saveUser() {
    if (!this.editingUser) return;

    this.saving = true;
    this.error = '';
    this.successMessage = '';

    this.usersService.updateUser(this.editingUser.id, this.editForm).subscribe({
      next: (updatedUser) => {
        // Update user in the list
        const index = this.users.findIndex(u => u.id === updatedUser.id);
        if (index !== -1) {
          this.users[index] = updatedUser;
        }
        this.filterUsers();
        this.successMessage = 'User updated successfully!';
        this.closeModal();
        this.saving = false;

        // Clear success message after 3 seconds
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        console.error('Error updating user:', err);
        this.error = err.error?.message || 'Failed to update user. Please try again.';
        this.saving = false;
      }
    });
  }

  deleteUser(user: User) {
    this.deletingUser = user;
  }

  closeDeleteModal() {
    this.deletingUser = null;
  }

  confirmDelete() {
    if (!this.deletingUser) return;

    this.deleting = true;
    this.error = '';
    this.successMessage = '';

    this.usersService.deleteUser(this.deletingUser.id).subscribe({
      next: () => {
        // Remove user from the list
        this.users = this.users.filter(u => u.id !== this.deletingUser?.id);
        this.filterUsers();
        this.successMessage = 'User deleted successfully!';
        this.closeDeleteModal();
        this.deleting = false;

        // Clear success message after 3 seconds
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        console.error('Error deleting user:', err);
        this.error = err.error?.message || 'Failed to delete user. Please try again.';
        this.deleting = false;
      }
    });
  }

  goBack() {
    this.router.navigate(['/admin']);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
