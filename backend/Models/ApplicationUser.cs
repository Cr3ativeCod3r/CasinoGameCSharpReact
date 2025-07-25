using Microsoft.AspNetCore.Identity;

namespace backend.Models
{
    public class ApplicationUser : IdentityUser
    {
        public string? NickName { get; set; }
        public decimal Balance { get; set; } = 0;
    }
}