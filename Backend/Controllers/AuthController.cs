using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.DTOs;
using Backend.Models;
using Backend.Interfaces;
using System.Security.Claims;

namespace Backend.Controllers
{
    [Route("api/auth")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ITokenService _tokenService;
        private readonly ILogger<AuthController> _logger;

        public AuthController(
            ApplicationDbContext context,
            ITokenService tokenService,
            ILogger<AuthController> logger)
        {
            _context = context;
            _tokenService = tokenService;
            _logger = logger;
        }

        [HttpPost("register")]
        public async Task<ActionResult<AuthResponseDto>> Register([FromBody] RegisterDto dto)
        {
            try
            {
                // Check if user already exists
                if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
                {
                    return BadRequest(new { message = "User with this email already exists" });
                }

                // Create new user
                var user = new User
                {
                    Email = dto.Email,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                    FirstName = dto.FirstName,
                    LastName = dto.LastName,
                    Role = dto.Role,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                // Generate token
                var token = _tokenService.GenerateToken(user);

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

                return Ok(new AuthResponseDto
                {
                    Token = token,
                    User = userDto
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during user registration");
                return StatusCode(500, new { message = "An error occurred during registration" });
            }
        }

        [HttpPost("login")]
        public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginDto dto)
        {
            try
            {
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email == dto.Email);

                if (user == null)
                {
                    return Unauthorized(new { message = "Invalid email or password" });
                }

                // Verify password
                if (!BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
                {
                    return Unauthorized(new { message = "Invalid email or password" });
                }

                // Generate token
                var token = _tokenService.GenerateToken(user);

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

                return Ok(new AuthResponseDto
                {
                    Token = token,
                    User = userDto
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during login");
                return StatusCode(500, new { message = "An error occurred during login" });
            }
        }

        [HttpPost("reset-password")]
        public async Task<ActionResult> RequestPasswordReset([FromBody] ResetPasswordRequestDto dto)
        {
            try
            {
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email == dto.Email);

                if (user == null)
                {
                    // Don't reveal that user doesn't exist
                    return Ok(new { message = "If the email exists, a password reset link has been sent" });
                }

                // Generate reset token
                var resetToken = Guid.NewGuid().ToString();
                user.PasswordResetToken = resetToken;
                user.PasswordResetExpiry = DateTime.UtcNow.AddHours(1);

                await _context.SaveChangesAsync();

                return Ok(new { message = "If the email exists, a password reset link has been sent" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during password reset request");
                return StatusCode(500, new { message = "An error occurred" });
            }
        }

        [HttpPost("reset-password/confirm")]
        public async Task<ActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
        {
            try
            {
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email == dto.Email && u.PasswordResetToken == dto.Token);

                if (user == null)
                {
                    return BadRequest(new { message = "Invalid or expired reset token" });
                }

                if (user.PasswordResetExpiry == null || user.PasswordResetExpiry < DateTime.UtcNow)
                {
                    return BadRequest(new { message = "Reset token has expired" });
                }

                // Update password
                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
                user.PasswordResetToken = null;
                user.PasswordResetExpiry = null;

                await _context.SaveChangesAsync();

                return Ok(new { message = "Password has been reset successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during password reset");
                return StatusCode(500, new { message = "An error occurred" });
            }
        }

        [Authorize]
        [HttpPost("change-password")]
        public async Task<ActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var user = await _context.Users.FindAsync(userId);

                if (user == null)
                {
                    return NotFound(new { message = "User not found" });
                }

                // Verify current password
                if (!BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, user.PasswordHash))
                {
                    return BadRequest(new { message = "Current password is incorrect" });
                }

                // Update password
                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Password changed successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during password change");
                return StatusCode(500, new { message = "An error occurred" });
            }
        }

        [Authorize]
        [HttpGet("me")]
        public async Task<ActionResult<UserDto>> GetCurrentUser()
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var user = await _context.Users.FindAsync(userId);

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
                _logger.LogError(ex, "Error getting current user");
                return StatusCode(500, new { message = "An error occurred" });
            }
        }

        [Authorize]
        [HttpPut("profile")]
        public async Task<ActionResult<UserDto>> UpdateProfile([FromBody] UpdateProfileDto dto)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var user = await _context.Users.FindAsync(userId);

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
                _logger.LogError(ex, "Error updating profile");
                return StatusCode(500, new { message = "An error occurred" });
            }
        }
    }
}
