package com.cryptohub.service;

import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class CryptoService {

    private final RestTemplate restTemplate = new RestTemplate();

    // простой кэш в памяти
    private final Map<String, CacheEntry> cache = new ConcurrentHashMap<>();

    /**
     * Получает текущие данные о криптовалюте с CoinGecko.
     * Данные кэшируются на 1 минуту.
     */
    public Map<String, Object> getCryptoPrice(String id) {
        long now = System.currentTimeMillis();
        CacheEntry cached = cache.get(id);

        // если данные есть и не старше 60 секунд — возвращаем их
        if (cached != null && now - cached.timestamp < 60_000) {
            return cached.data;
        }

        try {
            String url = "https://api.coingecko.com/api/v3/coins/" + id;
            Map<String, Object> data = restTemplate.getForObject(url, Map.class);

            // обновляем кэш
            cache.put(id, new CacheEntry(data, now));
            return data;

        } catch (HttpClientErrorException.TooManyRequests e) {
            // ошибка 429 — превышен лимит запросов
            return Map.of(
                    "error", "Rate limit exceeded. Please wait a minute before retrying."
            );

        } catch (HttpClientErrorException.NotFound e) {
            // ошибка 404 — криптовалюта не найдена
            return Map.of(
                    "error", "Cryptocurrency not found."
            );

        } catch (Exception e) {
            // любая другая ошибка
            return Map.of(
                    "error", "Failed to fetch data from CoinGecko API.",
                    "details", e.getMessage()
            );
        }
    }

    /**
     * Получает данные для графика цен за последние 7 дней.
     * Тоже кэшируется на 1 минуту.
     */
    public ResponseEntity<?> getCryptoChart(String id) {
        long now = System.currentTimeMillis();
        String cacheKey = id + "_chart";
        CacheEntry cached = cache.get(cacheKey);

        if (cached != null && now - cached.timestamp < 60_000) {
            return ResponseEntity.ok(cached.data);
        }

        try {
            String url = "https://api.coingecko.com/api/v3/coins/" + id + "/market_chart?vs_currency=usd&days=7";
            Map<String, Object> chartData = restTemplate.getForObject(url, Map.class);
            cache.put(cacheKey, new CacheEntry(chartData, now));
            return ResponseEntity.ok(chartData);

        } catch (HttpClientErrorException.TooManyRequests e) {
            return ResponseEntity.status(429).body(Map.of(
                    "error", "Rate limit exceeded. Please try again later."
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                    "error", "Failed to load chart data.",
                    "details", e.getMessage()
            ));
        }
    }

    // Внутренний статический класс кэша (замена record)
    private static class CacheEntry {
        final Map<String, Object> data;
        final long timestamp;

        CacheEntry(Map<String, Object> data, long timestamp) {
            this.data = data;
            this.timestamp = timestamp;
        }
    }
}
