# Define the test files
TEST_FILES := upload_test_results.py test_utils.py

# Define the default target
.PHONY: test
test:
	pytest $(TEST_FILES)
	