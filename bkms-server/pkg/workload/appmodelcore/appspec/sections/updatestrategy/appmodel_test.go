package updatestrategy

import (
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	"github.com/samber/lo"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/workload/appmodelcore/appmodel"
)

var _ = Describe("app model conversion", func() {
	DescribeTable("ApplyToAppModel",
		func(
			spec *Spec,
			appModel *appmodel.AppModel,
			expected *appmodel.AppModel,
		) {
			Expect(ApplyToAppModel(spec, appModel)).To(Equal(expected))
		},
		Entry("sets managed update strategy fields while preserving type",
			&Spec{
				MaxUnavailable: lo.ToPtr("20%"),
				MaxSurge:       lo.ToPtr("3"),
			},
			&appmodel.AppModel{
				AppID: "app-1",
				UpdateStrategy: &appmodel.UpdateStrategy{
					Type:           "RollingUpdate",
					MaxUnavailable: lo.ToPtr("10%"),
					MaxSurge:       lo.ToPtr("1"),
				},
			},
			&appmodel.AppModel{
				AppID: "app-1",
				UpdateStrategy: &appmodel.UpdateStrategy{
					Type:           "RollingUpdate",
					MaxUnavailable: lo.ToPtr("20%"),
					MaxSurge:       lo.ToPtr("3"),
				},
			},
		),
		Entry("strictly resets managed update strategy fields when the section is nil",
			nil,
			&appmodel.AppModel{
				AppID: "app-2",
				UpdateStrategy: &appmodel.UpdateStrategy{
					Type:           "RollingUpdate",
					MaxUnavailable: lo.ToPtr("10%"),
					MaxSurge:       lo.ToPtr("1"),
				},
			},
			&appmodel.AppModel{
				AppID: "app-2",
				UpdateStrategy: &appmodel.UpdateStrategy{
					Type: "RollingUpdate",
				},
			},
		),
	)
})
