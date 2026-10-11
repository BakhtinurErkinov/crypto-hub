package com.cryptohub.repository;

import com.cryptohub.entity.PortfolioHolding;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PortfolioHoldingRepository extends JpaRepository<PortfolioHolding, Long> {
    List<PortfolioHolding> findByUserId(Long userId);
    Optional<PortfolioHolding> findByUserIdAndCoinId(Long userId, String coinId);
    void deleteByIdAndUserId(Long id, Long userId);
}
