package main

import (
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

type GenerateRequest struct {
	PDFURL        string `json:"pdfUrl"`
	SelectedPages []int  `json:"selectedPages"`
	ProviderIndex int    `json:"providerIndex"`
}

func main() {
	godotenv.Load("../.env.local")

	r := gin.Default()

	// Production CORS Policy
	r.Use(func(c *gin.Context) {
		// In production, you can set an ALLOWED_ORIGIN env var to lock this down
		allowedOrigin := os.Getenv("ALLOWED_ORIGIN")
		if allowedOrigin == "" || allowedOrigin == "*" {
			c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		} else {
			c.Writer.Header().Set("Access-Control-Allow-Origin", allowedOrigin)
		}
		
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, origin, accept")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "online",
			"engine": "kensho-core",
			"release": "production-v2.0",
		})
	})

	r.POST("/v1/generate", func(c *gin.Context) {
		var req GenerateRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Malformed request. Please ensure you are sending valid JSON."})
			return
		}

		log.Printf("[PROD] Processing Request | PDF: %s | Pages: %v", req.PDFURL, req.SelectedPages)

		if req.PDFURL == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "pdfUrl is required"})
			return
		}

		// 1. Extract
		extraction, err := ExtractTextFromPages(req.PDFURL, req.SelectedPages)
		if err != nil {
			log.Printf("[CRITICAL] Extraction Error: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to extract content from the provided PDF."})
			return
		}

		// 2. Generate
		cards, provider, err := GenerateFlashcards(c.Request.Context(), extraction.Text, req.ProviderIndex)
		if err != nil {
			log.Printf("[CRITICAL] Generation Error: %v", err)
			c.JSON(http.StatusServiceUnavailable, gin.H{
				"error": "Our AI engines are currently at capacity. Please try again or switch systems.",
				"nextIndex": req.ProviderIndex + 1,
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"cards": cards,
			"provider": provider,
			"providerIndex": req.ProviderIndex,
		})
	})

	port := os.Getenv("PORT")
	if port == "" { port = "8080" }

	log.Printf("[Kensho-Brain] Production instance starting on port %s", port)
	r.Run(":" + port)
}
