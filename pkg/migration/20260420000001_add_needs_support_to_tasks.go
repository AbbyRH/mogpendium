package migration

import (
	"src.techknowlogick.com/xormigrate"
	"xorm.io/xorm"
)

type tasks20260420000001 struct {
	ID           int64 `xorm:"bigint autoincr not null unique pk"`
	NeedsSupport bool  `xorm:"default false"`
}

func (tasks20260420000001) TableName() string {
	return "tasks"
}

func init() {
	migrations = append(migrations, &xormigrate.Migration{
		ID:          "20260420000001",
		Description: "add needs_support column to tasks for lend-a-hand feature",
		Migrate: func(tx *xorm.Engine) error {
			return tx.Sync(tasks20260420000001{})
		},
		Rollback: func(tx *xorm.Engine) error {
			return dropTableColum(tx, "tasks", "needs_support")
		},
	})
}
