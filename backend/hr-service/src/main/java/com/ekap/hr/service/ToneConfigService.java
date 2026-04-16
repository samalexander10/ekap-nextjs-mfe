package com.ekap.hr.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import java.io.InputStream;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ToneConfigService {
    private static final String DEFAULT = "You are a professional and helpful HR assistant. Provide clear, accurate answers based on company policy.";
    private final ObjectMapper yaml = new ObjectMapper(new YAMLFactory());
    private final Map<String, Map<String, Object>> cache = new ConcurrentHashMap<>();

    public String getSystemPrompt(String subVertical) {
        return (String) load(subVertical).getOrDefault("systemPrompt", DEFAULT);
    }
    public String getSensitivityLevel(String subVertical) {
        return (String) load(subVertical).getOrDefault("sensitivityLevel", "NORMAL");
    }
    public boolean requiresEscalation(String subVertical) {
        return Boolean.TRUE.equals(load(subVertical).get("escalationRecommended"));
    }
    public boolean isManagerOnly(String subVertical) {
        return Boolean.TRUE.equals(load(subVertical).get("managerOnly"));
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> load(String subVertical) {
        return cache.computeIfAbsent(subVertical, k -> {
            try (InputStream is = new ClassPathResource("tone-configs/" + k + ".yml").getInputStream()) {
                return yaml.readValue(is, Map.class);
            } catch (Exception e) {
                return Map.of();
            }
        });
    }
}
