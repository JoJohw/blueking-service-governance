// Package build provides build create command
package build

import (
	"fmt"

	"github.com/pkg/errors"
	"github.com/spf13/cobra"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-cli/pkg/client"
)

// NewCreateCmd returns a Command instance for 'app build create' sub command
func NewCreateCmd() *cobra.Command {
	var appID, branch, imageTag string

	cmd := &cobra.Command{
		Use:   "create",
		Short: "Create a new application build",
		Long: `Create a new build for an application.

This command triggers a new build process for the specified application using
the provided branch and image tag.`,
		Example: `  # Create a build for an application
  bkms-cli app build create --app demo --branch main --image-tag v1.0.0`,
		RunE: func(cmd *cobra.Command, args []string) error {
			opts := client.BuildOptions{
				Branch:   branch,
				ImageTag: imageTag,
			}

			if err := client.New().CreateAppBuild(cmd.Context(), appID, opts); err != nil {
				return errors.Wrap(err, "create app build")
			}

			fmt.Println("✓ Build created successfully")
			return nil
		},
	}

	cmd.Flags().StringVar(&appID, "app", "", "application ID")
	cmd.Flags().StringVar(&branch, "branch", "", "code branch to build")
	cmd.Flags().StringVar(&imageTag, "image-tag", "", "image tag to build")

	_ = cmd.MarkFlagRequired("app")
	_ = cmd.MarkFlagRequired("branch")
	_ = cmd.MarkFlagRequired("image-tag")

	return cmd
}
