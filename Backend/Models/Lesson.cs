using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models
{
    public class Lesson
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int CourseId { get; set; }

        [Required]
        [MaxLength(255)]
        public string Title { get; set; } = string.Empty;

        [Required]
        public string Content { get; set; } = string.Empty;

        public string? Attachments { get; set; } 

        [Required]
        public int OrderIndex { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        public DateTime? ScheduledDate { get; set; }

        [ForeignKey("CourseId")]
        public virtual Course Course { get; set; } = null!;
    }
}
