using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models
{
    public enum CourseStatus
    {
        DRAFT,
        PUBLISHED
    }

    public class Course
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(255)]
        public string Title { get; set; } = string.Empty;

        [Required]
        public string Description { get; set; } = string.Empty;

        [Required]
        public int TeacherId { get; set; }

        [Required]
        [MaxLength(100)]
        public string Category { get; set; } = string.Empty;

        [Required]
        public int Duration { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Price { get; set; }

        [Required]
        public CourseStatus Status { get; set; } = CourseStatus.DRAFT;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        public bool IsApproved { get; set; } = false;

        public int? ApprovedByAdminId { get; set; }

        public DateTime? ApprovedAt { get; set; }

        [ForeignKey("TeacherId")]
        public virtual User Teacher { get; set; } = null!;

        public virtual ICollection<Lesson> Lessons { get; set; } = new List<Lesson>();
        public virtual ICollection<Assignment> Assignments { get; set; } = new List<Assignment>();
        public virtual ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();
    }
}
