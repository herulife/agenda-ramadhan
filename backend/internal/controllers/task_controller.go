package controllers

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/username/ramadhan-ceria-backend/internal/services"
)

type TaskController struct {
	taskService *services.TaskService
}

func NewTaskController(taskService *services.TaskService) *TaskController {
	return &TaskController{taskService: taskService}
}

type CompleteTaskRequest struct {
	TaskID string `json:"task_id"`
	Date   string `json:"date"` // YYYY-MM-DD from frontend (local date)
}

func (c *TaskController) CompleteTask(ctx *fiber.Ctx) error {
	var req CompleteTaskRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	if req.TaskID == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "task_id is required"})
	}

	childID := ctx.Locals("userID").(string)

	// Use date from frontend (local date), fallback to server date
	dateStr := req.Date
	if dateStr == "" {
		dateStr = time.Now().Format("2006-01-02")
	}
	date, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid date format"})
	}

	newBalance, err := c.taskService.CompleteTask(childID, req.TaskID, date)
	if err != nil {
		if err.Error() == "Task already completed today" {
			return ctx.Status(fiber.StatusConflict).JSON(fiber.Map{"error": err.Error()})
		}
		if err.Error() == "Task not found" {
			return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
		}
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Internal server error"})
	}

	return ctx.JSON(fiber.Map{
		"message":     "Task completed successfully",
		"new_balance": newBalance,
		"date":        dateStr,
	})
}

// KioskCompleteTask — Parent completes task on behalf of a child (Kiosk Mode)
type KioskCompleteRequest struct {
	ChildID string `json:"child_id"`
	TaskID  string `json:"task_id"`
	Date    string `json:"date"`
}

func (c *TaskController) KioskCompleteTask(ctx *fiber.Ctx) error {
	var req KioskCompleteRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	if req.ChildID == "" || req.TaskID == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "child_id and task_id are required"})
	}

	// Verify child belongs to this parent's family
	familyID := ctx.Locals("familyID").(string)
	var child struct{ ID, FamilyID string }
	if err := c.taskService.DB().Raw("SELECT id, family_id FROM users WHERE id = ? AND role = 'child'", req.ChildID).Scan(&child).Error; err != nil || child.ID == "" {
		return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Child not found"})
	}
	if child.FamilyID != familyID {
		return ctx.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Child does not belong to your family"})
	}

	dateStr := req.Date
	if dateStr == "" {
		dateStr = time.Now().Format("2006-01-02")
	}
	date, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid date format"})
	}

	newBalance, err := c.taskService.CompleteTask(req.ChildID, req.TaskID, date)
	if err != nil {
		if err.Error() == "Task already completed today" {
			return ctx.Status(fiber.StatusConflict).JSON(fiber.Map{"error": err.Error()})
		}
		if err.Error() == "Task not found" {
			return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
		}
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Internal server error"})
	}

	return ctx.JSON(fiber.Map{
		"message":     "Task completed successfully",
		"new_balance": newBalance,
		"date":        dateStr,
		"child_id":    req.ChildID,
	})
}

type MagicTemplateRequest struct {
	TemplateType string `json:"template_type"`
}

func (c *TaskController) ApplyMagicTemplate(ctx *fiber.Ctx) error {
	var req MagicTemplateRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	if req.TemplateType != "TK" && req.TemplateType != "SD" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "template_type must be TK or SD"})
	}

	familyID := ctx.Locals("familyID").(string)

	createdTasks, err := c.taskService.ApplyMagicTemplate(familyID, req.TemplateType)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Internal server error"})
	}

	return ctx.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "Template applied successfully",
		"tasks":   createdTasks,
	})
}
