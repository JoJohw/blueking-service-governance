---
applyTo: '**'
---

## Style convention for Go

- The max characters per line is 119

## Testing Guidelines

- The project uses Ginkgo for testing.
- Ensure the test file style follows Ginkgo conventions and best practices.  
- Use `make test` to run all project tests.  
- Use `./bin/ginkgo run {PACKAGE_PATH}` to run the specified test.  
- When a domain name is needed for testing, prefer "example.com"
