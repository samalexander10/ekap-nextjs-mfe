package com.ekap.hr.model.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class ReviewDecisionDto {

    @NotNull(message = "reviewerId is required")
    private UUID reviewerId;

    @NotNull(message = "approved is required")
    private Boolean approved;

    private String reviewerNotes;
}
