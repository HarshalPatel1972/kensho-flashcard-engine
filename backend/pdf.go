package main

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/ledongthuc/pdf"
)

// ExtractionResult holds the text and any metadata
type ExtractionResult struct {
	Text string
	Method string
}

func ExtractTextFromPages(url string, targetPages []int) (*ExtractionResult, error) {
	resp, err := http.Get(url)
	if err != nil {
		return nil, fmt.Errorf("failed to download PDF: %v", err)
	}
	defer resp.Body.Close()

	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read PDF body: %v", err)
	}

	readerAt := bytes.NewReader(data)
	r, err := pdf.NewReader(readerAt, int64(len(data)))
	if err != nil {
		return nil, fmt.Errorf("failed to parse PDF: %v", err)
	}

	var extractedText strings.Builder
	totalSelected := len(targetPages)

	for _, pageNum := range targetPages {
		p := r.Page(pageNum)
		content, err := p.GetPlainText(nil)
		if err != nil {
			continue
		}

		// Logic parity with JS: If multiple pages, take 1000 chars per page
		if totalSelected > 1 {
			limit := 1000
			if len(content) > limit {
				content = content[:limit]
			}
		}

		extractedText.WriteString(fmt.Sprintf("--- Page %d ---\n", pageNum))
		extractedText.WriteString(content)
		extractedText.WriteString("\n\n")
	}

	return &ExtractionResult{
		Text: extractedText.String(),
		Method: "go-native",
	}, nil
}
