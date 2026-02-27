package middleware

import (
	"github.com/gofiber/fiber/v2"
)

func ParentGuard() fiber.Handler {
	return func(c *fiber.Ctx) error {
		role := c.Locals("role")
		if role != "parent" && role != "super_admin" {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Forbidden - Requires Parent role"})
		}
		return c.Next()
	}
}

func ChildGuard() fiber.Handler {
	return func(c *fiber.Ctx) error {
		role := c.Locals("role")
		if role != "child" {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Forbidden - Requires Child role"})
		}
		return c.Next()
	}
}
