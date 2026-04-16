package com.ekap.hr.repository;

import com.ekap.hr.model.NameChangeRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface NameChangeRequestRepository extends JpaRepository<NameChangeRequest, UUID> {

    List<NameChangeRequest> findByUserIdOrderByCreatedAtDesc(UUID userId);

    List<NameChangeRequest> findByStatusOrderByCreatedAtAsc(NameChangeRequest.RequestStatus status);
}
