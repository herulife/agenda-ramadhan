package services

import (
	"errors"

	"github.com/username/ramadhan-ceria-backend/internal/database"
	"github.com/username/ramadhan-ceria-backend/internal/models"
	"github.com/username/ramadhan-ceria-backend/internal/utils"
)

type AuthService struct{}

func NewAuthService() *AuthService {
	return &AuthService{}
}

func (s *AuthService) LoginChild(childID, pin string) (string, string, error) {
	var child models.User
	err := database.DB.Where("id = ? AND role = 'child'", childID).First(&child).Error
	if err != nil {
		return "", "", errors.New("Child not found")
	}

	if child.PINHash == nil || !utils.CheckPasswordHash(pin, *child.PINHash) {
		return "", "", errors.New("Invalid PIN")
	}

	token, err := utils.GenerateToken(child.ID, child.FamilyID, child.Role)
	if err != nil {
		return "", "", errors.New("Could not generate token")
	}

	return token, child.Role, nil
}
