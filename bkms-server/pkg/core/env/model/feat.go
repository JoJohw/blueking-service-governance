package model

import (
	"context"

	"github.com/pkg/errors"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

const featureEnvCounterCollectionName = "feature_environment_counters"

// FeatureEnvCounter 用于为特性环境按应用分配递增序号。
type FeatureEnvCounter struct {
	AppID string `bson:"_id"`
	Seq   int64  `bson:"seq"`
}

// FeatureEnvCounterStore 提供特性环境序号分配能力。
type FeatureEnvCounterStore interface {
	// Next 为指定应用原子分配下一个特性环境序号。
	Next(ctx context.Context, appID string) (int64, error)

	// DeleteAll 删除所有特性环境计数器，并保留集合与索引。
	// Attention: only used in unit test
	DeleteAll(ctx context.Context) error
}

var _ FeatureEnvCounterStore = &FeatureEnvCounterStoreMongo{}

// FeatureEnvCounterStoreMongo 是 FeatureEnvCounterStore 的 MongoDB 实现。
type FeatureEnvCounterStoreMongo struct {
	collection *mongo.Collection
}

// NewFeatureEnvCounterStoreMongo 创建特性环境序号存储。
func NewFeatureEnvCounterStoreMongo(client *mongo.Client, dbName string) (FeatureEnvCounterStore, error) {
	coll := client.Database(dbName).Collection(featureEnvCounterCollectionName)
	return &FeatureEnvCounterStoreMongo{collection: coll}, nil
}

// Next 为指定应用原子分配下一个特性环境序号。
func (s *FeatureEnvCounterStoreMongo) Next(ctx context.Context, appID string) (int64, error) {
	filter := bson.M{"_id": appID}
	update := bson.M{"$inc": bson.M{"seq": 1}}
	opts := options.FindOneAndUpdate().
		SetUpsert(true).
		SetReturnDocument(options.After)

	var counter FeatureEnvCounter
	if err := s.collection.FindOneAndUpdate(ctx, filter, update, opts).Decode(&counter); err != nil {
		return 0, errors.Wrapf(err, "allocate feature environment index for app %s", appID)
	}

	return counter.Seq, nil
}

// DeleteAll 删除所有特性环境计数器，并保留集合与索引。
func (s *FeatureEnvCounterStoreMongo) DeleteAll(ctx context.Context) error {
	_, err := s.collection.DeleteMany(ctx, bson.M{})
	return err
}
