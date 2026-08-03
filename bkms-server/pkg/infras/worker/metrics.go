package worker

import (
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
)

const (
	statusOK  = "ok"
	statusErr = "err"
)

var (
	taskFinishTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Namespace: "bkms",
			Subsystem: "worker",
			Name:      "task_finish_total",
			Help:      "Total number of async task executions.",
		},
		[]string{"task_name", "status"},
	)

	taskReceivedTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Namespace: "bkms",
			Subsystem: "worker",
			Name:      "task_received_total",
			Help:      "Total number of async task received.",
		},
		[]string{"task_name"},
	)

	taskDuration = promauto.NewHistogramVec(
		prometheus.HistogramOpts{
			Namespace: "bkms",
			Subsystem: "worker",
			Name:      "task_duration_seconds",
			Help:      "Async task execution duration in seconds.",
			Buckets:   []float64{1, 5, 10, 30, 60, 120, 300, 600},
		},
		[]string{"task_name"},
	)

	taskEnqueueTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Namespace: "bkms",
			Subsystem: "worker",
			Name:      "task_enqueue_total",
			Help:      "Total number of async task enqueue operations.",
		},
		[]string{"task_name", "status"},
	)
)

func reportTaskExecution(name taskName, status string, started time.Time) {
	n := string(name)
	taskFinishTotal.WithLabelValues(n, status).Inc()
	taskDuration.WithLabelValues(n).Observe(time.Since(started).Seconds())
}

func reportTaskReceived(name taskName) {
	taskReceivedTotal.WithLabelValues(string(name)).Inc()
}

func reportTaskEnqueue(name taskName, status string) {
	taskEnqueueTotal.WithLabelValues(string(name), status).Inc()
}
