package com.ekap.hr.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaConfig {

    @Value("${ekap.kafka.topics.hr-events}")
    private String hrEventsTopic;

    @Value("${ekap.kafka.topics.hr-namechange}")
    private String hrNamechangeTopic;

    @Bean
    public NewTopic hrEventsTopic() {
        return TopicBuilder.name(hrEventsTopic)
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic hrNamechangeTopic() {
        return TopicBuilder.name(hrNamechangeTopic)
                .partitions(3)
                .replicas(1)
                .build();
    }
}
