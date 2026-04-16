package com.ekap.hr.model.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
@Builder
public class QueryResponse {
    private String verticalId;
    private List<String> retrievedChunks;
    private String systemPrompt;
    private String sensitivityLevel;
    private boolean escalationRecommended;
    private List<String> sourceCitations;
    private List<Map<String, String>> actionSuggestions;
}
