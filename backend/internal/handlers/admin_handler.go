package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/username/ramadhan-ceria-backend/internal/database"
	"github.com/username/ramadhan-ceria-backend/internal/models"
)

func GetAllFamilies(c *fiber.Ctx) error {
	var families []models.Family
	if err := database.DB.Preload("Users").Find(&families).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Database error"})
	}
	return c.JSON(families)
}

func UpdateFamilyPlan(c *fiber.Ctx) error {
	id := c.Params("id")

	type PlanRequest struct {
		Plan string `json:"plan"`
	}
	var req PlanRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	var family models.Family
	if err := database.DB.First(&family, "id = ?", id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Family not found"})
	}

	family.Plan = req.Plan
	if err := database.DB.Save(&family).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not update plan"})
	}

	return c.JSON(family)
}
