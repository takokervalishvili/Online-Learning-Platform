using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.DTOs;
using Backend.Models;
using System.Security.Claims;

namespace Backend.Controllers
{
    [Route("api/users")]
    [ApiController]
    [Authorize(Roles = "ADMIN")]
    public class UsersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<UsersController> _logger;

        public UsersController(ApplicationDbContext context, ILogger<UsersController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<List<UserDto>>> GetUsers([FromQuery] string? role, [FromQuery] string? searchTerm)
        {
            try
            {
                var query = _context.Users.AsQueryable();

                if (!string.IsNullOrEmpty(role) && Enum.TryParse<UserRole>(role, out var userRole))
                {
                    query = query.Where(u => u.Role == userRole);
                }

                if (!string.IsNullOrEmpty(searchTerm))
                {
                    query = query.Where(u =>
                        u.FirstName.Contains(searchTerm) ||
                        u.LastName.Contains(searchTerm) ||
                        u.Email.Contains(searchTerm));
                }

                var users = await query
                    .OrderBy(u => u.LastName)
                    .ThenBy(u => u.FirstName)
                    .Select(u => new UserDto
                    {
                        Id = u.Id,
                        Email = u.Email,
                        FirstName = u.FirstName,
                        LastName = u.LastName,
                        FullName = u.FirstName + " " + u.LastName,
                        Role = u.Role,
                        Avatar = u.Avatar,
                        CreatedAt = u.CreatedAt
                    })
                    .ToListAsync();

                return Ok(users);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting users");
                return StatusCode(500, new { message = "An error occurred while retrieving users" });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<UserDto>> GetUser(int id)
        {
            try
            {
                var user = await _context.Users.FindAsync(id);

                if (user == null)
                {
                    return NotFound(new { message = "User not found" });
                }

                var userDto = new UserDto
                {
                    Id = user.Id,
                    Email = user.Email,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    FullName = user.FullName,
                    Role = user.Role,
                    Avatar = user.Avatar,
                    CreatedAt = user.CreatedAt
                };

                return Ok(userDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user {UserId}", id);
                return StatusCode(500, new { message = "An error occurred while retrieving the user" });
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<UserDto>> UpdateUser(int id, [FromBody] UpdateProfileDto dto)
        {
            try
            {
                var user = await _context.Users.FindAsync(id);

                if (user == null)
                {
                    return NotFound(new { message = "User not found" });
                }

                user.FirstName = dto.FirstName;
                user.LastName = dto.LastName;
                user.Avatar = dto.Avatar;

                await _context.SaveChangesAsync();

                var userDto = new UserDto
                {
                    Id = user.Id,
                    Email = user.Email,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    FullName = user.FullName,
                    Role = user.Role,
                    Avatar = user.Avatar,
                    CreatedAt = user.CreatedAt
                };

                return Ok(userDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating user {UserId}", id);
                return StatusCode(500, new { message = "An error occurred while updating the user" });
            }
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteUser(int id)
        {
            try
            {
                var currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

                if (id == currentUserId)
                {
                    return BadRequest(new { message = "You cannot delete your own account" });
                }

                var user = await _context.Users.FindAsync(id);

                if (user == null)
                {
                    return NotFound(new { message = "User not found" });
                }

                _context.Users.Remove(user);
                await _context.SaveChangesAsync();

                return Ok(new { message = "User deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting user {UserId}", id);
                return StatusCode(500, new { message = "An error occurred while deleting the user" });
            }
        }

        [HttpGet("statistics")]
        public async Task<ActionResult<object>> GetUserStatistics()
        {
            try
            {
                var totalUsers = await _context.Users.CountAsync();
                var totalStudents = await _context.Users.CountAsync(u => u.Role == UserRole.STUDENT);
                var totalTeachers = await _context.Users.CountAsync(u => u.Role == UserRole.TEACHER);
                var totalAdmins = await _context.Users.CountAsync(u => u.Role == UserRole.ADMIN);

                var usersByMonth = await _context.Users
                    .GroupBy(u => new { u.CreatedAt.Year, u.CreatedAt.Month })
                    .Select(g => new
                    {
                        Year = g.Key.Year,
                        Month = g.Key.Month,
                        Count = g.Count()
                    })
                    .OrderByDescending(x => x.Year)
                    .ThenByDescending(x => x.Month)
                    .Take(12)
                    .ToListAsync();

                return Ok(new
                {
                    totalUsers,
                    totalStudents,
                    totalTeachers,
                    totalAdmins,
                    usersByMonth
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user statistics");
                return StatusCode(500, new { message = "An error occurred while retrieving statistics" });
            }
        }
    }
}
