package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/username/ramadhan-ceria-backend/internal/database"
	"github.com/username/ramadhan-ceria-backend/internal/models"
)

type MagicTemplateRequest struct {
	Preset string `json:"preset"` // "tk" or "sd"
}

var presetTK = []struct {
	Name   string
	Icon   string
	Points int
}{
	{"Sholat Subuh", "🌅", 10},
	{"Sholat Dzuhur", "☀️", 10},
	{"Sholat Ashar", "🌤️", 10},
	{"Sholat Maghrib", "🌙", 10},
	{"Sholat Isya", "⭐", 10},
	{"Mengaji Iqro", "📖", 15},
	{"Hafalan Doa Harian", "🤲", 10},
	{"Puasa Penuh", "🏆", 30},
	{"Membantu Orang Tua", "🤝", 10},
	{"Berbagi ke Teman", "🎁", 15},
}

var presetSD = []struct {
	Name   string
	Icon   string
	Points int
}{
	{"Sholat Subuh Berjamaah", "🕌", 15},
	{"Sholat Dzuhur", "☀️", 10},
	{"Sholat Ashar", "🌤️", 10},
	{"Sholat Maghrib Berjamaah", "🌙", 15},
	{"Sholat Isya", "⭐", 10},
	{"Tadarus Al-Quran (1 Halaman)", "📖", 20},
	{"Hafalan Surat Pendek", "🧠", 25},
	{"Puasa Penuh", "🏆", 30},
	{"Sholat Tarawih", "🌃", 20},
	{"Sedekah / Infaq", "💰", 15},
}

func MagicTemplate(c *fiber.Ctx) error {
	familyID := c.Locals("familyID").(string)

	var req MagicTemplateRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	// Default to "sd" if not specified
	preset := presetSD
	presetName := "SD"
	if req.Preset == "tk" {
		preset = presetTK
		presetName = "TK"
	}

	tx := database.DB.Begin()
	created := make([]models.Task, 0, len(preset))

	for _, tmpl := range preset {
		// Check if a task with the same name already exists for this family
		var existing models.Task
		if err := tx.Where("family_id = ? AND name = ?", familyID, tmpl.Name).First(&existing).Error; err == nil {
			continue // Skip duplicate
		}

		task := models.Task{
			Name:        tmpl.Name,
			PointReward: tmpl.Points,
			FamilyID:    familyID,
			IsActive:    true,
		}
		if err := tx.Create(&task).Error; err != nil {
			tx.Rollback()
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create tasks"})
		}
		created = append(created, task)
	}

	tx.Commit()

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message":      "Magic Template (" + presetName + ") applied successfully",
		"tasksCreated": len(created),
		"tasks":        created,
	})
}
