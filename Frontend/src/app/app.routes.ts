import { Routes } from "@angular/router";
import { AuthGuard } from "./guards/auth.guard";

export const routes: Routes = [
  {
    path: "",
    redirectTo: "/login",
    pathMatch: "full",
  },
  {
    path: "login",
    loadComponent: () =>
      import("./components/auth/login/login.component").then(
        (m) => m.LoginComponent,
      ),
  },
  {
    path: "register",
    loadComponent: () =>
      import("./components/auth/register/register.component").then(
        (m) => m.RegisterComponent,
      ),
  },
  {
    path: "admin",
    canActivate: [AuthGuard],
    loadComponent: () =>
      import("./components/admin/dashboard/dashboard.component").then(
        (m) => m.DashboardComponent,
      ),
    data: { roles: ["ADMIN"] },
  },
  {
    path: "admin/users",
    canActivate: [AuthGuard],
    loadComponent: () =>
      import("./components/admin/users/users.component").then(
        (m) => m.UsersComponent,
      ),
    data: { roles: ["ADMIN"] },
  },
  {
    path: "admin/courses/pending",
    canActivate: [AuthGuard],
    loadComponent: () =>
      import("./components/admin/courses/pending-courses.component").then(
        (m) => m.PendingCoursesComponent,
      ),
    data: { roles: ["ADMIN"] },
  },
  {
    path: "admin/settings",
    canActivate: [AuthGuard],
    loadComponent: () =>
      import("./components/admin/settings/settings.component").then(
        (m) => m.SettingsComponent,
      ),
    data: { roles: ["ADMIN"] },
  },
  {
    path: "admin/reports",
    canActivate: [AuthGuard],
    loadComponent: () =>
      import("./components/admin/reports/reports.component").then(
        (m) => m.ReportsComponent,
      ),
    data: { roles: ["ADMIN"] },
  },
  {
    path: "teacher",
    canActivate: [AuthGuard],
    loadComponent: () =>
      import("./components/teacher/dashboard/dashboard.component").then(
        (m) => m.DashboardComponent,
      ),
    data: { roles: ["TEACHER"] },
  },
  {
    path: "teacher/courses",
    canActivate: [AuthGuard],
    loadComponent: () =>
      import("./components/teacher/courses/courses.component").then(
        (m) => m.CoursesComponent,
      ),
    data: { roles: ["TEACHER"] },
  },
  {
    path: "teacher/courses/create",
    canActivate: [AuthGuard],
    loadComponent: () =>
      import("./components/teacher/course-form/course-form.component").then(
        (m) => m.CourseFormComponent,
      ),
    data: { roles: ["TEACHER"] },
  },
  {
    path: "teacher/courses/:id/edit",
    canActivate: [AuthGuard],
    loadComponent: () =>
      import("./components/teacher/course-form/course-form.component").then(
        (m) => m.CourseFormComponent,
      ),
    data: { roles: ["TEACHER"] },
  },
  {
    path: "teacher/courses/:id/analytics",
    canActivate: [AuthGuard],
    loadComponent: () =>
      import(
        "./components/teacher/course-analytics/course-analytics.component"
      ).then((m) => m.CourseAnalyticsComponent),
    data: { roles: ["TEACHER"] },
  },
  {
    path: "teacher/grade-assignments",
    canActivate: [AuthGuard],
    loadComponent: () =>
      import(
        "./components/teacher/grade-assignments/grade-assignments.component"
      ).then((m) => m.GradeAssignmentsComponent),
    data: { roles: ["TEACHER"] },
  },
  {
    path: "student",
    canActivate: [AuthGuard],
    loadComponent: () =>
      import("./components/student/dashboard/dashboard.component").then(
        (m) => m.DashboardComponent,
      ),
    data: { roles: ["STUDENT"] },
  },
  {
    path: "student/courses",
    canActivate: [AuthGuard],
    loadComponent: () =>
      import("./components/student/courses/courses.component").then(
        (m) => m.CoursesComponent,
      ),
    data: { roles: ["STUDENT"] },
  },
  {
    path: "student/my-courses",
    canActivate: [AuthGuard],
    loadComponent: () =>
      import("./components/student/my-courses/my-courses.component").then(
        (m) => m.MyCoursesComponent,
      ),
    data: { roles: ["STUDENT"] },
  },
  {
    path: "student/course/:id",
    canActivate: [AuthGuard],
    loadComponent: () =>
      import("./components/student/course-detail/course-detail.component").then(
        (m) => m.CourseDetailComponent,
      ),
    data: { roles: ["STUDENT"] },
  },
  {
    path: "student/course/:courseId/lesson/:lessonId",
    canActivate: [AuthGuard],
    loadComponent: () =>
      import("./components/student/lesson-viewer/lesson-viewer.component").then(
        (m) => m.LessonViewerComponent,
      ),
    data: { roles: ["STUDENT"] },
  },
  {
    path: "student/course/:courseId/assignment/:assignmentId",
    canActivate: [AuthGuard],
    loadComponent: () =>
      import(
        "./components/student/assignment-submit/assignment-submit.component"
      ).then((m) => m.AssignmentSubmitComponent),
    data: { roles: ["STUDENT"] },
  },
  {
    path: "student/assignments",
    canActivate: [AuthGuard],
    loadComponent: () =>
      import("./components/student/dashboard/dashboard.component").then(
        (m) => m.DashboardComponent,
      ),
    data: { roles: ["STUDENT"] },
  },
  {
    path: "student/assignment/:id",
    canActivate: [AuthGuard],
    loadComponent: () =>
      import("./components/student/dashboard/dashboard.component").then(
        (m) => m.DashboardComponent,
      ),
    data: { roles: ["STUDENT"] },
  },
  {
    path: "student/progress",
    canActivate: [AuthGuard],
    loadComponent: () =>
      import("./components/student/dashboard/dashboard.component").then(
        (m) => m.DashboardComponent,
      ),
    data: { roles: ["STUDENT"] },
  },
  {
    path: "**",
    redirectTo: "/login",
  },
];
