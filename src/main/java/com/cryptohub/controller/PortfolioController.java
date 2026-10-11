package com.cryptohub.controller;

import com.cryptohub.dto.PortfolioRequest;
import com.cryptohub.entity.PortfolioHolding;
import com.cryptohub.entity.User;
import com.cryptohub.repository.PortfolioHoldingRepository;
import com.cryptohub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/portfolio")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class PortfolioController {

    private final PortfolioHoldingRepository portfolioRepository;
    private final UserRepository userRepository;

    private User getUser(UserDetails userDetails) {
        return userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @GetMapping
    public ResponseEntity<List<PortfolioHolding>> getHoldings(@AuthenticationPrincipal UserDetails userDetails) {
        User user = getUser(userDetails);
        return ResponseEntity.ok(portfolioRepository.findByUserId(user.getId()));
    }

    @PostMapping
    public ResponseEntity<?> addHolding(@AuthenticationPrincipal UserDetails userDetails, @RequestBody PortfolioRequest request) {
        User user = getUser(userDetails);
        PortfolioHolding holding = PortfolioHolding.builder()
                .user(user)
                .coinId(request.getCoinId())
                .amount(request.getAmount())
                .buyPrice(request.getBuyPrice())
                .build();
        return ResponseEntity.ok(portfolioRepository.save(holding));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateHolding(@AuthenticationPrincipal UserDetails userDetails, @PathVariable Long id, @RequestBody PortfolioRequest request) {
        User user = getUser(userDetails);
        PortfolioHolding holding = portfolioRepository.findById(id).orElseThrow(() -> new RuntimeException("Holding not found"));
        if (!holding.getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(403).body("Not authorized");
        }
        holding.setAmount(request.getAmount());
        holding.setBuyPrice(request.getBuyPrice());
        return ResponseEntity.ok(portfolioRepository.save(holding));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> deleteHolding(@AuthenticationPrincipal UserDetails userDetails, @PathVariable Long id) {
        User user = getUser(userDetails);
        portfolioRepository.deleteByIdAndUserId(id, user.getId());
        return ResponseEntity.ok().build();
    }
}
