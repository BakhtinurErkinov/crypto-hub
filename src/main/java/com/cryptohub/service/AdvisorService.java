package com.cryptohub.service;

import com.cryptohub.entity.ChatMessage;
import com.theokanning.openai.service.OpenAiService;
import com.theokanning.openai.completion.chat.ChatCompletionRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class AdvisorService {

    @Value("${openai.api.key}")
    private String apiKey;

    public String generateAnswer(String question) {
        return generateAnswerWithContext(question, null);
    }

    public String generateAnswerWithContext(String question, List<ChatMessage> history) {

        try {
            OpenAiService service = new OpenAiService(apiKey);

            List<com.theokanning.openai.completion.chat.ChatMessage> messages = new ArrayList<>();
            messages.add(new com.theokanning.openai.completion.chat.ChatMessage("system",
                    "You are CryptoAdvisor AI — a professional cryptocurrency advisor expert in trading, blockchain technology, DeFi, NFTs, tokenomics, risk management, and market analysis. Provide clear, well-structured, and actionable advice. Use markdown formatting in responses."));
            
            if (history != null) {
                for (ChatMessage msg : history) {
                    messages.add(new com.theokanning.openai.completion.chat.ChatMessage(msg.getRole(), msg.getContent()));
                }
            }
            
            messages.add(new com.theokanning.openai.completion.chat.ChatMessage("user", question));

            ChatCompletionRequest request = ChatCompletionRequest.builder()
                    .model("gpt-3.5-turbo")
                    .messages(messages)
                    .temperature(0.7)
                    .maxTokens(500)
                    .build();

            var response = service.createChatCompletion(request);
            return response.getChoices().get(0).getMessage().getContent();
        } catch (Exception e) {
            e.printStackTrace();
            return "Error: " + e.getMessage();
        }
    }
}