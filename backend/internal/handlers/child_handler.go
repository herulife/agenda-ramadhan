package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/username/ramadhan-ceria-backend/internal/database"
	"github.com/username/ramadhan-ceria-backend/internal/models"
	"github.com/username/ramadhan-ceria-backend/internal/utils"
)

type CreateChildRequest struct {
	Name   string `json:"name"`
	Avatar string `json:"avatar"`
	PIN    string `json:"pin"`
}

func GetChildren(c *fiber.Ctx) error {
	familyID := c.Locals("familyID").(string)

	var children []models.User
	if err := database.DB.Where("family_id = ? AND role = 'child'", familyID).Find(&children).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Database error"})
	}
	return c.JSON(children)
}

func CreateChild(c *fiber.Ctx) error {
	familyID := c.Locals("familyID").(string)

	ok, err := utils.CheckChildLimit(familyID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Database error"})
	}
	if !ok {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Child limit reached for FREE plan"})
	}

	var req CreateChildRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	if len(req.PIN) != 4 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "PIN must be exactly 4 digits"})
	}

	hashed, err := utils.HashPassword(req.PIN)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not hash pin"})
	}

	child := models.User{
		Name:       req.Name,
		AvatarIcon: req.Avatar,
		PINHash:    &hashed,
		Role:       "child",
		FamilyID:   familyID,
	}
	if err := database.DB.Create(&child).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not create child"})
	}

	return c.Status(fiber.StatusCreated).JSON(child)
}

func UpdateChild(c *fiber.Ctx) error {
	id := c.Params("id")
	familyID := c.Locals("familyID").(string)

	var req CreateChildRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	var child models.User
	if err := database.DB.Where("id = ? AND family_id = ?", id, familyID).First(&child).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Child not found"})
	}

	child.Name = req.Name
	child.AvatarIcon = req.Avatar

	if req.PIN != "" {
		if len(req.PIN) != 4 {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "PIN must be exactly 4 digits"})
		}
		hashed, err := utils.HashPassword(req.PIN)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not hash pin"})
		}
		child.PINHash = &hashed
	}

	if err := database.DB.Save(&child).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not update child"})
	}
	return c.JSON(child)
}

func DeleteChild(c *fiber.Ctx) error {
	id := c.Params("id")
	familyID := c.Locals("familyID").(string)

	result := database.DB.Where("id = ? AND family_id = ?", id, familyID).Delete(&models.User{})
	if result.RowsAffected == 0 {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Child not found"})
	}
	return c.SendStatus(fiber.StatusNoContent)
}
