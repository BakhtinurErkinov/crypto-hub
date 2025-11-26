package com.cryptohub.controller;

import com.cryptohub.service.AdvisorService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/advisor")
@CrossOrigin(origins = "*")
public class AdvisorController {

    private final AdvisorService advisorService;

    public AdvisorController(AdvisorService advisorService) {
        this.advisorService = advisorService;
    }

    // POST body: { "budgetUsd": 500, "horizonMonths": 6, "risk": "medium" }
    @PostMapping("/recommend")
    public Map<String, Object> recommend(@RequestBody Map<String, Object> body) {
        double budget = body.get("budgetUsd") == null ? 0.0 : ((Number) body.get("budgetUsd")).doubleValue();
        int horizon = body.get("horizonMonths") == null ? 6 : ((Number) body.get("horizonMonths")).intValue();
        String risk = body.get("risk") == null ? "medium" : body.get("risk").toString();

        return advisorService.recommend(budget, horizon, risk);
    }
}
