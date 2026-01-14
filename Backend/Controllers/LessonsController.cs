using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.DTOs;
using Backend.Models;
using System.Security.Claims;
using System.Text.Json;

namespace Backend.Controllers
{
    [Route("api/courses/{courseId}/lessons")]
    [ApiController]
    [Authorize]
    public class LessonsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<LessonsController> _logger;

        public LessonsController(ApplicationDbContext context, ILogger<LessonsController> logger)
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
        public async Task<ActionResult<List<LessonDto>>> GetLessons(int courseId)
        {
            try
            {
                var userId = GetCurrentUserId();
                var userRole = GetCurrentUserRole();

                // Check if course exists
                var course = await _context.Courses.FindAsync(courseId);
                if (course == null)
                {
                    return NotFound(new { message = "Course not found" });
                }

                // Check permissions
                if (userRole == UserRole.STUDENT)
                {
                    var isEnrolled = await _context.Enrollments
                        .AnyAsync(e => e.CourseId == courseId && e.StudentId == userId && e.IsActive);

                    if (!isEnrolled)
                    {
                        return Forbid();
                    }
                }
                else if (userRole == UserRole.TEACHER)
                {
                    if (course.TeacherId != userId)
                    {
                        return Forbid();
                    }
                }

                var lessonsData = await _context.Lessons
                    .Where(l => l.CourseId == courseId)
                    .OrderBy(l => l.OrderIndex)
                    .ToListAsync();

                var lessons = lessonsData.Select(l => new LessonDto
                {
                    Id = l.Id,
                    CourseId = l.CourseId,
                    Title = l.Title,
                    Content = l.Content,
                    Attachments = string.IsNullOrEmpty(l.Attachments)
                        ? new List<string>()
                        : JsonSerializer.Deserialize<List<string>>(l.Attachments) ?? new List<string>(),
                    OrderIndex = l.OrderIndex,
                    CreatedAt = l.CreatedAt,
                    UpdatedAt = l.UpdatedAt,
                    ScheduledDate = l.ScheduledDate
                }).ToList();

                return Ok(lessons);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting lessons for course {CourseId}", courseId);
                return StatusCode(500, new { message = "An error occurred while retrieving lessons" });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<LessonDto>> GetLesson(int courseId, int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                var userRole = GetCurrentUserRole();

                var lesson = await _context.Lessons
                    .Include(l => l.Course)
                    .FirstOrDefaultAsync(l => l.Id == id && l.CourseId == courseId);

                if (lesson == null)
                {
                    return NotFound(new { message = "Lesson not found" });
                }

                // Check permissions
                if (userRole == UserRole.STUDENT)
                {
                    var isEnrolled = await _context.Enrollments
                        .AnyAsync(e => e.CourseId == courseId && e.StudentId == userId && e.IsActive);

                    if (!isEnrolled)
                    {
                        return Forbid();
                    }
                }
                else if (userRole == UserRole.TEACHER)
                {
                    if (lesson.Course.TeacherId != userId)
                    {
                        return Forbid();
                    }
                }

                var lessonDto = new LessonDto
                {
                    Id = lesson.Id,
                    CourseId = lesson.CourseId,
                    Title = lesson.Title,
                    Content = lesson.Content,
                    Attachments = string.IsNullOrEmpty(lesson.Attachments)
                        ? new List<string>()
                        : JsonSerializer.Deserialize<List<string>>(lesson.Attachments) ?? new List<string>(),
                    OrderIndex = lesson.OrderIndex,
                    CreatedAt = lesson.CreatedAt,
                    UpdatedAt = lesson.UpdatedAt,
                    ScheduledDate = lesson.ScheduledDate
                };

                return Ok(lessonDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting lesson {LessonId}", id);
                return StatusCode(500, new { message = "An error occurred while retrieving the lesson" });
            }
        }

        [Authorize(Roles = "TEACHER")]
        [HttpPost]
        public async Task<ActionResult<LessonDto>> CreateLesson(int courseId, [FromBody] CreateLessonDto dto)
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

                var lesson = new Lesson
                {
                    CourseId = courseId,
                    Title = dto.Title,
                    Content = dto.Content,
                    Attachments = dto.Attachments != null && dto.Attachments.Any()
                        ? JsonSerializer.Serialize(dto.Attachments)
                        : null,
                    OrderIndex = dto.OrderIndex,
                    ScheduledDate = dto.ScheduledDate,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Lessons.Add(lesson);
                await _context.SaveChangesAsync();

                var lessonDto = new LessonDto
                {
                    Id = lesson.Id,
                    CourseId = lesson.CourseId,
                    Title = lesson.Title,
                    Content = lesson.Content,
                    Attachments = dto.Attachments ?? new List<string>(),
                    OrderIndex = lesson.OrderIndex,
                    CreatedAt = lesson.CreatedAt,
                    UpdatedAt = lesson.UpdatedAt,
                    ScheduledDate = lesson.ScheduledDate
                };

                return CreatedAtAction(nameof(GetLesson), new { courseId = courseId, id = lesson.Id }, lessonDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating lesson for course {CourseId}", courseId);
                return StatusCode(500, new { message = "An error occurred while creating the lesson" });
            }
        }

        [Authorize(Roles = "TEACHER")]
        [HttpPut("{id}")]
        public async Task<ActionResult<LessonDto>> UpdateLesson(int courseId, int id, [FromBody] UpdateLessonDto dto)
        {
            try
            {
                var userId = GetCurrentUserId();

                var lesson = await _context.Lessons
                    .Include(l => l.Course)
                    .FirstOrDefaultAsync(l => l.Id == id && l.CourseId == courseId);

                if (lesson == null)
                {
                    return NotFound(new { message = "Lesson not found" });
                }

                if (lesson.Course.TeacherId != userId)
                {
                    return Forbid();
                }

                lesson.Title = dto.Title;
                lesson.Content = dto.Content;
                lesson.Attachments = dto.Attachments != null && dto.Attachments.Any()
                    ? JsonSerializer.Serialize(dto.Attachments)
                    : null;
                lesson.OrderIndex = dto.OrderIndex;
                lesson.ScheduledDate = dto.ScheduledDate;
                lesson.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                var lessonDto = new LessonDto
                {
                    Id = lesson.Id,
                    CourseId = lesson.CourseId,
                    Title = lesson.Title,
                    Content = lesson.Content,
                    Attachments = dto.Attachments ?? new List<string>(),
                    OrderIndex = lesson.OrderIndex,
                    CreatedAt = lesson.CreatedAt,
                    UpdatedAt = lesson.UpdatedAt,
                    ScheduledDate = lesson.ScheduledDate
                };

                return Ok(lessonDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating lesson {LessonId}", id);
                return StatusCode(500, new { message = "An error occurred while updating the lesson" });
            }
        }

        [Authorize(Roles = "TEACHER")]
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteLesson(int courseId, int id)
        {
            try
            {
                var userId = GetCurrentUserId();

                var lesson = await _context.Lessons
                    .Include(l => l.Course)
                    .FirstOrDefaultAsync(l => l.Id == id && l.CourseId == courseId);

                if (lesson == null)
                {
                    return NotFound(new { message = "Lesson not found" });
                }

                if (lesson.Course.TeacherId != userId)
                {
                    return Forbid();
                }

                _context.Lessons.Remove(lesson);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Lesson deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting lesson {LessonId}", id);
                return StatusCode(500, new { message = "An error occurred while deleting the lesson" });
            }
        }
    }
}
