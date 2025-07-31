using backend.Models;

namespace backend.Services
{
    public interface IJwtService
    {
        string GenerateToken(ApplicationUser user);
        string GenerateRefreshToken();
        bool ValidateToken(string token);
    }
}