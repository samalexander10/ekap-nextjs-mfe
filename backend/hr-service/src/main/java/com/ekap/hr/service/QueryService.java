package com.ekap.hr.service;

import com.ekap.hr.model.dto.QueryRequest;
import com.ekap.hr.model.dto.QueryResponse;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Service
public class QueryService {
    private final HrRagService hrRagService;
    private final ToneConfigService toneConfigService;

    public QueryService(HrRagService hrRagService, ToneConfigService toneConfigService) {
        this.hrRagService = hrRagService;
        this.toneConfigService = toneConfigService;
    }

    public Mono<QueryResponse> query(QueryRequest request) {
        return Mono.fromCallable(() -> {
            String subVertical = (request.getSubVerticals() == null || request.getSubVerticals().isEmpty())
                ? "hr.benefits" : request.getSubVerticals().get(0);

            List<String> chunks = hrRagService.retrieveRelevantChunks(
                request.getQuery(), request.getSubVerticals(), request.getUserRoles());

            String systemPrompt = toneConfigService.getSystemPrompt(subVertical);
            String sensitivity = toneConfigService.getSensitivityLevel(subVertical);
            boolean escalate = toneConfigService.requiresEscalation(subVertical);

            List<Map<String, String>> actions = Collections.emptyList();
            String q = request.getQuery().toLowerCase();
            if (q.contains("name change") || q.contains("married") || q.contains("legal name")) {
                actions = List.of(Map.of("mini_app_id", "hr.name-change", "label", "Start Name Change Request"));
            }

            return QueryResponse.builder()
                .verticalId("HR").retrievedChunks(chunks).systemPrompt(systemPrompt)
                .sensitivityLevel(sensitivity).escalationRecommended(escalate)
                .sourceCitations(List.of()).actionSuggestions(actions).build();
        }).subscribeOn(Schedulers.boundedElastic());
    }
}
