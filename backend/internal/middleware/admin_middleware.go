package middleware

import (
	"github.com/gofiber/fiber/v2"
)

func AdminMiddleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		role := c.Locals("role")
		if role != "super_admin" && role != "admin" && role != "parent" { // Adjust according to requirements. Typically parent handles their own family. Here we might want 'super_admin' exclusively for super-admin routes
			// Note: typically 'admin' signifies super admin in some context. We'll enforce 'super_admin' explicitly if needed.
			// However based on prompt: "parent" also does admin stuff on dashboard.
			// We will specifically use SuperAdminMiddleware for the global admin.
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Forbidden - Requires Admin role"})
		}
		return c.Next()
	}
}

func SuperAdminMiddleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		role := c.Locals("role")
		if role != "super_admin" {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Forbidden - Requires Super Admin role"})
		}
		return c.Next()
	}
}
