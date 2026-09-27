# If "Oi Tesla" Goes Viral: Scaling to 1,000,000 Passengers & 100,000 Drivers

## Executive Summary

This document specifies the technical roadmap and architectural blueprint required to scale the **Oi Tesla** multi-passenger pooling platform from a localized MVP to a high-throughput, fault-tolerant distributed system capable of handling **1M registered passengers, 100K active drivers, and up to 25,000 concurrent active trips** across Dhaka's traffic grid.

---

## 1. System Architecture Diagram

```text
                                  [ Edge Tier ]
                          Cloudflare WAF / DDoS Shield
                                       │
                      ┌────────────────┴────────────────┐
                      ▼                                 ▼
            [ AWS CloudFront CDN ]              [ AWS ALB / Ingress ]
            (Next.js Static Assets)             (mTLS / TLS Termination)
                                                        │
         ┌──────────────────────────────────────────────┼──────────────────────────────┐
         ▼                                              ▼                              ▼
[ Auth & User Pods ]                        [ Core Trip API Pods ]            [ WebSocket Edge Pods ]
(Stateless Node.js/Go)                      (Stateless Express / Nest)        (Socket.io / uWebSockets)
         │                                              │                              │
         ├─────────────┐                                │                              ▼
         ▼             ▼                                │                    [ Redis Cluster Pub/Sub ]
   [Redis Master]  [Postgres Read]                      ▼                    (Driver GPS Fanout & Sync)
    (Token Blacklist)  (Replica)             [ Apache Kafka Event Bus ]                │
                                             (Topic: ride-lifecycle-events)            │
                                                        │                              ▼
                                                        ▼                     [ Driver Ping Ingestion ]
                                            [ Matching Engine Workers ]       (50k pings/sec -> Redis H3)
                                            (Go / Rust Goroutines)
                                                        │
                                  ┌─────────────────┴─────────────────┐
                                  ▼                                   ▼
                        [ Redis Cache & Locks ]             [ Aurora PostgreSQL Cluster ]
                        (Distributed Redlock)               ├── Primary Writer (ACID Core)
                        (Pool State TTLs)                   ├── Read Replica 1 (Driver Views)
                                                            └── Read Replica 2 (Analytics/BI)
```

---

## 2. Real-Time Telemetry & Geospatial Processing (100k Drivers)

### The Bottleneck

100,000 drivers broadcasting GPS coordinates every 3 seconds produces ~33,333 write operations per second. Persisting raw telemetry directly into relational storage (e.g., PostgreSQL or MongoDB) causes extreme I/O disk saturation and connection pool exhaustion.

### The Scaling Strategy

**In-Memory Spatial Indexing via Uber H3 / Redis GEO:**
- Ingest driver pings directly into a high-memory Redis Cluster using `GEOADD` and Uber H3 discrete global grid indexes (Hexagonal resolution 8: ~460m edge length).
- Spatial queries (`GEORADIUSBYMEMBER` / `GEOSEARCH`) find matching Tesla drivers heading along the Banani–Mohakhali–Gulshan corridor in sub-millisecond compute time.

**Backpressure & Ephemeral Geolocation:**
- GPS pings are treated as transient state. Only the current location is retained in the cache with a 15-second TTL.
- Coordinate history for ride auditing, dispute resolution, and billing calculations is batched in memory and dumped asynchronously to S3/Parquet cold storage every 60 seconds.

---

## 3. Database Layer: Contention, Indexing & Read Scalability

### Read/Write Segregation

- **Primary Instance (Write-Only):** Handles seat transactions, trip status transitions, and wallet deductions.
- **Read Replicas (Auto-Scaled):** Route passenger search queries, history lookups, driver trip logs, and back-office metrics away from the transactional primary.

### Concurrency Contention: The "Nusrat & Shirin" Race Condition

When multiple passengers request the last available seat in Jashim's Tesla Model Y simultaneously, pure relational updates lead to either deadlocks or overbooking.

**Distributed Lock via Redis (Redlock):**
- When an accept/join operation triggers, acquire a distributed key: `lock:pool:<pool_id>`.
- Lock TTL: 1,500ms.

**Pessimistic Locking on Fallback:**

```sql
BEGIN;
SELECT current_capacity, max_capacity 
FROM ride_pools 
WHERE id = $poolId 
FOR UPDATE;

-- Verify capacity condition in code
-- Insert into pool_passengers
-- Update ride_pools SET current_capacity = current_capacity + $seats
COMMIT;
```

**Database Check Constraint:**

```sql
ALTER TABLE ride_pools 
ADD CONSTRAINT check_seat_overflow 
CHECK (current_capacity <= max_capacity);
```

### Targeted Index Strategy

```sql
CREATE INDEX CONCURRENTLY idx_requests_active 
ON ride_requests (passenger_id, status) 
WHERE status IN ('REQUESTED', 'MATCHED');

CREATE INDEX CONCURRENTLY idx_pools_driver_active 
ON ride_pools (driver_id, status) 
WHERE status NOT IN ('COMPLETED', 'CANCELLED');

CREATE INDEX CONCURRENTLY idx_pools_corridor 
ON ride_pools (pickup_zone, dropoff_zone, status);
```

---

## 4. Asynchronous Matching & Queue Decoupling

Under surge traffic (e.g., 5:30 PM rainfall in Kawran Bazar), synchronous HTTP request-matching threads degrade rapidly.

**Kafka-Backed Event Queue:**
- Passengers submit requests via `POST /api/requests`.
- The API issues an atomic write to DB status `REQUESTED`, publishes an event to `ride-requests-stream`, and immediately returns `202 Accepted` with a tracking `request_id`.

**Dedicated Matching Workers:**
- Autonomous worker nodes (written in Go for raw speed and minimal memory footprint) consume the stream.
- Workers run path-compatibility evaluations against currently active pools traversing the same spatial route vectors before emitting driver invitations via WebSockets.

---

## 5. Network, Rate Limiting & Resilience

| Layer | Implementation | Protection Target |
|---|---|---|
| Edge WAF | Cloudflare Enterprise / AWS WAF | Bot mitigation, Layer 7 DDoS, automated scraping. |
| API Rate Limiter | Sliding-window log via Redis (Upstash/Cluster) | 5 ride submissions/min per user; 1 GPS ping/3s per driver. |
| Idempotency | `Idempotency-Key: <UUID>` stored in Redis (10-minute TTL) | Network retries from flaky 4G never duplicate charges or bookings. |
| Circuit Breakers | Cockatiel / Resilience4j | Third-party integrations fail fast without holding pool connections open. |

---

## 6. Real-Time Communication Layer (WebSockets)

- **Horizontal WebSocket Fleet:** Dedicated Node.js WebSocket instances running behind an Application Load Balancer with sticky sessions enabled for the initial TLS handshake.
- **Redis Pub/Sub Adapter:** Decouples connection topology. A driver connected to Socket-Pod-3 publishing coordinate updates reaches a passenger connected to Socket-Pod-19 via Redis cluster channel `ride_channel:<pool_id>`.
- **Adaptive Sampling:** In poor network conditions, client ping intervals degrade automatically from 3 seconds to 6 seconds to prevent socket queue saturation.

---

## 7. Zero-Downtime Deployment & CI/CD Strategy

**Blue/Green Deployment:**
- Containerized microservices deployed to AWS ECS / Kubernetes.
- New versions spin up on the "Green" target group. Traffic migrates only after synthetic integration tests and health check `/healthz` endpoints succeed.

**Expand / Contract Database Migrations:**
- **Phase 1 (Expand):** Add new schema fields as nullable or with safe defaults.
- **Phase 2 (Deploy):** Roll out service versions reading the new fields.
- **Phase 3 (Contract):** Run asynchronous cleanup scripts to backfill legacy records, then apply strict `NOT NULL` constraints.

---

## 8. Observability & SRE Benchmarks

- **Distributed Tracing:** OpenTelemetry SDK injected into all HTTP and gRPC calls, aggregated via Jaeger/Honeycomb to trace transaction lifecycles end-to-end.
- **Metrics & Dashboards:** Prometheus collecting runtime metrics (Event Loop Lag, Active Sockets, DB Connection Utilization) displayed via Grafana.

**Core SLAs:**
- P95 API Response Latency: **< 80ms**
- P99 Driver GPS Propagation Delay: **< 450ms**
- Matching Decision Window: **< 2.5s**