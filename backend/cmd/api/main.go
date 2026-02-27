package main

import (
	"log"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/joho/godotenv"
	"github.com/username/ramadhan-ceria-backend/internal/controllers"
	"github.com/username/ramadhan-ceria-backend/internal/database"
	"github.com/username/ramadhan-ceria-backend/internal/handlers"
	"github.com/username/ramadhan-ceria-backend/internal/middleware"
	"github.com/username/ramadhan-ceria-backend/internal/services"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	database.ConnectDB()

	app := fiber.New()
	app.Use(cors.New())
	app.Use(logger.New())

	// Init Services
	authService := services.NewAuthService()
	taskService := services.NewTaskService()
	logService := services.NewLogService()

	// Init Controllers
	authController := controllers.NewAuthController(authService)
	taskController := controllers.NewTaskController(taskService)
	logController := controllers.NewLogController(logService)

	// Public routes (Auth)
	auth := app.Group("/api/auth")
	auth.Post("/register", handlers.Register)
	auth.Post("/login", handlers.Login)
	auth.Get("/google", handlers.GoogleLogin)
	auth.Get("/google/callback", handlers.GoogleCallback)
	auth.Post("/child/login", authController.LoginChild) // Changed
	auth.Get("/family/:slug/children", handlers.GetFamilyChildren)

	// Protected Routes
	api := app.Group("/api", middleware.AuthMiddleware())

	// Family Settings
	family := api.Group("/family")
	family.Get("/settings", handlers.GetFamilySettings)
	family.Put("/settings", handlers.UpdateFamilySettings)

	// Children Management (Parent role typically)
	children := api.Group("/children")
	children.Get("/", handlers.GetChildren)
	children.Post("/", handlers.CreateChild)
	children.Put("/:id", handlers.UpdateChild)
	children.Delete("/:id", handlers.DeleteChild)

	// Task Management
	tasks := api.Group("/tasks")
	tasks.Get("/", handlers.GetTasks)
	tasks.Post("/", handlers.CreateTask)
	tasks.Put("/:id", handlers.UpdateTask)
	tasks.Delete("/:id", handlers.DeleteTask)

	// New Endpoints
	app.Post("/api/child/tasks/complete", middleware.AuthMiddleware(), middleware.ChildGuard(), taskController.CompleteTask)
	app.Post("/api/parent/kiosk/complete", middleware.AuthMiddleware(), middleware.ParentGuard(), taskController.KioskCompleteTask)
	app.Post("/api/parent/verify-pin", middleware.AuthMiddleware(), middleware.ParentGuard(), handlers.VerifyChildPIN)
	app.Post("/api/parent/tasks/magic", middleware.AuthMiddleware(), middleware.ParentGuard(), taskController.ApplyMagicTemplate)
	app.Post("/api/parent/rewards/magic", middleware.AuthMiddleware(), middleware.ParentGuard(), handlers.ApplyRewardMagicTemplate)

	// Reward Management
	rewards := api.Group("/rewards")
	rewards.Get("/", handlers.GetRewards)
	rewards.Post("/", handlers.CreateReward)
	rewards.Put("/:id", handlers.UpdateReward)
	rewards.Delete("/:id", handlers.DeleteReward)

	// Daily Logs Management
	logs := api.Group("/logs")
	logs.Get("/", handlers.GetLogs)
	logs.Post("/", handlers.SaveLogs)
	app.Post("/api/parent/logs/:log_id/undo", middleware.AuthMiddleware(), middleware.ParentGuard(), logController.UndoTask)

	// Analytics Management
	analytics := api.Group("/analytics")
	analytics.Get("/", handlers.GetAnalytics)

	// Points & Redemptions
	api.Get("/points/:childId", handlers.GetBalance)

	redemptions := api.Group("/redemptions")
	redemptions.Get("/", handlers.GetRedemptions)
	redemptions.Get("/child/:childId", handlers.GetRedemptionsByChild)
	redemptions.Post("/", handlers.CreateRedemption)
	redemptions.Put("/:id/status", handlers.UpdateRedemptionStatus)

	// Leaderboard
	api.Get("/leaderboard", handlers.GetLeaderboard)

	// Super Admin Routes
	admin := app.Group("/api/admin", middleware.AuthMiddleware(), middleware.SuperAdminMiddleware())
	admin.Get("/families", handlers.GetAllFamilies)
	admin.Post("/families", handlers.AdminCreateFamily)
	admin.Delete("/family/:id", handlers.AdminDeleteFamily)
	admin.Put("/family/:id/plan", handlers.UpdateFamilyPlan)
	admin.Get("/stats", handlers.GetAdminStats)
	admin.Get("/announcements", handlers.GetAnnouncements)
	admin.Post("/announcements", handlers.CreateAnnouncement)
	admin.Delete("/announcements/:id", handlers.DeleteAnnouncement)

	// Public: active announcements (for all logged-in users)
	api.Get("/announcements", handlers.GetActiveAnnouncements)

	port := os.Getenv("PORT")
	if port == "" {
		port = "3005"
	}
	log.Fatal(app.Listen(":" + port))
}
