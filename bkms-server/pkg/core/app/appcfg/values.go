package appcfg

import (
	"bytes"

	"github.com/pkg/errors"
	"github.com/samber/lo"
	"sigs.k8s.io/kustomize/api/filters/patchstrategicmerge"
	"sigs.k8s.io/kustomize/kyaml/kio"
	"sigs.k8s.io/kustomize/kyaml/yaml"
)

// mergeContent merges two config contents based on the specified format.
// This is a convenience function that selects the appropriate merge function.
func mergeContent(base string, overlay *string, format FileFormat) (string, error) {
	switch format {
	case FileFormatTAF:
		return mergeTAFContent(base, overlay)
	default:
		// Default to YAML format
		return mergeYAMLContent(base, overlay)
	}
}

// mergeYAMLContent merges two YAML contents, with overlay taking precedence over base.
// This function shares the implementation with kustomize's strategic merge patch.
//
// The function supports two overlay formats:
//  1. Version 2 format (when overlayVersion: "2" is present):
//     ```
//     overlayVersion: "2"
//     patches:
//     - replicas: 5
//     - image: myapp:v2.0
//     ```
//  2. Simple format (default or version "1", for better user experience in simple cases):
//     ```
//     replicas: 5
//     image: myapp:v2.0
//     ```
func mergeYAMLContent(base string, overlay *string) (string, error) {
	if lo.FromPtr(overlay) == "" {
		return base, nil
	}
	var overlayMap map[string]any
	if err := yaml.Unmarshal([]byte(*overlay), &overlayMap); err != nil {
		return "", errors.Wrap(err, "parsing the overlay YAML")
	}

	// Read the overlayVersion
	overlayVersion, hasVersion := overlayMap["overlayVersion"].(string)
	if !hasVersion {
		overlayVersion = "1"
	}

	var patches []any
	switch overlayVersion {
	case "1":
		// Simple format: treat the whole overlay as a single patch
		patches = []any{overlayMap}
	case "2":
		// Version 2 format: use patches field
		var ok bool
		patches, ok = overlayMap["patches"].([]any)
		if patches == nil || !ok {
			// The "patches" field is missing or in the wrong type
			return base, nil
		}
	default:
		return "", errors.Errorf("unsupported overlayVersion: %s, supported: '1'(default), '2'", overlayVersion)
	}

	// Apply each patch in sequence
	currentResult := base
	for _, patch := range patches {
		// No need to handle the error since the patch is from parsing step above
		patchStr, _ := yaml.Marshal(patch)

		// Parse the overlay YAML
		overlayNode, err := yaml.Parser{Value: string(patchStr)}.Filter(nil)
		if err != nil {
			return "", errors.Wrap(err, "parsing the overlay YAML")
		}

		var retBuf bytes.Buffer
		err = kio.Pipeline{
			Inputs:  []kio.Reader{&kio.ByteReader{Reader: bytes.NewBufferString(currentResult)}},
			Filters: []kio.Filter{patchstrategicmerge.Filter{Patch: overlayNode}},
			Outputs: []kio.Writer{kio.ByteWriter{Writer: &retBuf}},
		}.Execute()
		if err != nil {
			return "", errors.Wrap(err, "merging the YAML contents")
		}
		currentResult = retBuf.String()
	}
	return currentResult, nil
}
