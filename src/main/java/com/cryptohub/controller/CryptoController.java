package com.cryptohub.controller;

import com.cryptohub.service.CryptoService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/crypto")
@CrossOrigin(origins = "*") // разрешаем доступ с фронтенда
public class CryptoController {

    private final CryptoService service;

    public CryptoController(CryptoService service) {
        this.service = service;
    }

    // текущая цена
    @GetMapping("/price/{symbol}")
    public Map<String, Object> getCryptoPrice(@PathVariable String symbol) {
        return service.getCryptoPrice(symbol);
    }

    // данные для графика
    @GetMapping("/chart/{symbol}")
    public ResponseEntity<?> getCryptoChart(@PathVariable String symbol) {
        return service.getCryptoChart(symbol);
    }
}
