package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/username/ramadhan-ceria-backend/internal/database"
	"github.com/username/ramadhan-ceria-backend/internal/models"
	"github.com/username/ramadhan-ceria-backend/internal/utils"
)

type CreateChildRequest struct {
	Name     string `json:"name"`
	Avatar   string `json:"avatar"`
	Username string `json:"username"`
	Password string `json:"password"`
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

	var existing models.User
	if err := database.DB.Where("username = ?", req.Username).First(&existing).Error; err == nil {
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{"error": "Username already taken"})
	}

	hashed, err := utils.HashPassword(req.Password)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not hash password"})
	}

	child := models.User{
		Name:         req.Name,
		Avatar:       req.Avatar,
		Username:     &req.Username,
		PasswordHash: hashed,
		Role:         "child",
		FamilyID:     familyID,
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
	child.Avatar = req.Avatar
	if req.Username != "" && (child.Username == nil || *child.Username != req.Username) {
		var existing models.User
		if err := database.DB.Where("username = ?", req.Username).First(&existing).Error; err == nil {
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{"error": "Username already taken"})
		}
		child.Username = &req.Username
	}
	if req.Password != "" {
		hashed, err := utils.HashPassword(req.Password)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not hash password"})
		}
		child.PasswordHash = hashed
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
