using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models
{
    public enum UserRole
    {
        ADMIN,
        TEACHER,
        STUDENT
    }

    public class User
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [EmailAddress]
        [MaxLength(255)]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string PasswordHash { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string FirstName { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string LastName { get; set; } = string.Empty;

        [Required]
        public UserRole Role { get; set; }

        [MaxLength(500)]
        public string? Avatar { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public string? PasswordResetToken { get; set; }

        public DateTime? PasswordResetExpiry { get; set; }

        public virtual ICollection<Course> CoursesCreated { get; set; } = new List<Course>();
        public virtual ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();
        public virtual ICollection<Submission> Submissions { get; set; } = new List<Submission>();
        public virtual ICollection<Consultation> Consultations { get; set; } = new List<Consultation>();

        [NotMapped]
        public string FullName => $"{FirstName} {LastName}";
    }
}