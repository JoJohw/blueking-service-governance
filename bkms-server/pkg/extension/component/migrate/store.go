package migrate

import (
	"context"
	"fmt"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

const componentDefsCollection = "component_defs"

type currentComponentDef struct {
	Name     string   `bson:"name"`
	Version  string   `bson:"version"`
	Output   *string  `bson:"output"`
	Patchers []string `bson:"patchers"`
	Specs    []string `bson:"specs"`
}

func (m *Migrator) listCurrentComponentDefs(ctx context.Context) ([]currentComponentDef, error) {
	cursor, err := m.db.Collection(componentDefsCollection).Find(ctx, bson.M{}, options.Find().SetSort(bson.D{
		{Key: "name", Value: 1}, {Key: "version", Value: 1},
	}))
	if err != nil {
		return nil, fmt.Errorf("list component definitions: %w", err)
	}
	defer cursor.Close(ctx)

	items := make([]currentComponentDef, 0)
	for cursor.Next(ctx) {
		var item currentComponentDef
		if err = cursor.Decode(&item); err != nil {
			return nil, fmt.Errorf("decode component definition: %w", err)
		}
		if item.Name == "" || item.Version == "" {
			return nil, fmt.Errorf("component definition has empty name or version")
		}
		items = append(items, item)
	}
	if err = cursor.Err(); err != nil {
		return nil, fmt.Errorf("iterate component definitions: %w", err)
	}
	return items, nil
}
