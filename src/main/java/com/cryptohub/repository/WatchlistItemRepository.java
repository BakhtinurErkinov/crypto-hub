package com.cryptohub.repository;

import com.cryptohub.entity.WatchlistItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WatchlistItemRepository extends JpaRepository<WatchlistItem, Long> {
    List<WatchlistItem> findByUserId(Long userId);
    boolean existsByUserIdAndCoinId(Long userId, String coinId);
    void deleteByUserIdAndCoinId(Long userId, String coinId);
}
