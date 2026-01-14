using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models
{
    public class Enrollment
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int StudentId { get; set; }

        [Required]
        public int CourseId { get; set; }

        public DateTime EnrolledAt { get; set; } = DateTime.UtcNow;

        public bool IsActive { get; set; } = true;

        public decimal Progress { get; set; } = 0;

        public DateTime? CompletedAt { get; set; }

        [ForeignKey("StudentId")]
        public virtual User Student { get; set; } = null!;

        [ForeignKey("CourseId")]
        public virtual Course Course { get; set; } = null!;
    }



    public class Consultation
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int TeacherId { get; set; }

        [Required]
        public int StudentId { get; set; }

        [Required]
        public int CourseId { get; set; }

        [Required]
        [MaxLength(255)]
        public string Title { get; set; } = string.Empty;

        public string? Description { get; set; }

        [Required]
        public DateTime ScheduledAt { get; set; }

        public int DurationMinutes { get; set; } = 60;

        public bool IsCancelled { get; set; } = false;

        public bool IsCompleted { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public string? MeetingLink { get; set; }

        [ForeignKey("TeacherId")]
        public virtual User Teacher { get; set; } = null!;

        [ForeignKey("StudentId")]
        public virtual User Student { get; set; } = null!;

        [ForeignKey("CourseId")]
        public virtual Course Course { get; set; } = null!;
    }


}
