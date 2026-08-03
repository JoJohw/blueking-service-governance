package parser

import "testing"

func TestParseEnvFileRecordsParsesQuotedDescriptionMetadata(t *testing.T) {
	records, err := ParseEnvFileRecords("# desc: \"line1\\nline2\"\nKEY=value\n")
	if err != nil {
		t.Fatalf("ParseEnvFileRecords returned error: %v", err)
	}
	if len(records) != 1 {
		t.Fatalf("expected 1 record, got %d", len(records))
	}
	if got, want := records[0].Description, "line1\nline2"; got != want {
		t.Fatalf("unexpected description: want %q, got %q", want, got)
	}
}
