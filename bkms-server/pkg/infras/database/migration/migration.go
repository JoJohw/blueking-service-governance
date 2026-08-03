// Package migration runs the application's embedded MongoDB migrations.
package migration

import (
	"context"
	stderrors "errors"
	"log/slog"
	"net"
	"net/url"
	"strings"

	gomigrate "github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/mongodb"
	"github.com/golang-migrate/migrate/v4/source/iofs"
	"github.com/pkg/errors"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/db"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/common/config"
	log "github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/common/logging"
)

const migrationsPath = "migrations"

// Migration wraps golang-migrate with the operations exposed by bkms-server.
type Migration struct {
	ctx      context.Context
	database string
	migrate  *gomigrate.Migrate
}

// New initializes a migration runner from the embedded migration files and the
// MongoDB address in the application configuration.
func New(ctx context.Context, cfg config.MongoConfig) (*Migration, error) {
	sourceDriver, err := iofs.New(db.Migrations, migrationsPath)
	if err != nil {
		return nil, errors.Wrap(err, "initialize embedded migration source")
	}

	databaseDriver, err := (&mongodb.Mongo{}).Open(mongoCfgToMigrateURL(cfg))
	if err != nil {
		_ = sourceDriver.Close()
		return nil, errors.Wrap(err, "open MongoDB migration database")
	}

	runner, err := gomigrate.NewWithInstance("iofs", sourceDriver, "mongodb", databaseDriver)
	if err != nil {
		return nil, stderrors.Join(
			errors.Wrap(err, "initialize migration runner"),
			sourceDriver.Close(),
			databaseDriver.Close(),
		)
	}
	runner.Log = migrateLogger{ctx: ctx}

	return &Migration{ctx: ctx, database: cfg.Database, migrate: runner}, nil
}

// Close releases the migration source and MongoDB connection.
func (m *Migration) Close() error {
	sourceErr, databaseErr := m.migrate.Close()
	return stderrors.Join(sourceErr, databaseErr)
}

// Goto migrates the database to an exact version.
func (m *Migration) Goto(version uint) error {
	return m.run("goto", func() error { return m.migrate.Migrate(version) })
}

// Up applies all pending migrations, or at most limit migrations when limit is non-nil.
func (m *Migration) Up(limit *int) error {
	if limit == nil {
		return m.run("up", m.migrate.Up)
	}
	return m.run("up", func() error { return m.migrate.Steps(*limit) })
}

// Down applies all down migrations, or at most limit migrations when limit is non-nil.
func (m *Migration) Down(limit *int) error {
	if limit == nil {
		return m.run("down", m.migrate.Down)
	}
	return m.run("down", func() error { return m.migrate.Steps(-*limit) })
}

// Force sets the migration version without running migrations and clears dirty state.
func (m *Migration) Force(version int) error {
	return m.run("force", func() error { return m.migrate.Force(version) })
}

// UpAll opens a migration runner, applies every pending up migration, and closes it.
func UpAll(ctx context.Context, cfg config.MongoConfig) (err error) {
	runner, err := New(ctx, cfg)
	if err != nil {
		return err
	}
	defer func() {
		err = stderrors.Join(err, errors.Wrap(runner.Close(), "close migration runner"))
	}()

	return runner.Up(nil)
}

func (m *Migration) run(operation string, run func() error) error {
	attrs := []slog.Attr{
		slog.String("operation", operation),
		slog.String("database", m.database),
	}
	log.InfoAttrs(m.ctx, "running database migration", attrs...)

	err := run()
	if stderrors.Is(err, gomigrate.ErrNoChange) {
		log.InfoAttrs(m.ctx, "database migration has no changes", attrs...)
		return nil
	}
	if err != nil {
		return errors.Wrapf(err, "run database migration %s", operation)
	}

	log.InfoAttrs(m.ctx, "database migration completed", attrs...)
	return nil
}

// mongoCfgToMigrateURL includes the database in the path because the migrate MongoDB
// driver requires it. authSource remains admin to preserve the authentication
// behavior of config.Mongo.GetURI(), whose URI has no database path.
func mongoCfgToMigrateURL(cfg config.MongoConfig) string {
	mongoURL := url.URL{
		Scheme: "mongodb",
		Host:   net.JoinHostPort(cfg.Host, cfg.Port),
		Path:   "/" + cfg.Database,
	}
	if cfg.Username != "" {
		mongoURL.User = url.UserPassword(cfg.Username, cfg.Password)
	}
	query := mongoURL.Query()
	query.Set("authSource", "admin")
	mongoURL.RawQuery = query.Encode()
	return mongoURL.String()
}

type migrateLogger struct {
	ctx context.Context
}

func (l migrateLogger) Printf(format string, args ...any) {
	log.Debugf(l.ctx, strings.TrimSuffix(format, "\n"), args...)
}

func (migrateLogger) Verbose() bool {
	return true
}

var _ gomigrate.Logger = migrateLogger{}
