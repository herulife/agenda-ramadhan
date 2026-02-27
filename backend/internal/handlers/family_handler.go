package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/username/ramadhan-ceria-backend/internal/database"
	"github.com/username/ramadhan-ceria-backend/internal/models"
)

type UpdateFamilyRequest struct {
	Title string `json:"title"`
}

func GetFamilySettings(c *fiber.Ctx) error {
	familyID := c.Locals("familyID").(string)

	var family models.Family
	if err := database.DB.First(&family, "id = ?", familyID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Family not found"})
	}
	return c.JSON(family)
}

func UpdateFamilySettings(c *fiber.Ctx) error {
	familyID := c.Locals("familyID").(string)

	var req UpdateFamilyRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	var family models.Family
	if err := database.DB.First(&family, "id = ?", familyID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Family not found"})
	}

	family.Name = req.Title
	if err := database.DB.Save(&family).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not update family"})
	}
	return c.JSON(family)
}
