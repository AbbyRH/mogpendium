// Vikunja is a to-do list application to facilitate your life.
// Copyright 2018-present Vikunja and contributors. All rights reserved.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

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
	canRead, _, err := project.CanRead(s, a)
	return canRead, err
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
