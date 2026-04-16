package com.ekap.hr.controller;

import com.ekap.hr.model.dto.QueryRequest;
import com.ekap.hr.model.dto.QueryResponse;
import com.ekap.hr.service.QueryService;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/hr")
@CrossOrigin(origins = "*")
public class QueryController {
    private final QueryService queryService;
    public QueryController(QueryService queryService) { this.queryService = queryService; }

    @PostMapping("/query")
    public Mono<QueryResponse> query(@RequestBody QueryRequest request) {
        return queryService.query(request);
    }
}
