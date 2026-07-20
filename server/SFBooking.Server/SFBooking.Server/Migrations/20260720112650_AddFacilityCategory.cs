using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SFBooking.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddFacilityCategory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Category",
                table: "Facilities",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Category",
                table: "Facilities");
        }
    }
}
