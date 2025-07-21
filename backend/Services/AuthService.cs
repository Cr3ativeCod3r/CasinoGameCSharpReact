using Microsoft.AspNetCore.Identity;
using backend.DTOs;
using backend.Models;

namespace backend.Services
{
    public class AuthService : IAuthService
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly IJwtService _jwtService;

        public AuthService(
            UserManager<ApplicationUser> userManager,
            SignInManager<ApplicationUser> signInManager,
            IJwtService jwtService)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _jwtService = jwtService;
        }

        public async Task<AuthResponseDto> RegisterAsync(RegisterDto registerDto)
        {
            try
            {
                // Sprawdź czy użytkownik już istnieje
                if (await UserExistsAsync(registerDto.Email))
                {
                    return new AuthResponseDto
                    {
                        IsSuccess = false,
                        Message = "Użytkownik z tym adresem email już istnieje."
                    };
                }

                // Utwórz nowego użytkownika
                var user = new ApplicationUser
                {
                    UserName = registerDto.Email,
                    Email = registerDto.Email,
                    NickName = registerDto.NickName
                };

                var result = await _userManager.CreateAsync(user, registerDto.Password);

                if (result.Succeeded)
                {
                    var token = _jwtService.GenerateToken(user);
                    var refreshToken = _jwtService.GenerateRefreshToken();

                    return new AuthResponseDto
                    {
                        IsSuccess = true,
                        Message = "Rejestracja zakończona pomyślnie.",
                        Token = token,
                        RefreshToken = refreshToken,
                        ExpiresAt = DateTime.UtcNow.AddMinutes(60),
                        User = new { Id = user.Id, NickName = user.NickName }
                    };
                }

                return new AuthResponseDto
                {
                    IsSuccess = false,
                    Message = string.Join(", ", result.Errors.Select(e => e.Description))
                };
            }
            catch (Exception ex)
            {
                return new AuthResponseDto
                {
                    IsSuccess = false,
                    Message = $"Wystąpił błąd podczas rejestracji: {ex.Message}"
                };
            }
        }

        public async Task<AuthResponseDto> LoginAsync(LoginDto loginDto)
        {
            try
            {
                var user = await _userManager.FindByEmailAsync(loginDto.Email);
                if (user == null)
                {
                    return new AuthResponseDto
                    {
                        IsSuccess = false,
                        Message = "Nieprawidłowy email lub hasło."
                    };
                }

                var result = await _signInManager.CheckPasswordSignInAsync(user, loginDto.Password, false);
                
                if (result.Succeeded)
                {
                    var token = _jwtService.GenerateToken(user);
                    var refreshToken = _jwtService.GenerateRefreshToken();

                    return new AuthResponseDto
                    {
                        IsSuccess = true,
                        Message = "Logowanie zakończone pomyślnie.",
                        Token = token,
                        RefreshToken = refreshToken,
                        ExpiresAt = DateTime.UtcNow.AddMinutes(60),
                        User = new { Id = user.Id, NickName = user.NickName }
                    };
                }

                return new AuthResponseDto
                {
                    IsSuccess = false,
                    Message = "Nieprawidłowy email lub hasło."
                };
            }
            catch (Exception ex)
            {
                return new AuthResponseDto
                {
                    IsSuccess = false,
                    Message = $"Wystąpił błąd podczas logowania: {ex.Message}"
                };
            }
        }

        public async Task<bool> UserExistsAsync(string email)
        {
            return await _userManager.FindByEmailAsync(email) != null;
        }
    }
}