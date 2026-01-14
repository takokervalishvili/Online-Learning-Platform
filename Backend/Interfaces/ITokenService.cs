using Backend.Models;

namespace Backend.Interfaces
{
    public interface ITokenService
    {
        string GenerateToken(User user);
        int? ValidateToken(string token);
    }
}
