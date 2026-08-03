package appcfg

import "github.com/gin-gonic/gin"

// Handler contains views required by app config file Gin routes.
type Handler interface {
	CreateAppConfigFile(c *gin.Context)
	UpdateAppConfigFile(c *gin.Context)
	ListAppConfigFiles(c *gin.Context)
	DeleteAppConfigFile(c *gin.Context)
	GetAppConfigFileDetails(c *gin.Context)
	UpdateAppConfigFileContent(c *gin.Context)
	UpdateAppConfigFileOverlayContent(c *gin.Context)
	PreviewOverlayMerge(c *gin.Context)
	ListAppConfigFileVersions(c *gin.Context)
	GetAppConfigFileVersion(c *gin.Context)
	CompareAppConfigFileVersions(c *gin.Context)
	RollbackAppConfigFileVersion(c *gin.Context)
	DeleteAppConfigFileVersion(c *gin.Context)
}

// Register registers Gin app config file routes.
func Register(rg *gin.RouterGroup, h Handler) {
	apps := rg.Group("/apps/:appID")

	// App config file resource routes.
	files := apps.Group("/app-config-files")
	// Create a new app config file.
	files.POST("", h.CreateAppConfigFile)
	// Update app config file metadata such as name/base reference.
	files.PUT("/:id", h.UpdateAppConfigFile)
	// List app config files under the current application.
	files.GET("", h.ListAppConfigFiles)
	// Delete an app config file by ID.
	files.DELETE("/:id", h.DeleteAppConfigFile)
	// Query details, editable field info, and current content.
	files.GET("/:id/details", h.GetAppConfigFileDetails)
	// Update the content field for a normal app config file.
	files.PUT("/:id/content", h.UpdateAppConfigFileContent)
	// Update the overlayContent field for an overlay app config file.
	files.PUT("/:id/overlay-content", h.UpdateAppConfigFileOverlayContent)
	// Preview the merged result between base content and overlay content.
	files.POST("/:id/preview-overlay-merge", h.PreviewOverlayMerge)

	// App config file version routes. The `:id` path param here is a version record ID.
	versions := apps.Group("/app-config-file/versions")
	// List historical version records.
	versions.GET("", h.ListAppConfigFileVersions)
	// Query a single version record by version ID.
	versions.GET("/:id", h.GetAppConfigFileVersion)
	// Compare two version records of the same app config file.
	versions.POST("/compare", h.CompareAppConfigFileVersions)
	// Roll back the current app config file to the target version record.
	versions.POST("/:id/rollback", h.RollbackAppConfigFileVersion)
	// Delete a historical version record by version ID.
	versions.DELETE("/:id", h.DeleteAppConfigFileVersion)
}
