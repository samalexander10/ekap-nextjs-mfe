package com.ekap.hr.service;

import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.ai.vectorstore.filter.FilterExpressionBuilder;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class HrRagService {
    private final VectorStore vectorStore;

    public HrRagService(VectorStore vectorStore) {
        this.vectorStore = vectorStore;
    }

    public List<String> retrieveRelevantChunks(String query, List<String> subVerticals, List<String> userRoles) {
        SearchRequest.Builder req = SearchRequest.builder().query(query).topK(5).similarityThreshold(0.6);
        if (subVerticals != null && !subVerticals.isEmpty()) {
            req.filterExpression(new FilterExpressionBuilder().in("subVertical", subVerticals.toArray()).build());
        }
        return vectorStore.similaritySearch(req.build()).stream()
            .filter(doc -> {
                Boolean mo = (Boolean) doc.getMetadata().get("managerOnly");
                return !Boolean.TRUE.equals(mo) || (userRoles != null && userRoles.contains("MANAGER"));
            })
            .map(doc -> doc.getContent())
            .toList();
    }
}
