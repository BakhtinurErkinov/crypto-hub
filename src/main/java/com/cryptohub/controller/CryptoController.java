package com.cryptohub.controller;

import com.cryptohub.service.CryptoService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/crypto")
@CrossOrigin(origins = "*")
public class CryptoController {

    private final CryptoService service;

    public CryptoController(CryptoService service) {
        this.service = service;
    }

    @GetMapping("/price/{symbol}")
    public Map<String, Object> getCryptoPrice(@PathVariable String symbol) {
        return service.getCryptoPrice(symbol);
    }

    @GetMapping("/chart/{symbol}")
    public ResponseEntity<?> getCryptoChart(@PathVariable String symbol, @RequestParam(defaultValue = "7") int days) {
        return service.getCryptoChart(symbol, days);
    }
    
    @GetMapping("/markets")
    public ResponseEntity<?> getMarkets() {
        return service.getMarkets();
    }

    @GetMapping("/search")
    public ResponseEntity<?> searchCoins(@RequestParam String q) {
        return service.searchCoins(q);
    }

    @GetMapping("/convert")
    public ResponseEntity<?> convertCurrency(@RequestParam String from, @RequestParam String to, @RequestParam double amount) {
        return service.convertCurrency(from, to, amount);
    }
}
