import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from "@angular/forms";
import { Router, RouterModule } from "@angular/router";
import { AuthService } from "../../../services/auth.service";

@Component({
  selector: "app-login",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.css"],
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = false;
  error = "";

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {
    this.loginForm = this.fb.group({
      email: ["", [Validators.required, Validators.email]],
      password: ["", [Validators.required, Validators.minLength(6)]],
    });
  }

  get email() {
    return this.loginForm.get("email");
  }

  get password() {
    return this.loginForm.get("password");
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    this.error = "";

    console.log("Attempting login with:", {
      email: this.loginForm.value.email,
    });

    this.authService.login(this.loginForm.value).subscribe({
      next: (response) => {
        this.loading = false;
        console.log("Login successful:", response);
        const user = response.user;

        // Redirect based on role
        switch (user.role) {
          case "ADMIN":
            this.router.navigate(["/admin"]);
            break;
          case "TEACHER":
            this.router.navigate(["/teacher"]);
            break;
          case "STUDENT":
            this.router.navigate(["/student"]);
            break;
          default:
            this.router.navigate(["/"]);
        }
      },
      error: (err) => {
        this.loading = false;
        console.error("Login error:", err);

        // Handle different error scenarios
        if (err.status === 0) {
          this.error =
            "Cannot connect to server. Please ensure the backend is running.";
        } else if (err.status === 401) {
          this.error = "Invalid email or password. Please try again.";
        } else if (err.status === 400) {
          this.error =
            err.error?.message ||
            err.error?.title ||
            "Invalid login data. Please check your inputs.";
        } else if (err.status === 500) {
          this.error = "Server error occurred. Please try again later.";
        } else {
          this.error =
            err.error?.message ||
            err.message ||
            "Login failed. Please try again.";
        }

        console.log("Error details:", {
          status: err.status,
          statusText: err.statusText,
          error: err.error,
          message: err.message,
        });
      },
    });
  }
}
