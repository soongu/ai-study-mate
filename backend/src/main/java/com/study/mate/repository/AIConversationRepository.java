package com.study.mate.repository;

import com.study.mate.entity.AIConversation;
import com.study.mate.entity.User;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AIConversationRepository extends JpaRepository<AIConversation, Long> {

    List<AIConversation> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);
}


