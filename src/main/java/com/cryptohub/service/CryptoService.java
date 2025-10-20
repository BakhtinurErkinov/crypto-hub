package com.cryptohub.service;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
public class CryptoService {

    private final RestTemplate restTemplate = new RestTemplate();

    public Map<String, Object> getCryptoPrice(String symbol) {
        String url = "https://api.coingecko.com/api/v3/simple/price?ids=" + symbol + "&vs_currencies=usd";
        return restTemplate.getForObject(url, Map.class);
    }
}
