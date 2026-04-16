package com.ekap.hr.service;

import com.ekap.hr.kafka.HrEventProducer;
import com.ekap.hr.model.NameChangeRequest;
import com.ekap.hr.model.dto.NameChangeRequestDto;
import com.ekap.hr.model.dto.ReviewDecisionDto;
import com.ekap.hr.repository.NameChangeRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class NameChangeService {

    private final NameChangeRequestRepository repository;
    private final HrEventProducer eventProducer;

    @Transactional
    public NameChangeRequest submitRequest(NameChangeRequestDto dto) {
        NameChangeRequest request = NameChangeRequest.builder()
                .userId(dto.getUserId())
                .oldFullName(dto.getOldFullName())
                .newFullName(dto.getNewFullName())
                .reason(dto.getReason())
                .status(NameChangeRequest.RequestStatus.PENDING)
                .build();

        NameChangeRequest saved = repository.save(request);
        log.info("Name change request submitted: id={}, userId={}", saved.getId(), saved.getUserId());

        eventProducer.publishNameChangeSubmitted(saved);
        return saved;
    }

    @Transactional
    public NameChangeRequest reviewRequest(UUID requestId, ReviewDecisionDto decision) {
        NameChangeRequest request = repository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found: " + requestId));

        if (request.getStatus() != NameChangeRequest.RequestStatus.PENDING) {
            throw new IllegalStateException("Request is not in PENDING state: " + request.getStatus());
        }

        request.setStatus(decision.getApproved()
                ? NameChangeRequest.RequestStatus.APPROVED
                : NameChangeRequest.RequestStatus.REJECTED);
        request.setReviewerId(decision.getReviewerId());
        request.setReviewedAt(OffsetDateTime.now());
        request.setReviewerNotes(decision.getReviewerNotes());

        NameChangeRequest updated = repository.save(request);
        log.info("Name change request {} by reviewer {}: requestId={}",
                updated.getStatus(), updated.getReviewerId(), requestId);

        eventProducer.publishNameChangeReviewed(updated);
        return updated;
    }

    @Transactional(readOnly = true)
    public NameChangeRequest getRequest(UUID requestId) {
        return repository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found: " + requestId));
    }

    @Transactional(readOnly = true)
    public List<NameChangeRequest> getUserRequests(UUID userId) {
        return repository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Transactional(readOnly = true)
    public List<NameChangeRequest> getPendingRequests() {
        return repository.findByStatusOrderByCreatedAtAsc(NameChangeRequest.RequestStatus.PENDING);
    }
}
