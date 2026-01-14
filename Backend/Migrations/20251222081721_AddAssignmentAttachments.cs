using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddAssignmentAttachments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Attachments",
                table: "Assignments",
                type: "TEXT",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2025, 12, 22, 8, 17, 21, 239, DateTimeKind.Utc).AddTicks(8465), "$2a$11$mDN3x9h8pImhYm5emndE0eBCOA/F.ez/c.lnnna7GCodNolIQ5FLm" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Attachments",
                table: "Assignments");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2025, 12, 22, 7, 54, 13, 621, DateTimeKind.Utc).AddTicks(3116), "$2a$11$xqRlT/GWme27bvovASmU/OAW/uYaY32D8R0NW9Q1oDF.4ZRniB1Wi" });
        }
    }
}
