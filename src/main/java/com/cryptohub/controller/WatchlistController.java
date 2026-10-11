package com.cryptohub.controller;

import com.cryptohub.entity.User;
import com.cryptohub.entity.WatchlistItem;
import com.cryptohub.repository.UserRepository;
import com.cryptohub.repository.WatchlistItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/watchlist")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class WatchlistController {

    private final WatchlistItemRepository watchlistRepository;
    private final UserRepository userRepository;

    private User getUser(UserDetails userDetails) {
        return userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @GetMapping
    public ResponseEntity<List<WatchlistItem>> getWatchlist(@AuthenticationPrincipal UserDetails userDetails) {
        User user = getUser(userDetails);
        return ResponseEntity.ok(watchlistRepository.findByUserId(user.getId()));
    }

    @PostMapping("/{coinId}")
    public ResponseEntity<?> addWatchlist(@AuthenticationPrincipal UserDetails userDetails, @PathVariable String coinId) {
        User user = getUser(userDetails);
        if (watchlistRepository.existsByUserIdAndCoinId(user.getId(), coinId)) {
            return ResponseEntity.badRequest().body("Already in watchlist");
        }
        WatchlistItem item = WatchlistItem.builder()
                .user(user)
                .coinId(coinId)
                .build();
        return ResponseEntity.ok(watchlistRepository.save(item));
    }

    @DeleteMapping("/{coinId}")
    @Transactional
    public ResponseEntity<?> removeWatchlist(@AuthenticationPrincipal UserDetails userDetails, @PathVariable String coinId) {
        User user = getUser(userDetails);
        watchlistRepository.deleteByUserIdAndCoinId(user.getId(), coinId);
        return ResponseEntity.ok().build();
    }
}
