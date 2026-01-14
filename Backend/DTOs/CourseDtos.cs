using System.ComponentModel.DataAnnotations;
using Backend.Models;

namespace Backend.DTOs
{
    public class CreateCourseDto
    {
        [Required]
        [MaxLength(255)]
        public string Title { get; set; } = string.Empty;

        [Required]
        public string Description { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string Category { get; set; } = string.Empty;

        [Required]
        [Range(1, 1000)]
        public int Duration { get; set; }

        [Required]
        [Range(0, 999999.99)]
        public decimal Price { get; set; }
    }

    public class UpdateCourseDto
    {
        [Required]
        [MaxLength(255)]
        public string Title { get; set; } = string.Empty;

        [Required]
        public string Description { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string Category { get; set; } = string.Empty;

        [Required]
        [Range(1, 1000)]
        public int Duration { get; set; }

        [Required]
        [Range(0, 999999.99)]
        public decimal Price { get; set; }

        public CourseStatus? Status { get; set; }
    }

    public class CourseDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int TeacherId { get; set; }
        public string TeacherName { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public int Duration { get; set; }
        public decimal Price { get; set; }
        public string Status { get; set; } = string.Empty;
        public bool IsApproved { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public int? ApprovedByAdminId { get; set; }
        public DateTime? ApprovedAt { get; set; }
        public int LessonCount { get; set; }
        public int AssignmentCount { get; set; }
        public int EnrollmentCount { get; set; }
        public double? AverageRating { get; set; }
        public bool IsEnrolled { get; set; }
    }

    public class CourseDetailDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int TeacherId { get; set; }
        public string TeacherName { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public int Duration { get; set; }
        public decimal Price { get; set; }
        public CourseStatus Status { get; set; }
        public bool IsApproved { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public List<LessonDto> Lessons { get; set; } = new List<LessonDto>();
        public List<AssignmentDto> Assignments { get; set; } = new List<AssignmentDto>();
        public int EnrolledStudents { get; set; }
        public double? AverageRating { get; set; }
        public bool IsEnrolled { get; set; }
    }

    public class ApproveCourseDto
    {
        [Required]
        public bool IsApproved { get; set; }
    }

    public class RejectCourseDto
    {
        public string? Reason { get; set; }
    }


}
