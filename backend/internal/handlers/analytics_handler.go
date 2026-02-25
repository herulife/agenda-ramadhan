package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/username/ramadhan-ceria-backend/internal/database"
	"github.com/username/ramadhan-ceria-backend/internal/models"
)

func GetAnalytics(c *fiber.Ctx) error {
	familyID := c.Locals("familyID").(string)

	var family models.Family
	if err := database.DB.First(&family, "id = ?", familyID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Family not found"})
	}

	if family.Plan != "PREMIUM" {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Analytics is a PREMIUM feature. Please upgrade your plan."})
	}

	// Example simplified analytics aggregation
	var totalTasks int64
	var totalRewards int64
	var totalChildren int64

	database.DB.Model(&models.Task{}).Where("family_id = ?", familyID).Count(&totalTasks)
	database.DB.Model(&models.Reward{}).Where("family_id = ?", familyID).Count(&totalRewards)
	database.DB.Model(&models.User{}).Where("family_id = ? AND role = 'child'", familyID).Count(&totalChildren)

	return c.JSON(fiber.Map{
		"message": "Premium Analytics Retrieved",
		"data": fiber.Map{
			"total_tasks":    totalTasks,
			"total_rewards":  totalRewards,
			"total_children": totalChildren,
		},
	})
}
