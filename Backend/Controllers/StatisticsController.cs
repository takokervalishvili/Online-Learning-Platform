using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.DTOs;
using Backend.Models;
using System.Security.Claims;

namespace Backend.Controllers
{
    [Route("api/statistics")]
    [ApiController]
    [Authorize]
    public class StatisticsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<StatisticsController> _logger;

        public StatisticsController(ApplicationDbContext context, ILogger<StatisticsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        private int GetCurrentUserId()
        {
            return int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        }

        private UserRole GetCurrentUserRole()
        {
            var roleString = User.FindFirst(ClaimTypes.Role)?.Value ?? "";
            return Enum.TryParse<UserRole>(roleString, out var role) ? role : UserRole.STUDENT;
        }

        [Authorize(Roles = "ADMIN")]
        [HttpGet("dashboard")]
        public async Task<ActionResult<DashboardStatsDto>> GetDashboardStats()
        {
            try
            {
                var totalUsers = await _context.Users.CountAsync();
                var totalStudents = await _context.Users.CountAsync(u => u.Role == UserRole.STUDENT);
                var totalTeachers = await _context.Users.CountAsync(u => u.Role == UserRole.TEACHER);
                var totalCourses = await _context.Courses.CountAsync();
                var publishedCourses = await _context.Courses.CountAsync(c => c.Status == CourseStatus.PUBLISHED);
                var pendingApprovalCourses = await _context.Courses.CountAsync(c => c.Status == CourseStatus.PUBLISHED && !c.IsApproved);
                var totalEnrollments = await _context.Enrollments.CountAsync();
                var activeEnrollments = await _context.Enrollments.CountAsync(e => e.IsActive);
                var totalAssignments = await _context.Assignments.CountAsync();
                var totalSubmissions = await _context.Submissions.CountAsync();
                var gradedSubmissions = await _context.Submissions.CountAsync(s => s.Score.HasValue);

                 var enrollments = await _context.Enrollments
                    .Include(e => e.Course)
                    .Where(e => e.IsActive)
                    .ToListAsync();

                var totalRevenue = enrollments.Sum(e => e.Course.Price);

                var currentMonth = DateTime.UtcNow.Month;
                var currentYear = DateTime.UtcNow.Year;
                var monthlyRevenue = enrollments
                    .Where(e => e.EnrolledAt.Month == currentMonth && e.EnrolledAt.Year == currentYear)
                    .Sum(e => e.Course.Price);

                var stats = new DashboardStatsDto
                {
                    TotalUsers = totalUsers,
                    TotalStudents = totalStudents,
                    TotalTeachers = totalTeachers,
                    TotalCourses = totalCourses,
                    PublishedCourses = publishedCourses,
                    PendingApprovalCourses = pendingApprovalCourses,
                    TotalEnrollments = totalEnrollments,
                    ActiveEnrollments = activeEnrollments,
                    TotalAssignments = totalAssignments,
                    TotalSubmissions = totalSubmissions,
                    GradedSubmissions = gradedSubmissions,
                    TotalRevenue = totalRevenue,
                    MonthlyRevenue = monthlyRevenue
                };

                return Ok(stats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting dashboard statistics");
                return StatusCode(500, new { message = "An error occurred while retrieving statistics" });
            }
        }

        [Authorize(Roles = "TEACHER")]
        [HttpGet("teacher")]
        public async Task<ActionResult<TeacherStatsDto>> GetTeacherStats()
        {
            try
            {
                var userId = GetCurrentUserId();

                var totalCourses = await _context.Courses.CountAsync(c => c.TeacherId == userId);
                var publishedCourses = await _context.Courses.CountAsync(c => c.TeacherId == userId && c.Status == CourseStatus.PUBLISHED);
                var draftCourses = await _context.Courses.CountAsync(c => c.TeacherId == userId && c.Status == CourseStatus.DRAFT);

                var totalStudents = await _context.Enrollments
                    .Include(e => e.Course)
                    .Where(e => e.Course.TeacherId == userId && e.IsActive)
                    .Select(e => e.StudentId)
                    .Distinct()
                    .CountAsync();

                var totalLessons = await _context.Lessons
                    .Include(l => l.Course)
                    .CountAsync(l => l.Course.TeacherId == userId);

                var totalAssignments = await _context.Assignments
                    .Include(a => a.Course)
                    .CountAsync(a => a.Course.TeacherId == userId);

                var pendingGrading = await _context.Submissions
                    .Include(s => s.Assignment)
                        .ThenInclude(a => a.Course)
                    .CountAsync(s => s.Assignment.Course.TeacherId == userId && !s.Score.HasValue);

                var upcomingConsultations = await _context.Consultations
                    .CountAsync(c => c.TeacherId == userId && c.ScheduledAt > DateTime.UtcNow && !c.IsCancelled && !c.IsCompleted);

                double? averageRating = null;

                var coursesData = await _context.Courses
                    .Include(c => c.Enrollments)
                    .Where(c => c.TeacherId == userId)
                    .ToListAsync();

                var topCourses = coursesData
                    .OrderByDescending(c => c.Enrollments.Count(e => e.IsActive))
                    .Take(5)
                    .Select(c => new CourseStatsDto
                    {
                        CourseId = c.Id,
                        CourseTitle = c.Title,
                        EnrolledStudents = c.Enrollments.Count(e => e.IsActive),
                        CompletedStudents = c.Enrollments.Count(e => e.CompletedAt.HasValue),
                        AverageRating = null,
                        AverageProgress = c.Enrollments.Any() ? (double)c.Enrollments.Average(e => e.Progress) : 0,
                        Revenue = c.Enrollments.Count(e => e.IsActive) * c.Price
                    })
                    .ToList();

                var stats = new TeacherStatsDto
                {
                    TotalCourses = totalCourses,
                    PublishedCourses = publishedCourses,
                    DraftCourses = draftCourses,
                    TotalStudents = totalStudents,
                    TotalLessons = totalLessons,
                    TotalAssignments = totalAssignments,
                    PendingGrading = pendingGrading,
                    UpcomingConsultations = upcomingConsultations,
                    AverageRating = averageRating,
                    TopCourses = topCourses
                };

                return Ok(stats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting teacher statistics");
                return StatusCode(500, new { message = "An error occurred while retrieving statistics" });
            }
        }

        [Authorize(Roles = "STUDENT")]
        [HttpGet("student")]
        public async Task<ActionResult<StudentStatsDto>> GetStudentStats()
        {
            try
            {
                var userId = GetCurrentUserId();

                var enrolledCourses = await _context.Enrollments.CountAsync(e => e.StudentId == userId && e.IsActive);
                var completedCourses = await _context.Enrollments.CountAsync(e => e.StudentId == userId && e.CompletedAt.HasValue);
                var inProgressCourses = enrolledCourses - completedCourses;

                var totalAssignments = await _context.Assignments
                    .Include(a => a.Course)
                        .ThenInclude(c => c.Enrollments)
                    .CountAsync(a => a.Course.Enrollments.Any(e => e.StudentId == userId && e.IsActive));

                var completedAssignments = await _context.Submissions
                    .CountAsync(s => s.StudentId == userId && s.Score.HasValue);

                var pendingAssignments = totalAssignments - completedAssignments;

                var averageScore = await _context.Submissions
                    .Where(s => s.StudentId == userId && s.Score.HasValue)
                    .AverageAsync(s => (double?)s.Score);

                var studentEnrollments = await _context.Enrollments
                    .Include(e => e.Course)
                    .Where(e => e.StudentId == userId && e.IsActive)
                    .ToListAsync();

                var totalSpent = studentEnrollments.Sum(e => e.Course.Price);

                var courseProgress = studentEnrollments
                    .Select(e => new CourseProgressDto
                    {
                        CourseId = e.CourseId,
                        CourseTitle = e.Course.Title,
                        Category = e.Course.Category,
                        Progress = e.Progress,
                        EnrolledAt = e.EnrolledAt,
                        CompletedAssignments = _context.Submissions
                            .Count(s => s.StudentId == userId && s.Assignment.CourseId == e.CourseId && s.Score.HasValue),
                        TotalAssignments = _context.Assignments
                            .Count(a => a.CourseId == e.CourseId),
                        AverageScore = _context.Submissions
                            .Where(s => s.StudentId == userId && s.Assignment.CourseId == e.CourseId && s.Score.HasValue)
                            .Average(s => (double?)s.Score)
                    })
                    .ToList();

                var stats = new StudentStatsDto
                {
                    EnrolledCourses = enrolledCourses,
                    CompletedCourses = completedCourses,
                    InProgressCourses = inProgressCourses,
                    TotalAssignments = totalAssignments,
                    CompletedAssignments = completedAssignments,
                    PendingAssignments = pendingAssignments,
                    AverageScore = averageScore,
                    TotalSpent = totalSpent,
                    CourseProgress = courseProgress
                };

                return Ok(stats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting student statistics");
                return StatusCode(500, new { message = "An error occurred while retrieving statistics" });
            }
        }

        [Authorize(Roles = "ADMIN")]
        [HttpGet("financial-report")]
        public async Task<ActionResult<FinancialReportDto>> GetFinancialReport([FromQuery] int? year)
        {
            try
            {
                var targetYear = year ?? DateTime.UtcNow.Year;

                var allEnrollments = await _context.Enrollments
                    .Include(e => e.Course)
                    .Where(e => e.IsActive)
                    .ToListAsync();

                var totalRevenue = allEnrollments.Sum(e => e.Course.Price);

                var currentMonth = DateTime.UtcNow.Month;
                var currentYear = DateTime.UtcNow.Year;

                var monthlyRevenue = allEnrollments
                    .Where(e => e.EnrolledAt.Month == currentMonth && e.EnrolledAt.Year == currentYear)
                    .Sum(e => e.Course.Price);

                var yearlyRevenue = allEnrollments
                    .Where(e => e.EnrolledAt.Year == targetYear)
                    .Sum(e => e.Course.Price);

                var totalEnrollments = await _context.Enrollments.CountAsync();
                var monthlyEnrollments = await _context.Enrollments
                    .CountAsync(e => e.EnrolledAt.Month == currentMonth && e.EnrolledAt.Year == currentYear);
                var yearlyEnrollments = await _context.Enrollments
                    .CountAsync(e => e.EnrolledAt.Year == targetYear);

                var revenueByMonth = allEnrollments
                    .Where(e => e.EnrolledAt.Year == targetYear)
                    .GroupBy(e => e.EnrolledAt.Month)
                    .Select(g => new RevenueByMonthDto
                    {
                        Year = targetYear,
                        Month = g.Key,
                        MonthName = new DateTime(targetYear, g.Key, 1).ToString("MMMM"),
                        Revenue = g.Sum(e => e.Course.Price),
                        Enrollments = g.Count()
                    })
                    .OrderBy(r => r.Month)
                    .ToList();

                var coursesWithEnrollments = await _context.Courses
                    .Include(c => c.Teacher)
                    .Include(c => c.Enrollments)
                    .Where(c => c.Enrollments.Any(e => e.IsActive))
                    .ToListAsync();

                var revenueByTeacher = coursesWithEnrollments
                    .GroupBy(c => c.Teacher)
                    .Select(g => new RevenueByTeacherDto
                    {
                        TeacherId = g.Key.Id,
                        TeacherName = g.Key.FirstName + " " + g.Key.LastName,
                        TotalCourses = g.Count(),
                        TotalEnrollments = g.Sum(c => c.Enrollments.Count(e => e.IsActive)),
                        TotalRevenue = g.Sum(c => c.Enrollments.Count(e => e.IsActive) * c.Price)
                    })
                    .OrderByDescending(r => r.TotalRevenue)
                    .ToList();

                var revenueByCategory = coursesWithEnrollments
                    .GroupBy(c => c.Category)
                    .Select(g => new RevenueByCategory
                    {
                        Category = g.Key,
                        TotalCourses = g.Count(),
                        TotalEnrollments = g.Sum(c => c.Enrollments.Count(e => e.IsActive)),
                        TotalRevenue = g.Sum(c => c.Enrollments.Count(e => e.IsActive) * c.Price)
                    })
                    .OrderByDescending(r => r.TotalRevenue)
                    .ToList();

                var topSellingCourses = coursesWithEnrollments
                    .OrderByDescending(c => c.Enrollments.Count(e => e.IsActive))
                    .Take(10)
                    .Select(c => new TopSellingCourseDto
                    {
                        CourseId = c.Id,
                        CourseTitle = c.Title,
                        TeacherName = c.Teacher.FirstName + " " + c.Teacher.LastName,
                        Enrollments = c.Enrollments.Count(e => e.IsActive),
                        Revenue = c.Enrollments.Count(e => e.IsActive) * c.Price
                    })
                    .ToList();

                var report = new FinancialReportDto
                {
                    TotalRevenue = totalRevenue,
                    MonthlyRevenue = monthlyRevenue,
                    YearlyRevenue = yearlyRevenue,
                    TotalEnrollments = totalEnrollments,
                    MonthlyEnrollments = monthlyEnrollments,
                    YearlyEnrollments = yearlyEnrollments,
                    RevenueByMonth = revenueByMonth,
                    RevenueByTeacher = revenueByTeacher,
                    RevenueByCategory = revenueByCategory,
                    TopSellingCourses = topSellingCourses
                };

                return Ok(report);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating financial report");
                return StatusCode(500, new { message = "An error occurred while generating the financial report" });
            }
        }

        [Authorize(Roles = "TEACHER")]
        [HttpGet("course/{courseId}/analytics")]
        public async Task<ActionResult<object>> GetCourseAnalytics(int courseId)
        {
            try
            {
                var userId = GetCurrentUserId();

                var course = await _context.Courses
                    .Include(c => c.Enrollments)
                    .Include(c => c.Assignments)
                    .Include(c => c.Lessons)
                    .FirstOrDefaultAsync(c => c.Id == courseId);

                if (course == null)
                {
                    return NotFound(new { message = "Course not found" });
                }

                if (course.TeacherId != userId)
                {
                    return Forbid();
                }

                var totalEnrollments = course.Enrollments.Count(e => e.IsActive);
                var completedEnrollments = course.Enrollments.Count(e => e.CompletedAt.HasValue);
                var totalRevenue = totalEnrollments * course.Price;

                var avgProgress = course.Enrollments.Any() ? (double)course.Enrollments.Average(e => e.Progress) : 0;

                var assignments = course.Assignments.Count;
                var totalSubmissions = await _context.Submissions
                    .CountAsync(s => s.Assignment.CourseId == courseId);

                var gradedSubmissions = await _context.Submissions
                    .Where(s => s.Assignment.CourseId == courseId && s.Score.HasValue)
                    .ToListAsync();

                var avgScore = gradedSubmissions.Any() ? gradedSubmissions.Average(s => (double)s.Score!.Value) : 0;

                var avgRating = 0.0; // Comments removed

                var enrollmentsByMonth = course.Enrollments
                    .GroupBy(e => new { e.EnrolledAt.Year, e.EnrolledAt.Month })
                    .Select(g => new
                    {
                        month = $"{g.Key.Year}-{g.Key.Month:D2}",
                        count = g.Count()
                    })
                    .OrderBy(x => x.month)
                    .ToList();

                var analytics = new
                {
                    courseId = course.Id,
                    courseTitle = course.Title,
                    totalEnrollments,
                    activeEnrollments = totalEnrollments,
                    completedEnrollments,
                    completionRate = totalEnrollments > 0 ? (double)completedEnrollments / totalEnrollments * 100 : 0,
                    averageProgress = avgProgress,
                    totalLessons = course.Lessons.Count,
                    totalAssignments = assignments,
                    totalSubmissions,
                    gradedSubmissions = gradedSubmissions.Count,
                    pendingGrading = totalSubmissions - gradedSubmissions.Count,
                    averageScore = avgScore,
                    averageRating = avgRating,
                    totalRatings = 0,
                    totalRevenue,
                    enrollmentsByMonth,
                    createdAt = course.CreatedAt,
                    status = course.Status.ToString()
                };

                return Ok(analytics);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting course analytics for course {CourseId}", courseId);
                return StatusCode(500, new { message = "An error occurred while retrieving course analytics" });
            }
        }

        [Authorize(Roles = "TEACHER")]
        [HttpGet("course/{courseId}/students")]
        public async Task<ActionResult<List<StudentProgressDto>>> GetCourseStudentProgress(int courseId)
        {
            try
            {
                var userId = GetCurrentUserId();

                var course = await _context.Courses.FindAsync(courseId);
                if (course == null)
                {
                    return NotFound(new { message = "Course not found" });
                }

                if (course.TeacherId != userId)
                {
                    return Forbid();
                }

                var studentProgress = await _context.Enrollments
                    .Include(e => e.Student)
                    .Where(e => e.CourseId == courseId && e.IsActive)
                    .Select(e => new StudentProgressDto
                    {
                        StudentId = e.StudentId,
                        StudentName = e.Student.FirstName + " " + e.Student.LastName,
                        StudentEmail = e.Student.Email,
                        EnrolledAt = e.EnrolledAt,
                        Progress = e.Progress,
                        CompletedAssignments = _context.Submissions
                            .Count(s => s.StudentId == e.StudentId && s.Assignment.CourseId == courseId && s.Score.HasValue),
                        TotalAssignments = _context.Assignments.Count(a => a.CourseId == courseId),
                        AverageScore = _context.Submissions
                            .Where(s => s.StudentId == e.StudentId && s.Assignment.CourseId == courseId && s.Score.HasValue)
                            .Average(s => (double?)s.Score),
                        LastActivity = _context.Submissions
                            .Where(s => s.StudentId == e.StudentId && s.Assignment.CourseId == courseId)
                            .Max(s => (DateTime?)s.SubmittedAt)
                    })
                    .OrderByDescending(s => s.Progress)
                    .ToListAsync();

                return Ok(studentProgress);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting student progress for course {CourseId}", courseId);
                return StatusCode(500, new { message = "An error occurred while retrieving student progress" });
            }
        }
    }
}
