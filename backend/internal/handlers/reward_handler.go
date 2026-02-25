package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/username/ramadhan-ceria-backend/internal/database"
	"github.com/username/ramadhan-ceria-backend/internal/models"
	"github.com/username/ramadhan-ceria-backend/internal/utils"
)

type RewardRequest struct {
	Name           string `json:"name"`
	Icon           string `json:"icon"`
	PointsRequired int    `json:"pointsRequired"`
}

func GetRewards(c *fiber.Ctx) error {
	familyID := c.Locals("familyID").(string)

	var rewards []models.Reward
	if err := database.DB.Where("family_id = ?", familyID).Find(&rewards).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Database error"})
	}
	return c.JSON(rewards)
}

func CreateReward(c *fiber.Ctx) error {
	familyID := c.Locals("familyID").(string)

	ok, err := utils.CheckRewardLimit(familyID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Database error"})
	}
	if !ok {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Reward limit reached for FREE plan"})
	}

	var req RewardRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	reward := models.Reward{
		Name:           req.Name,
		Icon:           req.Icon,
		PointsRequired: req.PointsRequired,
		FamilyID:       familyID,
	}
	if err := database.DB.Create(&reward).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not create reward"})
	}
	return c.Status(fiber.StatusCreated).JSON(reward)
}

func UpdateReward(c *fiber.Ctx) error {
	id := c.Params("id")
	familyID := c.Locals("familyID").(string)

	var req RewardRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	var reward models.Reward
	if err := database.DB.Where("id = ? AND family_id = ?", id, familyID).First(&reward).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Reward not found"})
	}

	reward.Name = req.Name
	reward.Icon = req.Icon
	reward.PointsRequired = req.PointsRequired
	if err := database.DB.Save(&reward).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not update reward"})
	}
	return c.JSON(reward)
}

func DeleteReward(c *fiber.Ctx) error {
	id := c.Params("id")
	familyID := c.Locals("familyID").(string)

	result := database.DB.Where("id = ? AND family_id = ?", id, familyID).Delete(&models.Reward{})
	if result.RowsAffected == 0 {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Reward not found"})
	}
	return c.SendStatus(fiber.StatusNoContent)
}
