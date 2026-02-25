package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/username/ramadhan-ceria-backend/internal/database"
	"github.com/username/ramadhan-ceria-backend/internal/models"
)

func GetBalance(c *fiber.Ctx) error {
	childID := c.Params("childId")

	var totalPoints int64
	err := database.DB.Model(&models.DailyLog{}).
		Joins("JOIN tasks ON tasks.id = daily_logs.task_id").
		Where("daily_logs.child_id = ? AND daily_logs.status = 'verified'", childID).
		Select("COALESCE(SUM(daily_logs.quantity * tasks.points), 0)").
		Scan(&totalPoints).Error
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Database error"})
	}

	var spentPoints int64
	err = database.DB.Model(&models.Redemption{}).
		Where("child_id = ? AND status = 'approved'", childID).
		Select("COALESCE(SUM(points_spent), 0)").
		Scan(&spentPoints).Error
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Database error"})
	}

	// Include pending as spent for current available balance query? Usually yes for child UX.
	var pendingSpentPoints int64
	err = database.DB.Model(&models.Redemption{}).
		Where("child_id = ? AND status = 'pending'", childID).
		Select("COALESCE(SUM(points_spent), 0)").
		Scan(&pendingSpentPoints).Error
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Database error"})
	}

	balance := totalPoints - spentPoints - pendingSpentPoints
	return c.JSON(fiber.Map{
		"totalPoints":   totalPoints,
		"spentPoints":   spentPoints,
		"pendingPoints": pendingSpentPoints,
		"balance":       balance,
	})
}
