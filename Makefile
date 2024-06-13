build:
	docker build . --target ganache -t ganache-rentality:latest
	docker compose up -d ganache
	docker build . --target contracts --network rentality-network -t contracts-rentality:latest --no-cache
	sudo rm -rf node_modules
	mkdir node_modules
	docker build . --target nextjs --network rentality-network -t nextjs-rentality:latest

up:
	docker compose up -d nextjs --remove-orphans

down:
	docker compose down -v
	
reload: down up
