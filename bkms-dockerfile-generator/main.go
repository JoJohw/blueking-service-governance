package main

import (
	"fmt"
	"io"
	"os"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-dockerfile-generator/cmd"
)

func main() {
	if err := cmd.Execute(os.Args[1:], os.Environ(), os.Stdout); err != nil {
		printError(os.Stderr, err)
		os.Exit(1)
	}
}

func printError(out io.Writer, err error) {
	_, _ = fmt.Fprintf(out, "%+v\n", err)
}
