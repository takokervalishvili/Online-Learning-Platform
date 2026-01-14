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
  selector: "app-register",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: "./register.component.html",
  styleUrls: ["./register.component.css"],
})
export class RegisterComponent {
  registerForm: FormGroup;
  loading = false;
  error = "";

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {
    this.registerForm = this.fb.group(
      {
        email: ["", [Validators.required, Validators.email]],
        password: ["", [Validators.required, Validators.minLength(6)]],
        confirmPassword: ["", [Validators.required]],
        firstName: ["", [Validators.required]],
        lastName: ["", [Validators.required]],
        role: ["STUDENT", [Validators.required]],
      },
      {
        validators: this.passwordMatchValidator,
      },
    );
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get("password");
    const confirmPassword = form.get("confirmPassword");

    if (
      password &&
      confirmPassword &&
      password.value !== confirmPassword.value
    ) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  get email() {
    return this.registerForm.get("email");
  }

  get password() {
    return this.registerForm.get("password");
  }

  get confirmPassword() {
    return this.registerForm.get("confirmPassword");
  }

  get firstName() {
    return this.registerForm.get("firstName");
  }

  get lastName() {
    return this.registerForm.get("lastName");
  }

  get role() {
    return this.registerForm.get("role");
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      Object.keys(this.registerForm.controls).forEach((key) => {
        this.registerForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.loading = true;
    this.error = "";

    const { confirmPassword, ...registerData } = this.registerForm.value;

    this.authService.register(registerData).subscribe({
      next: (response) => {
        this.loading = false;
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
        console.error("Registration error:", err);

        // Handle different error scenarios
        if (err.status === 0) {
          this.error =
            "Cannot connect to server. Please ensure the backend is running.";
        } else if (err.status === 400) {
          this.error =
            err.error?.message ||
            err.error?.title ||
            "Invalid registration data. Please check your inputs.";
        } else if (err.status === 500) {
          this.error = "Server error occurred. Please try again later.";
        } else {
          this.error =
            err.error?.message ||
            err.message ||
            "Registration failed. Please try again.";
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
