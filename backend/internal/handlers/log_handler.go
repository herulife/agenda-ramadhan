package handlers

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/username/ramadhan-ceria-backend/internal/database"
	"github.com/username/ramadhan-ceria-backend/internal/models"
)

type LogEntry struct {
	TaskID   string `json:"taskId"`
	Quantity int    `json:"quantity"`
}

type SaveLogsRequest struct {
	ChildID string     `json:"childId"`
	Date    string     `json:"date"` // format YYYY-MM-DD
	Logs    []LogEntry `json:"logs"`
}

func GetLogs(c *fiber.Ctx) error {
	childID := c.Query("childId")
	dateStr := c.Query("date")

	if childID == "" || dateStr == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "childId and date required"})
	}

	date, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid date format"})
	}

	var logs []models.DailyLog
	if err := database.DB.Where("child_id = ? AND date = ?", childID, date).Find(&logs).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Database error"})
	}
	return c.JSON(logs)
}

func SaveLogs(c *fiber.Ctx) error {
	var req SaveLogsRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	date, err := time.Parse("2006-01-02", req.Date)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid date format"})
	}

	tx := database.DB.Begin()
	for _, entry := range req.Logs {
		var log models.DailyLog
		result := tx.Where("child_id = ? AND task_id = ? AND date = ?", req.ChildID, entry.TaskID, date).First(&log)
		if result.Error == nil {
			log.Quantity = entry.Quantity
			log.Status = "verified"
			if err := tx.Save(&log).Error; err != nil {
				tx.Rollback()
				return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to update log"})
			}
		} else {
			newLog := models.DailyLog{
				ChildID:  req.ChildID,
				TaskID:   entry.TaskID,
				Date:     date,
				Quantity: entry.Quantity,
				Status:   "verified",
			}
			if err := tx.Create(&newLog).Error; err != nil {
				tx.Rollback()
				return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create log"})
			}
		}
	}
	tx.Commit()
	return c.JSON(fiber.Map{"message": "Logs saved"})
}

// UndoDailyLog - Parent "Undo" a child's task completion (Trust but Verify)
func UndoDailyLog(c *fiber.Ctx) error {
	id := c.Params("id")

	var log models.DailyLog
	if err := database.DB.First(&log, "id = ?", id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Log not found"})
	}

	if log.Status == "undone" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Log already undone"})
	}

	log.Status = "undone"
	if err := database.DB.Save(&log).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not undo log"})
	}

	return c.JSON(fiber.Map{
		"message": "Task undone successfully",
		"log":     log,
	})
}

// RedoDailyLog - Parent re-verifies a previously undone task
func RedoDailyLog(c *fiber.Ctx) error {
	id := c.Params("id")

	var log models.DailyLog
	if err := database.DB.First(&log, "id = ?", id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Log not found"})
	}

	if log.Status == "verified" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Log already verified"})
	}

	log.Status = "verified"
	if err := database.DB.Save(&log).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not redo log"})
	}

	return c.JSON(fiber.Map{
		"message": "Task re-verified successfully",
		"log":     log,
	})
}
