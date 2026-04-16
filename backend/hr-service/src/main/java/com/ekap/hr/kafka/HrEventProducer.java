package com.ekap.hr.kafka;

import com.ekap.hr.model.NameChangeRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class HrEventProducer {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Value("${ekap.kafka.topics.hr-events}")
    private String hrEventsTopic;

    @Value("${ekap.kafka.topics.hr-namechange}")
    private String hrNamechangeTopic;

    public void publishNameChangeSubmitted(NameChangeRequest request) {
        Map<String, Object> event = buildEvent("NAME_CHANGE_SUBMITTED", request);
        send(hrNamechangeTopic, request.getId().toString(), event);
        send(hrEventsTopic, request.getId().toString(), event);
    }

    public void publishNameChangeReviewed(NameChangeRequest request) {
        String eventType = request.getStatus() == NameChangeRequest.RequestStatus.APPROVED
                ? "NAME_CHANGE_APPROVED"
                : "NAME_CHANGE_REJECTED";

        Map<String, Object> event = buildEvent(eventType, request);
        send(hrNamechangeTopic, request.getId().toString(), event);
        send(hrEventsTopic, request.getId().toString(), event);
    }

    private Map<String, Object> buildEvent(String eventType, NameChangeRequest request) {
        Map<String, Object> event = new HashMap<>();
        event.put("eventType", eventType);
        event.put("requestId", request.getId().toString());
        event.put("userId", request.getUserId().toString());
        event.put("oldFullName", request.getOldFullName());
        event.put("newFullName", request.getNewFullName());
        event.put("status", request.getStatus().name());
        event.put("timestamp", Instant.now().toString());
        if (request.getReviewerId() != null) {
            event.put("reviewerId", request.getReviewerId().toString());
        }
        if (request.getReviewerNotes() != null) {
            event.put("reviewerNotes", request.getReviewerNotes());
        }
        return event;
    }

    private void send(String topic, String key, Object value) {
        kafkaTemplate.send(topic, key, value)
                .whenComplete((result, ex) -> {
                    if (ex != null) {
                        log.error("Failed to publish event to {}: {}", topic, ex.getMessage());
                    } else {
                        log.debug("Published event to {} partition={} offset={}",
                                topic,
                                result.getRecordMetadata().partition(),
                                result.getRecordMetadata().offset());
                    }
                });
    }
}
