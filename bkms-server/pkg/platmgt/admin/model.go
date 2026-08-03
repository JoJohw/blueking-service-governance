package admin

import "time"

// RoleBinding defines a platform administrator role binding record.
type RoleBinding struct {
	// Username is the unique BlueKing username of the platform administrator.
	Username string `bson:"username" json:"username"`
	// RoleCode is the platform role assigned to the user.
	RoleCode RoleCode `bson:"roleCode" json:"roleCode"`
	// CreatedAt is when the administrator entry was created.
	CreatedAt time.Time `bson:"createdAt" json:"createdAt"`
	// Creator is the operator who added this administrator.
	Creator string `bson:"creator" json:"creator"`
	// UpdatedAt is when the administrator entry was last updated.
	UpdatedAt time.Time `bson:"updatedAt" json:"updatedAt"`
	// Updater is the operator who last updated this administrator.
	Updater string `bson:"updater" json:"updater"`
}

// ListOptions controls platform administrator list behavior.
type ListOptions struct {
	// Keyword fuzzy matches username case-insensitively.
	Keyword string
}
