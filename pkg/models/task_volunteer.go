package models

import (
	"code.vikunja.io/api/pkg/user"
	"code.vikunja.io/api/pkg/web"
	"xorm.io/xorm"
)

// TaskVolunteer represents a request by the current user to help with a task.
// Volunteering assigns the user to the task and clears the needs_support flag.
type TaskVolunteer struct {
	// The task ID, set from the URL parameter.
	TaskID int64 `xorm:"-" json:"-" param:"projecttask"`

	// The updated task returned after volunteering.
	Task *Task `xorm:"-" json:"task"`

	web.CRUDable    `xorm:"-" json:"-"`
	web.Permissions `xorm:"-" json:"-"`
}

// CanCreate checks if the auth user can volunteer for the task.
// They need at least read access to the project the task belongs to.
func (tv *TaskVolunteer) CanCreate(s *xorm.Session, a web.Auth) (bool, error) {
	task, err := GetTaskByIDSimple(s, tv.TaskID)
	if err != nil {
		return false, err
	}
	project := &Project{ID: task.ProjectID}
	return project.CanRead(s, a)
}

// Create volunteers the current user to help with the task.
func (tv *TaskVolunteer) Create(s *xorm.Session, a web.Auth) (err error) {
	doer, err := user.GetFromAuth(a)
	if err != nil {
		return err
	}

	task, err := GetTaskByIDSimple(s, tv.TaskID)
	if err != nil {
		return err
	}

	project := &Project{ID: task.ProjectID}

	// Assign the volunteer to the task (addNewAssigneeByID is idempotent for duplicates).
	err = task.addNewAssigneeByID(s, doer.ID, project, a)
	if err != nil {
		return err
	}

	// Clear the needs_support flag now that someone has picked it up.
	_, err = s.ID(task.ID).Cols("needs_support").Update(&Task{NeedsSupport: false})
	if err != nil {
		return err
	}

	task.NeedsSupport = false
	tv.Task = &task
	return nil
}
