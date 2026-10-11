package com.cryptohub.service;

import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class CryptoService {

    private final RestTemplate restTemplate;

    // простой кэш в памяти
    private final Map<String, CacheEntry> cache = new ConcurrentHashMap<>();

    public CryptoService() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5000);  // 5 seconds connect timeout
        factory.setReadTimeout(10000);    // 10 seconds read timeout
        this.restTemplate = new RestTemplate(factory);
        this.restTemplate.getInterceptors().add((request, body, execution) -> {
            request.getHeaders().set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
            request.getHeaders().set("Accept", "application/json");
            return execution.execute(request, body);
        });
    }

    /**
     * Получает текущие данные о криптовалюте с CoinGecko.
     * Данные кэшируются на 2 минуты.
     */
    public Map<String, Object> getCryptoPrice(String id) {
        long now = System.currentTimeMillis();
        CacheEntry cached = cache.get(id);

        // если данные есть и не старше 120 секунд — возвращаем их
        if (cached != null && now - cached.timestamp < 120_000) {
            return cached.data;
        }

        try {
            String url = "https://api.coingecko.com/api/v3/coins/" + id;
            Map<String, Object> data = restTemplate.getForObject(url, Map.class);

            // обновляем кэш
            cache.put(id, new CacheEntry(data, now));
            return data;

        } catch (HttpClientErrorException.TooManyRequests e) {
            // ошибка 429 — возвращаем кэшированные данные если есть
            if (cached != null) {
                return cached.data;
            }
            return Map.of(
                    "error", "Rate limit exceeded. Please wait a minute before retrying."
            );

        } catch (HttpClientErrorException.NotFound e) {
            // ошибка 404 — криптовалюта не найдена
            return Map.of(
                    "error", "Cryptocurrency not found."
            );

        } catch (Exception e) {
            // любая другая ошибка — возвращаем кэшированные данные если есть
            if (cached != null) {
                return cached.data;
            }
            return Map.of(
                    "error", "Failed to fetch data from CoinGecko API.",
                    "details", e.getMessage() != null ? e.getMessage() : "Unknown error"
            );
        }
    }

    /**
     * Получает данные для графика цен за последние 7 дней.
     * Тоже кэшируется на 2 минуты.
     */
    public ResponseEntity<?> getCryptoChart(String id, int days) {
        long now = System.currentTimeMillis();
        String cacheKey = id + "_chart_" + days;
        CacheEntry cached = cache.get(cacheKey);

        if (cached != null && now - cached.timestamp < 120_000) {
            return ResponseEntity.ok(cached.data);
        }

        try {
            String url = "https://api.coingecko.com/api/v3/coins/" + id + "/market_chart?vs_currency=usd&days=" + days;
            Map<String, Object> chartData = restTemplate.getForObject(url, Map.class);
            cache.put(cacheKey, new CacheEntry(chartData, now));
            return ResponseEntity.ok(chartData);

        } catch (HttpClientErrorException.TooManyRequests e) {
            if (cached != null) {
                return ResponseEntity.ok(cached.data);
            }
            return ResponseEntity.status(429).body(Map.of(
                    "error", "Rate limit exceeded. Please try again later."
            ));
        } catch (Exception e) {
            if (cached != null) {
                return ResponseEntity.ok(cached.data);
            }
            return ResponseEntity.status(500).body(Map.of(
                    "error", "Failed to load chart data.",
                    "details", e.getMessage() != null ? e.getMessage() : "Unknown error"
            ));
        }
    }

    public ResponseEntity<?> getMarkets() {
        long now = System.currentTimeMillis();
        String cacheKey = "markets_top50";
        CacheEntry cached = cache.get(cacheKey);

        if (cached != null && now - cached.timestamp < 120_000) {
            return ResponseEntity.ok(cached.listData);
        }

        try {
            String url = "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=24h";
            java.util.List<?> data = restTemplate.getForObject(url, java.util.List.class);
            if (data != null && !data.isEmpty()) {
                cache.put(cacheKey, new CacheEntry(data, now));
                return ResponseEntity.ok(data);
            }
            if (cached != null && cached.listData != null) {
                return ResponseEntity.ok(cached.listData);
            }
            return ResponseEntity.ok(getFallbackMarkets());
        } catch (Exception e) {
            // Return stale cached data if available
            if (cached != null && cached.listData != null) {
                return ResponseEntity.ok(cached.listData);
            }
            return ResponseEntity.ok(getFallbackMarkets());
        }
    }

    private java.util.List<Map<String, Object>> getFallbackMarkets() {
        return java.util.List.of(
            Map.of("id", "bitcoin", "symbol", "btc", "name", "Bitcoin", "current_price", 82750.0, "market_cap", 1660000000000L, "total_volume", 35000000000L, "price_change_percentage_24h", 1.45, "image", "https://assets.coingecko.com/coins/images/1/large/bitcoin.png"),
            Map.of("id", "ethereum", "symbol", "eth", "name", "Ethereum", "current_price", 2850.0, "market_cap", 345000000000L, "total_volume", 18000000000L, "price_change_percentage_24h", 2.15, "image", "https://assets.coingecko.com/coins/images/279/large/ethereum.png"),
            Map.of("id", "binancecoin", "symbol", "bnb", "name", "BNB", "current_price", 610.0, "market_cap", 92000000000L, "total_volume", 1200000000L, "price_change_percentage_24h", -0.35, "image", "https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png"),
            Map.of("id", "solana", "symbol", "sol", "name", "Solana", "current_price", 165.0, "market_cap", 76000000000L, "total_volume", 3800000000L, "price_change_percentage_24h", 4.80, "image", "https://assets.coingecko.com/coins/images/4128/large/solana.png"),
            Map.of("id", "ripple", "symbol", "xrp", "name", "XRP", "current_price", 0.58, "market_cap", 32000000000L, "total_volume", 950000000L, "price_change_percentage_24h", -0.80, "image", "https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png"),
            Map.of("id", "cardano", "symbol", "ada", "name", "Cardano", "current_price", 0.38, "market_cap", 13600000000L, "total_volume", 310000000L, "price_change_percentage_24h", 0.95, "image", "https://assets.coingecko.com/coins/images/975/large/cardano.png"),
            Map.of("id", "dogecoin", "symbol", "doge", "name", "Dogecoin", "current_price", 0.12, "market_cap", 17500000000L, "total_volume", 820000000L, "price_change_percentage_24h", 3.20, "image", "https://assets.coingecko.com/coins/images/5/large/dogecoin.png"),
            Map.of("id", "avalanche-2", "symbol", "avax", "name", "Avalanche", "current_price", 28.5, "market_cap", 11200000000L, "total_volume", 450000000L, "price_change_percentage_24h", -1.25, "image", "https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png")
        );
    }

    public ResponseEntity<?> searchCoins(String query) {
        long now = System.currentTimeMillis();
        String cacheKey = "search_" + query;
        CacheEntry cached = cache.get(cacheKey);

        if (cached != null && now - cached.timestamp < 120_000) {
            return ResponseEntity.ok(cached.data);
        }

        try {
            String url = "https://api.coingecko.com/api/v3/search?query=" + query;
            Map<String, Object> data = restTemplate.getForObject(url, Map.class);
            cache.put(cacheKey, new CacheEntry(data, now));
            return ResponseEntity.ok(data);
        } catch (Exception e) {
            if (cached != null && cached.data != null) {
                return ResponseEntity.ok(cached.data);
            }
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage() != null ? e.getMessage() : "Unknown error"));
        }
    }

    public ResponseEntity<?> convertCurrency(String from, String to, double amount) {
        try {
            String url = "https://api.coingecko.com/api/v3/simple/price?ids=" + from + "&vs_currencies=" + to;
            Map<String, Object> data = restTemplate.getForObject(url, Map.class);
            if (data != null && data.containsKey(from)) {
                Map<String, Object> rates = (Map<String, Object>) data.get(from);
                if (rates != null && rates.containsKey(to)) {
                    double rate = Double.parseDouble(rates.get(to).toString());
                    return ResponseEntity.ok(Map.of("result", rate * amount, "rate", rate));
                }
            }
            return ResponseEntity.badRequest().body(Map.of("error", "Conversion rate not found"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage() != null ? e.getMessage() : "Unknown error"));
        }
    }

    // Внутренний статический класс кэша (замена record)
    private static class CacheEntry {
        Map<String, Object> data;
        java.util.List<?> listData;
        final long timestamp;

        CacheEntry(Map<String, Object> data, long timestamp) {
            this.data = data;
            this.timestamp = timestamp;
        }

        CacheEntry(java.util.List<?> listData, long timestamp) {
            this.listData = listData;
            this.timestamp = timestamp;
        }
    }
}
