HOST := daily.skm
RUNNER_LABEL := skm.daily.runner
RUNNER_PLIST := $(HOME)/Library/LaunchAgents/$(RUNNER_LABEL).plist
BREW_CADDYFILE := /opt/homebrew/etc/Caddyfile

.PHONY: help dev build daily briefing shows runner install-runner uninstall-runner runner-log setup hosts trust start stop restart status teardown

.DEFAULT_GOAL := help

help: ## List available commands
	@awk 'BEGIN {FS = ":.*## "} /^[a-zA-Z_-]+:.*## / {printf "  \033[36m%-10s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

dev: ## Run the Next.js dev server
	npm run dev

build: ## Build the static site
	npm run build

daily: ## Refresh the events, food and albums listings and rebuild (DAYS=30)
	node scripts/daily.mjs $(DAYS)
	$(MAKE) build

briefing: ## Run the news briefing and rebuild (DAYS=2)
	node scripts/briefing.mjs $(DAYS)
	$(MAKE) build

shows: ## Write show-directory.md into photo venue folders (DIR=folder holding the venues, FULL=1 rescans)
	cd "$(or $(DIR),.)" && python3 $(CURDIR)/scripts/showsin.py $(if $(FULL),--full)

runner: ## Run the local helper that lets the site start runs and save briefing votes
	node scripts/runner.mjs

install-runner: ## Keep the runner up with launchd, running briefing and daily once a day
	mkdir -p .runner
	sed -e 's|__NODE__|$(shell which node)|' -e 's|__ROOT__|$(CURDIR)|g' -e 's|__PATH__|$(PATH)|' \
		scripts/runner.plist > $(RUNNER_PLIST)
	-launchctl bootout gui/$$(id -u)/$(RUNNER_LABEL) 2>/dev/null
	launchctl bootstrap gui/$$(id -u) $(RUNNER_PLIST)

uninstall-runner: ## Stop the launchd runner and remove its plist
	-launchctl bootout gui/$$(id -u)/$(RUNNER_LABEL)
	rm -f $(RUNNER_PLIST)

runner-log: ## Follow the launchd runner's log
	tail -f .runner/runner.log

setup: build ## Build, install Caddy, add hosts entry, start and trust
	brew list caddy >/dev/null 2>&1 || brew install caddy
	ln -sf $(CURDIR)/Caddyfile $(BREW_CADDYFILE)
	$(MAKE) hosts start
	sleep 2
	$(MAKE) trust

hosts: ## Add daily.skm to /etc/hosts and flush DNS cache
	grep -q '$(HOST)' /etc/hosts || printf '\n# Local Next.js site\n127.0.0.1 $(HOST)\n::1 $(HOST)\n' | sudo tee -a /etc/hosts >/dev/null
	sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder

trust: ## Install Caddy's local CA into the system trust store
	caddy trust

start: ## Start Caddy
	brew services start caddy

stop: ## Stop Caddy
	brew services stop caddy

restart: ## Restart Caddy
	brew services restart caddy

status: ## Show Caddy status and the site's HTTP code
	brew services info caddy
	curl -sS -o /dev/null -w '%{http_code}\n' https://$(HOST)

teardown: stop ## Stop Caddy, remove Caddyfile link and hosts entry
	rm -f $(BREW_CADDYFILE)
	sudo sed -i '' '/$(HOST)/d;/# Local Next.js site/d' /etc/hosts
