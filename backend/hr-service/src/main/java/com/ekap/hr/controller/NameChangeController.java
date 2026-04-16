package com.ekap.hr.controller;

import com.ekap.hr.model.NameChangeRequest;
import com.ekap.hr.model.dto.NameChangeRequestDto;
import com.ekap.hr.model.dto.ReviewDecisionDto;
import com.ekap.hr.service.NameChangeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/hr/name-change")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class NameChangeController {

    private final NameChangeService nameChangeService;

    /**
     * Submit a new name change request.
     * POST /api/hr/name-change
     */
    @PostMapping
    public ResponseEntity<NameChangeRequest> submitRequest(
            @Valid @RequestBody NameChangeRequestDto dto) {
        NameChangeRequest request = nameChangeService.submitRequest(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(request);
    }

    /**
     * Get a specific name change request by ID.
     * GET /api/hr/name-change/{requestId}
     */
    @GetMapping("/{requestId}")
    public ResponseEntity<NameChangeRequest> getRequest(@PathVariable UUID requestId) {
        try {
            return ResponseEntity.ok(nameChangeService.getRequest(requestId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * List all requests for a given user.
     * GET /api/hr/name-change/user/{userId}
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<NameChangeRequest>> getUserRequests(@PathVariable UUID userId) {
        return ResponseEntity.ok(nameChangeService.getUserRequests(userId));
    }

    /**
     * List all pending requests (HR admin endpoint).
     * GET /api/hr/name-change/pending
     */
    @GetMapping("/pending")
    public ResponseEntity<List<NameChangeRequest>> getPendingRequests() {
        return ResponseEntity.ok(nameChangeService.getPendingRequests());
    }

    /**
     * Approve or reject a name change request (HR admin endpoint).
     * POST /api/hr/name-change/{requestId}/review
     */
    @PostMapping("/{requestId}/review")
    public ResponseEntity<?> reviewRequest(
            @PathVariable UUID requestId,
            @Valid @RequestBody ReviewDecisionDto decision) {
        try {
            NameChangeRequest updated = nameChangeService.reviewRequest(requestId, decision);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
