// CrashGameHub.cs
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using backend.Services;
using backend.Models;
using backend.Data;

namespace backend.Hubs
{
    // [Authorize]
    public partial class CrashGameHub : Hub
    {
        private readonly ICrashGameService _crashGameService;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ILogger<CrashGameHub> _logger;
        private readonly ApplicationDbContext _context;

        public CrashGameHub(
            ICrashGameService crashGameService,
            UserManager<ApplicationUser> userManager,
            ILogger<CrashGameHub> logger,
            ApplicationDbContext context)
        {
            _crashGameService = crashGameService;
            _userManager = userManager;
            _logger = logger;
            _context = context;
        }
    }
}