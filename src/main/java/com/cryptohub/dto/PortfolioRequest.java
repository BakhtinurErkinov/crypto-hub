package com.cryptohub.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PortfolioRequest {
    private String coinId;
    private Double amount;
    private Double buyPrice;
}
