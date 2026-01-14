using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;
using System.Security.Claims;

namespace Backend.Controllers
{
    [Route("api/enrollments")]
    [ApiController]
    [Authorize]
    public class EnrollmentsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<EnrollmentsController> _logger;

        public EnrollmentsController(ApplicationDbContext context, ILogger<EnrollmentsController> logger)
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

        // GET: api/enrollments
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetEnrollments()
        {
            try
            {
                var userId = GetCurrentUserId();
                var userRole = GetCurrentUserRole();

                IQueryable<Enrollment> query = _context.Enrollments
                    .Include(e => e.Course)
                        .ThenInclude(c => c.Teacher)
                    .Include(e => e.Course.Lessons)
                    .Include(e => e.Course.Assignments)
                    .Include(e => e.Student);

                // Filter based on role
                if (userRole == UserRole.STUDENT)
                {
                    query = query.Where(e => e.StudentId == userId);
                }
                else if (userRole == UserRole.TEACHER)
                {
                    query = query.Where(e => e.Course.TeacherId == userId);
                }
                // Admin can see all enrollments

                var enrollments = await query
                    .OrderByDescending(e => e.EnrolledAt)
                    .Select(e => new
                    {
                        e.Id,
                        e.StudentId,
                        StudentName = e.Student.FullName,
                        StudentEmail = e.Student.Email,
                        e.CourseId,
                        CourseName = e.Course.Title,
                        CourseCategory = e.Course.Category,
                        TeacherName = e.Course.Teacher.FullName,
                        e.EnrolledAt,
                        e.IsActive,
                        e.Progress,
                        e.CompletedAt,
                        TotalLessons = e.Course.Lessons.Count,
                        TotalAssignments = e.Course.Assignments.Count,
                        CompletedLessons = 0, // TODO: Implement lesson completion tracking
                        CompletedAssignments = e.Course.Assignments.Count(a => a.Submissions.Any(s => s.StudentId == e.StudentId && s.Score.HasValue))
                    })
                    .ToListAsync();

                return Ok(enrollments);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching enrollments");
                return StatusCode(500, new { message = "Error fetching enrollments", error = ex.Message });
            }
        }

        // GET: api/enrollments/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetEnrollment(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                var userRole = GetCurrentUserRole();

                var enrollment = await _context.Enrollments
                    .Include(e => e.Course)
                        .ThenInclude(c => c.Teacher)
                    .Include(e => e.Course.Lessons.OrderBy(l => l.OrderIndex))
                    .Include(e => e.Course.Assignments)
                    .Include(e => e.Student)
                    .FirstOrDefaultAsync(e => e.Id == id);

                if (enrollment == null)
                {
                    return NotFound(new { message = "Enrollment not found" });
                }

                // Authorization check
                if (userRole == UserRole.STUDENT && enrollment.StudentId != userId)
                {
                    return Forbid();
                }
                else if (userRole == UserRole.TEACHER && enrollment.Course.TeacherId != userId)
                {
                    return Forbid();
                }

                var result = new
                {
                    enrollment.Id,
                    enrollment.StudentId,
                    StudentName = enrollment.Student.FullName,
                    StudentEmail = enrollment.Student.Email,
                    enrollment.CourseId,
                    Course = new
                    {
                        enrollment.Course.Id,
                        enrollment.Course.Title,
                        enrollment.Course.Description,
                        enrollment.Course.Category,
                        enrollment.Course.Duration,
                        enrollment.Course.Price,
                        TeacherName = enrollment.Course.Teacher.FullName,
                        LessonCount = enrollment.Course.Lessons.Count,
                        AssignmentCount = enrollment.Course.Assignments.Count
                    },
                    enrollment.EnrolledAt,
                    enrollment.IsActive,
                    enrollment.Progress,
                    enrollment.CompletedAt,
                    Lessons = enrollment.Course.Lessons.Select(l => new
                    {
                        l.Id,
                        l.Title,
                        l.OrderIndex,
                        IsCompleted = false // TODO: Implement lesson completion tracking
                    }).ToList(),
                    Assignments = enrollment.Course.Assignments.Select(a => new
                    {
                        a.Id,
                        a.Title,
                        a.DueDate,
                        MaxScore = a.MaxScore,
                        Submission = a.Submissions.FirstOrDefault(s => s.StudentId == enrollment.StudentId),
                        IsSubmitted = a.Submissions.Any(s => s.StudentId == enrollment.StudentId),
                        IsGraded = a.Submissions.Any(s => s.StudentId == enrollment.StudentId && s.Score.HasValue)
                    }).ToList()
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching enrollment");
                return StatusCode(500, new { message = "Error fetching enrollment", error = ex.Message });
            }
        }

        // GET: api/enrollments/my-enrollments
        [Authorize(Roles = "STUDENT")]
        [HttpGet("my-enrollments")]
        public async Task<ActionResult<IEnumerable<object>>> GetMyEnrollments()
        {
            try
            {
                var userId = GetCurrentUserId();

                var enrollments = await _context.Enrollments
                    .Include(e => e.Course)
                        .ThenInclude(c => c.Teacher)
                    .Include(e => e.Course.Lessons)
                    .Include(e => e.Course.Assignments)
                        .ThenInclude(a => a.Submissions)
                    .Where(e => e.StudentId == userId && e.IsActive)
                    .OrderByDescending(e => e.EnrolledAt)
                    .Select(e => new
                    {
                        e.Id,
                        e.CourseId,
                        e.StudentId,
                        Course = new
                        {
                            e.Course.Id,
                            e.Course.Title,
                            e.Course.Description,
                            e.Course.Category,
                            e.Course.Duration,
                            e.Course.Price,
                            TeacherName = e.Course.Teacher.FullName,
                            TotalLessons = e.Course.Lessons.Count,
                            TotalAssignments = e.Course.Assignments.Count
                        },
                        e.EnrolledAt,
                        e.IsActive,
                        e.Progress,
                        e.CompletedAt,
                        IsCompleted = e.CompletedAt.HasValue,
                        CompletedAssignments = e.Course.Assignments.Count(a => a.Submissions.Any(s => s.StudentId == userId && s.Score.HasValue)),
                        PendingAssignments = e.Course.Assignments.Count(a => !a.Submissions.Any(s => s.StudentId == userId)),
                        NextLesson = e.Course.Lessons.OrderBy(l => l.OrderIndex).FirstOrDefault()
                    })
                    .ToListAsync();

                return Ok(enrollments);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching my enrollments");
                return StatusCode(500, new { message = "Error fetching enrollments", error = ex.Message });
            }
        }

        // GET: api/enrollments/course/{courseId}
        [HttpGet("course/{courseId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetCourseEnrollments(int courseId)
        {
            try
            {
                var userId = GetCurrentUserId();
                var userRole = GetCurrentUserRole();

                // Check if user has access to this course
                var course = await _context.Courses.FindAsync(courseId);
                if (course == null)
                {
                    return NotFound(new { message = "Course not found" });
                }

                // Authorization check
                if (userRole == UserRole.TEACHER && course.TeacherId != userId)
                {
                    return Forbid();
                }
                else if (userRole == UserRole.STUDENT)
                {
                    return Forbid(); // Students can't see other students' enrollments
                }

                var enrollments = await _context.Enrollments
                    .Include(e => e.Student)
                    .Where(e => e.CourseId == courseId && e.IsActive)
                    .OrderByDescending(e => e.EnrolledAt)
                    .Select(e => new
                    {
                        e.Id,
                        e.StudentId,
                        StudentName = e.Student.FullName,
                        StudentEmail = e.Student.Email,
                        e.EnrolledAt,
                        e.Progress,
                        e.CompletedAt,
                        IsCompleted = e.CompletedAt.HasValue
                    })
                    .ToListAsync();

                return Ok(enrollments);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching course enrollments");
                return StatusCode(500, new { message = "Error fetching enrollments", error = ex.Message });
            }
        }

        // PUT: api/enrollments/{id}/progress
        [Authorize(Roles = "STUDENT")]
        [HttpPut("{id}/progress")]
        public async Task<ActionResult> UpdateProgress(int id, [FromBody] ProgressUpdateDto dto)
        {
            try
            {
                var userId = GetCurrentUserId();
                var enrollment = await _context.Enrollments.FindAsync(id);

                if (enrollment == null)
                {
                    return NotFound(new { message = "Enrollment not found" });
                }

                if (enrollment.StudentId != userId)
                {
                    return Forbid();
                }

                if (dto.Progress < 0 || dto.Progress > 100)
                {
                    return BadRequest(new { message = "Progress must be between 0 and 100" });
                }

                enrollment.Progress = dto.Progress;

                // Mark as completed if progress is 100%
                if (dto.Progress >= 100 && !enrollment.CompletedAt.HasValue)
                {
                    enrollment.CompletedAt = DateTime.UtcNow;
                }
                else if (dto.Progress < 100)
                {
                    enrollment.CompletedAt = null;
                }

                await _context.SaveChangesAsync();

                return Ok(new { message = "Progress updated successfully", progress = enrollment.Progress });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating progress");
                return StatusCode(500, new { message = "Error updating progress", error = ex.Message });
            }
        }

        // DELETE: api/enrollments/{id}
        [Authorize]
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteEnrollment(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                var userRole = GetCurrentUserRole();

                var enrollment = await _context.Enrollments
                    .Include(e => e.Course)
                    .FirstOrDefaultAsync(e => e.Id == id);

                if (enrollment == null)
                {
                    return NotFound(new { message = "Enrollment not found" });
                }

                // Authorization check
                if (userRole == UserRole.STUDENT && enrollment.StudentId != userId)
                {
                    return Forbid();
                }
                else if (userRole == UserRole.TEACHER && enrollment.Course.TeacherId != userId)
                {
                    return Forbid();
                }
                // Admin can delete any enrollment

                // Soft delete - just mark as inactive
                enrollment.IsActive = false;
                await _context.SaveChangesAsync();

                return Ok(new { message = "Enrollment removed successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting enrollment");
                return StatusCode(500, new { message = "Error deleting enrollment", error = ex.Message });
            }
        }

        // POST: api/enrollments/{id}/reactivate
        [Authorize]
        [HttpPost("{id}/reactivate")]
        public async Task<ActionResult> ReactivateEnrollment(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                var userRole = GetCurrentUserRole();

                var enrollment = await _context.Enrollments
                    .Include(e => e.Course)
                    .FirstOrDefaultAsync(e => e.Id == id);

                if (enrollment == null)
                {
                    return NotFound(new { message = "Enrollment not found" });
                }

                // Authorization check
                if (userRole == UserRole.STUDENT && enrollment.StudentId != userId)
                {
                    return Forbid();
                }
                else if (userRole == UserRole.TEACHER && enrollment.Course.TeacherId != userId)
                {
                    return Forbid();
                }

                enrollment.IsActive = true;
                enrollment.EnrolledAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return Ok(new { message = "Enrollment reactivated successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error reactivating enrollment");
                return StatusCode(500, new { message = "Error reactivating enrollment", error = ex.Message });
            }
        }

        // GET: api/enrollments/statistics
        [Authorize(Roles = "ADMIN,TEACHER")]
        [HttpGet("statistics")]
        public async Task<ActionResult<object>> GetEnrollmentStatistics()
        {
            try
            {
                var userId = GetCurrentUserId();
                var userRole = GetCurrentUserRole();

                IQueryable<Enrollment> query = _context.Enrollments.Include(e => e.Course);

                // Filter for teachers to only their courses
                if (userRole == UserRole.TEACHER)
                {
                    query = query.Where(e => e.Course.TeacherId == userId);
                }

                var totalEnrollments = await query.CountAsync();
                var activeEnrollments = await query.CountAsync(e => e.IsActive);
                var completedEnrollments = await query.CountAsync(e => e.CompletedAt.HasValue);
                var averageProgress = await query.Where(e => e.IsActive).AverageAsync(e => (double?)e.Progress) ?? 0;

                var recentEnrollments = await query
                    .Where(e => e.EnrolledAt >= DateTime.UtcNow.AddDays(-30))
                    .CountAsync();

                var stats = new
                {
                    TotalEnrollments = totalEnrollments,
                    ActiveEnrollments = activeEnrollments,
                    CompletedEnrollments = completedEnrollments,
                    InactiveEnrollments = totalEnrollments - activeEnrollments,
                    AverageProgress = Math.Round(averageProgress, 2),
                    CompletionRate = totalEnrollments > 0 ? Math.Round((double)completedEnrollments / totalEnrollments * 100, 2) : 0,
                    RecentEnrollments = recentEnrollments
                };

                return Ok(stats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching enrollment statistics");
                return StatusCode(500, new { message = "Error fetching statistics", error = ex.Message });
            }
        }
    }

    public class ProgressUpdateDto
    {
        public decimal Progress { get; set; }
    }
}
