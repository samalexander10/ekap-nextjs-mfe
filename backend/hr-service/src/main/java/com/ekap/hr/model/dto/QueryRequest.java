package com.ekap.hr.model.dto;

import lombok.Data;
import java.util.List;

@Data
public class QueryRequest {
    private String query;
    private List<String> subVerticals;
    private List<String> userRoles;
    private String userId;
}
