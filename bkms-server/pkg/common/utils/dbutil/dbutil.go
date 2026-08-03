// Package dbutil 提供数据库相关的工具函数
package dbutil

import (
	"reflect"

	"go.mongodb.org/mongo-driver/v2/bson"
)

// ToBsonWithoutID converts a struct to a BSON map without the ID field, it useful for
// performing updates in MongoDB.
func ToBsonWithoutID(obj any) (bson.M, error) {
	// Marshal the struct to BSON first, then unmarshal it to a map to create the update document
	data, err := bson.Marshal(obj)
	if err != nil {
		return nil, err
	}

	var updateDoc map[string]any
	if err = bson.Unmarshal(data, &updateDoc); err != nil {
		return nil, err
	}

	// Remove the _id field as we don't want to update it
	delete(updateDoc, "_id")
	return updateDoc, nil
}

// EqualIgnoringID compares two objects of the same type and returns true if they are equal,
// it ignores the ID field when .
func EqualIgnoringID[T any](v1, v2 T) bool {
	v1Data, err := ToBsonWithoutID(v1)
	if err != nil {
		return false
	}
	v2Data, err := ToBsonWithoutID(v1)
	if err != nil {
		return false
	}
	return reflect.DeepEqual(v1Data, v2Data)
}
