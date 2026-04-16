package com.ekap.hr.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class NameChangeRequestDto {

    @NotNull(message = "userId is required")
    private UUID userId;

    @NotBlank(message = "oldFullName is required")
    private String oldFullName;

    @NotBlank(message = "newFullName is required")
    private String newFullName;

    private String reason;
}
