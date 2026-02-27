package controllers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/username/ramadhan-ceria-backend/internal/services"
)

type LogController struct {
	logService *services.LogService
}

func NewLogController(logService *services.LogService) *LogController {
	return &LogController{logService: logService}
}

func (c *LogController) UndoTask(ctx *fiber.Ctx) error {
	logID := ctx.Params("log_id")
	if logID == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "log_id is required"})
	}

	familyID := ctx.Locals("familyID").(string)

	err := c.logService.UndoTask(familyID, logID)
	if err != nil {
		if err.Error() == "Log not found or belongs to another family" {
			return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
		}
		if err.Error() == "Log already undone or not verified" {
			return ctx.Status(fiber.StatusConflict).JSON(fiber.Map{"error": err.Error()})
		}
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Internal server error"})
	}

	return ctx.JSON(fiber.Map{
		"message": "Task undone successfully",
	})
}
