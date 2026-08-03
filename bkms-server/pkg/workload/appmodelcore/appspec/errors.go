package appspec

import (
	stderrors "errors"

	pkgerrors "github.com/pkg/errors"
)

// ErrAppSpecNotFound is returned when app spec is not found in store.
var ErrAppSpecNotFound = stderrors.New("app spec not found")

// ErrAppSpecValidation is a sentinel error for validation failures.
var ErrAppSpecValidation = stderrors.New("app spec validation failed")

func wrapValidationErr(err error) error {
	return pkgerrors.Wrap(stderrors.Join(ErrAppSpecValidation, err), "validating app spec")
}
