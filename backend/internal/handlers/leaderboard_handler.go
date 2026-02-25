package handlers

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/username/ramadhan-ceria-backend/internal/database"
	"github.com/username/ramadhan-ceria-backend/internal/models"
)

type LeaderboardEntry struct {
	ChildID    string `json:"childId"`
	ChildName  string `json:"childName"`
	Avatar     string `json:"avatar"`
	WeekPoints int64  `json:"weekPoints"`
}

func GetLeaderboard(c *fiber.Ctx) error {
	familyID := c.Locals("familyID").(string)

	// Check if leaderboard is enabled
	var family models.Family
	if err := database.DB.First(&family, "id = ?", familyID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Family not found"})
	}

	if !family.EnableLeaderboard {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Leaderboard is disabled for this family"})
	}

	// Calculate current week (Monday to Sunday)
	now := time.Now()
	weekday := int(now.Weekday())
	if weekday == 0 {
		weekday = 7 // Sunday = 7
	}
	mondayOffset := weekday - 1
	monday := now.AddDate(0, 0, -mondayOffset)
	monday = time.Date(monday.Year(), monday.Month(), monday.Day(), 0, 0, 0, 0, now.Location())
	sunday := monday.AddDate(0, 0, 6)
	sunday = time.Date(sunday.Year(), sunday.Month(), sunday.Day(), 23, 59, 59, 0, now.Location())

	// Get all children in the family
	var children []models.User
	database.DB.Where("family_id = ? AND role = 'child'", familyID).Find(&children)

	entries := make([]LeaderboardEntry, 0, len(children))

	for _, child := range children {
		var weekPoints int64
		database.DB.Model(&models.DailyLog{}).
			Joins("JOIN tasks ON tasks.id = daily_logs.task_id").
			Where("daily_logs.child_id = ? AND daily_logs.date >= ? AND daily_logs.date <= ? AND daily_logs.status = 'verified'",
				child.ID, monday, sunday).
			Select("COALESCE(SUM(daily_logs.quantity * tasks.points), 0)").
			Scan(&weekPoints)

		entries = append(entries, LeaderboardEntry{
			ChildID:    child.ID,
			ChildName:  child.Name,
			Avatar:     child.Avatar,
			WeekPoints: weekPoints,
		})
	}

	// Sort by points descending (simple bubble sort for small arrays)
	for i := 0; i < len(entries); i++ {
		for j := i + 1; j < len(entries); j++ {
			if entries[j].WeekPoints > entries[i].WeekPoints {
				entries[i], entries[j] = entries[j], entries[i]
			}
		}
	}

	return c.JSON(fiber.Map{
		"weekStart":   monday.Format("2006-01-02"),
		"weekEnd":     sunday.Format("2006-01-02"),
		"leaderboard": entries,
	})
}
