package main

import (
	"log"

	"github.com/google/uuid"
	"github.com/joho/godotenv"
	"github.com/username/ramadhan-ceria-backend/internal/database"
	"github.com/username/ramadhan-ceria-backend/internal/models"
	"github.com/username/ramadhan-ceria-backend/internal/utils"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	database.ConnectDB()

	// Clean up existing data for a fresh start (optional but good for this seed script)
	database.DB.Exec("DELETE FROM daily_logs")
	database.DB.Exec("DELETE FROM redemptions")
	database.DB.Exec("DELETE FROM tasks")
	database.DB.Exec("DELETE FROM rewards")
	database.DB.Exec("DELETE FROM users")
	database.DB.Exec("DELETE FROM families")

	// 1. Super Admin
	superAdminEmail := "superadmin@mail.com"
	superAdminPassword := "superadmin123"
	hashedSuperAdmin, _ := utils.HashPassword(superAdminPassword)
	sysFamilyID := uuid.New().String()
	adminID := uuid.New().String()

	sysFamily := models.Family{
		ID:   sysFamilyID,
		Name: "System Admin",
		Plan: "PREMIUM",
	}
	database.DB.Create(&sysFamily)

	superAdmin := models.User{
		ID:           adminID,
		Email:        &superAdminEmail,
		PasswordHash: &hashedSuperAdmin,
		Name:         "Super Admin",
		Role:         "super_admin",
		AvatarIcon:   "👑",
		FamilyID:     sysFamilyID,
	}
	database.DB.Create(&superAdmin)

	// 2. Parent (Orang Tua)
	parentEmail := "ayah@mail.com"
	parentPassword := "ayah123"
	hashedParent, _ := utils.HashPassword(parentPassword)
	familyID := uuid.New().String()
	parentID := uuid.New().String()

	family := models.Family{
		ID:   familyID,
		Name: "Keluarga Bahagia",
		Plan: "FREE",
	}
	database.DB.Create(&family)

	parent := models.User{
		ID:           parentID,
		Email:        &parentEmail,
		PasswordHash: &hashedParent,
		Name:         "Ayah Budi",
		Role:         "parent",
		AvatarIcon:   "🧔",
		FamilyID:     familyID,
	}
	database.DB.Create(&parent)

	// 3. Child (Anak)
	childName := "Budi Kecil"
	childPIN := "1234"
	hashedChild, _ := utils.HashPassword(childPIN)
	childID := uuid.New().String()

	child := models.User{
		ID:         childID,
		PINHash:    &hashedChild,
		Name:       childName,
		Role:       "child",
		AvatarIcon: "👦",
		FamilyID:   familyID,
	}
	database.DB.Create(&child)

	// Insert dummy Tasks & Rewards for this family to play with
	tasks := []models.Task{
		{ID: uuid.New().String(), Name: "Sholat Subuh", PointReward: 5, FamilyID: familyID},
		{ID: uuid.New().String(), Name: "Bantu Cuci Piring", PointReward: 3, FamilyID: familyID},
	}
	database.DB.Create(&tasks)

	rewards := []models.Reward{
		{ID: uuid.New().String(), Name: "Main HP 30 Menit", Icon: "📱", PointsRequired: 15, FamilyID: familyID},
		{ID: uuid.New().String(), Name: "Es Krim", Icon: "🍦", PointsRequired: 25, FamilyID: familyID},
	}
	database.DB.Create(&rewards)

	log.Println("Berhasil membuat seluruh akun dummy!")
	log.Println("=======================================")
	log.Println("1) AKUN SUPER ADMIN (Akses: /super-admin)")
	log.Printf("Email    : %s\n", superAdminEmail)
	log.Printf("Password : %s\n", superAdminPassword)
	log.Println("=======================================")
	log.Println("2) AKUN ORANG TUA (Akses: /dashboard)")
	log.Printf("Email    : %s\n", parentEmail)
	log.Printf("Password : %s\n", parentPassword)
	log.Println("=======================================")
	log.Println("3) AKUN ANAK (Akses: /panel)")
	log.Printf("Name : %s\n", childName)
	log.Printf("PIN : %s\n", childPIN)
	log.Println("=======================================")
}
