package utils

import (
	"github.com/username/ramadhan-ceria-backend/internal/database"
	"github.com/username/ramadhan-ceria-backend/internal/models"
)

func CheckChildLimit(familyID string) (bool, error) {
	var family models.Family
	if err := database.DB.First(&family, "id = ?", familyID).Error; err != nil {
		return false, err
	}
	var count int64
	database.DB.Model(&models.User{}).Where("family_id = ? AND role = 'child'", familyID).Count(&count)
	if family.Plan == "FREE" && count >= 2 {
		return false, nil
	}
	return true, nil
}

func CheckTaskLimit(familyID string) (bool, error) {
	var family models.Family
	if err := database.DB.First(&family, "id = ?", familyID).Error; err != nil {
		return false, err
	}
	var count int64
	database.DB.Model(&models.Task{}).Where("family_id = ?", familyID).Count(&count)
	if family.Plan == "FREE" && count >= 10 {
		return false, nil
	}
	return true, nil
}

func CheckRewardLimit(familyID string) (bool, error) {
	var family models.Family
	if err := database.DB.First(&family, "id = ?", familyID).Error; err != nil {
		return false, err
	}
	var count int64
	database.DB.Model(&models.Reward{}).Where("family_id = ?", familyID).Count(&count)
	if family.Plan == "FREE" && count >= 5 {
		return false, nil
	}
	return true, nil
}
