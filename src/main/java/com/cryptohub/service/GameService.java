package com.cryptohub.service;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Игровой сервис: формирует историческую «викторину» на основе CoinGecko market_chart.
 * - newRound(coin) возвращает roundId и информацию (date, openPrice)
 * - submitAnswer(roundId, guess) проверяет и начисляет очки
 */
@Service
public class GameService {

    private final RestTemplate rest = new RestTemplate();
    private final Map<String, Round> rounds = new ConcurrentHashMap<>();
    private final Map<String, Integer> leaderboard = new ConcurrentHashMap<>(); // username -> score

    public static class Round {
        public final String id;
        public final String coin;
        public final long dateMillis; // timestamp of day start
        public final double priceDay; // price on day
        public final double priceNextDay; // price next day
        public final boolean correctUp; // true if next day > day

        public Round(String id, String coin, long dateMillis, double priceDay, double priceNextDay) {
            this.id = id; this.coin = coin; this.dateMillis = dateMillis;
            this.priceDay = priceDay; this.priceNextDay = priceNextDay;
            this.correctUp = priceNextDay > priceDay;
        }
    }

    /**
     * Создаёт раунд: выбирает случайный день из последних 30 дней и сохраняет.
     */
    public Round newRound(String coin) {
        // взять market_chart за 31 день (one extra for next day)
        String url = "https://api.coingecko.com/api/v3/coins/" + coin + "/market_chart?vs_currency=usd&days=31";
        Map resp = rest.getForObject(url, Map.class);
        if (resp == null || resp.get("prices") == null) throw new RuntimeException("No price data");

        List<List<Object>> prices = (List<List<Object>>) resp.get("prices");
        // prices: [ [timestamp, price], ... ] – за ~31 дней, индекс 0 - старейшая
        // выбрать индекс i от 0 до size-2 (чтобы был следующий день)
        int maxIndex = Math.max(0, prices.size() - 2);
        int i = new Random().nextInt(maxIndex + 1);
        List<Object> day = prices.get(i);
        List<Object> nextDay = prices.get(i + 1);

        long ts = ((Number)day.get(0)).longValue();
        double priceDay = ((Number)day.get(1)).doubleValue();
        double priceNext = ((Number)nextDay.get(1)).doubleValue();

        String id = UUID.randomUUID().toString();
        Round r = new Round(id, coin, ts, priceDay, priceNext);
        rounds.put(id, r);
        return r;
    }

    /**
     * Проверка ответа. username - для лидера.
     * guessUp = true если пользователь предполагал рост.
     * Возвращает Map { correct: boolean, pointsAwarded: int, correctUp: boolean }
     */
    public Map<String, Object> submitAnswer(String roundId, String username, boolean guessUp) {
        Round r = rounds.get(roundId);
        if (r == null) return Map.of("error", "Round not found");

        boolean correct = (guessUp == r.correctUp);
        int points = correct ? 10 : 0;

        if (username != null && !username.isBlank() && correct) {
            leaderboard.merge(username, points, Integer::sum);
        }

        // удалим раунд, чтобы нельзя было 2 раза отвечать
        rounds.remove(roundId);

        return Map.of("correct", correct, "pointsAwarded", points, "correctUp", r.correctUp);
    }

    public Map<String, Integer> getLeaderboard() {
        // сортированный топ-10
        return leaderboard.entrySet().stream()
                .sorted(Map.Entry.<String,Integer>comparingByValue(Comparator.reverseOrder()))
                .limit(10)
                .collect(LinkedHashMap::new, (m,e) -> m.put(e.getKey(), e.getValue()), Map::putAll);
    }
}
