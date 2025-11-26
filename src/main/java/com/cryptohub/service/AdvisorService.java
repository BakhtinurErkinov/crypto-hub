package com.cryptohub.service;

import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class AdvisorService {

    /**
     * Простая rule-based рекомендация портфеля.
     * Вход:
     *  - budgetUsd (double)
     *  - horizonMonths (int)
     *  - risk ("low","medium","high")
     *
     * Возвращает Map: { allocation: {coin: percent}, explanation: "...", suggestedAmounts: {coin: amount} }
     */
    public Map<String, Object> recommend(double budgetUsd, int horizonMonths, String risk) {
        // базовый набор монет для рекомендаций (можно расширить)
        String[] conservative = {"bitcoin", "ethereum", "usd-coin"};
        String[] balanced = {"bitcoin", "ethereum", "chainlink", "cardano"};
        String[] aggressive = {"bitcoin", "ethereum", "chainlink", "solana", "polygon", "cardano"};

        Map<String, Double> allocation = new LinkedHashMap<>();
        String explanation;

        switch (risk == null ? "medium" : risk.toLowerCase()) {
            case "low":
                // heavy BTC/ETH + stablecoin
                allocation.put("bitcoin", 0.6);
                allocation.put("ethereum", 0.25);
                allocation.put("usd-coin", 0.15);
                explanation = "Low risk: преимущественно BTC и ETH с резервом в стейблкоинах.";
                break;
            case "high":
                allocation.put("bitcoin", 0.35);
                allocation.put("ethereum", 0.25);
                allocation.put("solana", 0.15);
                allocation.put("chainlink", 0.15);
                allocation.put("polygon", 0.10);
                explanation = "High risk: диверсификация с более волатильными альткоинами для роста.";
                break;
            default:
                allocation.put("bitcoin", 0.5);
                allocation.put("ethereum", 0.3);
                allocation.put("chainlink", 0.1);
                allocation.put("cardano", 0.1);
                explanation = "Medium risk: сбалансированный портфель BTC/ETH + перспективные альты.";
                break;
        }

        Map<String, Double> suggestedAmounts = new LinkedHashMap<>();
        for (Map.Entry<String, Double> e : allocation.entrySet()) {
            suggestedAmounts.put(e.getKey(), round(budgetUsd * e.getValue(), 2));
        }

        return Map.of(
                "allocation", allocation,
                "suggestedAmounts", suggestedAmounts,
                "explanation", explanation,
                "budgetUsd", budgetUsd,
                "horizonMonths", horizonMonths,
                "risk", risk
        );
    }

    private static double round(double v, int places) {
        double scale = Math.pow(10, places);
        return Math.round(v * scale) / scale;
    }
}
