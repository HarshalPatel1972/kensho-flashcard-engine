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

	// Minimal CORS for development
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "online", "engine": "kensho-core"})
	})

	r.POST("/v1/generate", func(c *gin.Context) {
		var req GenerateRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
			return
		}

		log.Printf("[Kensho-Brain] Generating cards for %s (Pages: %v)", req.PDFURL, req.SelectedPages)

		// 1. Extract
		extraction, err := ExtractTextFromPages(req.PDFURL, req.SelectedPages)
		if err != nil {
			log.Printf("[ERROR] Extraction failed: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to extract PDF text"})
			return
		}

		// 2. Generate
		cards, provider, err := GenerateFlashcards(c.Request.Context(), extraction.Text, req.ProviderIndex)
		if err != nil {
			log.Printf("[ERROR] Generation failed: %v", err)
			c.JSON(http.StatusServiceUnavailable, gin.H{
				"error": "All AI providers busy",
				"nextIndex": req.ProviderIndex + 1,
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"cards": cards,
			"provider": provider,
			"providerIndex": req.ProviderIndex,
			"nextIndex": nil, // In Go we assume success or retry
		})
	})

	port := os.Getenv("PORT")
	if port == "" { port = "8080" }

	log.Printf("[Kensho-Brain] Running on :%s", port)
	r.Run(":" + port)
}
