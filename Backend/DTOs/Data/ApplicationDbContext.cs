using Microsoft.EntityFrameworkCore;
using Backend.Models;

namespace Backend.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Course> Courses { get; set; }
        public DbSet<Lesson> Lessons { get; set; }
        public DbSet<Assignment> Assignments { get; set; }
        public DbSet<Submission> Submissions { get; set; }
        public DbSet<Enrollment> Enrollments { get; set; }
        public DbSet<Consultation> Consultations { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<User>(entity =>
            {
                entity.HasIndex(e => e.Email).IsUnique();
                entity.Property(e => e.Role).HasConversion<string>();
            });
            modelBuilder.Entity<Course>(entity =>
            {
                entity.HasIndex(e => e.Category);
                entity.HasIndex(e => e.Status);
                entity.Property(e => e.Status).HasConversion<string>();

                entity.HasOne(c => c.Teacher)
                    .WithMany(u => u.CoursesCreated)
                    .HasForeignKey(c => c.TeacherId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<Lesson>(entity =>
            {
                entity.HasIndex(e => new { e.CourseId, e.OrderIndex });

                entity.HasOne(l => l.Course)
                    .WithMany(c => c.Lessons)
                    .HasForeignKey(l => l.CourseId)
                    .OnDelete(DeleteBehavior.Cascade);
            });
            modelBuilder.Entity<Assignment>(entity =>
            {
                entity.HasIndex(e => e.CourseId);
                entity.HasIndex(e => e.DueDate);

                entity.HasOne(a => a.Course)
                    .WithMany(c => c.Assignments)
                    .HasForeignKey(a => a.CourseId)
                    .OnDelete(DeleteBehavior.Cascade);
            });
            modelBuilder.Entity<Submission>(entity =>
            {
                entity.HasIndex(e => e.AssignmentId);
                entity.HasIndex(e => e.StudentId);
                entity.HasIndex(e => new { e.AssignmentId, e.StudentId }).IsUnique();

                entity.HasOne(s => s.Assignment)
                    .WithMany(a => a.Submissions)
                    .HasForeignKey(s => s.AssignmentId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(s => s.Student)
                    .WithMany(u => u.Submissions)
                    .HasForeignKey(s => s.StudentId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(s => s.GradedByTeacher)
                    .WithMany()
                    .HasForeignKey(s => s.GradedByTeacherId)
                    .OnDelete(DeleteBehavior.Restrict);
            });
            modelBuilder.Entity<Enrollment>(entity =>
            {
                entity.HasIndex(e => new { e.StudentId, e.CourseId }).IsUnique();
                entity.HasIndex(e => e.CourseId);

                entity.HasOne(e => e.Student)
                    .WithMany(u => u.Enrollments)
                    .HasForeignKey(e => e.StudentId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.Course)
                    .WithMany(c => c.Enrollments)
                    .HasForeignKey(e => e.CourseId)
                    .OnDelete(DeleteBehavior.Cascade);
            });



            modelBuilder.Entity<Consultation>(entity =>
            {
                entity.HasIndex(e => e.TeacherId);
                entity.HasIndex(e => e.StudentId);
                entity.HasIndex(e => e.CourseId);
                entity.HasIndex(e => e.ScheduledAt);

                entity.HasOne(c => c.Teacher)
                    .WithMany(u => u.Consultations)
                    .HasForeignKey(c => c.TeacherId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(c => c.Student)
                    .WithMany()
                    .HasForeignKey(c => c.StudentId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(c => c.Course)
                    .WithMany()
                    .HasForeignKey(c => c.CourseId)
                    .OnDelete(DeleteBehavior.Restrict);
            });



            SeedData(modelBuilder);
        }

        private void SeedData(ModelBuilder modelBuilder)
        {
            var adminUser = new User
            {
                Id = 1,
                Email = "admin@learningplatform.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
                FirstName = "System",
                LastName = "Administrator",
                Role = UserRole.ADMIN,
                CreatedAt = DateTime.UtcNow
            };

            modelBuilder.Entity<User>().HasData(adminUser);
        }
    }
}
