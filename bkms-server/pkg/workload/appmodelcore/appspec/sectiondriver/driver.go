package sectiondriver

import (
	"fmt"

	"github.com/go-playground/validator/v10"
	"go.mongodb.org/mongo-driver/v2/bson"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/workload/appmodelcore/appmodel"
)

// Driver describes the domain-level operations of a single AppSpec section.
// It intentionally knows nothing about how the section is mounted on AppSpec.
type Driver[T any] struct {
	// Clone deep-copies one section value and normalizes it if needed.
	Clone func(*T) *T

	// Merge overlays override onto base using the section's merge semantics.
	Merge func(*T, *T) *T

	// AppendPatch appends MongoDB patch entries for this section.
	AppendPatch func(*bson.D, *T)

	// RegisterValidation registers validator rules owned by this section.
	RegisterValidation func(*validator.Validate)

	// Below are optional methods:

	// FromAppModel builds this section from an AppModel.
	// Optional: only needed for sections that sync to AppModel.
	FromAppModel func(*appmodel.AppModel) *T

	// ApplyToAppModel applies this section back into an AppModel.
	// Optional: only needed for sections that sync to AppModel.
	ApplyToAppModel func(*T, *appmodel.AppModel) *appmodel.AppModel
}

// New creates a Driver and validates the required callbacks up front.
// AppModel-related callbacks are optional by design.
func New[T any](name string, driver Driver[T]) Driver[T] {
	require(name, "Clone", driver.Clone)
	require(name, "Merge", driver.Merge)
	require(name, "AppendPatch", driver.AppendPatch)
	require(name, "RegisterValidation", driver.RegisterValidation)
	return driver
}

func require(name, field string, fn any) {
	if fn == nil {
		panic(fmt.Sprintf("section driver %q requires %s", name, field))
	}
}
