package main

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"os"
	"regexp"
	"strings"

	"github.com/google/generative-ai-go/genai"
	"github.com/sashabaranov/go-openai"
	"google.golang.org/api/option"
)

type AIProvider interface {
	Name() string
	Generate(ctx context.Context, prompt string) (string, error)
}

// GroqProvider implements AIProvider using OpenAI-compatible SDK
type GroqProvider struct {
	client *openai.Client
	model  string
}

func (p *GroqProvider) Name() string { return "groq" }
func (p *GroqProvider) Generate(ctx context.Context, prompt string) (string, error) {
	resp, err := p.client.CreateChatCompletion(ctx, openai.ChatCompletionRequest{
		Model: p.model,
		Messages: []openai.ChatCompletionMessage{
			{Role: openai.ChatMessageRoleSystem, Content: "Return ONLY JSON arrays. No preamble."},
			{Role: openai.ChatMessageRoleUser, Content: prompt},
		},
		Temperature: 0.1,
	})
	if err != nil {
		return "", err
	}
	return resp.Choices[0].Message.Content, nil
}

// GeminiProvider implements AIProvider
type GeminiProvider struct {
	client *genai.Client
}

func (p *GeminiProvider) Name() string { return "gemini" }
func (p *GeminiProvider) Generate(ctx context.Context, prompt string) (string, error) {
	model := p.client.GenerativeModel("gemini-1.5-flash")
	resp, err := model.GenerateContent(ctx, genai.Text(prompt))
	if err != nil {
		return "", err
	}
	if len(resp.Candidates) == 0 {
		return "", errors.New("no candidates returned")
	}
	
	var result strings.Builder
	for _, part := range resp.Candidates[0].Content.Parts {
		if text, ok := part.(genai.Text); ok {
			result.WriteString(string(text))
		}
	}
	return result.String(), nil
}

// Card represents a flashcard
type Card struct {
	Front string `json:"front"`
	Back  string `json:"back"`
}

// RescueParser tries to find a JSON array in a messy string
func RescueParser(text string) ([]Card, error) {
	re := regexp.MustCompile(`(?s)\[\s*\{.*\}\s*\]`)
	match := re.FindString(text)
	if match == "" {
		// Try a more aggressive brace search if the array one fails
		firstIdx := strings.Index(text, "[")
		lastIdx := strings.LastIndex(text, "]")
		if firstIdx != -1 && lastIdx != -1 && lastIdx > firstIdx {
			match = text[firstIdx : lastIdx+1]
		}
	}

	if match == "" {
		return nil, errors.New("no JSON array found")
	}

	var cards []Card
	if err := json.Unmarshal([]byte(match), &cards); err != nil {
		return nil, err
	}
	return cards, nil
}

const CARD_GENERATION_PROMPT = `
You are a master educator creating high-quality flashcards from study material.

Rules:
- Cover key concepts, definitions, relationships, and important examples
- Front: a clear, specific question or prompt
- Back: a concise but complete answer (1-3 sentences max)
- Do NOT create trivial or obvious cards
- Write as a great teacher would, not a bot
- Focus on core takeaways from the provided text

IMPORTANT: Return ONLY a valid JSON array. No markdown code blocks. No preamble. No explanation.
If the text contains valid study material, you MUST return at least 3 cards. Do not return an empty array.

[{"front": "...", "back": "..."}, ...]

Text to process:
`

func GenerateFlashcards(ctx context.Context, text string, requestedIndex int) ([]Card, string, error) {
	prompt := CARD_GENERATION_PROMPT + text
	
	type providerEntry struct {
		name string
		call func() (string, error)
	}

	providers := []providerEntry{}

	// 1. Groq
	if key := os.Getenv("GROQ_API_KEY"); key != "" {
		config := openai.DefaultConfig(key)
		config.BaseURL = "https://api.groq.com/openai/v1"
		client := openai.NewClientWithConfig(config)
		p := &GroqProvider{client: client, model: "llama-3.3-70b-versatile"}
		providers = append(providers, providerEntry{name: "groq", call: func() (string, error) { return p.Generate(ctx, prompt) }})
	}

	// 2. DeepSeek (via OpenAI endpoint)
	if key := os.Getenv("DEEPSEEK_API_KEY"); key != "" {
		config := openai.DefaultConfig(key)
		config.BaseURL = "https://api.deepseek.com/v1"
		client := openai.NewClientWithConfig(config)
		p := &GroqProvider{client: client, model: "deepseek-chat"}
		providers = append(providers, providerEntry{name: "deepseek", call: func() (string, error) { return p.Generate(ctx, prompt) }})
	}

	// 3. Gemini
	if key := os.Getenv("GEMINI_API_KEY"); key != "" {
		client, err := genai.NewClient(ctx, option.WithAPIKey(key))
		if err == nil {
			p := &GeminiProvider{client: client}
			providers = append(providers, providerEntry{name: "gemini", call: func() (string, error) { return p.Generate(ctx, prompt) }})
		}
	}

	if len(providers) == 0 {
		return nil, "", errors.New("no AI providers configured")
	}

	start := requestedIndex
	if start >= len(providers) {
		start = 0
	}

	for i := start; i < len(providers); i++ {
		pe := providers[i]
		log.Printf("[AI] Trying provider: %s", pe.name)
		
		text, err := pe.call()
		if err != nil {
			log.Printf("[AI ERROR] %s failed: %v", pe.name, err)
			continue
		}

		cards, err := RescueParser(text)
		if err == nil && len(cards) > 0 {
			return cards, pe.name, nil
		}
		log.Printf("[AI ERROR] %s returned invalid JSON or empty result", pe.name)
	}

	return nil, "", errors.New("all providers failing")
}
