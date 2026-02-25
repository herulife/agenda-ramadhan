package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/username/ramadhan-ceria-backend/internal/database"
	"github.com/username/ramadhan-ceria-backend/internal/models"
	"github.com/username/ramadhan-ceria-backend/internal/utils"
)

type RegisterRequest struct {
	Email      string `json:"email"`
	Password   string `json:"password"`
	Name       string `json:"name"`
	FamilyName string `json:"familyName"`
	Slug       string `json:"slug"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type AuthResponse struct {
	Token string `json:"token"`
	Role  string `json:"role"`
}

func Register(c *fiber.Ctx) error {
	var req RegisterRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	if req.Email == "" || req.Password == "" || req.Name == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Email, password, and name are required"})
	}

	// Auto-generate slug from family name if not provided
	if req.Slug == "" {
		req.Slug = utils.Slugify(req.FamilyName)
	}

	// Check slug uniqueness
	var existingFamily models.Family
	if err := database.DB.Where("slug = ?", req.Slug).First(&existingFamily).Error; err == nil {
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{"error": "Slug already taken"})
	}

	hashed, err := utils.HashPassword(req.Password)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not hash password"})
	}

	// Pre-generate IDs so we can set OwnerID before creating family
	userID := uuid.New().String()
	familyID := uuid.New().String()

	tx := database.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	family := models.Family{
		ID:      familyID,
		Slug:    req.Slug,
		Title:   req.FamilyName,
		Plan:    "FREE",
		OwnerID: userID,
	}
	if err := tx.Create(&family).Error; err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not create family"})
	}

	user := models.User{
		ID:           userID,
		Email:        &req.Email,
		PasswordHash: hashed,
		Name:         req.Name,
		Role:         "parent",
		Avatar:       "🧕",
		FamilyID:     familyID,
	}
	if err := tx.Create(&user).Error; err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not create user"})
	}

	tx.Commit()

	token, err := utils.GenerateToken(user.ID, family.ID, user.Role)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not generate token"})
	}

	return c.Status(fiber.StatusCreated).JSON(AuthResponse{Token: token, Role: user.Role})
}

func Login(c *fiber.Ctx) error {
	var req LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	var user models.User
	err := database.DB.Where("email = ? OR username = ?", req.Email, req.Email).First(&user).Error
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid credentials"})
	}

	if !utils.CheckPasswordHash(req.Password, user.PasswordHash) {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid credentials"})
	}

	token, err := utils.GenerateToken(user.ID, user.FamilyID, user.Role)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not generate token"})
	}

	return c.JSON(AuthResponse{Token: token, Role: user.Role})
}

// --- Child Login (Netflix-style: Avatar + PIN) ---

type LoginChildRequest struct {
	ChildID string `json:"childId"`
	PIN     string `json:"pin"`
}

func LoginChild(c *fiber.Ctx) error {
	var req LoginChildRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	if req.ChildID == "" || req.PIN == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "childId and pin are required"})
	}

	if len(req.PIN) != 4 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "PIN must be 4 digits"})
	}

	var child models.User
	err := database.DB.Where("id = ? AND role = 'child'", req.ChildID).First(&child).Error
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Child not found"})
	}

	if child.PIN == nil || *child.PIN != req.PIN {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid PIN"})
	}

	token, err := utils.GenerateToken(child.ID, child.FamilyID, child.Role)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not generate token"})
	}

	return c.JSON(AuthResponse{Token: token, Role: child.Role})
}

// --- Get children list for family (public, for login screen) ---

type ChildProfile struct {
	ID     string `json:"id"`
	Name   string `json:"name"`
	Avatar string `json:"avatar"`
}

func GetFamilyChildren(c *fiber.Ctx) error {
	slug := c.Params("slug")
	if slug == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Family slug is required"})
	}

	var family models.Family
	if err := database.DB.Where("slug = ?", slug).First(&family).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Family not found"})
	}

	var children []models.User
	database.DB.Where("family_id = ? AND role = 'child'", family.ID).Find(&children)

	profiles := make([]ChildProfile, len(children))
	for i, child := range children {
		profiles[i] = ChildProfile{
			ID:     child.ID,
			Name:   child.Name,
			Avatar: child.Avatar,
		}
	}

	return c.JSON(fiber.Map{
		"familyTitle": family.Title,
		"children":    profiles,
	})
}
