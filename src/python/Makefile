# Define the test files
TEST_FILES := upload_test_results.py test_utils.py test_github_utils.py

# Define the default target
.PHONY: test

python-install:
	pip3 install -r requirements.txt
	pip3 install -r dev-requirements.txt

test:
	pytest $(TEST_FILES)