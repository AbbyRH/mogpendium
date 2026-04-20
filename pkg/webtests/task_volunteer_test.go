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

package webtests

import (
	"testing"

	"code.vikunja.io/api/pkg/db"
	"code.vikunja.io/api/pkg/models"
	"code.vikunja.io/api/pkg/web/handler"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"xorm.io/builder"
)

func TestTaskVolunteer(t *testing.T) {
	testHandler := webHandlerTest{
		user: &testuser1,
		strFunc: func() handler.CObject {
			return &models.TaskVolunteer{}
		},
		t: t,
	}

	t.Run("Happy path", func(t *testing.T) {
		// task 51: needs_support=true, project 1, no assignees
		rec, err := testHandler.testCreateWithUser(nil, map[string]string{"projecttask": "51"}, `{}`)
		require.NoError(t, err)
		assert.Contains(t, rec.Body.String(), `"needs_support":false`)
		// user1 should now be an assignee
		db.AssertExists(t, "task_assignees", map[string]interface{}{
			"task_id": 51,
			"user_id": 1,
		}, false)
		// needs_support flag should be cleared in the DB
		db.AssertExists(t, "tasks", map[string]interface{}{
			"id":            51,
			"needs_support": false,
		}, false)
	})

	t.Run("Already assigned is idempotent", func(t *testing.T) {
		// task 52: needs_support=true, user1 already assigned (see task_assignees fixture)
		// Should succeed silently: no duplicate assignment, flag still cleared.
		rec, err := testHandler.testCreateWithUser(nil, map[string]string{"projecttask": "52"}, `{}`)
		require.NoError(t, err)
		assert.Contains(t, rec.Body.String(), `"needs_support":false`)
		// needs_support should be cleared
		db.AssertExists(t, "tasks", map[string]interface{}{
			"id":            52,
			"needs_support": false,
		}, false)
		// only one assignee row for user1+task52 (no duplicates)
		db.AssertCount(t, "task_assignees", builder.And(
			builder.Eq{"task_id": 52},
			builder.Eq{"user_id": 1},
		), 1)
	})

	t.Run("No project access", func(t *testing.T) {
		// task 34 is in project 20, inaccessible to testuser1
		_, err := testHandler.testCreateWithUser(nil, map[string]string{"projecttask": "34"}, `{}`)
		require.Error(t, err)
		assert.Equal(t, 403, getHTTPErrorCode(err))
	})

	t.Run("Task not found", func(t *testing.T) {
		_, err := testHandler.testCreateWithUser(nil, map[string]string{"projecttask": "999999"}, `{}`)
		require.Error(t, err)
		assertHandlerErrorCode(t, err, models.ErrCodeTaskDoesNotExist)
	})
}

func TestTaskNeedsSupport(t *testing.T) {
	testHandler := webHandlerTest{
		user: &testuser1,
		strFunc: func() handler.CObject {
			return &models.Task{}
		},
		t: t,
	}

	t.Run("Set needs_support to true via task update", func(t *testing.T) {
		// task 1: needs_support=false (default). Updating to true should persist.
		// This test will FAIL until needs_support is added to colsToUpdate.
		rec, err := testHandler.testUpdateWithUser(nil, map[string]string{"projecttask": "1"}, `{"needs_support":true}`)
		require.NoError(t, err)
		assert.Contains(t, rec.Body.String(), `"needs_support":true`)
		db.AssertExists(t, "tasks", map[string]interface{}{
			"id":            1,
			"needs_support": true,
		}, false)
	})

	t.Run("Clear needs_support via task update", func(t *testing.T) {
		// task 51: needs_support=true. Updating to false should persist.
		// This test will FAIL until needs_support is added to colsToUpdate.
		rec, err := testHandler.testUpdateWithUser(nil, map[string]string{"projecttask": "51"}, `{"needs_support":false}`)
		require.NoError(t, err)
		assert.Contains(t, rec.Body.String(), `"needs_support":false`)
		db.AssertExists(t, "tasks", map[string]interface{}{
			"id":            51,
			"needs_support": false,
		}, false)
	})
}
