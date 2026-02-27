package services

import (
	"errors"

	"github.com/username/ramadhan-ceria-backend/internal/database"
	"github.com/username/ramadhan-ceria-backend/internal/models"
)

type LogService struct{}

func NewLogService() *LogService {
	return &LogService{}
}

func (s *LogService) UndoTask(familyID, logID string) error {
	tx := database.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	var log models.DailyLog
	if err := tx.Preload("Child").Where("id = ?", logID).First(&log).Error; err != nil {
		tx.Rollback()
		return errors.New("Log not found or belongs to another family")
	}

	if log.Child.FamilyID != familyID {
		tx.Rollback()
		return errors.New("Log not found or belongs to another family")
	}

	if log.Status != "verified" {
		tx.Rollback()
		return errors.New("Log already undone or not verified")
	}

	log.Status = "undone"
	if err := tx.Save(&log).Error; err != nil {
		tx.Rollback()
		return errors.New("Could not undo log")
	}

	var child models.User
	if err := tx.Where("id = ?", log.ChildID).First(&child).Error; err != nil {
		tx.Rollback()
		return errors.New("Could not find user")
	}

	if child.PointsBalance >= log.EarnedPoints {
		child.PointsBalance -= log.EarnedPoints
	} else {
		child.PointsBalance = 0
	}

	if err := tx.Save(&child).Error; err != nil {
		tx.Rollback()
		return errors.New("Could not update user balance")
	}

	tx.Commit()

	return nil
}
