using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs
{


    public class ConsultationDto
    {
        public int Id { get; set; }
        public int TeacherId { get; set; }
        public string TeacherName { get; set; } = string.Empty;
        public int StudentId { get; set; }
        public string StudentName { get; set; } = string.Empty;
        public int CourseId { get; set; }
        public string CourseTitle { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DateTime ScheduledAt { get; set; }
        public int DurationMinutes { get; set; }
        public bool IsCancelled { get; set; }
        public bool IsCompleted { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? MeetingLink { get; set; }
    }

    public class CreateConsultationDto
    {
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

        [Range(15, 240)]
        public int DurationMinutes { get; set; } = 60;

        public string? MeetingLink { get; set; }
    }

    public class UpdateConsultationDto
    {
        [Required]
        [MaxLength(255)]
        public string Title { get; set; } = string.Empty;

        public string? Description { get; set; }

        [Required]
        public DateTime ScheduledAt { get; set; }

        [Range(15, 240)]
        public int DurationMinutes { get; set; }

        public string? MeetingLink { get; set; }

        public bool? IsCancelled { get; set; }

        public bool? IsCompleted { get; set; }
    }

    public class DashboardStatsDto
    {
        public int TotalUsers { get; set; }
        public int TotalStudents { get; set; }
        public int TotalTeachers { get; set; }
        public int TotalCourses { get; set; }
        public int PublishedCourses { get; set; }
        public int PendingApprovalCourses { get; set; }
        public int TotalEnrollments { get; set; }
        public int ActiveEnrollments { get; set; }
        public int TotalAssignments { get; set; }
        public int TotalSubmissions { get; set; }
        public int GradedSubmissions { get; set; }
        public decimal TotalRevenue { get; set; }
        public decimal MonthlyRevenue { get; set; }
    }

    public class TeacherStatsDto
    {
        public int TotalCourses { get; set; }
        public int PublishedCourses { get; set; }
        public int DraftCourses { get; set; }
        public int TotalStudents { get; set; }
        public int TotalLessons { get; set; }
        public int TotalAssignments { get; set; }
        public int PendingGrading { get; set; }
        public int UpcomingConsultations { get; set; }
        public double? AverageRating { get; set; }
        public List<CourseStatsDto> TopCourses { get; set; } = new List<CourseStatsDto>();
    }

    public class StudentStatsDto
    {
        public int EnrolledCourses { get; set; }
        public int CompletedCourses { get; set; }
        public int InProgressCourses { get; set; }
        public int TotalAssignments { get; set; }
        public int CompletedAssignments { get; set; }
        public int PendingAssignments { get; set; }
        public double? AverageScore { get; set; }
        public decimal TotalSpent { get; set; }
        public List<CourseProgressDto> CourseProgress { get; set; } = new List<CourseProgressDto>();
    }

    public class CourseStatsDto
    {
        public int CourseId { get; set; }
        public string CourseTitle { get; set; } = string.Empty;
        public int EnrolledStudents { get; set; }
        public int CompletedStudents { get; set; }
        public double? AverageRating { get; set; }
        public double? AverageProgress { get; set; }
        public decimal Revenue { get; set; }
    }

    public class CourseProgressDto
    {
        public int CourseId { get; set; }
        public string CourseTitle { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public decimal Progress { get; set; }
        public DateTime EnrolledAt { get; set; }
        public int CompletedAssignments { get; set; }
        public int TotalAssignments { get; set; }
        public double? AverageScore { get; set; }
    }

    public class FinancialReportDto
    {
        public decimal TotalRevenue { get; set; }
        public decimal MonthlyRevenue { get; set; }
        public decimal YearlyRevenue { get; set; }
        public int TotalEnrollments { get; set; }
        public int MonthlyEnrollments { get; set; }
        public int YearlyEnrollments { get; set; }
        public List<RevenueByMonthDto> RevenueByMonth { get; set; } = new List<RevenueByMonthDto>();
        public List<RevenueByTeacherDto> RevenueByTeacher { get; set; } = new List<RevenueByTeacherDto>();
        public List<RevenueByCategory> RevenueByCategory { get; set; } = new List<RevenueByCategory>();
        public List<TopSellingCourseDto> TopSellingCourses { get; set; } = new List<TopSellingCourseDto>();
    }

    public class RevenueByMonthDto
    {
        public int Year { get; set; }
        public int Month { get; set; }
        public string MonthName { get; set; } = string.Empty;
        public decimal Revenue { get; set; }
        public int Enrollments { get; set; }
    }

    public class RevenueByTeacherDto
    {
        public int TeacherId { get; set; }
        public string TeacherName { get; set; } = string.Empty;
        public int TotalCourses { get; set; }
        public int TotalEnrollments { get; set; }
        public decimal TotalRevenue { get; set; }
    }

    public class RevenueByCategory
    {
        public string Category { get; set; } = string.Empty;
        public int TotalCourses { get; set; }
        public int TotalEnrollments { get; set; }
        public decimal TotalRevenue { get; set; }
    }

    public class TopSellingCourseDto
    {
        public int CourseId { get; set; }
        public string CourseTitle { get; set; } = string.Empty;
        public string TeacherName { get; set; } = string.Empty;
        public int Enrollments { get; set; }
        public decimal Revenue { get; set; }
    }

    public class FileUploadDto
    {
        public string FileName { get; set; } = string.Empty;
        public string FilePath { get; set; } = string.Empty;
        public string FileUrl { get; set; } = string.Empty;
        public long FileSize { get; set; }
        public string ContentType { get; set; } = string.Empty;
    }

    public class CourseSearchDto
    {
        public string? SearchTerm { get; set; }
        public string? Category { get; set; }
        public decimal? MinPrice { get; set; }
        public decimal? MaxPrice { get; set; }
        public int? MinDuration { get; set; }
        public int? MaxDuration { get; set; }
        public string? SortBy { get; set; }
        public string? SortOrder { get; set; }
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }

    public class PagedResultDto<T>
    {
        public List<T> Items { get; set; } = new List<T>();
        public int TotalCount { get; set; }
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
        public bool HasPreviousPage { get; set; }
        public bool HasNextPage { get; set; }
    }
}
