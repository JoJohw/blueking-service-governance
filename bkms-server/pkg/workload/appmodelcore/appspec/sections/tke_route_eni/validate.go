package tkerouteeni

import "github.com/go-playground/validator/v10"

// RegisterValidation registers validators used by this section.
// The tkeRouteEni spec only contains an optional boolean, so no custom validation is needed.
func RegisterValidation(_ *validator.Validate) {}
