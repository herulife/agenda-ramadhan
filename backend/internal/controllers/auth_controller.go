package controllers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/username/ramadhan-ceria-backend/internal/services"
)

type AuthController struct {
	authService *services.AuthService
}

func NewAuthController(authService *services.AuthService) *AuthController {
	return &AuthController{authService: authService}
}

type LoginChildRequest struct {
	ChildID string `json:"childId"`
	PIN     string `json:"pin"`
}

func (c *AuthController) LoginChild(ctx *fiber.Ctx) error {
	var req LoginChildRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request format"})
	}

	if req.ChildID == "" || req.PIN == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "childId and pin are required"})
	}

	if len(req.PIN) != 4 {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "PIN must be exactly 4 digits"})
	}

	token, role, err := c.authService.LoginChild(req.ChildID, req.PIN)
	if err != nil {
		if err.Error() == "Child not found" || err.Error() == "Invalid PIN" {
			return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": err.Error()})
		}
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Internal server error"})
	}

	return ctx.JSON(fiber.Map{
		"token": token,
		"role":  role,
	})
}
