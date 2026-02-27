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

	sqlDB, err := DB.DB()
	if err != nil {
		log.Fatal("Failed to get generic database object:", err)
	}

	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)

	// Drop old unique index that prevented multiple completions per day
	DB.Exec("DROP INDEX IF EXISTS idx_child_task_date")

	err = DB.AutoMigrate(
		&models.Family{},
		&models.User{},
		&models.Task{},
		&models.Reward{},
		&models.DailyLog{},
		&models.Redemption{},
		&models.Announcement{},
	)
	if err != nil {
		log.Fatal("Failed to auto migrate database:", err)
	}

	// Fix existing tasks: set repeatable tasks to unlimited (MaxPerDay=0)
	DB.Exec(`UPDATE tasks SET max_per_day = 0 WHERE max_per_day IS NULL OR max_per_day = 1 AND (
		LOWER(name) LIKE '%membantu%' OR LOWER(name) LIKE '%berbagi%' OR
		LOWER(name) LIKE '%cuci%' OR LOWER(name) LIKE '%menyapu%' OR
		LOWER(name) LIKE '%tadarus%' OR LOWER(name) LIKE '%quran%' OR
		LOWER(name) LIKE '%al-quran%' OR LOWER(name) LIKE '%mengaji%' OR
		LOWER(name) LIKE '%sedekah%' OR LOWER(name) LIKE '%infaq%' OR
		LOWER(name) LIKE '%membaca%'
	)`)

	log.Println("Database connected and migrated successfully (PostgreSQL)")
}
