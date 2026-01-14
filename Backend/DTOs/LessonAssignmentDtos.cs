using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs
{
    public class CreateLessonDto
    {
        [Required]
        [MaxLength(255)]
        public string Title { get; set; } = string.Empty;

        [Required]
        public string Content { get; set; } = string.Empty;

        public List<string>? Attachments { get; set; }

        [Required]
        public int OrderIndex { get; set; }

        public DateTime? ScheduledDate { get; set; }
    }

    public class UpdateLessonDto
    {
        [Required]
        [MaxLength(255)]
        public string Title { get; set; } = string.Empty;

        [Required]
        public string Content { get; set; } = string.Empty;

        public List<string>? Attachments { get; set; }

        [Required]
        public int OrderIndex { get; set; }

        public DateTime? ScheduledDate { get; set; }
    }

    public class LessonDto
    {
        public int Id { get; set; }
        public int CourseId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public List<string> Attachments { get; set; } = new List<string>();
        public int OrderIndex { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public DateTime? ScheduledDate { get; set; }
    }

    public class CreateAssignmentDto
    {
        [Required]
        [MaxLength(255)]
        public string Title { get; set; } = string.Empty;

        [Required]
        public string Description { get; set; } = string.Empty;

        [Required]
        public DateTime DueDate { get; set; }

        [Required]
        [Range(1, 1000)]
        public int MaxScore { get; set; }

        public List<string>? Attachments { get; set; }
    }

    public class UpdateAssignmentDto
    {
        [Required]
        [MaxLength(255)]
        public string Title { get; set; } = string.Empty;

        [Required]
        public string Description { get; set; } = string.Empty;

        [Required]
        public DateTime DueDate { get; set; }

        [Required]
        [Range(1, 1000)]
        public int MaxScore { get; set; }

        public List<string>? Attachments { get; set; }
    }

    public class AssignmentDto
    {
        public int Id { get; set; }
        public int CourseId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime DueDate { get; set; }
        public int MaxScore { get; set; }
        public List<string> Attachments { get; set; } = new List<string>();
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public int TotalSubmissions { get; set; }
        public bool HasSubmitted { get; set; }
    }

    public class AssignmentDetailDto
    {
        public int Id { get; set; }
        public int CourseId { get; set; }
        public string CourseTitle { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime DueDate { get; set; }
        public int MaxScore { get; set; }
        public List<string> Attachments { get; set; } = new List<string>();
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public List<SubmissionDto> Submissions { get; set; } = new List<SubmissionDto>();
        public SubmissionDto? MySubmission { get; set; }
    }

    public class CreateSubmissionDto
    {
        [Required]
        public string Content { get; set; } = string.Empty;

        public List<string>? Attachments { get; set; }
    }

    public class SubmissionDto
    {
        public int Id { get; set; }
        public int AssignmentId { get; set; }
        public int StudentId { get; set; }
        public string StudentName { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public List<string> Attachments { get; set; } = new List<string>();
        public int? Score { get; set; }
        public string? Feedback { get; set; }
        public DateTime SubmittedAt { get; set; }
        public DateTime? GradedAt { get; set; }
        public int? GradedByTeacherId { get; set; }
        public string? GradedByTeacherName { get; set; }
    }

    public class GradeSubmissionDto
    {
        [Required]
        [Range(0, 1000)]
        public int Score { get; set; }

        public string? Feedback { get; set; }
    }

    public class EnrollmentDto
    {
        public int Id { get; set; }
        public int StudentId { get; set; }
        public string StudentName { get; set; } = string.Empty;
        public int CourseId { get; set; }
        public string CourseTitle { get; set; } = string.Empty;
        public DateTime EnrolledAt { get; set; }
        public bool IsActive { get; set; }
        public decimal Progress { get; set; }
        public DateTime? CompletedAt { get; set; }
    }

    public class StudentProgressDto
    {
        public int StudentId { get; set; }
        public string StudentName { get; set; } = string.Empty;
        public string StudentEmail { get; set; } = string.Empty;
        public DateTime EnrolledAt { get; set; }
        public decimal Progress { get; set; }
        public int CompletedAssignments { get; set; }
        public int TotalAssignments { get; set; }
        public double? AverageScore { get; set; }
        public DateTime? LastActivity { get; set; }
    }
}
