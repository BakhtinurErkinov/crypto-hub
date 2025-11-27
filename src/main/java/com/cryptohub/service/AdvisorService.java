package com.cryptohub.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

@Service
public class AdvisorService {

    private final WebClient webClient;

    @Value("${openai.api.key}")
    private String apiKey;

    public AdvisorService() {
        this.webClient = WebClient.builder()
                .baseUrl("https://api.openai.com/v1/chat/completions")
                .build();
    }

    public String generateAnswer(String question) {

        String requestBody = """
                {
                  "model": "gpt-4o-mini",
                  "messages": [
                    {
                      "role": "system",
                      "content": "You are CryptoAdvisor AI — an expert in cryptocurrencies, trading, blockchain, DeFi, security, and tokenomics. Provide clear, accurate, useful explanations."
                    },
                    {
                      "role": "user",
                      "content": "%s"
                    }
                  ],
                  "temperature": 0.7
                }
                """.formatted(question);

        try {
            String response = webClient.post()
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            return extractAnswer(response);

        } catch (Exception e) {
            return "⚠️ Error getting AI response. Check your API key or internet connection.";
        }
    }

    private String extractAnswer(String json) {
        try {
            int start = json.indexOf("\"content\":\"") + 11;
            int end = json.indexOf("\"", start);
            return json.substring(start, end).replace("\\n", "\n");
        } catch (Exception e) {
            return "AI response parsing error.";
        }
    }
}
