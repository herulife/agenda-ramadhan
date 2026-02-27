package handlers

import (
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/username/ramadhan-ceria-backend/internal/database"
	"github.com/username/ramadhan-ceria-backend/internal/models"
	"github.com/username/ramadhan-ceria-backend/internal/utils"
)

func GetAllFamilies(c *fiber.Ctx) error {
	var families []models.Family
	if err := database.DB.Preload("Users").Preload("Tasks").Preload("Rewards").Order("created_at DESC").Find(&families).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Database error"})
	}
	return c.JSON(families)
}

func UpdateFamilyPlan(c *fiber.Ctx) error {
	id := c.Params("id")

	type PlanRequest struct {
		Plan string `json:"plan"`
	}
	var req PlanRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	var family models.Family
	if err := database.DB.First(&family, "id = ?", id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Family not found"})
	}

	family.Plan = req.Plan
	if err := database.DB.Save(&family).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not update plan"})
	}

	return c.JSON(family)
}

// --- Admin Create Family + Parent Account ---
func AdminCreateFamily(c *fiber.Ctx) error {
	type CreateFamilyRequest struct {
		FamilyName string `json:"familyName"`
		ParentName string `json:"parentName"`
		Email      string `json:"email"`
		Password   string `json:"password"`
		Plan       string `json:"plan"`
	}

	var req CreateFamilyRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Data tidak valid"})
	}

	if req.FamilyName == "" || req.ParentName == "" || req.Email == "" || req.Password == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Semua field wajib diisi"})
	}

	// Check if email already exists
	var existingUser models.User
	if err := database.DB.Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{"error": "Email sudah terdaftar"})
	}

	if req.Plan == "" {
		req.Plan = "FREE"
	}

	// Create family
	family := models.Family{
		Name: req.FamilyName,
		Plan: strings.ToUpper(req.Plan),
	}
	if err := database.DB.Create(&family).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Gagal membuat keluarga"})
	}

	// Hash password
	hashedPassword, err := utils.HashPassword(req.Password)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Gagal mengenkripsi password"})
	}

	// Create parent user
	email := req.Email
	parentUser := models.User{
		FamilyID:     family.ID,
		Role:         "parent",
		Name:         req.ParentName,
		Email:        &email,
		PasswordHash: &hashedPassword,
		AvatarIcon:   "👨",
	}
	if err := database.DB.Create(&parentUser).Error; err != nil {
		// Rollback family
		database.DB.Unscoped().Delete(&family)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Gagal membuat akun orang tua"})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "Keluarga dan akun orang tua berhasil dibuat",
		"family":  family,
		"parent":  fiber.Map{"id": parentUser.ID, "name": parentUser.Name, "email": email},
	})
}

// --- Admin Delete Family (cascade) ---
func AdminDeleteFamily(c *fiber.Ctx) error {
	id := c.Params("id")

	var family models.Family
	if err := database.DB.First(&family, "id = ?", id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Keluarga tidak ditemukan"})
	}

	// Delete all related data in order (foreign key constraints)
	tx := database.DB.Begin()

	// Get all children of this family
	var userIDs []string
	tx.Model(&models.User{}).Where("family_id = ?", id).Pluck("id", &userIDs)

	if len(userIDs) > 0 {
		// Delete redemptions by children
		tx.Unscoped().Where("child_id IN ?", userIDs).Delete(&models.Redemption{})
		// Delete daily logs by children
		tx.Unscoped().Where("child_id IN ?", userIDs).Delete(&models.DailyLog{})
	}

	// Delete rewards, tasks, users, then family
	tx.Unscoped().Where("family_id = ?", id).Delete(&models.Reward{})
	tx.Unscoped().Where("family_id = ?", id).Delete(&models.Task{})
	tx.Unscoped().Where("family_id = ?", id).Delete(&models.User{})
	tx.Unscoped().Delete(&family)

	if err := tx.Commit().Error; err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Gagal menghapus keluarga"})
	}

	return c.JSON(fiber.Map{"message": "Keluarga berhasil dihapus beserta semua datanya"})
}

// --- Admin Global Stats ---
func GetAdminStats(c *fiber.Ctx) error {
	var totalFamilies int64
	var totalChildren int64
	var totalParents int64
	var premiumFamilies int64
	var totalTasksToday int64
	var totalPointsEarned int64
	var totalRedemptions int64

	database.DB.Model(&models.Family{}).Count(&totalFamilies)
	database.DB.Model(&models.User{}).Where("role = 'child'").Count(&totalChildren)
	database.DB.Model(&models.User{}).Where("role = 'parent'").Count(&totalParents)
	database.DB.Model(&models.Family{}).Where("plan = 'PREMIUM'").Count(&premiumFamilies)

	today := time.Now().Format("2006-01-02")
	database.DB.Model(&models.DailyLog{}).Where("completed_date = ? AND status = 'verified'", today).Count(&totalTasksToday)
	database.DB.Model(&models.DailyLog{}).Where("status = 'verified'").Select("COALESCE(SUM(earned_points), 0)").Scan(&totalPointsEarned)
	database.DB.Model(&models.Redemption{}).Where("status = 'approved'").Count(&totalRedemptions)

	return c.JSON(fiber.Map{
		"totalFamilies":     totalFamilies,
		"totalChildren":     totalChildren,
		"totalParents":      totalParents,
		"premiumFamilies":   premiumFamilies,
		"totalTasksToday":   totalTasksToday,
		"totalPointsEarned": totalPointsEarned,
		"totalRedemptions":  totalRedemptions,
	})
}

// --- Announcements CRUD ---
func GetAnnouncements(c *fiber.Ctx) error {
	var announcements []models.Announcement
	if err := database.DB.Order("created_at DESC").Find(&announcements).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Database error"})
	}
	return c.JSON(announcements)
}

func CreateAnnouncement(c *fiber.Ctx) error {
	type AnnouncementRequest struct {
		Title   string `json:"title"`
		Message string `json:"message"`
		Type    string `json:"type"`
	}

	var req AnnouncementRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	if req.Title == "" || req.Message == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Title and message are required"})
	}

	if req.Type == "" {
		req.Type = "info"
	}

	announcement := models.Announcement{
		Title:    req.Title,
		Message:  req.Message,
		Type:     req.Type,
		IsActive: true,
	}

	if err := database.DB.Create(&announcement).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create announcement"})
	}

	return c.Status(fiber.StatusCreated).JSON(announcement)
}

func DeleteAnnouncement(c *fiber.Ctx) error {
	id := c.Params("id")
	result := database.DB.Delete(&models.Announcement{}, "id = ?", id)
	if result.RowsAffected == 0 {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Announcement not found"})
	}
	return c.SendStatus(fiber.StatusNoContent)
}

// Public endpoint to get active announcements
func GetActiveAnnouncements(c *fiber.Ctx) error {
	var announcements []models.Announcement
	if err := database.DB.Where("is_active = true").Order("created_at DESC").Find(&announcements).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Database error"})
	}
	return c.JSON(announcements)
}
