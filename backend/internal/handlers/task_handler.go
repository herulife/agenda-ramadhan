package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/username/ramadhan-ceria-backend/internal/database"
	"github.com/username/ramadhan-ceria-backend/internal/models"
	"github.com/username/ramadhan-ceria-backend/internal/utils"
)

type TaskRequest struct {
	Name   string `json:"name"`
	Icon   string `json:"icon"`
	Points int    `json:"points"`
}

func GetTasks(c *fiber.Ctx) error {
	familyID := c.Locals("familyID").(string)

	var tasks []models.Task
	if err := database.DB.Where("family_id = ?", familyID).Find(&tasks).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Database error"})
	}
	return c.JSON(tasks)
}

func CreateTask(c *fiber.Ctx) error {
	familyID := c.Locals("familyID").(string)

	ok, err := utils.CheckTaskLimit(familyID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Database error"})
	}
	if !ok {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Task limit reached for FREE plan"})
	}

	var req TaskRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	task := models.Task{
		Name:     req.Name,
		Icon:     req.Icon,
		Points:   req.Points,
		FamilyID: familyID,
	}
	if err := database.DB.Create(&task).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not create task"})
	}
	return c.Status(fiber.StatusCreated).JSON(task)
}

func UpdateTask(c *fiber.Ctx) error {
	id := c.Params("id")
	familyID := c.Locals("familyID").(string)

	var req TaskRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	var task models.Task
	if err := database.DB.Where("id = ? AND family_id = ?", id, familyID).First(&task).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Task not found"})
	}

	task.Name = req.Name
	task.Icon = req.Icon
	task.Points = req.Points
	if err := database.DB.Save(&task).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not update task"})
	}
	return c.JSON(task)
}

func DeleteTask(c *fiber.Ctx) error {
	id := c.Params("id")
	familyID := c.Locals("familyID").(string)

	result := database.DB.Where("id = ? AND family_id = ?", id, familyID).Delete(&models.Task{})
	if result.RowsAffected == 0 {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Task not found"})
	}
	return c.SendStatus(fiber.StatusNoContent)
}
