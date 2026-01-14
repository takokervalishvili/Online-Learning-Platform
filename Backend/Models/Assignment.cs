using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models
{
    public class Assignment
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int CourseId { get; set; }

        [Required]
        [MaxLength(255)]
        public string Title { get; set; } = string.Empty;

        [Required]
        public string Description { get; set; } = string.Empty;

        [Required]
        public DateTime DueDate { get; set; }

        [Required]
        public int MaxScore { get; set; }

        public string? Attachments { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        [ForeignKey("CourseId")]
        public virtual Course Course { get; set; } = null!;

        public virtual ICollection<Submission> Submissions { get; set; } = new List<Submission>();
    }
}
