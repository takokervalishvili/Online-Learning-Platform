using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Backend.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class UploadController : ControllerBase
    {
        private readonly ILogger<UploadController> _logger;
        private readonly IWebHostEnvironment _environment;
        private const long MaxFileSize = 524288000; // 500 MB
        private static readonly string[] AllowedVideoExtensions = { ".mp4", ".avi", ".mov", ".wmv", ".flv", ".webm", ".mkv" };
        private static readonly string[] AllowedDocumentExtensions = { ".pdf", ".doc", ".docx", ".ppt", ".pptx", ".txt" };

        public UploadController(ILogger<UploadController> logger, IWebHostEnvironment environment)
        {
            _logger = logger;
            _environment = environment;
        }

        private int GetCurrentUserId()
        {
            return int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        }

        private string GetCurrentUserRole()
        {
            return User.FindFirst(ClaimTypes.Role)?.Value ?? string.Empty;
        }

        [HttpPost("video")]
        [Authorize(Roles = "TEACHER,ADMIN")]
        [RequestSizeLimit(524288000)] // 500MB
        [RequestFormLimits(MultipartBodyLengthLimit = 524288000)]
        public async Task<ActionResult<UploadResultDto>> UploadVideo(IFormFile file)
        {
            try
            {
                if (file == null || file.Length == 0)
                {
                    return BadRequest(new { message = "No file uploaded" });
                }

                if (file.Length > MaxFileSize)
                {
                    return BadRequest(new { message = $"File size exceeds maximum allowed size of {MaxFileSize / (1024 * 1024)} MB" });
                }

                var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
                if (!AllowedVideoExtensions.Contains(extension))
                {
                    return BadRequest(new { message = $"Invalid file type. Allowed types: {string.Join(", ", AllowedVideoExtensions)}" });
                }

                var userId = GetCurrentUserId();
                var uploadsFolder = Path.Combine(_environment.ContentRootPath, "uploads", "videos", userId.ToString());

                if (!Directory.Exists(uploadsFolder))
                {
                    Directory.CreateDirectory(uploadsFolder);
                }

                var uniqueFileName = $"{Guid.NewGuid()}{extension}";
                var filePath = Path.Combine(uploadsFolder, uniqueFileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                var relativePath = $"/uploads/videos/{userId}/{uniqueFileName}";

                _logger.LogInformation($"Video uploaded successfully by user {userId}: {relativePath}");

                return Ok(new UploadResultDto
                {
                    FileName = file.FileName,
                    FilePath = relativePath,
                    FileSize = file.Length,
                    FileType = extension,
                    UploadedAt = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading video");
                return StatusCode(500, new { message = "An error occurred while uploading the video" });
            }
        }

        [HttpPost("document")]
        [Authorize(Roles = "TEACHER,ADMIN")]
        [RequestSizeLimit(104857600)] // 100 MB
        public async Task<ActionResult<UploadResultDto>> UploadDocument(IFormFile file)
        {
            try
            {
                if (file == null || file.Length == 0)
                {
                    return BadRequest(new { message = "No file uploaded" });
                }

                if (file.Length > 104857600) // 100 MB for documents
                {
                    return BadRequest(new { message = "File size exceeds maximum allowed size of 100 MB" });
                }

                var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
                if (!AllowedDocumentExtensions.Contains(extension))
                {
                    return BadRequest(new { message = $"Invalid file type. Allowed types: {string.Join(", ", AllowedDocumentExtensions)}" });
                }

                var userId = GetCurrentUserId();
                var uploadsFolder = Path.Combine(_environment.ContentRootPath, "uploads", "documents", userId.ToString());

                if (!Directory.Exists(uploadsFolder))
                {
                    Directory.CreateDirectory(uploadsFolder);
                }

                var uniqueFileName = $"{Guid.NewGuid()}{extension}";
                var filePath = Path.Combine(uploadsFolder, uniqueFileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                var relativePath = $"/uploads/documents/{userId}/{uniqueFileName}";

                _logger.LogInformation($"Document uploaded successfully by user {userId}: {relativePath}");

                return Ok(new UploadResultDto
                {
                    FileName = file.FileName,
                    FilePath = relativePath,
                    FileSize = file.Length,
                    FileType = extension,
                    UploadedAt = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading document");
                return StatusCode(500, new { message = "An error occurred while uploading the document" });
            }
        }

        [HttpPost("attachment")]
        [RequestSizeLimit(52428800)] // 50 MB
        public async Task<ActionResult<UploadResultDto>> UploadAttachment(IFormFile file)
        {
            try
            {
                if (file == null || file.Length == 0)
                {
                    return BadRequest(new { message = "No file uploaded" });
                }

                if (file.Length > 52428800) // 50 MB for attachments
                {
                    return BadRequest(new { message = "File size exceeds maximum allowed size of 50 MB" });
                }

                var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
                var allowedExtensions = AllowedDocumentExtensions.Concat(AllowedVideoExtensions).Concat(new[] { ".jpg", ".jpeg", ".png", ".gif", ".zip", ".rar" }).ToArray();

                if (!allowedExtensions.Contains(extension))
                {
                    return BadRequest(new { message = "Invalid file type" });
                }

                var userId = GetCurrentUserId();
                var uploadsFolder = Path.Combine(_environment.ContentRootPath, "uploads", "attachments", userId.ToString());

                if (!Directory.Exists(uploadsFolder))
                {
                    Directory.CreateDirectory(uploadsFolder);
                }

                var uniqueFileName = $"{Guid.NewGuid()}{extension}";
                var filePath = Path.Combine(uploadsFolder, uniqueFileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                var relativePath = $"/uploads/attachments/{userId}/{uniqueFileName}";

                _logger.LogInformation($"Attachment uploaded successfully by user {userId}: {relativePath}");

                return Ok(new UploadResultDto
                {
                    FileName = file.FileName,
                    FilePath = relativePath,
                    FileSize = file.Length,
                    FileType = extension,
                    UploadedAt = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading attachment");
                return StatusCode(500, new { message = "An error occurred while uploading the attachment" });
            }
        }

        [HttpDelete]
        [Authorize(Roles = "TEACHER,ADMIN")]
        public ActionResult DeleteFile([FromQuery] string filePath)
        {
            try
            {
                if (string.IsNullOrEmpty(filePath))
                {
                    return BadRequest(new { message = "File path is required" });
                }

                var userId = GetCurrentUserId();
                var normalizedPath = filePath.Replace("/", Path.DirectorySeparatorChar.ToString());
                var fullPath = Path.Combine(_environment.ContentRootPath, normalizedPath.TrimStart(Path.DirectorySeparatorChar));

                // Security check: ensure the file belongs to the current user
                if (!fullPath.Contains(Path.Combine("uploads")) || !fullPath.Contains(userId.ToString()))
                {
                    return Forbid();
                }

                if (!System.IO.File.Exists(fullPath))
                {
                    return NotFound(new { message = "File not found" });
                }

                System.IO.File.Delete(fullPath);

                _logger.LogInformation($"File deleted by user {userId}: {filePath}");

                return Ok(new { message = "File deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting file");
                return StatusCode(500, new { message = "An error occurred while deleting the file" });
            }
        }

        [HttpGet("download")]
        [Authorize]
        public IActionResult DownloadFile([FromQuery] string filePath)
        {
            try
            {
                if (string.IsNullOrEmpty(filePath))
                {
                    return BadRequest(new { message = "File path is required" });
                }

                var normalizedPath = filePath.Replace("/", Path.DirectorySeparatorChar.ToString());
                var fullPath = Path.Combine(_environment.ContentRootPath, normalizedPath.TrimStart(Path.DirectorySeparatorChar));

                if (!System.IO.File.Exists(fullPath))
                {
                    return NotFound(new { message = "File not found" });
                }

                // Security check: ensure the file is in uploads directory
                var uploadsPath = Path.Combine(_environment.ContentRootPath, "uploads");
                if (!fullPath.StartsWith(uploadsPath))
                {
                    return Forbid();
                }

                var fileName = Path.GetFileName(fullPath);
                var contentType = GetContentType(Path.GetExtension(fullPath));

                var fileBytes = System.IO.File.ReadAllBytes(fullPath);
                return File(fileBytes, contentType, fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error downloading file: {FilePath}", filePath);
                return StatusCode(500, new { message = "An error occurred while downloading the file" });
            }
        }

        private string GetContentType(string extension)
        {
            return extension.ToLowerInvariant() switch
            {
                ".pdf" => "application/pdf",
                ".doc" => "application/msword",
                ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                ".ppt" => "application/vnd.ms-powerpoint",
                ".pptx" => "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                ".txt" => "text/plain",
                ".mp4" => "video/mp4",
                ".avi" => "video/avi",
                ".mov" => "video/quicktime",
                ".wmv" => "video/x-ms-wmv",
                ".flv" => "video/x-flv",
                ".webm" => "video/webm",
                ".mkv" => "video/x-matroska",
                ".jpg" or ".jpeg" => "image/jpeg",
                ".png" => "image/png",
                ".gif" => "image/gif",
                ".zip" => "application/zip",
                ".rar" => "application/x-rar-compressed",
                _ => "application/octet-stream"
            };
        }

        [Authorize]
        [HttpGet("files")]
        public ActionResult<object> GetUploadedFiles([FromQuery] string? type = null)
        {
            try
            {
                var role = GetCurrentUserRole();
                if (role != "TEACHER" && role != "ADMIN")
                {
                    return Forbid();
                }

                var userId = GetCurrentUserId();
                var uploadsFolder = Path.Combine(_environment.ContentRootPath, "uploads");

                if (!Directory.Exists(uploadsFolder))
                {
                    return Ok(new { files = new List<object>() });
                }

                var files = new List<object>();
                var types = string.IsNullOrEmpty(type)
                    ? new[] { "videos", "documents", "attachments" }
                    : new[] { type.ToLower() };

                foreach (var fileType in types)
                {
                    var typeFolder = Path.Combine(uploadsFolder, fileType, userId.ToString());
                    if (Directory.Exists(typeFolder))
                    {
                        var directoryInfo = new DirectoryInfo(typeFolder);
                        var typeFiles = directoryInfo.GetFiles()
                            .Select(f => new
                            {
                                fileName = f.Name,
                                originalFileName = f.Name,
                                fileUrl = $"/uploads/{fileType}/{userId}/{f.Name}",
                                fileSize = f.Length,
                                uploadedAt = f.CreationTimeUtc,
                                type = fileType
                            })
                            .OrderByDescending(f => f.uploadedAt)
                            .ToList();

                        files.AddRange(typeFiles);
                    }
                }

                return Ok(new { files });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting uploaded files");
                return StatusCode(500, new { message = "An error occurred while retrieving files" });
            }
        }
    }

    public class UploadResultDto
    {
        public string FileName { get; set; } = string.Empty;
        public string FilePath { get; set; } = string.Empty;
        public long FileSize { get; set; }
        public string FileType { get; set; } = string.Empty;
        public DateTime UploadedAt { get; set; }
    }
}
