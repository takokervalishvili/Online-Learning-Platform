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
    [Route("api/courses/{courseId}/assignments")]
    [ApiController]
    [Authorize]
    public class AssignmentsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<AssignmentsController> _logger;

        public AssignmentsController(ApplicationDbContext context, ILogger<AssignmentsController> logger)
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
        public async Task<ActionResult<List<AssignmentDto>>> GetAssignments(int courseId)
        {
            try
            {
                var userId = GetCurrentUserId();
                var userRole = GetCurrentUserRole();

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

                var assignmentsQuery = await _context.Assignments
                    .Include(a => a.Submissions)
                    .Where(a => a.CourseId == courseId)
                    .OrderByDescending(a => a.CreatedAt)
                    .ToListAsync();

                var assignments = assignmentsQuery.Select(a => new AssignmentDto
                {
                    Id = a.Id,
                    CourseId = a.CourseId,
                    Title = a.Title,
                    Description = a.Description,
                    DueDate = a.DueDate,
                    MaxScore = a.MaxScore,
                    Attachments = string.IsNullOrEmpty(a.Attachments)
                        ? new List<string>()
                        : JsonSerializer.Deserialize<List<string>>(a.Attachments) ?? new List<string>(),
                    CreatedAt = a.CreatedAt,
                    UpdatedAt = a.UpdatedAt,
                    TotalSubmissions = a.Submissions.Count,
                    HasSubmitted = userRole == UserRole.STUDENT && a.Submissions.Any(s => s.StudentId == userId)
                }).ToList();

                return Ok(assignments);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting assignments for course {CourseId}", courseId);
                return StatusCode(500, new { message = "An error occurred while retrieving assignments" });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<AssignmentDetailDto>> GetAssignment(int courseId, int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                var userRole = GetCurrentUserRole();

                var assignment = await _context.Assignments
                    .Include(a => a.Course)
                    .Include(a => a.Submissions)
                        .ThenInclude(s => s.Student)
                    .FirstOrDefaultAsync(a => a.Id == id && a.CourseId == courseId);

                if (assignment == null)
                {
                    return NotFound(new { message = "Assignment not found" });
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
                    if (assignment.Course.TeacherId != userId)
                    {
                        return Forbid();
                    }
                }

                var assignmentDto = new AssignmentDetailDto
                {
                    Id = assignment.Id,
                    CourseId = assignment.CourseId,
                    CourseTitle = assignment.Course.Title,
                    Title = assignment.Title,
                    Description = assignment.Description,
                    DueDate = assignment.DueDate,
                    MaxScore = assignment.MaxScore,
                    Attachments = string.IsNullOrEmpty(assignment.Attachments)
                        ? new List<string>()
                        : JsonSerializer.Deserialize<List<string>>(assignment.Attachments) ?? new List<string>(),
                    CreatedAt = assignment.CreatedAt,
                    UpdatedAt = assignment.UpdatedAt
                };

                // Show all submissions to teachers
                if (userRole == UserRole.TEACHER)
                {
                    assignmentDto.Submissions = assignment.Submissions.Select(s => new SubmissionDto
                    {
                        Id = s.Id,
                        AssignmentId = s.AssignmentId,
                        StudentId = s.StudentId,
                        StudentName = s.Student.FullName,
                        Content = s.Content,
                        Attachments = string.IsNullOrEmpty(s.Attachments)
                            ? new List<string>()
                            : JsonSerializer.Deserialize<List<string>>(s.Attachments) ?? new List<string>(),
                        Score = s.Score,
                        Feedback = s.Feedback,
                        SubmittedAt = s.SubmittedAt,
                        GradedAt = s.GradedAt,
                        GradedByTeacherId = s.GradedByTeacherId
                    }).ToList();
                }
                // Show only own submission to students
                else if (userRole == UserRole.STUDENT)
                {
                    var mySubmission = assignment.Submissions.FirstOrDefault(s => s.StudentId == userId);
                    if (mySubmission != null)
                    {
                        assignmentDto.MySubmission = new SubmissionDto
                        {
                            Id = mySubmission.Id,
                            AssignmentId = mySubmission.AssignmentId,
                            StudentId = mySubmission.StudentId,
                            StudentName = mySubmission.Student.FullName,
                            Content = mySubmission.Content,
                            Attachments = string.IsNullOrEmpty(mySubmission.Attachments)
                                ? new List<string>()
                                : JsonSerializer.Deserialize<List<string>>(mySubmission.Attachments) ?? new List<string>(),
                            Score = mySubmission.Score,
                            Feedback = mySubmission.Feedback,
                            SubmittedAt = mySubmission.SubmittedAt,
                            GradedAt = mySubmission.GradedAt,
                            GradedByTeacherId = mySubmission.GradedByTeacherId
                        };
                    }
                }

                return Ok(assignmentDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting assignment {AssignmentId}", id);
                return StatusCode(500, new { message = "An error occurred while retrieving the assignment" });
            }
        }

        [Authorize(Roles = "TEACHER")]
        [HttpPost]
        public async Task<ActionResult<AssignmentDto>> CreateAssignment(int courseId, [FromBody] CreateAssignmentDto dto)
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

                var assignment = new Assignment
                {
                    CourseId = courseId,
                    Title = dto.Title,
                    Description = dto.Description,
                    DueDate = dto.DueDate,
                    MaxScore = dto.MaxScore,
                    Attachments = dto.Attachments != null && dto.Attachments.Any()
                        ? JsonSerializer.Serialize(dto.Attachments)
                        : null,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Assignments.Add(assignment);
                await _context.SaveChangesAsync();

                var assignmentDto = new AssignmentDto
                {
                    Id = assignment.Id,
                    CourseId = assignment.CourseId,
                    Title = assignment.Title,
                    Description = assignment.Description,
                    DueDate = assignment.DueDate,
                    MaxScore = assignment.MaxScore,
                    Attachments = dto.Attachments ?? new List<string>(),
                    CreatedAt = assignment.CreatedAt,
                    UpdatedAt = assignment.UpdatedAt,
                    TotalSubmissions = 0,
                    HasSubmitted = false
                };

                return CreatedAtAction(nameof(GetAssignment), new { courseId = courseId, id = assignment.Id }, assignmentDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating assignment for course {CourseId}", courseId);
                return StatusCode(500, new { message = "An error occurred while creating the assignment" });
            }
        }

        [Authorize(Roles = "TEACHER")]
        [HttpPut("{id}")]
        public async Task<ActionResult<AssignmentDto>> UpdateAssignment(int courseId, int id, [FromBody] UpdateAssignmentDto dto)
        {
            try
            {
                var userId = GetCurrentUserId();

                var assignment = await _context.Assignments
                    .Include(a => a.Course)
                    .Include(a => a.Submissions)
                    .FirstOrDefaultAsync(a => a.Id == id && a.CourseId == courseId);

                if (assignment == null)
                {
                    return NotFound(new { message = "Assignment not found" });
                }

                if (assignment.Course.TeacherId != userId)
                {
                    return Forbid();
                }

                assignment.Title = dto.Title;
                assignment.Description = dto.Description;
                assignment.DueDate = dto.DueDate;
                assignment.MaxScore = dto.MaxScore;
                assignment.Attachments = dto.Attachments != null && dto.Attachments.Any()
                    ? JsonSerializer.Serialize(dto.Attachments)
                    : null;
                assignment.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                var assignmentDto = new AssignmentDto
                {
                    Id = assignment.Id,
                    CourseId = assignment.CourseId,
                    Title = assignment.Title,
                    Description = assignment.Description,
                    DueDate = assignment.DueDate,
                    MaxScore = assignment.MaxScore,
                    Attachments = string.IsNullOrEmpty(assignment.Attachments)
                        ? new List<string>()
                        : JsonSerializer.Deserialize<List<string>>(assignment.Attachments) ?? new List<string>(),
                    CreatedAt = assignment.CreatedAt,
                    UpdatedAt = assignment.UpdatedAt,
                    TotalSubmissions = assignment.Submissions.Count,
                    HasSubmitted = false
                };

                return Ok(assignmentDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating assignment {AssignmentId}", id);
                return StatusCode(500, new { message = "An error occurred while updating the assignment" });
            }
        }

        [Authorize(Roles = "TEACHER")]
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteAssignment(int courseId, int id)
        {
            try
            {
                var userId = GetCurrentUserId();

                var assignment = await _context.Assignments
                    .Include(a => a.Course)
                    .FirstOrDefaultAsync(a => a.Id == id && a.CourseId == courseId);

                if (assignment == null)
                {
                    return NotFound(new { message = "Assignment not found" });
                }

                if (assignment.Course.TeacherId != userId)
                {
                    return Forbid();
                }

                _context.Assignments.Remove(assignment);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Assignment deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting assignment {AssignmentId}", id);
                return StatusCode(500, new { message = "An error occurred while deleting the assignment" });
            }
        }
    }

    [Route("api/submissions")]
    [ApiController]
    [Authorize]
    public class SubmissionsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<SubmissionsController> _logger;

        public SubmissionsController(ApplicationDbContext context, ILogger<SubmissionsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        private int GetCurrentUserId()
        {
            return int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        }

        [Authorize(Roles = "STUDENT")]
        [HttpPost("assignments/{assignmentId}/submit")]
        public async Task<ActionResult<SubmissionDto>> SubmitAssignment(int assignmentId, [FromBody] CreateSubmissionDto dto)
        {
            try
            {
                var userId = GetCurrentUserId();

                var assignment = await _context.Assignments
                    .Include(a => a.Course)
                    .Include(a => a.Submissions)
                    .FirstOrDefaultAsync(a => a.Id == assignmentId);

                if (assignment == null)
                {
                    return NotFound(new { message = "Assignment not found" });
                }

                // Check if enrolled
                var isEnrolled = await _context.Enrollments
                    .AnyAsync(e => e.CourseId == assignment.CourseId && e.StudentId == userId && e.IsActive);

                if (!isEnrolled)
                {
                    return Forbid();
                }

                // Check if already submitted
                var existingSubmission = assignment.Submissions.FirstOrDefault(s => s.StudentId == userId);
                if (existingSubmission != null)
                {
                    return BadRequest(new { message = "You have already submitted this assignment. Contact your teacher to resubmit." });
                }

                var submission = new Submission
                {
                    AssignmentId = assignmentId,
                    StudentId = userId,
                    Content = dto.Content,
                    Attachments = dto.Attachments != null && dto.Attachments.Any()
                        ? JsonSerializer.Serialize(dto.Attachments)
                        : null,
                    SubmittedAt = DateTime.UtcNow
                };

                _context.Submissions.Add(submission);
                await _context.SaveChangesAsync();

                var user = await _context.Users.FindAsync(userId);

                var submissionDto = new SubmissionDto
                {
                    Id = submission.Id,
                    AssignmentId = submission.AssignmentId,
                    StudentId = submission.StudentId,
                    StudentName = user?.FullName ?? "",
                    Content = submission.Content,
                    Attachments = dto.Attachments ?? new List<string>(),
                    Score = submission.Score,
                    Feedback = submission.Feedback,
                    SubmittedAt = submission.SubmittedAt,
                    GradedAt = submission.GradedAt,
                    GradedByTeacherId = submission.GradedByTeacherId
                };

                return Ok(submissionDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error submitting assignment {AssignmentId}", assignmentId);
                return StatusCode(500, new { message = "An error occurred while submitting the assignment" });
            }
        }

        [Authorize(Roles = "TEACHER")]
        [HttpPut("{submissionId}/grade")]
        public async Task<ActionResult<SubmissionDto>> GradeSubmission(int submissionId, [FromBody] GradeSubmissionDto dto)
        {
            try
            {
                var userId = GetCurrentUserId();

                var submission = await _context.Submissions
                    .Include(s => s.Assignment)
                        .ThenInclude(a => a.Course)
                    .Include(s => s.Student)
                    .FirstOrDefaultAsync(s => s.Id == submissionId);

                if (submission == null)
                {
                    return NotFound(new { message = "Submission not found" });
                }

                if (submission.Assignment.Course.TeacherId != userId)
                {
                    return Forbid();
                }

                if (dto.Score > submission.Assignment.MaxScore)
                {
                    return BadRequest(new { message = $"Score cannot exceed maximum score of {submission.Assignment.MaxScore}" });
                }

                submission.Score = dto.Score;
                submission.Feedback = dto.Feedback;
                submission.GradedAt = DateTime.UtcNow;
                submission.GradedByTeacherId = userId;

                await _context.SaveChangesAsync();

                var submissionDto = new SubmissionDto
                {
                    Id = submission.Id,
                    AssignmentId = submission.AssignmentId,
                    StudentId = submission.StudentId,
                    StudentName = submission.Student.FullName,
                    Content = submission.Content,
                    Attachments = string.IsNullOrEmpty(submission.Attachments)
                        ? new List<string>()
                        : JsonSerializer.Deserialize<List<string>>(submission.Attachments) ?? new List<string>(),
                    Score = submission.Score,
                    Feedback = submission.Feedback,
                    SubmittedAt = submission.SubmittedAt,
                    GradedAt = submission.GradedAt,
                    GradedByTeacherId = submission.GradedByTeacherId
                };

                return Ok(submissionDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error grading submission {SubmissionId}", submissionId);
                return StatusCode(500, new { message = "An error occurred while grading the submission" });
            }
        }

        [Authorize(Roles = "TEACHER")]
        [HttpGet("{submissionId}")]
        public async Task<ActionResult<SubmissionDto>> GetSubmission(int submissionId)
        {
            try
            {
                var userId = GetCurrentUserId();

                var submission = await _context.Submissions
                    .Include(s => s.Assignment)
                        .ThenInclude(a => a.Course)
                    .Include(s => s.Student)
                    .Include(s => s.GradedByTeacher)
                    .FirstOrDefaultAsync(s => s.Id == submissionId);

                if (submission == null)
                {
                    return NotFound(new { message = "Submission not found" });
                }

                if (submission.Assignment.Course.TeacherId != userId)
                {
                    return Forbid();
                }

                var submissionDto = new SubmissionDto
                {
                    Id = submission.Id,
                    AssignmentId = submission.AssignmentId,
                    StudentId = submission.StudentId,
                    StudentName = submission.Student.FullName,
                    Content = submission.Content,
                    Attachments = string.IsNullOrEmpty(submission.Attachments)
                        ? new List<string>()
                        : JsonSerializer.Deserialize<List<string>>(submission.Attachments) ?? new List<string>(),
                    Score = submission.Score,
                    Feedback = submission.Feedback,
                    SubmittedAt = submission.SubmittedAt,
                    GradedAt = submission.GradedAt,
                    GradedByTeacherId = submission.GradedByTeacherId,
                    GradedByTeacherName = submission.GradedByTeacher?.FullName
                };

                return Ok(submissionDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting submission {SubmissionId}", submissionId);
                return StatusCode(500, new { message = "An error occurred while retrieving the submission" });
            }
        }

        [Authorize(Roles = "TEACHER")]
        [HttpGet("assignments/{assignmentId}")]
        public async Task<ActionResult<List<SubmissionDto>>> GetAssignmentSubmissions(int assignmentId)
        {
            try
            {
                var userId = GetCurrentUserId();

                var assignment = await _context.Assignments
                    .Include(a => a.Course)
                    .Include(a => a.Submissions)
                        .ThenInclude(s => s.Student)
                    .FirstOrDefaultAsync(a => a.Id == assignmentId);

                if (assignment == null)
                {
                    return NotFound(new { message = "Assignment not found" });
                }

                if (assignment.Course.TeacherId != userId)
                {
                    return Forbid();
                }

                var submissions = assignment.Submissions.Select(s => new SubmissionDto
                {
                    Id = s.Id,
                    AssignmentId = s.AssignmentId,
                    StudentId = s.StudentId,
                    StudentName = s.Student.FullName,
                    Content = s.Content,
                    Attachments = string.IsNullOrEmpty(s.Attachments)
                        ? new List<string>()
                        : JsonSerializer.Deserialize<List<string>>(s.Attachments) ?? new List<string>(),
                    Score = s.Score,
                    Feedback = s.Feedback,
                    SubmittedAt = s.SubmittedAt,
                    GradedAt = s.GradedAt,
                    GradedByTeacherId = s.GradedByTeacherId
                }).ToList();

                return Ok(submissions);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting submissions for assignment {AssignmentId}", assignmentId);
                return StatusCode(500, new { message = "An error occurred while retrieving submissions" });
            }
        }

        [Authorize(Roles = "TEACHER")]
        [HttpGet("ungraded")]
        public async Task<ActionResult<List<SubmissionDto>>> GetUngradedSubmissions()
        {
            try
            {
                var userId = GetCurrentUserId();

                var submissionsQuery = await _context.Submissions
                    .Include(s => s.Assignment)
                        .ThenInclude(a => a.Course)
                    .Include(s => s.Student)
                    .Where(s => s.Assignment.Course.TeacherId == userId && s.Score == null)
                    .OrderByDescending(s => s.SubmittedAt)
                    .ToListAsync();

                var submissions = submissionsQuery.Select(s => new SubmissionDto
                {
                    Id = s.Id,
                    AssignmentId = s.AssignmentId,
                    StudentId = s.StudentId,
                    StudentName = s.Student.FullName,
                    Content = s.Content,
                    Attachments = string.IsNullOrEmpty(s.Attachments)
                        ? new List<string>()
                        : JsonSerializer.Deserialize<List<string>>(s.Attachments) ?? new List<string>(),
                    Score = s.Score,
                    Feedback = s.Feedback,
                    SubmittedAt = s.SubmittedAt,
                    GradedAt = s.GradedAt,
                    GradedByTeacherId = s.GradedByTeacherId
                }).ToList();

                return Ok(submissions);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting ungraded submissions for teacher");
                return StatusCode(500, new { message = "An error occurred while retrieving ungraded submissions" });
            }
        }

        [Authorize(Roles = "TEACHER")]
        [HttpGet("teacher/assignments")]
        public async Task<ActionResult<List<AssignmentDto>>> GetTeacherAssignments()
        {
            try
            {
                var userId = GetCurrentUserId();

                var assignmentsQuery = await _context.Assignments
                    .Include(a => a.Course)
                    .Include(a => a.Submissions)
                    .Where(a => a.Course.TeacherId == userId)
                    .OrderByDescending(a => a.CreatedAt)
                    .ToListAsync();

                var assignments = assignmentsQuery.Select(a => new AssignmentDto
                {
                    Id = a.Id,
                    CourseId = a.CourseId,
                    Title = a.Title,
                    Description = a.Description,
                    DueDate = a.DueDate,
                    MaxScore = a.MaxScore,
                    Attachments = string.IsNullOrEmpty(a.Attachments)
                        ? new List<string>()
                        : JsonSerializer.Deserialize<List<string>>(a.Attachments) ?? new List<string>(),
                    CreatedAt = a.CreatedAt,
                    UpdatedAt = a.UpdatedAt,
                    TotalSubmissions = a.Submissions.Count,
                    HasSubmitted = false
                }).ToList();

                return Ok(assignments);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting teacher assignments");
                return StatusCode(500, new { message = "An error occurred while retrieving assignments" });
            }
        }
    }
}
