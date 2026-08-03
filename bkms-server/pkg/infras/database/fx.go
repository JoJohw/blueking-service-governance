package database

import (
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.uber.org/fx"
)

// PrivateFxModule exposes the shared database client only inside the enclosing fx.Module.
var PrivateFxModule = fx.Options(
	fx.Provide(
		func() *mongo.Client { return Client() },
		func() string { return Name() },
		fx.Private,
	),
)
