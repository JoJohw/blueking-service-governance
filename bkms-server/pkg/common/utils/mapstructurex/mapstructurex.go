// Package mapstructurex 提供 mapstructure 扩展功能，用于特殊类型转换
package mapstructurex

import (
	"reflect"
	"time"

	"github.com/mitchellh/mapstructure"
	"github.com/pkg/errors"
	"go.mongodb.org/mongo-driver/v2/bson"
	"google.golang.org/protobuf/types/known/timestamppb"
)

// DecodeWithHooks 在原 mapstructure.Decode 基础上，支持设置转换 hooks
func DecodeWithHooks(input, output any, hook ...mapstructure.DecodeHookFunc) error {
	decoder, err := mapstructure.NewDecoder(&mapstructure.DecoderConfig{
		DecodeHook: mapstructure.ComposeDecodeHookFunc(hook...),
		Result:     output,
	})
	if err != nil {
		return err
	}
	return decoder.Decode(input)
}

// TimeToTimestamppbHook 将 time.Time 转换为 *timestamppb.Timestamp
func TimeToTimestamppbHook() mapstructure.DecodeHookFunc {
	return func(f, t reflect.Type, data any) (any, error) {
		if f != reflect.TypeOf(&time.Time{}) {
			return data, nil
		}

		inputTime, ok := data.(*time.Time)
		if !ok {
			return nil, errors.Errorf("unable to convert %v to timestamp", data)
		}

		if inputTime == nil {
			return nil, errors.New("nil time pointer")
		}
		return timestamppb.New(*inputTime), nil
	}
}

// BsonIDToStringHook 将 bson.ObjectId 转换为 string
func BsonIDToStringHook() mapstructure.DecodeHookFunc {
	return func(f, t reflect.Type, data any) (any, error) {
		if f != reflect.TypeOf(bson.ObjectID{}) {
			return data, nil
		}

		objID, ok := data.(bson.ObjectID)
		if !ok {
			return nil, errors.Errorf("unable to convert %v to string", data)
		}

		if objID.IsZero() {
			return "", nil
		}

		return objID.Hex(), nil
	}
}
