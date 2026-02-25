package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Family struct {
	ID        string   `gorm:"primaryKey;type:text"`
	Slug      string   `gorm:"uniqueIndex;not null"`
	Title     string   `gorm:"not null"`
	OwnerID           string   `gorm:"type:text;not null"`
	Plan              string   `gorm:"default:'FREE'"`
	EnableLeaderboard bool     `gorm:"default:true"`
	Users             []User   `gorm:"foreignKey:FamilyID"`
	Tasks     []Task   `gorm:"foreignKey:FamilyID"`
	Rewards   []Reward `gorm:"foreignKey:FamilyID"`
	CreatedAt time.Time
	UpdatedAt time.Time
}

func (f *Family) BeforeCreate(tx *gorm.DB) error {
	if f.ID == "" {
		f.ID = uuid.New().String()
	}
	return nil
}

type User struct {
	ID           string       `gorm:"primaryKey;type:text"`
	Email        *string      `gorm:"uniqueIndex"`
	Username     *string      `gorm:"uniqueIndex"`
	PasswordHash string       `gorm:""`
	PIN          *string      `gorm:"type:varchar(4)"`
	Name         string       `gorm:"not null"`
	Role         string       `gorm:"not null"`
	Avatar       string       `gorm:"default:'👦'"`
	FamilyID     string       `gorm:"type:text;not null;index"`
	Family       Family       `gorm:"constraint:OnDelete:CASCADE"`
	DailyLogs    []DailyLog   `gorm:"foreignKey:ChildID"`
	Redemptions  []Redemption `gorm:"foreignKey:ChildID"`
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.ID == "" {
		u.ID = uuid.New().String()
	}
	return nil
}

type Task struct {
	ID        string     `gorm:"primaryKey;type:text"`
	Name      string     `gorm:"not null"`
	Icon      string     `gorm:"default:'📋'"`
	Points    int        `gorm:"not null;column:points"`
	FamilyID  string     `gorm:"type:text;not null;index"`
	Family    Family     `gorm:"constraint:OnDelete:CASCADE"`
	IsActive  bool       `gorm:"default:true"`
	DailyLogs []DailyLog `gorm:"foreignKey:TaskID"`
	CreatedAt time.Time
	UpdatedAt time.Time
}

func (t *Task) BeforeCreate(tx *gorm.DB) error {
	if t.ID == "" {
		t.ID = uuid.New().String()
	}
	return nil
}

type Reward struct {
	ID             string       `gorm:"primaryKey;type:text"`
	Name           string       `gorm:"not null"`
	Icon           string       `gorm:"default:'🎁'"`
	PointsRequired int          `gorm:"not null"`
	FamilyID       string       `gorm:"type:text;not null;index"`
	Family         Family       `gorm:"constraint:OnDelete:CASCADE"`
	IsActive       bool         `gorm:"default:true"`
	Redemptions    []Redemption `gorm:"foreignKey:RewardID"`
	CreatedAt      time.Time
	UpdatedAt      time.Time
}

func (r *Reward) BeforeCreate(tx *gorm.DB) error {
	if r.ID == "" {
		r.ID = uuid.New().String()
	}
	return nil
}

type DailyLog struct {
	ID        string    `gorm:"primaryKey;type:text"`
	ChildID   string    `gorm:"type:text;not null;index:idx_child_date"`
	Child     User      `gorm:"constraint:OnDelete:CASCADE"`
	TaskID    string    `gorm:"type:text;not null;index"`
	Task      Task      `gorm:"constraint:OnDelete:CASCADE"`
	Date      time.Time `gorm:"type:date;not null;index:idx_child_date"`
	Quantity  int       `gorm:"default:0"`
	Status    string    `gorm:"default:'verified'"`
	UpdatedAt time.Time
}

func (d *DailyLog) BeforeCreate(tx *gorm.DB) error {
	if d.ID == "" {
		d.ID = uuid.New().String()
	}
	return nil
}

type Redemption struct {
	ID          string `gorm:"primaryKey;type:text"`
	ChildID     string `gorm:"type:text;not null;index"`
	Child       User   `gorm:"constraint:OnDelete:CASCADE"`
	RewardID    string `gorm:"type:text;not null;index"`
	Reward      Reward `gorm:"constraint:OnDelete:CASCADE"`
	Quantity    int    `gorm:"default:1"`
	PointsSpent int    `gorm:"not null"`
	Status      string `gorm:"default:'pending'"`
	RedeemedAt  time.Time
}

func (r *Redemption) BeforeCreate(tx *gorm.DB) error {
	if r.ID == "" {
		r.ID = uuid.New().String()
	}
	return nil
}
