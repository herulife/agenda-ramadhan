package handlers

import (
	"context"
	"encoding/json"
	"io"
	"net/http"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/username/ramadhan-ceria-backend/internal/database"
	"github.com/username/ramadhan-ceria-backend/internal/models"
	"github.com/username/ramadhan-ceria-backend/internal/utils"
	"golang.org/x/oauth2"
)

type RegisterRequest struct {
	Email      string `json:"email"`
	Password   string `json:"password"`
	Name       string `json:"name"`
	FamilyName string `json:"familyName"`
	Whatsapp   string `json:"whatsapp"`
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

	// Check family name uniqueness (approximate substitute for slug)
	var existingFamily models.Family
	if err := database.DB.Where("name = ?", req.FamilyName).First(&existingFamily).Error; err == nil {
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{"error": "Family name already taken"})
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
		ID:   familyID,
		Name: req.FamilyName,
		Plan: "FREE",
	}
	if err := tx.Create(&family).Error; err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not create family"})
	}

	user := models.User{
		ID:    userID,
		Email: &req.Email,
		Whatsapp: func() *string {
			if req.Whatsapp != "" {
				return &req.Whatsapp
			}
			return nil
		}(),
		PasswordHash: &hashed,
		Name:         req.Name,
		Role:         "parent",
		AvatarIcon:   "🧕",
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
	err := database.DB.Where("email = ?", req.Email).First(&user).Error
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid credentials"})
	}

	if user.PasswordHash == nil || !utils.CheckPasswordHash(req.Password, *user.PasswordHash) {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid credentials"})
	}

	token, err := utils.GenerateToken(user.ID, user.FamilyID, user.Role)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not generate token"})
	}

	return c.JSON(AuthResponse{Token: token, Role: user.Role})
}

// --- Google OAuth ---

func GoogleLogin(c *fiber.Ctx) error {
	url := utils.GetGoogleOAuthConfig().AuthCodeURL("state-token", oauth2.AccessTypeOffline)
	return c.Redirect(url)
}

func GoogleCallback(c *fiber.Ctx) error {
	code := c.Query("code")
	if code == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Code not found"})
	}

	token, err := utils.GetGoogleOAuthConfig().Exchange(context.Background(), code)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to exchange token"})
	}

	resp, err := http.Get("https://www.googleapis.com/oauth2/v2/userinfo?access_token=" + token.AccessToken)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to get user info"})
	}
	defer resp.Body.Close()

	userData, err := io.ReadAll(resp.Body)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to read user info"})
	}

	var googleUser map[string]interface{}
	if err := json.Unmarshal(userData, &googleUser); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to parse user info"})
	}

	email, ok := googleUser["email"].(string)
	if !ok || email == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Email not found from Google"})
	}

	name, _ := googleUser["name"].(string)
	if name == "" {
		name = "Google User" // Default
	}

	var user models.User
	err = database.DB.Where("email = ?", email).First(&user).Error

	if err != nil {
		// Create new family and user
		familyID := uuid.New().String()
		userID := uuid.New().String()

		tx := database.DB.Begin()
		defer func() {
			if r := recover(); r != nil {
				tx.Rollback()
			}
		}()

		family := models.Family{
			ID:   familyID,
			Name: "Keluarga " + name,
			Plan: "FREE",
		}
		if err := tx.Create(&family).Error; err != nil {
			tx.Rollback()
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not create family"})
		}

		user = models.User{
			ID:         userID,
			Email:      &email,
			Name:       name,
			Role:       "parent",
			AvatarIcon: "👨",
			FamilyID:   familyID,
		}
		if err := tx.Create(&user).Error; err != nil {
			tx.Rollback()
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not create user"})
		}

		tx.Commit()
	}

	jwtToken, err := utils.GenerateToken(user.ID, user.FamilyID, user.Role)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not generate token"})
	}

	// Important: We send the token via redirect so the frontend can capture it
	// In production, might be better to set a cookie directly
	return c.Redirect("http://localhost:3000/login?token=" + jwtToken)
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

	if child.PINHash == nil || !utils.CheckPasswordHash(req.PIN, *child.PINHash) {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid PIN"})
	}

	token, err := utils.GenerateToken(child.ID, child.FamilyID, child.Role)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not generate token"})
	}

	return c.JSON(AuthResponse{Token: token, Role: child.Role})
}

// --- Verify child PIN (parent stays logged in, no new token) ---

func VerifyChildPIN(c *fiber.Ctx) error {
	var req LoginChildRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	if req.ChildID == "" || req.PIN == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "childId and pin are required"})
	}

	// Verify child belongs to parent's family
	familyID := c.Locals("familyID").(string)

	var child models.User
	err := database.DB.Where("id = ? AND role = 'child' AND family_id = ?", req.ChildID, familyID).First(&child).Error
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Child not found in your family"})
	}

	// If child has no PIN set, allow access
	if child.PINHash == nil || *child.PINHash == "" {
		return c.JSON(fiber.Map{"verified": true, "child_id": child.ID, "name": child.Name})
	}

	if !utils.CheckPasswordHash(req.PIN, *child.PINHash) {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "PIN salah"})
	}

	return c.JSON(fiber.Map{"verified": true, "child_id": child.ID, "name": child.Name})
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
	if err := database.DB.Where("id = ?", slug).First(&family).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Family not found"})
	}

	var children []models.User
	database.DB.Where("family_id = ? AND role = 'child'", family.ID).Find(&children)

	profiles := make([]ChildProfile, len(children))
	for i, child := range children {
		profiles[i] = ChildProfile{
			ID:     child.ID,
			Name:   child.Name,
			Avatar: child.AvatarIcon,
		}
	}

	return c.JSON(fiber.Map{
		"familyTitle": family.Name,
		"children":    profiles,
	})
}
