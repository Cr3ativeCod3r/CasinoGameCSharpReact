using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using backend.Models;

namespace backend.Data
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<Message> Messages { get; set; }
        public DbSet<CrashHistory> CrashHistories { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);
            builder.Entity<Message>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Content).IsRequired().HasMaxLength(500);
                entity.Property(e => e.UserNick).IsRequired().HasMaxLength(50);
                entity.Property(e => e.CreatedAt).IsRequired();
                entity.HasOne(e => e.User)
                      .WithMany()
                      .HasForeignKey(e => e.UserId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(e => e.CreatedAt);
            });

            builder.Entity<CrashHistory>(entity =>
{
    entity.HasKey(e => e.Id);
    entity.Property(e => e.CrashedAt).IsRequired();
    entity.Property(e => e.CrashPoint).IsRequired();
    entity.Property(e => e.BetsJson).HasColumnType("longtext");
    entity.HasIndex(e => e.CrashedAt).IsDescending();
});
        }


    }
}