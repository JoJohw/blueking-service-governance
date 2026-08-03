package polaris

const (
	// 在 Pod 上打上如下注解时，集群内 Bcs-Polaris-Operator 会根据注解操作北极星实例
	// AnnotationKeyWeight 北极星权重注解, 设置时会对应修改北极星实例的权重
	AnnotationKeyWeight = "weight.tencent.bkbcs.polaris"
	// AnnotationKeyIsolate 北极星隔离注解，设置为 true 时会隔离北极星实例
	AnnotationKeyIsolate = "isolate.tencent.bkbcs.polaris"
)
