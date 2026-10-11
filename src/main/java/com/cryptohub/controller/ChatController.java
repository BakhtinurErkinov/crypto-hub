package com.cryptohub.controller;

import com.cryptohub.dto.ChatRequest;
import com.cryptohub.dto.ChatResponse;
import com.cryptohub.entity.ChatMessage;
import com.cryptohub.entity.User;
import com.cryptohub.repository.ChatMessageRepository;
import com.cryptohub.repository.UserRepository;
import com.cryptohub.service.AdvisorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ChatController {

    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final AdvisorService advisorService;

    private User getUser(UserDetails userDetails) {
        return userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @PostMapping("/ask")
    public ResponseEntity<ChatResponse> askQuestion(@AuthenticationPrincipal UserDetails userDetails, @RequestBody ChatRequest request) {
        User user = getUser(userDetails);
        
        // Save user message
        ChatMessage userMsg = ChatMessage.builder()
                .user(user)
                .role("user")
                .content(request.getQuestion())
                .build();
        chatMessageRepository.save(userMsg);
        
        // Get history context
        List<ChatMessage> history = chatMessageRepository.findByUserIdOrderByCreatedAtAsc(user.getId());
        
        // Generate answer
        String answerContent = advisorService.generateAnswerWithContext(request.getQuestion(), history);
        
        // Save assistant message
        ChatMessage assistantMsg = ChatMessage.builder()
                .user(user)
                .role("assistant")
                .content(answerContent)
                .build();
        chatMessageRepository.save(assistantMsg);
        
        // Return response
        List<ChatMessage> updatedHistory = chatMessageRepository.findByUserIdOrderByCreatedAtAsc(user.getId());
        return ResponseEntity.ok(new ChatResponse(answerContent, updatedHistory));
    }

    @GetMapping("/history")
    public ResponseEntity<List<ChatMessage>> getHistory(@AuthenticationPrincipal UserDetails userDetails) {
        User user = getUser(userDetails);
        return ResponseEntity.ok(chatMessageRepository.findByUserIdOrderByCreatedAtAsc(user.getId()));
    }

    @DeleteMapping("/history")
    @Transactional
    public ResponseEntity<?> clearHistory(@AuthenticationPrincipal UserDetails userDetails) {
        User user = getUser(userDetails);
        chatMessageRepository.deleteByUserId(user.getId());
        return ResponseEntity.ok().build();
    }
}
