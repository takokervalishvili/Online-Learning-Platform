using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models
{
    public class Submission
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int AssignmentId { get; set; }

        [Required]
        public int StudentId { get; set; }

        [Required]
        public string Content { get; set; } = string.Empty;

        public string? Attachments { get; set; }

        public int? Score { get; set; }

        public string? Feedback { get; set; }

        public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;

        public DateTime? GradedAt { get; set; }

        public int? GradedByTeacherId { get; set; }

        [ForeignKey("AssignmentId")]
        public virtual Assignment Assignment { get; set; } = null!;

        [ForeignKey("StudentId")]
        public virtual User Student { get; set; } = null!;

        [ForeignKey("GradedByTeacherId")]
        public virtual User? GradedByTeacher { get; set; }
    }
}
