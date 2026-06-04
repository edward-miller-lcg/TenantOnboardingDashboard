using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LantanaGroup.Link.OnboardingService.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "dbo");

            migrationBuilder.CreateTable(
                name: "OnboardingSessions",
                schema: "dbo",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Token = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    NhsnOrgId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    HealthSystemName = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    FacilityId = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    EhrVendor = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CompletedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OnboardingSessions", x => x.Id)
                        .Annotation("SqlServer:Clustered", false);
                });

            migrationBuilder.CreateTable(
                name: "OnboardingFormData",
                schema: "dbo",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SessionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FieldKey = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    FieldValue = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OnboardingFormData", x => x.Id)
                        .Annotation("SqlServer:Clustered", false);
                    table.ForeignKey(
                        name: "FK_OnboardingFormData_OnboardingSessions_SessionId",
                        column: x => x.SessionId,
                        principalSchema: "dbo",
                        principalTable: "OnboardingSessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "OnboardingStepProgress",
                schema: "dbo",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SessionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    StepName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    IsCompleted = table.Column<bool>(type: "bit", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OnboardingStepProgress", x => x.Id)
                        .Annotation("SqlServer:Clustered", false);
                    table.ForeignKey(
                        name: "FK_OnboardingStepProgress_OnboardingSessions_SessionId",
                        column: x => x.SessionId,
                        principalSchema: "dbo",
                        principalTable: "OnboardingSessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_OnboardingFormData_SessionId",
                schema: "dbo",
                table: "OnboardingFormData",
                column: "SessionId");

            migrationBuilder.CreateIndex(
                name: "IX_OnboardingSessions_Token",
                schema: "dbo",
                table: "OnboardingSessions",
                column: "Token",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OnboardingStepProgress_SessionId",
                schema: "dbo",
                table: "OnboardingStepProgress",
                column: "SessionId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "OnboardingFormData",
                schema: "dbo");

            migrationBuilder.DropTable(
                name: "OnboardingStepProgress",
                schema: "dbo");

            migrationBuilder.DropTable(
                name: "OnboardingSessions",
                schema: "dbo");
        }
    }
}
