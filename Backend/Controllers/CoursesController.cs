using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.DTOs;
using Backend.Models;
using System.Security.Claims;

namespace Backend.Controllers
{
    [Route("api/courses")]
    [ApiController]
    public class CoursesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<CoursesController> _logger;

        public CoursesController(ApplicationDbContext context, ILogger<CoursesController> logger)
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

        [HttpGet]
        public async Task<ActionResult<PagedResultDto<CourseDto>>> GetCourses([FromQuery] CourseSearchDto searchDto)
        {
            try
            {
                var userId = GetCurrentUserId();

                var query = _context.Courses
                    .Include(c => c.Teacher)
                    .Include(c => c.Lessons)
                    .Include(c => c.Assignments)
                    .Include(c => c.Enrollments)
                    .AsQueryable();

                // Filter by published status for non-admin users
                if (!User.IsInRole("ADMIN"))
                {
                    query = query.Where(c => c.Status == CourseStatus.PUBLISHED && c.IsApproved);
                }

                // Search by term
                if (!string.IsNullOrEmpty(searchDto.SearchTerm))
                {
                    query = query.Where(c =>
                        c.Title.Contains(searchDto.SearchTerm) ||
                        c.Description.Contains(searchDto.SearchTerm) ||
                        c.Category.Contains(searchDto.SearchTerm));
                }

                // Filter by category
                if (!string.IsNullOrEmpty(searchDto.Category))
                {
                    query = query.Where(c => c.Category == searchDto.Category);
                }

                // Filter by price range
                if (searchDto.MinPrice.HasValue)
                {
                    query = query.Where(c => c.Price >= searchDto.MinPrice.Value);
                }
                if (searchDto.MaxPrice.HasValue)
                {
                    query = query.Where(c => c.Price <= searchDto.MaxPrice.Value);
                }

                // Filter by duration range
                if (searchDto.MinDuration.HasValue)
                {
                    query = query.Where(c => c.Duration >= searchDto.MinDuration.Value);
                }
                if (searchDto.MaxDuration.HasValue)
                {
                    query = query.Where(c => c.Duration <= searchDto.MaxDuration.Value);
                }

                // Get total count before pagination
                var totalCount = await query.CountAsync();

                // Sorting
                query = searchDto.SortBy?.ToLower() switch
                {
                    "price" => searchDto.SortOrder?.ToLower() == "desc"
                        ? query.OrderByDescending(c => c.Price)
                        : query.OrderBy(c => c.Price),
                    "duration" => searchDto.SortOrder?.ToLower() == "desc"
                        ? query.OrderByDescending(c => c.Duration)
                        : query.OrderBy(c => c.Duration),
                    "enrollments" => searchDto.SortOrder?.ToLower() == "desc"
                        ? query.OrderByDescending(c => c.Enrollments.Count)
                        : query.OrderBy(c => c.Enrollments.Count),
                    "rating" => query.OrderBy(c => c.Title), // Rating sort removed
                    _ => searchDto.SortOrder?.ToLower() == "desc"
                        ? query.OrderByDescending(c => c.Title)
                        : query.OrderBy(c => c.Title)
                };

                // Pagination
                var courses = await query
                    .Skip((searchDto.PageNumber - 1) * searchDto.PageSize)
                    .Take(searchDto.PageSize)
                    .ToListAsync();

                // Map to DTOs with enrollment status
                var courseDtos = courses.Select(c => new CourseDto
                {
                    Id = c.Id,
                    Title = c.Title,
                    Description = c.Description,
                    TeacherId = c.TeacherId,
                    TeacherName = c.Teacher.FullName,
                    Category = c.Category,
                    Duration = c.Duration,
                    Price = c.Price,
                    Status = c.Status.ToString(),
                    IsApproved = c.IsApproved,
                    CreatedAt = c.CreatedAt,
                    UpdatedAt = c.UpdatedAt,
                    LessonCount = c.Lessons.Count,
                    AssignmentCount = c.Assignments.Count,
                    EnrollmentCount = c.Enrollments.Count(e => e.IsActive),
                    AverageRating = null,
                    IsEnrolled = userId > 0 && c.Enrollments.Any(e => e.StudentId == userId && e.IsActive)
                }).ToList();

                var totalPages = (int)Math.Ceiling(totalCount / (double)searchDto.PageSize);

                var result = new PagedResultDto<CourseDto>
                {
                    Items = courseDtos,
                    TotalCount = totalCount,
                    PageNumber = searchDto.PageNumber,
                    PageSize = searchDto.PageSize,
                    TotalPages = totalPages,
                    HasPreviousPage = searchDto.PageNumber > 1,
                    HasNextPage = searchDto.PageNumber < totalPages
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting courses");
                return StatusCode(500, new { message = "An error occurred while retrieving courses" });
            }
        }

        [HttpGet("my-courses")]
        [Authorize]
        public async Task<ActionResult<List<CourseDto>>> GetMyCourses()
        {
            try
            {
                var userId = GetCurrentUserId();
                var userRole = GetCurrentUserRole();

                List<CourseDto> courses;

                if (userRole == UserRole.TEACHER)
                {
                    courses = await _context.Courses
                        .Include(c => c.Teacher)
                        .Include(c => c.Lessons)
                        .Include(c => c.Assignments)
                        .Include(c => c.Enrollments)
                        .Where(c => c.TeacherId == userId)
                        .OrderByDescending(c => c.CreatedAt)
                        .Select(c => new CourseDto
                        {
                            Id = c.Id,
                            Title = c.Title,
                            Description = c.Description,
                            TeacherId = c.TeacherId,
                            TeacherName = c.Teacher.FullName,
                            Category = c.Category,
                            Duration = c.Duration,
                            Price = c.Price,
                            Status = c.Status.ToString(),
                            IsApproved = c.IsApproved,
                            CreatedAt = c.CreatedAt,
                            UpdatedAt = c.UpdatedAt,
                            LessonCount = c.Lessons.Count,
                            AssignmentCount = c.Assignments.Count,
                            EnrollmentCount = c.Enrollments.Count(e => e.IsActive),
                            AverageRating = null
                        })
                        .ToListAsync();
                }
                else if (userRole == UserRole.STUDENT)
                {
                    courses = await _context.Enrollments
                        .Include(e => e.Course)
                            .ThenInclude(c => c.Teacher)
                        .Include(e => e.Course.Lessons)
                        .Include(e => e.Course.Assignments)
                        .Include(e => e.Course.Enrollments)
                        .Where(e => e.StudentId == userId && e.IsActive)
                        .OrderByDescending(e => e.EnrolledAt)
                        .Select(e => new CourseDto
                        {
                            Id = e.Course.Id,
                            Title = e.Course.Title,
                            Description = e.Course.Description,
                            TeacherId = e.Course.TeacherId,
                            TeacherName = e.Course.Teacher.FullName,
                            Category = e.Course.Category,
                            Duration = e.Course.Duration,
                            Price = e.Course.Price,
                            Status = e.Course.Status.ToString(),
                            CreatedAt = e.Course.CreatedAt,
                            UpdatedAt = e.Course.UpdatedAt,
                            LessonCount = e.Course.Lessons.Count,
                            AssignmentCount = e.Course.Assignments.Count,
                            EnrollmentCount = e.Course.Enrollments.Count(en => en.IsActive),
                            AverageRating = null
                        })
                        .ToListAsync();
                }
                else
                {
                    return Ok(new List<CourseDto>());
                }

                return Ok(courses);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user courses");
                return StatusCode(500, new { message = "An error occurred while retrieving courses" });
            }
        }

        [HttpGet("pending")]
        [Authorize(Roles = "ADMIN")]
        public async Task<ActionResult<IEnumerable<CourseDto>>> GetPendingCourses()
        {
            try
            {
                var pendingCourses = await _context.Courses
                    .Include(c => c.Teacher)
                    .Include(c => c.Lessons)
                    .Include(c => c.Assignments)
                    .Include(c => c.Enrollments)
                    .Where(c => c.Status == CourseStatus.PUBLISHED && !c.IsApproved)
                    .OrderBy(c => c.CreatedAt)
                    .ToListAsync();

                var courseDtos = pendingCourses.Select(c => new CourseDto
                {
                    Id = c.Id,
                    Title = c.Title,
                    Description = c.Description,
                    TeacherId = c.TeacherId,
                    TeacherName = c.Teacher.FullName,
                    Category = c.Category,
                    Duration = c.Duration,
                    Price = c.Price,
                    Status = c.Status.ToString(),
                    CreatedAt = c.CreatedAt,
                    UpdatedAt = c.UpdatedAt,
                    IsApproved = c.IsApproved,
                    ApprovedByAdminId = c.ApprovedByAdminId,
                    ApprovedAt = c.ApprovedAt,
                    LessonCount = c.Lessons.Count,
                    AssignmentCount = c.Assignments.Count,
                    EnrollmentCount = c.Enrollments.Count(e => e.IsActive)
                }).ToList();

                return Ok(courseDtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting pending courses");
                return StatusCode(500, new { message = "An error occurred while retrieving pending courses" });
            }
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<CourseDetailDto>> GetCourse(int id)
        {
            try
            {
                var userId = User.Identity?.IsAuthenticated == true ? GetCurrentUserId() : 0;
                var userRole = User.Identity?.IsAuthenticated == true ? GetCurrentUserRole() : UserRole.STUDENT;

                _logger.LogInformation("GetCourse called for CourseId: {CourseId}, UserId: {UserId}, Role: {Role}", id, userId, userRole);

                var course = await _context.Courses
                    .Include(c => c.Teacher)
                    .Include(c => c.Lessons.OrderBy(l => l.OrderIndex))
                    .Include(c => c.Assignments)
                        .ThenInclude(a => a.Submissions)
                    .Include(c => c.Enrollments)
                    .FirstOrDefaultAsync(c => c.Id == id);

                if (course == null)
                {
                    _logger.LogWarning("Course not found: {CourseId}", id);
                    return NotFound(new { message = "Course not found" });
                }

                _logger.LogInformation("Course found: {CourseId}, Status: {Status}, IsApproved: {IsApproved}, Lessons: {LessonCount}, Assignments: {AssignmentCount}",
                    course.Id, course.Status, course.IsApproved, course.Lessons.Count, course.Assignments.Count);

                // Check if user is enrolled
                var isEnrolled = userId > 0 && await _context.Enrollments
                    .AnyAsync(e => e.CourseId == id && e.StudentId == userId && e.IsActive);

                _logger.LogInformation("User enrollment status for CourseId {CourseId}: {IsEnrolled}", id, isEnrolled);

                var courseDto = new CourseDetailDto
                {
                    Id = course.Id,
                    Title = course.Title,
                    Description = course.Description,
                    TeacherId = course.TeacherId,
                    TeacherName = course.Teacher.FullName,
                    Category = course.Category,
                    Duration = course.Duration,
                    Price = course.Price,
                    Status = course.Status,
                    IsApproved = course.IsApproved,
                    CreatedAt = course.CreatedAt,
                    UpdatedAt = course.UpdatedAt,
                    Lessons = course.Lessons.Select(l => new LessonDto
                    {
                        Id = l.Id,
                        CourseId = l.CourseId,
                        Title = l.Title,
                        Content = l.Content,
                        Attachments = string.IsNullOrEmpty(l.Attachments)
                            ? new List<string>()
                            : System.Text.Json.JsonSerializer.Deserialize<List<string>>(l.Attachments) ?? new List<string>(),
                        OrderIndex = l.OrderIndex,
                        CreatedAt = l.CreatedAt,
                        UpdatedAt = l.UpdatedAt,
                        ScheduledDate = l.ScheduledDate
                    }).ToList(),
                    Assignments = course.Assignments.Select(a => new AssignmentDto
                    {
                        Id = a.Id,
                        CourseId = a.CourseId,
                        Title = a.Title,
                        Description = a.Description,
                        DueDate = a.DueDate,
                        MaxScore = a.MaxScore,
                        CreatedAt = a.CreatedAt,
                        UpdatedAt = a.UpdatedAt,
                        TotalSubmissions = a.Submissions.Count,
                        HasSubmitted = userId > 0 && a.Submissions.Any(s => s.StudentId == userId)
                    }).ToList(),
                    EnrolledStudents = course.Enrollments.Count(e => e.IsActive),
                    AverageRating = null,
                    IsEnrolled = isEnrolled
                };

                _logger.LogInformation("Returning course details - Lessons: {LessonCount}, Assignments: {AssignmentCount}",
                    courseDto.Lessons.Count, courseDto.Assignments.Count);

                return Ok(courseDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting course {CourseId}", id);
                return StatusCode(500, new { message = "An error occurred while retrieving the course" });
            }
        }

        [Authorize(Roles = "TEACHER")]
        [HttpPost]
        public async Task<ActionResult<CourseDto>> CreateCourse([FromBody] CreateCourseDto dto)
        {
            try
            {
                var userId = GetCurrentUserId();

                var course = new Course
                {
                    Title = dto.Title,
                    Description = dto.Description,
                    TeacherId = userId,
                    Category = dto.Category,
                    Duration = dto.Duration,
                    Price = dto.Price,
                    Status = CourseStatus.DRAFT,
                    IsApproved = false,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Courses.Add(course);
                await _context.SaveChangesAsync();

                var teacher = await _context.Users.FindAsync(userId);

                var courseDto = new CourseDto
                {
                    Id = course.Id,
                    Title = course.Title,
                    Description = course.Description,
                    TeacherId = course.TeacherId,
                    TeacherName = teacher?.FullName ?? "",
                    Category = course.Category,
                    Duration = course.Duration,
                    Price = course.Price,
                    Status = course.Status.ToString(),
                    IsApproved = course.IsApproved,
                    CreatedAt = course.CreatedAt,
                    UpdatedAt = course.UpdatedAt,
                    LessonCount = 0,
                    AssignmentCount = 0,
                    EnrollmentCount = 0,
                    AverageRating = null
                };

                return CreatedAtAction(nameof(GetCourse), new { id = course.Id }, courseDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating course");
                return StatusCode(500, new { message = "An error occurred while creating the course" });
            }
        }

        [Authorize(Roles = "TEACHER")]
        [HttpPut("{id}")]
        public async Task<ActionResult<CourseDto>> UpdateCourse(int id, [FromBody] UpdateCourseDto dto)
        {
            try
            {
                var userId = GetCurrentUserId();
                var course = await _context.Courses
                    .Include(c => c.Teacher)
                    .Include(c => c.Lessons)
                    .Include(c => c.Assignments)
                    .Include(c => c.Enrollments)
                    .FirstOrDefaultAsync(c => c.Id == id);

                if (course == null)
                {
                    return NotFound(new { message = "Course not found" });
                }

                // Check if user is the course owner
                if (course.TeacherId != userId)
                {
                    return Forbid();
                }

                course.Title = dto.Title;
                course.Description = dto.Description;
                course.Category = dto.Category;
                course.Duration = dto.Duration;
                course.Price = dto.Price;

                if (dto.Status.HasValue)
                {
                    course.Status = dto.Status.Value;
                }

                course.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                var courseDto = new CourseDto
                {
                    Id = course.Id,
                    Title = course.Title,
                    Description = course.Description,
                    TeacherId = course.TeacherId,
                    TeacherName = course.Teacher.FullName,
                    Category = course.Category,
                    Duration = course.Duration,
                    Price = course.Price,
                    Status = course.Status.ToString(),
                    CreatedAt = course.CreatedAt,
                    UpdatedAt = course.UpdatedAt,
                    LessonCount = course.Lessons.Count,
                    AssignmentCount = course.Assignments.Count,
                    EnrollmentCount = course.Enrollments.Count(e => e.IsActive),
                    AverageRating = null
                };

                return Ok(courseDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating course {CourseId}", id);
                return StatusCode(500, new { message = "An error occurred while updating the course" });
            }
        }

        [Authorize(Roles = "TEACHER,ADMIN")]
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteCourse(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                var userRole = GetCurrentUserRole();
                var course = await _context.Courses.FindAsync(id);

                if (course == null)
                {
                    return NotFound(new { message = "Course not found" });
                }

                // Check if user is the course owner or admin
                if (course.TeacherId != userId && userRole != UserRole.ADMIN)
                {
                    return Forbid();
                }

                _context.Courses.Remove(course);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Course deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting course {CourseId}", id);
                return StatusCode(500, new { message = "An error occurred while deleting the course" });
            }
        }

        [Authorize(Roles = "ADMIN")]
        [HttpPost("{id}/approve")]
        public async Task<ActionResult<CourseDto>> ApproveCourse(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                var course = await _context.Courses
                    .Include(c => c.Teacher)
                    .FirstOrDefaultAsync(c => c.Id == id);

                if (course == null)
                {
                    return NotFound(new { message = "Course not found" });
                }

                course.IsApproved = true;
                course.ApprovedByAdminId = userId;
                course.ApprovedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                var courseDto = new CourseDto
                {
                    Id = course.Id,
                    Title = course.Title,
                    Description = course.Description,
                    TeacherId = course.TeacherId,
                    TeacherName = course.Teacher.FullName,
                    Category = course.Category,
                    Duration = course.Duration,
                    Price = course.Price,
                    Status = course.Status.ToString(),
                    CreatedAt = course.CreatedAt,
                    UpdatedAt = course.UpdatedAt,
                    IsApproved = course.IsApproved,
                    ApprovedByAdminId = course.ApprovedByAdminId,
                    ApprovedAt = course.ApprovedAt
                };

                return Ok(courseDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error approving course {CourseId}", id);
                return StatusCode(500, new { message = "An error occurred while approving the course" });
            }
        }

        [Authorize(Roles = "ADMIN")]
        [HttpPost("{id}/reject")]
        public async Task<ActionResult> RejectCourse(int id, [FromBody] RejectCourseDto dto)
        {
            try
            {
                var course = await _context.Courses.FindAsync(id);

                if (course == null)
                {
                    return NotFound(new { message = "Course not found" });
                }

                // Set course back to draft or delete it based on your business logic
                course.Status = CourseStatus.DRAFT;
                course.IsApproved = false;
                course.ApprovedByAdminId = null;
                course.ApprovedAt = null;

                await _context.SaveChangesAsync();

                return Ok(new { message = "Course rejected successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error rejecting course {CourseId}", id);
                return StatusCode(500, new { message = "An error occurred while rejecting the course" });
            }
        }

        [Authorize(Roles = "STUDENT")]
        [HttpPost("{id}/enroll")]
        public async Task<ActionResult> EnrollInCourse(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                var course = await _context.Courses.FindAsync(id);

                if (course == null)
                {
                    return NotFound(new { message = "Course not found" });
                }

                if (course.Status != CourseStatus.PUBLISHED || !course.IsApproved)
                {
                    return BadRequest(new { message = "Course is not available for enrollment" });
                }

                // Check if already enrolled
                var existingEnrollment = await _context.Enrollments
                    .FirstOrDefaultAsync(e => e.CourseId == id && e.StudentId == userId);

                if (existingEnrollment != null)
                {
                    if (existingEnrollment.IsActive)
                    {
                        return BadRequest(new { message = "You are already enrolled in this course" });
                    }
                    else
                    {
                        existingEnrollment.IsActive = true;
                        existingEnrollment.EnrolledAt = DateTime.UtcNow;
                    }
                }
                else
                {
                    var enrollment = new Enrollment
                    {
                        StudentId = userId,
                        CourseId = id,
                        EnrolledAt = DateTime.UtcNow,
                        IsActive = true,
                        Progress = 0
                    };

                    _context.Enrollments.Add(enrollment);
                }

                await _context.SaveChangesAsync();

                return Ok(new { message = "Successfully enrolled in course" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error enrolling in course {CourseId}", id);
                return StatusCode(500, new { message = "An error occurred while enrolling in the course" });
            }
        }




    }
}
