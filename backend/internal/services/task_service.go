package services

import (
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/username/ramadhan-ceria-backend/internal/database"
	"github.com/username/ramadhan-ceria-backend/internal/models"
	"gorm.io/gorm"
)

type TaskService struct{}

func NewTaskService() *TaskService {
	return &TaskService{}
}

func (s *TaskService) DB() *gorm.DB {
	return database.DB
}

func (s *TaskService) CompleteTask(childID, taskID string, date time.Time) (int, error) {
	tx := database.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	var task models.Task
	if err := tx.Where("id = ?", taskID).First(&task).Error; err != nil {
		tx.Rollback()
		return 0, errors.New("Task not found")
	}

	// Check MaxPerDay limit (nil=1, 0=unlimited)
	maxPerDay := 1
	if task.MaxPerDay != nil {
		maxPerDay = *task.MaxPerDay
	}
	if maxPerDay > 0 {
		var count int64
		tx.Model(&models.DailyLog{}).Where("child_id = ? AND task_id = ? AND completed_date = ? AND deleted_at IS NULL", childID, taskID, date).Count(&count)
		if count >= int64(maxPerDay) {
			tx.Rollback()
			return 0, errors.New("Task already completed today")
		}
	}

	newLog := models.DailyLog{
		ChildID:       childID,
		TaskID:        taskID,
		CompletedDate: date,
		Status:        "verified",
		EarnedPoints:  task.PointReward,
	}

	if err := tx.Create(&newLog).Error; err != nil {
		tx.Rollback()
		return 0, err
	}

	var user models.User
	if err := tx.Where("id = ?", childID).First(&user).Error; err != nil {
		tx.Rollback()
		return 0, err
	}

	user.PointsBalance += task.PointReward
	if err := tx.Save(&user).Error; err != nil {
		tx.Rollback()
		return 0, err
	}

	tx.Commit()

	return user.PointsBalance, nil
}

func (s *TaskService) ApplyMagicTemplate(familyID string, templateType string) ([]models.Task, error) {
	var preset []struct {
		Name        string
		PointReward int
		Icon        string
		MaxPerDay   int
	}

	if templateType == "TK" {
		preset = []struct {
			Name        string
			PointReward int
			Icon        string
			MaxPerDay   int
		}{
			{"Sholat Subuh", 10, "🕋", 1},
			{"Sholat Dzuhur", 10, "🕋", 1},
			{"Sholat Ashar", 10, "🕋", 1},
			{"Sholat Maghrib", 10, "🕋", 1},
			{"Sholat Isya", 10, "🕋", 1},
			{"Mengaji Iqro", 15, "📖", 1},
			{"Hafalan Doa Harian", 10, "🤲", 1},
			{"Puasa Penuh", 30, "🍽️", 1},
			{"Membantu Orang Tua", 10, "🧹", 0}, // unlimited
			{"Berbagi ke Teman", 15, "🎁", 0},   // unlimited
		}
	} else {
		preset = []struct {
			Name        string
			PointReward int
			Icon        string
			MaxPerDay   int
		}{
			{"Sholat Subuh Berjamaah", 15, "🕋", 1},
			{"Sholat Dzuhur", 10, "🕋", 1},
			{"Sholat Ashar", 10, "🕋", 1},
			{"Sholat Maghrib Berjamaah", 15, "🕋", 1},
			{"Sholat Isya", 10, "🕋", 1},
			{"Tadarus Al-Quran (1 Halaman)", 20, "📖", 0}, // unlimited
			{"Hafalan Surat Pendek", 25, "🧠", 1},
			{"Puasa Penuh", 30, "🍽️", 1},
			{"Sholat Tarawih", 20, "🕌", 1},
			{"Sedekah / Infaq", 15, "💷", 0}, // unlimited
		}
	}

	tx := database.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	var createdTasks []models.Task
	for _, p := range preset {
		mpd := p.MaxPerDay
		task := models.Task{
			ID:          uuid.New().String(),
			FamilyID:    familyID,
			Name:        p.Name,
			Icon:        p.Icon,
			PointReward: p.PointReward,
			MaxPerDay:   &mpd,
			TaskType:    "daily",
			IsActive:    true,
		}

		// Simple Check for existing tasks with same name in family
		var existing models.Task
		if err := tx.Where("family_id = ? AND name = ?", familyID, p.Name).First(&existing).Error; err == nil {
			continue // Skip if exists
		}

		createdTasks = append(createdTasks, task)
	}

	if len(createdTasks) > 0 {
		if err := tx.CreateInBatches(createdTasks, 10).Error; err != nil {
			tx.Rollback()
			return nil, err
		}
	}

	tx.Commit()

	return createdTasks, nil
}
