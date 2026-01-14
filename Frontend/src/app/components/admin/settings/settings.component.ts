import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="settings-container">
      <nav class="navbar">
        <div class="navbar-brand">
          <button class="btn btn-link" (click)="goBack()">← Back to Dashboard</button>
          <h2>System Settings</h2>
        </div>
        <div class="navbar-user">
          <span>{{ currentUser?.fullName }}</span>
          <button class="btn btn-secondary" (click)="logout()">Logout</button>
        </div>
      </nav>

      <div class="settings-content">
        <div class="container">
          <div class="settings-header">
            <h1>System Settings</h1>
            <p class="subtitle">Configure platform settings and preferences</p>
          </div>

          <div *ngIf="successMessage" class="alert alert-success">
            {{ successMessage }}
          </div>

          <div *ngIf="error" class="alert alert-error">
            {{ error }}
          </div>

          <div class="settings-sections">
            <!-- General Settings -->
            <div class="settings-card card">
              <div class="card-header">
                <h3>General Settings</h3>
              </div>
              <div class="card-body">
                <div class="form-group">
                  <label>Platform Name</label>
                  <input
                    type="text"
                    [(ngModel)]="settings.platformName"
                    class="form-control"
                    placeholder="Learning Platform"
                  />
                </div>
                <div class="form-group">
                  <label>Contact Email</label>
                  <input
                    type="email"
                    [(ngModel)]="settings.contactEmail"
                    class="form-control"
                    placeholder="admin@platform.com"
                  />
                </div>
                <div class="form-group">
                  <label>Support URL</label>
                  <input
                    type="url"
                    [(ngModel)]="settings.supportUrl"
                    class="form-control"
                    placeholder="https://support.platform.com"
                  />
                </div>
              </div>
            </div>

            <!-- Course Settings -->
            <div class="settings-card card">
              <div class="card-header">
                <h3>Course Settings</h3>
              </div>
              <div class="card-body">
                <div class="form-group">
                  <label>
                    <input
                      type="checkbox"
                      [(ngModel)]="settings.requireCourseApproval"
                    />
                    Require admin approval for new courses
                  </label>
                </div>
                <div class="form-group">
                  <label>
                    <input
                      type="checkbox"
                      [(ngModel)]="settings.allowStudentReviews"
                    />
                    Allow students to leave reviews
                  </label>
                </div>
                <div class="form-group">
                  <label>Maximum Course Price ($)</label>
                  <input
                    type="number"
                    [(ngModel)]="settings.maxCoursePrice"
                    class="form-control"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>

            <!-- Email Settings -->
            <div class="settings-card card">
              <div class="card-header">
                <h3>Email Notifications</h3>
              </div>
              <div class="card-body">
                <div class="form-group">
                  <label>
                    <input
                      type="checkbox"
                      [(ngModel)]="settings.sendWelcomeEmails"
                    />
                    Send welcome emails to new users
                  </label>
                </div>
                <div class="form-group">
                  <label>
                    <input
                      type="checkbox"
                      [(ngModel)]="settings.sendCourseApprovalEmails"
                    />
                    Notify teachers when courses are approved
                  </label>
                </div>
                <div class="form-group">
                  <label>
                    <input
                      type="checkbox"
                      [(ngModel)]="settings.sendEnrollmentEmails"
                    />
                    Notify students upon enrollment
                  </label>
                </div>
              </div>
            </div>

            <!-- File Upload Settings -->
            <div class="settings-card card">
              <div class="card-header">
                <h3>File Upload Settings</h3>
              </div>
              <div class="card-body">
                <div class="form-group">
                  <label>Maximum File Size (MB)</label>
                  <input
                    type="number"
                    [(ngModel)]="settings.maxFileSize"
                    class="form-control"
                    min="1"
                    max="500"
                  />
                </div>
                <div class="form-group">
                  <label>Allowed File Types</label>
                  <input
                    type="text"
                    [(ngModel)]="settings.allowedFileTypes"
                    class="form-control"
                    placeholder=".pdf, .doc, .docx, .jpg, .png"
                  />
                  <small class="form-text">Comma-separated list of file extensions</small>
                </div>
              </div>
            </div>

            <!-- Security Settings -->
            <div class="settings-card card">
              <div class="card-header">
                <h3>Security Settings</h3>
              </div>
              <div class="card-body">
                <div class="form-group">
                  <label>Session Timeout (minutes)</label>
                  <input
                    type="number"
                    [(ngModel)]="settings.sessionTimeout"
                    class="form-control"
                    min="5"
                    max="1440"
                  />
                </div>
                <div class="form-group">
                  <label>Minimum Password Length</label>
                  <input
                    type="number"
                    [(ngModel)]="settings.minPasswordLength"
                    class="form-control"
                    min="6"
                    max="20"
                  />
                </div>
                <div class="form-group">
                  <label>
                    <input
                      type="checkbox"
                      [(ngModel)]="settings.requirePasswordComplexity"
                    />
                    Require password complexity (uppercase, lowercase, numbers)
                  </label>
                </div>
              </div>
            </div>

            <!-- Maintenance Mode -->
            <div class="settings-card card">
              <div class="card-header">
                <h3>Maintenance Mode</h3>
              </div>
              <div class="card-body">
                <div class="form-group">
                  <label>
                    <input
                      type="checkbox"
                      [(ngModel)]="settings.maintenanceMode"
                    />
                    Enable maintenance mode
                  </label>
                  <small class="form-text">When enabled, only admins can access the platform</small>
                </div>
                <div class="form-group" *ngIf="settings.maintenanceMode">
                  <label>Maintenance Message</label>
                  <textarea
                    [(ngModel)]="settings.maintenanceMessage"
                    class="form-control"
                    rows="3"
                    placeholder="The platform is currently undergoing maintenance..."
                  ></textarea>
                </div>
              </div>
            </div>
          </div>

          <div class="settings-actions">
            <button
              class="btn btn-secondary"
              (click)="resetToDefaults()"
              [disabled]="saving"
            >
              Reset to Defaults
            </button>
            <button
              class="btn btn-primary"
              (click)="saveSettings()"
              [disabled]="saving"
            >
              <span *ngIf="!saving">Save Settings</span>
              <span *ngIf="saving">
                <span class="spinner"></span> Saving...
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .settings-container {
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

    .settings-content {
      padding: 2rem 0;
    }

    .settings-header {
      margin-bottom: 2rem;
    }

    .settings-header h1 {
      margin: 0 0 0.5rem 0;
    }

    .subtitle {
      color: #666;
      font-size: 1.1rem;
      margin: 0;
    }

    .alert {
      padding: 1rem;
      border-radius: 4px;
      margin-bottom: 1rem;
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

    .settings-sections {
      display: grid;
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .settings-card {
      background: white;
      border-radius: 8px;
      overflow: hidden;
    }

    .card-header {
      background-color: #f8f9fa;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #dee2e6;
    }

    .card-header h3 {
      margin: 0;
      font-size: 1.1rem;
      color: #333;
    }

    .card-body {
      padding: 1.5rem;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-group:last-child {
      margin-bottom: 0;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: #333;
    }

    .form-group label input[type="checkbox"] {
      margin-right: 0.5rem;
      cursor: pointer;
    }

    .form-control {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
      font-family: inherit;
    }

    .form-control:focus {
      outline: none;
      border-color: #4CAF50;
      box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.1);
    }

    .form-text {
      display: block;
      margin-top: 0.25rem;
      font-size: 0.875rem;
      color: #666;
    }

    textarea.form-control {
      resize: vertical;
      min-height: 100px;
    }

    .settings-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      padding: 1.5rem;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .spinner {
      display: inline-block;
      width: 1rem;
      height: 1rem;
      border: 2px solid #fff;
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @media (max-width: 768px) {
      .navbar {
        flex-direction: column;
        gap: 1rem;
      }

      .settings-actions {
        flex-direction: column;
      }

      .settings-actions button {
        width: 100%;
      }
    }
  `]
})
export class SettingsComponent implements OnInit {
  currentUser: any;
  saving = false;
  error = '';
  successMessage = '';

  settings = {
    // General
    platformName: 'Learning Platform',
    contactEmail: 'admin@learningplatform.com',
    supportUrl: 'https://support.learningplatform.com',

    // Courses
    requireCourseApproval: true,
    allowStudentReviews: true,
    maxCoursePrice: 9999.99,

    // Email
    sendWelcomeEmails: true,
    sendCourseApprovalEmails: true,
    sendEnrollmentEmails: true,

    // File Upload
    maxFileSize: 50,
    allowedFileTypes: '.pdf, .doc, .docx, .ppt, .pptx, .xls, .xlsx, .jpg, .jpeg, .png, .gif, .mp4',

    // Security
    sessionTimeout: 60,
    minPasswordLength: 6,
    requirePasswordComplexity: true,

    // Maintenance
    maintenanceMode: false,
    maintenanceMessage: 'The platform is currently undergoing maintenance. Please check back later.'
  };

  defaultSettings = { ...this.settings };

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.currentUserValue;
    this.loadSettings();
  }

  loadSettings() {
    // Load settings from localStorage or API
    const savedSettings = localStorage.getItem('platformSettings');
    if (savedSettings) {
      try {
        this.settings = JSON.parse(savedSettings);
      } catch (e) {
        console.error('Error loading settings:', e);
      }
    }
  }

  saveSettings() {
    this.saving = true;
    this.error = '';
    this.successMessage = '';

    try {
      // Save to localStorage (in production, this would be an API call)
      localStorage.setItem('platformSettings', JSON.stringify(this.settings));

      this.successMessage = 'Settings saved successfully!';
      this.saving = false;

      // Clear success message after 3 seconds
      setTimeout(() => this.successMessage = '', 3000);
    } catch (e) {
      this.error = 'Failed to save settings. Please try again.';
      this.saving = false;
    }
  }

  resetToDefaults() {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      this.settings = { ...this.defaultSettings };
      this.successMessage = 'Settings reset to defaults. Click Save to apply.';
      setTimeout(() => this.successMessage = '', 3000);
    }
  }

  goBack() {
    this.router.navigate(['/admin']);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
