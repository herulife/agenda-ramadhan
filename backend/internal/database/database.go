package database

import (
	"fmt"
	"log"
	"os"

	"github.com/username/ramadhan-ceria-backend/internal/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func ConnectDB() {
	var err error

	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=Asia/Jakarta",
		os.Getenv("DB_HOST"),
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_NAME"),
		os.Getenv("DB_PORT"),
	)

	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	err = DB.AutoMigrate(
		&models.Family{},
		&models.User{},
		&models.Task{},
		&models.Reward{},
		&models.DailyLog{},
		&models.Redemption{},
	)
	if err != nil {
		log.Fatal("Failed to auto migrate database:", err)
	}

	log.Println("Database connected and migrated successfully (PostgreSQL)")
}
