#!/usr/bin/env bash
# =============================================================================
# Create Kafka topics required by EKAP services
# Run from within the kafka container or against a reachable broker
# =============================================================================

set -euo pipefail

BROKER="${KAFKA_BOOTSTRAP_SERVERS:-localhost:9092}"

create_topic() {
  local topic="$1"
  local partitions="${2:-3}"
  local replication="${3:-1}"

  echo "Creating topic: $topic (partitions=$partitions, replication=$replication)"
  kafka-topics --bootstrap-server "$BROKER" \
    --create \
    --if-not-exists \
    --topic "$topic" \
    --partitions "$partitions" \
    --replication-factor "$replication"
}

# Document lifecycle
create_topic "document.uploaded"   3 1
create_topic "document.processed"  3 1
create_topic "document.error"      1 1

# HR events
create_topic "hr.events"           3 1
create_topic "hr.namechange"       3 1

# Chat events
create_topic "chat.feedback"       1 1

echo ""
echo "All topics created. Current topic list:"
kafka-topics --bootstrap-server "$BROKER" --list
