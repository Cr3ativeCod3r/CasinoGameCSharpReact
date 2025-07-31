using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddCrashHistory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CrashHistories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    CrashedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    CrashPoint = table.Column<double>(type: "double", nullable: false),
                    TotalBets = table.Column<int>(type: "int", nullable: false),
                    TotalBetAmount = table.Column<decimal>(type: "decimal(65,30)", nullable: false),
                    TotalWithdrawals = table.Column<int>(type: "int", nullable: false),
                    TotalProfit = table.Column<decimal>(type: "decimal(65,30)", nullable: false),
                    BetsJson = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CrashHistories", x => x.Id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_CrashHistories_CrashedAt",
                table: "CrashHistories",
                column: "CrashedAt",
                descending: new bool[0]);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CrashHistories");
        }
    }
}
