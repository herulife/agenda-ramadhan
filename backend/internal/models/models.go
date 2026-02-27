package models

import (
	"time"

	"gorm.io/gorm"
)

type Family struct {
	ID                string `gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Name              string `gorm:"type:varchar(100);not null"`
	Plan              string `gorm:"type:varchar(20);default:'FREE'"`
	PlanExpiresAt     *time.Time
	EnableLeaderboard bool     `gorm:"default:true"`
	Timezone          string   `gorm:"type:varchar(50);default:'Asia/Jakarta'"`
	Users             []User   `gorm:"foreignKey:FamilyID"`
	Tasks             []Task   `gorm:"foreignKey:FamilyID"`
	Rewards           []Reward `gorm:"foreignKey:FamilyID"`
	CreatedAt         time.Time
	UpdatedAt         time.Time
	DeletedAt         gorm.DeletedAt `gorm:"index"`
}

type User struct {
	ID            string  `gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	FamilyID      string  `gorm:"type:uuid;not null;index"`
	Role          string  `gorm:"type:varchar(20);not null"`
	Name          string  `gorm:"not null"`
	AvatarIcon    string  `gorm:"not null;default:'👦'"`
	Email         *string `gorm:"uniqueIndex"`
	Whatsapp      *string `gorm:"type:varchar(20)"`
	PasswordHash  *string
	PINHash       *string
	PointsBalance int          `gorm:"default:0;check:points_balance >= 0"`
	Family        Family       `gorm:"constraint:OnDelete:CASCADE"`
	DailyLogs     []DailyLog   `gorm:"foreignKey:ChildID"`
	Redemptions   []Redemption `gorm:"foreignKey:ChildID"`
	CreatedAt     time.Time
	UpdatedAt     time.Time
	DeletedAt     gorm.DeletedAt `gorm:"index"`
}

type Task struct {
	ID          string     `gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	FamilyID    string     `gorm:"type:uuid;not null;index:idx_family_task_active"`
	Name        string     `gorm:"not null"`
	Icon        string     `gorm:"default:'📋'"`
	PointReward int        `gorm:"not null"`
	MaxPerDay   *int       `gorm:"default:1" json:"MaxPerDay"` // nil = default(1), 0 = unlimited, N = N times/day
	TaskType    string     `gorm:"type:varchar(20);default:'daily'"`
	IsActive    bool       `gorm:"default:true;index:idx_family_task_active"`
	Family      Family     `gorm:"constraint:OnDelete:CASCADE"`
	DailyLogs   []DailyLog `gorm:"foreignKey:TaskID"`
	CreatedAt   time.Time
	UpdatedAt   time.Time
	DeletedAt   gorm.DeletedAt `gorm:"index"`
}

type Reward struct {
	ID             string       `gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	FamilyID       string       `gorm:"type:uuid;not null;index"`
	Name           string       `gorm:"not null"`
	Icon           string       `gorm:"default:'🎁'"`
	PointsRequired int          `gorm:"not null"`
	IsActive       bool         `gorm:"default:true"`
	Family         Family       `gorm:"constraint:OnDelete:CASCADE"`
	Redemptions    []Redemption `gorm:"foreignKey:RewardID"`
	CreatedAt      time.Time
	UpdatedAt      time.Time
	DeletedAt      gorm.DeletedAt `gorm:"index"`
}

type DailyLog struct {
	ID            string    `gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	ChildID       string    `gorm:"type:uuid;not null;index:idx_child_task_date"`
	TaskID        string    `gorm:"type:uuid;not null;index:idx_child_task_date"`
	CompletedDate time.Time `gorm:"type:date;not null;index:idx_child_task_date"`
	Status        string    `gorm:"type:varchar(20);default:'verified'"`
	EarnedPoints  int       `gorm:"not null"`
	Child         User      `gorm:"constraint:OnDelete:CASCADE;foreignKey:ChildID"`
	Task          Task      `gorm:"constraint:OnDelete:CASCADE"`
	CreatedAt     time.Time
	UpdatedAt     time.Time
	DeletedAt     gorm.DeletedAt `gorm:"index"`
}

type Redemption struct {
	ID          string `gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	ChildID     string `gorm:"type:uuid;not null;index"`
	RewardID    string `gorm:"type:uuid;not null;index"`
	PointsSpent int    `gorm:"not null"`
	Status      string `gorm:"type:varchar(20);default:'pending'"`
	Child       User   `gorm:"constraint:OnDelete:CASCADE;foreignKey:ChildID"`
	Reward      Reward `gorm:"constraint:OnDelete:CASCADE"`
	CreatedAt   time.Time
	UpdatedAt   time.Time
	DeletedAt   gorm.DeletedAt `gorm:"index"`
}

type Announcement struct {
	ID        string `gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Title     string `gorm:"not null"`
	Message   string `gorm:"type:text;not null"`
	Type      string `gorm:"type:varchar(20);default:'info'"` // info, warning, promo
	IsActive  bool   `gorm:"default:true"`
	CreatedAt time.Time
	UpdatedAt time.Time
	DeletedAt gorm.DeletedAt `gorm:"index"`
}
