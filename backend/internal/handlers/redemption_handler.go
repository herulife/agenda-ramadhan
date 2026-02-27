package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/username/ramadhan-ceria-backend/internal/database"
	"github.com/username/ramadhan-ceria-backend/internal/models"
)

type RedemptionRequest struct {
	ChildID  string `json:"childId"`
	RewardID string `json:"rewardId"`
	Quantity int    `json:"quantity"`
}

type UpdateRedemptionStatusRequest struct {
	Status string `json:"status"` // "approved" or "rejected"
}

func GetRedemptions(c *fiber.Ctx) error {
	familyID := c.Locals("familyID").(string)

	var redemptions []models.Redemption
	if err := database.DB.Preload("Child").Preload("Reward").Joins("JOIN users ON users.id = redemptions.child_id").Where("users.family_id = ?", familyID).Find(&redemptions).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Database error"})
	}
	return c.JSON(redemptions)
}

func GetRedemptionsByChild(c *fiber.Ctx) error {
	childID := c.Params("childId")

	var redemptions []models.Redemption
	if err := database.DB.Preload("Reward").Where("child_id = ?", childID).Find(&redemptions).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Database error"})
	}
	return c.JSON(redemptions)
}

func CreateRedemption(c *fiber.Ctx) error {
	var req RedemptionRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	if req.Quantity <= 0 {
		req.Quantity = 1
	}

	var reward models.Reward
	if err := database.DB.First(&reward, "id = ?", req.RewardID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Reward not found"})
	}

	pointsRequired := reward.PointsRequired * req.Quantity

	// Calculate balance
	var totalPoints int64
	err := database.DB.Model(&models.DailyLog{}).
		Where("child_id = ? AND status = 'verified'", req.ChildID).
		Select("COALESCE(SUM(earned_points), 0)").
		Scan(&totalPoints).Error
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Error calculating points"})
	}

	var spentPoints int64
	err = database.DB.Model(&models.Redemption{}).
		Where("child_id = ? AND status = 'approved'", req.ChildID).
		Select("COALESCE(SUM(points_spent), 0)").
		Scan(&spentPoints).Error
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Error calculating points"})
	}

	var pendingSpentPoints int64
	err = database.DB.Model(&models.Redemption{}).
		Where("child_id = ? AND status = 'pending'", req.ChildID).
		Select("COALESCE(SUM(points_spent), 0)").
		Scan(&pendingSpentPoints).Error
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Error calculating points"})
	}

	balance := totalPoints - spentPoints - pendingSpentPoints

	if balance < int64(pointsRequired) {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Insufficient points"})
	}

	redemption := models.Redemption{
		ChildID:     req.ChildID,
		RewardID:    req.RewardID,
		PointsSpent: pointsRequired,
		Status:      "pending",
	}

	if err := database.DB.Create(&redemption).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create redemption request"})
	}

	return c.Status(fiber.StatusCreated).JSON(redemption)
}

func UpdateRedemptionStatus(c *fiber.Ctx) error {
	id := c.Params("id")

	var req UpdateRedemptionStatusRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	if req.Status != "approved" && req.Status != "rejected" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid status"})
	}

	var redemption models.Redemption
	if err := database.DB.First(&redemption, "id = ?", id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Redemption not found"})
	}

	redemption.Status = req.Status
	if err := database.DB.Save(&redemption).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not update status"})
	}

	return c.JSON(redemption)
}
