package com.cryptohub.controller;

import com.cryptohub.service.GameService;
import com.cryptohub.service.GameService.Round;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/game")
@CrossOrigin(origins = "*")
public class GameController {

    private final GameService game;

    public GameController(GameService game) { this.game = game; }

    // Создать новый раунд для указанной валюты
    @GetMapping("/new")
    public ResponseEntity<?> newRound(@RequestParam String coin) {
        try {
            Round r = game.newRound(coin);
            // вернём ID и день (ценаDay видна пользователю, но цена следующего дня — нет)
            return ResponseEntity.ok(Map.of(
                    "roundId", r.id,
                    "coin", r.coin,
                    "dateMillis", r.dateMillis,
                    "priceDay", r.priceDay
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // Отправить ответ: { "roundId":"...", "username":"Bob", "guessUp":true }
    @PostMapping("/submit")
    public Map<String, Object> submit(@RequestBody Map<String, Object> body) {
        String roundId = (String) body.get("roundId");
        String username = body.getOrDefault("username", "Anonymous").toString();
        boolean guessUp = Boolean.parseBoolean(body.getOrDefault("guessUp", "false").toString());

        return game.submitAnswer(roundId, username, guessUp);
    }

    // Топ-лидеров
    @GetMapping("/leaderboard")
    public Map<String, Integer> leaderboard() {
        return game.getLeaderboard();
    }
}
