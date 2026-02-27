package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/username/ramadhan-ceria-backend/internal/database"
	"github.com/username/ramadhan-ceria-backend/internal/models"
)

var defaultRewards = []models.Reward{
	{Name: "Es Krim", Icon: "🍦", PointsRequired: 50},
	{Name: "Main Game 1 Jam", Icon: "🎮", PointsRequired: 100},
	{Name: "Nonton TV Lebihan", Icon: "📺", PointsRequired: 80},
	{Name: "Permen / Snack", Icon: "🍬", PointsRequired: 30},
	{Name: "Jalan-jalan ke Taman", Icon: "🎡", PointsRequired: 150},
}

func ApplyRewardMagicTemplate(ctx *fiber.Ctx) error {
	familyID := ctx.Locals("familyID").(string)

	var createdRewards []models.Reward
	for _, tmp := range defaultRewards {
		newReward := models.Reward{
			ID:             uuid.New().String(),
			FamilyID:       familyID,
			Name:           tmp.Name,
			Icon:           tmp.Icon,
			PointsRequired: tmp.PointsRequired,
		}

		if err := database.DB.Create(&newReward).Error; err != nil {
			return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create reward template"})
		}
		createdRewards = append(createdRewards, newReward)
	}

	return ctx.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "Template Hadiah applied successfully",
		"rewards": createdRewards,
	})
}
