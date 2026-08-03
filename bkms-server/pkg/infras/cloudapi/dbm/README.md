# DBM 申请 Redis 实例流程

## 创建流程

```
步骤1: CreateRedis        POST {apiUrl}/tickets/        提交创建工单, 获得 ticketID
  ↓
步骤2: GetTicketStatus    GET {apiUrl}/tickets/{id}/    轮询工单状态, 等待 SUCCEEDED
  ↓
步骤3: FindClusterByName  GET {apiUrl}/dbbase/filter_clusters/?bk_biz_id=xx&cluster_type=xx
                                                        获取集群域名和端口
```

### 步骤 1 — 提交创建工单

```
POST {apiUrl}/tickets/
Header: X-Bkapi-Authorization: {"bk_app_code":"xx","bk_app_secret":"xx","bk_username":"creator"}

Body (cluster 模式):
{
  "bk_biz_id": 1,
  "ticket_type": "REDIS_CLUSTER_APPLY",
  "details": {
    "bk_cloud_id": 0,
    "db_app_abbr": "myapp",
    "cluster_name": "my-redis",
    "cluster_type": "TwemproxyRedisInstance",
    "db_version": "Redis-6",
    "proxy_port": 50000,
    "proxy_pwd": "password123",
    "city_code": "default",
    "cluster_shard_num": 3,
    "ip_source": "resource_pool",
    "resource_spec": { "backend_group": {...}, "proxy": {...} }
  }
}

响应: {"code": 0, "data": {"id": 12345}}
```

### 步骤 2 — 轮询工单状态

```
GET {apiUrl}/tickets/12345/?is_reviewed=0

响应: {"code": 0, "data": {"id": 12345, "status": "RUNNING"}}
```

状态值：`PENDING` → `RUNNING` → `SUCCEEDED` / `FAILED` / `TERMINATED`

等待直到 `SUCCEEDED`，然后进入步骤 3。

### 步骤 3 — 查询集群信息

```
GET {apiUrl}/dbbase/filter_clusters/?bk_biz_id=1&cluster_type=TwemproxyRedisInstance&limit=200&offset=0

响应: {"code": 0, "data": [{"id": 1, "cluster_name": "my-redis", "master_domain": "my-redis.db", "cluster_access_port": 50000, ...}]}
```

匹配 `cluster_name` 获得访问域名和端口。

---

## 删除流程

删除需要两步：先禁用，再销毁。

```
步骤1: DisableRedis       POST {apiUrl}/tickets/        提交禁用工单
  ↓
步骤2: GetTicketStatus    轮询禁用工单至 SUCCEEDED
  ↓
步骤3: DeleteRedis        POST {apiUrl}/tickets/        提交销毁工单
  ↓
步骤4: GetTicketStatus    轮询销毁工单至 SUCCEEDED
```

### 工单类型

| 操作 | cluster 模式 | master_slave 模式 |
|------|--------------|-------------------|
| 创建 | `REDIS_CLUSTER_APPLY` | `REDIS_INS_APPLY` |
| 禁用 | `REDIS_PROXY_CLOSE` | `REDIS_CLOSE` |
| 销毁 | `REDIS_DESTROY` | `REDIS_INSTANCE_DESTROY` |

### 集群类型

| 部署模式 | cluster_type |
|----------|--------------|
| `cluster` | `TwemproxyRedisInstance` |
| `master_slave` | `RedisInstance` |
