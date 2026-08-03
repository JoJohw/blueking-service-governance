// Package client provides deploy related types
package client

import "github.com/go-playground/validator/v10"

// Validate validates the HelmDeployOptions
func (o *HelmDeployOptions) Validate() error {
	return validator.New().Struct(o)
}

// Validate validates the TrpcDeployOptions
func (o *AppModelDeployOptions) Validate() error {
	return validator.New().Struct(o)
}
