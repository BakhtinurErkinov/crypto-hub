package com.cryptohub.controller;

import com.cryptohub.service.CryptoService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/crypto")
@CrossOrigin(origins = "*") // разрешаем frontend доступ
public class CryptoController {

    private final CryptoService service;

    public CryptoController(CryptoService service) {
        this.service = service;
    }

    @GetMapping("/price/{symbol}")
    public Map<String, Object> getCryptoPrice(@PathVariable String symbol) {
        return service.getCryptoPrice(symbol);
    }
}
